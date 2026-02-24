/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const LOCALES = ["fr", "en", "es", "it", "de", "ru", "zh"];
const COMMON = (lng) => path.join(ROOT, "public", "locales", lng, "common.json");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
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
      title: "Connexion sécurisée (V2)",
      desc: "Signature d’un message lisible → session serveur (cookie httpOnly).",
      noTx: "Aucune transaction n’est demandée.",
      enableCta: "Activer la connexion sécurisée (V2)",
      enabling: "Activation…",
      logout: "Se déconnecter (session)",
      walletConnected: "Wallet connecté",
      signMessageAvailable: "signMessage dispo",
      statusOff: "Non activée",
      yes: "oui",
      no: "non",
      noSignMessage:
        "Ton wallet ne supporte pas signMessage ici. Essaie Phantom (extension) et reconnecte."
    }
  },
  en: {
    secureLogin: {
      title: "Secure login (V2)",
      desc: "Readable message signature → server session (httpOnly cookie).",
      noTx: "No transaction is requested.",
      enableCta: "Enable secure login (V2)",
      enabling: "Enabling…",
      logout: "Log out (session)",
      walletConnected: "Wallet connected",
      signMessageAvailable: "signMessage available",
      statusOff: "Not enabled",
      yes: "yes",
      no: "no",
      noSignMessage:
        "Your wallet doesn’t support signMessage here. Try Phantom (browser extension) and reconnect."
    }
  },
  es: {
    secureLogin: {
      title: "Login seguro (V2)",
      desc: "Firma de mensaje legible → sesión de servidor (cookie httpOnly).",
      noTx: "No se solicita ninguna transacción.",
      enableCta: "Activar login seguro (V2)",
      enabling: "Activando…",
      logout: "Cerrar sesión (sesión)",
      walletConnected: "Wallet conectada",
      signMessageAvailable: "signMessage disponible",
      statusOff: "No activado",
      yes: "sí",
      no: "no",
      noSignMessage:
        "Tu wallet no soporta signMessage aquí. Prueba Phantom (extensión) y reconecta."
    }
  },
  it: {
    secureLogin: {
      title: "Login sicuro (V2)",
      desc: "Firma di un messaggio leggibile → sessione server (cookie httpOnly).",
      noTx: "Nessuna transazione richiesta.",
      enableCta: "Attiva login sicuro (V2)",
      enabling: "Attivazione…",
      logout: "Disconnetti (sessione)",
      walletConnected: "Wallet connesso",
      signMessageAvailable: "signMessage disponibile",
      statusOff: "Non attivato",
      yes: "sì",
      no: "no",
      noSignMessage:
        "Il tuo wallet non supporta signMessage qui. Prova Phantom (estensione) e riconnetti."
    }
  },
  de: {
    secureLogin: {
      title: "Secure Login (V2)",
      desc: "Lesbare Nachricht signieren → Server-Session (httpOnly Cookie).",
      noTx: "Keine Transaktion erforderlich.",
      enableCta: "Secure Login (V2) aktivieren",
      enabling: "Aktiviere…",
      logout: "Abmelden (Session)",
      walletConnected: "Wallet verbunden",
      signMessageAvailable: "signMessage verfügbar",
      statusOff: "Nicht aktiviert",
      yes: "ja",
      no: "nein",
      noSignMessage:
        "Dein Wallet unterstützt signMessage hier nicht. Bitte Phantom (Browser-Extension) nutzen und neu verbinden."
    }
  },
  ru: {
    secureLogin: {
      title: "Безопасный вход (V2)",
      desc: "Подпись читаемого сообщения → серверная сессия (httpOnly cookie).",
      noTx: "Транзакция не требуется.",
      enableCta: "Включить безопасный вход (V2)",
      enabling: "Включение…",
      logout: "Выйти (сессия)",
      walletConnected: "Кошелёк подключён",
      signMessageAvailable: "signMessage доступен",
      statusOff: "Не активировано",
      yes: "да",
      no: "нет",
      noSignMessage:
        "Ваш кошелёк не поддерживает signMessage здесь. Попробуйте Phantom (расширение) и переподключитесь."
    }
  },
  zh: {
    secureLogin: {
      title: "安全登录（V2）",
      desc: "签名可读消息 → 服务器会话（httpOnly cookie）。",
      noTx: "不需要任何交易。",
      enableCta: "启用安全登录（V2）",
      enabling: "启用中…",
      logout: "退出（会话）",
      walletConnected: "钱包已连接",
      signMessageAvailable: "signMessage 可用",
      statusOff: "未启用",
      yes: "是",
      no: "否",
      noSignMessage:
        "你的钱包在这里不支持 signMessage。请使用 Phantom（浏览器扩展）并重新连接。"
    }
  }
};

