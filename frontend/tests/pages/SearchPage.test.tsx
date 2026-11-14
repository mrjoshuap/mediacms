import '../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer } from '../_support/render';
import { PageStore, SearchFieldStore } from '../../src/static/js/utils/stores/';
import { SearchPage } from '../../src/static/js/pages/SearchPage';

jest.mock('../../src/static/js/utils/stores/', () => require('../_support/compD_storeMocks').mockStoresModule());
jest.mock('../../src/static/js/utils/helpers/', () => {
    const actual = jest.requireActual('../../src/static/js/utils/helpers/');
    return {
        ...actual,
        getRequest: jest.fn(),
        inEmbeddedApp: () => false,
    };
});
jest.mock('../../src/static/js/components/item-list/LazyLoadItemListAsync', () => ({
    LazyLoadItemListAsync: (props: { requestUrl?: string }) => (
        <div className="mock-search-list" data-request-url={props.requestUrl} />
    ),
}));
jest.mock('../../src/static/js/components/search-filters/SearchMediaFiltersRow', () => ({
    SearchMediaFiltersRow: () => <div className="mock-search-filters-row" />,
}));
jest.mock('../../src/static/js/components/search-filters/SearchResultsFilters', () => ({
    SearchResultsFilters: () => <div className="mock-search-results-filters" />,
}));
jest.mock('../../src/static/js/components/_shared/', () => ({
    FiltersToggleButton: () => <button type="button" className="mock-filters-toggle" />,
    MaterialIcon: () => <i className="material-icons" />,
}));
jest.mock('../../src/static/js/pages/_Page', () => {
    const ReactActual = require('react');
    return {
        Page: class Page extends ReactActual.Component {
            render() {
                return ReactActual.createElement('div', { className: 'mock-search-page' }, this.pageContent());
            }
        },
    };
});

const pageStore = PageStore as any;
const searchStore = SearchFieldStore as any;

describe('pages/SearchPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        pageStore.__reset({
            'config-options': { pages: { search: { advancedFilters: false } } },
            'config-media-item': {
                displayViews: true,
                displayAuthor: true,
                displayPublishDate: true,
            },
        });
        searchStore.__reset({
            'search-query': '',
            'search-categories': '',
            'search-tags': '',
            'search-media-type': '',
            'search-upload-date': '',
            'search-author': '',
        });
    });

    test('Invalid query renders no list and no results title', () => {
        const { container, unmount } = renderIntoContainer(React.createElement(SearchPage));
        expect(container.querySelector('.mock-search-list')).toBeNull();
        const titleEl = container.querySelector('.media-list-header');
        expect(titleEl).toBeNull();
        unmount();
    });

    test('Valid search query shows list with built request URL', () => {
        searchStore.__reset({
            'search-query': 'cats',
            'search-categories': '',
            'search-tags': '',
            'search-media-type': '',
            'search-upload-date': '',
            'search-author': '',
        });
        const { container, unmount } = renderIntoContainer(React.createElement(SearchPage));
        const list = container.querySelector('.mock-search-list') as HTMLElement;
        expect(list).not.toBeNull();
        expect(list.getAttribute('data-request-url')).toContain('cats');
        unmount();
    });
});