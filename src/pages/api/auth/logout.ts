import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  // Toujours expirer la session (logout CSRF = faible risque ; l'important est de ne jamais bloquer)
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    "shui_session=",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
    "Max-Age=0",
  ].filter(Boolean);

  res.setHeader("Set-Cookie", parts.join("; "));
  res.status(200).json({ ok: true });
}
