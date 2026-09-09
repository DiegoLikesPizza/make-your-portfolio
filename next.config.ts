import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required by the Dockerfile's runtime stage.
  output: "standalone",

  // Dev only: Next blocks cross-origin requests to its HMR endpoints unless the
  // origin is listed, which breaks hot reload when testing from another device
  // on the LAN (a phone). Private ranges only — this never applies in a build.
  allowedDevOrigins: ["192.168.178.69", "192.168.178.*", "10.*", "172.16.*"],
};

export default nextConfig;
