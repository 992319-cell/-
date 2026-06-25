// ─── history.js ──────────────────────────────────
// 車歷頁:車輛切換 + 紀錄展開 + localStorage 新紀錄注入
// ─────────────────────────────────────────────────

const LS_VEHICLE_HIST = "mqzx:vehicleHist";

// ─── 從 localStorage 讀車歷紀錄並 prepend ─────────
function loadAndInjectHistory() {
  let list;
  try { list = JSON.parse(localStorage.getItem(LS_VEHICLE_HIST) || "[]"); }
  catch { list = []; }
  if (!list.length) return;

  const ul = document.querySelector(".history-list");
  if (!ul) return;

  // 新的在最前(localStorage 第 0 筆 = 最新)
  // 反向插入,讓最新永遠在頂端
  list.forEach((rec) => {
    const li = document.createElement("li");
    li.className = "history-item is-new";
    const tagsHtml = (rec.services || [])
      .map((s) => `<span>${escapeHtml(s)}</span>`)
      .join("");
    const appealHref = `mailto:992319@gmail.com?subject=${encodeURIComponent("車歷申訴 #" + (rec.orderId || ""))}`;
    li.innerHTML = `
      <div class="history-summary">
        <div class="history-date"><p>${escapeHtml(rec.date)}</p></div>
        <div class="history-info"><h3>${escapeHtml(rec.shop)}</h3></div>
        <p class="history-price">${rec.total}元</p>
      </div>
      <div class="history-detail">
        <div class="tags">${tagsHtml}</div>
        <p>${escapeHtml(rec.mileage)} km</p>
        <p>備註:${escapeHtml(rec.note || "無")}</p>
        ${rec.signature ? `<p style="margin:8px 0 4px;font-size:11px;letter-spacing:.05em;color:#888;">簽收簽名</p><img src="${rec.signature}" alt="簽名" style="max-width:200px;height:auto;background:#fafaf7;border:0.5px solid rgba(0,0,0,.08);border-radius:3px;padding:4px;">` : ""}
        <p style="margin:10px 0 0;"><a href="${appealHref}" style="font-size:11px;letter-spacing:.02em;color:#888;border-bottom:0.5px solid currentColor;text-decoration:none;padding-bottom:1px;">對此紀錄有疑慮 申訴</a></p>
      </div>
    `;
    ul.prepend(li);
  });

  // 更新 totals(原 hardcode + 新增的)
  updateTotals();
}

function updateTotals() {
  const totals = document.querySelector(".history-totals");
  if (!totals) return;
  const items = document.querySelectorAll(".history-list .history-item");
  let sum = 0;
  items.forEach((it) => {
    const priceEl = it.querySelector(".history-price");
    if (!priceEl) return;
    const v = parseInt(priceEl.textContent.replace(/[^\d]/g, ""), 10);
    if (!isNaN(v)) sum += v;
  });
  totals.innerHTML = `
    <p>$${sum.toLocaleString()}<span>總花費</span></p>
    <p>${items.length}<span>筆紀錄</span></p>
  `;
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// ─── 啟動時注入 + 計算 totals ─────────────────────
loadAndInjectHistory();
addAppealLinksToExisting();

// 既有 hardcoded 的 history-item 也補申訴入口(每筆只加一次)
function addAppealLinksToExisting() {
  document.querySelectorAll(".history-list .history-item").forEach((item) => {
    const detail = item.querySelector(".history-detail");
    if (!detail || detail.querySelector(".history-appeal")) return;
    const p = document.createElement("p");
    p.style.cssText = "margin:10px 0 0;";
    const a = document.createElement("a");
    a.className = "history-appeal";
    a.href = "mailto:992319@gmail.com?subject=" + encodeURIComponent("車歷申訴");
    a.textContent = "對此紀錄有疑慮 申訴";
    a.style.cssText = "font-size:11px;letter-spacing:.02em;color:#888;border-bottom:0.5px solid currentColor;text-decoration:none;padding-bottom:1px;";
    p.appendChild(a);
    detail.appendChild(p);
  });
}

// ─── vehicle-list 切換 ───────────────────────────
const vehicleList = document.querySelector(".vehicle-list");
if (vehicleList) {
  vehicleList.addEventListener("click", function (e) {
    const current = document.querySelector(".vehicle-current");
    if (e.target.closest(".vehicle-current")) {
      vehicleList.classList.toggle("open");
      return;
    }
    const clickedLi = e.target.closest("li");
    if (!clickedLi) return;
    [current.textContent, clickedLi.textContent] = [
      clickedLi.textContent,
      current.textContent,
    ];
    vehicleList.classList.remove("open");
  });
}

// ─── history-item 展開(改事件代理,讓新 prepend 的也能點) ──
const historyList = document.querySelector(".history-list");
if (historyList) {
  historyList.addEventListener("click", (e) => {
    const summary = e.target.closest(".history-summary");
    if (!summary) return;
    summary.closest(".history-item").classList.toggle("open");
  });
}
