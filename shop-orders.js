// 工單管理頁邏輯
// 狀態:pending(待接單)/ in_progress(進行中)/ completed(已完成)/ rejected(未接單)
// 含:tab 切換 + 接單/不接單/客人未到 + 完工 modal + 簽名 canvas

const tabs = document.querySelectorAll(".otab");
const ordersWrap = document.querySelector(".orders-wrap");
const emptyState = document.querySelector(".orders-empty");

let currentTab = "pending";

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    currentTab = tab.dataset.status;
    renderOrders();
  });
});

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

// ═══════════════════════════════════════════════════
//   localStorage 工具
// ═══════════════════════════════════════════════════
const LS_HIST_PRICE = "mqzx:histPrice";
const LS_VEHICLE_HIST = "mqzx:vehicleHist";
const LS_WALKIN = "mqzx:walkinOrders";
const LS_CHECKIN = "mqzx:newCheckin";
const LS_HIST_RECORDS = "mqzx:histRecords";

function loadHistRecords() {
  try {
    return JSON.parse(localStorage.getItem(LS_HIST_RECORDS) || "[]");
  } catch {
    return [];
  }
}
function saveHistRecords(arr) {
  localStorage.setItem(LS_HIST_RECORDS, JSON.stringify(arr));
}

function loadHistPrice() {
  try {
    return JSON.parse(localStorage.getItem(LS_HIST_PRICE) || "{}");
  } catch {
    return {};
  }
}
function saveHistPrice(map) {
  localStorage.setItem(LS_HIST_PRICE, JSON.stringify(map));
}
function loadVehicleHist() {
  try {
    return JSON.parse(localStorage.getItem(LS_VEHICLE_HIST) || "[]");
  } catch {
    return [];
  }
}
function saveVehicleHist(arr) {
  localStorage.setItem(LS_VEHICLE_HIST, JSON.stringify(arr));
}

// demo seed:ABC-1234 的機油更換有上次 $260
(function seedDemoData() {
  const map = loadHistPrice();
  if (Object.keys(map).length === 0) {
    map["ABC-1234|機油更換"] = 260;
    saveHistPrice(map);
  }
})();

