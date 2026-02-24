/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const LOCALES = ["fr", "en", "es", "it", "de", "ru", "zh"];
const COMMON = (lng) => path.join(ROOT, "public", "locales", lng, "common.json");

function readJson(p) {
  const s = fs.readFileSync(p, "utf8");
  return JSON.parse(s);
}

function writeJson(p, obj) {
  const pretty = JSON.stringify(obj, null, 2) + "\n";
  fs.writeFileSync(p, pretty, "utf8");
}

function deepMerge(target, src) {
  for (const [k, v] of Object.entries(src)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      target[k] = target[k] && typeof target[k] === "object" ? target[k] : {};
      deepMerge(target[k], v);
    } else if (target[k] === undefined) {
      target[k] = v;
    }
  }
  return target;
}

const secureLoginByLang = {
  fr: {
    secureLogin: {
      statusOff: "Non activée",
      signMessageAvailable: "signMessage dispo",
      yes: "oui",
      no: "non",
      enableCta: "Activer la connexion sécurisée (V2)",
      enabling: "Activation…",
      noSignMessage:
        "Ton wallet ne supporte pas signMessage ici. Essaie Phantom (extension) et reconnecte.",
    },
  },
  en: {
    secureLogin: {
      statusOff: "Not enabled",
      signMessageAvailable: "signMessage available",
      yes: "yes",
      no: "no",
      enableCta: "Enable secure login (V2)",
      enabling: "Enabling…",
      noSignMessage:
        "Your wallet doesn’t support signMessage here. Try Phantom (browser extension) and reconnect.",
    },
  },
  es: {
    secureLogin: {
      statusOff: "No activado",
      signMessageAvailable: "signMessage disponible",
      yes: "sí",
      no: "no",
      enableCta: "Activar login seguro (V2)",
      enabling: "Activando…",
      noSignMessage:
        "Tu wallet no soporta signMessage aquí. Prueba Phantom (extensión) y reconecta.",
    },
  },
  it: {
    secureLogin: {
      statusOff: "Non attivato",
      signMessageAvailable: "signMessage disponibile",
      yes: "sì",
      no: "no",
      enableCta: "Attiva login sicuro (V2)",
      enabling: "Attivazione…",
      noSignMessage:
        "Il tuo wallet non supporta signMessage qui. Prova Phantom (estensione) e riconnetti.",
    },
  },
  de: {
    secureLogin: {
      statusOff: "Nicht aktiviert",
      signMessageAvailable: "signMessage verfügbar",
      yes: "ja",
      no: "nein",
      enableCta: "Secure Login (V2) aktivieren",
      enabling: "Aktiviere…",
      noSignMessage:
        "Dein Wallet unterstützt signMessage hier nicht. Bitte Phantom (Browser-Extension) nutzen und neu verbinden.",
    },
  },
  ru: {
    secureLogin: {
      statusOff: "Не активировано",
      signMessageAvailable: "signMessage доступен",
      yes: "да",
      no: "нет",
      enableCta: "Включить безопасный вход (V2)",
      enabling: "Включение…",
      noSignMessage:
        "Ваш кошелёк не поддерживает signMessage здесь. Попробуйте Phantom (расширение) и переподключитесь.",
    },
  },
  zh: {
    secureLogin: {
      statusOff: "未启用",
      signMessageAvailable: "signMessage 可用",
      yes: "是",
      no: "否",
      enableCta: "启用安全登录（V2）",
      enabling: "启用中…",
      noSignMessage:
        "你的钱包在这里不支持 signMessage。请使用 Phantom（浏览器扩展）并重新连接。",
    },
  },
};

function patchLocales() {
  console.log("==> Patch locale JSON (merge secureLogin.* across all languages)");
  for (const lng of LOCALES) {
    const p = COMMON(lng);
    if (!fs.existsSync(p)) {
      throw new Error(`Missing file: ${p}`);
    }
    const json = readJson(p);
    const add = secureLoginByLang[lng];
    deepMerge(json, add);
    writeJson(p, json);
    console.log(`OK: ${p}`);
  }
}

function patchSecureLoginTsx() {
  const file = path.join(ROOT, "src", "components", "SecureLogin.tsx");
  if (!fs.existsSync(file)) {
    throw new Error(`Missing file: ${file}`);
  }
  let s = fs.readFileSync(file, "utf8");

  // 1) ensure import useTranslation
  if (!s.includes('useTranslation("common")') && !s.includes("useTranslation('common')")) {
    if (!s.includes("useTranslation")) {
      // try add after React import or first import line
      const lines = s.split("\n");
      let inserted = false;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("import ") && !inserted) {
          // insert after first import block line
          lines.splice(i + 1, 0, 'import { useTranslation } from "next-i18next";');
          inserted = true;
          break;
        }
      }
      s = lines.join("\n");
    }
  }

  // 2) ensure const { t } = useTranslation("common");
  if (!s.includes("useTranslation(\"common\")") && !s.includes("useTranslation('common')")) {
    // We'll insert near top of component function body.
    // common patterns:
    // export default function SecureLogin(...) {
    // function SecureLogin(...) {
    const re = /(export default function SecureLogin\s*\([^)]*\)\s*\{\s*)/;
    if (re.test(s)) {
      s = s.replace(re, `$1\n  const { t } = useTranslation("common");\n`);
    } else {
      const re2 = /(function SecureLogin\s*\([^)]*\)\s*\{\s*)/;
      if (re2.test(s)) {
        s = s.replace(re2, `$1\n  const { t } = useTranslation("common");\n`);
      } else {
        // last resort: insert after first "{"
        s = s.replace("{", "{\n  const { t } = useTranslation(\"common\");\n");
      }
    }
  } else {
    // If useTranslation already exists but no t binding, do nothing.
  }

  // 3) Replace obvious FR strings in SecureLogin UI/logic
  s = s.replace(/"signMessage indisponible \(wallet adapter\)\."/g, 't("secureLogin.noSignMessage")');
  s = s.replace(/Ton wallet ne supporte pas signMessage ici\.[^"]*"/g, '${t("secureLogin.noSignMessage")}"');

  // Status label & off state
  s = s.replace(/Statut\s*:\s*/g, `${'${t("dashboard.statusLabel")}: '} `); // safe for JSX text nodes
  s = s.replace(/"Non activée"/g, 't("secureLogin.statusOff")');

  // signMessage dispo label
  s = s.replace(/signMessage dispo\s*:/g, `${'${t("secureLogin.signMessageAvailable")}: '} `);
  s = s.replace(/"oui"/g, 't("secureLogin.yes")');
  s = s.replace(/"non"/g, 't("secureLogin.no")');

  // If there is an enable button with FR label
  s = s.replace(/Activer la connexion sécurisée \(V2\)/g, '${t("secureLogin.enableCta")}');
  s = s.replace(/Activation…/g, '${t("secureLogin.enabling")}');

  fs.writeFileSync(file, s, "utf8");
  console.log(`OK: patched ${file}`);
}

try {
  patchLocales();
  patchSecureLoginTsx();
  console.log("DONE ✅ i18n lock patch applied.");
} catch (e) {
  console.error("ERROR:", e.message);
  process.exit(1);
}
