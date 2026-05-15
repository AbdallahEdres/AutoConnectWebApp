/**
 * =============================================================================
 * layout.js — Shared header & footer HTML
 * =============================================================================
 * Each page has empty <div id="site-header"> and <div id="site-footer">.
 * This file injects the same nav bar and footer so we do not copy-paste HTML.
 *
 * getBasePath() returns "../" on pages inside /pages/ so links work correctly.
 * =============================================================================
 */

/** Nav links shown in header — pages array = which HTML file is "active" */
var NAV_ITEMS = [
  { href: "index.html", key: "nav_home", pages: ["index.html", ""] },
  { href: "pages/services.html", key: "nav_services", pages: ["services.html"] },
  { href: "pages/emergency.html", key: "nav_emergency", pages: ["emergency.html"], highlight: true },
  { href: "pages/favorites.html", key: "nav_favorites", pages: ["favorites.html"] },
  { href: "pages/profile.html", key: "nav_profile", pages: ["profile.html"] }
];

/** "../" when URL contains /pages/, else "./" */
function getBasePath() {
  return window.location.pathname.indexOf("/pages/") !== -1 ? "../" : "";
}

function getPageName() {
  var parts = window.location.pathname.split("/");
  return parts[parts.length - 1] || "index.html";
}

/** Build header HTML string and insert into #site-header */
function renderHeader() {
  var el = document.getElementById("site-header");
  if (!el) return;

  var base = getBasePath();
  var page = getPageName();
  var linksHtml = "";

  NAV_ITEMS.forEach(function (item) {
    var href = item.href.indexOf("pages/") === 0 && base === "../" ? item.href.replace("pages/", "") : base + item.href.replace(/^\//, "");
    if (base === "../" && item.href === "index.html") {
      href = "../index.html";
    } else if (base === "" && item.href.indexOf("pages/") === 0) {
      href = item.href;
    }
    var isActive = item.pages.indexOf(page) !== -1;
    var cls = isActive ? " active" : "";
    var extra = item.highlight ? ' style="color:var(--accent-yellow)"' : "";
    linksHtml +=
      '<a href="' +
      href +
      '" class="' +
      cls.trim() +
      '" data-i18n="' +
      item.key +
      '"' +
      extra +
      "></a>";
  });

  el.innerHTML =
    '<header class="site-header">' +
    '<div class="container header-inner">' +
    '<button class="menu-toggle" id="menu-toggle" aria-label="Menu">' +
    "<span></span><span></span><span></span>" +
    "</button>" +
    '<a href="' +
    base +
    'index.html" class="logo">Auto<span>Connect</span></a>' +
    '<nav class="nav-links" id="nav-links">' +
    linksHtml +
    "</nav>" +
    '<div class="header-actions">' +
    '<button type="button" class="lang-toggle" id="lang-toggle">EN</button>' +
    '<a href="' +
    base +
    'pages/login.html" class="btn btn-sm btn-ghost" data-i18n="nav_login"></a>' +
    '<a href="' +
    base +
    'pages/register.html" class="btn btn-sm btn-primary" data-i18n="nav_signup"></a>' +
    '<a href="' +
    base +
    'pages/profile.html" class="icon-btn" title="Profile">👤</a>' +
    "</div>" +
    "</div>" +
    "</header>";

  var toggle = document.getElementById("menu-toggle");
  var nav = document.getElementById("nav-links");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }
}

function renderFooter() {
  var el = document.getElementById("site-footer");
  if (!el) return;

  var base = getBasePath();

  el.innerHTML =
    '<footer class="site-footer">' +
    '<div class="container footer-inner">' +
    '<a href="' +
    base +
    'index.html" class="logo">AutoConnect</a>' +
    '<div class="footer-links">' +
    '<a href="#" data-i18n="privacy"></a>' +
    '<a href="#" data-i18n="terms"></a>' +
    '<a href="#" data-i18n="contact"></a>' +
    "</div>" +
    '<p class="footer-copy" data-i18n="copyright"></p>' +
    "</div>" +
    "</footer>";
}
