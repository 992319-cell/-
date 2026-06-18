// ─── shop-dashboard.js ───────────────────────────
// 工單管理：tab 切換 + 接受/駁回（純前端 demo）
// 狀態：pending（待接單）/ in_progress（進行中）
//      / completed（已完成）/ rejected（已駁回）
// ─────────────────────────────────────────────────

const tabs = document.querySelectorAll(".otab");
const ordersWrap = document.querySelector(".orders-wrap");
const emptyState = document.querySelector(".orders-empty");

let currentTab = "pending";

// ─── tab 切換 ───────────────────────────────────
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    currentTab = tab.dataset.status;
    renderOrders();
  });
});

// ─── 根據 currentTab 顯示/隱藏工單 ────────────────
function renderOrders() {
  const orders = ordersWrap.querySelectorAll(".order");
  let visibleCount = 0;
  orders.forEach((order) => {
    const shouldShow = order.dataset.status === currentTab;
    order.classList.toggle("is-hidden", !shouldShow);
    if (shouldShow) visibleCount++;
  });
  emptyState.hidden = visibleCount > 0;
}

// ─── 更新各 tab 的數字徽章 ───────────────────────
function updateBadges() {
  const counts = { pending: 0, in_progress: 0, completed: 0, rejected: 0 };
  ordersWrap.querySelectorAll(".order").forEach((o) => {
    counts[o.dataset.status]++;
  });
  Object.entries(counts).forEach(([key, n]) => {
    const el = document.querySelector(`[data-count="${key}"]`);
    if (el) el.textContent = n;
  });
}

// ─── 接受 / 駁回（待接單 tab）────────────────────
// 接受 → 進行中（換 CTA 為「填寫完工」）
// 駁回 → 已駁回（換為 pill）
ordersWrap.addEventListener("click", (e) => {
  const btn = e.target.closest(".bapp, .brej, .bfill, .bnoshow");
  if (!btn) return;

  const order = btn.closest(".order");

  // 填寫完工：之後接完工頁面，先 alert 佔位
  if (btn.classList.contains("bfill")) {
    alert("（待開發）開啟完工填寫表單 → 填項目/金額/里程 → 客人現場簽名");
    return;
  }

  // 客人未到場：confirm → 淡出 → 從 DOM 移除
  if (btn.classList.contains("bnoshow")) {
    const ok = confirm(
      "確定標記此工單為「客人未到場」？\n標記後工單將取消，不會進入車歷與行情資料。",
    );
    if (!ok) return;
    order.classList.add("is-leaving");
    setTimeout(() => {
      order.remove();
      updateBadges();
      renderOrders();
    }, 350);
    return;
  }

  const isAccept = btn.classList.contains("bapp");
  const newStatus = isAccept ? "in_progress" : "rejected";

  order.classList.add("is-leaving");
  setTimeout(() => {
    order.dataset.status = newStatus;
    order.querySelector(".oact").innerHTML = isAccept
      ? '<button class="bfill">填寫完工</button><button class="bnoshow" title="客人未到場">客人未到</button>'
      : '<span class="ostatus is-rejected">已駁回 ✕</span>';
    order.classList.remove("is-leaving");
    updateBadges();
    renderOrders();
  }, 350);
});

// ─── 初始化 ─────────────────────────────────────
updateBadges();
renderOrders();
