import crypto from "crypto";

export function generateOrderNumber() {
  // 40 bits of cryptographically secure randomness makes collisions impractical.
  return `MBC-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}
