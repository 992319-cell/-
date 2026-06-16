// ─── nav.js ──────────────────────────────────────
// 漢堡選單 toggle（全站共用）
// ─────────────────────────────────────────────────

(function () {
  const nav = document.querySelector("nav");
  const toggle = document.querySelector(".nav-toggle");
  if (!nav || !toggle) return;

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "關閉選單" : "開啟選單");
  });

  // 點選單裡的連結後自動關閉
  nav.querySelectorAll(".links a").forEach((a) => {
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "開啟選單");
    });
  });
})();