// ═══════════════════════════════════════════════════
//   接單 / 不接單 / 客人未到 / 填寫完工
// ═══════════════════════════════════════════════════
ordersWrap.addEventListener("click", (e) => {
  const btn = e.target.closest(".bapp, .brej, .bfill, .bnoshow");
  if (!btn) return;

  const order = btn.closest(".order");

  // 填寫完工 → 開 modal
  if (btn.classList.contains("bfill")) {
    openFinishModal(order);
    return;
  }

  // 客人未到場
  if (btn.classList.contains("bnoshow")) {
    const ok = confirm(
      "確定標記此工單為「客人未到場」？\n標記後工單將直接刪除",
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

  // 接單 → in_progress,不接單 → rejected(未接單)
  const isAccept = btn.classList.contains("bapp");
  const newStatus = isAccept ? "in_progress" : "rejected";

  order.classList.add("is-leaving");
  setTimeout(() => {
    order.dataset.status = newStatus;
    const oact = order.querySelector(".oact");
    oact.replaceChildren(
      ...(isAccept ? buildInProgressActions() : [buildRejectedPill()]),
    );
    order.classList.remove("is-leaving");
    updateBadges();
    renderOrders();
  }, 350);
});

function buildInProgressActions() {
  const bfill = document.createElement("button");
  bfill.type = "button";
  bfill.className = "bfill";
  bfill.textContent = "填寫完工";

  const bnoshow = document.createElement("button");
  bnoshow.type = "button";
  bnoshow.className = "bnoshow";
  bnoshow.title = "客人未到場";
  bnoshow.textContent = "客人未到";

  return [bfill, bnoshow];
}

function buildRejectedPill() {
  const span = document.createElement("span");
  span.className = "ostatus is-rejected";
  span.textContent = "未接單 ✕";
  return span;
}

function buildCompletedActions() {
  const pill = document.createElement("span");
  pill.className = "ostatus is-completed";
  pill.textContent = "已完成 ✓";
  return [pill];
}

// ═══════════════════════════════════════════════════
//   完工填寫 modal
// ═══════════════════════════════════════════════════
const fmodal = document.getElementById("fmodal");
const fitems = document.getElementById("fitems");
const fitemAdd = document.getElementById("fitem-add");
const fmodalTotal = document.getElementById("fmodal-total");
const fmodalNext = document.getElementById("fmodal-next");
const fmile = document.getElementById("fmile");
const fnote = document.getElementById("fnote");

let currentOrder = null;

function openFinishModal(orderEl) {
  currentOrder = orderEl;
  const plate = orderEl.dataset.plate || "—";
  const bike = orderEl.dataset.bike || "";
  const orderId = orderEl.dataset.orderId || "—";
  const mileage = orderEl.dataset.mileage || "";

  document.getElementById("fmodal-orderid").textContent = `工單 #${orderId}`;
  document.getElementById("fmodal-bike").textContent = bike;
  document.getElementById("fmodal-plate").textContent = plate;
  fmile.value = mileage;
  fnote.value = "";

  fitems.innerHTML = "";
  const tagEls = orderEl.querySelectorAll(".tags span");
  if (tagEls.length === 0) {
    addItemRow("", "");
  } else {
    tagEls.forEach((tag) => addItemRow(tag.textContent.trim(), ""));
  }

  recalcTotal();
  fmodal.hidden = false;
  document.body.classList.add("no-scroll");
}

function closeFinishModal() {
  fmodal.hidden = true;
  document.body.classList.remove("no-scroll");
  currentOrder = null;
}

function addItemRow(name = "", price = "") {
  const li = document.createElement("li");
  li.className = "fitem";
  li.innerHTML = `
    <div class="fitem-row">
      <input type="text" class="fitem-name" placeholder="項目名稱" value="${escapeHtml(name)}">
      <span class="fitem-dollar">$</span>
      <input type="text" class="fitem-price" inputmode="numeric" placeholder="0" value="${escapeHtml(price)}">
      <button type="button" class="fitem-remove" aria-label="移除">✕</button>
    </div>
    <p class="fitem-hint" hidden></p>
  `;
  fitems.appendChild(li);
  updateItemHint(li);
}

function updateItemHint(li) {
  const nameInput = li.querySelector(".fitem-name");
  const hint = li.querySelector(".fitem-hint");
  if (!currentOrder) return;
  const plate = currentOrder.dataset.plate;
  const name = nameInput.value.trim();
  if (!plate || !name) {
    hint.hidden = true;
    return;
  }
  const map = loadHistPrice();
  const key = `${plate}|${name}`;
  if (map[key] != null) {
    hint.textContent = `上次 $${map[key]}`;
    hint.hidden = false;
  } else {
    hint.hidden = true;
  }
}

function recalcTotal() {
  let total = 0;
  fitems.querySelectorAll(".fitem-price").forEach((inp) => {
    const v = parseInt(inp.value.replace(/[^\d]/g, ""), 10);
    if (!isNaN(v)) total += v;
  });
  fmodalTotal.textContent = `$ ${total.toLocaleString()}`;
  return total;
}

fitems.addEventListener("input", (e) => {
  if (e.target.classList.contains("fitem-price")) recalcTotal();
  if (e.target.classList.contains("fitem-name")) {
    updateItemHint(e.target.closest(".fitem"));
  }
});
fitems.addEventListener("click", (e) => {
  if (e.target.classList.contains("fitem-remove")) {
    e.target.closest(".fitem").remove();
    recalcTotal();
  }
});
fitemAdd.addEventListener("click", () => addItemRow());
fmodal.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) closeFinishModal();
});

fmodalNext.addEventListener("click", () => {
  const items = collectItems();
  if (items.length === 0) {
    alert("請至少填寫一個服務項目與金額");
    return;
  }
  if (!fmile.value.trim()) {
    alert("請填寫完工里程");
    return;
  }
  const payload = {
    orderId: currentOrder.dataset.orderId,
    plate: currentOrder.dataset.plate,
    bike: currentOrder.dataset.bike,
    shop: currentOrder.dataset.shop,
    items,
    mileage: fmile.value.trim(),
    total: items.reduce((s, x) => s + x.price, 0),
    note: fnote.value.trim(),
  };
  openSignOverlay(payload);
});

