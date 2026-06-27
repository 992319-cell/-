// ─── walkin-modal.js ─────────────────────────────
// 車行端「新增現場工單」燈箱
// 觸發:側欄黃色 CTA(shop-sidebar.js)點 → window.openWalkinModal()
// 流程:Step1 查手機 → 查到走 Step2 選車 / 查不到展開新客表單
//       送出時寫 mqzx:walkinOrders + mqzx:vehicleHist(新客)
//       並 dispatch 'walkin:created' 事件供 shop-orders.js 即時 prepend
// 動態渲染:用 createElement + replaceChildren(專案規則,不用 innerHTML)
// ──────────────────────────────────────────────────

(function () {
  const LS_WALKIN = "mqzx:walkinOrders";
  const LS_VEHICLE = "mqzx:vehicleHist";

  // ═══════════════════════════════════════════════════
  //   localStorage
  // ═══════════════════════════════════════════════════
  function loadWalkin() {
    try { return JSON.parse(localStorage.getItem(LS_WALKIN) || "[]"); }
    catch { return []; }
  }
  function saveWalkin(arr) {
    localStorage.setItem(LS_WALKIN, JSON.stringify(arr));
  }
  function loadVehicleHist() {
    try { return JSON.parse(localStorage.getItem(LS_VEHICLE) || "[]"); }
    catch { return []; }
  }
  function saveVehicleHist(arr) {
    localStorage.setItem(LS_VEHICLE, JSON.stringify(arr));
  }

  // ═══════════════════════════════════════════════════
  //   demo seed:0912-345-678 林小華(只在沒資料時建)
  // ═══════════════════════════════════════════════════
  (function seedDemo() {
    const hist = loadVehicleHist();
    if (hist.some((h) => h.phone === "0912-345-678")) return;
    hist.push({
      phone: "0912-345-678",
      name: "林小華",
      vehicles: [
        { plate: "ABC-1234", model: "Gogoro VIVA", kind: "機車", avatar: "./img/bike-avatar-01.jpg" },
        { plate: "XYZ-5678", model: "光陽 G6", kind: "機車", avatar: "./img/bike-avatar-02.jpg" },
      ],
    });
    saveVehicleHist(hist);
  })();

  // ═══════════════════════════════════════════════════
  //   小工具
  // ═══════════════════════════════════════════════════
  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (v === false || v == null) return;
        if (k === "class") e.className = v;
        else if (k === "text") e.textContent = v;
        else if (k.startsWith("on") && typeof v === "function") {
          e.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (v === true) {
          e.setAttribute(k, "");
        } else {
          e.setAttribute(k, v);
        }
      });
    }
    (children || []).forEach((c) => {
      if (c == null || c === false) return;
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return e;
  }

  function maskName(name) {
    if (!name) return "車主";
    return name[0] + "*";
  }

  function normalizePhone(s) {
    return (s || "").replace(/[^\d]/g, "");
  }

  // ─── 格式驗證 ─────────────────────────────────
  function validatePhone(v) {
    const d = normalizePhone(v);
    if (!d) return "請填手機";
    if (!/^09\d{8}$/.test(d)) return "格式有誤　例 0912-345-678";
    return null;
  }
  function validatePlate(v) {
    const x = (v || "").trim().toUpperCase();
    if (!x) return "請填車牌";
    if (!/^[A-Z]{2,3}-\d{3,4}$/.test(x)) return "格式有誤　例 ABC-1234";
    return null;
  }
  function validateModel(v) {
    if (!(v || "").trim()) return "請填車款";
    return null;
  }

  function setFieldError(input, msg) {
    input.classList.add("is-error");
    let err = input.nextElementSibling;
    if (!(err && err.classList && err.classList.contains("walkin-error"))) {
      err = document.createElement("p");
      err.className = "walkin-error";
      input.after(err);
    }
    err.textContent = msg;
  }
  function clearFieldError(input) {
    input.classList.remove("is-error");
    const next = input.nextElementSibling;
    if (next && next.classList && next.classList.contains("walkin-error")) {
      next.remove();
    }
  }
  function bindValidation(input, validator) {
    input.addEventListener("blur", () => {
      const err = validator(input.value);
      if (err) setFieldError(input, err);
      else clearFieldError(input);
    });
    input.addEventListener("input", () => {
      // 已經有錯:邊打邊更新(訊息切換 / 變正確就清除)
      if (input.classList.contains("is-error")) {
        const err = validator(input.value);
        if (err) setFieldError(input, err);
        else clearFieldError(input);
      }
    });
  }

  function findMember(phoneRaw) {
    const target = normalizePhone(phoneRaw);
    if (target.length < 8) return null;
    return loadVehicleHist().find((h) => normalizePhone(h.phone) === target) || null;
  }

  function todayParts() {
    const d = new Date();
    return {
      y: d.getFullYear(),
      m: String(d.getMonth() + 1).padStart(2, "0"),
      d: String(d.getDate()).padStart(2, "0"),
      hh: String(d.getHours()).padStart(2, "0"),
      mm: String(d.getMinutes()).padStart(2, "0"),
    };
  }

  function genOrderId() {
    const { y, m, d } = todayParts();
    const rand = Math.floor(Math.random() * 90 + 10);
    return `${y}${m}${d}-W${rand}`;
  }

  // ═══════════════════════════════════════════════════
  //   state
  // ═══════════════════════════════════════════════════
  let state = null;
  let root = null;

  function initState() {
    state = {
      step: 1,
      mode: "idle",       // 'idle' | 'found' | 'new'
      phone: "",
      member: null,
      selectedIdx: 0,
      newForm: { phone: "", plate: "", model: "", name: "", kind: "機車" },
    };
  }

  // ═══════════════════════════════════════════════════
  //   shell(燈箱框)
  // ═══════════════════════════════════════════════════
  function buildShell() {
    if (root) return root;
    root = el("div", {
      class: "walkin-modal",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "walkin-title",
      hidden: true,
    }, [
      el("div", { class: "walkin-backdrop", onclick: closeModal }),
      el("div", { class: "walkin-card" }, [
        el("div", { class: "walkin-head" }, [
          el("p", { id: "walkin-title", text: "新增現場工單" }),
          el("button", {
            type: "button",
            class: "walkin-close",
            "aria-label": "關閉",
            onclick: closeModal,
            text: "✕",
          }),
        ]),
        el("div", { class: "walkin-prog" }, [el("div"), el("div")]),
        el("div", { class: "walkin-body" }),
        el("div", { class: "walkin-foot" }),
      ]),
    ]);
    document.body.appendChild(root);
    return root;
  }

  // ═══════════════════════════════════════════════════
  //   render
  // ═══════════════════════════════════════════════════
  function render() {
    const title = root.querySelector("#walkin-title");
    const bars = root.querySelectorAll(".walkin-prog > div");
    const body = root.querySelector(".walkin-body");
    const foot = root.querySelector(".walkin-foot");

    if (state.step === 1 && state.mode === "new") {
      title.textContent = "登記新車主";
      bars[0].dataset.fill = "1";
      bars[1].dataset.fill = "1";
    } else if (state.step === 1) {
      title.textContent = "新增現場工單";
      bars[0].dataset.fill = "1";
      bars[1].dataset.fill = "0";
    } else {
      title.textContent = "選擇車輛";
      bars[0].dataset.fill = "1";
      bars[1].dataset.fill = "1";
    }

    foot.classList.remove("split");

    if (state.step === 1 && state.mode !== "new") {
      body.replaceChildren(...buildStep1Search());
      foot.replaceChildren(...buildStep1Foot());
    } else if (state.step === 1 && state.mode === "new") {
      body.replaceChildren(...buildStep1New());
      foot.classList.add("split");
      foot.replaceChildren(...buildStep1NewFoot());
    } else {
      body.replaceChildren(...buildStep2());
      foot.classList.add("split");
      foot.replaceChildren(...buildStep2Foot());
    }
  }

  // ─── Step 1 search ──────────────────────────────
  function buildStep1Search() {
    const out = [];
    out.push(el("label", { class: "field", for: "wk-phone", text: "車主手機" }));
    const input = el("input", {
      type: "tel",
      id: "wk-phone",
      placeholder: "09XX-XXX-XXX",
      value: state.phone,
      autocomplete: "off",
    });
    input.addEventListener("input", (e) => {
      state.phone = e.target.value;
      const digits = normalizePhone(state.phone);
      const found = findMember(state.phone);
      state.member = found;
      state.mode = found ? "found" : "idle";
      state.selectedIdx = 0;
      // 只局部更新會員卡 / 查無提示 / 按鈕,不重 build input(會失焦)
      const oldFound = root.querySelector(".walkin-found");
      const oldMiss  = root.querySelector(".walkin-notfound");
      if (oldFound) oldFound.remove();
      if (oldMiss)  oldMiss.remove();

      if (found) {
        input.after(buildFoundCard(found));
      } else if (digits.length >= 10) {
        // 已輸入完整手機但查無 → 跳明確提示,引導往下方「新客直接登記」
        input.after(buildNotFoundCard());
      }

      const nextBtn = root.querySelector(".walkin-foot button.primary");
      if (nextBtn) nextBtn.disabled = !found;
    });
    out.push(input);

    if (state.member) {
      out.push(buildFoundCard(state.member));
    }

    out.push(el("div", { class: "walkin-sep", text: "或" }));
    out.push(el("button", {
      type: "button",
      class: "walkin-new-link",
      onclick: () => {
        state.mode = "new";
        state.newForm.phone = state.phone;
        render();
      },
    }, ["+ 新客直接登記"]));

    return out;
  }

  function buildFoundCard(m) {
    return el("div", { class: "walkin-found" }, [
      el("p", { class: "name" }, [
        m.name,
        el("span", { class: "tag", text: "會員" }),
      ]),
      el("p", { class: "meta", text: `名下 ${m.vehicles.length} 台車` }),
    ]);
  }

  function buildNotFoundCard() {
    return el("div", { class: "walkin-notfound" }, [
      el("p", { class: "title", text: "查無此手機" }),
      el("p", { class: "meta", text: "請改用下方　新客直接登記" }),
    ]);
  }

  function buildStep1Foot() {
    return [
      el("button", { type: "button", onclick: closeModal, text: "取消" }),
      el("button", {
        type: "button",
        class: "primary",
        disabled: !state.member,
        onclick: () => {
          if (!state.member) return;
          state.step = 2;
          render();
        },
      }, ["下一步"]),
    ];
  }

  // ─── Step 1 new(新客表單)────────────────────
  function buildStep1New() {
    const out = [];
    newFormRefs = {};

    // 手機
    out.push(el("label", { class: "field", text: "車主手機" }));
    const phoneInput = el("input", {
      type: "tel",
      placeholder: "09XX-XXX-XXX",
      value: state.newForm.phone,
      autocomplete: "off",
      maxlength: "13",
      inputmode: "tel",
    });
    phoneInput.addEventListener("input", (e) => {
      state.newForm.phone = e.target.value;
      updateNewSubmitBtn();
      // 邊打邊驗:打滿 10 碼立刻驗格式(手機端 blur 不可靠)
      if (normalizePhone(e.target.value).length >= 10) {
        const err = validatePhone(e.target.value);
        if (err) setFieldError(phoneInput, err);
        else clearFieldError(phoneInput);
      }
    });
    bindValidation(phoneInput, validatePhone);
    newFormRefs.phone = phoneInput;
    out.push(phoneInput);

    // 車種 radio(機車 / 汽車)
    out.push(el("label", { class: "field", text: "車種" }));
    const grp = el("div", { class: "walkin-typegrp" }, ["機車", "汽車"].map((k) => {
      const checked = state.newForm.kind === k;
      return el("label", { class: "walkin-typeopt" }, [
        el("input", {
          type: "radio",
          name: "walkin-kind",
          value: k,
          checked,
          onchange: () => { state.newForm.kind = k; },
        }),
        el("span", { text: k }),
      ]);
    }));
    out.push(grp);

    // 車牌
    out.push(el("label", { class: "field", text: "車牌" }));
    const plateInput = el("input", {
      type: "text",
      placeholder: "ABC-1234",
      value: state.newForm.plate,
      autocomplete: "off",
      maxlength: "8",
    });
    plateInput.addEventListener("input", (e) => {
      // 過濾:只留 A-Z 0-9 連字符,自動大寫
      let v = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
      // 4 碼以上自動補連字符(典型 ABC1234 → ABC-1234)
      if (v.length > 3 && !v.includes("-") && /^[A-Z]{2,3}\d/.test(v)) {
        const letters = v.match(/^[A-Z]+/)[0];
        v = letters + "-" + v.slice(letters.length);
      }
      e.target.value = v;
      state.newForm.plate = v;
      updateNewSubmitBtn();
      // 滿格立刻驗
      if (v.replace(/-/g, "").length >= 6) {
        const err = validatePlate(v);
        if (err) setFieldError(plateInput, err);
        else clearFieldError(plateInput);
      }
    });
    bindValidation(plateInput, validatePlate);
    newFormRefs.plate = plateInput;
    out.push(plateInput);

    // 車款
    out.push(el("label", { class: "field", text: "車款" }));
    const modelInput = el("input", {
      type: "text",
      placeholder: "光陽 G6　Gogoro VIVA　SUZUKI Swish 125",
      value: state.newForm.model,
      autocomplete: "off",
    });
    modelInput.addEventListener("input", (e) => {
      state.newForm.model = e.target.value;
      updateNewSubmitBtn();
    });
    bindValidation(modelInput, validateModel);
    newFormRefs.model = modelInput;
    out.push(modelInput);

    // 姓名(選填)
    out.push(el("label", { class: "field" }, [
      "姓名",
      el("span", { class: "opt", text: "選填" }),
    ]));
    out.push(el("input", {
      type: "text",
      placeholder: "",
      value: state.newForm.name,
      autocomplete: "off",
      oninput: (e) => { state.newForm.name = e.target.value; },
    }));

    out.push(el("p", {
      class: "walkin-hint",
      text: "送出後車主資料會自動建檔　下次同手機可直接查到",
    }));
    return out;
  }

  let newFormRefs = {};

  function showAllNewErrors() {
    const f = state.newForm;
    const phoneDigits = normalizePhone(f.phone);
    const phoneInvalid = !/^09\d{8}$/.test(phoneDigits);
    const plateInvalid = !/^[A-Z]{2,3}-\d{3,4}$/.test(f.plate.trim().toUpperCase());
    const modelInvalid = !f.model.trim();

    if (newFormRefs.phone) {
      if (phoneInvalid) {
        setFieldError(newFormRefs.phone,
          !phoneDigits ? "請填手機" : "格式有誤　例 0912-345-678");
      } else {
        clearFieldError(newFormRefs.phone);
      }
    }
    if (newFormRefs.plate) {
      if (plateInvalid) {
        setFieldError(newFormRefs.plate,
          !f.plate ? "請填車牌" : "格式有誤　例 ABC-1234");
      } else {
        clearFieldError(newFormRefs.plate);
      }
    }
    if (newFormRefs.model) {
      if (modelInvalid) setFieldError(newFormRefs.model, "請填車款");
      else clearFieldError(newFormRefs.model);
    }

    // focus 第一個錯
    const first = phoneInvalid ? newFormRefs.phone
                : plateInvalid ? newFormRefs.plate
                : modelInvalid ? newFormRefs.model
                : null;
    first?.focus();
  }

  function newFormValid() {
    const f = state.newForm;
    const phoneOk = /^09\d{8}$/.test(normalizePhone(f.phone));
    const plateOk = /^[A-Z]{2,3}-\d{3,4}$/.test(f.plate.trim().toUpperCase());
    const modelOk = f.model.trim().length > 0;
    return phoneOk && plateOk && modelOk;
  }

  function updateNewSubmitBtn() {
    const btn = root.querySelector(".walkin-foot button.cta");
    if (btn) btn.setAttribute("aria-disabled", String(!newFormValid()));
  }

  function buildStep1NewFoot() {
    return [
      el("button", {
        type: "button",
        onclick: () => {
          state.mode = "idle";
          render();
        },
      }, ["← 返回"]),
      el("button", {
        type: "button",
        class: "cta",
        "aria-disabled": String(!newFormValid()),
        onclick: () => {
          if (!newFormValid()) {
            showAllNewErrors();
            return;
          }
          submitNew();
        },
      }, ["開始服務"]),
    ];
  }

  // ─── Step 2 vehicle pick ────────────────────────
  function buildStep2() {
    const out = [];
    const m = state.member;
    out.push(el("p", {
      class: "walkin-owner",
      text: `${m.name}　${m.phone}`,
    }));
    m.vehicles.forEach((v, idx) => {
      const checked = idx === state.selectedIdx;
      const label = el("label", { class: "walkin-vehicle" }, [
        el("input", {
          type: "radio",
          name: "walkin-vehicle",
          checked,
          onchange: () => {
            state.selectedIdx = idx;
            render();
          },
        }),
        v.avatar
          ? el("img", { src: v.avatar, alt: "" })
          : el("div", { class: "v-thumb" }, [
              el("img", {
                src: v.kind === "汽車"
                  ? "./icon/silhouette-car.png"
                  : "./icon/silhouette-bike.png",
                alt: "",
              }),
            ]),
        el("div", { class: "v-info" }, [
          el("p", { class: "v-plate", text: v.plate }),
          el("p", { class: "v-model", text: v.model }),
        ]),
      ]);
      out.push(label);
    });
    return out;
  }

  function buildStep2Foot() {
    return [
      el("button", {
        type: "button",
        onclick: () => { state.step = 1; render(); },
      }, ["← 上一步"]),
      el("button", { type: "button", class: "cta", onclick: submitMember }, ["開始服務"]),
    ];
  }

  // ═══════════════════════════════════════════════════
  //   送出:會員 / 新客
  // ═══════════════════════════════════════════════════
  function submitMember() {
    const m = state.member;
    const v = m.vehicles[state.selectedIdx];
    const order = makeOrder({
      plate: v.plate,
      model: v.model,
      kind: v.kind || "機車",
      name: m.name,
      avatar: v.avatar || "",
      source: "walkin",
    });
    persistAndClose(order);
  }

  function submitNew() {
    if (!newFormValid()) return;
    const f = state.newForm;
    const phone = f.phone.trim();
    const plate = f.plate.trim().toUpperCase();
    const model = f.model.trim();
    const kind = f.kind || "機車";
    const name = f.name.trim() || "現場登記";

    // 1. 寫回 vehicleHist(新車主或同手機補車)
    const hist = loadVehicleHist();
    let entry = hist.find((h) => normalizePhone(h.phone) === normalizePhone(phone));
    if (!entry) {
      entry = { phone, name, vehicles: [] };
      hist.push(entry);
    }
    if (!entry.vehicles.some((x) => x.plate === plate)) {
      entry.vehicles.push({ plate, model, kind, avatar: "" });
    }
    saveVehicleHist(hist);

    // 2. 建工單
    const order = makeOrder({
      plate, model, kind, name,
      avatar: "",
      source: "walkin",
    });
    persistAndClose(order);
  }

  function makeOrder({ plate, model, kind, name, avatar, source }) {
    const t = todayParts();
    return {
      id: genOrderId(),
      status: "in_progress",
      plate,
      model,
      kind: kind || "",
      name,
      avatar,
      shop: "光陽機車行　台北信義",
      mileage: "",
      services: [],
      price: 0,
      source,
      createdAt: `${t.y}-${t.m}-${t.d}T${t.hh}:${t.mm}`,
      dateLabel: `${t.m}.${t.d}`,
      timeLabel: `${t.hh}:${t.mm}`,
      yearLabel: String(t.y),
    };
  }

  function persistAndClose(order) {
    const all = loadWalkin();
    all.unshift(order);
    saveWalkin(all);

    // 廣播給同分頁的 shop-orders.js / shop-dashboard.js
    window.dispatchEvent(new CustomEvent("walkin:created", { detail: order }));

    closeModal();
    showToast(`已建立工單　${order.plate}`);
  }

  // ═══════════════════════════════════════════════════
  //   open / close / toast
  // ═══════════════════════════════════════════════════
  function openModal() {
    buildShell();
    initState();
    render();
    root.hidden = false;
    setTimeout(() => {
      const input = root.querySelector("input");
      input?.focus();
    }, 0);
  }

  function closeModal() {
    if (!root) return;
    root.hidden = true;
  }

  function showToast(msg) {
    let t = document.querySelector(".walkin-toast");
    if (!t) {
      t = el("div", { class: "walkin-toast" });
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add("is-show"));
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("is-show"), 2200);
  }

  // ESC 關閉
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root && !root.hidden) closeModal();
  });

  // 對外
  window.openWalkinModal = openModal;
})();
