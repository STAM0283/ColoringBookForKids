import type { NextConfig } from "next";

const production = process.env.APP_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${production ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(production ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(production ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
];

// Les médias restent intégrables uniquement par le site lui-même. Cela permet
// à la liseuse PDF interne de fonctionner sans autoriser des sites tiers à
// encadrer le contenu.
const embeddedMediaHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy.replace("frame-ancestors 'none'", "frame-ancestors 'self'") },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  experimental: {
    // Les livres peuvent contenir une vidéo et plusieurs images dans le même
    // multipart/form-data. Cette limite concerne les Route Handlers, tandis
    // que bodySizeLimit concerne uniquement les Server Actions.
    proxyClientMaxBodySize: "320mb",
    serverActions: { bodySizeLimit: "55mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 78, 82, 90, 92],
    minimumCacheTTL: 86_400,
    deviceSizes: [360, 640, 768, 1024, 1280, 1536],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // Placée après la règle globale : Next.js applique la dernière valeur
      // lorsqu'une même clé correspond plusieurs fois à une URL.
      { source: "/media/:segments*", headers: embeddedMediaHeaders },
    ];
  },
};

export default nextConfig;
