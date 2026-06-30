/**
 * =============================================================================
 * provider-register.js — standalone provider registration page
 * =============================================================================
 */

var selectedPhotos = [];
var providerLat = DEFAULT_LOCATION.lat;
var providerLng = DEFAULT_LOCATION.long;

// ── Field error helpers ───────────────────────────────────────────────────────

function showFieldError(inputId, message) {
  var input = document.getElementById(inputId);
  if (input) input.classList.add("is-invalid");
  var errEl = document.getElementById("err-" + inputId);
  if (errEl) errEl.textContent = message;
}

function clearFieldError(inputId) {
  var input = document.getElementById(inputId);
  if (input) input.classList.remove("is-invalid");
  var errEl = document.getElementById("err-" + inputId);
  if (errEl) errEl.textContent = "";
}

function showFormError(message) {
  var el = document.getElementById("form-provider-error");
  if (el) el.textContent = message;
}

// ── Categories dropdown ───────────────────────────────────────────────────────

function loadProviderCategories() {
  var sel = document.getElementById("provider-category");
  if (!sel) return;
  getCategories().then(function (cats) {
    var saved = sel.value;
    sel.innerHTML = '<option value="">' + (currentLang === "ar" ? "— اختر نوع الخدمة —" : "— Select service type —") + "</option>";

    var parents  = cats.filter(function (c) { return !c.parent_id; });
    var children = cats.filter(function (c) { return  c.parent_id; });

    parents.forEach(function (parent) {
      var subs = children.filter(function (c) { return String(c.parent_id) === String(parent.id); });

      if (subs.length > 0) {
        var group = document.createElement("optgroup");
        group.label = getLocalizedField(parent, "name");
        subs.forEach(function (c) {
          var opt = document.createElement("option");
          opt.value = c.id;
          opt.setAttribute("data-slug", c.slug);
          opt.textContent = getLocalizedField(c, "name");
          group.appendChild(opt);
        });
        sel.appendChild(group);
      } else {
        var opt = document.createElement("option");
        opt.value = parent.id;
        opt.setAttribute("data-slug", parent.slug);
        opt.textContent = getLocalizedField(parent, "name");
        sel.appendChild(opt);
      }
    });

    if (saved) sel.value = saved;
  });
}

// ── City dropdown ─────────────────────────────────────────────────────────────

function loadProviderCitySelect() {
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

  if (saved) sel.value = saved;
}

// ── Photo preview ─────────────────────────────────────────────────────────────

