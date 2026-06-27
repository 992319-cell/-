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

    // ── seed:跟 history.js 對齊 ────────────────────
    const SEED = [
        {
            plate: "ABC-1234",
            model: "Gogoro VIVA",
            nickname: "狗熊",
            kind: "機車",
            mileage: "32,520",
            lastService: "2025.11.04",
            avatar: "./img/bike-avatar-01.jpg"
        },
        {
            plate: "RAH-5688",
            model: "TOYOTA Altis",
            nickname: "",
            kind: "汽車",
            mileage: "58,650",
            lastService: "2025.09.12",
            avatar: "./img/car-avatar-01.jpg"
        }
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
        if (stored && vehicles.some(v => v.plate === stored)) return stored;
        return vehicles[0] ? vehicles[0].plate : null;
    }
    function setPrimaryPlate(plate) {
        localStorage.setItem(LS_PRIMARY, plate);
    }
    function closeAllMenus() {
        document.querySelectorAll(".veh-menu").forEach(m => { m.hidden = true; });
        document.querySelectorAll(".veh-menu-btn").forEach(b => {
            b.setAttribute("aria-expanded", "false");
        });
    }

    // ── 卡片 markup ────────────────────────────
    function buildCard(v, primaryPlate) {
        const card = document.createElement("article");
        card.className = "veh-card";
        card.dataset.plate = v.plate;

        const isPrimary = v.plate === primaryPlate;
        const silhouette = v.kind === "汽車"
            ? "./icon/silhouette-car.png"
            : "./icon/silhouette-bike.png";

        // 主標:有暱稱用暱稱當主標,plate 降為副;沒暱稱 plate 當主標
        const hasNick = !!(v.nickname && v.nickname.trim());
        const titleText = hasNick ? v.nickname : v.plate;
        const subParts = [];
        if (hasNick) subParts.push(v.plate);
        subParts.push(v.model);
        subParts.push(v.kind);
        const subText = subParts.join("　・　");

        const mileageDisplay = (v.mileage && v.mileage !== "0" && v.mileage !== "")
            ? `${v.mileage} km`
            : "—";
        const lastServiceDisplay = v.lastService || "—";

        // 照片區:有 avatar 用使用者上傳/預設,onerror fallback 到車種 silhouette
        // 沒 avatar 直接用 silhouette
        const photoInner = v.avatar
            ? `<img src="${v.avatar}" alt="${titleText}"
                    onerror="this.onerror=null;this.src='${silhouette}';this.classList.add('is-silhouette')">`
            : `<img src="${silhouette}" alt="${titleText}" class="is-silhouette">`;

        card.innerHTML = `
            <div class="veh-card-actions">
                <button type="button"
                        class="veh-star${isPrimary ? " is-primary" : ""}"
                        data-act="star"
                        aria-label="${isPrimary ? "目前為主要車輛" : "設為主要車輛"}"
                        title="${isPrimary ? "主要車輛" : "設為主要"}">★</button>
                <button type="button"
                        class="veh-menu-btn"
                        data-act="menu"
                        aria-haspopup="true"
                        aria-expanded="false"
                        aria-label="更多操作">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                         stroke="currentColor" stroke-width="1.5"
                         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <circle cx="12" cy="5" r="1"/>
                        <circle cx="12" cy="12" r="1"/>
                        <circle cx="12" cy="19" r="1"/>
                    </svg>
                </button>
                <ul class="veh-menu" role="menu" hidden>
                    <li role="menuitem" data-act="set-primary">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
                             stroke="currentColor" stroke-width="1.5"
                             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <polygon points="12 2 15 9 22 9.5 17 14 18.5 21 12 17.5 5.5 21 7 14 2 9.5 9 9 12 2"/>
                        </svg>
                        設為主要
                    </li>
                    <li role="menuitem" data-act="edit">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
                             stroke="currentColor" stroke-width="1.5"
                             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/>
                        </svg>
                        編輯資料
                    </li>
                    <li role="menuitem" class="is-danger" data-act="delete">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
                             stroke="currentColor" stroke-width="1.5"
                             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                        </svg>
                        刪除車輛
                    </li>
                </ul>
            </div>
            <div class="veh-photo">
                ${photoInner}
            </div>
            <div class="veh-info">
                <h2 class="veh-plate">${titleText}</h2>
                <p class="veh-sub">${subText}</p>
                <dl class="veh-meta">
                    <div>
                        <dt>目前里程</dt>
                        <dd>${mileageDisplay}</dd>
                    </div>
                    <div>
                        <dt>上次保養</dt>
                        <dd>${lastServiceDisplay}</dd>
                    </div>
                </dl>
                <a class="veh-cta" href="history.html?plate=${encodeURIComponent(v.plate)}" data-act="goto-history">
                    完整車歷
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
                         stroke="currentColor" stroke-width="1.5"
                         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                    </svg>
                </a>
            </div>
        `;

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

        sorted.forEach(v => grid.appendChild(buildCard(v, primaryPlate)));

        const bikeCount = vehicles.filter(v => v.kind === "機車").length;
        const carCount = vehicles.filter(v => v.kind === "汽車").length;
        const parts = [`共 ${vehicles.length} 台`];
        if (bikeCount) parts.push(`機車 ${bikeCount}`);
        if (carCount) parts.push(`汽車 ${carCount}`);
        summary.textContent = parts.join("　");
    }

    // ── modal callback handlers ────────────────
    function handleAdd(payload) {
        const { plate, model, kind, nickname, lastService, avatar } = payload;
        vehicles.push({
            plate, model, kind, nickname: nickname || "",
            mileage: "",   // 新車輛沒里程　等車行端標完工帶進
            lastService, avatar
        });
        saveVehicles();
        if (vehicles.length === 1) setPrimaryPlate(plate);
        render();
    }
    function handleEdit(payload) {
        const orig = payload._originalPlate;
        const idx = vehicles.findIndex(v => v.plate === orig);
        if (idx < 0) return;
        const { plate, model, kind, nickname, lastService, avatar } = payload;
        // 保留原 mileage(由車行端維護)
        vehicles[idx] = {
            plate, model, kind, nickname: nickname || "",
            mileage: vehicles[idx].mileage || "",
            lastService, avatar
        };
        if (orig !== plate && localStorage.getItem(LS_PRIMARY) === orig) {
            setPrimaryPlate(plate);
        }
        saveVehicles();
        render();
    }
    function handleDelete(plate) {
        const v = vehicles.find(x => x.plate === plate);
        if (!v) return;
        const ok = confirm(`確定刪除 ${v.plate}　${v.model}　此操作無法復原`);
        if (!ok) return;
        vehicles = vehicles.filter(x => x.plate !== plate);
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
            const menu = card.querySelector(".veh-menu");
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
            const v = vehicles.find(x => x.plate === plate);
            if (!v) return;
            window.openVehicleModal({
                mode: "edit",
                vehicle: v,
                existingPlates: vehicles.map(x => x.plate),
                onSubmit: handleEdit
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
        if (!e.target.closest(".veh-card-actions")) {
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
            existingPlates: vehicles.map(x => x.plate),
            onSubmit: handleAdd
        });
    });

    // ── init ───────────────────────────────────
    render();
})();
