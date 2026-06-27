// ─── self-checkin.js ─────────────────────────────
// 車主端到店報到頁(mobile-first)
// 流程:
//   QR 進站 → 讀 sessionStorage 看是否已登入
//   ├ 已登入 → 顯示車輛清單(單選)→ 送出 → 確認頁
//   └ 未登入 → 顯示「立即登記」引導 → 跳 register.html?next=...
// 送出:
//   寫 mqzx:newCheckin(陣列,跟 mqzx:walkinOrders 同 schema)
//   dispatch CustomEvent 'checkin:created'(同分頁)
//   localStorage 寫入會觸發其他分頁的 storage event(跨頁 demo)
//
// demo:
//   ?demo=member  → 自動登入為「林小華」
//   ?demo=guest   → 強制走訪客流(清掉 currentUser)
//   ?shop=guangyang(預設)
// ──────────────────────────────────────────────────

(function () {
  const LS_CHECKIN  = "mqzx:newCheckin";
  const LS_VEHICLE  = "mqzx:vehicleHist";
  const SS_USER     = "mqzx:currentUser";

  // ═══════════════════════════════════════════════════
  //   shop 對照(demo 只放一家,要擴可加)
  // ═══════════════════════════════════════════════════
  const SHOPS = {
    guangyang: "光陽機車行　台北信義",
    sanmin:    "三民機車行　台北大安",
  };

  // ═══════════════════════════════════════════════════
  //   小工具
  // ═══════════════════════════════════════════════════
  function $(sel) { return document.querySelector(sel); }
  function param(name) {
    return new URLSearchParams(location.search).get(name);
  }
  function normalizePhone(s) { return (s || "").replace(/[^\d]/g, ""); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function todayParts() {
    const d = new Date();
    return {
      y: d.getFullYear(),
      m: pad(d.getMonth() + 1),
      d: pad(d.getDate()),
      hh: pad(d.getHours()),
      mm: pad(d.getMinutes()),
    };
  }
  function dayOfWeekTW(d) {
    return ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  }
  function genOrderId() {
    const { y, m, d } = todayParts();
    const rand = Math.floor(Math.random() * 90 + 10);
    return `${y}${m}${d}-C${rand}`;
  }

  // ═══════════════════════════════════════════════════
  //   demo seed:確保 0912-345-678 林小華 兩台車在 vehicleHist
  //   (walkin-modal.js 也有同一段;在這頁獨立進入時也保險建一次)
  // ═══════════════════════════════════════════════════
  (function seedDemo() {
    let hist;
    try { hist = JSON.parse(localStorage.getItem(LS_VEHICLE) || "[]"); }
    catch { hist = []; }
    if (hist.some((h) => normalizePhone(h.phone) === "0912345678")) return;
    hist.push({
      phone: "0912-345-678",
      name: "林小華",
      vehicles: [
        { plate: "ABC-1234", model: "Gogoro VIVA", kind: "機車", avatar: "./img/bike-avatar-01.jpg" },
        { plate: "XYZ-5678", model: "光陽 G6",     kind: "機車", avatar: "./img/bike-avatar-02.jpg" },
      ],
    });
    localStorage.setItem(LS_VEHICLE, JSON.stringify(hist));
  })();

  // ═══════════════════════════════════════════════════
  //   URL 參數 + 登入態
  // ═══════════════════════════════════════════════════
  const shopKey = param("shop") || "guangyang";
  const shopName = SHOPS[shopKey] || SHOPS.guangyang;

  // demo 模式
  const demoMode = param("demo");
  if (demoMode === "member") {
    // 強制登入林小華
    sessionStorage.setItem(SS_USER, JSON.stringify({ phone: "0912-345-678", name: "林小華" }));
  } else if (demoMode === "guest") {
    sessionStorage.removeItem(SS_USER);
  }

  function getCurrentUser() {
    try { return JSON.parse(sessionStorage.getItem(SS_USER) || "null"); }
    catch { return null; }
  }
  function getMemberByPhone(phone) {
    const target = normalizePhone(phone);
    try {
      const hist = JSON.parse(localStorage.getItem(LS_VEHICLE) || "[]");
      return hist.find((h) => normalizePhone(h.phone) === target) || null;
    } catch { return null; }
  }

  // ═══════════════════════════════════════════════════
  //   render shop name + time(兩個 state 都要)
  // ═══════════════════════════════════════════════════
  function renderHeader() {
    const t = todayParts();
    const d = new Date();
    const timeStr = `${t.y} / ${t.m} / ${t.d}　週${dayOfWeekTW(d)}　${t.hh}:${t.mm}`;
    ["#cin-shop-name", "#cin-shop-name-2"].forEach((s) => {
      const e = $(s); if (e) e.textContent = shopName;
    });
    ["#cin-now", "#cin-now-2"].forEach((s) => {
      const e = $(s); if (e) e.textContent = timeStr;
    });
  }

  // ═══════════════════════════════════════════════════
  //   state switch
  // ═══════════════════════════════════════════════════
  function show(id) {
    document.querySelectorAll(".cin-state").forEach((s) => s.hidden = true);
    $(id).hidden = false;
  }

  // ═══════════════════════════════════════════════════
  //   ▌已登入態:渲染車輛清單
  // ═══════════════════════════════════════════════════
  let selectedIdx = 0;
  let memberCache = null;

  function renderMemberState(member) {
    memberCache = member;
    selectedIdx = 0;

    $("#cin-greet-name").textContent = member.name || "車主";

    const ul = $("#cin-vehicles");
    ul.replaceChildren();

    member.vehicles.forEach((v, idx) => {
      const li = document.createElement("li");
      li.className = "cin-vehicle";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "cin-vehicle";
      radio.checked = idx === 0;
      radio.addEventListener("change", () => { selectedIdx = idx; });
      li.appendChild(radio);

      if (v.avatar) {
        const img = document.createElement("img");
        img.src = v.avatar; img.alt = "";
        li.appendChild(img);
      } else {
        const wrap = document.createElement("div");
        wrap.className = "v-thumb";
        const img = document.createElement("img");
        img.src = v.kind === "汽車"
          ? "./icon/silhouette-car.png"
          : "./icon/silhouette-bike.png";
        img.alt = "";
        wrap.appendChild(img);
        li.appendChild(wrap);
      }

      const info = document.createElement("div");
      info.className = "v-info";
      const p1 = document.createElement("p"); p1.className = "v-plate"; p1.textContent = v.plate;
      const p2 = document.createElement("p"); p2.className = "v-model"; p2.textContent = v.model;
      info.append(p1, p2);
      li.appendChild(info);

      // 整張卡可點(行為跟 radio 同步)
      li.addEventListener("click", (e) => {
        if (e.target !== radio) {
          radio.checked = true;
          selectedIdx = idx;
        }
      });

      ul.appendChild(li);
    });

    show("#cin-member");
  }

  // ═══════════════════════════════════════════════════
  //   ▌訪客態:導去 register
  // ═══════════════════════════════════════════════════
  function renderGuestState() {
    const next = encodeURIComponent(`self-checkin.html?shop=${shopKey}`);
    $("#cin-go-reg").href = `register.html?next=${next}&shop=${shopKey}`;
    $("#cin-go-login").addEventListener("click", () => {
      // login.html 還沒接 next 邏輯,demo 階段直接跳 register
      location.href = `register.html?next=${next}&shop=${shopKey}`;
    });
    show("#cin-guest");
  }

  // ═══════════════════════════════════════════════════
  //   ▌送出報到
  // ═══════════════════════════════════════════════════
  function submitCheckin() {
    if (!memberCache) return;
    const v = memberCache.vehicles[selectedIdx];
    if (!v) return;

    const t = todayParts();
    const order = {
      id: genOrderId(),
      status: "in_progress",
      plate: v.plate,
      model: v.model,
      kind: v.kind || "機車",
      name: memberCache.name || "車主",
      avatar: v.avatar || "",
      shop: shopName,
      mileage: "",
      services: [],
      price: 0,
      source: "self_checkin",
      createdAt: `${t.y}-${t.m}-${t.d}T${t.hh}:${t.mm}`,
      dateLabel: `${t.m}.${t.d}`,
      timeLabel: `${t.hh}:${t.mm}`,
      yearLabel: String(t.y),
    };

    // 寫 LS(陣列 unshift)
    let all;
    try { all = JSON.parse(localStorage.getItem(LS_CHECKIN) || "[]"); }
    catch { all = []; }
    all.unshift(order);
    localStorage.setItem(LS_CHECKIN, JSON.stringify(all));

    // 同分頁廣播
    window.dispatchEvent(new CustomEvent("checkin:created", { detail: order }));

    // 顯示確認頁
    renderDoneState(order);
  }

  // ═══════════════════════════════════════════════════
  //   ▌成功確認頁
  // ═══════════════════════════════════════════════════
  function renderDoneState(order) {
    const dl = $("#cin-done-meta");
    dl.replaceChildren();

    const rows = [
      ["車輛",   `${order.plate}　${order.model}`],
      ["車主",   `${(order.name || "車主")[0]}*`],
      ["門市",   order.shop],
      ["時間",   `${order.yearLabel} / ${order.dateLabel.replace(".", " / ")}　${order.timeLabel}`],
    ];
    rows.forEach(([k, v]) => {
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      dl.append(dt, dd);
    });

    show("#cin-done");
  }

  // ═══════════════════════════════════════════════════
  //   init
  // ═══════════════════════════════════════════════════
  function init() {
    renderHeader();

    const user = getCurrentUser();
    if (user) {
      const member = getMemberByPhone(user.phone);
      if (member && member.vehicles && member.vehicles.length) {
        renderMemberState(member);
      } else {
        // 有 user 但 vehicleHist 沒對應 → 退回訪客(demo 不會發生)
        renderGuestState();
      }
    } else {
      renderGuestState();
    }

    $("#cin-submit").addEventListener("click", submitCheckin);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