function renderPhotoPreview() {
  var grid   = document.getElementById("photo-preview-grid");
  var addBtn = document.getElementById("photo-add-btn");
  var label  = document.getElementById("photo-add-label");
  if (!grid) return;

  grid.querySelectorAll("img").forEach(function (img) { URL.revokeObjectURL(img.src); });
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

function setupPhotoPreview() {
  var input      = document.getElementById("photo-input");
  var addBtn     = document.getElementById("photo-add-btn");
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

// ── Leaflet map ───────────────────────────────────────────────────────────────

function initProviderMap() {
  var mapEl = document.getElementById("provider-map");
  if (!mapEl || typeof L === "undefined") return;

  var map    = L.map("provider-map").setView([providerLat, providerLng], 12);
  var marker = L.marker([providerLat, providerLng], { draggable: true }).addTo(map);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  function updatePin(latlng) {
    providerLat = latlng.lat;
    providerLng = latlng.lng;
  }

  marker.on("dragend", function (e) { updatePin(e.target.getLatLng()); });
  map.on("click", function (e) { marker.setLatLng(e.latlng); updatePin(e.latlng); });

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

// ── Working hours collection ──────────────────────────────────────────────────

function collectWorkingHours() {
  var wh = [];
  document.querySelectorAll(".wh-row").forEach(function (row) {
    var isClosed = row.querySelector(".wh-closed").checked;
    wh.push({
      day:        row.getAttribute("data-day"),
      open_time:  isClosed ? null : (row.querySelector(".wh-open").value  || null),
      close_time: isClosed ? null : (row.querySelector(".wh-close").value || null),
      is_close:   isClosed ? 1 : 0
    });
  });
  return wh;
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateProviderForm() {
  var isValid = true;
  var required = ["name-ar", "name-en", "mobile", "provider-category", "city-select", "address-en"];

  required.forEach(function (id) {
    clearFieldError(id);
    var el = document.getElementById(id);
    if (!el || !el.value.trim()) {
      showFieldError(id, currentLang === "ar" ? "هذا الحقل مطلوب" : "This field is required");
      isValid = false;
    }
  });
  return isValid;
}

// ── Submit ────────────────────────────────────────────────────────────────────

function handleProviderSubmit(e) {
  e.preventDefault();
  showFormError("");

  if (!validateProviderForm()) return;

  var submitBtn = document.getElementById("provider-submit");
  if (submitBtn) submitBtn.disabled = true;

  var catSel  = document.getElementById("provider-category");
  var citySel = document.getElementById("city-select");
  var cityAr  = (citySel && citySel.options[citySel.selectedIndex])
    ? citySel.options[citySel.selectedIndex].getAttribute("data-ar") || ""
    : "";

  var providerData = {
    name_en:      document.getElementById("name-en").value.trim(),
    name_ar:      document.getElementById("name-ar").value.trim(),
    phone:        document.getElementById("mobile").value.trim(),
    address_en:   document.getElementById("address-en").value.trim(),
    address_ar:   (document.getElementById("address-ar") || {}).value || "",
    city_en:      citySel ? citySel.value : "",
    city_ar:      cityAr,
    bio_en:       (document.getElementById("bio-en") || {}).value || "",
    bio_ar:       (document.getElementById("bio-ar") || {}).value || "",
    category_id:  catSel ? catSel.value : "",
    working_hours: collectWorkingHours(),
    lat:          providerLat,
    lng:          providerLng
  };

  var doSubmit = function (photoUrls) {
    providerData.photos = photoUrls;
    addProvider(providerData).then(function (res) {
      if (!res.success) {
        showFormError(res.message || (currentLang === "ar" ? "فشل في حفظ بيانات الورشة" : "Provider setup failed"));
        if (submitBtn) submitBtn.disabled = false;
        return;
      }
      selectedPhotos = [];
      window.location.href = "../profile/index.html";
    }).catch(function (err) {
      showFormError(err.message || (currentLang === "ar" ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong"));
      if (submitBtn) submitBtn.disabled = false;
    });
  };

  if (selectedPhotos.length > 0) {
    var formData = new FormData();
    selectedPhotos.forEach(function (file) { formData.append("photos[]", file); });
    fetch(API_BASE + "/upload_photos.php", { method: "POST", body: formData })
      .then(function (r) { return r.json(); })
      .then(function (uploadRes) {
        if (!uploadRes.success) {
          showFormError(uploadRes.message || (currentLang === "ar" ? "فشل في رفع الصور" : "Photo upload failed"));
          if (submitBtn) submitBtn.disabled = false;
          return;
        }
        doSubmit(uploadRes.urls || []);
      })
      .catch(function () {
        showFormError(currentLang === "ar" ? "فشل في رفع الصور" : "Photo upload failed");
        if (submitBtn) submitBtn.disabled = false;
      });
  } else {
    doSubmit([]);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

function initProviderRegisterPage() {
  var form = document.getElementById("provider-form");
  if (!form) return;

  loadProviderCategories();
  loadProviderCitySelect();
  setupPhotoPreview();
  initProviderMap();

  document.querySelectorAll(".wh-closed").forEach(function (cb) {
    cb.addEventListener("change", function () {
      var row = this.closest(".wh-row");
      row.querySelector(".wh-open").disabled  = this.checked;
      row.querySelector(".wh-close").disabled = this.checked;
    });
  });

  form.addEventListener("submit", handleProviderSubmit);
}

function onLanguageChange(lang) {
  loadProviderCategories();
  loadProviderCitySelect();
}

document.addEventListener("DOMContentLoaded", initProviderRegisterPage);
