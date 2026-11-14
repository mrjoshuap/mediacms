import '../_support/setupMediaCMS';
import React, { useEffect } from 'react';
import { renderIntoContainer, act } from '../_support/render';
import { HomePage } from '../../src/static/js/pages/HomePage';
import { PageStore } from '../../src/static/js/utils/stores/';

jest.mock('../../src/static/js/utils/stores/', () => require('../_support/compD_storeMocks').mockStoresModule());
jest.mock('../../src/static/js/pages/Page', () => ({
    Page: ({ id, children }: { id?: string; children?: React.ReactNode }) => (
        <div className="mock-page" data-page-id={id}>
            {children}
        </div>
    ),
}));

let latestCount = 0;
let featuredCount = 0;
let recommendedCount = 0;

jest.mock('../../src/static/js/components/item-list/ItemListAsync.jsx', () => ({
    ItemListAsync: (props: { itemsCountCallback?: (n: number) => void; requestUrl?: string }) => {
        useEffect(() => {
            props.itemsCountCallback?.(latestCount);
        }, []);
        return <div className="mock-latest-list" data-url={props.requestUrl} />;
    },
}));

jest.mock('../../src/static/js/components/item-list/InlineSliderItemListAsync.jsx', () => ({
    InlineSliderItemListAsync: (props: {
        itemsCountCallback?: (n: number) => void;
        requestUrl?: string;
    }) => {
        useEffect(() => {
            const count = String(props.requestUrl || '').includes('recommended') ? recommendedCount : featuredCount;
            props.itemsCountCallback?.(count);
        }, []);
        return <div className="mock-slider-list" data-url={props.requestUrl} />;
    },
}));

const pageStore = PageStore as any;

const homePageProps = {
    latest_title: 'Latest',
    featured_title: 'Featured',
    recommended_title: 'Recommended',
    latest_view_all_link: false,
    featured_view_all_link: true,
    recommended_view_all_link: true,
};

function resetPageStore(overrides: Record<string, unknown> = {}) {
    pageStore.__reset({
        'config-enabled': {
            pages: {
                featured: { enabled: true },
                recommended: { enabled: true },
            },
        },
        'config-media-item': {
            displayViews: true,
            displayAuthor: true,
            displayPublishDate: true,
        },
        ...overrides,
    });
}

function rowStyleForTitle(container: HTMLElement, title: string) {
    const headers = Array.from(container.querySelectorAll('.media-list-header h2, .media-list-header h3'));
    const header = headers.find((el) => el.textContent === title);
    return header?.closest('.media-list-row')?.getAttribute('style') ?? null;
}

describe('pages/HomePage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        latestCount = 0;
        featuredCount = 0;
        recommendedCount = 0;
        resetPageStore();
    });

    test('Hides featured and recommended sections when disabled in PageStore', () => {
        resetPageStore({
            'config-enabled': {
                pages: {
                    featured: { enabled: false },
                    recommended: { enabled: false },
                },
            },
        });
        const { container, unmount } = renderIntoContainer(<HomePage {...homePageProps} />);
        expect(container.querySelector('.mock-slider-list')).toBeNull();
        expect(container.querySelector('.mock-latest-list')).not.toBeNull();
        unmount();
    });

    test('Shows empty welcome CTA when latest list reports zero items', () => {
        latestCount = 0;
        const { container, unmount } = renderIntoContainer(<HomePage {...homePageProps} />);
        act(() => {});
        expect(container.querySelector('.empty-media')).not.toBeNull();
        expect(container.querySelector('.empty-media .welcome-title')?.textContent).toContain('Welcome');
        unmount();
    });

    test('Shows latest section and hides empty CTA when latest has items', () => {
        latestCount = 3;
        const { container, unmount } = renderIntoContainer(<HomePage {...homePageProps} />);
        act(() => {});
        expect(container.querySelector('.empty-media')).toBeNull();
        expect(rowStyleForTitle(container, 'Latest')).not.toBe('display: none;');
        unmount();
    });

    test('Reveals featured and recommended rows when sliders report items', () => {
        featuredCount = 2;
        recommendedCount = 4;
        latestCount = 1;
        const { container, unmount } = renderIntoContainer(<HomePage {...homePageProps} />);
        act(() => {});
        expect(container.querySelectorAll('.mock-slider-list')).toHaveLength(2);
        expect(rowStyleForTitle(container, 'Featured')).not.toBe('display: none;');
        expect(rowStyleForTitle(container, 'Recommended')).not.toBe('display: none;');
        unmount();
    });
});