function collectItems() {
  const out = [];
  fitems.querySelectorAll(".fitem").forEach((li) => {
    const name = li.querySelector(".fitem-name").value.trim();
    const priceRaw = li
      .querySelector(".fitem-price")
      .value.replace(/[^\d]/g, "");
    const price = parseInt(priceRaw, 10);
    if (name && !isNaN(price) && price > 0) {
      out.push({ name, price });
    }
  });
  return out;
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

// ═══════════════════════════════════════════════════
//   簽名 canvas overlay
// ═══════════════════════════════════════════════════
const signOverlay = document.getElementById("sign-overlay");
const signCanvas = document.getElementById("sign-canvas");
const signClear = document.getElementById("sign-clear");
const signReject = document.getElementById("sign-reject");
const signConfirm = document.getElementById("sign-confirm");
const signHint = document.getElementById("sign-canvas-hint");
const signSummary = document.getElementById("sign-summary");
const signOrderId = document.getElementById("sign-orderid");

let signCtx = null;
let signHasInk = false;
let currentPayload = null;

function openSignOverlay(payload) {
  currentPayload = payload;
  signOrderId.textContent = `工單 #${payload.orderId}　${payload.shop || ""}`;

  signSummary.innerHTML = "";
  payload.items.forEach((it) => {
    const row = document.createElement("div");
    row.className = "sign-summary-row";
    row.innerHTML = `<span>${escapeHtml(it.name)}</span><span>$ ${it.price.toLocaleString()}</span>`;
    signSummary.appendChild(row);
  });
  const totalRow = document.createElement("div");
  totalRow.className = "sign-summary-row";
  totalRow.innerHTML = `<span>${escapeHtml(payload.mileage)} KM</span><span class="sign-summary-total">$ ${payload.total.toLocaleString()}</span>`;
  signSummary.appendChild(totalRow);

  signOverlay.hidden = false;
  document.body.classList.add("no-scroll");

  setupCanvas();
  signHasInk = false;
  signConfirm.disabled = true;
  signHint.classList.remove("is-hidden");
}

function closeSignOverlay() {
  signOverlay.hidden = true;
  document.body.classList.remove("no-scroll");
  currentPayload = null;
}

function setupCanvas() {
  const rect = signCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  signCanvas.width = rect.width * dpr;
  signCanvas.height = rect.height * dpr;
  signCtx = signCanvas.getContext("2d");
  signCtx.scale(dpr, dpr);
  signCtx.lineWidth = 2.2;
  signCtx.lineCap = "round";
  signCtx.lineJoin = "round";
  signCtx.strokeStyle = "#1a1a1c";
}

let drawing = false;
let lastX = 0,
  lastY = 0;
function pointerPos(e) {
  const r = signCanvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
signCanvas.addEventListener("pointerdown", (e) => {
  drawing = true;
  signCanvas.setPointerCapture(e.pointerId);
  const p = pointerPos(e);
  lastX = p.x;
  lastY = p.y;
  signCtx.beginPath();
  signCtx.moveTo(lastX, lastY);
  signCtx.lineTo(lastX + 0.1, lastY + 0.1);
  signCtx.stroke();
  signHasInk = true;
  signConfirm.disabled = false;
  signHint.classList.add("is-hidden");
});
signCanvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  const p = pointerPos(e);
  signCtx.beginPath();
  signCtx.moveTo(lastX, lastY);
  signCtx.lineTo(p.x, p.y);
  signCtx.stroke();
  lastX = p.x;
  lastY = p.y;
});
function endStroke(e) {
  if (drawing) {
    drawing = false;
    try {
      signCanvas.releasePointerCapture(e.pointerId);
    } catch {}
  }
}
signCanvas.addEventListener("pointerup", endStroke);
signCanvas.addEventListener("pointercancel", endStroke);
signCanvas.addEventListener("pointerleave", endStroke);

signClear.addEventListener("click", () => {
  if (!signCtx) return;
  signCtx.clearRect(0, 0, signCanvas.width, signCanvas.height);
  signHasInk = false;
  signConfirm.disabled = true;
  signHint.classList.remove("is-hidden");
});

signReject.addEventListener("click", () => {
  closeSignOverlay();
});

