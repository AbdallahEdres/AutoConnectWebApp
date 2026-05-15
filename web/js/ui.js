/**
 * =============================================================================
 * ui.js — Build HTML for provider cards
 * =============================================================================
 * Pages pass data from API into renderProviderList() instead of writing HTML by hand.
 * =============================================================================
 */

/**
 * Returns HTML string for one provider card (used in services, favorites, similar list).
 */
function renderProviderCard(provider, options) {
  options = options || {};
  var base = options.basePath || getBasePath();
  var name = getLocalizedField(provider, "name");
  var address = getLocalizedField(provider, "address");
  var isOpen = provider.status === "open";
  var statusText = isOpen ? t("open_now") : t("closed");
  var statusClass = isOpen ? "open" : "closed";
  var distText = provider.distance_km != null ? formatDistance(provider.distance_km) : "";
  var img = provider.image ? base + provider.image : "";
  var detailUrl = base + "pages/service-detail.html?id=" + provider.id;
  var phone = provider.phone || "";

  var categoryLabel = provider.category_slug || "";

  return (
    '<article class="provider-card">' +
    '<div class="provider-card__image">' +
    (img ? '<img src="' + img + '" alt="' + name + '">' : "") +
    (categoryLabel
      ? '<span class="provider-card__badge">' + categoryLabel + "</span>"
      : "") +
    "</div>" +
    '<div class="provider-card__body">' +
    '<p class="provider-card__rating">★ ' + provider.rating + "</p>" +
    "<h3>" + name + "</h3>" +
    '<p class="provider-card__meta">' +
    '<span class="status-dot ' +
    statusClass +
    '"></span> ' +
    statusText +
    "</p>" +
    (address
      ? '<p class="provider-card__meta">📍 ' + address + "</p>"
      : "") +
    (distText
      ? '<p class="provider-card__meta">↗ ' + distText + "</p>"
      : "") +
    (phone ? '<p class="provider-card__meta">📞 ' + phone + "</p>" : "") +
    '<div class="provider-card__actions">' +
    '<a href="' +
    detailUrl +
    '" class="btn btn-ghost btn-sm">' +
    (options.detailsLabel || t("view_details")) +
    "</a>" +
    '<a href="tel:' +
    phone +
    '" class="btn btn-primary btn-sm">' +
    t("call_now") +
    "</a>" +
    "</div>" +
    "</article>"
  );
}

/** Loop providers and put all cards inside element #containerId */
function renderProviderList(containerId, providers, options) {
  var container = document.getElementById(containerId);
  if (!container) return;

  if (!providers.length) {
    container.innerHTML =
      '<p class="section-subtitle" style="grid-column:1/-1">' +
      t("no_results") +
      "</p>";
    return;
  }

  var html = "";
  providers.forEach(function (p) {
    html += renderProviderCard(p, options);
  });
  container.innerHTML = html;
}

/** Wider row layout for emergency page (image left, call button right) */
function renderHorizontalProviderCard(provider, options) {
  options = options || {};
  var base = options.basePath || getBasePath();
  var name = getLocalizedField(provider, "name");
  var isOpen = provider.status === "open";
  var statusText = isOpen ? t("open_now") : t("closed");
  var distText = provider.distance_km != null ? formatDistance(provider.distance_km) : "";
  var img = provider.image ? base + provider.image : "";
  var phone = provider.phone || "";

  return (
    '<article class="card" style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center">' +
    '<div style="width:120px;height:90px;border-radius:8px;overflow:hidden;flex-shrink:0;background:#1a2230">' +
    (img ? '<img src="' + img + '" alt="" style="width:100%;height:100%;object-fit:cover">' : "") +
    "</div>" +
    '<div style="flex:1;min-width:180px">' +
    "<h3>" +
    name +
    "</h3>" +
    '<p class="provider-card__meta"><span class="status-dot ' +
    (isOpen ? "open" : "closed") +
    '"></span> ' +
    statusText +
    " · ★ " +
    provider.rating +
    (distText ? " · " + distText : "") +
    "</p>" +
    '<p class="provider-card__meta">📞 ' +
    phone +
    "</p>" +
    "</div>" +
    '<div style="display:flex;gap:0.5rem">' +
    '<button type="button" class="btn btn-outline btn-sm" data-map="' +
    provider.id +
    '">' +
    t("view_map") +
    "</button>" +
    '<a href="tel:' +
    phone +
    '" class="btn btn-danger btn-sm">' +
    t("call_now") +
    "</a>" +
    "</div>" +
    "</article>"
  );
}
