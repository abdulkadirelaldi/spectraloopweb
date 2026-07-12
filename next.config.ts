import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Cloudflare R2 S3 API endpoint (fixed domain). The browser PUTs uploads
// directly to a presigned URL on this host (FileUpload → connect-src). Google
// Fonts (Geist) are self-hosted by Next at build time, so font-src stays 'self'.
const R2_UPLOAD_HOST = "https://*.r2.cloudflarestorage.com";

// Content-Security-Policy — config-based (no nonce) so pages stay statically
// renderable/CDN-cacheable. Next.js without nonces needs 'unsafe-inline' for its
// bootstrap inline script/style; React dev tooling needs 'unsafe-eval' in dev only.
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline'`,
  // Sponsor/member/team logos & photos are arbitrary https URLs (R2 public base,
  // external CDNs, placeholders). Images are inert, so `https:` is a safe widen.
  `img-src 'self' blob: data: https:`,
  `font-src 'self'`,
  // Same-origin APIs + the direct browser→R2 presigned PUT upload. Dev also needs
  // the ws:// HMR websocket.
  `connect-src 'self' ${R2_UPLOAD_HOST}${isDev ? " ws: wss:" : ""}`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Clickjacking: X-Frame-Options for legacy browsers, frame-ancestors (in CSP) for modern.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // Force HTTPS in production (ignored by browsers over plain HTTP, so dev is unaffected).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next.js does not infer a stray
  // parent lockfile (~/package-lock.json) as the root.
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        // Apply the security baseline to every route.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
