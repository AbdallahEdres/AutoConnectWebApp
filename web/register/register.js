/**
 * =============================================================================
 * register.js — JavaScript logic for the user & workshop registration page (register.html)
 * =============================================================================
 */

var registerRole = "client";
var selectedPhotos = [];
var registerMapInitialized = false;
var registerLat = DEFAULT_LOCATION.lat;
var registerLng = DEFAULT_LOCATION.long;

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
  * Upload selected workshop files via Multipart Form.
  * @param {Array} files — list of file objects.
  * @returns {Promise} JSON promise response from PHP.
  */
function uploadProviderPhotos(files) {
  var formData = new FormData();
  for (var i = 0; i < files.length; i++) {
    formData.append("photos[]", files[i]);
  }
  return fetch(API_BASE + "/upload_photos.php", {
    method: "POST",
    body: formData
  }).then(function (res) { return res.json(); });
}

/**
  * Render the thumbnail gallery of selected pictures to be uploaded.
  */
function renderPhotoPreview() {
  var grid = document.getElementById("photo-preview-grid");
  var addBtn = document.getElementById("photo-add-btn");
  var label = document.getElementById("photo-add-label");
  if (!grid) return;

  grid.innerHTML = "";

  selectedPhotos.forEach(function (file, idx) {
    var thumb = document.createElement("div");
    thumb.className = "photo-thumb";

    var img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = file.name;

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "photo-thumb-remove";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", function () {
      URL.revokeObjectURL(img.src);
      selectedPhotos.splice(idx, 1);
      renderPhotoPreview();
    });

    thumb.appendChild(img);
    thumb.appendChild(removeBtn);
    grid.appendChild(thumb);
  });

  var count = selectedPhotos.length;
  if (label) {
    label.textContent = count > 0
      ? (currentLang === "ar" ? "إضافة المزيد (" + count + "/10)" : "Add more (" + count + "/10)")
      : t("add_photos");
  }
  if (addBtn) addBtn.style.display = count >= 10 ? "none" : "inline-flex";
}

/**
  * Configure image selection pickers and events.
  */
function setupPhotoPreview() {
  var input = document.getElementById("photo-input");
  var addBtn = document.getElementById("photo-add-btn");
  var uploadArea = document.getElementById("photo-upload-area");
  if (!input || !addBtn) return;

  addBtn.addEventListener("click", function () { input.click(); });
  uploadArea.addEventListener("click", function (e) {
    if (e.target === this) input.click();
  });

  input.addEventListener("change", function () {
    var remaining = 10 - selectedPhotos.length;
    Array.from(this.files).slice(0, remaining).forEach(function (file) {
      if (file.type.startsWith("image/")) selectedPhotos.push(file);
    });
    renderPhotoPreview();
    this.value = "";
  });
}

/**
  * Initialize the Leaflet interactive map picker for provider coordinates.
  */
