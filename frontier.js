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
        "status": "draft",
        0: function() {
            console.log('001 CONTROL');
        },
        1: function() {
            console.log('001 VARIANT');
        }
    },
    "002-speero-aa": {
        "status": "draft",
        0: function() {
            console.log('002 CONTROL');
        },
        1: function() {
            console.log('002 VARIANT');
        }
    },
    "005-speero": {
        "status": "live",
        0: function() {
            console.log('005 CONTROL');
        },
        1: function() {
            console.log('005 VARIANT');
            $('<style>')
                .prop('type', 'text/css')
                .html(`
                    div#menu5 {
                        height: auto !important;
                    }
                    .speero-fro5 {
                        margin-left: 8px;
                    }
                    .speero-fro5 span {
                        color: white;
                        font-weight: 700;
                        padding-left: 12px;
                    }
                    .speero-fro5 p {
                        color: white;
                        padding-left: 31px;
                        font-weight: 200;
                        max-width: 700px;
                        font-size: 14px;
                    }
                    @media (max-width: 600px) {
                        .speero-fro5 {
                            margin-left: 0;
                        }
                        .speero-fro5 p {
                            padding-top: 4px;
                            padding-left: 0;
                        }
                    }
                `)
            .appendTo('head');
            jQuery('div#menu5').append('<div class="speero-fro5"><img src="/images/icon-lock.png" id="lock" width="18px" alt="Cell" data-toggle="tooltip" data-placement="right" title="" data-original-title="We use a number of security measures to help protect your personal information."><span>Secure Enrollment:</span><p>We recommend providing your SSN to more accurately verify your identity with no impact to your credit score. Our SSL encryption helps ensure your details remain secure.</p></div>');
        }
    }
};
