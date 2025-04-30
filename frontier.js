(async () => {
    // Load the GrowthBook script
    const script = document.createElement('script');
    script.src = "https://unpkg.com/@growthbook/growthbook/dist/bundles/index.min.js";
    //script.src = "https://unpkg.com/@growthbook/growthbook/dist/bundles/all.min.js";
    script.async = true;
    document.head.appendChild(script);
  
    script.onload = async () => {
      const gb = new growthbook.GrowthBook({
        apiHost: "https://cdn.growthbook.io",
        clientKey: "sdk-vYJcsPIxtz9YGEiJ",
        enableDevMode: true,
        trackingCallback: (experiment, result) => {
          console.log("Viewed Experiment", experiment.key, "Variation", result.variationId);
          window.dataLayer.push({
            'event': 'gb_experiment_impression',
            'gb_experiment': experiment.key,
            'gb_variant': result.variationId
          })
        }
      });
  
      // ✅ Use the autoAttributesPlugin
      //gb.use(growthbook.plugins.autoAttributesPlugin());
  
      //Load attributes and features
      gb.setAttributes({
        id: getGbAnonId()
      });
      gb.setAttributes(getGbAttributes());

      await gb.init();
  
      //gb.loadFeatures();
  
      const result = gb.evalFeature("001-speero-aa");
      console.log("Result", result);
      if (result.value) {
        document.body.classList.add("variant-home-redesign");
      }

      result2 = gb.getFeatureValue("001-speero-aa");
      console.log("Result2", result2);

    };

    

    // Get or create a persistent anonymous ID for GrowthBook
    function getGbAnonId() {
        const cookieName = "gb_anon_id";
        const existing = document.cookie.split("; ").find(row => row.startsWith(cookieName + "="));
        if (existing) {
        return existing.split("=")[1];
        }
    
        // Generate a new anonymous ID
        const anonId = 'gb_' + (crypto.randomUUID?.() || Math.random().toString(36).substring(2) + Date.now());
    
        // Set cookie across main domain and subdomains
        document.cookie = `${cookieName}=${anonId}; path=/; domain=${getRootDomain()}; max-age=31536000; SameSite=Lax`;
    
        return anonId;
    }
    
    // Helper to get root domain (e.g. from sub.domain.example.com -> example.com)
    function getRootDomain() {
        const parts = location.hostname.split('.');
        if (parts.length >= 2) {
        return parts.slice(-2).join('.');
        }
        return location.hostname;
    }

    function getGbAttributes() {
        return {
          gb_anon_id: getGbAnonId(),
          url: location.href,
          path: location.pathname,
          hostname: location.hostname,
          language: navigator.language || '',
          userAgent: navigator.userAgent || '',
          referrer: document.referrer || '',
          title: document.title || '',
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          deviceId: getGbDeviceId(),
          deviceType: getDeviceType()
        };
      }
      
      // Persistent anonymous ID in cookies (across subdomains)
      function getGbAnonId() {
        const cookieName = "gb_anon_id";
        const existing = document.cookie.split("; ").find(row => row.startsWith(cookieName + "="));
        if (existing) {
          return existing.split("=")[1];
        }
      
        const anonId = 'gb_' + (crypto.randomUUID?.() || Math.random().toString(36).substring(2) + Date.now());
        document.cookie = `${cookieName}=${anonId}; path=/; domain=${getRootDomain()}; max-age=31536000; SameSite=Lax`;
      
        return anonId;
      }
      
      // Persistent device ID in localStorage
      function getGbDeviceId() {
        const key = "gb_device_id";
        let id = localStorage.getItem(key);
        if (!id) {
          id = 'gbd_' + (crypto.randomUUID?.() || Math.random().toString(36).substring(2) + Date.now());
          localStorage.setItem(key, id);
        }
        return id;
      }
      
      // Helper to get root domain (for cross-subdomain cookie)
      function getRootDomain() {
        const parts = location.hostname.split('.');
        if (parts.length >= 2) {
          return parts.slice(-2).join('.');
        }
        return location.hostname;
      }
      
      // Detect device type (mobile / tablet / desktop)
      function getDeviceType() {
        const ua = navigator.userAgent;
        if (/Mobi|Android/i.test(ua)) {
          return "mobile";
        }
        if (/Tablet|iPad/i.test(ua)) {
          return "tablet";
        }
        return "desktop";
      }
  })();
