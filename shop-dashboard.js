// ─── shop-dashboard.js ──────────────────────────
// 車行端首頁邏輯
// 側欄互動見 shop-sidebar.js
// 營收趨勢圖見 trend-chart.js
// 本檔負責:問候語(早/午/晚安)、KPI drill down 跳轉、action items 數字更新
// ────────────────────────────────────────────────

(function () {
  // ───── 動態問候語 + 今日日期 ─────
  const hour = new Date().getHours();
  let salutation = "您好";
  if (hour < 5) salutation = "夜安";
  else if (hour < 11) salutation = "早安";
  else if (hour < 14) salutation = "午安";
  else if (hour < 18) salutation = "午安";
  else salutation = "晚安";

  const greeting = document.getElementById("greeting");
  if (greeting) greeting.textContent = `${salutation}　光陽機車行`;

  const today = new Date();
  const weekday = "日一二三四五六"[today.getDay()];
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const dateEl = document.getElementById("today-date");
  if (dateEl) dateEl.textContent = `${y} / ${m} / ${d}　週${weekday}`;

  // ───── KPI drill down(卡片點擊跳轉)─────
  // demo 階段:本月工單數 → orders ?tab=completed
  //           平均客單金額 → orders ?tab=completed
  //           回頭率 → 暫無客戶頁,提示 alert
  const kpiArticles = document.querySelectorAll(".kpi article");
  const kpiTargets = [
    "shop-orders.html?tab=completed",
    "shop-orders.html?tab=completed",
    null,
  ];
  kpiArticles.forEach((art, i) => {
    art.addEventListener("click", (e) => {
      // 點到 ⓘ 不跳轉
      if (e.target.closest("button")) return;
      const target = kpiTargets[i];
      if (target) location.href = target;
      else alert("客戶列表開發中");
    });
  });
})();
