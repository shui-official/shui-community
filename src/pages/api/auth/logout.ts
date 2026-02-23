import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // expire cookie
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    "shui_session=",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
    "Max-Age=0"
  ].filter(Boolean);

  res.setHeader("Set-Cookie", parts.join("; "));
  res.status(200).json({ ok: true });
}
