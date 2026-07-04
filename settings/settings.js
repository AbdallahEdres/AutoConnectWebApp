/**
 * =============================================================================
 * settings.js — JavaScript logic for the user settings page (settings.html)
 * =============================================================================
 */

/**
  * Initialize settings page, ensuring authentication, and bind password change submit handler.
  */
function initSettingsPage() {
  if (!localStorage.getItem("autoconnect_token")) {
    window.location.href = "../login/index.html?from=" + encodeURIComponent(window.location.href);
    return;
  }

  var form = document.getElementById("password-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var currentVal = document.getElementById("current-password").value;
    var newVal = document.getElementById("new-password").value;
    var confirmVal = document.getElementById("confirm-password").value;
    var msg = document.getElementById("password-msg");
    var required = currentLang === "ar" ? "هذا الحقل مطلوب" : "This field is required";
    var mismatch = currentLang === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match";
    var isValid = true;

    var errCurrent = document.getElementById("err-current");
    var errNew = document.getElementById("err-new");
    var errConfirm = document.getElementById("err-confirm");

    if (errCurrent) errCurrent.textContent = "";
    if (errNew) errNew.textContent = "";
    if (errConfirm) errConfirm.textContent = "";
    if (msg) msg.textContent = "";

    if (!currentVal) {
      if (errCurrent) errCurrent.textContent = required;
      isValid = false;
    }
    if (!newVal) {
      if (errNew) errNew.textContent = required;
      isValid = false;
    }
    if (!confirmVal) {
      if (errConfirm) errConfirm.textContent = required;
      isValid = false;
    }
    if (newVal && confirmVal && newVal !== confirmVal) {
      if (errConfirm) errConfirm.textContent = mismatch;
      isValid = false;
    }
    if (!isValid) return;

    var submitBtn = form.querySelector("[type='submit']");
    if (submitBtn) submitBtn.disabled = true;

    updatePassword({ current: currentVal, new: newVal, confirm: confirmVal })
      .then(function (res) {
        if (msg) {
          msg.textContent = res.message;
          msg.style.color = res.success ? "var(--success, green)" : "var(--error, #e74c3c)";
        }
        if (res.success) form.reset();
      })
      .catch(function () {
        if (msg) {
          msg.textContent = currentLang === "ar" ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, try again";
          msg.style.color = "var(--error, #e74c3c)";
        }
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
  });
}

// Run initialization on page load
document.addEventListener("DOMContentLoaded", initSettingsPage);
