/* ====================================================
   vehicle.js
   車庫頁:卡片格動態渲染
   ── mock seed 對齊 history.js 的 VEHICLES
   ── localStorage:mqzx:vehicles 持久化
   ── ★ 切換主要車寫 localStorage mqzx:primaryPlate
   ── 點卡片任意處 → history.html?plate=XXX
   ── 新增 / 編輯 / 刪除走 vehicle-modal.js
   ==================================================== */

(function () {
  "use strict";

  // ── 手機 reset 機制 ───────────────────────────
  // 網址加 ?reset=1 重新整理即清空車庫相關 LS,讓 SEED 重新寫入
  // 用途:demo 前清乾淨 / 手機難清 LS 時的後門
  try {
    if (new URLSearchParams(location.search).get("reset") === "1") {
      localStorage.removeItem("mqzx:vehicles");
      localStorage.removeItem("mqzx:primaryPlate");
      // 清掉 query string 避免下次重整又清一次
      history.replaceState(null, "", location.pathname);
    }
  } catch {}

  // ── seed:跟 history.js 對齊 ────────────────────
  const SEED = [
    {
      plate: "ABC-1234",
      model: "SUZUKI Swish",
      nickname: "狗熊",
      kind: "機車",
      mileage: "32,520",
      lastService: "2025.11.04",
      avatar: "./img/bike-avatar-04.jpg",
    },
    {
      plate: "RAH-5688",
      model: "TOYOTA Altis",
      nickname: "",
      kind: "汽車",
      mileage: "58,650",
      lastService: "2025.09.12",
      avatar: "./img/car-avatar-01.jpg",
    },
  ];

  const LS_VEHICLES = "mqzx:vehicles";
  const LS_PRIMARY = "mqzx:primaryPlate";

  // ── LS load / save ─────────────────────────
  function loadVehicles() {
    try {
      const raw = localStorage.getItem(LS_VEHICLES);
      if (!raw) {
        localStorage.setItem(LS_VEHICLES, JSON.stringify(SEED));
        return SEED.slice();
      }
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) {
        localStorage.setItem(LS_VEHICLES, JSON.stringify(SEED));
        return SEED.slice();
      }
      return arr;
    } catch {
      localStorage.setItem(LS_VEHICLES, JSON.stringify(SEED));
      return SEED.slice();
    }
  }
  function saveVehicles() {
    localStorage.setItem(LS_VEHICLES, JSON.stringify(vehicles));
  }

  let vehicles = loadVehicles();

  // ── DOM ─────────────────────────────────────
  const grid = document.getElementById("veh-grid");
  const summary = document.getElementById("veh-summary");
  const emptyEl = document.getElementById("veh-empty");
  const addBtn = document.getElementById("veh-add-btn");

  // ── helpers ─────────────────────────────────
  function getPrimaryPlate() {
    const stored = localStorage.getItem(LS_PRIMARY);
    if (stored && vehicles.some((v) => v.plate === stored)) return stored;
    return vehicles[0] ? vehicles[0].plate : null;
  }
  function setPrimaryPlate(plate) {
    localStorage.setItem(LS_PRIMARY, plate);
  }
  function closeAllMenus() {
    document.querySelectorAll(".veh-card .menu").forEach((m) => {
      m.hidden = true;
    });
    document.querySelectorAll(".veh-card .menu-btn").forEach((b) => {
      b.setAttribute("aria-expanded", "false");
    });
  }

  // ── 卡片 markup ────────────────────────────
  // ── 小工具:el ───────────────────────────────
  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (v === false || v == null) return;
        if (k === "class") e.className = v;
        else if (k === "text") e.textContent = v;
        else if (k.startsWith("data-")) e.setAttribute(k, v);
        else if (k.startsWith("aria-")) e.setAttribute(k, v);
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

  function iconSvg(paths) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.5");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    paths.forEach(([tag, attrs]) => {
      const p = document.createElementNS("http://www.w3.org/2000/svg", tag);
      Object.entries(attrs).forEach(([k, v]) => p.setAttribute(k, v));
      svg.appendChild(p);
    });
    return svg;
  }

  // ── 卡片構建 ──────────────────────────────
  function buildCard(v, primaryPlate) {
    const isPrimary = v.plate === primaryPlate;
    const silhouette =
      v.kind === "汽車"
        ? "./icon/silhouette-car.png"
        : "./icon/silhouette-bike.png";

    const hasNick = !!(v.nickname && v.nickname.trim());
    const titleText = hasNick ? v.nickname : v.plate;
    const subParts = [];
    if (hasNick) subParts.push(v.plate);
    subParts.push(v.model);
    subParts.push(v.kind);
    const subText = subParts.join("　　");

    const mileageDisplay =
      v.mileage && v.mileage !== "0" ? `${v.mileage} km` : "—";
    const lastServiceDisplay = v.lastService || "—";

    // 照片區:有 avatar 用,onerror fallback silhouette;沒 avatar 直接 silhouette
    const usingSilhouette = !v.avatar;
    const img = el("img", {
      src: v.avatar || silhouette,
      alt: titleText,
      "data-fallback": usingSilhouette ? "true" : "false",
    });
    if (v.avatar) {
      img.addEventListener("error", () => {
        img.src = silhouette;
        img.dataset.fallback = "true";
      });
    }

    // 角落 actions
    const actions = el("div", { class: "actions" }, [
      el("button", {
        type: "button",
        class: "star" + (isPrimary ? " is-primary" : ""),
        "data-act": "star",
        "aria-label": isPrimary ? "目前為主要車輛" : "設為主要車輛",
        title: isPrimary ? "主要車輛" : "設為主要",
        text: "★",
      }),
      el(
        "button",
        {
          type: "button",
          class: "menu-btn",
          "data-act": "menu",
          "aria-haspopup": "true",
          "aria-expanded": "false",
          "aria-label": "更多操作",
        },
        [
          iconSvg([
            ["circle", { cx: "12", cy: "5", r: "1" }],
            ["circle", { cx: "12", cy: "12", r: "1" }],
            ["circle", { cx: "12", cy: "19", r: "1" }],
          ]),
        ],
      ),
      el("ul", { class: "menu", role: "menu", hidden: true }, [
        el("li", { role: "menuitem", "data-act": "set-primary" }, [
          iconSvg([
            [
              "polygon",
              {
                points:
                  "12 2 15 9 22 9.5 17 14 18.5 21 12 17.5 5.5 21 7 14 2 9.5 9 9 12 2",
              },
            ],
          ]),
          "設為主要",
        ]),
        el("li", { role: "menuitem", "data-act": "edit" }, [
          iconSvg([
            ["path", { d: "M12 20h9" }],
            ["path", { d: "M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" }],
          ]),
          "編輯資料",
        ]),
        el("li", { role: "menuitem", "data-act": "delete", class: "danger" }, [
          iconSvg([
            ["polyline", { points: "3 6 5 6 21 6" }],
            ["path", { d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" }],
            ["path", { d: "M10 11v6M14 11v6" }],
          ]),
          "刪除車輛",
        ]),
      ]),
    ]);

    // 照片
    const figure = el("figure", {}, [img]);

    // 主資訊區
    const body = el("div", { class: "body" }, [
      el("h2", { text: titleText }),
      el("p", { text: subText }),
      el("dl", {}, [
        el("div", {}, [
          el("dt", { text: "目前里程" }),
          el("dd", { text: mileageDisplay }),
        ]),
        el("div", {}, [
          el("dt", { text: "上次保養" }),
          el("dd", { text: lastServiceDisplay }),
        ]),
      ]),
      el(
        "a",
        {
          class: "cta",
          href: `history.html?plate=${encodeURIComponent(v.plate)}`,
          "data-act": "goto-history",
        },
        [
          "完整車歷",
          iconSvg([
            ["line", { x1: "5", y1: "12", x2: "19", y2: "12" }],
            ["polyline", { points: "12 5 19 12 12 19" }],
          ]),
        ],
      ),
    ]);

    const card = el(
      "article",
      {
        class: "veh-card",
        "data-plate": v.plate,
        tabindex: "0",
      },
      [actions, figure, body],
    );

    return card;
  }

  // ── 渲染整個 grid ──────────────────────────
  function render() {
    const primaryPlate = getPrimaryPlate();
    grid.replaceChildren();

    if (vehicles.length === 0) {
      emptyEl.hidden = false;
      summary.textContent = "車庫還沒有車輛";
      return;
    }

    emptyEl.hidden = true;

    const sorted = [...vehicles].sort((a, b) => {
      if (a.plate === primaryPlate) return -1;
      if (b.plate === primaryPlate) return 1;
      return 0;
    });

    sorted.forEach((v) => grid.appendChild(buildCard(v, primaryPlate)));

    const bikeCount = vehicles.filter((v) => v.kind === "機車").length;
    const carCount = vehicles.filter((v) => v.kind === "汽車").length;
    const parts = [`共 ${vehicles.length} 台`];
    if (bikeCount) parts.push(`機車 ${bikeCount}`);
    if (carCount) parts.push(`汽車 ${carCount}`);
    summary.textContent = parts.join("　");
  }

  // ── modal callback handlers ────────────────
  function handleAdd(payload) {
    const { plate, model, kind, nickname, lastService, avatar } = payload;
    vehicles.push({
      plate,
      model,
      kind,
      nickname: nickname || "",
      mileage: "", // 新車輛沒里程　等車行端標完工帶進
      lastService,
      avatar,
    });
    saveVehicles();
    if (vehicles.length === 1) setPrimaryPlate(plate);
    render();
  }
  function handleEdit(payload) {
    const orig = payload._originalPlate;
    const idx = vehicles.findIndex((v) => v.plate === orig);
    if (idx < 0) return;
    const { plate, model, kind, nickname, lastService, avatar } = payload;
    // 保留原 mileage(由車行端維護)
    vehicles[idx] = {
      plate,
      model,
      kind,
      nickname: nickname || "",
      mileage: vehicles[idx].mileage || "",
      lastService,
      avatar,
    };
    if (orig !== plate && localStorage.getItem(LS_PRIMARY) === orig) {
      setPrimaryPlate(plate);
    }
    saveVehicles();
    render();
  }
  function handleDelete(plate) {
    const v = vehicles.find((x) => x.plate === plate);
    if (!v) return;
    const ok = confirm(`確定刪除 ${v.plate}　${v.model}　此操作無法復原`);
    if (!ok) return;
    vehicles = vehicles.filter((x) => x.plate !== plate);
    if (localStorage.getItem(LS_PRIMARY) === plate) {
      if (vehicles.length > 0) setPrimaryPlate(vehicles[0].plate);
      else localStorage.removeItem(LS_PRIMARY);
    }
    saveVehicles();
    render();
  }

  // ── 事件 delegation ────────────────────────
  grid.addEventListener("click", function (e) {
    const card = e.target.closest(".veh-card");
    if (!card) return;
    const plate = card.dataset.plate;

    // ★
    const starBtn = e.target.closest('[data-act="star"]');
    if (starBtn) {
      e.preventDefault();
      e.stopPropagation();
      setPrimaryPlate(plate);
      render();
      return;
    }

    // dots menu
    const menuBtn = e.target.closest('[data-act="menu"]');
    if (menuBtn) {
      e.preventDefault();
      e.stopPropagation();
      const menu = card.querySelector(".menu");
      const isOpen = !menu.hidden;
      closeAllMenus();
      if (!isOpen) {
        menu.hidden = false;
        menuBtn.setAttribute("aria-expanded", "true");
      }
      return;
    }

    const setPrimaryItem = e.target.closest('[data-act="set-primary"]');
    if (setPrimaryItem) {
      e.preventDefault();
      e.stopPropagation();
      setPrimaryPlate(plate);
      closeAllMenus();
      render();
      return;
    }
    const editItem = e.target.closest('[data-act="edit"]');
    if (editItem) {
      e.preventDefault();
      e.stopPropagation();
      closeAllMenus();
      const v = vehicles.find((x) => x.plate === plate);
      if (!v) return;
      window.openVehicleModal({
        mode: "edit",
        vehicle: v,
        existingPlates: vehicles.map((x) => x.plate),
        onSubmit: handleEdit,
      });
      return;
    }
    const deleteItem = e.target.closest('[data-act="delete"]');
    if (deleteItem) {
      e.preventDefault();
      e.stopPropagation();
      closeAllMenus();
      handleDelete(plate);
      return;
    }

    if (e.target.closest('[data-act="goto-history"]')) return;

    window.location.href = `history.html?plate=${encodeURIComponent(plate)}`;
  });

  grid.addEventListener("keydown", function (e) {
    const card = e.target.closest(".veh-card");
    if (!card) return;
    if (e.key === "Enter" || e.key === " ") {
      const isInteractive = e.target.closest("button, a, [role='menuitem']");
      if (isInteractive) return;
      e.preventDefault();
      window.location.href = `history.html?plate=${encodeURIComponent(card.dataset.plate)}`;
    }
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".veh-card .actions")) {
      closeAllMenus();
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAllMenus();
  });

  // 新增車輛 CTA
  addBtn.addEventListener("click", function () {
    window.openVehicleModal({
      mode: "add",
      existingPlates: vehicles.map((x) => x.plate),
      onSubmit: handleAdd,
    });
  });

  // ── init ───────────────────────────────────
  render();
})();

