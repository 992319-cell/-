// ─── register.js ─────────────────────────────────
// 車主端 5 秒註冊
// 寫入:
//   - localStorage mqzx:vehicleHist(新增 entry 或對既有 phone 補車)
//   - sessionStorage mqzx:currentUser(自動「登入」這個帳號)
// 完成後跳 ?next=... URL,沒帶 next 預設回 self-checkin.html
// 驗證沿用 walkin-modal.js 的 validator 邏輯
// (手機端 blur 不可靠 → 滿格立即驗 + CTA 點擊 validateAll 雙保險)
// ──────────────────────────────────────────────────

(function () {
  const LS_VEHICLE = "mqzx:vehicleHist";
  const SS_USER    = "mqzx:currentUser";

  function $(s) { return document.querySelector(s); }
  function param(name) { return new URLSearchParams(location.search).get(name); }
  function normalizePhone(s) { return (s || "").replace(/[^\d]/g, ""); }

  // ═══════════════════════════════════════════════════
  //   validator
  // ═══════════════════════════════════════════════════
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
    if (!(err && err.classList && err.classList.contains("reg-error"))) {
      err = document.createElement("p");
      err.className = "reg-error";
      input.after(err);
    }
    err.textContent = msg;
  }
  function clearFieldError(input) {
    input.classList.remove("is-error");
    const next = input.nextElementSibling;
    if (next && next.classList && next.classList.contains("reg-error")) {
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
      if (input.classList.contains("is-error")) {
        const err = validator(input.value);
        if (err) setFieldError(input, err);
        else clearFieldError(input);
      }
    });
  }

  // ═══════════════════════════════════════════════════
  //   form state
  // ═══════════════════════════════════════════════════
  const phoneInput = $("#reg-phone");
  const plateInput = $("#reg-plate");
  const modelInput = $("#reg-model");
  const nameInput  = $("#reg-name");
  const submitBtn  = $("#reg-submit");

  // 手機:滿 10 碼立即驗 + blur 驗
  phoneInput.addEventListener("input", () => {
    updateSubmitBtn();
    if (normalizePhone(phoneInput.value).length >= 10) {
      const err = validatePhone(phoneInput.value);
      if (err) setFieldError(phoneInput, err);
      else clearFieldError(phoneInput);
    }
  });
  bindValidation(phoneInput, validatePhone);

  // 車牌:自動大寫 + 過濾 + 4 碼以上補連字符
  plateInput.addEventListener("input", (e) => {
    let v = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (v.length > 3 && !v.includes("-") && /^[A-Z]{2,3}\d/.test(v)) {
      const letters = v.match(/^[A-Z]+/)[0];
      v = letters + "-" + v.slice(letters.length);
    }
    e.target.value = v;
    updateSubmitBtn();
    // 滿格立刻驗
    if (v.replace(/-/g, "").length >= 6) {
      const err = validatePlate(v);
      if (err) setFieldError(plateInput, err);
      else clearFieldError(plateInput);
    }
  });
  bindValidation(plateInput, validatePlate);

  modelInput.addEventListener("input", updateSubmitBtn);
  bindValidation(modelInput, validateModel);

  function formValid() {
    const phoneOk = /^09\d{8}$/.test(normalizePhone(phoneInput.value));
    const plateOk = /^[A-Z]{2,3}-\d{3,4}$/.test(plateInput.value.trim().toUpperCase());
    const modelOk = modelInput.value.trim().length > 0;
    return phoneOk && plateOk && modelOk;
  }
  function updateSubmitBtn() {
    submitBtn.setAttribute("aria-disabled", String(!formValid()));
  }

  function showAllErrors() {
    const phoneErr = validatePhone(phoneInput.value);
    const plateErr = validatePlate(plateInput.value);
    const modelErr = validateModel(modelInput.value);

    if (phoneErr) setFieldError(phoneInput, phoneErr); else clearFieldError(phoneInput);
    if (plateErr) setFieldError(plateInput, plateErr); else clearFieldError(plateInput);
    if (modelErr) setFieldError(modelInput, modelErr); else clearFieldError(modelInput);

    const first = phoneErr ? phoneInput
                : plateErr ? plateInput
                : modelErr ? modelInput
                : null;
    first?.focus();
  }

  // ═══════════════════════════════════════════════════
  //   送出
  // ═══════════════════════════════════════════════════
  submitBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (!formValid()) {
      showAllErrors();
      return;
    }

    const phone = phoneInput.value.trim();
    const plate = plateInput.value.trim().toUpperCase();
    const model = modelInput.value.trim();
    const name  = nameInput.value.trim() || "車主";
    const kind  = (document.querySelector('input[name="reg-kind"]:checked') || {}).value || "機車";

    // 1. 寫 vehicleHist
    let hist;
    try { hist = JSON.parse(localStorage.getItem(LS_VEHICLE) || "[]"); }
    catch { hist = []; }
    let entry = hist.find((h) => normalizePhone(h.phone) === normalizePhone(phone));
    if (!entry) {
      entry = { phone, name, vehicles: [] };
      hist.push(entry);
    } else if (name && name !== "車主" && entry.name === "車主") {
      // 補名
      entry.name = name;
    }
    if (!entry.vehicles.some((x) => x.plate === plate)) {
      entry.vehicles.push({ plate, model, kind, avatar: "" });
    }
    localStorage.setItem(LS_VEHICLE, JSON.stringify(hist));

    // 2. sessionStorage 登入
    sessionStorage.setItem(SS_USER, JSON.stringify({ phone, name: entry.name }));

    // 3. 跳 next URL
    const next = param("next");
    const shop = param("shop") || "guangyang";
    location.href = next ? decodeURIComponent(next) : `self-checkin.html?shop=${shop}`;
  });

  // 防止 Enter 觸發隱藏 submit 行為(form 沒掛 submit handler)
  $("#reg-form").addEventListener("submit", (e) => {
    e.preventDefault();
    submitBtn.click();
  });

  // 初始
  updateSubmitBtn();
})();
