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
                avatar: v.avatar || ""
            },
            // 保留編輯時不能被表單改的欄位,送出時帶回
            preserve: {
                mileage: v.mileage || ""
            }
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
                class: "vm-avatar-photo"
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
                class: "vm-avatar-silhouette"
            });
            box.appendChild(sil);
            return;
        }
        box.classList.remove("is-empty");
    }

    // ── shell ───────────────────────────────────
    function buildShell() {
        if (root) return root;
        root = el("div", {
            class: "vm-modal",
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": "vm-title",
            hidden: true
        }, [
            el("div", { class: "vm-backdrop", onclick: closeModal }),
            el("div", { class: "vm-card" }, [
                el("div", { class: "vm-head" }, [
                    el("p", { id: "vm-title", text: "新增車輛" }),
                    el("button", {
                        type: "button",
                        class: "vm-close",
                        "aria-label": "關閉",
                        onclick: closeModal,
                        text: "✕"
                    })
                ]),
                el("div", { class: "vm-body" }),
                el("div", { class: "vm-foot" })
            ])
        ]);
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
        plateWrap.appendChild(el("label", { class: "vm-label", for: "vm-plate", text: "車牌" }));
        const plateInput = el("input", {
            type: "text",
            id: "vm-plate",
            placeholder: "ABC-1234",
            value: f.plate,
            autocomplete: "off",
            maxlength: "10"
        });
        plateInput.addEventListener("input", (e) => {
            f.plate = e.target.value.toUpperCase();
            e.target.value = f.plate;
            updateSubmitBtn();
        });
        bindValidation(plateInput, (val) => combinedPlateValidator(val));
        plateWrap.appendChild(plateInput);
        refs.plate = plateInput;
        out.push(plateWrap);

        // 車款
        const modelWrap = el("div", { class: "vm-field" });
        modelWrap.appendChild(el("label", { class: "vm-label", for: "vm-model", text: "車款" }));
        const modelInput = el("input", {
            type: "text",
            id: "vm-model",
            placeholder: "例　Gogoro VIVA",
            value: f.model,
            autocomplete: "off"
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
        nickWrap.appendChild(el("label", { class: "vm-label", for: "vm-nickname" }, [
            "暱稱",
            el("span", { class: "vm-opt", text: "選填" })
        ]));
        const nickInput = el("input", {
            type: "text",
            id: "vm-nickname",
            placeholder: "例　狗熊",
            value: f.nickname,
            autocomplete: "off",
            maxlength: "20"
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
                    onchange: () => { f.kind = k; }
                }),
                k
            ]);
            kindGroup.appendChild(opt);
        });
        kindWrap.appendChild(kindGroup);
        out.push(kindWrap);

        // 上次保養日期(選填)
        const dateWrap = el("div", { class: "vm-field" });
        dateWrap.appendChild(el("label", { class: "vm-label", for: "vm-date" }, [
            "上次保養日期",
            el("span", { class: "vm-opt", text: "選填" })
        ]));
        const dateInput = el("input", {
            type: "date",
            id: "vm-date",
            value: normalizeDateForInput(f.lastService)
        });
        dateInput.addEventListener("input", (e) => {
            f.lastService = e.target.value;
        });
        dateWrap.appendChild(dateInput);
        refs.lastService = dateInput;
        out.push(dateWrap);

        // 車輛照片(上傳　選填)
        const avWrap = el("div", { class: "vm-field" });
        avWrap.appendChild(el("label", { class: "vm-label" }, [
            "車輛照片",
            el("span", { class: "vm-opt", text: "選填" })
        ]));

        const avBox = el("div", { class: "vm-avatar-box" });
        const preview = el("div", { class: "vm-avatar-preview" });
        renderAvatarPreview(preview, f.avatar, f.kind);

        const avControls = el("div", { class: "vm-avatar-ctrls" });
        const fileInput = el("input", {
            type: "file",
            id: "vm-avatar-file",
            accept: "image/*",
            class: "vm-avatar-input"
        });
        const uploadBtn = el("label", {
            for: "vm-avatar-file",
            class: "vm-avatar-btn",
            text: f.avatar ? "更換照片" : "上傳照片"
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
            text: "移除"
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

        out.push(el("p", {
            class: "vm-hint",
            text: state.mode === "edit"
                ? "送出後車庫立刻更新　變更不會自動寫入車歷"
                : "送出後車庫立刻新增　demo 資料儲存在本機"
        }));

        return out;
    }

    // 車牌驗證 + 重複檢查
    function combinedPlateValidator(val) {
        const basic = validatePlate(val);
        if (basic) return basic;
        const x = val.trim().toUpperCase();
        // 編輯模式下,維持原車牌不算重複
        if (state.mode === "edit" && x === (state.originalPlate || "").toUpperCase()) {
            return null;
        }
        if (state.existingPlates.some(p => p.toUpperCase() === x)) {
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
                text: "取消"
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
                text: state.mode === "edit" ? "儲存變更" : "新增"
            })
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

        if (plateErr) setFieldError(refs.plate, plateErr); else clearFieldError(refs.plate);
        if (modelErr) setFieldError(refs.model, modelErr); else clearFieldError(refs.model);

        const first = plateErr ? refs.plate
                    : modelErr ? refs.model
                    : null;
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
            plate, model, kind, mileage, lastService, avatar,
            nickname: (f.nickname || "").trim(),
            _originalPlate: state.originalPlate,
            _mode: state.mode
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
