/**
 * Content migration list page bundle.
 * Django template: templates/cms/migrations.html → static/js/migrations.js
 */
import { renderPage } from '../static/js/utils/renderer';
import { MigrationsPage } from '../static/js/pages/MigrationsPage';

renderPage('page-migrations', MigrationsPage);
