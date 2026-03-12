import React from "react";
import type { FC } from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useTranslation } from "next-i18next";

const MINT = "CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C";
const SOLSCAN = `https://solscan.io/token/${MINT}`;
const SOCIALS = {
  x: "https://x.com/Shui_Labs",
  tg: "http://t.me/Shui_Community",
  ig: "https://www.instagram.com/shui.officialtoken/",
  bubblemaps:
    "https://v2.bubblemaps.io/map?address=CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C&chain=solana",
};

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: threshold });
  return { ref, inView };
}

const Tag: FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="mb-4 inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400">
    {children}
  </span>
);

const Heading: FC<{ tag?: string; title: React.ReactNode; sub?: string; center?: boolean }> = ({
  tag,
  title,
  sub,
  center = true,
}) => (
  <div className={`mb-14 ${center ? "text-center" : ""}`}>
    {tag && <Tag>{tag}</Tag>}
    <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">{title}</h2>
    {sub && <p className={`mt-4 text-base text-slate-400 ${center ? "mx-auto max-w-2xl" : ""}`}>{sub}</p>}
  </div>
);

const Btn: FC<{ href: string; children: React.ReactNode; primary?: boolean; target?: string }> = ({
  href,
  children,
  primary = false,
  target = "_blank",
}) => (
  <a
    href={href}
    target={target}
    rel="noreferrer"
    className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-all duration-300 hover:scale-105 ${
      primary
        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_30px_rgba(34,211,238,0.25)] hover:shadow-[0_0_50px_rgba(34,211,238,0.4)]"
        : "border border-white/12 bg-white/6 text-white/80 backdrop-blur hover:bg-white/10 hover:text-white"
    }`}
  >
    {children}
  </a>
);

const Hero: FC = () => {
  const { t } = useTranslation("common");
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const ref = useRef<HTMLElement>(null);

  const spawn = useCallback((x: number, y: number) => {
    const id = Date.now() + Math.random();
    setRipples((p) => [...p.slice(-5), { id, x, y }]);
    setTimeout(() => setRipples((p) => p.filter((r) => r.id !== id)), 2500);
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => {
      if (ref.current) {
        const r = ref.current.getBoundingClientRect();
        spawn(r.width / 2, r.height * 0.45);
      }
    }, 700);
    const t2 = setTimeout(() => {
      if (ref.current) {
        const r = ref.current.getBoundingClientRect();
        spawn(r.width * 0.35, r.height * 0.5);
      }
    }, 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [spawn]);

  return (
    <section
      ref={ref}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        spawn(e.clientX - r.left, e.clientY - r.top);
      }}
      className="relative flex min-h-screen cursor-crosshair flex-col items-center justify-center overflow-hidden px-6 pt-24"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#020b18] via-[#050d1a] to-[#030a15]" />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 70% 55% at 50% 35%, rgba(14,165,233,0.10) 0%, transparent 65%)" }}
      />

      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" preserveAspectRatio="none">
        {[0, 1, 2, 3].map((i) => (
          <motion.path
            key={i}
            d={`M0,${200 + i * 80} C200,${160 + i * 80} 400,${240 + i * 80} 600,${200 + i * 80} S1000,${160 + i * 80} 1200,${200 + i * 80}`}
            fill="none"
            stroke="rgba(56,189,248,0.8)"
            strokeWidth="1.5"
            animate={{
              d: [
                `M0,${200 + i * 80} C200,${160 + i * 80} 400,${240 + i * 80} 600,${200 + i * 80} S1000,${160 + i * 80} 1200,${200 + i * 80}`,
                `M0,${220 + i * 80} C200,${180 + i * 80} 400,${220 + i * 80} 600,${190 + i * 80} S1000,${210 + i * 80} 1200,${220 + i * 80}`,
                `M0,${200 + i * 80} C200,${160 + i * 80} 400,${240 + i * 80} 600,${200 + i * 80} S1000,${160 + i * 80} 1200,${200 + i * 80}`,
              ],
            }}
            transition={{ duration: 6 + i * 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </svg>

      {ripples.map((r) => (
        <React.Fragment key={r.id}>
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={ring}
              className="pointer-events-none absolute rounded-full border border-cyan-400/30"
              style={{ left: r.x, top: r.y, translateX: "-50%", translateY: "-50%" }}
              initial={{ width: 0, height: 0, opacity: 0.7 - ring * 0.15 }}
              animate={{ width: 200 + ring * 150, height: 200 + ring * 150, opacity: 0 }}
              transition={{ duration: 2 + ring * 0.4, ease: "easeOut", delay: ring * 0.15 }}
            />
          ))}
        </React.Fragment>
      ))}

      <div className="relative z-10 flex max-w-3xl flex-col items-center gap-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {[80, 64, 50].map((size, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-cyan-400/20"
              style={{ width: size * 2, height: size * 2, top: "50%", left: "50%", marginLeft: -size, marginTop: -size }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
            />
          ))}
          <div
            className="absolute inset-0 scale-150 rounded-full blur-2xl"
            style={{ background: "radial-gradient(circle, rgba(34,211,238,0.25), transparent 70%)" }}
          />
          <div className="relative h-28 w-28 overflow-hidden rounded-full ring-2 ring-cyan-400/30 shadow-[0_0_40px_rgba(34,211,238,0.3)]">
            <Image src="/shui-token.png" alt="SHUI" layout="fill" objectFit="cover" priority />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-1.5 text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
            {t("explorer.hero.badge")}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl"
        >
          {t("explorer.hero.titleLine1")}{" "}
          <span
            className="mt-1 block"
            style={{
              background: "linear-gradient(135deg, #67e8f9 0%, #38bdf8 40%, #818cf8 80%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t("explorer.hero.titleLine2")}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.8 }}
          className="max-w-xl text-lg leading-relaxed text-slate-400"
        >
          {t("explorer.hero.subtitle")}
          <br />
          <em className="not-italic text-slate-300">&ldquo;{t("explorer.hero.quote")}&rdquo;</em>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Btn href="#vision" primary target="_self">
            {t("explorer.hero.ctaExplore")}
          </Btn>
          <Btn href={SOLSCAN}>{t("explorer.hero.ctaSolscan")}</Btn>
          <Btn href={SOCIALS.tg}>{t("explorer.hero.ctaJoin")}</Btn>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          {[
            { l: t("explorer.hero.pillSupplyLabel"), v: t("explorer.hero.pillSupplyValue") },
            { l: t("explorer.hero.pillNetworkLabel"), v: t("explorer.hero.pillNetworkValue") },
            { l: t("explorer.hero.pillDecimalsLabel"), v: t("explorer.hero.pillDecimalsValue") },
          ].map((p) => (
            <div key={p.l} className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm backdrop-blur">
              <span className="text-slate-500">{p.l}: </span>
              <span className="font-semibold text-white">{p.v}</span>
            </div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-xs text-slate-600"
        >
          {t("explorer.hero.clickHint")}
        </motion.p>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <motion.div
          className="h-10 w-[1px] origin-top bg-gradient-to-b from-cyan-400/60 to-transparent"
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      </motion.div>
    </section>
  );
};

const WhySection: FC = () => {
  const { t } = useTranslation("common");
  const { ref, inView } = useReveal();
  const cards = [
    { icon: "📉", title: t("explorer.why.cards.0.title"), desc: t("explorer.why.cards.0.desc"), color: "#f87171" },
    { icon: "🌫️", title: t("explorer.why.cards.1.title"), desc: t("explorer.why.cards.1.desc"), color: "#fb923c" },
    { icon: "🤷", title: t("explorer.why.cards.2.title"), desc: t("explorer.why.cards.2.desc"), color: "#facc15" },
    { icon: "🔄", title: t("explorer.why.cards.3.title"), desc: t("explorer.why.cards.3.desc"), color: "#22d3ee", highlight: true },
  ];
  return (
    <section id="vision" className="relative px-6 py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent" />
      <div className="mx-auto max-w-5xl" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <Heading
            tag={t("explorer.why.tag")}
            title={
              <>
                {t("explorer.why.titleA")}{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg,#67e8f9,#38bdf8)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("explorer.why.titleB")}
                </span>
              </>
            }
            sub={t("explorer.why.subtitle")}
          />
        </motion.div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 + 0.2, duration: 0.6 }}
              className={`relative rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                c.highlight ? "border-cyan-500/30 bg-cyan-500/8" : "border-white/8 bg-white/3 hover:bg-white/5"
              }`}
            >
              {c.highlight && (
                <div className="absolute inset-0 rounded-2xl" style={{ background: "radial-gradient(circle at 50% 0%, rgba(34,211,238,0.08), transparent 70%)" }} />
              )}
              <div className="relative">
                <div className="mb-3 text-3xl">{c.icon}</div>
                <h3 className="mb-2 font-bold text-white">{c.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{c.desc}</p>
                {c.highlight && (
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-300">
                    {t("explorer.why.cards.3.highlight")}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FoundationsSection: FC = () => {
  const { t } = useTranslation("common");
  const { ref, inView } = useReveal();
  const pillars = [
    { icon: "🤝", label: t("explorer.foundations.items.0.label"), desc: t("explorer.foundations.items.0.desc"), color: "#22d3ee" },
    { icon: "🔍", label: t("explorer.foundations.items.1.label"), desc: t("explorer.foundations.items.1.desc"), color: "#38bdf8" },
    { icon: "⚡", label: t("explorer.foundations.items.2.label"), desc: t("explorer.foundations.items.2.desc"), color: "#818cf8" },
    { icon: "🏛️", label: t("explorer.foundations.items.3.label"), desc: t("explorer.foundations.items.3.desc"), color: "#6366f1" },
  ];
  return (
    <section className="relative overflow-hidden px-6 py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/15 to-transparent" />
      <div className="mx-auto max-w-5xl" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <Heading
            tag={t("explorer.foundations.tag")}
            title={
              <>
                {t("explorer.foundations.titleA")}{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg,#a5b4fc,#67e8f9)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("explorer.foundations.titleB")}
                </span>
              </>
            }
            sub={t("explorer.foundations.subtitle")}
          />
        </motion.div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ delay: i * 0.12 + 0.2, duration: 0.6 }}
              whileHover={{ y: -6 }}
              className="group relative rounded-2xl border border-white/8 bg-gradient-to-b from-white/5 to-transparent p-7 text-center transition-all duration-300 hover:border-white/15"
            >
              <div
                className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(circle at 50% 0%, ${p.color}12, transparent 65%)` }}
              />
              <div className="relative">
                <div
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl"
                  style={{ background: `${p.color}15`, border: `1px solid ${p.color}30`, boxShadow: `0 0 20px ${p.color}15` }}
                >
                  {p.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">{p.label}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TokenomicsSection: FC = () => {
  const { t } = useTranslation("common");
  const { ref, inView } = useReveal();

  const tokenomics = [
    { label: t("explorer.tokenomics.items.0.label"), pct: 30, amount: t("explorer.tokenomics.items.0.amount"), color: "#22d3ee", role: t("explorer.tokenomics.items.0.role"), wallet: t("explorer.tokenomics.items.0.wallet") },
    { label: t("explorer.tokenomics.items.1.label"), pct: 25, amount: t("explorer.tokenomics.items.1.amount"), color: "#38bdf8", role: t("explorer.tokenomics.items.1.role"), wallet: t("explorer.tokenomics.items.1.wallet") },
    { label: t("explorer.tokenomics.items.2.label"), pct: 20, amount: t("explorer.tokenomics.items.2.amount"), color: "#818cf8", role: t("explorer.tokenomics.items.2.role"), wallet: t("explorer.tokenomics.items.2.wallet") },
    { label: t("explorer.tokenomics.items.3.label"), pct: 15, amount: t("explorer.tokenomics.items.3.amount"), color: "#60a5fa", role: t("explorer.tokenomics.items.3.role"), wallet: t("explorer.tokenomics.items.3.wallet") },
    { label: t("explorer.tokenomics.items.4.label"), pct: 10, amount: t("explorer.tokenomics.items.4.amount"), color: "#a78bfa", role: t("explorer.tokenomics.items.4.role"), wallet: t("explorer.tokenomics.items.4.wallet") },
  ];

  const [active, setActive] = useState<typeof tokenomics[0] | null>(null);
  const circ = 2 * Math.PI * 120;
  let cum = 0;
  const segs = tokenomics.map((s) => {
    const d = (s.pct / 100) * circ;
    const o = cum;
    cum += d;
    return { ...s, d, o };
  });

  return (
    <section id="tokenomics" className="relative px-6 py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/15 to-transparent" />
      <div className="mx-auto max-w-5xl" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <Heading
            tag={t("explorer.tokenomics.tag")}
            title={
              <>
                {t("explorer.tokenomics.titleA")}{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg,#67e8f9,#a78bfa)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("explorer.tokenomics.titleB")}
                </span>
              </>
            }
            sub={t("explorer.tokenomics.subtitle")}
          />
        </motion.div>
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-center">
          <motion.div className="relative flex-shrink-0" initial={{ opacity: 0, scale: 0.8 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.3, duration: 0.8 }}>
            <svg width={320} height={320} viewBox="0 0 320 320">
              <circle cx={160} cy={160} r={120} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={36} />
              {segs.map((s, i) => (
                <motion.circle
                  key={s.label}
                  cx={160}
                  cy={160}
                  r={120}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={active?.label === s.label ? 44 : 36}
                  strokeDasharray={`${s.d} ${circ - s.d}`}
                  strokeDashoffset={circ / 4 - s.o}
                  style={{ cursor: "pointer", filter: active?.label === s.label ? `drop-shadow(0 0 10px ${s.color})` : "none", transition: "stroke-width 0.3s ease, filter 0.3s ease" }}
                  initial={{ strokeDasharray: `0 ${circ}` }}
                  animate={inView ? { strokeDasharray: `${s.d} ${circ - s.d}` } : {}}
                  transition={{ delay: 0.5 + i * 0.15, duration: 0.9 }}
                  onMouseEnter={() => setActive(s)}
                  onMouseLeave={() => setActive(null)}
                />
              ))}
              <text x={160} y={148} textAnchor="middle" fill={active?.color ?? "white"} fontSize="30" fontWeight="800">
                {active ? `${active.pct}%` : t("explorer.tokenomics.centerDefaultLabel")}
              </text>
              <text x={160} y={170} textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="10">
                {active ? active.label : t("explorer.tokenomics.centerDefaultSub")}
              </text>
            </svg>
          </motion.div>

          <div className="w-full max-w-md space-y-3">
            {tokenomics.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: 30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                className={`cursor-pointer rounded-2xl border p-4 transition-all duration-300 ${
                  active?.label === s.label ? "border-white/20 bg-white/8" : "border-white/6 bg-white/3 hover:border-white/12 hover:bg-white/5"
                }`}
                onMouseEnter={() => setActive(s)}
                onMouseLeave={() => setActive(null)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}80` }} />
                    <span className="text-sm font-semibold text-white">{s.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: s.color }}>
                      {s.pct}%
                    </div>
                    <div className="text-xs text-slate-500">{s.amount} SHUI</div>
                  </div>
                </div>
                <AnimatePresence>
                  {active?.label === s.label && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <p className="mt-3 border-t border-white/6 pt-3 text-xs text-slate-400">{s.role}</p>
                      <p className="mt-1 truncate font-mono text-[10px] text-slate-600">{s.wallet}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const WalletsSection: FC = () => {
  const { t } = useTranslation("common");
  const { ref, inView } = useReveal();
  const [copied, setCopied] = useState<string | null>(null);

  const wallets = [
    { label: t("explorer.wallets.items.0.label"), pct: 25, amount: t("explorer.wallets.items.0.amount"), color: "#38bdf8", icon: t("explorer.wallets.items.0.icon"), desc: t("explorer.wallets.items.0.desc"), addr: t("explorer.wallets.items.0.addr") },
    { label: t("explorer.wallets.items.1.label"), pct: 30, amount: t("explorer.wallets.items.1.amount"), color: "#22d3ee", icon: t("explorer.wallets.items.1.icon"), desc: t("explorer.wallets.items.1.desc"), addr: t("explorer.wallets.items.1.addr") },
    { label: t("explorer.wallets.items.2.label"), pct: 20, amount: t("explorer.wallets.items.2.amount"), color: "#818cf8", icon: t("explorer.wallets.items.2.icon"), desc: t("explorer.wallets.items.2.desc"), addr: t("explorer.wallets.items.2.addr") },
    { label: t("explorer.wallets.items.3.label"), pct: 15, amount: t("explorer.wallets.items.3.amount"), color: "#60a5fa", icon: t("explorer.wallets.items.3.icon"), desc: t("explorer.wallets.items.3.desc"), addr: t("explorer.wallets.items.3.addr") },
    { label: t("explorer.wallets.items.4.label"), pct: 10, amount: t("explorer.wallets.items.4.amount"), color: "#a78bfa", icon: t("explorer.wallets.items.4.icon"), desc: t("explorer.wallets.items.4.desc"), addr: t("explorer.wallets.items.4.addr") },
  ];

  const copy = (a: string) => {
    navigator.clipboard.writeText(a);
    setCopied(a);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section className="relative px-6 py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/15 to-transparent" />
      <div className="mx-auto max-w-5xl" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <Heading
            tag={t("explorer.wallets.tag")}
            title={
              <>
                {t("explorer.wallets.titleA")}{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg,#38bdf8,#67e8f9)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("explorer.wallets.titleB")}
                </span>
              </>
            }
            sub={t("explorer.wallets.subtitle")}
          />
        </motion.div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((w, i) => (
            <motion.div
              key={w.label}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 + 0.2, duration: 0.6 }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-6 transition-all duration-300 hover:border-white/15"
            >
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${w.color}60, transparent)` }} />
              <div
                className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(circle at 50% 0%, ${w.color}08, transparent 60%)` }}
              />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: `${w.color}15`, border: `1px solid ${w.color}25` }}>
                      {w.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold leading-tight text-white">{w.label}</div>
                      <div className="text-xs font-semibold" style={{ color: w.color }}>
                        {w.pct}% — {w.amount} SHUI
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-slate-400">{w.desc}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-black/30 px-2 py-1.5 font-mono text-[11px] text-slate-500">
                    {w.addr.slice(0, 8)}...{w.addr.slice(-6)}
                  </code>
                  <button
                    onClick={() => copy(w.addr)}
                    className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                  >
                    {copied === w.addr ? t("explorer.wallets.copied") : t("explorer.wallets.copy")}
                  </button>
                  <a
                    href={`https://solscan.io/account/${w.addr}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                  >
                    {t("explorer.wallets.view")}
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const LevelsSection: FC = () => {
  const { t } = useTranslation("common");
  const { ref, inView } = useReveal();

  const levels = [
    {
      name: t("explorer.levels.items.0.name"),
      emoji: t("explorer.levels.items.0.emoji"),
      color: "#38bdf8",
      role: t("explorer.levels.items.0.role"),
      actions: [
        t("explorer.levels.items.0.actions.0"),
        t("explorer.levels.items.0.actions.1"),
        t("explorer.levels.items.0.actions.2"),
      ],
      multiplier: t("explorer.levels.items.0.multiplier"),
      tokens: t("explorer.levels.items.0.tokens"),
    },
    {
      name: t("explorer.levels.items.1.name"),
      emoji: t("explorer.levels.items.1.emoji"),
      color: "#22d3ee",
      role: t("explorer.levels.items.1.role"),
      actions: [
        t("explorer.levels.items.1.actions.0"),
        t("explorer.levels.items.1.actions.1"),
        t("explorer.levels.items.1.actions.2"),
      ],
      multiplier: t("explorer.levels.items.1.multiplier"),
      tokens: t("explorer.levels.items.1.tokens"),
    },
    {
      name: t("explorer.levels.items.2.name"),
      emoji: t("explorer.levels.items.2.emoji"),
      color: "#818cf8",
      role: t("explorer.levels.items.2.role"),
      actions: [
        t("explorer.levels.items.2.actions.0"),
        t("explorer.levels.items.2.actions.1"),
        t("explorer.levels.items.2.actions.2"),
      ],
      multiplier: t("explorer.levels.items.2.multiplier"),
      tokens: t("explorer.levels.items.2.tokens"),
    },
    {
      name: t("explorer.levels.items.3.name"),
      emoji: t("explorer.levels.items.3.emoji"),
      color: "#6366f1",
      role: t("explorer.levels.items.3.role"),
      actions: [
        t("explorer.levels.items.3.actions.0"),
        t("explorer.levels.items.3.actions.1"),
        t("explorer.levels.items.3.actions.2"),
      ],
      multiplier: t("explorer.levels.items.3.multiplier"),
      tokens: t("explorer.levels.items.3.tokens"),
    },
  ];

  const [active, setActive] = useState(0);

  return (
    <section id="niveaux" className="relative px-6 py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent" />
      <div className="mx-auto max-w-5xl" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <Heading
            tag={t("explorer.levels.tag")}
            title={
              <>
                {t("explorer.levels.titleA")}{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg,#67e8f9,#a78bfa)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("explorer.levels.titleB")}
                </span>
              </>
            }
            sub={t("explorer.levels.subtitle")}
          />
        </motion.div>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          {levels.map((l, i) => (
            <motion.button
              key={l.name}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.1 + 0.3 }}
              onClick={() => setActive(i)}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300"
              style={
                active === i
                  ? {
                      background: `linear-gradient(135deg, ${l.color}25, ${l.color}10)`,
                      border: `1px solid ${l.color}40`,
                      color: "white",
                      boxShadow: `0 0 20px ${l.color}20`,
                    }
                  : {
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.03)",
                      color: "rgba(148,163,184,1)",
                    }
              }
            >
              {l.emoji} {l.name}
            </motion.button>
          ))}
        </div>

        <AnimatePresence exitBeforeEnter>
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border p-8"
            style={{ borderColor: `${levels[active].color}30`, background: `linear-gradient(135deg, ${levels[active].color}06, transparent)` }}
          >
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <div className="flex-shrink-0 text-center">
                <motion.div className="mb-4 text-7xl" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>
                  {levels[active].emoji}
                </motion.div>
                <h3 className="text-2xl font-extrabold" style={{ color: levels[active].color }}>
                  {levels[active].name}
                </h3>
                <p className="mx-auto mt-1 max-w-[200px] text-sm text-slate-400">{levels[active].role}</p>
                <div className="mt-5 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{t("explorer.levels.multiplier")}</span>
                    <span className="rounded-full px-3 py-1 text-sm font-extrabold" style={{ background: `${levels[active].color}20`, color: levels[active].color }}>
                      {levels[active].multiplier}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {t("explorer.levels.rewards")} : <span className="font-semibold text-white">{levels[active].tokens}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">{t("explorer.levels.actionsTitle")}</h4>
                <div className="space-y-3">
                  {levels[active].actions.map((a, ai) => (
                    <motion.div
                      key={a}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: ai * 0.08 }}
                      className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/3 px-4 py-3"
                    >
                      <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: levels[active].color, boxShadow: `0 0 8px ${levels[active].color}` }} />
                      <span className="text-sm text-slate-300">{a}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-center gap-2">
          {levels.map((l, i) => (
            <div key={l.name} className="flex items-center gap-2">
              <button
                onClick={() => setActive(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? 28 : 10,
                  height: 10,
                  background: i <= active ? l.color : "rgba(255,255,255,0.1)",
                  boxShadow: i === active ? `0 0 12px ${l.color}` : "none",
                }}
              />
              {i < levels.length - 1 && (
                <div
                  className="h-[1px] w-8"
                  style={{
                    background: i < active ? `linear-gradient(90deg, ${l.color}, ${levels[i + 1].color})` : "rgba(255,255,255,0.08)",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const MissionsSection: FC = () => {
  const { t } = useTranslation("common");
  const { ref, inView } = useReveal();

  const allLabel = t("explorer.missions.all");
  const cat0 = t("explorer.missions.cats.0");
  const cat1 = t("explorer.missions.cats.1");
  const cat2 = t("explorer.missions.cats.2");
  const cat3 = t("explorer.missions.cats.3");

  const cats = [allLabel, cat0, cat1, cat2, cat3];

  const missions = [
    { cat: cat0, icon: t("explorer.missions.items.0.icon"), title: t("explorer.missions.items.0.title"), desc: t("explorer.missions.items.0.desc"), reward: t("explorer.missions.items.0.reward"), color: "#38bdf8" },
    { cat: cat0, icon: t("explorer.missions.items.1.icon"), title: t("explorer.missions.items.1.title"), desc: t("explorer.missions.items.1.desc"), reward: t("explorer.missions.items.1.reward"), color: "#38bdf8" },
    { cat: cat1, icon: t("explorer.missions.items.2.icon"), title: t("explorer.missions.items.2.title"), desc: t("explorer.missions.items.2.desc"), reward: t("explorer.missions.items.2.reward"), color: "#22d3ee" },
    { cat: cat1, icon: t("explorer.missions.items.3.icon"), title: t("explorer.missions.items.3.title"), desc: t("explorer.missions.items.3.desc"), reward: t("explorer.missions.items.3.reward"), color: "#22d3ee" },
    { cat: cat2, icon: t("explorer.missions.items.4.icon"), title: t("explorer.missions.items.4.title"), desc: t("explorer.missions.items.4.desc"), reward: t("explorer.missions.items.4.reward"), color: "#818cf8" },
    { cat: cat2, icon: t("explorer.missions.items.5.icon"), title: t("explorer.missions.items.5.title"), desc: t("explorer.missions.items.5.desc"), reward: t("explorer.missions.items.5.reward"), color: "#818cf8" },
    { cat: cat3, icon: t("explorer.missions.items.6.icon"), title: t("explorer.missions.items.6.title"), desc: t("explorer.missions.items.6.desc"), reward: t("explorer.missions.items.6.reward"), color: "#6366f1" },
    { cat: cat3, icon: t("explorer.missions.items.7.icon"), title: t("explorer.missions.items.7.title"), desc: t("explorer.missions.items.7.desc"), reward: t("explorer.missions.items.7.reward"), color: "#6366f1" },
  ];

  const [cat, setCat] = useState(allLabel);
  const filtered = cat === allLabel ? missions : missions.filter((m) => m.cat === cat);

  return (
    <section id="missions" className="relative px-6 py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/15 to-transparent" />
      <div className="mx-auto max-w-5xl" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <Heading
            tag={t("explorer.missions.tag")}
            title={
              <>
                {t("explorer.missions.titleA")}{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg,#a78bfa,#67e8f9)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("explorer.missions.titleB")}
                </span>
              </>
            }
            sub={t("explorer.missions.subtitle")}
          />
        </motion.div>
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all duration-300 ${
                cat === c
                  ? "border border-cyan-500/30 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300"
                  : "border border-white/8 bg-white/3 text-slate-400 hover:bg-white/6 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatePresence>
            {filtered.map((m, i) => (
              <motion.div
                key={`${m.cat}-${m.title}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                whileHover={{ y: -5 }}
                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-5 transition-all duration-300 hover:border-white/15"
              >
                <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${m.color}, transparent)` }} />
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${m.color}10, transparent 60%)` }}
                />
                <div className="relative">
                  <div className="mb-3 flex items-start justify-between">
                    <span className="text-2xl">{m.icon}</span>
                    <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold" style={{ background: `${m.color}15`, color: m.color, borderColor: `${m.color}30` }}>
                      {m.cat}
                    </span>
                  </div>
                  <h4 className="mb-1 text-sm font-bold leading-tight text-white">{m.title}</h4>
                  <p className="mb-4 text-xs leading-relaxed text-slate-400">{m.desc}</p>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-500">{t("explorer.missions.rewardLabel")}</span>
                    <span className="font-extrabold" style={{ color: m.color }}>
                      {m.reward}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const LoopSection: FC = () => {
  const { t } = useTranslation("common");
  const { ref, inView } = useReveal();

  const loop = [
    { label: t("explorer.loop.items.0.label"), icon: t("explorer.loop.items.0.icon"), color: "#22d3ee", desc: t("explorer.loop.items.0.desc") },
    { label: t("explorer.loop.items.1.label"), icon: t("explorer.loop.items.1.icon"), color: "#38bdf8", desc: t("explorer.loop.items.1.desc") },
    { label: t("explorer.loop.items.2.label"), icon: t("explorer.loop.items.2.icon"), color: "#818cf8", desc: t("explorer.loop.items.2.desc") },
    { label: t("explorer.loop.items.3.label"), icon: t("explorer.loop.items.3.icon"), color: "#6366f1", desc: t("explorer.loop.items.3.desc") },
    { label: t("explorer.loop.items.4.label"), icon: t("explorer.loop.items.4.icon"), color: "#a78bfa", desc: t("explorer.loop.items.4.desc") },
  ];

  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => setStep((p) => (p + 1) % loop.length), 1800);
    return () => clearInterval(timer);
  }, [inView, loop.length]);

  const angle = 360 / loop.length;
  const R = 120;
  const cx = 160;
  const cy = 160;

  return (
    <section className="relative px-6 py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/15 to-transparent" />
      <div className="mx-auto max-w-5xl" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <Heading
            tag={t("explorer.loop.tag")}
            title={
              <>
                {t("explorer.loop.titleA")}{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg,#a5b4fc,#67e8f9)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("explorer.loop.titleB")}
                </span>
              </>
            }
            sub={t("explorer.loop.subtitle")}
          />
        </motion.div>
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-center">
          <div className="flex-shrink-0">
            <svg width={320} height={320} viewBox="0 0 320 320">
              <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="4 6" />
              {loop.map((s, i) => {
                const a1 = ((i * angle - 90) * Math.PI) / 180;
                const a2 = (((i + 1) * angle - 90) * Math.PI) / 180;
                const x1 = cx + R * Math.cos(a1);
                const y1 = cy + R * Math.sin(a1);
                const x2 = cx + R * Math.cos(a2);
                const y2 = cy + R * Math.sin(a2);
                return (
                  <motion.line
                    key={`line-${s.label}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={i === step ? loop[i].color : "rgba(255,255,255,0.08)"}
                    strokeWidth={i === step ? 2 : 1}
                    animate={{ opacity: i === step ? 1 : 0.25 }}
                    transition={{ duration: 0.4 }}
                  />
                );
              })}
              {loop.map((s, i) => {
                const a = ((i * angle - 90) * Math.PI) / 180;
                const x = cx + R * Math.cos(a);
                const y = cy + R * Math.sin(a);
                const isActive = i === step;
                return (
                  <g key={s.label} onClick={() => setStep(i)} style={{ cursor: "pointer" }}>
                    {isActive && (
                      <motion.circle
                        cx={x}
                        cy={y}
                        r={28}
                        fill={`${s.color}15`}
                        stroke={s.color}
                        strokeWidth={1}
                        animate={{ r: [24, 32, 24], opacity: [0.6, 0.15, 0.6] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                      />
                    )}
                    <circle cx={x} cy={y} r={22} fill={isActive ? `${s.color}25` : "rgba(255,255,255,0.04)"} stroke={isActive ? s.color : "rgba(255,255,255,0.1)"} strokeWidth={isActive ? 1.5 : 1} />
                    <text x={x} y={y + 6} textAnchor="middle" fontSize="15" fill={isActive ? "white" : "rgba(255,255,255,0.4)"}>
                      {s.icon}
                    </text>
                  </g>
                );
              })}
              <circle cx={cx} cy={cy} r={34} fill="rgba(56,189,248,0.07)" stroke="rgba(56,189,248,0.2)" strokeWidth={1} />
              <text x={cx} y={cx - 6} textAnchor="middle" fontSize="13" fill="rgba(255,255,255,0.9)" fontWeight="bold">
                {t("explorer.loop.centerTitle")}
              </text>
              <text x={cx} y={cx + 10} textAnchor="middle" fontSize="9" fill="rgba(148,163,184,0.5)">
                {t("explorer.loop.centerSub")}
              </text>
            </svg>
          </div>
          <div className="w-full max-w-xs space-y-2">
            {loop.map((s, i) => (
              <motion.div
                key={s.label}
                onClick={() => setStep(i)}
                className="flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-300"
                style={{ borderColor: step === i ? `${s.color}35` : "rgba(255,255,255,0.06)", background: step === i ? `${s.color}08` : "rgba(255,255,255,0.02)" }}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: step === i ? `${s.color}20` : "rgba(255,255,255,0.04)" }}>
                  {s.icon}
                </div>
                <div>
                  <div className={`text-sm font-bold ${step === i ? "text-white" : "text-slate-500"}`}>{s.label}</div>
                  <div className="text-xs text-slate-600">{s.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const RoadmapSection: FC = () => {
  const { t } = useTranslation("common");
  const { ref, inView } = useReveal();

  const roadmap = [
    {
      q: t("explorer.roadmap.items.0.q"),
      title: t("explorer.roadmap.items.0.title"),
      target: t("explorer.roadmap.items.0.target"),
      items: [
        t("explorer.roadmap.items.0.list.0"),
        t("explorer.roadmap.items.0.list.1"),
        t("explorer.roadmap.items.0.list.2"),
        t("explorer.roadmap.items.0.list.3"),
      ],
      done: true,
    },
    {
      q: t("explorer.roadmap.items.1.q"),
      title: t("explorer.roadmap.items.1.title"),
      target: t("explorer.roadmap.items.1.target"),
      items: [
        t("explorer.roadmap.items.1.list.0"),
        t("explorer.roadmap.items.1.list.1"),
        t("explorer.roadmap.items.1.list.2"),
        t("explorer.roadmap.items.1.list.3"),
      ],
      done: false,
    },
    {
      q: t("explorer.roadmap.items.2.q"),
      title: t("explorer.roadmap.items.2.title"),
      target: t("explorer.roadmap.items.2.target"),
      items: [
        t("explorer.roadmap.items.2.list.0"),
        t("explorer.roadmap.items.2.list.1"),
        t("explorer.roadmap.items.2.list.2"),
        t("explorer.roadmap.items.2.list.3"),
      ],
      done: false,
    },
    {
      q: t("explorer.roadmap.items.3.q"),
      title: t("explorer.roadmap.items.3.title"),
      target: t("explorer.roadmap.items.3.target"),
      items: [
        t("explorer.roadmap.items.3.list.0"),
        t("explorer.roadmap.items.3.list.1"),
        t("explorer.roadmap.items.3.list.2"),
        t("explorer.roadmap.items.3.list.3"),
      ],
      done: false,
    },
  ];

  return (
    <section className="relative px-6 py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent" />
      <div className="mx-auto max-w-4xl" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <Heading
            tag={t("explorer.roadmap.tag")}
            title={
              <>
                {t("explorer.roadmap.titleA")}{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg,#67e8f9,#38bdf8)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("explorer.roadmap.titleB")}
                </span>
              </>
            }
            sub={t("explorer.roadmap.subtitle")}
          />
        </motion.div>
        <div className="relative space-y-0">
          <div className="absolute bottom-5 left-[18px] top-5 w-[1px] bg-gradient-to-b from-cyan-500/40 via-indigo-500/20 to-transparent" />
          {roadmap.map((p, i) => (
            <motion.div
              key={p.q}
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.15 + 0.2, duration: 0.6 }}
              className="relative flex gap-8 pb-10"
            >
              <div className="relative z-10 mt-1 flex-shrink-0">
                <div className={`flex h-[38px] w-[38px] items-center justify-center rounded-full border-2 text-sm ${p.done ? "border-cyan-400 bg-cyan-400/20 text-cyan-300" : "border-slate-600 bg-slate-900 text-slate-600"}`}>
                  {p.done ? "✓" : i + 1}
                </div>
                {p.done && <div className="absolute -inset-1 animate-pulse rounded-full border border-cyan-400/20" />}
              </div>
              <div className={`flex-1 rounded-2xl border p-6 ${p.done ? "border-cyan-500/20 bg-cyan-500/5" : "border-white/6 bg-white/3"}`}>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className={`text-xs font-extrabold uppercase tracking-widest ${p.done ? "text-cyan-400" : "text-slate-500"}`}>{p.q}</div>
                    <h4 className="mt-1 text-lg font-bold text-white">{p.title}</h4>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${p.done ? "border-cyan-500/30 bg-cyan-500/15 text-cyan-300" : "border-white/10 bg-white/5 text-slate-400"}`}>
                      {t("explorer.roadmap.goalLabel")} {p.target}
                    </span>
                    {p.done && (
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-300">
                        {t("explorer.roadmap.inProgress")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {p.items.map((it) => (
                    <div key={it} className="flex items-center gap-2 text-xs text-slate-400">
                      <div className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${p.done ? "bg-cyan-400" : "bg-slate-600"}`} />
                      {it}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TransparencySection: FC = () => {
  const { t } = useTranslation("common");
  const { ref, inView } = useReveal();
  const facts = [
    { icon: "🔓", label: t("explorer.transparency.items.0.label"), desc: t("explorer.transparency.items.0.desc"), href: SOLSCAN },
    { icon: "💼", label: t("explorer.transparency.items.1.label"), desc: t("explorer.transparency.items.1.desc"), href: null },
    { icon: "📢", label: t("explorer.transparency.items.2.label"), desc: t("explorer.transparency.items.2.desc"), href: null },
    { icon: "🗳️", label: t("explorer.transparency.items.3.label"), desc: t("explorer.transparency.items.3.desc"), href: null },
    { icon: "📊", label: t("explorer.transparency.items.4.label"), desc: t("explorer.transparency.items.4.desc"), href: SOCIALS.bubblemaps },
    { icon: "🌐", label: t("explorer.transparency.items.5.label"), desc: t("explorer.transparency.items.5.desc"), href: null },
  ];
  return (
    <section className="relative px-6 py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-500/15 to-transparent" />
      <div className="mx-auto max-w-5xl" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <Heading
            tag={t("explorer.transparency.tag")}
            title={
              <>
                {t("explorer.transparency.titleA")}{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg,#cbd5e1,#67e8f9)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("explorer.transparency.titleB")}
                </span>
              </>
            }
            sub={t("explorer.transparency.subtitle")}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-10 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/8 to-blue-500/5 p-6 text-center"
        >
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-400">{t("explorer.transparency.mintTitle")}</div>
          <code className="block break-all font-mono text-sm text-slate-300">{MINT}</code>
          <a href={SOLSCAN} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-400 transition-colors hover:text-cyan-300">
            {t("explorer.transparency.verify")}
          </a>
        </motion.div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08 + 0.3, duration: 0.5 }}
              className={`rounded-xl border border-white/8 bg-white/3 p-5 transition-all duration-300 ${f.href ? "cursor-pointer hover:border-white/15 hover:bg-white/5" : ""}`}
              onClick={() => f.href && window.open(f.href, "_blank")}
            >
              <div className="mb-2 flex items-center gap-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm font-bold text-white">{f.label}</span>
                {f.href && <span className="ml-auto text-xs text-slate-600">↗</span>}
              </div>
              <p className="text-xs leading-relaxed text-slate-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection: FC = () => {
  const { t } = useTranslation("common");
  const { ref, inView } = useReveal(0.1);

  const acts = [
    { label: t("explorer.cta.actions.0.label"), icon: t("explorer.cta.actions.0.icon"), href: SOCIALS.tg, primary: true, desc: t("explorer.cta.actions.0.desc") },
    { label: t("explorer.cta.actions.1.label"), icon: t("explorer.cta.actions.1.icon"), href: SOCIALS.x, primary: false, desc: t("explorer.cta.actions.1.desc") },
    { label: t("explorer.cta.actions.2.label"), icon: t("explorer.cta.actions.2.icon"), href: SOCIALS.ig, primary: false, desc: t("explorer.cta.actions.2.desc") },
    { label: t("explorer.cta.actions.3.label"), icon: t("explorer.cta.actions.3.icon"), href: SOLSCAN, primary: false, desc: t("explorer.cta.actions.3.desc") },
  ];

  return (
    <section id="rejoindre" className="relative overflow-hidden px-6 py-36">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent" />
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div className="relative mx-auto max-w-3xl text-center" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
          <motion.div className="mb-6 text-6xl" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }}>
            🌊
          </motion.div>
          <Tag>{t("explorer.cta.tag")}</Tag>
          <h2 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            {t("explorer.cta.titleA")}{" "}
            <span
              style={{
                background: "linear-gradient(135deg,#67e8f9,#38bdf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("explorer.cta.titleB")}
            </span>
            <br />
            <span className="text-3xl text-slate-300 sm:text-4xl">{t("explorer.cta.titleC")}</span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-slate-400">{t("explorer.cta.subtitle")}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {acts.map((a, i) => (
            <motion.a
              key={a.label}
              href={a.href}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 + i * 0.1 }}
              whileHover={{ y: -5 }}
              className={`group flex flex-col items-center gap-2 rounded-2xl border p-5 text-center transition-all duration-300 ${
                a.primary
                  ? "border-cyan-500/40 bg-gradient-to-b from-cyan-500/15 to-transparent hover:border-cyan-500/60 hover:from-cyan-500/25"
                  : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/6"
              }`}
            >
              <span className="text-3xl transition-transform duration-200 group-hover:scale-110">{a.icon}</span>
              <span className="text-sm font-bold text-white">{a.label}</span>
              <span className="text-xs text-slate-500">{a.desc}</span>
            </motion.a>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.8 }} className="mt-12 rounded-2xl border border-white/6 bg-white/3 p-5">
          <div className="mb-1 text-xs text-slate-500">{t("explorer.cta.tokenLabel")}</div>
          <code className="break-all font-mono text-xs text-slate-400">{MINT}</code>
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 1 }} className="mt-8 text-xs text-slate-700">
          {t("explorer.cta.disclaimer")}
        </motion.p>
      </div>
    </section>
  );
};

const Nav: FC = () => {
  const { t } = useTranslation("common");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = [
    { l: t("explorer.nav.vision"), h: "#vision" },
    { l: t("explorer.nav.tokenomics"), h: "#tokenomics" },
    { l: t("explorer.nav.levels"), h: "#niveaux" },
    { l: t("explorer.nav.missions"), h: "#missions" },
  ];

  return (
    <motion.nav className="fixed left-1/2 top-4 z-50 w-auto -translate-x-1/2" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
      <div className={`flex items-center gap-1 rounded-2xl px-3 py-2 transition-all duration-500 ${scrolled ? "border border-white/10 bg-black/70 shadow-2xl backdrop-blur-xl" : ""}`}>
        <Link href="/" passHref>
          <a className="mr-2 flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-white/8">
            <div className="relative h-6 w-6 overflow-hidden rounded-full ring-1 ring-white/20">
              <Image src="/shui-token.png" alt="SHUI" layout="fill" objectFit="cover" />
            </div>
            <span className="text-xs font-extrabold tracking-wider text-white">{t("explorer.nav.brand")}</span>
          </a>
        </Link>
        {links.map((l) => (
          <a key={l.l} href={l.h} className="hidden rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-400 transition-all hover:bg-white/8 hover:text-white sm:block">
            {l.l}
          </a>
        ))}
        <a
          href={SOCIALS.tg}
          target="_blank"
          rel="noreferrer"
          className="ml-2 rounded-xl px-4 py-1.5 text-xs font-extrabold text-white transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.7), rgba(99,102,241,0.7))" }}
        >
          {t("explorer.nav.join")}
        </a>
      </div>
    </motion.nav>
  );
};

export const ExplorerView: FC = () => (
  <div className="min-h-screen bg-[#050d1a] text-white" style={{ fontFamily: "-apple-system, 'Segoe UI', sans-serif" }}>
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 100% 60% at 50% -10%, rgba(56,189,248,0.05) 0%, transparent 55%)" }} />
      <div
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
    </div>
    <Nav />
    <main className="relative z-10">
      <Hero />
      <WhySection />
      <FoundationsSection />
      <TokenomicsSection />
      <WalletsSection />
      <LevelsSection />
      <MissionsSection />
      <LoopSection />
      <RoadmapSection />
      <TransparencySection />
      <CTASection />
    </main>
  </div>
);
