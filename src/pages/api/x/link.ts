import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod, requireSameOrigin } from "../../../lib/security/validate";
import { rateLimitOrThrow } from "../../../lib/security/rateLimit";
import { getSession } from "../../../lib/security/session";
import { createStateToken, randomVerifier, sha256b64url, buildCookie, clearCookie } from "../../../lib/social/x";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["POST"]);
    requireSameOrigin(req);
    rateLimitOrThrow({ req, res, key: "x:link", limit: 10, windowMs: 60_000 });

    const session = getSession(req);
    if (!session) return res.status(401).json({ ok: false, error: "unauthorized" });

    const clientId = process.env.X_CLIENT_ID || "";
    const redirectUri = process.env.X_REDIRECT_URI || "";
    const secret = process.env.X_LINK_SECRET || process.env.SESSION_SECRET || "";
    if (!clientId) return res.status(500).json({ ok: false, error: "x_client_id_missing" });
    if (!redirectUri) return res.status(500).json({ ok: false, error: "x_redirect_uri_missing" });
    if (!secret) return res.status(500).json({ ok: false, error: "x_link_secret_missing" });

    // PKCE (required) :contentReference[oaicite:2]{index=2}
    const verifier = randomVerifier(48);
    const challenge = sha256b64url(verifier);

    const state = createStateToken(session.wallet, secret, 10 * 60);

    // cookie PKCE (10 min)
    res.setHeader("Set-Cookie", [
      buildCookie("x_pkce", verifier, 600),
      // nettoie un ancien token si présent
      clearCookie("x_linked"),
    ]);

    // scopes: users.read + follows.read :contentReference[oaicite:3]{index=3}
    const scope = encodeURIComponent("users.read follows.read");
    const authUrl =
      "https://twitter.com/i/oauth2/authorize" +
      `?response_type=code&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scope}` +
      `&state=${encodeURIComponent(state)}` +
      `&code_challenge=${encodeURIComponent(challenge)}` +
      `&code_challenge_method=S256`;

    return res.status(200).json({ ok: true, url: authUrl });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ ok: false, error: e?.message || "server_error" });
  }
}
