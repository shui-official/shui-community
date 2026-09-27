/* =====================================================================
   SHUI — effets "eau"
   1. Hero : shader WebGL (caustiques + surface + lumière)
   2. Origine : particules qui montent autour du glyphe 水
   3. Communauté : bassin interactif (ondes au clic / toucher)
   Aucun appel réseau. Purement visuel.
   ===================================================================== */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- 1. HERO WEBGL ---------------- */
  function initHero() {
    const cv = document.getElementById("waterGL");
    if (!cv) return;
    const gl = cv.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) { cv.remove(); return; }

    const vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    const fs = `
precision highp float;
uniform vec2 r; uniform float t; uniform vec2 m;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
float caust(vec2 p,float t){
  vec2 q=p; float c=0.;
  for(int i=0;i<3;i++){
    float fi=float(i);
    q+=vec2(sin(q.y*1.7+t*.6+fi),cos(q.x*1.5-t*.5+fi*1.3))*.35;
    c+=abs(sin(q.x*2.2+q.y*1.8));
  }
  return pow(1.-clamp(c/3.,0.,1.),5.);
}
void main(){
  vec2 uv=gl_FragCoord.xy/r; vec2 p=(gl_FragCoord.xy-.5*r)/r.y;
  float T=t*.35;
  // depth gradient
  vec3 top=vec3(.035,.09,.17), mid=vec3(.02,.05,.1), bot=vec3(.01,.02,.04);
  vec3 col=mix(bot,mid,smoothstep(0.,.55,uv.y)); col=mix(col,top,smoothstep(.55,1.,uv.y));
  // flowing body
  vec2 w=p*1.6+vec2(fbm(p*1.2+T*.4),fbm(p*1.1-T*.3))*1.2;
  float f=fbm(w+vec2(T*.2,-T*.15));
  col+=vec3(.05,.14,.26)*f*.9;
  // caustics, stronger near the top (light from surface)
  float c=caust(p*3.+vec2(0.,T*.6),t*.8);
  float c2=caust(p*5.5-vec2(T*.3,0.),t*1.1);
  float light=smoothstep(-.2,.9,uv.y);
  col+=vec3(.35,.7,1.)*(c*.35+c2*.18)*light;
  // god rays from the top
  float ray=0.;
  for(int i=0;i<4;i++){float fi=float(i);
    ray+=smoothstep(.06,0.,abs(p.x*.9+(1.-uv.y)*(.18*sin(fi*2.1))+sin(T*.5+fi*1.7)*.35-(fi-1.5)*.32))*.25;}
  col+=vec3(.25,.55,.9)*ray*smoothstep(.05,1.,uv.y)*.55;
  // central glow (behind logo)
  float d=length(p-vec2(0.,.12));
  col+=vec3(.25,.6,1.)*exp(-d*d*7.)*.35;
  // mouse ripple glow
  vec2 mp=(m-.5*r)/r.y; float md=length(p-mp);
  col+=vec3(.3,.7,1.)*.12*exp(-md*6.)*(.6+.4*sin(md*40.-t*4.));
  // vignette
  col*=1.-.55*pow(length(uv-.5)*1.25,2.2);
  gl_FragColor=vec4(col,1.);
}`;
    function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; }
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) { cv.remove(); return; }
    const pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr); gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(pr, "r"), uT = gl.getUniformLocation(pr, "t"), uM = gl.getUniformLocation(pr, "m");

    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.75;
    let W = 0, H = 0, mx = 0, my = 0, tmx = 0, tmy = 0, visible = true;
    function resize() { W = Math.floor(cv.clientWidth * scale); H = Math.floor(cv.clientHeight * scale); cv.width = W; cv.height = H; gl.viewport(0, 0, W, H); tmx = mx = W / 2; tmy = my = H * .6; }
    resize(); window.addEventListener("resize", resize);
    cv.parentElement.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); tmx = (e.clientX - r.left) * scale; tmy = (r.height - (e.clientY - r.top)) * scale; });
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(cv);

    const t0 = performance.now();
    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible) return;
      mx += (tmx - mx) * .05; my += (tmy - my) * .05;
      gl.uniform2f(uR, W, H); gl.uniform1f(uT, reduce ? 12 : (now - t0) / 1000); gl.uniform2f(uM, mx, my);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    requestAnimationFrame(frame);
  }

  /* ---------------- 2. GLYPH PARTICLES ---------------- */
  function initGlyph() {
    const cv = document.getElementById("glyphCanvas");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    let W, H, dpr = Math.min(devicePixelRatio || 1, 2), parts = [], on = false;
    function resize() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    resize(); addEventListener("resize", resize);
    for (let i = 0; i < 70; i++) parts.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.8 + .3, s: Math.random() * .0012 + .0004, a: Math.random() });
    new IntersectionObserver((es) => { on = es[0].isIntersecting; }).observe(cv);
    (function loop() {
      requestAnimationFrame(loop);
      if (!on) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        if (!reduce) { p.y -= p.s; p.x += Math.sin(p.y * 12 + p.a * 6) * .0004; }
        if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); }
        const al = Math.sin(p.y * Math.PI) * .7;
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r, 0, 6.283);
        ctx.fillStyle = `rgba(170,225,255,${al})`; ctx.fill();
      }
    })();
  }

  /* ---------------- 3. POND RIPPLES ---------------- */
  function initPond() {
    const el = document.getElementById("pond"), cv = document.getElementById("pondCanvas");
    if (!el || !cv) return;
    const ctx = cv.getContext("2d");
    let W, H, dpr = Math.min(devicePixelRatio || 1, 2), rip = [], drops = [], on = false, last = 0;
    function resize() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    resize(); addEventListener("resize", resize);
    // ambient "drops" = members
    for (let i = 0; i < 140; i++) drops.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + .4, ph: Math.random() * 6.28 });
    function add(x, y, big) { rip.push({ x, y, t: 0, max: big ? Math.max(W, H) * .9 : 160 + Math.random() * 120, big }); }
    el.addEventListener("pointerdown", (e) => { const r = cv.getBoundingClientRect(); add(e.clientX - r.left, e.clientY - r.top, true); drops.push({ x: (e.clientX - r.left) / W, y: (e.clientY - r.top) / H, r: 2.4, ph: 0, me: 1 }); });
    new IntersectionObserver((es) => { on = es[0].isIntersecting; }).observe(cv);
    (function loop(now) {
      requestAnimationFrame(loop);
      if (!on) return;
      if (!reduce && now - last > 1400) { last = now; add(Math.random() * W, Math.random() * H, false); }
      ctx.clearRect(0, 0, W, H);
      const tt = now / 1000;
      for (const d of drops) {
        const a = .25 + .35 * (0.5 + 0.5 * Math.sin(tt * 1.2 + d.ph));
        ctx.beginPath(); ctx.arc(d.x * W, d.y * H, d.r, 0, 6.283);
        ctx.fillStyle = d.me ? "rgba(200,240,255,.95)" : `rgba(150,210,255,${a})`;
        if (d.me) { ctx.shadowColor = "rgba(140,210,255,.9)"; ctx.shadowBlur = 12; }
        ctx.fill(); ctx.shadowBlur = 0;
      }
      for (let i = rip.length - 1; i >= 0; i--) {
        const r = rip[i]; r.t += r.big ? 0.008 : 0.011;
        const e = 1 - Math.pow(1 - r.t, 3), rad = e * r.max, al = (1 - r.t) * (r.big ? .55 : .25);
        for (let k = 0; k < (r.big ? 3 : 2); k++) {
          const rr = rad - k * 18; if (rr <= 0) continue;
          ctx.beginPath(); ctx.ellipse(r.x, r.y, rr, rr * .9, 0, 0, 6.283);
          ctx.strokeStyle = `rgba(160,220,255,${al / (k + 1)})`; ctx.lineWidth = 1; ctx.stroke();
        }
        if (r.t >= 1) rip.splice(i, 1);
      }
    })(0);
    setTimeout(() => add(W / 2, H / 2, true), 600);
  }

  document.addEventListener("DOMContentLoaded", () => { initHero(); initGlyph(); initPond(); });
})();
