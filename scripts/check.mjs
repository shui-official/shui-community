// Vérifications statiques (sans dépendance) : domaines autorisés, assets, absence de secrets.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const ALLOWED = ["shui-community.vercel.app", "raydium.io", "solscan.io", "v2.bubblemaps.io", "t.me", "x.com", "www.instagram.com", "fonts.googleapis.com", "fonts.gstatic.com", "www.w3.org", "api.mainnet-beta.solana.com"];
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = ["public/index.html", "public/explorer.html", "swap.html", "farm.html", ...walk("public/assets").filter((f) => /\.(js|css)$/.test(f)), ...walk("src")];
let errors = 0;
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) if (!ALLOWED.includes(m[1])) { console.error(`✗ ${f}: domaine non vérifié ${m[1]}`); errors++; }
  if (/(secretKey|privateKey|seedPhrase|mnemonic|SERVICE_ROLE)\s*[:=]/i.test(src)) { console.error("✗ motif de secret dans", f); errors++; }
  if (/Keypair\.(fromSecretKey|fromSeed|generate)/.test(src)) { console.error("✗ création de Keypair dans le code applicatif", f); errors++; }
}
for (const h of ["public/index.html", "public/explorer.html"]) for (const m of readFileSync(h, "utf8").matchAll(/(?:src|href)="(assets\/[^"]+)"/g)) if (!existsSync("public/" + m[1])) { console.error("✗ asset introuvable:", m[1]); errors++; }
console.log(errors ? `\n${errors} problème(s)` : "✓ check OK — domaines vérifiés, assets présents, aucun secret, aucune Keypair applicative");
process.exit(errors ? 1 : 0);
