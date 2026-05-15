/**
 * =============================================================================
 * home.js — index.html only
 * =============================================================================
 * Hero search form redirects to services.html with category + city in URL.
 * Category dropdown is filled from getCategories() API.
 * =============================================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("hero-search-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var type = document.getElementById("search-type").value;
      var loc = document.getElementById("search-location").value;
      var url = "pages/services.html?category=" + encodeURIComponent(type);
      if (loc) url += "&city=" + encodeURIComponent(loc);
      window.location.href = url;
    });
  }
});

function onLanguageChange() {
  fillCategorySelect("search-type");
}

function fillCategorySelect(selectId) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  getCategories().then(function (cats) {
    var current = sel.value;
    sel.innerHTML = '<option value="">' + t("search_type") + "</option>";
    cats.forEach(function (c) {
      if (c.parent_id) return;
      var opt = document.createElement("option");
      opt.value = c.slug;
      opt.textContent = getLocalizedField(c, "name");
      sel.appendChild(opt);
    });
    if (current) sel.value = current;
  });
}

document.addEventListener("DOMContentLoaded", function () {
  fillCategorySelect("search-type");
});
