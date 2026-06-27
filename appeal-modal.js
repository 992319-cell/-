// ─── appeal-modal.js ─────────────────────────────
// 申訴 modal:點 .appeal-trigger 觸發,從父 .history-item 抓服務資料
// 流程:表單態 → 點寄出 → 切換到成功態(modal 不關閉)
// 平台不介入　不存 LS　demo 純展示
// ──────────────────────────────────────────────────

(function () {
  const modal = document.getElementById("appeal-modal");
  if (!modal) return;

  const stateForm = modal.querySelector(".appeal-state-form");
  const stateDone = modal.querySelector(".appeal-state-done");

  const snapDate     = document.getElementById("appeal-snap-date");
  const snapShop     = document.getElementById("appeal-snap-shop");
  const snapVehicle  = document.getElementById("appeal-snap-vehicle");
  const snapServices = document.getElementById("appeal-snap-services");
  const snapMileage  = document.getElementById("appeal-snap-mileage");
  const snapPrice    = document.getElementById("appeal-snap-price");

  const orderIdHead  = document.getElementById("appeal-order-id");
  const orderIdEvid  = document.getElementById("appeal-evid-id");
  const orderIdDone  = document.getElementById("appeal-done-id");
  const doneEmail    = document.getElementById("appeal-done-email");

  const textarea = document.getElementById("appeal-textarea");
  const sendBtn  = document.getElementById("appeal-send");

  // ═══════════════════════════════════════════════════
  //   工具:從 .history-item 抓 snapshot 資料
  // ═══════════════════════════════════════════════════
  function escapeJoin(nodes) {
    return Array.from(nodes).map((n) => n.textContent.trim()).filter(Boolean).join("、");
  }
  function txt(el) { return el ? el.textContent.trim() : ""; }

  function scrapeSnapshot(item) {
    if (!item) return null;
    // 新 v2 結構:.hist-card
    const date = txt(item.querySelector(".hist-card-date"));
    const shop = txt(item.querySelector(".hist-card-shop"));
    const price = txt(item.querySelector(".hist-card-price"));
    const services = txt(item.querySelector(".hist-card-services"));

    // 里程從 .hist-card-meta 第一行 td:nth-child(2)
    let mileage = "";
    const metaRows = item.querySelectorAll(".hist-card-meta tr");
    metaRows.forEach((tr) => {
      const tds = tr.querySelectorAll("td");
      if (tds.length === 2 && /里程/.test(tds[0].textContent)) {
        mileage = tds[1].textContent.trim();
      }
    });

    // 取目前車輛(從 v2 header)
    const plateEl = document.getElementById("hist-veh-plate");
    const subEl = document.getElementById("hist-veh-sub");
    const vehicle = plateEl && subEl
      ? `${plateEl.textContent.trim()}　${subEl.textContent.trim().split("　")[0]}`
      : "ABC-1234　Gogoro VIVA";

    // 訂單 id:從 data-order-id,否則用日期生成
    let orderId = item.dataset.orderId;
    if (!orderId) {
      const dateClean = date.replace(/[^\d]/g, "");
      const rand = Math.floor(Math.random() * 90 + 10);
      orderId = `${dateClean}-A${rand}`;
    }

    return { date, shop, price, services, mileage, vehicle, orderId };
  }

  // ═══════════════════════════════════════════════════
  //   開啟 modal:填資料 + 回到表單態
  // ═══════════════════════════════════════════════════
  function open(item) {
    const snap = scrapeSnapshot(item);
    if (!snap) return;

    snapDate.textContent     = snap.date || "—";
    snapShop.textContent     = snap.shop || "—";
    snapVehicle.textContent  = snap.vehicle;
    snapServices.textContent = snap.services || "—";
    snapMileage.textContent  = snap.mileage || "—";
    snapPrice.textContent    = snap.price || "—";

    const tag = "#" + snap.orderId;
    orderIdHead.textContent = tag;
    orderIdEvid.textContent = tag;
    orderIdDone.textContent = tag;

    // 副本信箱:從 sessionStorage 找,否則 demo 預設
    let email = "l***@gmail.com";
    try {
      const user = JSON.parse(sessionStorage.getItem("mqzx:currentUser") || "null");
      if (user && user.email) {
        const [name, dom] = user.email.split("@");
        email = (name[0] || "l") + "***@" + (dom || "gmail.com");
      }
    } catch { /* noop */ }
    doneEmail.textContent = email;

    // 重置表單態
    textarea.value = "";
    stateForm.hidden = false;
    stateDone.hidden = true;

    modal.hidden = false;
    document.body.style.overflow = "hidden";

    // focus 給 textarea(桌機體驗,手機會自動跳鍵盤太擾人 → 跳過)
    if (window.matchMedia && !window.matchMedia("(max-width: 540px)").matches) {
      setTimeout(() => textarea.focus(), 120);
    }
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  function toDone() {
    stateForm.hidden = true;
    stateDone.hidden = false;
    // 滾到 modal 頂端讓成功 mark 在中間
    const card = modal.querySelector(".appeal-modal-card");
    if (card) card.scrollTop = 0;
  }

  // ═══════════════════════════════════════════════════
  //   事件
  // ═══════════════════════════════════════════════════
  // 事件代理:點 .appeal-trigger(靜態 / 動態都涵蓋)
  document.addEventListener("click", (e) => {
    const trig = e.target.closest(".appeal-trigger");
    if (trig) {
      e.preventDefault();
      e.stopPropagation();
      const item = trig.closest(".hist-card");
      open(item);
      return;
    }

    // modal 內任何 [data-close] → 關閉
    if (modal.hidden) return;
    const closeTrig = e.target.closest("[data-close]");
    if (closeTrig && modal.contains(closeTrig)) {
      close();
    }
  });

  // 寄出 → 切換到成功態
  sendBtn.addEventListener("click", () => {
    // demo 不檢查 textarea 必填(評審現場可能直接按)
    toDone();
  });

  // ESC 關閉
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
})();
