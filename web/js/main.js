/**
 * =============================================================================
 * main.js — Shared logic for AutoConnect (config, i18n, utils, api, ui, layout, auth)
 * =============================================================================
 */

// =============================================================================
// 1. config.js
// =============================================================================

var API_BASE = window.location.pathname.indexOf("/pages/") !== -1
  ? "../../backend/api"
  : "../backend/api";

var API_ENDPOINTS = {
  providers: "/providers.php",
  providerById: "/provider.php",
  categories: "/categories.php",
  regions: "/regions.php",
  user: "/user.php",
  login: "/login.php",
  register: "/register.php",
  addProvider: "/add_provider.php",
  updatePassword: "/update_password.php",
  reviews: "/reviews.php",
  toggleFavorite: "/toggle_favorite.php"
};

// =============================================================================
// 2. i18n.js
// =============================================================================

/** All UI strings — keys must exist in ar and en */
var TRANSLATIONS = {
  ar: {
    app_name: "AutoConnect",
    nav_home: "الرئيسية",
    nav_services: "خدماتنا",
    nav_emergency: "طوارئ",
    nav_login: "تسجيل الدخول",
    nav_signup: "سجل الآن",
    nav_profile: "الملف الشخصي",
    nav_dashboard: "لوحة التحكم",
    nav_favorites: "المفضلة",
    hero_title_1: "عطلان؟",
    hero_title_2: "متقلقش هنا هتلاقي الي محتاجه",
    hero_sub: "أدخل موقعك واعثر على أقرب ميكانيكي أو قطع غيار أو ونش في دقائق.",
    search_type: "نوع الخدمة",
    search_location: "المنطقة أو المدينة",
    search_btn: "بحث عن خدمة",
    services_title: "خدماتنا",
    services_sub: "اختر نوع الخدمة المناسب لسيارتك أو موتوسيكلك",
    mechanic: "ميكانيكي",
    spare_parts: "قطع غيار",
    towing: "ونش",
    discover_more: "اكتشف المزيد",
    shop_now: "تسوق الآن",
    order_now: "اطلب الآن",
    reviews_title: "التقييمات",
    map_placeholder: "📍 حدد الموقع على الخريطة",
    tires: "إطارات",
    service_history: "سجل الخدمة",
    mechanic_tagline: "مخطط الميكانيكي الحديث",
    certified_experts: "خبراء معتمدون",
    mechanic_sub: "صيانة وإصلاح مع فنيين معتمدين",
    certified_techs: "فنيون معتمدون",
    spare_parts_sub: "قطع أصلية وتوصيل للمنزل",
    original_parts: "قطع أصلية",
    home_delivery: "توصيل للمنزل",
    towing_sub: "ونش طوارئ سريع",
    response_15_min: "استجابة 15 دقيقة",
    gps_tracking: "تتبع GPS",
    cta_join_title: "انضم إلى نخبة خبراء السيارات في مصر",
    cta_join_sub: "هل أنت مزود خدمة؟ انضم لشبكتنا واستقبل الطلبات.",
    partner_btn: "انضم إلينا",
    learn_more: "اعرف المزيد",
    login_title: "مرحباً بعودتك",
    login_sub: "قم بتسجيل الدخول للمتابعة في أوتو كونيكت",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    forgot_password: "نسيت كلمة المرور؟",
    login_btn: "تسجيل الدخول",
    or: "أو",
    guest_btn: "المتابعة كضيف",
    no_account: "ليس لديك حساب؟",
    signup_link: "سجل الآن",
    customer: "عميل",
    service_provider: "مزود خدمة",
    register_title: "إنشاء حساب جديد",
    register_sub: "انضم إلى أوتو كونيكت واستفد من خدماتنا المحفوظة",
    register_provider_sub: "سجّل ورشتك وأكمل بيانات محفظة مزود الخدمة",
    full_name: "الاسم الكامل",
    phone: "رقم الهاتف",
    confirm_password: "تأكيد كلمة المرور",
    create_account: "إنشاء حساب",
    have_account: "لديك حساب بالفعل؟",
    continue_guest: "المتابعة كزائر",
    emergency_title: "مساعدة طارئة 🚨",
    emergency_sub: "هل تحتاج إلى مساعدة الآن؟ ابحث عن أقرب ونش واتصل به فوراً.",
    use_location: "استخدام موقعي الحالي",
    or_choose_area: "أو اختر منطقتك يدوياً",
    choose_area: "اختر منطقتك",
    nearest_providers: "أقرب مزودي الخدمة",
    results_by_location: "نتائج بناءً على موقعك",
    open_now: "مفتوح الآن",
    closed: "مغلق",
    call_now: "اتصل الآن",
    view_map: "عرض الموقع",
    emergency_footer: "إذا كنت في خطر وشيك، يرجى الاتصال بخدمات الطوارئ المحلية فوراً (15088). سلامتك هي أولويتنا القصوى.",
    filtered_services: "خدمات مصفاة",
    filtered_sub: "عرض النتائج بناء على اختيارك",
    search_services: "ابحث عن خدمة",
    type: "النوع",
    region: "المنطقة",
    status: "الحالة",
    sort_by: "ترتيب حسب",
    apply_filter: "تطبيق الفلتر",
    showing_results: "عرض",
    results: "نتائج",
    near_you: "بالقرب من موقعك",
    show_map: "عرض الخريطة",
    favorites_title: "المفضلة",
    favorites_sub: "مزودو الخدمة الذين حفظتهم للوصول السريع",
    all_providers: "كل مقدمي الخدمة",
    view_details: "عرض التفاصيل",
    explore_directory: "استكشف الدليل",
    more_services: "هل تبحث عن المزيد من الخدمات؟",
    profile_title: "ملف العميل",
    edit_profile: "تعديل الملف",
    service_summary: "ملخص الخدمة",
    total_visits: "إجمالي الزيارات",
    last_visit: "آخر زيارة",
    next_maintenance: "الصيانة القادمة",
    favorite_providers: "المزودون المفضلون",
    view_all: "عرض الكل",
    add_provider: "إضافة مزود جديد",
    saved_location: "الموقع المحفوظ",
    account_settings: "إعدادات الحساب",
    change_password: "تغيير كلمة المرور",
    notification_prefs: "تفضيلات الإشعارات",
    language_settings: "إعدادات اللغة",
    settings_title: "الإعدادات",
    settings_sub: "قم بتهيئة أمان حسابك وتفضيلاتك",
    account_mgmt: "إدارة الحساب",
    account_mgmt_sub: "إدارة بيانات السيارات الخاصة بك",
    profile_details: "تفاصيل الملف الشخصي",
    security: "الأمان",
    notifications: "الإشعارات",
    upgrade_plan: "ترقية الخطة",
    security_tips: "أفضل ممارسات الأمان",
    tip1: "استخدم 12 حرفاً على الأقل بما في ذلك الرموز.",
    tip2: "قم بتفعيل المصادقة الثنائية (2FA).",
    tip3: "تجنب إعادة استخدام كلمات المرور من منصات أخرى.",
    current_password: "كلمة المرور الحالية",
    new_password: "كلمة المرور الجديدة",
    confirm_new_password: "تأكيد كلمة المرور الجديدة",
    update_password: "تحديث كلمة المرور",
    delete_account: "حذف الحساب",
    delete_account_desc: "حذف الحساب نهائي وسيمحو كل بيانات الأسطول والتشخيص والمخزون من السحابة.",
    delete_my_account: "حذف حسابي",
    provider_reg_title: "انضم لأكبر شبكة خدمات النقل في مصر",
    provider_reg_sub: "سجّل ورشتك وابدأ في استقبال طلبات العملاء القريبين منك.",
    provider_form_title: "بيانات مقدم الخدمة",
    workshop_name: "اسم الورشة / المركز",
    mobile: "رقم الموبايل",
    service_type: "نوع الخدمة",
    availability: "التوفر",
    working_hours: "مواعيد العمل",
    city_area: "المدينة / المنطقة",
    service_desc: "وصف الخدمة (نبذة سريعة)",
    pin_on_map: "حدد مكانك بدقة على الخريطة",
    register_workshop: "سجل ورشتك الآن",
    save_later: "حفظ وإكمال لاحقاً",
    quality_note: "جميع الطلبات يتم مراجعتها لضمان الجودة",
    tech_support: "دعم فني",
    geo_expand: "توسع جغرافي",
    quick_response: "استجابة سريعة",
    live_status: "الحالة المباشرة",
    online_now: "متوفر الآن",
    waiting_time: "وقت الانتظار",
    capacity: "السعة",
    similar_nearby: "خدمات مشابهة قريبة",
    our_location: "موقعنا على الخريطة",
    favorite: "مفضلة",
    privacy: "سياسة الخصوصية",
    terms: "الشروط والأحكام",
    contact: "اتصل بنا",
    copyright: "© 2024 AutoConnect. جميع الحقوق محفوظة.",
    days_ago: "منذ",
    days: "يوم",
    connected: "متصل",
    system_status: "حالة النظام",
    all_types: "الكل",
    status_open: "مفتوح الآن",
    status_closed: "مغلق",
    sort_nearest: "الأقرب",
    sort_rating: "التقييم",
    km_away: "كم",
    loading: "جاري التحميل...",
    no_results: "لا توجد نتائج",
    location_error: "تعذر الحصول على موقعك. اختر المنطقة يدوياً.",
    login_success: "تم تسجيل الدخول (تجريبي)",
    register_success: "تم إنشاء الحساب (تجريبي)",
    password_updated: "تم تحديث كلمة المرور (تجريبي)"
  },
  en: {
    app_name: "AutoConnect",
    nav_home: "Home",
    nav_services: "Our Services",
    nav_emergency: "Emergency",
    nav_login: "Login",
    nav_signup: "Sign Up",
    nav_profile: "Profile",
    nav_dashboard: "Dashboard",
    nav_favorites: "Favorites",
    hero_title_1: "Broken down?",
    hero_title_2: "Don't worry — find what you need here",
    hero_sub: "Enter your location to find the nearest mechanic, spare parts shop, or tow truck in minutes.",
    search_type: "Service type",
    search_location: "Area or city",
    search_btn: "Search services",
    services_title: "Our Services",
    services_sub: "Choose the right service for your car or motorcycle",
    mechanic: "Mechanic",
    spare_parts: "Spare Parts",
    towing: "Tow Truck",
    discover_more: "Discover more",
    shop_now: "Shop now",
    order_now: "Order now",
    reviews_title: "Reviews",
    map_placeholder: "📍 Set location on map",
    tires: "Tires",
    service_history: "Service History",
    mechanic_tagline: "The Modern Mechanic's Planner",
    certified_experts: "Certified Experts",
    mechanic_sub: "Maintenance & repair with certified technicians",
    certified_techs: "Certified technicians",
    spare_parts_sub: "Original parts with home delivery",
    original_parts: "Original parts",
    home_delivery: "Home delivery",
    towing_sub: "Fast emergency tow truck",
    response_15_min: "15-min response",
    gps_tracking: "GPS tracking",
    cta_join_title: "Join Egypt's elite automotive experts",
    cta_join_sub: "Are you a service provider? Join our network and receive orders.",
    partner_btn: "Partner with us",
    learn_more: "Learn more",
    login_title: "Welcome back",
    login_sub: "Sign in to continue with AutoConnect",
    email: "Email",
    password: "Password",
    forgot_password: "Forgot password?",
    login_btn: "Sign in",
    or: "or",
    guest_btn: "Continue as guest",
    no_account: "Don't have an account?",
    signup_link: "Sign up now",
    customer: "Customer",
    service_provider: "Service Provider",
    register_title: "Create a new account",
    register_sub: "Join AutoConnect and access our saved services",
    register_provider_sub: "Register your workshop and complete your provider portfolio",
    full_name: "Full name",
    phone: "Phone number",
    confirm_password: "Confirm password",
    create_account: "Create account",
    have_account: "Already have an account?",
    continue_guest: "Continue as guest",
    emergency_title: "Emergency assistance 🚨",
    emergency_sub: "Need help now? Find the nearest tow truck and call immediately.",
    use_location: "Use my current location",
    or_choose_area: "Or choose your area manually",
    choose_area: "Choose your area",
    nearest_providers: "Nearest service providers",
    results_by_location: "Results based on your location",
    open_now: "Open now",
    closed: "Closed",
    call_now: "Call now",
    view_map: "View location",
    emergency_footer: "If you are in immediate danger, call local emergency services (15088). Your safety is our top priority.",
    filtered_services: "Filtered services",
    filtered_sub: "Showing results based on your selection",
    search_services: "Search for services",
    type: "Type",
    region: "Region",
    status: "Status",
    sort_by: "Sort by",
    apply_filter: "Apply filter",
    showing_results: "Showing",
    results: "results",
    near_you: "Near your location",
    show_map: "Show on map",
    favorites_title: "Favorites",
    favorites_sub: "Service providers you saved for quick access",
    all_providers: "All providers",
    view_details: "View details",
    explore_directory: "Explore directory",
    more_services: "Looking for more services?",
    profile_title: "Customer profile",
    edit_profile: "Edit profile",
    service_summary: "Service summary",
    total_visits: "Total visits",
    last_visit: "Last visit",
    next_maintenance: "Next maintenance",
    favorite_providers: "Favorite providers",
    view_all: "View all",
    add_provider: "Add new provider",
    saved_location: "Saved location",
    account_settings: "Account settings",
    change_password: "Change password",
    notification_prefs: "Notification preferences",
    language_settings: "Language settings",
    settings_title: "Settings",
    settings_sub: "Configure your account security and preferences",
    account_mgmt: "Account management",
    account_mgmt_sub: "Manage your vehicle data",
    profile_details: "Profile details",
    security: "Security",
    notifications: "Notifications",
    upgrade_plan: "Upgrade plan",
    security_tips: "Security best practices",
    tip1: "Use at least 12 characters including symbols.",
    tip2: "Enable two-factor authentication (2FA).",
    tip3: "Avoid reusing passwords from other platforms.",
    current_password: "Current password",
    new_password: "New password",
    confirm_new_password: "Confirm new password",
    update_password: "Update password",
    delete_account: "Delete account",
    delete_account_desc: "Deleting your account is permanent and will erase all fleet, diagnostic, and inventory data from the cloud.",
    delete_my_account: "Delete my account",
    provider_reg_title: "Join Egypt's largest transport services network",
    provider_reg_sub: "Register your workshop and start receiving nearby customer requests.",
    provider_form_title: "Service provider information",
    workshop_name: "Workshop / center name",
    mobile: "Mobile number",
    service_type: "Service type",
    availability: "Availability",
    working_hours: "Working hours",
    city_area: "City / area",
    service_desc: "Service description (brief)",
    pin_on_map: "Pin your location on the map",
    register_workshop: "Register your workshop",
    save_later: "Save and complete later",
    quality_note: "All requests are reviewed to ensure quality",
    tech_support: "Technical support",
    geo_expand: "Geographic expansion",
    quick_response: "Quick response",
    live_status: "Live status",
    online_now: "Available now",
    waiting_time: "Waiting time",
    capacity: "Capacity",
    similar_nearby: "Similar services nearby",
    our_location: "Our location on map",
    favorite: "Favorite",
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    contact: "Contact us",
    copyright: "© 2024 AutoConnect. All rights reserved.",
    days_ago: "",
    days: "days ago",
    connected: "Connected",
    system_status: "System status",
    all_types: "All",
    status_open: "Open now",
    status_closed: "Closed",
    sort_nearest: "Nearest",
    sort_rating: "Rating",
    km_away: "km away",
    loading: "Loading...",
    no_results: "No results found",
    location_error: "Could not get your location. Please choose your area manually.",
    login_success: "Logged in (demo)",
    register_success: "Account created (demo)",
    password_updated: "Password updated (demo)"
  }
};

