// Updated: 2026-09-15 10:36 by Silver
// Wait for the GrowthBook SDK to load before running
window.dataLayer = window.dataLayer || [];
window.growthbook_queue = window.growthbook_queue || [];

window.growthbook_queue.push(function(gb) {
    // Attach external function as event listener
    document.addEventListener("growthbookdata", function() {
        const qaCookie = getCookie("speero-qa");

        if (qaCookie) {
            console.log("[Speero QA Mode] Detected speero-qa cookie.");
            console.log("[Speero QA Mode] Cookie value:", qaCookie);
            applyQACookieExperiments(qaCookie);
        } else {
            applyFeatureFlags(gb);
        }
    });
});

// User source rules
(function () {
  var COOKIE_NAME = "speero-user-source";
  var COOKIE_DOMAIN = ".gexaenergy.com"; // works across all subdomains
  var COOKIE_MAX_AGE_SEC = 90 * 24 * 60 * 60;   // 90 days
  var VISITOR_COOKIE_NAME = "speero-visitor";
  var VISITOR_MAX_AGE_SEC = 180 * 24 * 60 * 60; // 180 days, restarted on every visit
  var USER_TYPE_COOKIE_NAME = "speero-user-type"; // session cookie, keeps the type fixed for the session

  // --- helpers ---
  function getQueryParams() {
    var params = {};
    var q = location.search.substring(1);
    if (!q) return params;
    q.split("&").forEach(function (kv) {
      var i = kv.indexOf("=");
      var k = decodeURIComponent((i >= 0 ? kv.slice(0, i) : kv) || "").toLowerCase();
      var v = decodeURIComponent((i >= 0 ? kv.slice(i + 1) : "") || "");
      if (k) params[k] = v;
    });
    return params;
  }
  function getCookie(name) {
    var m = document.cookie.match(new RegExp("(^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
    return m ? decodeURIComponent(m[2]) : null;
  }
  function setCookie(name, value, maxAgeSec) {
    var attrs = [
      name + "=" + encodeURIComponent(value),
      "Path=/",
      "Domain=" + COOKIE_DOMAIN,
      "SameSite=Lax"
      // add "Secure" if strictly HTTPS
    ];
    // omit Max-Age for a session cookie
    if (maxAgeSec !== null) attrs.push("Max-Age=" + (maxAgeSec === undefined ? COOKIE_MAX_AGE_SEC : maxAgeSec));
    document.cookie = attrs.join("; ");
  }

  // --- classification lists ---
  var searchEngines = [
    "google.", "bing.", "yahoo.", "duckduckgo.", "baidu.", "yandex.", "ecosia.", "ask.", "aol.", "naver.", "seznam.", "startpage.", "qwant."
  ];
  var socialHosts = [
    "facebook.", "fb.", "instagram.", "tiktok.", "pinterest.", "twitter.", "x.com", "t.co", "linkedin.", "lnkd.", "snapchat.", "snap.", "reddit.", "discord.", "threads.net"
  ];
  var paidClickParams = ["gclid", "gbraid", "wbraid", "msclkid", "fbclid", "ttclid", "twclid", "li_fat_id"];

  function hostMatchesAny(host, list) {
    host = (host || "").toLowerCase();
    return list.some(function (needle) { return host.indexOf(needle) !== -1; });
  }

  function classifyVisit() {
    var ref = document.referrer || "";
    var refUrl;
    try { refUrl = ref ? new URL(ref) : null; } catch (_) { refUrl = null; }
    var refHost = refUrl ? refUrl.hostname.toLowerCase() : "";
    var thisUrl = location.href;
    var q = getQueryParams();

    // 1) PTC override
    var urlLower = thisUrl.toLowerCase();
    var ptcInUrl = urlLower.indexOf("ptc") !== -1;
    var ptcInRef = ref.toLowerCase().indexOf("powertochoose") !== -1;
    if (ptcInUrl || ptcInRef) return "ptc";

    // 2) Paid identifiers
    var hasPaidParam = paidClickParams.some(function (k) { return k in q; });
    var utmMedium = (q["utm_medium"] || "").toLowerCase();
    var utmSource = (q["utm_source"] || "").toLowerCase();
    var paidMediumSearch = /(cpc|ppc|paidsearch|search|sem)/.test(utmMedium);
    var paidMediumSocial = /(paid-social|paidsocial|social_paid|social)/.test(utmMedium) && !paidMediumSearch;
    var socialSources = ["facebook", "instagram", "meta", "tiktok", "twitter", "x", "pinterest", "snapchat", "linkedin", "reddit", "threads"];
    var isSocialSource = socialSources.some(function (s) { return utmSource.indexOf(s) !== -1; });
    var paidDetected = hasPaidParam || paidMediumSearch || paidMediumSocial || (utmMedium && /paid/.test(utmMedium));
    if (paidDetected) {
      if (paidMediumSearch || /(google|bing|yahoo|baidu|yandex)/.test(utmSource) || ("gclid" in q) || ("msclkid" in q) || ("gbraid" in q) || ("wbraid" in q)) {
        return "paid-search";
      }
      if (paidMediumSocial || isSocialSource || ("fbclid" in q) || ("ttclid" in q) || ("twclid" in q) || ("li_fat_id" in q)) {
        return "paid-social";
      }
      return "paid-search";
    }

    // 3) Organic
    if (refUrl && hostMatchesAny(refHost, searchEngines)) return "organic";

    // 4) Social
    if (refUrl && hostMatchesAny(refHost, socialHosts)) return "social";

    // 5) Default
    return "direct";
  }

  // --- apply rules every page load ---
  var currentCookie = getCookie(COOKIE_NAME) || "direct";
  var visitSource = classifyVisit();

  if (visitSource !== "direct") {
    setCookie(COOKIE_NAME, visitSource);
    currentCookie = visitSource;
  } else if (!currentCookie) {
    setCookie(COOKIE_NAME, "direct");
    currentCookie = "direct";
  }

  // --- new vs returning user ---
  // The type is decided on the first page view of a session and stored in a session cookie.
  // The 180 day visitor cookie only decides the type of the next session.
  var userType = getCookie(USER_TYPE_COOKIE_NAME);
  if (userType !== "new" && userType !== "returning") {
    userType = getCookie(VISITOR_COOKIE_NAME) ? "returning" : "new";
    setCookie(USER_TYPE_COOKIE_NAME, userType, null);
  }
  setCookie(VISITOR_COOKIE_NAME, "1", VISITOR_MAX_AGE_SEC); // restart expiry on every visit

  // expose as global variable
  window.speero_user_source = currentCookie;
  window.speero_user_type = userType;
  window.dataLayer.push({'event': 'speero-source-available', speero_source: currentCookie, user_type: userType});
  window.growthbook_config = window.growthbook_config || {};
  window.growthbook_config.attributes = {
    user_source: currentCookie,
    user_type: userType,
    qa_mode: getCookie('speero-qa-mode') || "false"
  }
  console.log('source: ' + currentCookie);
  window.growthbook_config.navigateDelay = 0.5; // Default is 0.1
  window.growthbook_config.maxNavigateDelay = 3; // Default is 1

  window.growthbook_config.uuidCookieDomain = ".gexaenergy.com"
})(); // End user source rules

// Renewal attributes: sent to GrowthBook as soon as the it_eligible_for_renewal event hits the dataLayer
(function () {
  var EVENT_NAME = "it_eligible_for_renewal";
  var ATTRIBUTE_KEYS = ["account_id", "it_contract_expiration_date", "power_to_choose"];
  var seen = new WeakSet();

  function setRenewalAttributes(data) {
    var attrs = {};
    ATTRIBUTE_KEYS.forEach(function (key) {
      if (data[key] !== undefined && data[key] !== null) attrs[key] = data[key];
    });
    // read by the SDK if it has not initialised yet
    window.growthbook_config = window.growthbook_config || {};
    window.growthbook_config.attributes = Object.assign({}, window.growthbook_config.attributes, attrs);
    // runs right away if the SDK is loaded, otherwise once it is ready
    window.growthbook_queue.push(function (gb) {
      gb.setAttributes(Object.assign({}, gb.getAttributes(), attrs));
      document.dispatchEvent(new CustomEvent("speero-attributes-updated", { detail: attrs }));
    });
  }

  function handle(item) {
    try {
      if (item && typeof item === "object" && item.event === EVENT_NAME && !seen.has(item)) {
        seen.add(item);
        setRenewalAttributes(item);
      }
    } catch (e) {
      console.error("[Speero] Could not set renewal attributes:", e);
    }
  }

  function scan() {
    if (Array.isArray(window.dataLayer)) window.dataLayer.forEach(handle);
  }

  // catches the event the moment it is pushed
  var originalPush = window.dataLayer.push;
  window.dataLayer.push = function () {
    var result = originalPush.apply(this, arguments);
    for (var i = 0; i < arguments.length; i++) handle(arguments[i]);
    return result;
  };

  // backup for when the dataLayer is replaced or its push is overridden after this script (e.g. by GTM)
  scan();
  var scans = 0;
  var timer = setInterval(function () {
    scan();
    if (++scans >= 100) clearInterval(timer); // stop after about 25 seconds
  }, 250);
})(); // End renewal attributes

// Load GrowthBook
(function(s) {
    s = document.createElement('script'); 
    s.async = true;
    s.dataset.apiHost = "https://cdn.growthbook.io";
    s.dataset.clientKey = "sdk-vYJcsPIxtz9YGEiJ";
    s.src = "https://cdn.jsdelivr.net/npm/@growthbook/growthbook/dist/bundles/auto.min.js";
    document.head.appendChild(s);
})();

// Feature flag logic using GrowthBook SDK (production mode)
function applyFeatureFlags(gb) {
    for (const experimentId in speero_experiments) {
        const experiment = speero_experiments[experimentId];
        
        if (experiment.status === 'live') {
            const variant = gb.getFeatureValue(experimentId);
            if (typeof experiment[variant] === 'function') {
                try {
                    experiment[variant]();
                } catch (e) {
                    console.error(`[GrowthBook] Error running variant ${variant} of experiment "${experimentId}":`, e);
                }
            } else {
                console.warn(`[GrowthBook] No function found for variant ${variant} in experiment "${experimentId}"`);
            }
        }
    }
}

// QA mode logic using speero-qa cookie (fail fast)
function applyQACookieExperiments(cookieValue) {
  const pairs = cookieValue.split(',');
  pairs.forEach(pair => {
      const [experimentId, variantStr] = pair.split(':').map(s => s.trim());
      const variant = parseInt(variantStr, 10);

      if (!experimentId || isNaN(variant)) {
          console.warn(`[Speero QA Mode] Invalid pair: "${pair}"`);
          return;
      }

      const experiment = speero_experiments[experimentId];
      if (experiment && typeof experiment[variant] === 'function') {
          console.log(`[Speero QA Mode] Running ${experimentId}, variant ${variant}`);
          experiment[variant](); // fail fast for QA
      } else {
          console.warn(`[Speero QA Mode] No function found for experiment "${experimentId}" and variant "${variant}"`);
      }
  });
}
// Cookie helper
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

// Experiments definition
var speero_experiments = {
};
