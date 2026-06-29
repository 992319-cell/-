// 城市 → 區 → 車行（demo 假資料）
// shop.style = 卡片背景樣式（1–5 循環）
// shop.motif = 角落裝飾 SVG（wrench / leaf / gear 循環）
// shop.rating = 評分（demo）
const LOCATION_DATA = {
  taipei: {
    name: "台北市",
    districts: {
      xinyi: {
        name: "信義區",
        shops: [
          { id: "s101", name: "光陽機車行　信義店", rating: 4.8 },
          { id: "s102", name: "順發機車　莊敬店", rating: 4.6 },
        ],
      },
      daan: {
        name: "大安區",
        shops: [
          { id: "s103", name: "三陽車業　復興店", rating: 4.7 },
          { id: "s104", name: "好修車行　敦化店", rating: 4.5 },
          { id: "s105", name: "山葉精品　大安店", rating: 4.9 },
        ],
      },
      zhongshan: {
        name: "中山區",
        shops: [
          { id: "s106", name: "順發機車　中山店", rating: 4.4 },
          { id: "s107", name: "光陽機車行　民權店", rating: 4.7 },
        ],
      },
    },
  },
  newtaipei: {
    name: "新北市",
    districts: {
      banqiao: {
        name: "板橋區",
        shops: [
          { id: "s201", name: "三重保養廠　板橋店", rating: 4.6 },
          { id: "s202", name: "光陽機車行　府中店", rating: 4.8 },
        ],
      },
      sanchong: {
        name: "三重區",
        shops: [
          { id: "s203", name: "三重保養廠　本店", rating: 4.9 },
          { id: "s204", name: "順發機車　三和店", rating: 4.5 },
        ],
      },
      xinzhuang: {
        name: "新莊區",
        shops: [{ id: "s205", name: "光陽機車行　新莊店", rating: 4.6 }],
      },
    },
  },
  taichung: {
    name: "台中市",
    districts: {
      west: {
        name: "西區",
        shops: [
          { id: "s301", name: "三陽車業　西區店", rating: 4.7 },
          { id: "s302", name: "山葉精品　公益店", rating: 4.8 },
        ],
      },
      north: {
        name: "北區",
        shops: [{ id: "s303", name: "順發機車　一中店", rating: 4.5 }],
      },
      beitun: {
        name: "北屯區",
        shops: [
          { id: "s304", name: "光陽機車行　北屯店", rating: 4.6 },
          { id: "s305", name: "好修車行　文心店", rating: 4.7 },
        ],
      },
    },
  },
  tainan: {
    name: "台南市",
    districts: {
      east: {
        name: "東區",
        shops: [
          { id: "s401", name: "三陽車業　東區店", rating: 4.7 },
          { id: "s402", name: "光陽機車行　崇學店", rating: 4.5 },
        ],
      },
      north: {
        name: "北區",
        shops: [{ id: "s403", name: "順發機車　公園店", rating: 4.6 }],
      },
      yongkang: {
        name: "永康區",
        shops: [
          { id: "s404", name: "永康保養廠", rating: 4.9 },
          { id: "s405", name: "山葉精品　永康店", rating: 4.8 },
        ],
      },
    },
  },
  kaohsiung: {
    name: "高雄市",
    districts: {
      sanmin: {
        name: "三民區",
        shops: [
          { id: "s501", name: "光陽機車行　三民店", rating: 4.6 },
          { id: "s502", name: "順發機車　建工店", rating: 4.5 },
        ],
      },
      lingya: {
        name: "苓雅區",
        shops: [{ id: "s503", name: "三陽車業　苓雅店", rating: 4.7 }],
      },
      zuoying: {
        name: "左營區",
        shops: [
          { id: "s504", name: "光陽機車行　左營店", rating: 4.8 },
          { id: "s505", name: "好修車行　高鐵店", rating: 4.6 },
        ],
      },
    },
  },
};

const SERVICE_LABEL = {
  oil: "機油更換",
  airfilter: "空濾",
  sparkplug: "火星塞",
  brake: "煞車皮",
  tire: "輪胎更換",
};

// ─── 元素參照 ─────────────────────────────────
const form = document.querySelector(".tk-form");
const steps = document.querySelectorAll(".tk-step");
const panels = document.querySelectorAll(".tk-panel");
const dateInput = document.getElementById("date");
const dateWrap = document.querySelector(".tk-date-wrap");
const slotBtns = document.querySelectorAll(".tk-slot");
const slotHidden = document.getElementById("slot");
const citySel = document.getElementById("city");
const districtSel = document.getElementById("district");
const shopListEl = document.getElementById("shop-list");
const shopHidden = document.getElementById("shop");
const symptomTA = document.getElementById("symptom");
const serviceBoxes = document.querySelectorAll('input[name="services"]');

// 預約狀態（用於 summary）
const state = {
  date: "",
  slot: "",
  city: "",
  district: "",
  shop: null, // { id, name }
};

