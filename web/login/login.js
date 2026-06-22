/**
 * =============================================================================
 * login.js — JavaScript logic for the user login page (login.html)
 * =============================================================================
 */

/**
  * Show red border and validation message under an input field.
  */
function showFieldError(inputId, message) {
  var input = document.getElementById(inputId);
  if (input) input.classList.add("is-invalid");
  var errEl = document.getElementById("err-" + inputId);
  if (errEl) errEl.textContent = message;
}

/**
  * Clear validation message and red border for an input field.
  */
function clearFieldError(inputId) {
  var input = document.getElementById(inputId);
  if (input) input.classList.remove("is-invalid");
  var errEl = document.getElementById("err-" + inputId);
  if (errEl) errEl.textContent = "";
}

/**
  * Initialize the login page event listeners.
  */
function initLoginPage() {
  var loginForm = document.getElementById("login-form");
  if (!loginForm) return;

  ["email", "password"].forEach(function (id) {
    var input = document.getElementById(id);
    if (!input) return;
    input.addEventListener("input", function () { clearFieldError(this.id); });
    input.addEventListener("change", function () { clearFieldError(this.id); });
  });

  loginForm.addEventListener("submit", handleLoginSubmit);
  setupRoleToggle();
}

/**
  * Handle the login form submission.
  */
function handleLoginSubmit(e) {
  e.preventDefault();

  clearFieldError("email");
  clearFieldError("password");
  
  var generalErr = document.getElementById("form-login-error");
  if (generalErr) generalErr.textContent = "";

  var emailInput = document.getElementById("email");
  var passwordInput = document.getElementById("password");
  var isValid = true;

  if (!emailInput.checkValidity()) {
    var msg = emailInput.validity.valueMissing
      ? (currentLang === "ar" ? "هذا الحقل مطلوب" : "This field is required")
      : (currentLang === "ar" ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email format");
    showFieldError("email", msg);
    isValid = false;
  }

  if (!passwordInput.value) {
    showFieldError("password", currentLang === "ar" ? "هذا الحقل مطلوب" : "This field is required");
    isValid = false;
  }

  if (!isValid) return;

  var submitBtn = document.querySelector("#login-form [type='submit']");
  if (submitBtn) submitBtn.disabled = true;

  loginUser(emailInput.value.trim(), passwordInput.value)
    .then(function (res) {
      if (!res.success) {
        if (generalErr) generalErr.textContent = res.message;
        if (submitBtn) submitBtn.disabled = false;
        return;
      }
      localStorage.setItem("autoconnect_token", res.token);
      localStorage.setItem("autoconnect_user", JSON.stringify(res.data));
      var from = new URLSearchParams(window.location.search).get("from");
      window.location.href = from ? decodeURIComponent(from) : "../profile/index.html";
    })
    .catch(function (err) {
      if (generalErr) {
        generalErr.textContent = err.message || (currentLang === "ar" ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, try again");
      }
      if (submitBtn) submitBtn.disabled = false;
    });
}

/**
  * Wire role toggle buttons (customer / provider tabs) visual states.
  */
function setupRoleToggle() {
  var toggle = document.querySelector(".role-toggle");
  if (!toggle) return;

  toggle.querySelectorAll("button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      toggle.querySelectorAll("button").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
    });
  });
}

// Run initialization on page load
document.addEventListener("DOMContentLoaded", initLoginPage);
