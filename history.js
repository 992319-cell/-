// ─── history.js v3 ──────────────────────────────────
// 對齊新版 HTML/CSS:
//   - 車輛照直接設 #hist-veh-img.src(載失敗 onerror 隱藏 img 顯 gradient 底,不疊 SVG)
//   - 里程含 <span>km</span> 用 innerHTML 設
//   - menu 選擇器全改成 id(class 已從 HTML 拿掉)
//   - 申訴 trigger 改 <button type="button">(語意修正)
//
// 核心邏輯維持:
//   - mock seed 兩台車(ABC 機車 + RAH 汽車)
//   - 合併 LS mqzx:histRecords(車行端標完工同步)
//   - 切換 / 排序 / overflow 三個 dropdown 共用 setupDropdown
//   - 評分動畫 fade + 卡片展開
// ──────────────────────────────────────────────────

(function () {
  const LS_HIST_RECORDS = "mqzx:histRecords";

  // ═══════════════════════════════════════════════════
  //   demo 車輛清單
  // ═══════════════════════════════════════════════════
  const VEHICLES = [
    {
      plate: "ABC-1234",
      model: "山羊 VIVA",
      kind: "機車",
      mileage: "32,520",
      avatar: "./img/bike-avatar-01.jpg",
    },
    {
      plate: "RAH-5688",
      model: "TOYOTA Altis",
      kind: "汽車",
      mileage: "58,650",
      avatar: "./img/car-avatar-01.jpg",
    },
  ];

  // ═══════════════════════════════════════════════════
  //   demo mock 紀錄
  // ═══════════════════════════════════════════════════
  const MOCK_RECORDS = [
    {
      plate: "ABC-1234",
      date: "2026 / 05 / 12",
      shop: "光陽機車行　台北信義",
      services: ["機油更換"],
      mileage: "32,140",
      total: 380,
      note: "無",
      orderId: "20260512-A12",
    },
    {
      plate: "ABC-1234",
      date: "2026 / 03 / 04",
      shop: "光陽機車行　台北信義",
      services: ["機油更換", "空濾清洗", "火星塞更換", "煞車調整"],
      mileage: "31,820",
      total: 1800,
      note: "無",
      orderId: "20260304-A07",
    },
    {
      plate: "ABC-1234",
      date: "2025 / 11 / 04",
      shop: "光陽機車行　台北信義",
      services: ["機油更換", "空濾清洗"],
      mileage: "30,210",
      total: 380,
      note: "無",
      orderId: "20251104-A03",
    },

    {
      plate: "RAH-5688",
      date: "2026 / 04 / 18",
      shop: "鴻昌汽車保養廠　台北大安",
      services: ["機油更換", "機油芯更換"],
      mileage: "58,200",
      total: 2400,
      note: "無",
      orderId: "20260418-B05",
    },
    {
      plate: "RAH-5688",
      date: "2025 / 12 / 20",
      shop: "鴻昌汽車保養廠　台北大安",
      services: ["前後煞車皮更換", "前輪胎更換 二條"],
      mileage: "55,100",
      total: 8800,
      note: "前後煞車皮加前胎兩條",
      orderId: "20251220-B02",
    },
  ];

  // ═══════════════════════════════════════════════════
  //   state
  // ═══════════════════════════════════════════════════
  // URL ?plate=XXX 切換預設車輛　無效或不存在 fallback 第一台
  const urlPlate = (() => {
    try {
      return new URLSearchParams(location.search).get("plate");
    } catch {
      return null;
    }
  })();
  let currentPlate = urlPlate && VEHICLES.find(v => v.plate === urlPlate)
                     ? urlPlate
                     : VEHICLES[0].plate;
  let currentSort = "newest";

  function pickVehicle(plate) {
    return VEHICLES.find((v) => v.plate === plate) || VEHICLES[0];
  }

  function loadLsRecords() {
    try {
      return JSON.parse(localStorage.getItem(LS_HIST_RECORDS) || "[]");
    } catch {
      return [];
    }
  }

  function allRecords() {
    const ls = loadLsRecords().map((r) => ({
      plate: r.plate || "ABC-1234",
      date: String(r.date || "").replace(/\./g, " / "),
      shop: r.shop || "—",
      services: Array.isArray(r.services) ? r.services : [],
      mileage: r.mileage || "—",
      total: Number(r.total) || 0,
      note: r.note || "無",
      orderId: r.orderId || "",
    }));
    return [...ls, ...MOCK_RECORDS];
  }

  function filterByPlate(records, plate) {
    return records.filter((r) => r.plate === plate);
  }

  function sortRecords(records, mode) {
    const arr = records.slice();
    const dateNum = (s) => Number(String(s).replace(/[^\d]/g, "")) || 0;
    if (mode === "newest")
      arr.sort((a, b) => dateNum(b.date) - dateNum(a.date));
    if (mode === "oldest")
      arr.sort((a, b) => dateNum(a.date) - dateNum(b.date));
    if (mode === "price-high") arr.sort((a, b) => b.total - a.total);
    if (mode === "price-low") arr.sort((a, b) => a.total - b.total);
    return arr;
  }

  // ═══════════════════════════════════════════════════
  //   render:vehicle header
  //   - 直接設 img src　載失敗 onerror 已在 HTML 處理(this.style.display='none')
  //   - 顯示 gradient 底色　不再塞 fallback SVG 圖層
  // ═══════════════════════════════════════════════════
  function renderHeader() {
    const v = pickVehicle(currentPlate);
    document.getElementById("hist-veh-plate").textContent = v.plate;
    document.getElementById("hist-veh-sub").textContent =
      `${v.model}　${v.kind}`;
    document.getElementById("hist-veh-meter-num").innerHTML =
      `${v.mileage} <span>km</span>`;

    const img = document.getElementById("hist-veh-img");
    if (img) {
      img.style.display = ""; // 先 reset(上一輪載失敗會 display:none)
      img.src = v.avatar;
      img.alt = `${v.plate}　${v.model}`;
    }

    // 切換選單 li
    const menu = document.getElementById("hist-veh-menu");
    if (menu) {
      menu.replaceChildren();
      VEHICLES.forEach((vh) => {
        const li = document.createElement("li");
        if (vh.plate === currentPlate) li.classList.add("is-active");
        li.dataset.plate = vh.plate;
        const sp1 = document.createElement("span");
        sp1.className = "vm-plate";
        sp1.textContent = vh.plate;
        const sp2 = document.createElement("span");
        sp2.className = "vm-sub";
        sp2.textContent = `${vh.model}　${vh.kind}`;
        li.append(sp1, sp2);
        menu.appendChild(li);
      });
    }
  }

  // ═══════════════════════════════════════════════════
  //   render:stats
  // ═══════════════════════════════════════════════════
  function renderStats(records) {
    let sum = 0;
    let recentDate = "—";
    let recentNum = 0;
    records.forEach((r) => {
      sum += r.total;
      const n = Number(String(r.date).replace(/[^\d]/g, "")) || 0;
      if (n > recentNum) {
        recentNum = n;
        recentDate = r.date;
      }
    });
    document.getElementById("hist-stat-total").textContent =
      "$" + sum.toLocaleString();
    document.getElementById("hist-stat-count").textContent = records.length;
    document.getElementById("hist-stat-recent").textContent = records.length
      ? recentDate
      : "—";
  }

  // ═══════════════════════════════════════════════════
  //   render:record list
  // ═══════════════════════════════════════════════════
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function buildCard(rec) {
    const servicesText = (rec.services || []).join("、") || "—";
    const li = document.createElement("li");
    li.className = "hist-card";
    li.dataset.orderId = rec.orderId;
    li.dataset.plate = rec.plate;

    // 再次預約 CTA
    // 註解:ticket.html 目前不支援 ?shop=&services= 預填　功能暫停
    // 等預填補上後　把 button 改回 <a href="ticket.html?...">
    // const rebookHref = `ticket.html?shop=${encodeURIComponent(rec.shop)}&services=${encodeURIComponent((rec.services || []).join(","))}`;

    li.innerHTML = `
      <div class="hist-card-row">
        <p class="hist-card-date">${escapeHtml(rec.date)}</p>
        <div class="hist-card-mid">
          <p class="hist-card-shop">${escapeHtml(rec.shop)}</p>
          <p class="hist-card-services">${escapeHtml(servicesText)}</p>
        </div>
        <p class="hist-card-price">$${rec.total.toLocaleString()}</p>
        <svg class="hist-card-chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke-width="1.5" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="hist-card-detail">
        <table class="hist-card-meta">
          <tr><td>里程</td><td>${escapeHtml(rec.mileage)} km</td></tr>
          <tr><td>備註</td><td>${escapeHtml(rec.note || "無")}</td></tr>
          <tr><td>服務項目</td><td>${escapeHtml(servicesText)}</td></tr>
        </table>

        <div class="rating-row" data-rated="0">
          <p class="rating-label">為這次服務評分</p>
          <div class="stars" role="radiogroup" aria-label="服務評分">
            <button type="button" class="star" data-value="1" aria-label="1 顆星">★</button>
            <button type="button" class="star" data-value="2" aria-label="2 顆星">★</button>
            <button type="button" class="star" data-value="3" aria-label="3 顆星">★</button>
            <button type="button" class="star" data-value="4" aria-label="4 顆星">★</button>
            <button type="button" class="star" data-value="5" aria-label="5 顆星">★</button>
          </div>
          <button type="button" class="rating-submit" hidden>送出評分</button>
        </div>

        <div class="hist-card-actions">
          <button type="button" class="hist-rebook" aria-disabled="true" title="功能開發中">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke-width="1.5" aria-hidden="true">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
              <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
            </svg>
            再次預約這項服務
          </button>
          <button type="button" class="appeal-trigger">對此紀錄有疑慮　申訴</button>
        </div>
      </div>
    `;
    return li;
  }

  function renderList() {
    const list = document.getElementById("hist-list");
    const empty = document.getElementById("hist-empty");
    if (!list) return;

    const filtered = filterByPlate(allRecords(), currentPlate);
    const sorted = sortRecords(filtered, currentSort);

    list.replaceChildren();
    if (!sorted.length) {
      empty.hidden = false;
      renderStats([]);
      return;
    }
    empty.hidden = true;
    sorted.forEach((rec) => list.appendChild(buildCard(rec)));
    renderStats(filtered);
  }

  // ═══════════════════════════════════════════════════
  //   dropdown 共用
  //   - selector 從 .class 改 #id(class 已從 HTML 拿掉)
  // ═══════════════════════════════════════════════════
  function setupDropdown(btn, menu) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = btn.getAttribute("aria-expanded") === "true";
      closeAllMenus();
      if (!open) {
        menu.hidden = false;
        btn.setAttribute("aria-expanded", "true");
      }
    });
  }

  function closeAllMenus() {
    ["hist-veh-menu", "hist-sort-menu", "hist-overflow-menu"].forEach((id) => {
      const m = document.getElementById(id);
      if (m) m.hidden = true;
    });
    document
      .querySelectorAll(".hist-veh-switch, .hist-sort-pill, .hist-overflow")
      .forEach((b) => b.setAttribute("aria-expanded", "false"));
  }

  document.addEventListener("click", () => closeAllMenus());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllMenus();
  });

  // ═══════════════════════════════════════════════════
  //   init
  // ═══════════════════════════════════════════════════
  function init() {
    // 車輛切換
    const switchBtn = document.getElementById("hist-veh-switch-btn");
    const vehMenu = document.getElementById("hist-veh-menu");
    setupDropdown(switchBtn, vehMenu);

    vehMenu.addEventListener("click", (e) => {
      const li = e.target.closest("li[data-plate]");
      if (!li) return;
      e.stopPropagation();
      currentPlate = li.dataset.plate;
      renderHeader();
      renderList();
      closeAllMenus();
    });

    // 排序
    const sortBtn = document.getElementById("hist-sort-btn");
    const sortMenu = document.getElementById("hist-sort-menu");
    const sortLabel = document.getElementById("hist-sort-label");
    setupDropdown(sortBtn, sortMenu);

    sortMenu.querySelectorAll("li").forEach((li) => {
      if (li.dataset.sort === currentSort) li.classList.add("is-active");
    });

    sortMenu.addEventListener("click", (e) => {
      const li = e.target.closest("li[data-sort]");
      if (!li) return;
      e.stopPropagation();
      currentSort = li.dataset.sort;
      sortLabel.textContent = li.textContent.trim();
      sortMenu
        .querySelectorAll("li")
        .forEach((x) =>
          x.classList.toggle("is-active", x.dataset.sort === currentSort),
        );
      renderList();
      closeAllMenus();
    });

    // overflow
    const ovBtn = document.getElementById("hist-overflow-btn");
    const ovMenu = document.getElementById("hist-overflow-menu");
    setupDropdown(ovBtn, ovMenu);

    ovMenu.addEventListener("click", (e) => {
      const btn = e.target.closest(".hist-overflow-item");
      if (!btn) return;
      e.stopPropagation();
      closeAllMenus();
      // 列印 與 下載 PDF 都走 window.print()　使用者在印表機對話框可另存 PDF
      window.print();
    });

    // 卡片內部事件代理:評分 / 評分送出 / 申訴 / 再次預約 / 展開
    const list = document.getElementById("hist-list");
    list.addEventListener("click", (e) => {
      // 評分點星
      const star = e.target.closest(".star");
      if (star) {
        e.stopPropagation();
        const row = star.closest(".rating-row");
        if (!row || row.dataset.rated === "1") return;
        const v = parseInt(star.dataset.value, 10) || 0;
        row.dataset.score = String(v);
        row
          .querySelectorAll(".star")
          .forEach((s, i) => s.classList.toggle("is-on", i < v));
        const submit = row.querySelector(".rating-submit");
        if (submit) submit.hidden = false;
        return;
      }

      // 評分送出 → fade out
      const submitBtn = e.target.closest(".rating-submit");
      if (submitBtn) {
        e.stopPropagation();
        const row = submitBtn.closest(".rating-row");
        if (!row || !row.dataset.score) return;
        row.dataset.rated = "1";
        row.classList.add("is-leaving");
        row.addEventListener("transitionend", () => row.remove(), {
          once: true,
        });
        setTimeout(() => {
          if (row.parentNode) row.remove();
        }, 500);
        return;
      }

      // 申訴 trigger 由 appeal-modal.js 處理(它監聽 document)
      if (e.target.closest(".appeal-trigger")) return;

      // 再次預約 暫停　preventDefault 不導頁　不展開卡片
      if (e.target.closest(".hist-rebook")) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // 卡片展開(點 .hist-card-row 區域)
      const row = e.target.closest(".hist-card-row");
      if (!row) return;
      row.closest(".hist-card").classList.toggle("is-open");
    });

    // 首次渲染
    renderHeader();
    renderList();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
