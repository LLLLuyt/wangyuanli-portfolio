/* ══════════════════════════════════════════════════════════
   王媛丽 · 求职作品集
   动效引擎：Lenis 平滑滚动 + GSAP / ScrollTrigger
   模块：滚动进度 · 灵动岛导航 · 分层揭示 · 数字滚动 · 图灯箱 · 抽卡
   ══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ══════════════ 1. 平滑滚动 (Lenis) ══════════════ */
  let lenis = null;
  if (typeof window.Lenis !== "undefined" && !REDUCED) {
    lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    if (hasGSAP && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  // 锚点跳转走 Lenis，避免两套滚动打架
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -96, duration: 1.15 });
      else target.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
    });
  });

  /* ══════════════ 2. 滚动进度条 ══════════════ */
  const progressBar = document.getElementById("scrollProgress");
  function updateProgress() {
    const top = window.scrollY || document.documentElement.scrollTop;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (docH > 0 ? (top / docH) * 100 : 0) + "%";
  }

  /* ══════════════ 3. 灵动岛：收缩 + 高亮当前章节 ══════════════ */
  const navIsland = document.getElementById("navIsland");
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sections = navLinks
    .map((l) => document.querySelector(l.getAttribute("href")))
    .filter(Boolean);
  const navToggle = document.getElementById("navToggle");
  const navToggleLabel = document.getElementById("navToggleLabel");

  function syncNav() {
    if (window.scrollY > 60) navIsland.classList.add("scrolled");
    else navIsland.classList.remove("scrolled");
    updateProgress();

    const probe = window.innerHeight * 0.34;
    let current = null;
    sections.forEach((s) => {
      const r = s.getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) current = s;
    });
    navLinks.forEach((l) => {
      l.classList.toggle("is-active", current && l.getAttribute("href") === "#" + current.id);
    });
    // 移动端按钮上显示当前章节名
    if (navToggleLabel) {
      const active = navLinks.find((l) => l.classList.contains("is-active"));
      navToggleLabel.textContent = active ? active.dataset.label : "王媛丽";
    }
  }

  /* 移动端：灵动岛展开 / 收起 */
  function setNavOpen(open) {
    navIsland.classList.toggle("is-open", open);
    if (navToggle) navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (navToggle) {
    navToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      setNavOpen(!navIsland.classList.contains("is-open"));
    });
    navLinks.forEach((l) => l.addEventListener("click", () => setNavOpen(false)));
    document.addEventListener("click", (e) => {
      if (navIsland.classList.contains("is-open") && !navIsland.contains(e.target)) setNavOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setNavOpen(false);
    });
  }

  let navTicking = false;
  window.addEventListener("scroll", () => {
    if (navTicking) return;
    navTicking = true;
    requestAnimationFrame(() => { syncNav(); navTicking = false; });
  }, { passive: true });
  syncNav();

  /* ══════════════ 4. 数字滚动 / 数码滚动 ══════════════ */
  function countUp(el) {
    const target = parseFloat(el.dataset.target || "0");
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const decimals = (el.dataset.decimals && parseInt(el.dataset.decimals, 10)) || 0;
    const fmt = (v) => prefix + (decimals ? v.toFixed(decimals) : Math.round(v).toString()) + suffix;
    if (REDUCED) { el.textContent = fmt(target); return; }
    el.textContent = fmt(0);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.7, ease: "power2.out",
      onUpdate() { el.textContent = fmt(obj.v); }
    });
  }

  // 主数字数码滚动：数值拆成逐位滚轮，从 0 滚到目标数字
  function rollDigits(el) {
    const target = (el.dataset.target || "").trim();
    const suffix = el.dataset.suffix || "";
    el.classList.add("is-roll");
    el.style.cssText = "display:flex;align-items:flex-end;user-select:none;";
    el.setAttribute("aria-label", target + suffix);
    el.innerHTML = "";
    const rolls = [];
    Array.from(target).forEach((ch) => {
      const end = parseInt(ch, 10);
      const col = document.createElement("span");
      col.className = "roll-col";
      col.style.cssText = "display:inline-block;height:1.18em;overflow:hidden;";
      col.setAttribute("aria-hidden", "true");
      const strip = document.createElement("span");
      strip.className = "roll-strip";
      strip.style.cssText = "display:block;";
      const cells = 10 + end;            // 先滚过 0-9 一轮，再落到目标数字
      for (let n = 0; n <= cells; n++) {
        const cell = document.createElement("i");
        cell.textContent = String(n % 10);
        cell.style.cssText = "display:block;height:1.18em;line-height:1.18em;font-style:normal;text-align:center;";
        strip.appendChild(cell);
      }
      col.appendChild(strip);
      el.appendChild(col);
      rolls.push({ strip, end, total: cells + 1 });
    });
    if (suffix) {
      const s = document.createElement("span");
      s.className = "roll-suffix";
      s.textContent = suffix;
      el.appendChild(s);
    }
    rolls.forEach(({ strip, total }, i) => {
      gsap.fromTo(strip,
        { yPercent: 0 },
        { yPercent: -((total - 1) / total) * 100, duration: 1.6, ease: "expo.out", delay: .12 * i }
      );
    });
  }

  /* ══════════════ 5. 分层揭示动画 ══════════════ */
  function initReveal() {
    const label = { opacity: 1, y: 0 };

    // Hero 入场
    const heroTl = gsap.timeline({ delay: .18 });
    heroTl
      .to(".hero-title .reveal-line", { y: 0, duration: 1.15, ease: "expo.out" })
      .to(".hero-badge", { opacity: 1, y: 0, duration: .8, ease: "power3.out" }, 0.12)
      .to(".hero-enline", { opacity: 1, y: 0, duration: .8, ease: "power3.out" }, "-=0.72")
      .to(".hero-subtitle", { opacity: 1, y: 0, duration: .8, ease: "power3.out" }, "-=0.66")
      .to(".hero-desc", { opacity: 1, y: 0, duration: .85, ease: "power3.out" }, "-=0.62")
      .to(".hero-actions", { opacity: 1, y: 0, duration: .8, ease: "power3.out" }, "-=0.6")
      .to(".hero-contact", { opacity: 1, y: 0, duration: .8, ease: "power3.out" }, "-=0.66")

    // 数据胶卷：桌面端钉住横向过片（逐帧计数）；窄屏退回原生横滑
    const strip = document.querySelector(".filmstrip");
    if (strip) {
      const viewport = strip.querySelector(".filmstrip-viewport");
      const track = strip.querySelector(".filmstrip-track");
      const frames = gsap.utils.toArray(".film-frame", track);
      const countEl = document.getElementById("filmCount");
      const barEl = document.getElementById("filmBar");
      const setCount = (i) => { if (countEl) countEl.textContent = String(i + 1).padStart(2, "0"); };
      const mm = gsap.matchMedia();

      mm.add("(min-width: 900px)", () => {
        document.documentElement.classList.add("has-filmpin");
        const travel = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
        const horizontal = gsap.to(track, {
          x: () => -travel(), ease: "none",
          scrollTrigger: {
            trigger: document.querySelector(".insight-stage"), start: "top 16%",
            end: () => "+=" + (travel() + 320),
            scrub: 1, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
            onUpdate: (self) => { if (barEl) barEl.style.transform = "scaleX(" + self.progress + ")"; }
          }
        });
        frames.forEach((f, i) => {
          ScrollTrigger.create({
            trigger: f, containerAnimation: horizontal, start: "left 74%",
            onEnter: () => { setCount(i); countUp(f.querySelector(".film-value")); },
            onEnterBack: () => setCount(i)
          });
        });
        return () => {
          document.documentElement.classList.remove("has-filmpin");
          if (barEl) barEl.style.transform = "";
        };
      });

      mm.add("(max-width: 899px)", () => {
        const onScroll = () => {
          const max = viewport.scrollWidth - viewport.clientWidth;
          const p = max > 0 ? viewport.scrollLeft / max : 0;
          if (barEl) barEl.style.transform = "scaleX(" + p + ")";
          if (countEl && frames[1]) {
            const step = frames[1].offsetLeft - frames[0].offsetLeft;
            setCount(Math.min(frames.length - 1, Math.round(viewport.scrollLeft / step)));
          }
        };
        viewport.addEventListener("scroll", onScroll, { passive: true });
        ScrollTrigger.create({
          trigger: strip, start: "top 80%", once: true,
          onEnter: () => frames.forEach((f, i) => setTimeout(() => countUp(f.querySelector(".film-value")), i * 140))
        });
        return () => {
          viewport.removeEventListener("scroll", onScroll);
          if (barEl) barEl.style.transform = "";
        };
      });
    }


    // 通用揭示
    gsap.utils.toArray(".reveal-item").forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: .95, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });

    // 时间线卡片：鼠标滚动驱动的渐显（scrub 与滚动进度绑定，走完即定格）
    // 注意：桌面端带横向位移更好看，但窄屏上未播放时的初始位移会把文档撑出横向滚动条
    const xShift = window.innerWidth > 900;
    gsap.utils.toArray(".tl-item").forEach((el) => {
      const off = xShift ? (el.classList.contains("tl-right") ? 46 : -46) : 0;
      gsap.fromTo(el,
        { opacity: 0, y: 90, x: off },
        {
          opacity: 1, y: 0, x: 0, ease: "power2.out",
          scrollTrigger: {
            trigger: el, start: "top 96%", end: "top 52%",
            scrub: .6
          }
        });
    });

    // 时间线轴线生长
    const axis = document.querySelector(".timeline-axis");
    if (axis) {
      const fill = document.createElement("span");
      fill.style.cssText = "position:absolute;left:0;top:0;width:100%;height:0;background:linear-gradient(to bottom,var(--accent),var(--primary));border-radius:2px;";
      axis.appendChild(fill);
      gsap.to(fill, {
        height: "100%", ease: "none",
        scrollTrigger: { trigger: ".timeline", start: "top 78%", end: "bottom 62%", scrub: .7 }
      });
    }

    // 数据带：底纹视差 + 主线扫过 + 主数字数码滚动 + 副项逐行入场
    const band = document.querySelector(".stats-band");
    if (band) {
      const water = band.querySelector(".stats-watermark");
      if (water) {
        gsap.fromTo(water, { yPercent: 22 }, {
          yPercent: -22, ease: "none",
          scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: true }
        });
      }
      ScrollTrigger.create({
        trigger: band, start: "top 72%", once: true,
        onEnter: () => {
          const rule = band.querySelector(".stats-rule");
          if (rule) gsap.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: "expo.out" });
          const line = band.querySelector(".stats-line");
          if (line) gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1.6, delay: .25, ease: "expo.out" });
          const hero = band.querySelector(".stat-value--hero");
          if (hero) rollDigits(hero);
          band.querySelectorAll(".stat-row").forEach((row, i) => {
            const rowLine = row.querySelector(".stat-row-line");
            if (rowLine) gsap.fromTo(rowLine, { scaleX: 0 }, { scaleX: 1, duration: 1, delay: .3 + i * .14, ease: "expo.out" });
            const v = row.querySelector(".stat-value");
            if (v) setTimeout(() => countUp(v), 420 + i * 140);
          });
        }
      });
    }

    // 洞察故事栏：顶线绘制
    gsap.utils.toArray(".story-rule").forEach((el) => {
      gsap.fromTo(el, { scaleX: 0 }, {
        scaleX: 1, duration: 1.1, ease: "expo.out",
        scrollTrigger: { trigger: el.parentElement, start: "top 88%", once: true }
      });
    });

    // 作品块：入场（封面与正文对向错位）+ 数据条填充
    gsap.utils.toArray(".project-block").forEach((block) => {
      const flip = block.classList.contains("project-flip");
      const cover = block.querySelector(".project-cover");
      const body = block.querySelector(".project-body");
      const tl = gsap.timeline({
        scrollTrigger: { trigger: block, start: "top 82%", once: true },
        onStart: () => {
          block.classList.add("is-in-view");
          block.querySelectorAll(".cd-num b").forEach(countUp);
        },
        onComplete: () => { gsap.set([cover, body], { clearProps: "transform" }); }
      });
      tl.fromTo(block, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: .8, ease: "power3.out" })
        .fromTo(cover, { x: flip ? 26 : -26 }, { x: 0, duration: 1, ease: "power3.out" }, .06)
        .fromTo(body, { x: flip ? -26 : 26 }, { x: 0, duration: 1, ease: "power3.out" }, .12);
    });

    // 章节标题轻微上浮
    gsap.utils.toArray(".section-title, .insight-title").forEach((el) => {
      gsap.from(el, {
        opacity: 0, y: 36, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true }
      });
    });
    // ⚠️ 海外背景的图片已带 .reveal-item，由上面的通用揭示统一处理，
    //    此处不可再绑动画 —— 两个 tween 抢同一属性会导致元素停在 opacity:0。
  }

  if (hasGSAP && window.ScrollTrigger && !REDUCED) {
    initReveal();
  } else {
    // 降级：直接显示
    document.querySelectorAll(".reveal-up, .reveal-item, .tl-item, .reveal-line")
      .forEach((el) => { el.style.opacity = "1"; el.style.transform = "none"; });
    document.querySelectorAll(".stats-rule, .stat-row-line, .story-rule")
      .forEach((el) => { el.style.transform = "none"; });
    document.querySelectorAll(".project-block").forEach((b) => b.classList.add("is-in-view"));
    document.querySelectorAll(".stat-value, .film-value").forEach((el) => {
      el.textContent = (el.dataset.prefix || "") + (el.dataset.target || "0") + (el.dataset.suffix || "");
    });
    const mb = document.getElementById("filmBar");
    if (mb) mb.style.transform = "scaleX(1)";
  }

  /* ══════════════ 6. 图片灯箱 ══════════════ */
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightboxImg");
  const lbCap = document.getElementById("lightboxCaption");
  const lbClose = document.getElementById("lightboxClose");

  function openLightbox(src, cap) {
    lbImg.src = src;
    lbImg.alt = cap || "";
    lbCap.textContent = cap || "";
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
  }
  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lenis) lenis.start();
  }

  document.querySelectorAll(".js-lightbox").forEach((btn) => {
    btn.addEventListener("click", () => openLightbox(btn.dataset.src, btn.dataset.cap));
  });
  lbClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox();
  });

  /* ══════════════ 7. 抽卡 ══════════════ */
  const POOLS = {
    skill: {
      name: "技能卡池",
      total: 8,
      cards: [
        { icon: '<path d="M12 2.6 16.4 11 12 21.4 7.6 11Z"/><circle cx="12" cy="11" r="1.5"/>', n: "写作与叙事策划", s: "深度报道 · 人物特稿 · 双语脚本 —— 先想清楚讲什么，再决定怎么拍。",
          p: "13 条短视频 · 2 万字文献综述 · 中英双语字幕", link: "#proj-ptsd", lk: "去看 PTSD 深度报道" },
        { icon: '<circle cx="10.6" cy="10.6" r="6.1"/><path d="M15.2 15.2 21 21"/><path d="M8.3 9h4.6M8.3 12.2h3.1"/>', n: "深度报道与调研", s: "把散乱素材组织成一条能打动人的线，是这份工作里最硬的手艺。",
          p: "2 家慈善机构 + 2 位退伍军人 + 1 位临床专家", link: "#proj-ptsd", lk: "去看采访与调研过程" },
        { icon: '<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2"/><path d="M12 3.4c2.5 2.3 3.9 5.2 3.9 8.6s-1.4 6.3-3.9 8.6c-2.5-2.3-3.9-5.2-3.9-8.6s1.4-6.3 3.9-8.6z"/>', n: "双语内容与本地化", s: "不只是翻译字面，而是让同一件事在两种语言里都成立。",
          p: "50 段中英双语字幕 · 英文出镜报道", link: "#proj-field", lk: "去看英文现场报道" },
        { icon: '<rect x="7.2" y="2.6" width="9.6" height="18.8" rx="2.6"/><path d="M12 16.4c-2.2-1.6-3.3-2.8-3.3-4.1 0-.9.7-1.6 1.6-1.6.6 0 1.2.3 1.7.9.5-.6 1.1-.9 1.7-.9.9 0 1.6.7 1.6 1.6 0 1.3-1.1 2.5-3.3 4.1z"/>', n: "海外社媒运营", s: "TikTok / Instagram / Facebook 三端矩阵的内容与投放节奏。",
          p: "海外社媒矩阵累计曝光 50 万+", link: "#proj-growth", lk: "去看出海增长项目" },
        { icon: '<path d="M21 3.4 3.2 10.6l6.6 2.4 2.4 6.6L21 3.4z"/><path d="M9.8 13l11.2-9.6"/>', n: "品牌出海策划", s: "从品牌定位、独立站内容到社媒冷启动，沉淀成可复用的 SOP。",
          p: "参与 30+ DTC 品牌冷启动", link: "#proj-growth", lk: "去看品牌孵化方式" },
        { icon: '<path d="M12 3.4c-4.8 0-8.6 3.7-8.6 8.3s3.8 8.3 8.6 8.3c1.1 0 1.9-.8 1.9-1.9 0-.5-.2-.9-.5-1.3-.3-.3-.5-.7-.5-1.2 0-1 .9-1.9 1.9-1.9h1.7c2 0 3.6-1.6 3.6-3.5C20.1 6.6 16.5 3.4 12 3.4z"/><circle cx="8" cy="10.2" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="7.6" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.9" cy="9.9" r="1.1" fill="currentColor" stroke="none"/>', n: "品牌视觉与 IP 体系", s: "从品牌内核到角色、空间、周边与社媒，做一整套能延展的识别。",
          p: "Aiyo 双 IP 角色 · 门店 / 包装 / 周边完整视觉体系", link: "#proj-aiyo", lk: "去看 Aiyo 品牌体系" },
        { icon: '<rect x="3.4" y="5.4" width="17.2" height="13.2" rx="1.6"/><path d="M8.6 5.4v13.2M15.4 5.4v13.2"/>', n: "剪辑与成片", s: "采访—剪辑—包装全流程；技术为叙事服务，而不是反过来。",
          p: "完成 4 部纪录 / 专题成片", link: "#proj-ptsd", lk: "去看纪录片成片" },
        { icon: '<rect x="9.1" y="2.8" width="5.8" height="11.2" rx="2.9"/><path d="M5.4 11.4a6.6 6.6 0 0 0 13.2 0"/><path d="M12 18v3.2M8.6 21.2h6.8"/>', n: "新闻采编与伦理合规", s: "事实核查、伦理审查与新闻工作流的规范意识。",
          p: "独立纪录片通过校级伦理委员会批准", link: "#proj-field", lk: "去看采编流程" }
      ],
    },
    life: {
      name: "兴趣卡池",
      total: 6,
      cards: [
        { icon: '<path d="M16.9 3.3 20.7 7.1 9.4 18.4l-4.7 1.3 1.3-4.7L16.9 3.3z"/><path d="M14.8 5.4l3.8 3.8"/>', n: "书法", s: "落笔之前要先想好结构。这大概是后来做长报道时最有用的习惯。",
          p: "简历在册技能" },
        { icon: '<path d="M4.2 8.4h2.9L8.7 5.9h6.6l1.6 2.5h2.9a1.6 1.6 0 0 1 1.6 1.6v7.6a1.6 1.6 0 0 1-1.6 1.6H4.2a1.6 1.6 0 0 1-1.6-1.6V10a1.6 1.6 0 0 1 1.6-1.6z"/><circle cx="12" cy="13.8" r="3.5"/>', n: "黑白摄影", s: "去掉颜色之后，剩下的才是结构 —— 也是《看不见的摄影家》的母题。",
          p: "视障摄影师 Des 的创作方式", link: "#proj-des", lk: "去看《看不见的摄影家》" },
        { icon: '<rect x="5.4" y="7" width="13.2" height="12.6" rx="2.2"/><path d="M9.4 7V4.6a1.6 1.6 0 0 1 1.6-1.6h2a1.6 1.6 0 0 1 1.6 1.6V7"/><path d="M9.6 19.6v1.6M14.4 19.6v1.6"/>', n: "旅居四国", s: "英 / 意 / 法 / 荷 —— 跨文化沟通不是课程，是每天要过的日子。",
          p: "旅居英 · 意 · 法 · 荷" },
        { icon: '<rect x="5.2" y="2.8" width="13.6" height="18.4" rx="2.2"/><circle cx="12" cy="9.4" r="2.7"/><path d="M8.6 16.6h6.8"/>', n: "十年美签", s: "随时可以出发的采访半径。",
          p: "十年美签（简历在册）" },
        { icon: '<path d="M12 6.4C10.4 5.1 8.3 4.4 5.6 4.4c-.9 0-1.6.1-2.2.2v14.2c.6-.1 1.3-.2 2.2-.2 2.7 0 4.8.7 6.4 2 1.6-1.3 3.7-2 6.4-2 .9 0 1.6.1 2.2.2V4.6c-.6-.1-1.3-.2-2.2-.2-2.7 0-4.8.7-6.4 2z"/><path d="M12 6.4v14.2"/>', n: "每周文献", s: "对全球政治新闻长期关注，习惯用论文而不是短视频补背景。",
          p: "每周阅读学术文献" },
        { icon: '<path d="M6.4 21.2V4.6A1.7 1.7 0 0 1 8.1 2.9h7.8a1.7 1.7 0 0 1 1.7 1.7v16.6"/><path d="M3.8 21.2h16.4"/><circle cx="14.6" cy="12" r="1" fill="currentColor" stroke="none"/>', n: "跨文化串门", s: "把春节讲给一群没听过的人，再听他们讲自己的节日。",
          p: "统筹“华人春节 · 中外文化交流”，50+ 国际学生参与" }
      ],
    }
  };

  const svgIcon = (inner, size) =>
    '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + "</svg>";

  /* ══════════════ 7. 抽卡 · 牌阵翻牌 ══════════════ */
  const CARD_TILTS = [-2, -1, 1.5, -.5, 2, -1.5, 1, -2];
  const STAR_SVG =
    '<svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">' +
    '<path d="M15 2L18.5 11.5L28 15L18.5 18.5L15 28L11.5 18.5L2 15L11.5 11.5L15 2Z" fill="url(#starGrad)"/></svg>';

  const cardRow = document.getElementById("cardRow");
  const skillsHint = document.getElementById("skillsHint");
  const poolTabs = Array.from(document.querySelectorAll(".pool-tab"));
  let pool = "skill";
  const flipped = { skill: new Set(), life: new Set() };

  function cur() { return POOLS[pool]; }

  function goWork(sel) {
    const t = document.querySelector(sel);
    if (!t) return;
    if (lenis) lenis.scrollTo(t, { offset: -96, duration: 1.2 });
    else t.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
    t.animate(
      [{ boxShadow: "0 0 0 0 rgba(224,87,61,0)" },
       { boxShadow: "0 0 0 6px rgba(224,87,61,.55)" },
       { boxShadow: "0 0 0 0 rgba(224,87,61,0)" }],
      { duration: 1500, easing: "ease-out" }
    );
  }

  function updateCounts() {
    poolTabs.forEach((tab) => {
      const n = tab.querySelector("b[data-count]");
      if (n) n.textContent = flipped[tab.dataset.pool].size;
    });
  }

  function renderCards() {
    const p = cur();
    cardRow.innerHTML = "";
    p.cards.forEach((card, i) => {
      const base = CARD_TILTS[i % CARD_TILTS.length];
      const el = document.createElement("div");
      el.className = "flip-card" + (flipped[pool].has(i) ? " flipped" : "");
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-label", card.n + "，点击翻牌");
      el.innerHTML =
        '<div class="flip-inner">' +
          '<div class="flip-face flip-front">' +
            '<span class="card-icon-tile">' + svgIcon(card.icon, 20) + '</span>' +
            '<h4 class="card-name">' + card.n + '</h4>' +
            '<p class="card-desc">' + card.s + '</p>' +
            '<p class="card-proof">' + card.p + '</p>' +
            (card.link ? '<a class="card-link" href="' + card.link + '">' + (card.lk || "查看对应作品") + ' →</a>' : "") +
          '</div>' +
          '<div class="flip-face flip-back">' +
            '<span class="card-back-star">' + STAR_SVG + '</span>' +
            '<span class="card-back-text">点击翻牌</span>' +
          '</div>' +
        '</div>';
      el.addEventListener("click", (e) => {
        if (e.target.closest(".card-link")) return;
        const on = el.classList.toggle("flipped");
        if (on) flipped[pool].add(i); else flipped[pool].delete(i);
        updateCounts();
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); }
      });
      if (hasGSAP && !REDUCED) {
        // 悬停：GSAP 平滑跟随（旋转 / 抬起 / 微放大）
        gsap.set(el, { rotation: base });
        const qR = gsap.quickTo(el, "rotation", { duration: .5, ease: "power3.out" });
        const qY = gsap.quickTo(el, "y", { duration: .5, ease: "power3.out" });
        const qS = gsap.quickTo(el, "scale", { duration: .5, ease: "power3.out" });
        el.addEventListener("mousemove", (e) => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - .5;
          qR(base + x * 6);
          qY(-6);
          qS(1.03);
        });
        el.addEventListener("mouseleave", () => { qR(base); qY(0); qS(1); });
      } else {
        el.style.transform = "rotate(" + base + "deg)";
        el.addEventListener("mousemove", (e) => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - .5;
          el.style.transform = "rotate(" + (base + x * 6) + "deg) translateY(-6px)";
        });
        el.addEventListener("mouseleave", () => {
          el.style.transform = "rotate(" + base + "deg)";
        });
      }
      const linkEl = el.querySelector(".card-link");
      if (linkEl) linkEl.addEventListener("click", (e) => { e.preventDefault(); goWork(card.link); });
      cardRow.appendChild(el);
    });
    skillsHint.textContent = "轻点卡片，翻转揭晓 · " + p.name.replace("池", "") + " " + p.total + " 张";
    updateCounts();
  }

  poolTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (tab.dataset.pool === pool) return;
      pool = tab.dataset.pool;
      poolTabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      renderCards();
    });
  });

  renderCards();

  /* ══════════════ 8. 视频：同一时间只播一个 ══════════════ */
  const videos = Array.from(document.querySelectorAll("video"));
  videos.forEach((v) => {
    v.addEventListener("play", () => {
      videos.forEach((o) => { if (o !== v && !o.paused) o.pause(); });
    });
  });

  /* ══════════════ 9. 经历卡：悬停随鼠标微倾斜 ══════════════ */
  if (hasGSAP && !REDUCED) {
    const TILT_MAX = 4.5;
    gsap.set(".tl-card", { transformPerspective: 900 });
    document.querySelectorAll(".tl-card").forEach((card) => {
      const rx = gsap.quickTo(card, "rotationX", { duration: .55, ease: "power3.out" });
      const ry = gsap.quickTo(card, "rotationY", { duration: .55, ease: "power3.out" });
      const ty = gsap.quickTo(card, "y", { duration: .55, ease: "power3.out" });
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        rx(-py * TILT_MAX);
        ry(px * TILT_MAX);
        ty(-5);
      });
      card.addEventListener("mouseleave", () => { rx(0); ry(0); ty(0); });
    });
  }

  /* ══════════════ 10. 图片加载完成后刷新触发器 ══════════════ */
  window.addEventListener("load", () => {
    if (!hasGSAP || !window.ScrollTrigger) return;
    ScrollTrigger.refresh();
    // 懒加载图片陆续就位后，高度会变化，需要再刷新一次定位
    const imgs = Array.from(document.images).filter((i) => !i.complete);
    if (!imgs.length) return;
    let pending = imgs.length;
    const done = () => { if (--pending <= 0) ScrollTrigger.refresh(); };
    imgs.forEach((i) => {
      i.addEventListener("load", done, { once: true });
      i.addEventListener("error", done, { once: true });
    });
    setTimeout(() => ScrollTrigger.refresh(), 1400);
  });
})();