/* ====================================================
   ↓↓↓ 以下為新增 / 編輯車輛 modal 的邏輯
   原本獨立 vehicle-modal.js　已合併至此檔
   ==================================================== */

/* ====================================================
   vehicle-modal.js
   車庫頁「新增 / 編輯車輛」燈箱
   ── 仿 walkin-modal 結構:state + el + bindValidation + showAllErrors
   ── 對外 API:
        window.openVehicleModal({ mode, vehicle, onSubmit })
        mode = 'add' | 'edit'
        vehicle = 編輯時帶入既有資料
        onSubmit(payload) = 送出時的 callback,由呼叫方負責寫 LS / render
   ── 不寫 LS,純粹收集表單 + 驗證 + 回拋資料
   ──────────────────────────────────────────────────── */

(function () {
  "use strict";

  // ── 工具:el ─────────────────────────────────
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

  // ── 驗證 ─────────────────────────────────────
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
    let err = input.parentElement.querySelector(".vm-error");
    if (!err) {
      err = document.createElement("p");
      err.className = "vm-error";
      input.after(err);
    }
    err.textContent = msg;
  }
  function clearFieldError(input) {
    input.classList.remove("is-error");
    const next = input.parentElement.querySelector(".vm-error");
    if (next) next.remove();
  }
  function bindValidation(input, validator) {
    input.addEventListener("blur", () => {
      const err = validator(input.value);
      if (err) setFieldError(input, err);
      else clearFieldError(input);
    });
    input.addEventListener("input", () => {
      if (input.classList.contains("is-error")) {
        const err = validator(input.value);
        if (err) setFieldError(input, err);
        else clearFieldError(input);
      }
    });
  }

  // ── state ───────────────────────────────────
  let root = null;
  let state = null;
  let refs = {};

  function initState(opts) {
    const v = opts.vehicle || {};
    state = {
      mode: opts.mode || "add",
      originalPlate: v.plate || null,
      onSubmit: opts.onSubmit || function () {},
      existingPlates: opts.existingPlates || [],
      form: {
        plate: v.plate || "",
        model: v.model || "",
        nickname: v.nickname || "",
        kind: v.kind || "機車",
        lastService: v.lastService || todayISO(),
        avatar: v.avatar || "",
      },
      // 保留編輯時不能被表單改的欄位,送出時帶回
      preserve: {
        mileage: v.mileage || "",
      },
    };
    refs = {};
  }

  function todayISO() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  }
  // 把 YYYY-MM-DD 變 YYYY.MM.DD,或 YYYY.MM.DD 保留
  function normalizeDateForDisplay(s) {
    if (!s) return "";
    return s.replace(/-/g, ".");
  }
  function normalizeDateForInput(s) {
    if (!s) return todayISO();
    // 既有顯示格式 2025.11.04 → input 用 2025-11-04
    if (/^\d{4}\.\d{2}\.\d{2}$/.test(s)) return s.replace(/\./g, "-");
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    return todayISO();
  }

  // ── 車種對應的 silhouette 路徑 ──────────────────
  function silhouetteForKind(kind) {
    return kind === "汽車"
      ? "./icon/silhouette-car.png"
      : "./icon/silhouette-bike.png";
  }

  function renderAvatarPreview(box, avatar, kind) {
    box.replaceChildren();
    if (avatar) {
      const img = el("img", {
        src: avatar,
        alt: "",
        class: "vm-avatar-photo",
      });
      img.addEventListener("error", () => {
        renderAvatarPreview(box, "", kind);
      });
      box.appendChild(img);
    } else {
      box.classList.add("is-empty");
      const sil = el("img", {
        src: silhouetteForKind(kind),
        alt: "",
        class: "vm-avatar-silhouette",
      });
      box.appendChild(sil);
      return;
    }
    box.classList.remove("is-empty");
  }

  // ── shell ───────────────────────────────────
  function buildShell() {
    if (root) return root;
    root = el(
      "div",
      {
        class: "vm-modal",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "vm-title",
        hidden: true,
      },
      [
        el("div", { class: "vm-backdrop", onclick: closeModal }),
        el("div", { class: "vm-card" }, [
          el("div", { class: "vm-head" }, [
            el("p", { id: "vm-title", text: "新增車輛" }),
            el("button", {
              type: "button",
              class: "vm-close",
              "aria-label": "關閉",
              onclick: closeModal,
              text: "✕",
            }),
          ]),
          el("div", { class: "vm-body" }),
          el("div", { class: "vm-foot" }),
        ]),
      ],
    );
    document.body.appendChild(root);
    return root;
  }

  // ── render ──────────────────────────────────
  function render() {
    const title = root.querySelector("#vm-title");
    title.textContent = state.mode === "edit" ? "編輯車輛" : "新增車輛";

    const body = root.querySelector(".vm-body");
    const foot = root.querySelector(".vm-foot");

    body.replaceChildren(...buildForm());
    foot.replaceChildren(...buildFoot());
  }

  function buildForm() {
    const out = [];
    const f = state.form;

    // 車牌
    const plateWrap = el("div", { class: "vm-field" });
    plateWrap.appendChild(
      el("label", { class: "vm-label", for: "vm-plate", text: "車牌" }),
    );
    const plateInput = el("input", {
      type: "text",
      id: "vm-plate",
      placeholder: "ABC-1234",
      value: f.plate,
      autocomplete: "off",
      maxlength: "10",
    });
    plateInput.addEventListener("input", (e) => {
      // 即時擋非法字元:只留英文 數字 連字符,自動大寫
      const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
      if (cleaned !== e.target.value) {
        const pos =
          e.target.selectionStart - (e.target.value.length - cleaned.length);
        e.target.value = cleaned;
        e.target.setSelectionRange(pos, pos);
      }
      f.plate = cleaned;
      updateSubmitBtn();
    });
    bindValidation(plateInput, (val) => combinedPlateValidator(val));
    plateWrap.appendChild(plateInput);
    refs.plate = plateInput;
    out.push(plateWrap);

    // 車款
    const modelWrap = el("div", { class: "vm-field" });
    modelWrap.appendChild(
      el("label", { class: "vm-label", for: "vm-model", text: "車款" }),
    );
    const modelInput = el("input", {
      type: "text",
      id: "vm-model",
      placeholder: "例　Gogoro VIVA",
      value: f.model,
      autocomplete: "off",
    });
    modelInput.addEventListener("input", (e) => {
      f.model = e.target.value;
      updateSubmitBtn();
    });
    bindValidation(modelInput, validateModel);
    modelWrap.appendChild(modelInput);
    refs.model = modelInput;
    out.push(modelWrap);

    // 暱稱(選填)
    const nickWrap = el("div", { class: "vm-field" });
    nickWrap.appendChild(
      el("label", { class: "vm-label", for: "vm-nickname" }, [
        "暱稱",
        el("span", { class: "vm-opt", text: "選填" }),
      ]),
    );
    const nickInput = el("input", {
      type: "text",
      id: "vm-nickname",
      placeholder: "例　狗熊",
      value: f.nickname,
      autocomplete: "off",
      maxlength: "20",
    });
    nickInput.addEventListener("input", (e) => {
      f.nickname = e.target.value;
    });
    nickWrap.appendChild(nickInput);
    out.push(nickWrap);

    // 車種(radio)
    const kindWrap = el("div", { class: "vm-field" });
    kindWrap.appendChild(el("p", { class: "vm-label", text: "車種" }));
    const kindGroup = el("div", { class: "vm-typegrp" });
    ["機車", "汽車"].forEach((k) => {
      const opt = el("label", { class: "vm-typeopt" }, [
        el("input", {
          type: "radio",
          name: "vm-kind",
          value: k,
          checked: f.kind === k,
          onchange: () => {
            f.kind = k;
          },
        }),
        k,
      ]);
      kindGroup.appendChild(opt);
    });
    kindWrap.appendChild(kindGroup);
    out.push(kindWrap);

    // 上次保養日期(選填)
    // ── 用 flatpickr 取代 native date input,iOS Safari 才能改外觀
    // ── maxDate 設今天:保養日期不可能是未來
    const dateWrap = el("div", { class: "vm-field" });
    dateWrap.appendChild(
      el("label", { class: "vm-label", for: "vm-date" }, [
        "上次保養日期",
        el("span", { class: "vm-opt", text: "選填" }),
      ]),
    );
    const dateInput = el("input", {
      type: "text",
      id: "vm-date",
      placeholder: "請選擇日期",
      value: f.lastService ? normalizeDateForDisplay(f.lastService) : "",
      readonly: true,
      autocomplete: "off",
    });
    dateWrap.appendChild(dateInput);
    refs.lastService = dateInput;
    out.push(dateWrap);

    // 等 DOM 加入後 init flatpickr
    setTimeout(() => {
      if (typeof flatpickr === "undefined") return;
      flatpickr(dateInput, {
        locale:
          flatpickr.l10ns && flatpickr.l10ns.zh_tw
            ? flatpickr.l10ns.zh_tw
            : "default",
        maxDate: "today",
        dateFormat: "Y.m.d",
        disableMobile: true,
        defaultDate: f.lastService
          ? normalizeDateForInput(f.lastService)
          : null,
        onChange: (selectedDates, dateStr) => {
          f.lastService = dateStr;
        },
      });
    }, 0);

    // 車輛照片(上傳　選填)
    const avWrap = el("div", { class: "vm-field" });
    avWrap.appendChild(
      el("label", { class: "vm-label" }, [
        "車輛照片",
        el("span", { class: "vm-opt", text: "選填" }),
      ]),
    );

    const avBox = el("div", { class: "vm-avatar-box" });
    const preview = el("div", { class: "vm-avatar-preview" });
    renderAvatarPreview(preview, f.avatar, f.kind);

    const avControls = el("div", { class: "vm-avatar-ctrls" });
    const fileInput = el("input", {
      type: "file",
      id: "vm-avatar-file",
      accept: "image/*",
      class: "vm-avatar-input",
    });
    const uploadBtn = el("label", {
      for: "vm-avatar-file",
      class: "vm-avatar-btn",
      text: f.avatar ? "更換照片" : "上傳照片",
    });
    const clearBtn = el("button", {
      type: "button",
      class: "vm-avatar-clear",
      hidden: !f.avatar,
      onclick: () => {
        f.avatar = "";
        renderAvatarPreview(preview, "", f.kind);
        uploadBtn.textContent = "上傳照片";
        clearBtn.hidden = true;
        fileInput.value = "";
      },
      text: "移除",
    });

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      // 限制 2MB 內,避免 LS 爆
      if (file.size > 2 * 1024 * 1024) {
        alert("照片過大　請壓到 2MB 以內");
        fileInput.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        f.avatar = ev.target.result;
        renderAvatarPreview(preview, f.avatar, f.kind);
        uploadBtn.textContent = "更換照片";
        clearBtn.hidden = false;
      };
      reader.readAsDataURL(file);
    });

    avControls.append(uploadBtn, clearBtn, fileInput);
    avBox.append(preview, avControls);
    avWrap.appendChild(avBox);
    out.push(avWrap);

    // 車種切換時若 avatar 空,預覽要重畫(silhouette 要跟車種對應)
    kindGroup.addEventListener("change", () => {
      if (!f.avatar) renderAvatarPreview(preview, "", f.kind);
    });

    return out;
  }

  // 車牌驗證 + 重複檢查
  function combinedPlateValidator(val) {
    const basic = validatePlate(val);
    if (basic) return basic;
    const x = val.trim().toUpperCase();
    // 編輯模式下,維持原車牌不算重複
    if (
      state.mode === "edit" &&
      x === (state.originalPlate || "").toUpperCase()
    ) {
      return null;
    }
    if (state.existingPlates.some((p) => p.toUpperCase() === x)) {
      return "車牌已存在　請確認";
    }
    return null;
  }

  function buildFoot() {
    return [
      el("button", {
        type: "button",
        class: "vm-btn",
        onclick: closeModal,
        text: "取消",
      }),
      el("button", {
        type: "button",
        class: "vm-btn vm-cta",
        "aria-disabled": String(!formValid()),
        onclick: () => {
          if (!formValid()) {
            showAllErrors();
            return;
          }
          doSubmit();
        },
        text: state.mode === "edit" ? "儲存變更" : "新增",
      }),
    ];
  }

  function formValid() {
    const f = state.form;
    if (combinedPlateValidator(f.plate)) return false;
    if (validateModel(f.model)) return false;
    return true;
  }

  function updateSubmitBtn() {
    const btn = root.querySelector(".vm-cta");
    if (btn) btn.setAttribute("aria-disabled", String(!formValid()));
  }

  function showAllErrors() {
    const f = state.form;
    const plateErr = combinedPlateValidator(f.plate);
    const modelErr = validateModel(f.model);

    if (plateErr) setFieldError(refs.plate, plateErr);
    else clearFieldError(refs.plate);
    if (modelErr) setFieldError(refs.model, modelErr);
    else clearFieldError(refs.model);

    const first = plateErr ? refs.plate : modelErr ? refs.model : null;
    first?.focus();
  }

  function doSubmit() {
    const f = state.form;
    const plate = f.plate.trim().toUpperCase();
    const model = f.model.trim();
    const kind = f.kind || "機車";
    const lastService = normalizeDateForDisplay(f.lastService || todayISO());
    const avatar = f.avatar || "";
    // 里程不在表單裡　新車預設空字串　編輯時保留原值
    const mileage = state.preserve.mileage || "";

    const payload = {
      plate,
      model,
      kind,
      mileage,
      lastService,
      avatar,
      nickname: (f.nickname || "").trim(),
      _originalPlate: state.originalPlate,
      _mode: state.mode,
    };

    try {
      state.onSubmit(payload);
    } catch (e) {
      console.error(e);
    }
    closeModal();
  }

  // ── open / close ────────────────────────────
  function openModal(opts) {
    buildShell();
    initState(opts || {});
    render();
    root.hidden = false;
    setTimeout(() => {
      refs.plate?.focus();
      if (state.mode === "edit") refs.plate?.blur();
    }, 0);
  }
  function closeModal() {
    if (!root) return;
    root.hidden = true;
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root && !root.hidden) closeModal();
  });

  // 對外
  window.openVehicleModal = openModal;
})();
