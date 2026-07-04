/**
 * =============================================================================
 * register.js — JavaScript logic for the user & workshop registration page (register.html)
 * =============================================================================
 */

var registerRole = "client";

/**
  * Show validation error message and red border for field.
  */
function showFieldError(inputId, message) {
  var input = document.getElementById(inputId);
  if (input) input.classList.add("is-invalid");
  var errEl = document.getElementById("err-" + inputId);
  if (errEl) errEl.textContent = message;
}

/**
  * Clear validation error message and red border for field.
  */
function clearFieldError(inputId) {
  var input = document.getElementById(inputId);
  if (input) input.classList.remove("is-invalid");
  var errEl = document.getElementById("err-" + inputId);
  if (errEl) errEl.textContent = "";
}

/**
  * Clear all validation errors in the form.
  */
function clearAllErrors() {
  document.querySelectorAll("#register-form .form-control.is-invalid").forEach(function (el) {
    el.classList.remove("is-invalid");
  });
  document.querySelectorAll("#register-form .form-error").forEach(function (el) {
    el.textContent = "";
  });
}

/**
  * Show a general error message at the top of the registration card.
  */
function showFormError(message) {
  var el = document.getElementById("form-general-error");
  if (el) el.textContent = message;
}

/**
  * Run browser validity checks on required fields.
  * @returns {boolean} true if form is valid.
  */
function validateRegisterForm() {
  clearAllErrors();
  var form = document.getElementById("register-form");
  var isValid = true;

  form.querySelectorAll("[required]").forEach(function (input) {
    if (!input.checkValidity()) {
      var msg;
      if (input.validity.valueMissing) {
        msg = currentLang === "ar" ? "هذا الحقل مطلوب" : "This field is required";
      } else if (input.validity.typeMismatch) {
        msg = currentLang === "ar" ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email format";
      } else {
        msg = currentLang === "ar" ? "تحقق من القيمة المدخلة" : "Please check this field";
      }
      showFieldError(input.id, msg);
      isValid = false;
    }
  });

  var pw = document.getElementById("reg-password");
  var cpw = document.getElementById("confirm-password");
  if (pw && cpw && pw.value && cpw.value && pw.value !== cpw.value) {
    showFieldError("confirm-password", currentLang === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
    isValid = false;
  }

  return isValid;
}

/**
  * Populate Egyptian governorates city dropdown options.
  */
function loadCitySelect() {
  var sel = document.getElementById("city-select");
  if (!sel) return;
  var saved = sel.value;
  sel.innerHTML = "";

  var empty = document.createElement("option");
  empty.value = "";
  empty.textContent = currentLang === "ar" ? "— اختر المدينة —" : "— Select city —";
  sel.appendChild(empty);

  EGYPT_CITIES.forEach(function (city) {
    var opt = document.createElement("option");
    opt.value = city.en;
    opt.setAttribute("data-ar", city.ar);
    opt.textContent = currentLang === "ar" ? city.ar : city.en;
    sel.appendChild(opt);
  });

  if (saved !== "") sel.value = saved;
}

/**
  * Toggle field groups, inputs, and map view between Client / Agent / Supervisor modes.
  */
function setRegisterRole(role) {
  registerRole = role;
  var clientFields     = document.getElementById("customer-fields");
  var supervisorFields = document.getElementById("supervisor-fields");
  var card      = document.getElementById("register-card");
  var subtitle  = document.getElementById("register-subtitle");
  var submitBtn = document.getElementById("register-submit");
  var toggle    = document.getElementById("register-role-toggle");

  var isClient     = role === "client";
  var isAgent      = role === "agent";
  var isSupervisor = role === "supervisor";
  var agentFields  = document.getElementById("agent-fields");

  if (toggle) {
    toggle.querySelectorAll("button").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-role") === role);
    });
  }

  if (clientFields)     clientFields.classList.toggle("register-fields-hidden", !isClient);
  if (agentFields)      agentFields.classList.toggle("register-fields-hidden", !isAgent);
  if (supervisorFields) supervisorFields.classList.toggle("register-fields-hidden", !isSupervisor);
  if (card) card.classList.remove("auth-card--provider");
  if (subtitle) {
    subtitle.textContent = t("register_sub");
    subtitle.classList.remove("provider-mode");
  }
  if (submitBtn) {
    submitBtn.textContent = t("create_account");
  }
}

/**
  * Register the primary user row first, then proceed to save provider profile.
  */
function handleRegisterSubmit(e) {
  e.preventDefault();

  if (!validateRegisterForm()) return;

  var userData = {
    role: registerRole,
    email: document.getElementById("reg-email").value.trim(),
    password: document.getElementById("reg-password").value,
    fname: document.getElementById("fname").value.trim(),
    lname: document.getElementById("lname").value.trim(),
    phone: (document.getElementById("phone") || {}).value || ""
  };

  if (registerRole === "client") {
    var vtEl = document.getElementById("vehicle-type");
    var vbEl = document.getElementById("vehicle-brand");
    userData.vehicle_type  = vtEl ? vtEl.value.trim() : "";
    userData.vehicle_brand = vbEl ? vbEl.value.trim() : "";
  }

  var submitBtn = document.getElementById("register-submit");
  if (submitBtn) submitBtn.disabled = true;

  registerUser(userData).then(function (res) {
    if (!res.success) {
      if (res.message && res.message.toLowerCase().indexOf("email") !== -1) {
        showFieldError("reg-email", res.message);
      } else {
        showFormError(res.message);
      }
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    window.location.href = "../login/index.html";
  }).catch(function (err) {
    showFormError(err.message || (currentLang === "ar" ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, try again"));
    if (submitBtn) submitBtn.disabled = false;
  });
}

/**
  * Wire the tab role selection switches.
  */
function setupRoleToggle() {
  var toggle = document.getElementById("register-role-toggle");
  if (!toggle) return;

  toggle.querySelectorAll("button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      toggle.querySelectorAll("button").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      setRegisterRole(btn.getAttribute("data-role") || "client");
    });
  });
}

/**
  * Initialize form validations and pickers.
  */
function initRegisterPage() {
  var registerForm = document.getElementById("register-form");
  if (!registerForm) return;

  loadCitySelect();
  var params = new URLSearchParams(window.location.search);
  var roleParam = params.get("role");
  var initRole = roleParam === "agent" ? "agent" : (roleParam === "supervisor" ? "supervisor" : "client");
  setRegisterRole(initRole);
  setupRoleToggle();

  registerForm.querySelectorAll(".form-control").forEach(function (input) {
    input.addEventListener("input", function () { clearFieldError(this.id); });
    input.addEventListener("change", function () { clearFieldError(this.id); });
  });

  registerForm.addEventListener("submit", handleRegisterSubmit);
}

/**
  * Hook triggered when the app language changes to update localized values.
  * @param {string} lang — current language ('ar' or 'en').
  */
function onLanguageChange(lang) {
  loadCitySelect();
  setRegisterRole(registerRole);
}

// Run initialization on page load
document.addEventListener("DOMContentLoaded", initRegisterPage);
