/**
 * =============================================================================
 * history.js — JavaScript logic for the service history/bookings logs page (history.html)
 * =============================================================================
 */

/**
  * Fetch current user's call history/bookings and render them in the table body.
  */
function initHistoryPage() {
  getBookings().then(function (bookings) {
    var tbody = document.getElementById("history-body");
    if (!tbody) return;

    if (!bookings.length) {
      tbody.innerHTML = "<tr><td colspan='2' style='padding:1rem 0.5rem;color:var(--text-muted)'>" + t("history_empty") + "</td></tr>";
      return;
    }

    tbody.innerHTML = bookings.map(function (b) {
      var name = currentLang === "ar" ? (b.name_ar || b.name_en) : (b.name_en || b.name_ar);
      var date = b.created_at ? b.created_at.split(" ")[0] : "—";
      return "<tr>" +
        "<td style='padding:0.65rem 0.5rem;border-bottom:1px solid var(--border-color)'>" +
          "<a href='../service-detail/index.html?id=" + b.provider_id + "'>" + name + "</a>" +
        "</td>" +
        "<td style='padding:0.65rem 0.5rem;border-bottom:1px solid var(--border-color);color:var(--text-muted)'>" + date + "</td>" +
      "</tr>";
    }).join("");
  }).catch(function () {
    window.location.href = "../login/index.html?from=" + encodeURIComponent(window.location.href);
  });
}

// Run initialization on page load
document.addEventListener("DOMContentLoaded", initHistoryPage);
