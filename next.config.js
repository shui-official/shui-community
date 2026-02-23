/** @type {import('next').NextConfig} */

function buildCsp() {
  const isDev = process.env.NODE_ENV !== "production";

  // Dev: Next HMR utilise souvent eval/WS -> on autorise en dev uniquement
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    "https://plugin.jup.ag",
  ];

  const connectSrc = [
    "'self'",
    "https:",
    "wss:",
    ...(isDev ? ["ws://localhost:3000"] : []),
  ];

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",

    // Anti-iframe phishing (ultra important)
    "frame-ancestors 'none'",

    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    `connect-src ${connectSrc.join(" ")}`,

    // Embeds autorisés
    "frame-src 'self' https://v2.bubblemaps.io https://plugin.jup.ag https://jup.ag",

    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ];

  return csp.join("; ");
}

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: buildCsp() },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },

          // En prod HTTPS: utile. En local HTTP: ignoré.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