signConfirm.addEventListener("click", () => {
  if (!signHasInk || !currentPayload) return;

  const signatureDataUrl = signCanvas.toDataURL("image/png");

  // 寫歷史價
  const priceMap = loadHistPrice();
  currentPayload.items.forEach((it) => {
    priceMap[`${currentPayload.plate}|${it.name}`] = it.price;
  });
  saveHistPrice(priceMap);

  // 寫車歷紀錄(專用 LS key,不跟車輛清單混)
  const histList = loadHistRecords();
  histList.unshift({
    date: todayStr(),
    plate: currentPayload.plate,
    shop: currentPayload.shop || "光陽機車行　台北信義",
    services: currentPayload.items.map((x) => x.name),
    mileage: currentPayload.mileage,
    total: currentPayload.total,
    note: currentPayload.note || "無",
    signature: signatureDataUrl,
    orderId: currentPayload.orderId,
  });
  saveHistRecords(histList);

  // 用 const 捕捉 ref(避免 close 把它 null 掉)
  const payload = currentPayload;
  const ord = currentOrder;

  closeSignOverlay();
  closeFinishModal();

  ord.classList.add("is-leaving");
  setTimeout(() => {
    ord.dataset.status = "completed";
    const priceEl = ord.querySelector(".oprice");
    if (priceEl) priceEl.textContent = `$${payload.total.toLocaleString()}`;
    // .oinfo p:時間已搬到 .odate,這裡只寫里程 + 工單 # + 已簽收
    const infoP = ord.querySelector(".oinfo p");
    if (infoP) {
      const mileNum = Number(
        String(payload.mileage).replace(/[^\d]/g, ""),
      ).toLocaleString();
      infoP.textContent = `${mileNum} km　工單 #${payload.orderId}　已交車`;
    }
    const oact = ord.querySelector(".oact");
    oact.replaceChildren(...buildCompletedActions());
    ord.classList.remove("is-leaving");
    updateBadges();
    renderOrders();
  }, 350);
});

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!signOverlay.hidden) closeSignOverlay();
    else if (!fmodal.hidden) closeFinishModal();
    else if (body.classList.contains("is-drawer-open")) closeDrawer();
  }
});

window.addEventListener("resize", () => {
  if (!signOverlay.hidden) {
    const wasInked = signHasInk;
    setupCanvas();
    if (wasInked) {
      signHasInk = false;
      signConfirm.disabled = true;
      signHint.classList.remove("is-hidden");
    }
  }
});

// ═══════════════════════════════════════════════════
//   walk-in 工單還原 + 即時 prepend
//   - 頁面載入時讀 mqzx:walkinOrders,prepend 進「進行中」
//   - 監聽 walkin:created 事件(同分頁),新增即時插入
// ═══════════════════════════════════════════════════
function loadWalkinOrders() {
  try {
    return JSON.parse(localStorage.getItem(LS_WALKIN) || "[]");
  } catch {
    return [];
  }
}

