# Google Analytics Setup Guide

This guide shows you how to add Google Analytics tracking to your MediaCMS installation using the template override method.

## Prerequisites

- Google Analytics account and Measurement ID (format: `G-XXXXXXXXXX` for GA4)
- Access to edit `custom/templates/` directory
- Ability to restart MediaCMS API service

## Method 1: Template Override (Recommended)

This method works for all deployment types and is the most flexible.

### Step 1: Create Tracking Template

1. Create `custom/templates/tracking.html`:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Replace `G-XXXXXXXXXX` with your Google Analytics Measurement ID.

### Step 2: Include in Root Template

1. Create `custom/templates/root.html`:

```django
{% extends "root.html" %}
{% load static %}

{% block head %}
    {{ block.super }}
    {% include "tracking.html" %}
{% endblock %}
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

### Step 4: Verify

1. Visit your MediaCMS site
2. Check Google Analytics Real-Time reports
3. You should see your visit appear within a few seconds

## Method 2: Direct Template Edit

If you prefer to add the code directly to the root template:

1. Create `custom/templates/root.html`:

```django
{% extends "root.html" %}
{% load static %}

{% block head %}
    {{ block.super }}
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    </script>
{% endblock %}
```

2. Restart API service

## Advanced Configuration

### Custom Configuration

Add custom configuration to your tracking code:

```html
<script>
  gtag('config', 'G-XXXXXXXXXX', {
    'page_path': window.location.pathname,
    'page_title': document.title,
    'custom_map': {
      'dimension1': 'user_type',
      'dimension2': 'media_category'
    }
  });
</script>
```

### Enhanced Ecommerce Tracking

For ecommerce tracking (if applicable):

```javascript
gtag('event', 'purchase', {
  'transaction_id': 'T12345',
  'value': 25.42,
  'currency': 'USD',
  'items': [{
    'id': 'SKU123',
    'name': 'Product Name',
    'category': 'Category',
    'quantity': 1,
    'price': 25.42
  }]
});
```

### Custom Event Tracking

Track custom events in your JavaScript:

```javascript
// In custom/static/js/custom.js
function trackMediaView(mediaId, mediaTitle) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'media_view', {
            'event_category': 'Media',
            'event_label': mediaTitle,
            'value': 1
        });
    }
}

// Call when media is viewed
trackMediaView('123', 'Video Title');
```

### User Properties

Set user properties:

```javascript
gtag('set', 'user_properties', {
    'user_type': 'premium',
    'subscription_status': 'active'
});
```

## Universal Analytics (Legacy)

If you're using Universal Analytics (UA) instead of GA4:

```html
<!-- Google Analytics -->
<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-XXXXXXXXX-X', 'auto');
  ga('send', 'pageview');
</script>
```

Replace `UA-XXXXXXXXX-X` with your Universal Analytics tracking ID.

## Cookie Consent Integration

If you're using cookie consent, you may want to conditionally load Google Analytics:

```html
<script>
  function loadGoogleAnalytics() {
    // Only load if consent given
    if (localStorage.getItem('cookieConsent') === 'accepted') {
      // Load Google Analytics code here
      var script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
      document.head.appendChild(script);
      
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    }
  }
  
  // Load on page load if consent already given
  if (localStorage.getItem('cookieConsent') === 'accepted') {
    loadGoogleAnalytics();
  }
</script>
```

## Troubleshooting

### Tracking Not Working

1. **Check Measurement ID**: Ensure your Measurement ID is correct
2. **Check Template Location**: Verify `custom/templates/tracking.html` exists
3. **Check Root Template**: Ensure `custom/templates/root.html` includes tracking
4. **Restart Service**: Always restart API service after changes
5. **Check Browser Console**: Look for JavaScript errors
6. **Use Google Analytics Debugger**: Install browser extension to debug

### Events Not Tracking

1. **Check gtag Function**: Ensure `gtag` function is available
2. **Check Event Syntax**: Verify event tracking code is correct
3. **Check Real-Time Reports**: Use Real-Time reports to verify events
4. **Check Network Tab**: Verify requests are being sent to Google Analytics

## Best Practices

1. **Use GA4**: Google Analytics 4 is the current version (Universal Analytics is deprecated)
2. **Respect Privacy**: Implement cookie consent if required by regulations
3. **Test Thoroughly**: Always test tracking in a staging environment first
4. **Monitor Performance**: Ensure tracking doesn't impact page load times
5. **Document Changes**: Keep notes on what you're tracking and why

## Additional Resources

- [Google Analytics Documentation](https://developers.google.com/analytics)
- [GA4 Setup Guide](https://support.google.com/analytics/answer/9304153)
- [gtag.js Reference](https://developers.google.com/analytics/devguides/collection/gtagjs)
