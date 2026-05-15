/**
 * =============================================================================
 * auth.js — Login & register pages only
 * =============================================================================
 * Handles:
 *   - login.html → loginUser()
 *   - register.html → registerUser() with customer vs provider forms
 * =============================================================================
 */

/** Which tab is selected on register page: "customer" or "provider" */
var registerRole = "customer";

document.addEventListener("DOMContentLoaded", function () {
  setupRoleToggle();
  prefillDemoLogin();
  initRegisterPage();

  var loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
  }

  var registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegisterSubmit);
  }
});

/** Send email + password to API; go to profile if success */
function handleLoginSubmit(e) {
  e.preventDefault();
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;
  loginUser(email, password)
    .then(function (res) {
      if (!res.success) {
        alert(res.message);
        return;
      }
      alert(res.message);
      window.location.href = "profile.html";
    })
    .catch(function (err) {
      alert(err.message || "Login failed");
    });
}

/** Setup register page on first load */
function initRegisterPage() {
  if (!document.getElementById("register-form")) return;
  loadRegisterCategories();
  setRegisterRole("customer");
}

/** Fill service type dropdown from getCategories() API */
function loadRegisterCategories() {
  var sel = document.getElementById("provider-category");
  if (!sel) return;
  getCategories().then(function (cats) {
    sel.innerHTML = "";
    cats.forEach(function (c) {
      if (c.parent_id) return; // skip sub-categories in dropdown
      var opt = document.createElement("option");
      opt.value = c.id;
      opt.setAttribute("data-slug", c.slug);
      opt.textContent = getLocalizedField(c, "name");
      sel.appendChild(opt);
    });
  });
}

/**
 * Show/hide customer vs provider fields when user clicks role toggle.
 * Also updates card width, subtitle text, and submit button label.
 */
function setRegisterRole(role) {
  registerRole = role;
  var customerFields = document.getElementById("customer-fields");
  var providerFields = document.getElementById("provider-fields");
  var card = document.getElementById("register-card");
  var subtitle = document.getElementById("register-subtitle");
  var submitBtn = document.getElementById("register-submit");
  var fullName = document.getElementById("full-name");
  var phone = document.getElementById("phone");
  var workshop = document.getElementById("workshop-name");
  var mobile = document.getElementById("mobile");
  var category = document.getElementById("provider-category");
  var cityArea = document.getElementById("city-area");

  var isProvider = role === "provider";

  if (customerFields) {
    customerFields.classList.toggle("register-fields-hidden", isProvider);
  }
  if (providerFields) {
    providerFields.classList.toggle("register-fields-hidden", !isProvider);
  }
  if (card) {
    card.classList.toggle("auth-card--provider", isProvider);
  }
  if (subtitle) {
    subtitle.textContent = isProvider ? t("register_provider_sub") : t("register_sub");
    subtitle.classList.toggle("provider-mode", isProvider);
  }
  if (submitBtn) {
    submitBtn.textContent = isProvider ? t("register_workshop") : t("create_account");
  }

  // HTML5 required attribute on the right fields only
  if (fullName) fullName.required = !isProvider;
  if (phone) phone.required = !isProvider;
  if (workshop) workshop.required = isProvider;
  if (mobile) mobile.required = isProvider;
  if (category) category.required = isProvider;
  if (cityArea) cityArea.required = isProvider;
}

/** Build JSON body and call registerUser() — different fields per role */
function handleRegisterSubmit(e) {
  e.preventDefault();

  var email = document.getElementById("reg-email").value.trim();
  var password = document.getElementById("reg-password").value;
  var confirm = document.getElementById("confirm-password").value;

  if (password !== confirm) {
    alert(currentLang === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
    return;
  }

  var data = {
    role: registerRole,
    email: email,
    password: password
  };

  if (registerRole === "customer") {
    data.name = document.getElementById("full-name").value.trim();
    data.phone = document.getElementById("phone").value.trim();
  } else {
    var catSel = document.getElementById("provider-category");
    var opt = catSel.options[catSel.selectedIndex];
    data.name = document.getElementById("workshop-name").value.trim();
    data.phone = document.getElementById("mobile").value.trim();
    data.workshop_name = data.name;
    data.mobile = data.phone;
    data.category_id = catSel.value;
    data.category_slug = opt ? opt.getAttribute("data-slug") : "mechanic";
    data.availability = document.getElementById("availability").value;
    data.working_hours = document.getElementById("working-hours").value.trim();
    data.city = document.getElementById("city-area").value.trim();
    data.address = data.city;
    data.description = document.getElementById("service-desc").value.trim();
    data.lat = DEFAULT_LOCATION.lat;
    data.long = DEFAULT_LOCATION.long;
    data.status = data.availability === "closed" ? "closed" : "open";
  }

  registerUser(data).then(function (res) {
    if (!res.success) {
      alert(res.message);
      return;
    }
    alert(res.message);
    if (registerRole === "provider") {
      window.location.href = "services.html";
    } else {
      window.location.href = "login.html";
    }
  });
}

/** Fill login form with demo@autoconnect.com when using mock API */
function prefillDemoLogin() {
  if (!API_CONFIG.useMock) return;
  var emailEl = document.getElementById("email");
  var passEl = document.getElementById("password");
  var hint = document.getElementById("demo-hint");
  if (emailEl && typeof MOCK_DEMO_AUTH !== "undefined") {
    emailEl.value = MOCK_DEMO_AUTH.email;
  }
  if (passEl && typeof MOCK_DEMO_AUTH !== "undefined") {
    passEl.value = MOCK_DEMO_AUTH.password;
  }
  if (hint && typeof MOCK_DEMO_AUTH !== "undefined") {
    hint.textContent =
      "Demo: " + MOCK_DEMO_AUTH.email + " / " + MOCK_DEMO_AUTH.password;
  }
}

/** Wire عميل / مزود خدمة buttons on register (and login role toggle if present) */
function setupRoleToggle() {
  var toggle = document.getElementById("register-role-toggle");
  if (!toggle) {
    document.querySelectorAll(".role-toggle button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".role-toggle button").forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
      });
    });
    return;
  }

  toggle.querySelectorAll("button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      toggle.querySelectorAll("button").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      setRegisterRole(btn.getAttribute("data-role") || "customer");
    });
  });
}

/** Called by i18n.js when user switches AR/EN — refresh dropdown labels */
function onLanguageChange() {
  loadRegisterCategories();
  setRegisterRole(registerRole);
}
