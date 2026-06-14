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
