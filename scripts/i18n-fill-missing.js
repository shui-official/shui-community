/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const BASE_LOCALE = "en";
const TARGETS = ["fr", "es", "it", "de", "ru", "zh"];
const FILE = "common.json";

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function deepMergeFillMissing(target, base) {
  // target is mutated
  for (const key of Object.keys(base)) {
    const b = base[key];
    const t = target[key];

    if (typeof t === "undefined") {
      // copy missing key from base
      target[key] = b;
      continue;
    }

    if (isPlainObject(t) && isPlainObject(b)) {
      deepMergeFillMissing(t, b);
    }
  }
  return target;
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function main() {
  const basePath = path.join(process.cwd(), "public", "locales", BASE_LOCALE, FILE);
  const base = readJson(basePath);

  for (const locale of TARGETS) {
    const targetPath = path.join(process.cwd(), "public", "locales", locale, FILE);
    const before = readJson(targetPath);
    const after = deepMergeFillMissing(before, base);
    writeJson(targetPath, after);
    console.log(`✅ filled missing keys for ${locale}: ${targetPath}`);
  }

  console.log("Done.");
}

main();
