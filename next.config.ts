import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Inclut les polices et la photo du couple dans le déploiement (Vercel)
  outputFileTracingIncludes: {
    "/api/**/*": ["./assets/**/*"],
  },
  serverExternalPackages: ["pg"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