function patchLocales() {
  console.log("==> Patch locale JSON (merge secureLogin.* across all languages)");
  for (const lng of LOCALES) {
    const p = COMMON(lng);
    if (!fs.existsSync(p)) throw new Error(`Missing file: ${p}`);
    const json = readJson(p);
    deepMerge(json, secureLoginByLang[lng]);
    writeJson(p, json);
    console.log(`OK: ${p}`);
  }
}

function patchTsconfigExcludeBackups() {
  const p = path.join(ROOT, "tsconfig.json");
  if (!fs.existsSync(p)) {
    console.log("==> tsconfig.json not found, skip");
    return;
  }
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  const add = [
    ".next",
    "node_modules",
    "_i18n_lock_backup_*",
    "_i18n_lock2_backup_*",
    "_backup_*",
    "backups",
    ".i18n_audit",
    "audit_report_*.txt"
  ];
  j.exclude = Array.isArray(j.exclude) ? j.exclude : [];
  for (const e of add) if (!j.exclude.includes(e)) j.exclude.push(e);
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n", "utf8");
  console.log("==> tsconfig.json updated (exclude backups)");
}

function patchSecureLoginTsx() {
  const file = path.join(ROOT, "src", "components", "SecureLogin.tsx");
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  let s = fs.readFileSync(file, "utf8");

  // ensure import useTranslation
  if (!s.includes("useTranslation")) {
    s = s.replace(
      /^import .*?;\s*$/m,
      (m) => m + '\nimport { useTranslation } from "next-i18next";'
    );
  }

  // ensure hook
  if (!s.includes('useTranslation("common")') && !s.includes("useTranslation('common')")) {
    s = s.replace(
      /(export default function SecureLogin\s*\([^)]*\)\s*\{\s*)/,
      `$1\n  const { t } = useTranslation("common");\n`
    );
  }

  // Fix literal "${t(...)}" artifacts that show up as "$..."
  s = s.replace(/\$\{t\(/g, "{t(");

  // Replace the block header strings (if present)
  s = s.replace(/Connexion sécurisée\s*\(V2\)/g, '{t("secureLogin.title")}');
  s = s.replace(/Signature d’un message lisible[^<\n"]*/g, '{t("secureLogin.desc")}');
  s = s.replace(/Aucune transaction n’est demandée\./g, '{t("secureLogin.noTx")}');

  // Button label
  s = s.replace(/Se déconnecter\s*\(session\)/g, '{t("secureLogin.logout")}');

  // Labels in debug area
  s = s.replace(/Wallet connecté/g, '{t("secureLogin.walletConnected")}');
  s = s.replace(/signMessage dispo/g, '{t("secureLogin.signMessageAvailable")}');
  s = s.replace(/"oui"/g, 't("secureLogin.yes")');
  s = s.replace(/"non"/g, 't("secureLogin.no")');

  // Status line: enforce translated label and off state
  // Replace any "Non activée" string
  s = s.replace(/"Non activée"/g, 't("secureLogin.statusOff")');

  // Replace error text for missing signMessage
  s = s.replace(/"signMessage indisponible \(wallet adapter\)\."/g, 't("secureLogin.noSignMessage")');

  fs.writeFileSync(file, s, "utf8");
  console.log(`OK: patched ${file}`);
}

try {
  patchLocales();
  patchTsconfigExcludeBackups();
  patchSecureLoginTsx();
  console.log("DONE ✅ SecureLogin i18n lock applied.");
} catch (e) {
  console.error("ERROR:", e.message);
  process.exit(1);
}
