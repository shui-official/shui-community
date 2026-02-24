/* eslint-disable no-console */
const fs = require("fs");

function read(p) { return fs.readFileSync(p, "utf8"); }
function write(p, s) { fs.writeFileSync(p, s, "utf8"); }

function patchGitignore() {
  const p = ".gitignore";
  if (!fs.existsSync(p)) return console.log("skip .gitignore (not found)");
  let s = read(p);

  const add = [
    "",
    "# security hardening: avoid backup artifacts",
    "_i18n_lock_backup_*",
    "_i18n_lock2_backup_*",
    "_security_hardening_backup_*",
    "_backup_*",
    "backups/",
    ".i18n_audit/",
    "*.bak.*",
  ].join("\n");

  if (!s.includes("_security_hardening_backup_")) {
    s = s.trimEnd() + "\n" + add + "\n";
    write(p, s);
    console.log("OK: .gitignore patched");
  } else {
    console.log("OK: .gitignore already patched");
  }
}

function patchNextConfig() {
  const p = "next.config.js";
  if (!fs.existsSync(p)) throw new Error("next.config.js not found");
  let s = read(p);

  // Add extra security headers (safe, do not break wallets/embeds):
  // - X-DNS-Prefetch-Control
  // - X-Permitted-Cross-Domain-Policies
  // - X-XSS-Protection (set to 0, recommended)
  // - Cross-Origin-Resource-Policy (safe-ish: same-site)
  // We DO NOT add COEP/COOP because they can break wallet popups/embeds.
  const marker = "const securityHeaders = [";
  if (!s.includes(marker)) throw new Error("securityHeaders array not found in next.config.js");

  if (!s.includes("X-DNS-Prefetch-Control")) {
    s = s.replace(
      marker,
      marker +
        "\n  { key: \"X-DNS-Prefetch-Control\", value: \"off\" }," +
        "\n  { key: \"X-Permitted-Cross-Domain-Policies\", value: \"none\" }," +
        "\n  { key: \"X-XSS-Protection\", value: \"0\" }," +
        "\n  { key: \"Cross-Origin-Resource-Policy\", value: \"same-site\" },"
    );
    console.log("OK: next.config.js extra headers inserted");
  } else {
    console.log("OK: next.config.js extra headers already present");
  }

  // Add route-specific no-store for sensitive APIs (auth/rewards/quest)
  // We keep global headers, and add targeted cache-control overrides.
  const headersFn = "async headers() {";
  if (!s.includes(headersFn)) throw new Error("headers() not found in next.config.js");

  if (!s.includes("source: \"/api/auth/:path*\"")) {
    s = s.replace(
      /return\s+\[\s*\n\s*\/\/ ✅ Match explicite de la home[\s\S]*?\{\s*source:\s*"\/:path\*"\s*,\s*headers:\s*securityHeaders,\s*\}\s*\n\s*\];/m,
      (block) => {
        // Insert extra entries before the final universal matcher if it exists,
        // otherwise append before the closing.
        const insert = `
      // ✅ Sensitive API cache hardening (avoid any proxy/CDN caching)
      {
        source: "/api/auth/:path*",
        headers: [...securityHeaders, { key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/api/rewards/:path*",
        headers: [...securityHeaders, { key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/api/quest/:path*",
        headers: [...securityHeaders, { key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/api/telegram/:path*",
        headers: [...securityHeaders, { key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/api/x/:path*",
        headers: [...securityHeaders, { key: "Cache-Control", value: "no-store" }],
      },
`;
        // Try to place it before the universal matcher source "/:path*"
        const idx = block.lastIndexOf("{\n        source: \"/:path*\"");
        if (idx !== -1) {
          return block.slice(0, idx) + insert + block.slice(idx);
        }
        return block;
      }
    );
    console.log("OK: next.config.js added no-store for sensitive APIs");
  } else {
    console.log("OK: next.config.js no-store rules already present");
  }

  write(p, s);
}

function patchRewardsPanelUi() {
  const p = "src/components/RewardsPanel.tsx";
  if (!fs.existsSync(p)) {
    console.log("skip RewardsPanel (not found)");
    return;
  }
  let s = read(p);

  // Remove env var names from UI messages (opsec / credibility).
  s = s.replace(
    /Admin only — ton wallet n’est pas dans REWARDS_ADMIN_WALLETS\./g,
    "Admin only — access denied."
  );

  s = s.replace(
    /Admin only \(REWARDS_ADMIN_WALLETS\)/g,
    "Admin only"
  );

  // Also remove french-only label if exists, keep it neutral
  s = s.replace(/"Exporter la liste"/g, '"Export list"');

  write(p, s);
  console.log("OK: RewardsPanel UI hardened");
}

try {
  patchGitignore();
  patchNextConfig();
  patchRewardsPanelUi();
  console.log("DONE ✅ security-hardening-pack applied.");
} catch (e) {
  console.error("ERROR:", e.message);
  process.exit(1);
}
