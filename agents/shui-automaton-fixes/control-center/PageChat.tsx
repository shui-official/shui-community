/**
 * PAGE — CHAT SHUI (canal réel vers l'agent)
 *
 * ⚠️ IMPORTANT
 *  - Ce dashboard ne contient AUCUNE IA, AUCUN modèle et AUCUNE boucle autonome.
 *  - Le message est transmis à SHUI (endpoint local 127.0.0.1:3334, via le backend) ;
 *    SHUI le range dans inbox_messages et se réveille. La réponse affichée est le
 *    tour réel de SHUI qui l'a lu. Aucune réponse n'est simulée.
 *  - Si SHUI ne répond pas sur son canal, la page l'affiche (NON CONNECTÉ).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Chip, PageHead, Raw } from '../components/ui';
import { API_BASE, api } from '../core/api';
import { useStore } from '../core/store';
import type { ChatStatus } from '../core/types';
import { fmtTime } from '../core/util';

const REFRESH_MS = 3000;

const ROLE_LABEL: Record<string, string> = { user: 'Vous', assistant: 'SHUI', system: 'Canal' };
const ROLE_STYLE: Record<string, string> = {
  user: 'border-sky-400/30 bg-sky-400/5',
  assistant: 'border-emerald-400/30 bg-emerald-400/5',
  system: 'border-ink-700 bg-ink-850/40 text-slate-400'
};

export function PageChat(): React.ReactElement {
  const store = useStore();
  const [status, setStatus] = useState<ChatStatus | null>(store.chat);
  const [draft, setDraft] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const reload = (): void => {
    if (API_BASE) void api.chat().then(setStatus).catch(() => undefined);
  };

  useEffect(() => {
    reload();
    const timer = window.setInterval(reload, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  const count = status?.messages?.length ?? 0;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [count]);

  const connected = status?.connected === true;

  const submit = async (): Promise<void> => {
    const text = draft.trim();
    if (!text || busy || !connected) return;
    setBusy(true);
    const reason = await store.sendChat(text);
    setFeedback(reason);
    setDraft('');
    setBusy(false);
    reload();
  };

  return (
    <>
      <PageHead
        title="Chat avec SHUI"
        sub="Dialogue direct avec l’agent SHUI via son canal réel. Aucune réponse n’est simulée par le dashboard."
        actions={
          <>
            <Chip tone={connected ? 'neutral' : 'bad'}>{connected ? '● CONNECTÉ' : 'NON CONNECTÉ'}</Chip>
            <Chip tone="neutral">AUCUNE IA EMBARQUÉE</Chip>
          </>
        }
      />

      <section className={`panel ${connected ? 'border-emerald-400/25' : 'border-rose-400/25'}`}>
        <div className="panel-head">
          <h2 className="panel-title">État réel du canal</h2>
          <span className="panel-hint">vérifié toutes les {REFRESH_MS / 1000} s</span>
        </div>
        <div className="panel-body">
          <p className="text-[13px] text-slate-300">
            {status?.reason ?? (API_BASE ? 'Vérification du canal…' : 'Aucun backend : le chat est indisponible.')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip tone={connected ? 'neutral' : 'bad'}>connected: {String(connected)}</Chip>
            <Chip tone="neutral">transport : {connected ? 'SHUI 127.0.0.1:3334 (jeton)' : 'indisponible'}</Chip>
          </div>
        </div>
      </section>

      <section className="panel mt-4">
        <div className="panel-head">
          <h2 className="panel-title">Dialogue avec SHUI</h2>
          <span className="panel-hint">{connected ? 'SHUI répond à son prochain tour (1 à 2 min)' : 'canal indisponible'}</span>
        </div>
        <div className="panel-body">
          <div className="max-h-[480px] space-y-2.5 overflow-y-auto pr-1">
            {count === 0 ? (
              <p className="text-[12.5px] text-slate-400">
                {connected ? 'Aucun message pour l’instant. Écrivez à SHUI ci-dessous.' : 'Le canal SHUI est indisponible.'}
              </p>
            ) : (
              status!.messages.map((m) => (
                <div key={m.id} className={`rounded-lg border p-3 ${ROLE_STYLE[m.role] ?? ROLE_STYLE.system}`}>
                  <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    {ROLE_LABEL[m.role] ?? m.role} · {fmtTime(m.ts)}
                  </div>
                  <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-200">{m.text}</p>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <input
              className="input min-w-[260px] flex-1"
              placeholder={connected ? 'Message à SHUI (Entrée pour envoyer)…' : 'Le chat n’est pas connecté…'}
              aria-label="Message vers SHUI"
              value={draft}
              maxLength={4000}
              disabled={!connected || busy}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void submit();
                }
              }}
            />
            <button type="button" className="btn" disabled={!connected || busy || !draft.trim()} onClick={() => void submit()}>
              {busy ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
          {feedback ? <p className="mt-2.5 text-[12.5px] text-amber-300">{feedback}</p> : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 mt-4">
        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Chaîne de communication live</h2>
          </div>
          <div className="panel-body">
            <Raw
              value={`GET  /api/chat -> { connected, reason, messages, plannedTransport }
POST /api/chat -> 200 { ok: true }  (transmis à SHUI)
               -> 502 { ok: false, reason }  (canal indisponible)

Frontend -> Backend Control Center -> SHUI 127.0.0.1:3334/chat
  -> inbox_messages + wake_event (écrits par SHUI) -> tour réel de SHUI
  -> réponse persistée chez SHUI -> affichée ici`}
            />
            <p className="mt-2.5 text-[12px] text-slate-400">
              Le dashboard n’écrit jamais dans <span className="font-mono">state.db</span> et ne voit jamais le jeton
              du canal (il reste côté serveur).
            </p>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Ce que ce chat ne fera jamais</h2>
          </div>
          <div className="panel-body">
            <ul className="ml-4 list-disc space-y-1.5 text-[13px] leading-relaxed text-slate-300">
              <li>Créer une deuxième IA ou une deuxième boucle autonome.</li>
              <li>Simuler une réponse de SHUI.</li>
              <li>Exécuter une commande système depuis le navigateur.</li>
              <li>Modifier la mission, les règles ou le wallet de SHUI.</li>
              <li>Transmettre ou afficher un secret (redaction systématique).</li>
            </ul>
          </div>
        </article>
      </section>
    </>
  );
}
