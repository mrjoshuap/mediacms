/**
 * Media detail page bundle.
 * Django template: templates/cms/media.html → static/js/media.js
 */
import { renderPage } from '../static/js/utils/renderer';
import { MediaPage } from '../static/js/pages/MediaPage';

renderPage('page-media', MediaPage);