// ─── flatpickr：希望日期 ─────────────────────
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const maxDate = new Date();
maxDate.setDate(maxDate.getDate() + 30);
const fp = flatpickr(dateInput, {
  locale:
    typeof flatpickr !== "undefined" && flatpickr.l10ns && flatpickr.l10ns.zh_tw
      ? flatpickr.l10ns.zh_tw
      : "default",
  minDate: tomorrow,
  maxDate: maxDate,
  dateFormat: "Y / m / d",
  disableMobile: true,
  onChange: (selectedDates, dateStr) => {
    state.date = dateStr;
    if (dateStr) dateWrap.classList.add("is-filled");
    else dateWrap.classList.remove("is-filled");
    renderAside();
  },
});

// ─── 時段按鈕 grid ────────────────────────────
slotBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    slotBtns.forEach((b) => {
      b.classList.remove("is-selected");
      b.setAttribute("aria-checked", "false");
    });
    btn.classList.add("is-selected");
    btn.setAttribute("aria-checked", "true");
    state.slot = btn.dataset.slot;
    slotHidden.value = state.slot;
    renderAside();
  });
});

// ─── 城市 → 區 ───────────────────────────────
citySel.addEventListener("change", () => {
  state.city = citySel.value;
  state.district = "";
  state.shop = null;
  shopHidden.value = "";

  districtSel.innerHTML = '<option value="">請選擇</option>';
  if (!state.city) {
    districtSel.disabled = true;
    districtSel.innerHTML = '<option value="">請先選擇城市</option>';
    renderShops(null);
    return;
  }
  const districts = LOCATION_DATA[state.city].districts;
  for (const [key, d] of Object.entries(districts)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = d.name;
    districtSel.appendChild(opt);
  }
  districtSel.disabled = false;
  renderShops(null);
  renderAside();
});

// ─── 區 → 車行卡片 ────────────────────────────
districtSel.addEventListener("change", () => {
  state.district = districtSel.value;
  state.shop = null;
  shopHidden.value = "";

  if (!state.district) {
    renderShops(null);
    renderAside();
    return;
  }
  const shops = LOCATION_DATA[state.city].districts[state.district].shops;
  renderShops(shops);
  renderAside();
});

// ─── 渲染車行卡片 ────────────────────────────
function renderShops(shops) {
  if (!shops) {
    shopListEl.innerHTML = '<p class="tk-shops-empty">請先選擇城市與區</p>';
    return;
  }
  if (shops.length === 0) {
    shopListEl.innerHTML = '<p class="tk-shops-empty">此區目前沒有合作車行</p>';
    return;
  }

  shopListEl.innerHTML = shops
    .map((s) => {
      // 用 id 末字元雜湊到 1–4，確保同店家永遠對到同一張照片
      const photoN = (s.id.charCodeAt(s.id.length - 1) % 4) + 1;
      // 上下深、中間透：上方 navy 色調 + 下方深黑，確保店名/評分可讀
      const bgImg = `linear-gradient(180deg, rgba(8,29,82,0.45) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.88) 100%), url('./圖片素材/shop/shop-${photoN}.jpg')`;
      return `
      <button type="button" class="tk-shop-card" data-shop-id="${s.id}" data-shop-name="${s.name}" style="background-image: ${bgImg};">
        <span class="tk-shop-name">${s.name}</span>
        <span class="tk-shop-meta">
          <span class="tk-shop-rating">★ ${s.rating.toFixed(1)}</span>
        </span>
      </button>
    `;
    })
    .join("");

  // 綁卡片點選
  shopListEl.querySelectorAll(".tk-shop-card").forEach((card) => {
    card.addEventListener("click", () => {
      shopListEl
        .querySelectorAll(".tk-shop-card")
        .forEach((c) => c.classList.remove("is-selected"));
      card.classList.add("is-selected");
      state.shop = {
        id: card.dataset.shopId,
        name: card.dataset.shopName,
      };
      shopHidden.value = state.shop.id;
      renderAside();
    });
  });
}

// ─── 渲染預約摘要側邊 ─────────────────────────
const asideShopEl = document.getElementById("aside-shop");
const ASIDE_PLACEHOLDER_HTML = `
    <div class="tk-aside-shop-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true" style="width:32px;height:32px;opacity:.5;">
            <path d="M3 9 L 12 3 L 21 9 V 20 H 3 Z"/><path d="M9 20 V 13 H 15 V 20"/>
        </svg>
        <span>請於左側選擇車行</span>
    </div>
`;

