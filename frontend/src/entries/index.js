/**
 * Home page bundle.
 * Django template: templates/cms/index.html → static/js/index.js
 */
import { renderPage } from '../static/js/utils/renderer';
import { HomePage } from '../static/js/pages/HomePage';

renderPage('page-home', HomePage);
