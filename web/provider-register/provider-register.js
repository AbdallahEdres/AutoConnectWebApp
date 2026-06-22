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
    var catSel = document.getElementById("provider-category");
    var workshopName = document.getElementById("workshop-name").value;
    var cityValue = document.getElementById("city-area").value;
    var bioValue = document.getElementById("service-desc").value;

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
      working_hours: document.getElementById("working-hours").value,
      lat: DEFAULT_LOCATION.lat,
      lng: DEFAULT_LOCATION.long
    }).then(function (res) {
      alert(res.message || t("register_success"));
      window.location.href = "../services/index.html";
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
