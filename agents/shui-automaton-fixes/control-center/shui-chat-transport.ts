/**
 * SHUI Control Center -> SHUI chat transport.
 *
 * Copy to backend/src/shui-chat-transport.ts and use it from chat.ts
 * (GET /api/chat and POST /api/chat). state.db stays read-only: messages go
 * to SHUI's own endpoint on 127.0.0.1, which stores them in inbox_messages,
 * wakes SHUI, and keeps SHUI's reply (the turn that read the message).
 *
 * Token: SHUI_CHAT_TOKEN env, or the file ~/.shui-chat-token (written by
 * setup-chat.sh). Never log it, never send it to the browser.
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SHUI_CHAT_URL = (process.env.SHUI_CHAT_URL ?? "http://127.0.0.1:3334").replace(/\/$/, "");
const TIMEOUT_MS = 5000;

export interface ShuiChatMessage {
  id: string;
  role: "creator" | "shui";
  content: string;
  at: string;
  status: string;
  replyTo?: string;
  tools?: Array<{ name: string; ok: boolean; result: string }>;
}

function token(): string {
  const fromEnv = (process.env.SHUI_CHAT_TOKEN ?? "").trim();
  if (fromEnv) return fromEnv;
  try {
    return readFileSync(join(homedir(), ".shui-chat-token"), "utf8").trim();
  } catch {
    return "";
  }
}

async function call(path: string, init: RequestInit = {}): Promise<Response> {
  const secret = token();
  if (!secret) throw new Error("SHUI_CHAT_TOKEN missing (run setup-chat.sh)");
  return fetch(`${SHUI_CHAT_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}`, ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

/** Channel state for the page header ("CONNECTÉ" / "NON CONNECTÉ"). */
export async function shuiChatStatus(): Promise<{ connected: boolean; transport: string; reason?: string }> {
  try {
    const res = await call("/chat/health");
    return res.ok
      ? { connected: true, transport: "shui-local-http" }
      : { connected: false, transport: "indisponible", reason: `HTTP ${res.status}` };
  } catch (err) {
    return { connected: false, transport: "indisponible", reason: err instanceof Error ? err.message : String(err) };
  }
}

/** Send a creator message. SHUI answers on its next turn (it is woken within ~30 s). */
export async function sendCreatorMessage(content: string): Promise<{ id: string; status: string }> {
  const res = await call("/chat", { method: "POST", body: JSON.stringify({ content }) });
  const body = (await res.json()) as { id?: string; status?: string; error?: string };
  if (!res.ok || !body.id) throw new Error(body.error ?? `HTTP ${res.status}`);
  return { id: body.id, status: body.status ?? "received" };
}

/** Conversation in display order: each creator message followed by SHUI's reply when there is one. */
export async function listShuiChat(since?: string): Promise<ShuiChatMessage[]> {
  const res = await call(`/chat${since ? `?since=${encodeURIComponent(since)}` : ""}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = (await res.json()) as {
    outgoing?: Array<{ id: string; content: string; at: string }>;
    messages: Array<{
      id: string; content: string; receivedAt: string; status: string;
      reply: { turnId: string; at: string; text: string; tools: Array<{ name: string; ok: boolean; result: string }> } | null;
    }>;
  };
  const out: ShuiChatMessage[] = [];
  const repliedTurns = new Set<string>();
  for (const m of body.messages) {
    out.push({ id: m.id, role: "creator", content: m.content, at: m.receivedAt, status: m.status });
    // Several messages read in one turn share the same reply: show it once.
    if (m.reply && !repliedTurns.has(m.reply.turnId)) {
      repliedTurns.add(m.reply.turnId);
      out.push({
        id: `reply_${m.reply.turnId}`,
        role: "shui",
        content: m.reply.text || `(actions: ${m.reply.tools.map((t) => t.name).join(", ") || "none"})`,
        at: m.reply.at,
        status: "persisted",
        replyTo: m.id,
        tools: m.reply.tools,
      });
    }
  }
  // Messages SHUI sent on its own initiative (message_creator).
  for (const o of body.outgoing ?? []) {
    out.push({ id: o.id, role: "shui", content: o.content, at: o.at, status: "sent" });
  }
  return out.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
