/**
 * verify.js — Supervisor dashboard: lists unverified providers and lets supervisors approve them.
 */

function initVerifyPage() {
  var storedUser = JSON.parse(localStorage.getItem("autoconnect_user") || "null");

  if (!storedUser || storedUser.role !== "supervisor") {
    document.getElementById("verify-list").innerHTML =
      "<p style='color:var(--text-muted)'>Access restricted to supervisors.</p>";
    return;
  }

  loadUnverifiedProviders();

  var listEl = document.getElementById("verify-list");
  listEl.addEventListener("click", function (event) {
    var row = event.target.closest("[data-provider-details]");
    if (!row || event.target.closest("button")) return;
    window.location.href = row.getAttribute("data-provider-details");
  });
  listEl.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    var row = event.target.closest("[data-provider-details]");
    if (!row || event.target.closest("button")) return;
    event.preventDefault();
    window.location.href = row.getAttribute("data-provider-details");
  });
}

function loadUnverifiedProviders() {
  var listEl = document.getElementById("verify-list");

  apiRequest("providers", { method: "GET", params: { status: "pending" } })
    .then(function (res) {
      var providers = (res.data || res || []).filter(function (p) { return !p.verified_at; });

      if (!providers.length) {
        listEl.innerHTML = "<p style='color:var(--text-muted)'>No providers pending verification.</p>";
        return;
      }

      listEl.innerHTML = providers.map(function (p) {
        var name = currentLang === "ar" ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar);
        var city = currentLang === "ar" ? (p.city_ar || p.city_en) : (p.city_en || p.city_ar);
        return "<article class='card' role='link' tabindex='0' aria-label='" + escapeHtml(name) +
          "' data-provider-details='../service-detail/index.html?id=" + Number(p.id) +
          "' style='margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;cursor:pointer'>" +
          "<div>" +
            "<h3 style='margin:0 0 0.25rem'>" + escapeHtml(name) + "</h3>" +
            "<p style='margin:0;color:var(--text-secondary);font-size:0.875rem'>" + escapeHtml(city || "") + " &mdash; " + escapeHtml(p.phone || "") + "</p>" +
          "</div>" +
          "<button class='btn btn-primary btn-sm' onclick='approveProvider(" + p.id + ", this)'>Approve</button>" +
        "</article>";
      }).join("");
    })
    .catch(function () {
      listEl.innerHTML = "<p style='color:var(--text-muted)'>Could not load providers.</p>";
    });
}

function approveProvider(providerId, btn) {
  btn.disabled = true;
  btn.textContent = "...";

  verifyProvider(providerId).then(function (res) {
    if (res && res.success) {
      var card = btn.closest("article");
      if (card) {
        card.style.opacity = "0.5";
        btn.textContent = "Verified";
      }
    } else {
      btn.disabled = false;
      btn.textContent = "Approve";
      alert((res && res.message) || "Verification failed.");
    }
  }).catch(function () {
    btn.disabled = false;
    btn.textContent = "Approve";
    alert("Verification failed.");
  });
}

document.addEventListener("DOMContentLoaded", initVerifyPage);
