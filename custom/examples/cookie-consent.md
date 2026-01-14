# Cookie Consent Implementation Guide

This guide shows you how to add a cookie consent banner to your MediaCMS installation to comply with privacy regulations (GDPR, CCPA, etc.).

## Prerequisites

- Access to edit `custom/templates/components/header.html`
- Understanding of your privacy requirements
- Ability to restart MediaCMS API service

## Method 1: Website Policies Cookie Consent (Simple)

This is a simple, ready-to-use solution.

### Step 1: Override Header Component

1. Create the directory if it doesn't exist:
   ```bash
   mkdir -p custom/templates/components
   ```

2. Copy the header template:
   ```bash
   cp templates/components/header.html custom/templates/components/header.html
   ```

3. Edit `custom/templates/components/header.html` and uncomment/add the cookie consent code:

```django
<div id="app-header"></div>

<!-- Cookie Consent -->
<script src="https://cdn.websitepolicies.io/lib/cookieconsent/cookieconsent.min.js" defer></script>
<script>
    window.addEventListener("load", function () {
        window.wpcc.init({
            border: "normal",
            corners: "normal",
            colors: { 
                popup: { background: "#222222", text: "#ffffff", border: "#FF8000" }, 
                button: { background: "#FF8000", text: "#000000" } 
            },
            position: "top-right",
            content: { 
                message: "Hi there, we are using cookies on this website. We don't use tracking or analytics here, just the essentials for the Website to work.\n", 
                button: "Understood! Yum!", 
                link: "Click here to learn more." 
            },
        });
    });
</script>
```

### Step 2: Customize

Customize the colors, position, and message to match your brand:

```django
window.wpcc.init({
    border: "normal",           // "normal" or "thin"
    corners: "normal",          // "normal" or "round"
    colors: { 
        popup: { 
            background: "#your-color", 
            text: "#your-color", 
            border: "#your-color" 
        }, 
        button: { 
            background: "#your-color", 
            text: "#your-color" 
        } 
    },
    position: "top-right",      // "top", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"
    content: { 
        message: "Your custom message here.", 
        button: "Accept", 
        link: "Privacy Policy" 
    },
});
```

### Step 3: Restart API Service

**Docker:**
```bash
docker compose restart api
```

**Single-server:**
```bash
sudo systemctl restart mediacms-api
```

## Method 2: Custom Cookie Consent Implementation

For more control, implement your own cookie consent solution.

### Step 1: Create Custom Cookie Consent

Edit `custom/templates/components/header.html`:

```django
<div id="app-header"></div>

<!-- Custom Cookie Consent Banner -->
<div id="cookie-consent-banner" style="display: none; position: fixed; bottom: 0; left: 0; right: 0; background: #333; color: #fff; padding: 1rem; z-index: 10000; box-shadow: 0 -2px 10px rgba(0,0,0,0.2);">
    <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div style="flex: 1; min-width: 250px;">
            <p style="margin: 0; line-height: 1.5;">
                We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
                <a href="/privacy-policy" style="color: #4CAF50; text-decoration: underline;">Learn more</a>
            </p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
            <button onclick="acceptCookies()" style="padding: 0.5rem 1.5rem; background: #4CAF50; color: white; border: none; cursor: pointer; border-radius: 4px; font-weight: bold;">
                Accept
            </button>
            <button onclick="declineCookies()" style="padding: 0.5rem 1.5rem; background: #f44336; color: white; border: none; cursor: pointer; border-radius: 4px; font-weight: bold;">
                Decline
            </button>
        </div>
    </div>
</div>

<script>
function acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    document.getElementById('cookie-consent-banner').style.display = 'none';
    
    // Enable analytics if Google Analytics is loaded
    if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
            'analytics_storage': 'granted'
        });
    }
    
    // Trigger custom event
    document.dispatchEvent(new CustomEvent('cookieConsentAccepted'));
}

function declineCookies() {
    localStorage.setItem('cookieConsent', 'declined');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    document.getElementById('cookie-consent-banner').style.display = 'none';
    
    // Disable analytics if Google Analytics is loaded
    if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
            'analytics_storage': 'denied'
        });
    }
    
    // Trigger custom event
    document.dispatchEvent(new CustomEvent('cookieConsentDeclined'));
}

// Check if consent already given
(function() {
    const consent = localStorage.getItem('cookieConsent');
    const consentDate = localStorage.getItem('cookieConsentDate');
    
    // Show banner if no consent or consent is older than 1 year
    if (!consent) {
        document.getElementById('cookie-consent-banner').style.display = 'block';
    } else if (consentDate) {
        const date = new Date(consentDate);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        if (date < oneYearAgo) {
            // Consent expired, show banner again
            localStorage.removeItem('cookieConsent');
            localStorage.removeItem('cookieConsentDate');
            document.getElementById('cookie-consent-banner').style.display = 'block';
        }
    }
})();
</script>
```

