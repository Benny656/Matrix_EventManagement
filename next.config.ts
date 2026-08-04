import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const ContentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval' " : ""}https://apis.google.com https://www.gstatic.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.googleusercontent.com https://*.gstatic.com https://api.dicebear.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "media-src 'self' blob:",
  [
    "connect-src 'self'",
    "https://*.firebase.com",
    "https://*.firebaseapp.com",
    "https://*.googleapis.com",
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://firestore.googleapis.com",
    "https://apis.google.com",
    "https://www.googleapis.com",
    "https://www.gstatic.com",
    "https://accounts.google.com",
    isDev ? "ws://localhost:3000" : "",
    isDev ? "http://localhost:3000" : "",
  ]
    .filter(Boolean)
    .join(" "),
  "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://*.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), browsing-topics=()",
  },
  ...(isDev
    ? []
    : [
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["lucide-react"],
  serverExternalPackages: ["firebase-admin"],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "yourdomain.com",
        "www.yourdomain.com",
        // add any preview/staging domains, e.g.:
        // "*.vercel.app",
        ...(isDev ? ["localhost:3000"] : []),
      ],
    },
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