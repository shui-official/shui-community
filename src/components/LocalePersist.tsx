import { useEffect } from "react";
import { useRouter } from "next/router";

const DEFAULT_LOCALE = "fr";
const ALLOWED = ["fr", "en", "es", "it", "de", "ru", "zh"];

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

export default function LocalePersist() {
  const router = useRouter();

  useEffect(() => {
    // Si l’utilisateur a déjà choisi une locale, Next stocke souvent NEXT_LOCALE.
    // On force la route à respecter cette locale si on tombe sur fr par défaut.
    const saved = readCookie("NEXT_LOCALE") || readCookie("shui_locale");
    const wanted = (saved || "").toLowerCase();

    if (!wanted || !ALLOWED.includes(wanted)) return;

    const current = (router.locale || DEFAULT_LOCALE).toLowerCase();
    if (current === wanted) return;

    // Important: on ne casse pas l’URL: on garde asPath, on applique juste locale
    router.replace(router.asPath, router.asPath, { locale: wanted }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.locale]);

  return null;
}
