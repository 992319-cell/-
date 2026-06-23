// ─── appointments.js ─────────────────────────────
// 車主預約追蹤頁:tab 切換 + 取消預約 + 刪除紀錄 + 計數徽章
// 狀態:pending(待確認)/ in_progress(進行中)/ closed(未成立)
// closed = rejected + cancelled 合併顯示,可單筆刪或全部清
// ─────────────────────────────────────────────────

const tabs = document.querySelectorAll(".ap-tab");
const list = document.querySelector(".ap-list");
const emptyDefault = document.querySelector('[data-empty="default"]');
const emptyClosed = document.querySelector('[data-empty="closed"]');
const bulkBar = document.querySelector(".ap-bulk");
const bulkCount = document.querySelector("[data-bulk-count]");
const bulkClearBtn = document.querySelector(".ap-bulk-clear");

let currentTab = "pending";

// ─── tab 切換 ───
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active);
    });
    currentTab = tab.dataset.status;
    renderCards();
  });
});

// ─── 顯示/隱藏卡片 + 控制 bulk bar 跟 empty state ───
function renderCards() {
  const cards = list.querySelectorAll(".ap-card");
  let visibleCount = 0;
  cards.forEach((card) => {
    const shouldShow = card.dataset.status === currentTab;
    card.hidden = !shouldShow;
    if (shouldShow) visibleCount++;
  });

  // empty state:未成立 tab 用無 CTA 版,其他用有 CTA 版
  const isEmpty = visibleCount === 0;
  emptyDefault.hidden = !isEmpty || currentTab === "closed";
  emptyClosed.hidden = !isEmpty || currentTab !== "closed";

  // bulk bar:只在未成立 tab 且有卡片時顯示
  if (currentTab === "closed" && visibleCount > 0) {
    bulkBar.hidden = false;
    bulkCount.textContent = visibleCount;
  } else {
    bulkBar.hidden = true;
  }
}

// ─── 更新各 tab 計數徽章 ───
function updateBadges() {
  const counts = { pending: 0, in_progress: 0, closed: 0 };
  list.querySelectorAll(".ap-card").forEach((card) => {
    counts[card.dataset.status]++;
  });
  Object.entries(counts).forEach(([key, n]) => {
    const el = document.querySelector(`[data-count="${key}"]`);
    if (el) el.textContent = n;
  });
}

// ─── 將卡片變成「已取消」狀態(取消預約用) ───
function transitionToCancelled(card) {
  card.dataset.status = "closed";
  card.classList.add("is-closed");

  const badge = card.querySelector(".badge");
  if (badge) {
    badge.className = "badge cancel";
    badge.textContent = "已取消";
  }

  const actions = card.querySelector(".actions");
  if (actions) {
    actions.innerHTML = '<button type="button" class="delete">刪除紀錄</button>';
  }
}

// ─── 淡出後執行 callback ───
function fadeOut(card, done) {
  card.classList.add("is-leaving");
  setTimeout(() => {
    card.classList.remove("is-leaving");
    done();
  }, 350);
}

// ─── 列表內事件代理:取消 / 刪除 ───
list.addEventListener("click", (e) => {
  // 取消預約(待確認 tab)
  const cancelBtn = e.target.closest(".cancel");
  if (cancelBtn) {
    const card = cancelBtn.closest(".ap-card");
    const shop = card.querySelector(".shop")?.textContent || "";
    const date = card.querySelector("time strong")?.textContent || "";
    const ok = confirm(`確定取消這筆預約?\n\n${shop}\n${date}`);
    if (!ok) return;
    fadeOut(card, () => {
      transitionToCancelled(card);
      updateBadges();
      renderCards();
    });
    return;
  }

  // 單筆刪除(未成立 tab)
  const delBtn = e.target.closest(".delete");
  if (delBtn) {
    const card = delBtn.closest(".ap-card");
    const shop = card.querySelector(".shop")?.textContent || "";
    const date = card.querySelector("time strong")?.textContent || "";
    const ok = confirm(`確定刪除這筆紀錄?\n\n${shop}\n${date}\n\n刪除後無法復原`);
    if (!ok) return;
    fadeOut(card, () => {
      card.remove();
      updateBadges();
      renderCards();
    });
  }
});

// ─── 全部清除未成立紀錄 ───
bulkClearBtn.addEventListener("click", () => {
  const closedCards = list.querySelectorAll('.ap-card[data-status="closed"]');
  const n = closedCards.length;
  if (n === 0) return;

  const ok = confirm(`確定清除全部 ${n} 筆未成立紀錄?\n\n刪除後無法復原`);
  if (!ok) return;

  closedCards.forEach((card) => {
    card.classList.add("is-leaving");
  });
  setTimeout(() => {
    closedCards.forEach((card) => card.remove());
    updateBadges();
    renderCards();
  }, 350);
});

// ─── 初始化 ───
updateBadges();
renderCards();
