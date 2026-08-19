"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows, RoundedBox } from "@react-three/drei";
import { type MotionValue } from "framer-motion";
import * as THREE from "three";
import type { PhoneSkin } from "./DevicePhone";

/**
 * Phone3DCanvas — the heavy WebGL half of Phone3D, split into its own module so
 * it can be loaded with `next/dynamic({ ssr: false })`. Keeping three / fiber /
 * drei out of the main bundle means the home route stays light and interactive;
 * this chunk streams in on the client and upgrades the CSS phone to real 3D.
 *
 * IMPORTANT: this is a self-authored, license-clean PROCEDURAL representation of
 * the iPhone 17 Pro Max design language (proportions, camera layout, materials) —
 * not Apple's official CAD/3D model.
 */

/* ------------------------------------------------------------------ *
 * Per-skin case material + ambient tint. Orange is the hero case; the
 * three worlds get their own physically-plausible finish.
 * ------------------------------------------------------------------ */
type SkinDef = {
  case: { color: string; roughness: number; clearcoat: number; sheen: number; sheenColor: string };
  glowColor: string;
};
const SKINS: Record<PhoneSkin, SkinDef> = {
  cover: { case: { color: "#f4691b", roughness: 0.52, clearcoat: 0.45, sheen: 1, sheenColor: "#ffb877" }, glowColor: "#f97316" },
  art: { case: { color: "#8ea2d8", roughness: 0.35, clearcoat: 0.8, sheen: 0.6, sheenColor: "#e7ecff" }, glowColor: "#60a5fa" },
  gaming: { case: { color: "#12305a", roughness: 0.3, clearcoat: 0.9, sheen: 0.4, sheenColor: "#38bdf8" }, glowColor: "#38bdf8" },
  sports: { case: { color: "#0f5138", roughness: 0.44, clearcoat: 0.5, sheen: 0.5, sheenColor: "#a3e635" }, glowColor: "#10b981" },
};

/* Phone dimensions (scene units). Pro Max proportions: tall, thin, big radius. */
const BODY = { w: 1.42, h: 2.98, d: 0.2, r: 0.24 };
const CAM = { size: 0.82, r: 0.2, x: -BODY.w / 2 + 0.56, y: BODY.h / 2 - 0.66 }; // top-left plateau

/* Rounded-rectangle Path (used for the case outline + its camera cutout). */
function roundedRect(w: number, h: number, r: number): THREE.Path {
  const p = new THREE.Path();
  const x = -w / 2, y = -h / 2;
  p.moveTo(x + r, y);
  p.lineTo(x + w - r, y);
  p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + h - r);
  p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  p.lineTo(x + r, y + h);
  p.quadraticCurveTo(x, y + h, x, y + h - r);
  p.lineTo(x, y + r);
  p.quadraticCurveTo(x, y, x + r, y);
  return p;
}

/* ------------------------------------------------------------------ *
 * One realistic lens, authored in a cylinder's natural Y-up frame and
 * then rotated so local +Y points at the viewer (world +Z) — i.e. the
 * lens actually FACES OUT of the phone back. Brushed-metal bezel + bright
 * chrome ring + deep recessed barrel + domed coated glass + a specular
 * catch-light that sells the glass under the studio softboxes.
 * ------------------------------------------------------------------ */
function Lens({ position, r = 0.16 }: { position: [number, number, number]; r?: number }) {
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      {/* raised brushed-titanium bezel */}
      <mesh castShadow>
        <cylinderGeometry args={[r, r * 1.05, 0.15, 48]} />
        <meshStandardMaterial color="#7f8797" metalness={1} roughness={0.24} envMapIntensity={1.4} />
      </mesh>
      {/* bright chrome inner ring — catches a hard specular streak */}
      <mesh position={[0, 0.08, 0]}>
        <torusGeometry args={[r * 0.8, r * 0.12, 24, 64]} />
        <meshStandardMaterial color="#d5dbe6" metalness={1} roughness={0.12} envMapIntensity={1.8} />
      </mesh>
      {/* deep recessed black barrel */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[r * 0.64, r * 0.72, 0.18, 48]} />
        <meshStandardMaterial color="#04050a" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* domed coated glass — strong clearcoat + cool tint + env reflections */}
      <mesh position={[0, 0.1, 0]} scale={[1, 0.55, 1]}>
        <sphereGeometry args={[r * 0.62, 48, 48]} />
        <meshPhysicalMaterial
          color="#060b18"
          metalness={0.2}
          roughness={0.04}
          clearcoat={1}
          clearcoatRoughness={0.03}
          emissive="#1d4ed8"
          emissiveIntensity={0.16}
          envMapIntensity={1.8}
        />
      </mesh>
      {/* specular catch-light (upper-left) — reads instantly as real glass */}
      <mesh position={[-r * 0.3, 0.16, -r * 0.3]}>
        <sphereGeometry args={[r * 0.14, 16, 16]} />
        <meshBasicMaterial color="#e6efff" />
      </mesh>
    </group>
  );
}

