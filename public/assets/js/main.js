/* =====================================================================
   SHUI — interactions de la vitrine
   - liens depuis config.js (null → bouton désactivé)
   - copie d'adresses, reveals, menu mobile, progression Goutte → Océan
   Aucune connexion wallet. Aucune transaction.
   ===================================================================== */
(function () {
  const C = window.SHUI_CONFIG || { links: {}, mobile: {} };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---- Liens vérifiés ---- */
  $$("[data-link]").forEach((a) => {
    const url = C.links[a.dataset.link];
    if (url) {
      a.href = url;
      if (url.startsWith("mailto:")) { a.removeAttribute("target"); }
      // Lien interne (page du site, ex. explorer.html) : même onglet, sans attributs de lien externe.
      else if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) { a.removeAttribute("target"); a.removeAttribute("rel"); }
    } else {
      a.removeAttribute("href");
      a.setAttribute("aria-disabled", "true");
      a.setAttribute("title", "Lien bientôt disponible");
      a.classList.add("is-soon");
      const go = a.querySelector(".go");
      if (go) go.innerHTML = '<span class="pill pill--soon">Prochainement</span>';
      if (a.classList.contains("btn") && !a.querySelector(".pill")) a.insertAdjacentHTML("beforeend", ' <span class="pill pill--soon">Bientôt</span>');
      a.addEventListener("click", (e) => e.preventDefault());
    }
  });

  /* ---- Téléchargement Android ---- */
  const dl = $("#dlAndroid"), meta = $("#dlMeta");
  if (dl) {
    const v = C.mobile.version || "0.2.10";
    if (C.mobile.androidApk) {
      dl.href = C.mobile.androidApk;
      dl.setAttribute("download", "");
      meta.textContent = `Version ${v} · APK Android` + (C.mobile.sha256 ? ` · SHA-256 ${C.mobile.sha256.slice(0, 10)}…` : "");
    } else {
      dl.setAttribute("aria-disabled", "true");
      dl.setAttribute("title", "Le fichier officiel v" + v + " sera publié prochainement");
      dl.addEventListener("click", (e) => e.preventDefault());
      meta.textContent = `Version ${v} · APK — disponible prochainement`;
    }
  }

  /* ---- Copie d'adresses ---- */
  const toast = $("#toast"); let tt;
  $$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    const txt = b.dataset.copy;
    try { await navigator.clipboard.writeText(txt); }
    catch { const ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (_) {} ta.remove(); }
    const ico = b.querySelector(".ico"); const prev = ico.textContent;
    b.classList.add("is-copied"); ico.textContent = "Copié";
    toast.textContent = "Adresse copiée · " + txt.slice(0, 4) + "…" + txt.slice(-4);
    toast.classList.add("show"); clearTimeout(tt);
    tt = setTimeout(() => { toast.classList.remove("show"); b.classList.remove("is-copied"); ico.textContent = prev; }, 1600);
  }));

  /* ---- Header ---- */
  const hdr = $("#hdr");
  const onScroll = () => hdr.classList.toggle("is-scrolled", scrollY > 24);
  onScroll(); addEventListener("scroll", onScroll, { passive: true });

  const burger = $("#burger");
  burger.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", open);
  });
  $$(".mnav a").forEach((a) => a.addEventListener("click", () => { document.body.classList.remove("menu-open"); burger.setAttribute("aria-expanded", false); }));

  // active nav
  const navLinks = $$(".nav a");
  const secs = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const so = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  secs.forEach((s) => so.observe(s));

  /* ---- Reveals ---- */
  const ro = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$(".rv, .alloc").forEach((el) => ro.observe(el));

  /* ---- Progression Goutte → Océan ---- */
  const flow = $("#flow"), fill = $("#flowFill");
  function flowProg() {
    if (!flow) return;
    const r = flow.getBoundingClientRect(), vh = innerHeight;
    const p = Math.min(1, Math.max(0, (vh * .85 - r.top) / (r.height * .9)));
    fill.style.width = (p * 100).toFixed(1) + "%";
  }
  addEventListener("scroll", flowProg, { passive: true }); flowProg();

  /* ---- Glow suiveur sur cartes ---- */
  $$("[data-glow]").forEach((c) => c.addEventListener("pointermove", (e) => {
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", e.clientX - r.left + "px");
    c.style.setProperty("--my", e.clientY - r.top + "px");
  }));

  /* ---- Pièce SHUI (tilt) ---- */
  const coin = $("#coin");
  if (coin && matchMedia("(hover:hover)").matches) {
    const face = coin.querySelector(".coin__face");
    coin.addEventListener("pointermove", (e) => {
      const r = coin.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      face.style.transform = `rotateY(${x * 22}deg) rotateX(${-y * 22}deg)`;
    });
    coin.addEventListener("pointerleave", () => { face.style.transform = ""; });
  }

  $("#yr").textContent = new Date().getFullYear();
})();
