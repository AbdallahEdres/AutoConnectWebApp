/**
 * =============================================================================
 * settings.js — pages/settings.html (change password, delete account demo)
 * =============================================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("password-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      updatePassword({
        current: document.getElementById("current-password").value,
        new: document.getElementById("new-password").value,
        confirm: document.getElementById("confirm-password").value
      }).then(function (res) {
        alert(res.message);
        form.reset();
      });
    });
  }

  var deleteBtn = document.getElementById("delete-account-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", function () {
      if (confirm(t("delete_account") + "?")) {
        alert("Demo: account delete not implemented");
      }
    });
  }
});
