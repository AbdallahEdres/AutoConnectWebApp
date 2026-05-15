/**
 * =============================================================================
 * provider-register.js — pages/provider-register.html
 * =============================================================================
 * Standalone workshop signup (same fields as provider section on register.html).
 * Submits to addProvider() API — in mock mode adds to providers.json in memory.
 * =============================================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  getCategories().then(function (cats) {
    var sel = document.getElementById("provider-category");
    cats.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c.id;
      opt.setAttribute("data-slug", c.slug);
      opt.textContent = getLocalizedField(c, "name");
      sel.appendChild(opt);
    });
  });

  document.getElementById("provider-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var catSel = document.getElementById("provider-category");
    var opt = catSel.options[catSel.selectedIndex];
    var data = {
      name: document.getElementById("workshop-name").value,
      phone: document.getElementById("mobile").value,
      city: document.getElementById("city-area").value,
      address: document.getElementById("city-area").value,
      description: document.getElementById("service-desc").value,
      category_id: catSel.value,
      category_slug: opt ? opt.getAttribute("data-slug") : "mechanic",
      lat: DEFAULT_LOCATION.lat,
      long: DEFAULT_LOCATION.long
    };
    addProvider(data).then(function (res) {
      alert(res.message || "Registered");
      window.location.href = "services.html";
    });
  });
});

function onLanguageChange() {
  var sel = document.getElementById("provider-category");
  if (!sel) return;
  var val = sel.value;
  getCategories().then(function (cats) {
    sel.innerHTML = "";
    cats.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c.id;
      opt.setAttribute("data-slug", c.slug);
      opt.textContent = getLocalizedField(c, "name");
      sel.appendChild(opt);
    });
    sel.value = val;
  });
}
