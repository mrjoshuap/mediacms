/**
 * Manage media page bundle.
 * Django template: templates/cms/manage_media.html → static/js/manage-media.js
 */
import { renderPage } from '../static/js/utils/renderer';
import { ManageMediaPage } from '../static/js/pages/ManageMediaPage';

renderPage('page-manage-media', ManageMediaPage);
