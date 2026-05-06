import type { NextConfig } from "next";

/**
 * Estrae l'hostname da NEXT_PUBLIC_SUPABASE_URL per popolare CSP e remotePatterns.
 * Fallback su placeholder valido se la env var non è settata (es. build CI senza secrets).
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
let supabaseHost = "placeholder.supabase.co";
try {
  supabaseHost = new URL(supabaseUrl).hostname;
} catch {
  // fallback safe
}

const isDev = process.env.NODE_ENV !== "production";

/**
 * CSP strict per produzione. In dev rilassato per HMR / Turbopack (require unsafe-eval).
 * Nonce-based CSP è preferibile ma richiede integrazione middleware più profonda;
 * verrà introdotta nel batch F (sicurezza pre-launch).
 */
const cspDirectives = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://${supabaseHost} https://lh3.googleusercontent.com`,
  `font-src 'self' data:`,
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
  `frame-ancestors 'none'`,
  `form-action 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `worker-src 'self' blob:`,
  `manifest-src 'self'`,
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspDirectives,
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self)",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