function initRegisterMap() {
  var mapEl = document.getElementById("register-map");
  if (!mapEl || typeof L === "undefined") return;

  var map = L.map("register-map").setView([registerLat, registerLng], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  var marker = L.marker([registerLat, registerLng], { draggable: true }).addTo(map);

  function updatePin(latlng) {
    registerLat = latlng.lat;
    registerLng = latlng.lng;
  }

  marker.on("dragend", function (e) { updatePin(e.target.getLatLng()); });

  map.on("click", function (e) {
    marker.setLatLng(e.latlng);
    updatePin(e.latlng);
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (pos) {
      var lat = pos.coords.latitude;
      var lng = pos.coords.longitude;
      updatePin({ lat: lat, lng: lng });
      map.setView([lat, lng], 15);
      marker.setLatLng([lat, lng]);
    });
  }
}

/**
  * Fetch categories for the provider registration dropdown.
  */
function loadRegisterCategories() {
  var sel = document.getElementById("provider-category");
  if (!sel) return;
  getCategories().then(function (cats) {
    sel.innerHTML = '<option value="">' + (currentLang === "ar" ? "— اختر نوع الخدمة —" : "— Select service type —") + "</option>";
    cats.forEach(function (c) {
      if (c.parent_id) return;
      var opt = document.createElement("option");
      opt.value = c.id;
      opt.setAttribute("data-slug", c.slug);
      opt.textContent = getLocalizedField(c, "name");
      sel.appendChild(opt);
    });
  });
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
  * Upload photos and then save the account and workshop details in one backend transaction.
  */
function saveProviderProfile(userData, submitBtn) {
  var wh = [];
  document.querySelectorAll(".wh-row").forEach(function (row) {
    var isClosed = row.querySelector(".wh-closed").checked;
    wh.push({
      day: row.getAttribute("data-day"),
      open_time: isClosed ? null : (row.querySelector(".wh-open").value || null),
      close_time: isClosed ? null : (row.querySelector(".wh-close").value || null),
      is_close: isClosed ? 1 : 0
    });
  });

  var catSel = document.getElementById("provider-category");
  var citySel = document.getElementById("city-select");
  var cityEn = citySel ? citySel.value : "";
  var cityAr = (citySel && citySel.options[citySel.selectedIndex])
    ? citySel.options[citySel.selectedIndex].getAttribute("data-ar") || ""
    : "";

  var photoPromise = selectedPhotos.length > 0
    ? uploadProviderPhotos(selectedPhotos)
    : Promise.resolve({ success: true, urls: [] });

  photoPromise.then(function (uploadRes) {
    if (!uploadRes.success) {
      showFormError(uploadRes.message || (currentLang === "ar" ? "فشل في رفع الصور" : "Photo upload failed"));
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    var providerData = Object.assign({}, userData, {
      name_en: document.getElementById("name-en").value.trim(),
      name_ar: document.getElementById("name-ar").value.trim(),
      phone: document.getElementById("mobile").value.trim(),
      address_en: document.getElementById("address-en").value.trim(),
      address_ar: document.getElementById("address-ar").value.trim(),
      city_en: cityEn,
      city_ar: cityAr,
      bio_en: document.getElementById("bio-en").value.trim(),
      bio_ar: document.getElementById("bio-ar").value.trim(),
      category_id: catSel ? catSel.value : "",
      working_hours: wh,
      photos: uploadRes.urls,
      lat: registerLat,
      lng: registerLng
    });

    registerUser(providerData).then(function (res) {
      if (!res.success) {
        if (res.message && res.message.toLowerCase().indexOf("email") !== -1) {
          showFieldError("reg-email", res.message);
        } else {
          showFormError(res.message);
        }
        if (submitBtn) submitBtn.disabled = false;
        return;
      }
      selectedPhotos = [];
      window.location.href = "../login/index.html";
    }).catch(function (err) {
      showFormError(err.message || (currentLang === "ar" ? "فشل في حفظ بيانات الورشة" : "Provider setup failed"));
      if (submitBtn) submitBtn.disabled = false;
    });
  }).catch(function (err) {
    showFormError(err.message || (currentLang === "ar" ? "فشل في رفع الصور" : "Photo upload failed"));
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

  loadRegisterCategories();
  loadCitySelect();
  var params = new URLSearchParams(window.location.search);
  var roleParam = params.get("role");
  var initRole = roleParam === "agent" ? "agent" : (roleParam === "supervisor" ? "supervisor" : "client");
  setRegisterRole(initRole);
  setupPhotoPreview();
  setupRoleToggle();

  document.querySelectorAll(".wh-closed").forEach(function (cb) {
    cb.addEventListener("change", function () {
      var row = this.closest(".wh-row");
      row.querySelector(".wh-open").disabled = this.checked;
      row.querySelector(".wh-close").disabled = this.checked;
    });
  });

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
  loadRegisterCategories();
  loadCitySelect();
  setRegisterRole(registerRole);
}

// Run initialization on page load
document.addEventListener("DOMContentLoaded", initRegisterPage);
