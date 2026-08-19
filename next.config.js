/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // three / @react-three ship ESM that Next needs to transpile for the server
  // build (drei re-exports three internals). Without this the 3D phone can fail
  // the production build even though it runs fine in dev.
  transpilePackages: ["three"],
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      ],
    }];
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};
module.exports = nextConfig;
