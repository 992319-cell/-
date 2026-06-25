// ─── shop-sidebar.js ─────────────────────────────
// 車行端側欄共用互動:漢堡抽屜 / 帳號 dropdown / walk-in CTA / 營業 toggle
// 依賴:DOM 結構符合 shop-app.css 的 .sidebar / .sidebar-burger / .sidebar-backdrop /
//      .sidebar-shop-btn / .sidebar-shop-menu / .sidebar-walkin / #shop-open-toggle
// ─────────────────────────────────────────────────

(function () {
  const body = document.body;
  const sidebar = document.getElementById("sidebar");
  const burger = document.getElementById("sidebar-burger");
  const backdrop = document.getElementById("sidebar-backdrop");

  function openDrawer() {
    body.classList.add("is-drawer-open");
    burger?.setAttribute("aria-expanded", "true");
  }
  function closeDrawer() {
    body.classList.remove("is-drawer-open");
    burger?.setAttribute("aria-expanded", "false");
  }
  burger?.addEventListener("click", () => {
    body.classList.contains("is-drawer-open") ? closeDrawer() : openDrawer();
  });
  backdrop?.addEventListener("click", closeDrawer);
  sidebar?.querySelectorAll(".sidebar-nav a").forEach((a) => {
    a.addEventListener("click", () => {
      if (window.innerWidth < 768) closeDrawer();
    });
  });

  // 帳號 dropdown
  const shopBtn = document.getElementById("sidebar-shop-btn");
  const shopMenu = document.getElementById("sidebar-shop-menu");
  shopBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = shopBtn.getAttribute("aria-expanded") === "true";
    shopBtn.setAttribute("aria-expanded", String(!open));
    shopMenu.hidden = open;
  });
  document.addEventListener("click", (e) => {
    if (!shopMenu || shopMenu.hidden) return;
    if (!e.target.closest(".sidebar-account")) {
      shopMenu.hidden = true;
      shopBtn.setAttribute("aria-expanded", "false");
    }
  });

  // walk-in CTA(Phase 3 才實作 modal,先 placeholder)
  document.getElementById("sidebar-walkin")?.addEventListener("click", () => {
    alert("新增現場工單 modal 開發中(Phase 3)");
  });

  // 營業 toggle:同步 label 文字
  document.getElementById("shop-open-toggle")?.addEventListener("change", (e) => {
    const label = e.target.nextElementSibling;
    if (label) label.textContent = e.target.checked ? "營業中" : "已打烊";
  });
})();