function renderAside() {
  // 日期
  document.querySelector('[data-aside="date"]').textContent = state.date || "—";

  // 時段
  const slotCell = document.querySelector('[data-aside="slot"]');
  if (state.slot) {
    const slotEnd = String(Number(state.slot) + 1).padStart(2, "0");
    slotCell.textContent = `${state.slot}:00 – ${slotEnd}:00`;
  } else {
    slotCell.textContent = "—";
  }

  // 車行（含照片）
  if (state.shop) {
    const photoN = (state.shop.id.charCodeAt(state.shop.id.length - 1) % 4) + 1;
    const bgImg = `linear-gradient(180deg, rgba(8,29,82,0.35) 0%, rgba(0,0,0,0.85) 100%), url('./圖片素材/shop/shop-${photoN}.jpg')`;
    asideShopEl.style.backgroundImage = bgImg;
    const distName =
      state.district && state.city
        ? LOCATION_DATA[state.city].districts[state.district].name
        : "";
    asideShopEl.innerHTML = `
        <span class="tk-aside-shop-name">${state.shop.name}</span>
        <span class="tk-aside-shop-meta">${distName}</span>
    `;
  } else {
    asideShopEl.style.backgroundImage = "";
    asideShopEl.innerHTML = ASIDE_PLACEHOLDER_HTML;
  }

  // 項目
  const checked = [...serviceBoxes].filter((b) => b.checked);
  const tagsCell = document.querySelector('[data-aside="services"]');
  if (checked.length === 0) {
    tagsCell.innerHTML = "—";
  } else {
    tagsCell.innerHTML = checked
      .map((b) => `<span class="tag">${SERVICE_LABEL[b.value]}</span>`)
      .join("");
  }
}

// 服務 checkbox 變動 → 同步側邊
serviceBoxes.forEach((cb) => {
  cb.addEventListener("change", renderAside);
});

// ─── 步驟切換 ─────────────────────────────────
function goStep(target) {
  const layout = document.querySelector(".tk-layout");
  if (layout) {
    layout.classList.toggle("is-done", target >= 4);
  }
  panels.forEach((p) => {
    p.classList.toggle("is-active", p.dataset.panel === String(target));
  });
  steps.forEach((s) => {
    const n = Number(s.dataset.step);
    s.classList.remove("is-active", "done");
    if (target >= 4) {
      // 已完成全部
      s.classList.add("done");
    } else if (n < target) {
      s.classList.add("done");
    } else if (n === target) {
      s.classList.add("is-active");
    }
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─── 驗證 ────────────────────────────────────
function validateStep1() {
  const checks = [
    [() => state.date, "請選擇希望日期", dateInput],
    [() => state.slot, "請選擇希望時段", null],
    [() => state.city, "請選擇城市", citySel],
    [() => state.district, "請選擇區", districtSel],
    [() => state.shop && state.shop.id, "請選擇車行", null],
  ];
  for (const [getter, msg, focusEl] of checks) {
    if (!getter()) {
      alert(msg);
      if (focusEl) focusEl.focus();
      return false;
    }
  }
  return true;
}
function validateStep2() {
  const anyChecked = [...serviceBoxes].some((b) => b.checked);
  if (!anyChecked) {
    alert("請至少選擇一項希望項目");
    return false;
  }
  return true;
}

// ─── 渲染 summary ─────────────────────────────
function renderSummary() {
  // 時間
  const slot = state.slot;
  const slotEnd = String(Number(slot) + 1).padStart(2, "0");
  const whenStr = `${state.date}　${slot}:00 – ${slotEnd}:00`;

  // 地點
  const cityName = LOCATION_DATA[state.city].name;
  const distName = LOCATION_DATA[state.city].districts[state.district].name;
  const placeStr = `${state.shop.name}（${cityName}${distName}）`;

  // 項目（用 tag 樣式呈現）
  const checked = [...serviceBoxes].filter((b) => b.checked);
  const tagsHtml = checked
    .map((b) => `<span class="tag">${SERVICE_LABEL[b.value]}</span>`)
    .join("");

  // 症狀
  const sym = symptomTA.value.trim();

  // 寫入 DOM
  document.querySelector('[data-sum="when"]').textContent = whenStr;
  document.querySelector('[data-sum="place"]').textContent = placeStr;
  document.querySelector('[data-sum="services"]').innerHTML = tagsHtml;

  const symRow = document.querySelector('[data-sum-row="symptom"]');
  const symEl = document.querySelector('[data-sum="symptom"]');
  if (sym) {
    symEl.textContent = sym;
    symRow.hidden = false;
  } else {
    symRow.hidden = true;
  }
}

// ─── 事件綁定 ─────────────────────────────────
form.addEventListener("click", (e) => {
  const nextBtn = e.target.closest(".js-next");
  if (nextBtn) {
    const target = Number(nextBtn.dataset.next);
    if (target === 2 && !validateStep1()) return;
    if (target === 3) {
      if (!validateStep2()) return;
      renderSummary();
    }
    goStep(target);
    return;
  }
  const prevBtn = e.target.closest(".js-prev");
  if (prevBtn) {
    goStep(Number(prevBtn.dataset.prev));
  }
});

// 送出 → 顯示 Step 4 完成 hero
form.addEventListener("submit", (e) => {
  e.preventDefault();
  // 完成頁顯示車行名稱
  const sub = document.querySelector('[data-done="shopline"]');
  if (sub && state.shop) {
    sub.textContent = `等候 ${state.shop.name} 確認`;
  }
  goStep(4);
});