/** Active language: "ar" (default) or "en" */
var currentLang = localStorage.getItem("autoconnect_lang") || "ar";

/** Get one translated string by key, e.g. t("login_btn") */
function t(key) {
  var pack = TRANSLATIONS[currentLang];
  return (pack && pack[key]) || TRANSLATIONS.ar[key] || key;
}

/**
 * Switch language: updates body dir (rtl/ltr), all data-i18n elements, and calls
 * onLanguageChange() on the current page if that function exists (e.g. services.js).
 */
function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem("autoconnect_lang", lang);
  document.body.classList.remove("rtl", "ltr");
  document.body.classList.add(lang === "ar" ? "rtl" : "ltr");
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    el.textContent = t(el.getAttribute("data-i18n"));
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });

  var toggle = document.getElementById("lang-toggle");
  if (toggle) {
    toggle.textContent = lang === "ar" ? "EN" : "AR";
  }

}

/** Flip AR ↔ EN (header button calls this) */
function toggleLanguage() {
  setLanguage(currentLang === "ar" ? "en" : "ar");
  if (typeof onLanguageChange === "function") {
    onLanguageChange(currentLang);
  }
}

/**
 * Pick Arabic or English field from API data.
 * Example: getLocalizedField(provider, "name") → name_ar or name_en
 */
