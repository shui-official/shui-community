import React from "react";
import { useRouter } from "next/router";

type LocaleItem = {
  locale: string;
  label: string;
  flag: string;
};

const LOCALES: LocaleItem[] = [
  { locale: "fr", label: "Français", flag: "🇫🇷" },
  { locale: "en", label: "English", flag: "🇬🇧" },
  { locale: "es", label: "Español", flag: "🇪🇸" },
  { locale: "it", label: "Italiano", flag: "🇮🇹" },
  { locale: "de", label: "Deutsch", flag: "🇩🇪" },
  { locale: "ru", label: "Русский", flag: "🇷🇺" },
  { locale: "zh", label: "中文", flag: "🇨🇳" },
];

function setLocaleCookie(locale: string) {
  // Next.js i18n utilise couramment NEXT_LOCALE
  // On met aussi une copie shui_locale (debug / fallback)
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `NEXT_LOCALE=${encodeURIComponent(locale)}; Path=/; Max-Age=${oneYear}; SameSite=Lax`;
  document.cookie = `shui_locale=${encodeURIComponent(locale)}; Path=/; Max-Age=${oneYear}; SameSite=Lax`;
}

export default function LanguageSwitch() {
  const router = useRouter();
  const currentLocale = (router.locale || "fr").toLowerCase();

  const setLocale = async (locale: string) => {
    if (!locale || locale === currentLocale) return;

    // Persistance
    if (typeof document !== "undefined") setLocaleCookie(locale);

    // garde la même route + query, change uniquement la locale Next
    await router.push(router.pathname, router.asPath, { locale });
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur">
      <div className="text-xs text-white/60 hidden sm:block">Language</div>

      <div className="flex items-center gap-1">
        {LOCALES.map((l) => {
          const active = l.locale === currentLocale;
          return (
            <button
              key={l.locale}
              type="button"
              onClick={() => setLocale(l.locale)}
              className={[
                "h-9 w-10 rounded-xl border text-base leading-none",
                "flex items-center justify-center",
                active
                  ? "border-emerald-300/30 bg-emerald-400/10"
                  : "border-white/15 bg-black/20 hover:bg-white/10",
              ].join(" ")}
              aria-label={l.label}
              title={l.label}
            >
              <span aria-hidden="true">{l.flag}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
