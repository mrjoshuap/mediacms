let SITE = null;

export function init(settings) {
  SITE = {
    id: 'media-cms',
    url: '',
    api: '',
    title: '',
    useRoundedCorners: true,
    version: '1.0.0',
    filters: {
      enableViewsRange: false,
      enableLikesRange: false,
      enableEncodingStatus: false,
      enableUntagged: false,
      enableEnhancedDuration: false,
    },
  };

  if (void 0 !== settings) {
    if ('string' === typeof settings.id) {
      SITE.id = settings.id.trim();
    }

    if ('string' === typeof settings.url) {
      SITE.url = settings.url.trim();
    }

    if ('string' === typeof settings.api) {
      SITE.api = settings.api.trim();
    }

    if ('string' === typeof settings.title) {
      SITE.title = settings.title.trim();
    }

    if ('boolean' === typeof settings.useRoundedCorners) {
      SITE.useRoundedCorners = settings.useRoundedCorners;
    }

    if ('string' === typeof settings.version) {
      SITE.version = settings.version.trim();
    }

    if (settings.filters && 'object' === typeof settings.filters) {
      if ('boolean' === typeof settings.filters.enableViewsRange) {
        SITE.filters.enableViewsRange = settings.filters.enableViewsRange;
      }
      if ('boolean' === typeof settings.filters.enableLikesRange) {
        SITE.filters.enableLikesRange = settings.filters.enableLikesRange;
      }
      if ('boolean' === typeof settings.filters.enableEncodingStatus) {
        SITE.filters.enableEncodingStatus = settings.filters.enableEncodingStatus;
      }
      if ('boolean' === typeof settings.filters.enableUntagged) {
        SITE.filters.enableUntagged = settings.filters.enableUntagged;
      }
      if ('boolean' === typeof settings.filters.enableEnhancedDuration) {
        SITE.filters.enableEnhancedDuration = settings.filters.enableEnhancedDuration;
      }
    }
  }
}

export function settings() {
  return SITE;
}