function buildOrderCard(o) {
  const li = document.createElement("li");
  li.className = "order";
  li.dataset.status = o.status || "in_progress";
  li.dataset.plate = o.plate;
  li.dataset.shop = o.shop || "光陽機車行　台北信義";
  li.dataset.mileage = o.mileage || "";
  li.dataset.orderId = o.id;
  li.dataset.bike = `${o.model}　${(o.name || "車主")[0]}*`;

  // bike photo / silhouette(對齊既有卡片邏輯)
  const photoDiv = document.createElement("div");
  if (o.avatar) {
    photoDiv.className = "bike-photo";
    const img = document.createElement("img");
    img.src = o.avatar;
    img.alt = "";
    photoDiv.appendChild(img);
  } else {
    photoDiv.className = "bike-silhouette";
    const img = document.createElement("img");
    img.src =
      o.kind === "汽車"
        ? "./icon/silhouette-car.png"
        : "./icon/silhouette-bike.png";
    img.alt = "";
    photoDiv.appendChild(img);
  }
  li.appendChild(photoDiv);

  // odate
  const odate = document.createElement("div");
  odate.className = "odate";
  const t1 = document.createElement("time");
  t1.textContent = o.dateLabel;
  const t2 = document.createElement("time");
  t2.textContent = o.timeLabel;
  const sp = document.createElement("span");
  sp.textContent = o.yearLabel;
  odate.append(t1, t2, sp);
  li.appendChild(odate);

  // oinfo
  const oinfo = document.createElement("div");
  oinfo.className = "oinfo";
  const h4 = document.createElement("h4");
  h4.textContent = `${o.model}　${(o.name || "車主")[0]}*`;
  oinfo.appendChild(h4);
  const tags = document.createElement("div");
  tags.className = "tags";
  (o.services || []).forEach((s) => {
    const sp2 = document.createElement("span");
    sp2.textContent = s;
    tags.appendChild(sp2);
  });
  oinfo.appendChild(tags);
  const pId = document.createElement("p");
  pId.textContent = `工單 #${o.id}`;
  oinfo.appendChild(pId);
  li.appendChild(oinfo);

  // oprice
  const oprice = document.createElement("div");
  oprice.className = "oprice";
  oprice.textContent = `$${o.price || 0}`;
  li.appendChild(oprice);

  // oact(進行中:填寫完工 + 客人未到)
  const oact = document.createElement("div");
  oact.className = "oact";
  const bfill = document.createElement("button");
  bfill.type = "button";
  bfill.className = "bfill";
  bfill.textContent = "填寫完工";
  const bnoshow = document.createElement("button");
  bnoshow.type = "button";
  bnoshow.className = "bnoshow";
  bnoshow.title = "客人未到場";
  bnoshow.textContent = "客人未到";
  oact.append(bfill, bnoshow);
  li.appendChild(oact);

  return li;
}

function restoreWalkinOrders() {
  const arr = loadWalkinOrders();
  if (!arr.length) return;
  // 反向插,讓最新的在最上面(arr 已經是 unshift 過的)
  arr.forEach((o) => {
    // 避免重複(已 prepend 過的不再加)
    if (ordersWrap.querySelector(`[data-order-id="${o.id}"]`)) return;
    const card = buildOrderCard(o);
    ordersWrap.prepend(card);
  });
}

window.addEventListener("walkin:created", (e) => {
  const o = e.detail;
  if (!o) return;
  const card = buildOrderCard(o);
  ordersWrap.prepend(card);
  // 切到「進行中」tab 讓老闆看到新卡
  tabs.forEach((t) =>
    t.classList.toggle("is-active", t.dataset.status === "in_progress"),
  );
  currentTab = "in_progress";
  renderOrders();
  updateBadges();
});

// ═══════════════════════════════════════════════════
//   self check-in 工單(mqzx:newCheckin)
//   - 跟 walkin 同 schema → 直接重用 buildOrderCard
//   - 同分頁:CustomEvent 'checkin:created'
//   - 跨分頁(車主手機 → 車行桌機 demo):storage event
// ═══════════════════════════════════════════════════
function loadCheckinOrders() {
  try {
    return JSON.parse(localStorage.getItem(LS_CHECKIN) || "[]");
  } catch {
    return [];
  }
}

function restoreCheckinOrders() {
  const arr = loadCheckinOrders();
  if (!arr.length) return;
  arr.forEach((o) => {
    if (ordersWrap.querySelector(`[data-order-id="${o.id}"]`)) return;
    const card = buildOrderCard(o);
    ordersWrap.prepend(card);
  });
}

function handleNewCheckin(order) {
  if (!order) return;
  if (ordersWrap.querySelector(`[data-order-id="${order.id}"]`)) return;
  const card = buildOrderCard(order);
  ordersWrap.prepend(card);
  tabs.forEach((t) =>
    t.classList.toggle("is-active", t.dataset.status === "in_progress"),
  );
  currentTab = "in_progress";
  renderOrders();
  updateBadges();
}

window.addEventListener("checkin:created", (e) => handleNewCheckin(e.detail));

window.addEventListener("storage", (e) => {
  if (e.key !== LS_CHECKIN || !e.newValue) return;
  try {
    const arr = JSON.parse(e.newValue);
    if (!arr.length) return;
    handleNewCheckin(arr[0]);
  } catch {
    /* noop */
  }
});

// ─── 初始化 ─────────────────────────────────────
restoreWalkinOrders();
restoreCheckinOrders();
updateBadges();
renderOrders();
