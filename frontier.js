// Updated: 2025-05-07 13:40 by Silver
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
    "001-speero-aa": {
        "status": "live",
        0: function() {
            console.log('001 CONTROL');
        },
        1: function() {
            console.log('001 VARIANT');
        }
    },
    "002-speero-home-page": {
        "status": "draft",
        0: function() {
            console.log('002 CONTROL');
        },
        1: function() {
            console.log('002 VARIANT');
        }
    }
};
