/**
 * =============================================================================
 * app.js — Runs on EVERY page
 * =============================================================================
 * Loaded after layout.js and i18n.js.
 * On DOM ready: draw header/footer, apply saved language, wire language button.
 * =============================================================================
 */
document.addEventListener("DOMContentLoaded", function () {
  renderHeader();
  renderFooter();
  setLanguage(currentLang);

  var langBtn = document.getElementById("lang-toggle");
  if (langBtn) {
    langBtn.addEventListener("click", toggleLanguage);
  }
});
