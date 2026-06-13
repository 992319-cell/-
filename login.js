// ─── Tab 切換：Email / 手機 ───
const tabs = document.querySelectorAll(".tab");
const fldEmail = document.getElementById("fld-email");
const fldPhone = document.getElementById("fld-phone");
const oauthBtn = document.getElementById("oauth-btn");
const divider = document.querySelector(".divider");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");

    if (tab.dataset.tab === "email") {
      fldEmail.classList.remove("is-hidden");
      fldPhone.classList.add("is-hidden");
      oauthBtn.classList.remove("is-hidden");
      divider.classList.remove("is-hidden");
      emailInput.setAttribute("required", "");
      phoneInput.removeAttribute("required");
    } else {
      fldEmail.classList.add("is-hidden");
      fldPhone.classList.remove("is-hidden");
      // 手機 tab 不顯示 Google 登入（業界慣例）
      oauthBtn.classList.add("is-hidden");
      divider.classList.add("is-hidden");
      emailInput.removeAttribute("required");
      phoneInput.setAttribute("required", "");
    }
  });
});

// ─── 手機 +886 prefix 顯示/隱藏 ───
phoneInput.addEventListener("input", () => {
  fldPhone.classList.toggle("has-value", phoneInput.value.length > 0);
});

// ─── 密碼眼睛切換 ───
const eyeToggle = document.getElementById("eye-toggle");
const eyeClosed = document.getElementById("eye-closed");
const eyeOpen = document.getElementById("eye-open");
const passwordInput = document.getElementById("password");

eyeToggle.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  eyeClosed.classList.toggle("is-hidden", isHidden);
  eyeOpen.classList.toggle("is-hidden", !isHidden);
  eyeToggle.setAttribute("aria-label", isHidden ? "隱藏密碼" : "顯示密碼");
});
