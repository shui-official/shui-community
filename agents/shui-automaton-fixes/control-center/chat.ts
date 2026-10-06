/**
 * SHUI CONTROL CENTER — CHAT SHUI (connecté au canal réel de SHUI)
 *
 * CE MODULE NE CONTIENT AUCUNE IA, AUCUN MODÈLE, AUCUNE BOUCLE AUTONOME.
 * Les messages sont transmis à SHUI par son endpoint local (127.0.0.1:3334,
 * jeton requis, voir shui-chat-transport.ts). SHUI les range lui-même dans
 * inbox_messages et se réveille ; sa réponse est le tour qui a lu le message.
 * Le dashboard n'écrit jamais dans state.db, n'invente aucune réponse, et
 * n'envoie jamais le jeton au navigateur.
 *
 *   Frontend -> POST /api/chat -> ChatService -> SHUI (127.0.0.1:3334/chat)
 *   Frontend <- GET  /api/chat <- état + conversation relus chez SHUI (3 s)
 */
import { randomUUID } from 'node:crypto';
import type { ChatMessage, ChatStatus } from './types';
import { listShuiChat, sendCreatorMessage, shuiChatStatus, type ShuiChatMessage } from './shui-chat-transport';

const REFRESH_MS = 3000;
const MAX_TEXT = 4000;

export interface ChatTransport {
  readonly id: string;
  readonly available: boolean;
  send(text: string, history: ChatMessage[]): Promise<ChatMessage>;
}

function toTs(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : Date.now();
}

/** Conversation SHUI -> messages du dashboard (aucun contenu ajouté hormis l'état réel). */
export function toChatMessages(items: ShuiChatMessage[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  const answered = new Set(items.filter((m) => m.role === 'shui' && m.replyTo).map((m) => m.replyTo as string));
  for (const m of items) {
    if (m.role === 'creator') {
      out.push({ id: m.id, role: 'user', text: m.content, ts: toTs(m.at) });
      if (m.status === 'failed') {
        out.push({ id: `${m.id}_failed`, role: 'system', text: 'SHUI n’a pas pu traiter ce message (échec du tour).', ts: toTs(m.at) });
      }
      continue;
    }
    const tools = (m.tools ?? []).map((t) => `${t.name} ${t.ok ? '✓' : '✗'}`).join(', ');
    out.push({
      id: m.id,
      role: 'assistant',
      text: tools ? `${m.content}\n\nActions : ${tools}` : m.content,
      ts: toTs(m.at)
    });
  }
  const last = items.filter((m) => m.role === 'creator').pop();
  if (last && last.status !== 'failed' && !answered.has(last.id) && !items.some((m) => m.role === 'shui' && toTs(m.at) >= toTs(last.at))) {
    out.push({
      id: `${last.id}_pending`,
      role: 'system',
      text: last.status === 'in_progress'
        ? 'SHUI lit ce message (tour en cours)…'
        : 'Transmis à SHUI. Il le lira à son prochain réveil (30 s max) ; réponse au tour suivant.',
      ts: toTs(last.at) + 1
    });
  }
  return out;
}

export class ChatService {
  private messages: ChatMessage[] = [];
  private connected = false;
  private lastError = 'canal pas encore vérifié';
  private local: ChatMessage[] = [];

  constructor(refreshMs = REFRESH_MS) {
    void this.refresh();
    const timer = setInterval(() => void this.refresh(), refreshMs);
    timer.unref?.();
  }

  /** Relit l'état réel du canal et la conversation chez SHUI. */
  async refresh(): Promise<void> {
    const health = await shuiChatStatus();
    this.connected = health.connected;
    this.lastError = health.reason ?? '';
    if (!health.connected) return;
    try {
      this.messages = toChatMessages(await listShuiChat());
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : String(err);
    }
  }

  get status(): ChatStatus {
    return {
      connected: this.connected,
      reason: this.connected
        ? 'CONNECTÉ — canal réel vers SHUI (127.0.0.1:3334). Les messages vont dans sa boîte de réception ; ' +
          'la réponse affichée est le tour réel de SHUI qui les a lus. Aucune réponse n’est simulée.'
        : `NON CONNECTÉ — SHUI ne répond pas sur son canal local (${this.lastError || 'indisponible'}). ` +
          'Aucune réponse n’est simulée.',
      messages: [...this.messages, ...this.local].sort((a, b) => a.ts - b.ts),
      plannedTransport: 'POST /api/chat → ChatService → SHUI 127.0.0.1:3334/chat → inbox_messages + wake_event → tour SHUI'
    };
  }

  async submit(text: string): Promise<{ accepted: boolean; reason: string; message: ChatMessage }> {
    const clean = String(text ?? '').trim().slice(0, MAX_TEXT);
    try {
      const sent = await sendCreatorMessage(clean);
      this.local = [];
      await this.refresh();
      const message = this.messages.find((m) => m.id === sent.id)
        ?? { id: sent.id, role: 'user' as const, text: clean, ts: Date.now() };
      return { accepted: true, reason: 'Transmis à SHUI.', message };
    } catch (err) {
      const reason = `Message non transmis : ${err instanceof Error ? err.message : String(err)}`;
      const message: ChatMessage = { id: randomUUID(), role: 'system', text: reason, ts: Date.now() };
      this.local.push({ id: randomUUID(), role: 'user', text: clean, ts: Date.now() - 1 }, message);
      return { accepted: false, reason, message };
    }
  }

  /** Efface seulement les messages locaux non transmis ; l'historique réel reste chez SHUI. */
  clear(): void {
    this.local = [];
  }

  setTransport(_transport: ChatTransport): void {
    // Le transport réel est le canal local de SHUI (shui-chat-transport.ts).
  }

  get transportId(): string {
    return 'shui-local-http';
  }
}
