# Template Override Examples

This guide provides examples of common template overrides in MediaCMS.

## How Template Overrides Work

Templates in `custom/templates/` automatically override templates in `templates/` with the same path. The directory structure must match exactly.

**Example:**
- Override `templates/root.html` → Create `custom/templates/root.html`
- Override `templates/components/header.html` → Create `custom/templates/components/header.html`

## Example 1: Override Root Template

Override the root template to add custom elements.

### Step 1: Copy Template

```bash
cp templates/root.html custom/templates/root.html
```

### Step 2: Edit Template

```django
{% extends "root.html" %}
{% load static %}

{% block head %}
    {{ block.super }}
    <!-- Add custom meta tags -->
    <meta name="custom-meta" content="value">
    
    <!-- Add Google Analytics -->
    {% include "tracking.html" %}
    
    <!-- Add custom CSS -->
    <link rel="stylesheet" href="/custom/static/css/additional.css">
{% endblock %}

{% block bottomimports %}
    {{ block.super }}
    <!-- Add custom JavaScript -->
    <script src="/custom/static/js/additional.js"></script>
{% endblock %}
```

### Step 3: Restart API Service

```bash
# Docker
docker compose restart api

# Single-server
sudo systemctl restart mediacms-api
```

## Example 2: Override Header Component

Override the header to add cookie consent or custom elements.

### Step 1: Create Directory and Copy

```bash
mkdir -p custom/templates/components
cp templates/components/header.html custom/templates/components/header.html
```

### Step 2: Edit Template

```django
<div id="app-header"></div>

<!-- Add cookie consent -->
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
                message: "We use cookies to enhance your experience.", 
                button: "Accept", 
                link: "Learn more" 
            },
        });
    });
</script>

<!-- Add custom header content -->
<div class="custom-header-banner">
    <p>Welcome to our portal!</p>
</div>
```

### Step 3: Restart API Service

Restart as shown in Example 1.

## Example 3: Create New Template (Tracking)

Create a new template for Google Analytics tracking.

### Step 1: Create Template

```bash
touch custom/templates/tracking.html
```

### Step 2: Add Content

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

### Step 3: Include in Root Template

Edit `custom/templates/root.html`:

```django
{% extends "root.html" %}
{% load static %}

{% block head %}
    {{ block.super }}
    {% include "tracking.html" %}
{% endblock %}
```

## Example 4: Override Footer Component

Override the footer to add custom content.

### Step 1: Copy Template

```bash
mkdir -p custom/templates/components
cp templates/components/footer.html custom/templates/components/footer.html
```

### Step 2: Edit Template

```django
<footer class="custom-footer">
    <div class="footer-content">
        <p>&copy; 2024 Your Company. All rights reserved.</p>
        <nav>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/contact">Contact</a>
        </nav>
    </div>
</footer>
```

## Example 5: Extend Base Template

Extend a base template while maintaining compatibility.

### Template Structure

```django
{% extends "base.html" %}
{% load static %}

{% block content %}
    {{ block.super }}
    <!-- Add custom content after default content -->
    <div class="custom-section">
        <h2>Custom Section</h2>
        <p>This is custom content added to the page.</p>
    </div>
{% endblock %}
```

## Example 6: Conditional Content

Add conditional content based on settings or user status.

### Example Template

```django
{% extends "root.html" %}
{% load static %}

{% block head %}
    {{ block.super }}
    
    {% if user.is_authenticated %}
        <!-- Show for authenticated users -->
        <meta name="user-type" content="authenticated">
    {% else %}
        <!-- Show for anonymous users -->
        <meta name="user-type" content="anonymous">
    {% endif %}
    
    {% if PORTAL_NAME %}
        <meta property="og:site_name" content="{{ PORTAL_NAME }}">
    {% endif %}
{% endblock %}
```

## Example 7: Add Custom Blocks

Add custom blocks that can be overridden in child templates.

### Parent Template

```django
{% extends "root.html" %}
{% load static %}

{% block customhead %}
    <!-- Custom head content -->
{% endblock %}

{% block customfooter %}
    <!-- Custom footer content -->
{% endblock %}
```

### Child Template

```django
{% extends "custom/root.html" %}

{% block customhead %}
    {{ block.super }}
    <!-- Additional custom head content -->
{% endblock %}
```

## Example 8: Include Partial Templates

Create reusable partial templates.

### Create Partial

```bash
mkdir -p custom/templates/partials
touch custom/templates/partials/social-links.html
```

### Partial Content

```html
<div class="social-links">
    <a href="https://twitter.com/yourhandle" target="_blank">Twitter</a>
    <a href="https://facebook.com/yourpage" target="_blank">Facebook</a>
    <a href="https://linkedin.com/company/yourcompany" target="_blank">LinkedIn</a>
</div>
```

### Include in Template

```django
{% extends "root.html" %}

{% block aftercontent %}
    {{ block.super }}
    {% include "partials/social-links.html" %}
{% endblock %}
```

## Best Practices

### 1. Always Extend When Possible

```django
{% extends "root.html" %}
```

This maintains compatibility with MediaCMS updates.

### 2. Use block.super

```django
{% block head %}
    {{ block.super }}
    <!-- Your custom content -->
{% endblock %}
```

This preserves the original content.

### 3. Keep Directory Structure

Maintain the same directory structure as `templates/`:

```
templates/
├── root.html
├── components/
│   └── header.html
└── partials/
    └── social-links.html

custom/templates/
├── root.html
├── components/
│   └── header.html
└── partials/
    └── social-links.html
```

### 4. Document Your Changes

Add comments to explain your customizations:

```django
{# 
  Custom override: Added Google Analytics tracking
  Date: 2024-01-01
  Reason: Track user behavior for analytics
#}
```

### 5. Test After Updates

After MediaCMS updates, verify your template overrides still work correctly.

## Common Override Locations

### Frequently Overridden Templates

- `root.html` - Main page template
- `components/header.html` - Header component
- `components/footer.html` - Footer component
- `base.html` - Base template (if exists)

### Template Blocks

Common blocks you can override:

- `head` - Head section
- `headtitle` - Page title
- `headermeta` - Meta tags
- `externallinks` - External links
- `topimports` - Top scripts/styles
- `beforecontent` - Before main content
- `content` - Main content
- `aftercontent` - After main content
- `externalscripts` - External scripts
- `bottomimports` - Bottom scripts

## Troubleshooting

### Override Not Working

1. **Check Path**: Ensure template is in correct location
2. **Check Structure**: Directory structure must match exactly
3. **Check Syntax**: Verify Django template syntax is correct
4. **Restart Service**: Always restart API service after changes
5. **Check Logs**: Review API logs for template errors

### Template Errors

1. **Check Syntax**: Verify all tags are closed properly
2. **Check Extends**: Ensure parent template exists
3. **Check Includes**: Verify included templates exist
4. **Check Variables**: Ensure variables are available in context

### Changes Not Appearing

1. **Clear Cache**: Clear browser cache
2. **Restart Service**: Restart API service
3. **Check File**: Verify file was saved correctly
4. **Check Permissions**: Ensure file is readable

## Additional Resources

- [Django Template Documentation](https://docs.djangoproject.com/en/stable/topics/templates/)
- [Template Inheritance](https://docs.djangoproject.com/en/stable/ref/templates/language/#template-inheritance)
- [Custom Directory README](../README.md)
- [Customizations Guide](../../docs/administration/configuration/customizations.md)