function getLocalizedField(obj, field) {
  if (!obj) return "";
  if (currentLang === "en") {
    return obj[field + "_en"] || obj[field + "_ar"] || "";
  }
  return obj[field + "_ar"] || obj[field + "_en"] || "";
}

// =============================================================================
// 3. utils.js
// =============================================================================

function getDistanceKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Human-readable distance for UI */
function formatDistance(km) {
  if (km < 1) {
    return Math.round(km * 1000) + " m";
  }
  return km.toFixed(1) + " " + t("km_away");
}

/**
 * Ask browser for user's GPS position (requires HTTPS or localhost).
 * Returns Promise with { lat, long }.
 */
function getUserLocation() {
  return new Promise(function (resolve, reject) {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        resolve({
          lat: pos.coords.latitude,
          long: pos.coords.longitude
        });
      },
      function (err) {
        reject(err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/** Fallback when user denies location permission — center of Cairo */
var DEFAULT_LOCATION = { lat: 30.0444, long: 31.2357 };

/** Read last saved GPS from localStorage (set on emergency page) */
function getStoredLocation() {
  var raw = localStorage.getItem("autoconnect_location");
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function saveLocation(loc) {
  localStorage.setItem("autoconnect_location", JSON.stringify(loc));
}

function setEl(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

/** Add distance_km property to each provider object */
function addDistanceToProviders(providers, userLat, userLong) {
  return providers.map(function (p) {
    var copy = Object.assign({}, p);
    copy.distance_km = getDistanceKm(userLat, userLong, p.lat, p.lng);
    return copy;
  });
}

// =============================================================================
// 4. api.js
// =============================================================================

/**
 * Sends one API request. This is the single gate between UI and backend.
 *
 * @param {string} endpointKey — name from API_ENDPOINTS in config.js (e.g. "providers")
 * @param {object} options — { method: "GET"|"POST", params: {}, body: {} }
 * @returns {Promise} resolves to { success, message, data }
 */
function apiRequest(endpointKey, options) {
  options = options || {};
  var method = (options.method || "GET").toUpperCase();

  var path = API_ENDPOINTS[endpointKey];
  if (!path) {
    return Promise.reject(new Error("Unknown endpoint: " + endpointKey));
  }

  var url = API_BASE + path;
  var fetchOptions = {
    method: method,
    headers: { "Content-Type": "application/json" }
  };

  // If user logged in before, send token (PHP can read Authorization header)
  var token = localStorage.getItem("autoconnect_token");
  if (token) {
    fetchOptions.headers["Authorization"] = "Bearer " + token;
  }

  // GET: filters go in URL query string (?category=mechanic&city=Cairo)
  if (options.params && method === "GET") {
    var qs = new URLSearchParams(options.params).toString();
    if (qs) url += (url.indexOf("?") >= 0 ? "&" : "?") + qs;
  }

  // POST: form data goes in JSON body
  if (options.body && method !== "GET") {
    fetchOptions.body = JSON.stringify(options.body);
  }

  return fetch(url, fetchOptions).then(function (response) {
    return response.json();
  });
}

/**
 * Pulls out `data` from a successful response.
 * Throws an Error if success === false (so .catch() can show the message).
 */
function unwrap(response) {
  if (response && response.success === false) {
    var err = new Error(response.message || "Request failed");
    err.response = response;
    throw err;
  }
  return response.data !== undefined ? response.data : response;
}

// ---------------------------------------------------------------------------
// PROVIDERS (garages, tow trucks, parts shops)
// ---------------------------------------------------------------------------

/** List providers; optional filters — see filterProviders() in utils.js */
function getProviders(filters) {
  return apiRequest("providers", { method: "GET", params: filters || {} }).then(unwrap);
}

/** One provider by id (service detail page uses ?id=1 in URL) */
function getProviderById(id) {
  return apiRequest("providerById", {
    method: "GET",
    params: { id: id }
  }).then(unwrap);
}

// ---------------------------------------------------------------------------
// LOOKUP DATA
// ---------------------------------------------------------------------------

function getCategories() {
  return apiRequest("categories", { method: "GET" }).then(unwrap);
}

function getRegions() {
  return apiRequest("regions", { method: "GET" }).then(unwrap);
}

// ---------------------------------------------------------------------------
// USER ACCOUNT
// ---------------------------------------------------------------------------

function getUser() {
  return apiRequest("user", { method: "GET" }).then(unwrap);
}

/** Returns full response — check res.success before redirecting */
function loginUser(email, password) {
  return apiRequest("login", {
    method: "POST",
    body: { email: email, password: password }
  });
}

/**
 * Register customer OR provider (register page sends role + different fields).
 * Returns full response.
 */
function registerUser(data) {
  return apiRequest("register", { method: "POST", body: data });
}

function updatePassword(data) {
  return apiRequest("updatePassword", {
    method: "POST",
    body: {
      current: data.current,
      new: data.new,
      confirm: data.confirm
    }
  });
}

/** Standalone “join as workshop” page — adds row to providers table */
function addProvider(data) {
  return apiRequest("addProvider", { method: "POST", body: data });
}

// ---------------------------------------------------------------------------
// reviews & favorites
// ---------------------------------------------------------------------------

function getReviews(providerId) {
  return apiRequest("reviews", {
    method: "GET",
    params: { provider_id: providerId }
  }).then(unwrap);
}

function toggleFavorite(providerId) {
  return apiRequest("toggleFavorite", {
    method: "POST",
    body: { provider_id: providerId }
  });
}

// =============================================================================
// 6. ui.js
// =============================================================================

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
  var badge = provider.category_slug || "";

  return `
    <article class="provider-card">
      <div class="provider-card__image">
        ${img ? `<img src="${img}" alt="${name}">` : ""}
        ${badge ? `<span class="provider-card__badge">${badge}</span>` : ""}
      </div>
      <div class="provider-card__body">
        <p class="provider-card__rating">★ ${provider.rating}</p>
        <h3>${name}</h3>
        <p class="provider-card__meta"><span class="status-dot ${statusClass}"></span> ${statusText}</p>
        ${address ? `<p class="provider-card__meta">📍 ${address}</p>` : ""}
        ${distText ? `<p class="provider-card__meta">↗ ${distText}</p>` : ""}
        ${phone ? `<p class="provider-card__meta">📞 ${phone}</p>` : ""}
        <div class="provider-card__actions">
          <a href="${detailUrl}" class="btn btn-ghost btn-sm">${options.detailsLabel || t("view_details")}</a>
          <a href="tel:${phone}" class="btn btn-primary btn-sm">${t("call_now")}</a>
        </div>
      </div>
    </article>`;
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

function renderHorizontalProviderCard(provider, options) {
  options = options || {};
  var base = options.basePath || getBasePath();
  var name = getLocalizedField(provider, "name");
  var isOpen = provider.status === "open";
  var statusText = isOpen ? t("open_now") : t("closed");
  var statusClass = isOpen ? "open" : "closed";
  var distText = provider.distance_km != null ? formatDistance(provider.distance_km) : "";
  var img = provider.image ? base + provider.image : "";
  var phone = provider.phone || "";

  return `
    <article class="card" style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center">
      <div style="width:120px;height:90px;border-radius:8px;overflow:hidden;flex-shrink:0;background:#1a2230">
        ${img ? `<img src="${img}" alt="" style="width:100%;height:100%;object-fit:cover">` : ""}
      </div>
      <div style="flex:1;min-width:180px">
        <h3>${name}</h3>
        <p class="provider-card__meta">
          <span class="status-dot ${statusClass}"></span> ${statusText} · ★ ${provider.rating}${distText ? " · " + distText : ""}
        </p>
        <p class="provider-card__meta">📞 ${phone}</p>
      </div>
      <div style="display:flex;gap:0.5rem">
        <button type="button" class="btn btn-outline btn-sm" data-map="${provider.id}">${t("view_map")}</button>
        <a href="tel:${phone}" class="btn btn-danger btn-sm">${t("call_now")}</a>
      </div>
    </article>`;
}

// =============================================================================
// 7. layout.js
// =============================================================================

/** Nav links shown in header — pages array = which HTML file is "active" */
var NAV_ITEMS = [
  { href: "index.html", key: "nav_home", pages: ["index.html", ""] },
  { href: "pages/services.html", key: "nav_services", pages: ["services.html"] },
  { href: "pages/emergency.html", key: "nav_emergency", pages: ["emergency.html"], highlight: true }
];

/** "../" when URL contains /pages/, else "./" */
function getBasePath() {
  return window.location.pathname.indexOf("/pages/") !== -1 ? "../" : "";
}

function getPageName() {
  var parts = window.location.pathname.split("/");
  return parts[parts.length - 1] || "index.html";
}

function renderHeader() {
  var el = document.getElementById("site-header");
  if (!el) return;

  var base = getBasePath();
  var page = getPageName();
  var linksHtml = "";

  NAV_ITEMS.forEach(function (item) {
    var href;
    if (base === "../") {
      href = item.href === "index.html" ? "../index.html" : item.href.replace("pages/", "");
    } else {
      href = item.href;
    }
    var isActive = item.pages.indexOf(page) !== -1;
    var cls = isActive ? "active" : "";
    var style = item.highlight ? ' style="color:var(--accent-yellow)"' : "";
    linksHtml += `<a href="${href}" class="${cls}" data-i18n="${item.key}"${style}></a>`;
  });

  el.innerHTML = `
    <header class="site-header">
      <div class="container header-inner">
        <button class="menu-toggle" id="menu-toggle" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
        <a href="${base}index.html" class="logo">Auto<span>Connect</span></a>
        <nav class="nav-links" id="nav-links">${linksHtml}</nav>
        <div class="header-actions">
          <button type="button" class="lang-toggle" id="lang-toggle">EN</button>
          <a href="${base}pages/login.html" class="btn btn-sm btn-ghost" data-i18n="nav_login"></a>
          <a href="${base}pages/register.html" class="btn btn-sm btn-primary" data-i18n="nav_signup"></a>
        </div>
      </div>
    </header>`;

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
  el.innerHTML = `
    <footer class="site-footer">
      <div class="container footer-inner">
        <a href="${base}index.html" class="logo">AutoConnect</a>
        <div class="footer-links">
          <a href="#" data-i18n="privacy"></a>
          <a href="#" data-i18n="terms"></a>
          <a href="#" data-i18n="contact"></a>
        </div>
        <p class="footer-copy" data-i18n="copyright"></p>
      </div>
    </footer>`;
}

// =============================================================================
// 8. auth.js
// =============================================================================

/** Which tab is selected on register page: "customer" or "provider" */
var registerRole = "customer";

/** Send email + password to API; go to profile if success */
function handleLoginSubmit(e) {
  e.preventDefault();
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;
  loginUser(email, password)
    .then(function (res) {
      if (!res.success) {
        alert(res.message);
        return;
      }
      alert(res.message);
      window.location.href = "profile.html";
    })
    .catch(function (err) {
      alert(err.message || "Login failed");
    });
}

/** Setup register page on first load */
function initRegisterPage() {
  if (!document.getElementById("register-form")) return;
  loadRegisterCategories();
  setRegisterRole("customer");
}

/** Fill service type dropdown from getCategories() API */
function loadRegisterCategories() {
  var sel = document.getElementById("provider-category");
  if (!sel) return;
  getCategories().then(function (cats) {
    sel.innerHTML = "";
    cats.forEach(function (c) {
      if (c.parent_id) return; // skip sub-categories in dropdown
      var opt = document.createElement("option");
      opt.value = c.id;
      opt.setAttribute("data-slug", c.slug);
      opt.textContent = getLocalizedField(c, "name");
      sel.appendChild(opt);
    });
  });
}

/**
 * Show/hide customer vs provider fields when user clicks role toggle.
 * Also updates card width, subtitle text, and submit button label.
 */
function setRegisterRole(role) {
  registerRole = role;
  var customerFields = document.getElementById("customer-fields");
  var providerFields = document.getElementById("provider-fields");
  var card = document.getElementById("register-card");
  var subtitle = document.getElementById("register-subtitle");
  var submitBtn = document.getElementById("register-submit");
  var fullName = document.getElementById("full-name");
  var phone = document.getElementById("phone");
  var workshop = document.getElementById("workshop-name");
  var mobile = document.getElementById("mobile");
  var category = document.getElementById("provider-category");
  var cityArea = document.getElementById("city-area");

  var isProvider = role === "provider";

  if (customerFields) {
    customerFields.classList.toggle("register-fields-hidden", isProvider);
  }
  if (providerFields) {
    providerFields.classList.toggle("register-fields-hidden", !isProvider);
  }
  if (card) {
    card.classList.toggle("auth-card--provider", isProvider);
  }
  if (subtitle) {
    subtitle.textContent = isProvider ? t("register_provider_sub") : t("register_sub");
    subtitle.classList.toggle("provider-mode", isProvider);
  }
  if (submitBtn) {
    submitBtn.textContent = isProvider ? t("register_workshop") : t("create_account");
  }

  // HTML5 required attribute on the right fields only
  if (fullName) fullName.required = !isProvider;
  if (phone) phone.required = !isProvider;
  if (workshop) workshop.required = isProvider;
  if (mobile) mobile.required = isProvider;
  if (category) category.required = isProvider;
  if (cityArea) cityArea.required = isProvider;
}

/** Build JSON body and call registerUser() — different fields per role */
function handleRegisterSubmit(e) {
  e.preventDefault();

  var email = document.getElementById("reg-email").value.trim();
  var password = document.getElementById("reg-password").value;
  var confirm = document.getElementById("confirm-password").value;

  if (password !== confirm) {
    alert(currentLang === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
    return;
  }

  var data = {
    role: registerRole,
    email: email,
    password: password
  };

  if (registerRole === "customer") {
    data.name = document.getElementById("full-name").value.trim();
    data.phone = document.getElementById("phone").value.trim();
  } else {
    var catSel = document.getElementById("provider-category");
    var opt = catSel.options[catSel.selectedIndex];
    data.name = document.getElementById("workshop-name").value.trim();
    data.phone = document.getElementById("mobile").value.trim();
    data.workshop_name = data.name;
    data.mobile = data.phone;
    data.category_id = catSel.value;
    data.category_slug = opt ? opt.getAttribute("data-slug") : "mechanic";
    data.availability = document.getElementById("availability").value;
    data.working_hours = document.getElementById("working-hours").value.trim();
    data.city = document.getElementById("city-area").value.trim();
    data.address = data.city;
    data.description = document.getElementById("service-desc").value.trim();
    data.lat = DEFAULT_LOCATION.lat;
    data.long = DEFAULT_LOCATION.long;
    data.status = data.availability === "closed" ? "closed" : "open";
  }

  registerUser(data).then(function (res) {
    if (!res.success) {
      alert(res.message);
      return;
    }
    alert(res.message);
    if (registerRole === "provider") {
      window.location.href = "services.html";
    } else {
      window.location.href = "login.html";
    }
  });
}


/** Wire عميل / مزود خدمة buttons on register (and login role toggle if present) */
function setupRoleToggle() {
  var toggle = document.getElementById("register-role-toggle");
  if (!toggle) {
    document.querySelectorAll(".role-toggle button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".role-toggle button").forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
      });
    });
    return;
  }

  toggle.querySelectorAll("button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      toggle.querySelectorAll("button").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      setRegisterRole(btn.getAttribute("data-role") || "customer");
    });
  });
}

/** Called when language shifts on login/register pages */
function authOnLanguageChange() {
  loadRegisterCategories();
  setRegisterRole(registerRole);
}

// =============================================================================
// 9. app.js & Initialization
// =============================================================================

document.addEventListener("DOMContentLoaded", function () {
  renderHeader();
  renderFooter();
  setLanguage(currentLang);

  var langBtn = document.getElementById("lang-toggle");
  if (langBtn) {
    langBtn.addEventListener("click", toggleLanguage);
  }

  // Auth pages initialization:
  if (window.location.pathname.includes("login.html") || window.location.pathname.includes("register.html")) {
    setupRoleToggle();
    initRegisterPage();

    var loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", handleLoginSubmit);
    }

    var registerForm = document.getElementById("register-form");
    if (registerForm) {
      registerForm.addEventListener("submit", handleRegisterSubmit);
    }
  }
});

// Global language change dispatcher called by setLanguage()
function onLanguageChange(lang) {
  // If we are on login/register pages, call auth language change
  if (window.location.pathname.includes("login.html") || window.location.pathname.includes("register.html")) {
    if (typeof authOnLanguageChange === "function") {
      authOnLanguageChange(lang);
    }
  }
  // Page-specific handlers defined in pages.js will override/be called by this
  if (typeof pageOnLanguageChange === "function") {
    pageOnLanguageChange(lang);
  }
}
