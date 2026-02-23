import type { NextApiRequest, NextApiResponse } from "next";
import { verifyStateToken, readCookie, clearCookie, buildCookie, setXLink, fetchXMe } from "../../../lib/social/x";

function basicAuth(clientId: string, clientSecret: string) {
  const v = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");
  return `Basic ${v}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    if (!code || !state) return res.status(400).send("Missing code/state");

    const clientId = process.env.X_CLIENT_ID || "";
    const clientSecret = process.env.X_CLIENT_SECRET || "";
    const redirectUri = process.env.X_REDIRECT_URI || "";
    const secret = process.env.X_LINK_SECRET || process.env.SESSION_SECRET || "";
    if (!clientId || !clientSecret || !redirectUri || !secret) return res.status(500).send("X env missing");

    const wallet = verifyStateToken(state, secret);
    if (!wallet) return res.status(400).send("Invalid state");

    const pkce = readCookie(req.headers.cookie, "x_pkce");
    if (!pkce) return res.status(400).send("Missing PKCE");

    // Token exchange (confidential client uses Basic auth) :contentReference[oaicite:4]{index=4}
    const body = new URLSearchParams();
    body.set("grant_type", "authorization_code");
    body.set("code", code);
    body.set("redirect_uri", redirectUri);
    body.set("code_verifier", pkce);

    const tr = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: basicAuth(clientId, clientSecret),
      },
      body,
    });

    const tj: any = await tr.json().catch(() => ({}));
    if (!tr.ok) return res.status(400).send("Token exchange failed");

    const accessToken = typeof tj.access_token === "string" ? tj.access_token : "";
    const expiresIn = Number(tj.expires_in || 0);
    if (!accessToken || !Number.isFinite(expiresIn) || expiresIn <= 0) return res.status(400).send("Missing token");

    const now = Math.floor(Date.now() / 1000);
    const exp = now + Math.min(expiresIn, 20 * 60); // session courte (cap 20 min)

    const me = await fetchXMe(accessToken);
    if (!me.ok) return res.status(400).send("X /me failed");

    setXLink(wallet, { userId: me.id, accessToken, exp });

    // nettoie pkce + marque linked (cookie non sensible)
    res.setHeader("Set-Cookie", [
      clearCookie("x_pkce"),
      buildCookie("x_linked", "1", 20 * 60),
    ]);

    // redirect vers dashboard
    return res.redirect(302, "/dashboard");
  } catch {
    return res.status(500).send("Server error");
  }
}
