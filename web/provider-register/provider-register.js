/**
 * =============================================================================
 * provider-register.js — JavaScript logic for the simplified provider join page (provider-register.html)
 * =============================================================================
 */

/**
  * Initialize the simplified provider signup form.
  */
function initProviderRegisterPage() {
  fillCategoriesDropdown();

  var form = document.getElementById("provider-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!localStorage.getItem("autoconnect_token")) {
      window.location.href = "../register/index.html?role=provider";
      return;
    }

    var catSel = document.getElementById("provider-category");
    var workshopName = document.getElementById("workshop-name").value;
    var cityValue = document.getElementById("city-area").value;
    var bioValue = document.getElementById("service-desc").value;
    var hoursValue = document.getElementById("working-hours").value || "09:00 - 18:00";
    var hoursParts = hoursValue.split("-");
    var openTime = (hoursParts[0] || "09:00").trim();
    var closeTime = (hoursParts[1] || "18:00").trim();
    var workingHours = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(function (day) {
      return { day: day, open_time: openTime, close_time: closeTime, is_close: 0 };
    });

    addProvider({
      name_en: workshopName,
      name_ar: workshopName,
      phone: document.getElementById("mobile").value,
      city_en: cityValue,
      city_ar: cityValue,
      address_en: cityValue,
      address_ar: cityValue,
      bio_en: bioValue,
      bio_ar: bioValue,
      category_id: catSel.value,
      working_hours: workingHours,
      lat: DEFAULT_LOCATION.lat,
      lng: DEFAULT_LOCATION.long
    }).then(function (res) {
      if (res.success) {
        alert(res.message || t("register_success"));
        window.location.href = "../services/index.html";
      } else {
        alert(res.message || (currentLang === "ar" ? "فشل في حفظ بيانات الورشة" : "Provider setup failed"));
      }
    });
  });
}

/**
  * Populate categories dropdown.
  */
function fillCategoriesDropdown() {
  getCategories().then(function (cats) {
    var sel = document.getElementById("provider-category");
    if (!sel) return;
    var val = sel.value;
    sel.innerHTML = "";
    cats.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c.id;
      opt.setAttribute("data-slug", c.slug);
      opt.textContent = getLocalizedField(c, "name");
      sel.appendChild(opt);
    });
    if (val) sel.value = val;
  });
}

/**
  * Hook triggered when the app language changes to update localized values.
  * @param {string} lang — current language ('ar' or 'en').
  */
function onLanguageChange(lang) {
  fillCategoriesDropdown();
}

// Run initialization on page load
document.addEventListener("DOMContentLoaded", initProviderRegisterPage);