### Step 2: Add CSS (Optional)

For better styling, add CSS to `custom/static/css/custom.css`:

```css
#cookie-consent-banner {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
    }
    to {
        transform: translateY(0);
    }
}

#cookie-consent-banner button {
    transition: background-color 0.2s ease;
}

#cookie-consent-banner button:hover {
    opacity: 0.9;
}
```

### Step 3: Restart API Service

Restart the API service as shown in Method 1.

## Method 3: Cookie Consent with Google Analytics Integration

Integrate cookie consent with Google Analytics to respect user choices.

### Implementation

1. Create `custom/templates/components/header.html` with cookie consent
2. Create `custom/templates/tracking.html` with conditional Google Analytics:

```html
<script>
  // Initialize Google Analytics with consent mode
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  
  // Set default consent to denied
  gtag('consent', 'default', {
    'analytics_storage': 'denied'
  });
  
  // Load Google Analytics script
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
  document.head.appendChild(script);
  
  // Configure after script loads
  script.onload = function() {
    gtag('config', 'G-XXXXXXXXXX');
  };
</script>
```

3. Update cookie consent functions to update Google Analytics consent:

```javascript
function acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    document.getElementById('cookie-consent-banner').style.display = 'none';
    
    // Update Google Analytics consent
    if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
            'analytics_storage': 'granted'
        });
    }
}
```

## Styling Options

### Minimal Banner

```css
#cookie-consent-banner {
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
    border-top: 2px solid #4CAF50;
}
```

### Rounded Corners

```css
#cookie-consent-banner {
    border-radius: 8px 8px 0 0;
}
```

### Slide Animation

```css
#cookie-consent-banner {
    animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}
```

## Best Practices

1. **Clear Messaging**: Explain what cookies are used for
2. **Easy to Understand**: Use simple language
3. **Easy to Dismiss**: Make accept/decline buttons prominent
4. **Persistent Choice**: Remember user's choice
5. **Respect Choice**: Only load tracking scripts if consent given
6. **Privacy Policy Link**: Always link to your privacy policy
7. **Compliance**: Ensure compliance with GDPR, CCPA, etc.

## Compliance Considerations

### GDPR (EU)

- Must obtain explicit consent before setting non-essential cookies
- Must provide clear information about cookie usage
- Must allow users to withdraw consent
- Must document consent

### CCPA (California)

- Must disclose cookie usage
- Must provide opt-out mechanism
- Must honor opt-out requests

### Other Regulations

- Check local regulations in your jurisdiction
- Consult with legal counsel if unsure

## Testing

1. **Clear localStorage**: Test banner appears on first visit
2. **Accept Cookies**: Verify consent is stored
3. **Decline Cookies**: Verify tracking is disabled
4. **Refresh Page**: Verify banner doesn't reappear after consent
5. **Expired Consent**: Test banner reappears after expiration
6. **Mobile**: Test on mobile devices
7. **Different Browsers**: Test across browsers

## Troubleshooting

### Banner Not Appearing

1. Check template location: `custom/templates/components/header.html`
2. Check JavaScript console for errors
3. Verify localStorage is enabled
4. Clear browser cache

### Consent Not Persisting

1. Check localStorage is enabled
2. Verify consent is being saved correctly
3. Check for JavaScript errors

### Analytics Still Loading After Decline

1. Verify Google Analytics consent mode is configured
2. Check that consent update is called
3. Verify tracking script respects consent

## Additional Resources

- [GDPR Cookie Consent Guide](https://gdpr.eu/cookies/)
- [CCPA Compliance Guide](https://oag.ca.gov/privacy/ccpa)
- [Cookie Consent Best Practices](https://www.cookiepro.com/knowledge/what-is-cookie-consent/)
