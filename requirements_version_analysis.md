# Requirements.txt Version Analysis

**Analysis Date:** January 13, 2026

This document compares the current package versions in `requirements.txt` with the latest available versions on PyPI.

## Summary

- **Total Packages:** 25
- **Up to Date:** 3 packages
- **Minor Updates Available:** 8 packages
- **Major Updates Available:** 14 packages
- **Security Concerns:** 1 package (sentry-sdk has known vulnerabilities)

## Detailed Version Comparison

### 🔴 Major Updates Available

| Package | Current Version | Latest Version | Status |
|---------|----------------|----------------|--------|
| **Django** | 5.2.6 | **5.2.7** | Minor patch update available |
| **psycopg[binary,pool]** | 3.2.4 | **3.3.2** | Update recommended (Dec 2025) |
| **celery** | 5.4.0 | **5.6.0** | Major update available (Nov 2025) |
| **Pillow** | 11.1.0 | **12.1.0** | Major version jump (Jan 2026) |
| **django-allauth** | 65.4.1 | **65.13.1** | Multiple minor updates (Nov 2025) |
| **django-redis** | 5.4.0 | **6.0.0** | Major version update (Jun 2025) |
| **django-imagekit** | 5.0.0 | **6.0.0** | Major version update (Oct 2025) |
| **django-filter** | 24.3 | **25.2** | CalVer update (Oct 2025) |
| **sentry-sdk[django]** | 2.23.1 | **2.49.0** | ⚠️ **Security vulnerabilities** - Update critical (Jan 2026) |
| **django-tinymce** | 4.1.0 | **5.0.0** | Major version update (Oct 2025) |
| **markdown** | 3.7 | **3.10** | Multiple minor updates (Nov 2025) |
| **django-mptt** | 0.16.0 | **0.18.0** | ⚠️ Package unmaintained (Aug 2025) |
| **crispy-bootstrap5** | 2024.10 | **2025.6** | CalVer update (Jun 2025) |
| **django-debug-toolbar** | 5.0.1 | **6.1.0** | Major version update (Oct 2025) |

### 🟡 Minor Updates Available

| Package | Current Version | Latest Version | Status |
|---------|----------------|----------------|--------|
| **djangorestframework** | 3.16.1 | **3.16.1** | ✅ Up to date |
| **python3-saml** | 1.16.0 | **1.16.1** | Minor patch update (Apr 2024) |
| **requests** | 2.32.3 | **2.32.5** | Bug fix update (Aug 2025) |
| **pre-commit** | 4.1.0 | **4.5.1** | Minor updates (Dec 2025) |

### ✅ Up to Date

| Package | Current Version | Latest Version | Status |
|---------|----------------|----------------|--------|
| **gunicorn** | 23.0.0 | **23.0.0** | ✅ Up to date |
| **django-jazzmin** | 3.0.1 | **3.0.1** | ✅ Up to date |
| **pysubs2** | 1.8.0 | **1.8.0** | ✅ Up to date |
| **m3u8** | 6.0.0 | **6.0.0** | ✅ Up to date (unmaintained) |
| **filetype** | 1.2.0 | **1.2.0** | ✅ Up to date |

### ⚠️ Packages Requiring Attention

#### 1. **sentry-sdk[django]** - Security Vulnerabilities
- **Current:** 2.23.1
- **Latest:** 2.49.0
- **Issue:** Known vulnerabilities (CVE-2023-29374, CVE-2022-33891, CVE-2024-52581, CVE-2024-39689)
- **Action:** **URGENT** - Update to latest version immediately

#### 2. **django-mptt** - Unmaintained Package
- **Current:** 0.16.0
- **Latest:** 0.18.0
- **Issue:** Project is unmaintained
- **Recommendation:** Consider migrating to `django-treebeard` (latest: 4.8.0, Dec 2025)

#### 3. **django-celery-email-reboot** - Already Using Recommended Package
- **Current:** 4.2.0
- **Status:** ✅ Using the maintained fork (django-celery-email-reboot) instead of unmaintained django-celery-email
- **Note:** Migration from django-celery-email has already been completed

#### 4. **drf-yasg** - Version Mismatch
- **Current:** 1.21.8
- **Latest:** 1.20.0 (according to search results)
- **Note:** Your version appears newer than what was found. Please verify on PyPI.

## Recommended Update Priority

### 🔴 Critical (Update Immediately)
1. **sentry-sdk[django]** - Security vulnerabilities

### 🟠 High Priority (Update Soon)
2. **Pillow** - Major version update with likely security fixes
3. **django-redis** - Major version update (5.4.0 → 6.0.0)
4. **django-imagekit** - Major version update (5.0.0 → 6.0.0)
5. **django-tinymce** - Major version update (4.1.0 → 5.0.0)
6. **django-debug-toolbar** - Major version update (5.0.1 → 6.1.0)

### 🟡 Medium Priority (Update When Convenient)
7. **celery** - Major update (5.4.0 → 5.6.0)
8. **Django** - Minor patch (5.2.6 → 5.2.7)
9. **psycopg** - Minor update (3.2.4 → 3.3.2)
10. **django-allauth** - Multiple minor updates
11. **django-filter** - CalVer update
12. **markdown** - Multiple minor updates
13. **crispy-bootstrap5** - CalVer update

### 🟢 Low Priority (Optional)
14. **python3-saml** - Minor patch
15. **requests** - Bug fix update
16. **pre-commit** - Minor updates

## Migration Considerations

### Packages Requiring Migration Planning

1. **django-mptt → django-treebeard**
   - Requires code changes
   - django-treebeard is actively maintained
   - Latest version: 4.8.0 (Dec 2025)

2. **django-celery-email-reboot** (already in use)
   - Drop-in replacement fork of django-celery-email
   - Current version: 4.2.0
   - Supports Django 4.0-5.3, Celery 5.2-5.7
   - Migration from django-celery-email has already been completed

## Testing Recommendations

Before updating, ensure you:
1. Review changelogs for breaking changes (especially major version updates)
2. Test in a development environment first
3. Check Django compatibility (some packages may require Django version updates)
4. Verify Celery compatibility (if using celery)
5. Run your test suite after updates

## Notes

- Some packages use CalVer (Calendar Versioning) where the version number includes the year
- Always check package changelogs for breaking changes before major version updates
- Consider using `pip list --outdated` to verify versions locally
- Some packages may have compatibility requirements with Django/Celery versions
