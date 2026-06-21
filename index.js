/* ============================================================
   anim.js — 首頁載入動畫
   1. Count-up：data-count-to 屬性的數字從 0 跑到 target
      可選 data-count-format="comma" 加千分位
   2. Scroll reveal：selector 列表內的元素掛 .reveal,進視野加 .in
   觸發方式：IntersectionObserver,只跑一次
   ============================================================ */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── 1. Count-up ─────────────────────────────────────────
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function runCountUp(el) {
    const target = parseInt(el.dataset.countTo, 10);
    const format = el.dataset.countFormat; // 'comma' or undefined
    if (isNaN(target)) return;

    const duration = 1200; // ms
    const start = performance.now();
    const formatter = format === 'comma'
      ? v => v.toLocaleString('en-US')
      : v => String(v);

    // prefers-reduced-motion:直接填終值
    if (prefersReduced) {
      el.textContent = formatter(target);
      return;
    }

    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const v = Math.round(target * easeOutCubic(t));
      el.textContent = formatter(v);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = formatter(target); // 確保最終值精準
    }
    requestAnimationFrame(tick);
  }

  // ─── 2. Reveal selector 清單 ─────────────────────────────
  // 章節主標題 + lede + 重要視覺元件,進視野淡入
  const revealSelectors = [
    'section > header h2',
    'section > header .lede',
    '.spread-hero',
    '.spectrum-block',
    '.spec-footnote',
    '.coverage-stats',
    '.coverage-grid',
    '.coverage-foot',
    '.feature-block',
    '.payoff-card',
    '.waitlist-form',
  ];

  function initReveals() {
    const els = document.querySelectorAll(revealSelectors.join(','));
    els.forEach(el => el.classList.add('reveal'));

    // 給 header 內 h2 + lede 錯開時間（lede 晚一拍）
    document.querySelectorAll('section > header .lede').forEach(el => {
      el.classList.add('reveal-d2');
    });
  }

  // ─── 3. IntersectionObserver ─────────────────────────────
  function initObserver() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;

        // 觸發 reveal
        if (el.classList.contains('reveal')) {
          el.classList.add('in');
        }
        // 觸發 count-up（元素本身或子元素有 data-count-to）
        const counters = el.matches('[data-count-to]') ? [el] : el.querySelectorAll('[data-count-to]');
        counters.forEach(runCountUp);

        io.unobserve(el);
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -8% 0px'
    });

    // observe 所有 reveal 元素
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    // observe count-up 容器(避免 reveal selector 沒包到的)
    document.querySelectorAll('[data-count-to]').forEach(el => {
      // 找最近的 reveal 祖先,若已 observe 就跳過
      const ancestor = el.closest('.reveal');
      if (!ancestor) io.observe(el);
    });
  }

  // ─── boot ────────────────────────────────────────────────
  function boot() {
    initReveals();
    initObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