type ModelProps = {
  skin: PhoneSkin;
  idle?: boolean;
  separation?: MotionValue<number>;
  spin?: MotionValue<number>;
  baseYaw: number;
  reduce: boolean;
};

/* ------------------------------------------------------------------ *
 * The full device: body + camera module (stay together) and the case
 * (separates). Everything animates from clock + scroll MotionValues.
 * ------------------------------------------------------------------ */
function PhoneModel({ skin, idle, separation, spin, baseYaw, reduce }: ModelProps) {
  const root = useRef<THREE.Group>(null);
  const caseGroup = useRef<THREE.Group>(null);
  const s = SKINS[skin];

  // Case shell: extruded rounded-rect with a REAL rounded-rect camera cutout.
  const caseGeo = useMemo(() => {
    const shape = new THREE.Shape(roundedRect(BODY.w + 0.1, BODY.h + 0.1, BODY.r + 0.03).getPoints(64));
    const hole = new THREE.Path();
    const hw = CAM.size + 0.12, hh = CAM.size + 0.12;
    const hx = CAM.x, hy = CAM.y;
    // rounded-rect hole, positioned over the camera plateau
    const rr = CAM.r + 0.05;
    hole.moveTo(hx - hw / 2 + rr, hy - hh / 2);
    hole.lineTo(hx + hw / 2 - rr, hy - hh / 2);
    hole.quadraticCurveTo(hx + hw / 2, hy - hh / 2, hx + hw / 2, hy - hh / 2 + rr);
    hole.lineTo(hx + hw / 2, hy + hh / 2 - rr);
    hole.quadraticCurveTo(hx + hw / 2, hy + hh / 2, hx + hw / 2 - rr, hy + hh / 2);
    hole.lineTo(hx - hw / 2 + rr, hy + hh / 2);
    hole.quadraticCurveTo(hx - hw / 2, hy + hh / 2, hx - hw / 2, hy + hh / 2 - rr);
    hole.lineTo(hx - hw / 2, hy - hh / 2 + rr);
    hole.quadraticCurveTo(hx - hw / 2, hy - hh / 2, hx - hw / 2 + rr, hy - hh / 2);
    shape.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 4,
      curveSegments: 24,
    });
    geo.center();
    return geo;
  }, []);

  useEffect(() => () => caseGeo.dispose(), [caseGeo]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const sep = separation ? Math.min(1, Math.max(0, separation.get())) : 0;
    const yaw = (spin ? spin.get() : 0) + baseYaw + (idle && !reduce ? Math.sin(t * 0.3) * 0.16 : 0);

    if (root.current) {
      root.current.rotation.y = yaw;
      root.current.rotation.x = (idle && !reduce ? Math.sin(t * 0.24) * 0.05 : 0) + sep * 0.12;
      root.current.position.y = idle && !reduce ? Math.sin(t * 0.5) * 0.06 : 0;
    }
    if (caseGroup.current) {
      // Case lifts toward the viewer (+z = real depth) and floats up, tilting so
      // its inner side walls and the camera-cutout rim read as a genuine, thick
      // physical shell peeling off — never a flat sticker that just fades.
      caseGroup.current.position.z = sep * 1.2;
      caseGroup.current.position.y = sep * 0.52;
      caseGroup.current.position.x = sep * 0.3;
      caseGroup.current.rotation.x = sep * 0.42;
      caseGroup.current.rotation.y = sep * 0.5;
      caseGroup.current.rotation.z = sep * -0.2;
    }
  });

  return (
    <group ref={root} rotation={[0, baseYaw, 0]}>
      {/* ---- Body that STAYS: titanium frame + glass back + camera module ---- */}
      <group>
        {/* Titanium frame */}
        <RoundedBox args={[BODY.w, BODY.h, BODY.d]} radius={BODY.r} smoothness={6} castShadow receiveShadow>
          <meshStandardMaterial color="#9099a6" metalness={1} roughness={0.34} />
        </RoundedBox>
        {/* Dark glass back panel (slightly proud of the frame) */}
        <RoundedBox args={[BODY.w - 0.1, BODY.h - 0.1, BODY.d + 0.03]} radius={BODY.r - 0.05} smoothness={5}>
          <meshPhysicalMaterial color="#12151d" metalness={0.35} roughness={0.28} clearcoat={1} clearcoatRoughness={0.14} />
        </RoundedBox>
        {/* Front screen face (mostly hidden — back view) */}
        <mesh position={[0, 0, -BODY.d / 2 - 0.015]}>
          <planeGeometry args={[BODY.w - 0.14, BODY.h - 0.14]} />
          <meshStandardMaterial color="#02030a" metalness={0.2} roughness={0.2} />
        </mesh>
        {/* Etched centred mark on the glass */}
        <mesh position={[0, 0.1, BODY.d / 2 + 0.016]}>
          <ringGeometry args={[0.1, 0.14, 40]} />
          <meshStandardMaterial color="#2a2f3d" metalness={0.6} roughness={0.5} transparent opacity={0.5} />
        </mesh>

        {/* Camera plateau (raised) */}
        <group position={[CAM.x, CAM.y, 0]}>
          <RoundedBox args={[CAM.size, CAM.size, BODY.d + 0.18]} radius={CAM.r} smoothness={5} castShadow receiveShadow>
            <meshStandardMaterial color="#15181f" metalness={0.8} roughness={0.32} envMapIntensity={1.2} />
          </RoundedBox>
          {/* Three lenses at three corners of the square bump (Pro layout) +
              LiDAR & flash filling the fourth corner — all face toward +z. */}
          <group position={[0, 0, (BODY.d + 0.18) / 2]}>
            <Lens position={[-0.19, 0.19, 0]} />
            <Lens position={[-0.19, -0.19, 0]} />
            <Lens position={[0.19, 0.19, 0]} />
            {/* LiDAR scanner (bottom-right) */}
            <mesh position={[0.19, -0.19, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.058, 0.058, 0.1, 32]} />
              <meshStandardMaterial color="#0b0d13" metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Dual-tone flash (bottom-centre) */}
            <mesh position={[0.0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.062, 0.062, 0.1, 32]} />
              <meshStandardMaterial color="#ffe9c6" emissive="#ffcf99" emissiveIntensity={0.32} roughness={0.4} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ---- The CASE that SEPARATES: extruded orange shell w/ real cutout ---- */}
      <group ref={caseGroup}>
        <mesh geometry={caseGeo} position={[0, 0, BODY.d / 2 - 0.02]} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={s.case.color}
            roughness={s.case.roughness}
            clearcoat={s.case.clearcoat}
            clearcoatRoughness={0.5}
            sheen={s.case.sheen}
            sheenColor={new THREE.Color(s.case.sheenColor)}
            sheenRoughness={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ *
 * Studio lighting + a procedural (asset-free) reflection environment.
 * ------------------------------------------------------------------ */
function Scene(props: ModelProps) {
  const s = SKINS[props.skin];
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 4]} intensity={2.1} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 2, 2]} intensity={0.7} color="#9ec5ff" />
      <pointLight position={[0, -3, 3]} intensity={0.5} color={s.glowColor} />

      <PhoneModel {...props} />

      <ContactShadows position={[0, -BODY.h / 2 - 0.15, 0]} opacity={0.5} scale={5} blur={2.6} far={3} resolution={512} color="#03040a" />

      {/* In-code studio softboxes → real specular streaks on titanium & glass. */}
      <Environment resolution={256} frames={1} background={false}>
        <Lightformer form="rect" intensity={3} position={[0, 2.5, 3]} scale={[6, 3, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.4} position={[-3, 1, 2]} scale={[3, 4, 1]} color="#bcd4ff" />
        <Lightformer form="rect" intensity={1.2} position={[3, -1, 1]} rotation={[0, Math.PI, 0]} scale={[3, 3, 1]} color={s.glowColor} />
        <Lightformer form="ring" intensity={1} position={[0, 0, -4]} scale={4} color="#4b5675" />
      </Environment>
    </>
  );
}

export type Phone3DCanvasProps = {
  skin: PhoneSkin;
  idle?: boolean;
  separation?: MotionValue<number>;
  spin?: MotionValue<number>;
  baseYaw?: number;
  reduce: boolean;
  /** Frameloop gate — paused while the phone is scrolled off-screen (perf). */
  inView: boolean;
};

export default function Phone3DCanvas({ skin, idle, separation, spin, baseYaw = -0.42, reduce, inView }: Phone3DCanvasProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0, 8], fov: 26 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={inView ? "always" : "never"}
      style={{ background: "transparent" }}
    >
      <Scene skin={skin} idle={idle} separation={separation} spin={spin} baseYaw={baseYaw} reduce={reduce} />
    </Canvas>
  );
}
