import '../_support/setupMediaCMS';
import React, { useEffect } from 'react';
import { renderIntoContainer, act } from '../_support/render';
import { PageStore, SearchFieldStore } from '../../src/static/js/utils/stores/';
import { MembersPage } from '../../src/static/js/pages/MembersPage';
import { TagsPage } from '../../src/static/js/pages/TagsPage';
import { CategoriesPage } from '../../src/static/js/pages/CategoriesPage';
import { LatestMediaPage } from '../../src/static/js/pages/LatestMediaPage';
import { FeaturedMediaPage } from '../../src/static/js/pages/FeaturedMediaPage';
import { RecommendedMediaPage } from '../../src/static/js/pages/RecommendedMediaPage';
import { AnonymousLikedMediaPage, LikedMediaPage } from '../../src/static/js/pages/LikedMediaPage';
import { AnonymousHistoryPage, HistoryPage } from '../../src/static/js/pages/HistoryPage';

jest.mock('../../src/static/js/utils/stores/', () => require('../_support/compD_storeMocks').mockStoresModule());
jest.mock('../../src/static/js/pages/Page', () => ({
    Page: ({ id, children }: { id?: string; children?: React.ReactNode }) => (
        <div className="mock-browse-page" data-page-id={id}>
            {children}
        </div>
    ),
}));

let listResultCount = 1;

jest.mock('../../src/static/js/components/item-list/LazyLoadItemListAsync.jsx', () => ({
    LazyLoadItemListAsync: (props: {
        requestUrl?: string;
        itemsCountCallback?: (n: number) => void;
    }) => {
        useEffect(() => {
            props.itemsCountCallback?.(listResultCount);
        }, []);
        return <div className="mock-browse-list" data-request-url={props.requestUrl} />;
    },
}));
jest.mock('../../src/static/js/components/item-list/LazyLoadItemListAsync', () => ({
    LazyLoadItemListAsync: (props: {
        requestUrl?: string;
        itemsCountCallback?: (n: number) => void;
    }) => {
        useEffect(() => {
            props.itemsCountCallback?.(listResultCount);
        }, []);
        return <div className="mock-browse-list" data-request-url={props.requestUrl} />;
    },
}));

jest.mock('../../src/static/js/utils/hooks/', () => ({
    useUser: jest.fn(() => ({ username: 'john', isAnonymous: false })),
    usePopup: () => [React.createRef(), ({ children }: any) => <div>{children}</div>, ({ children }: any) => children],
}));
jest.mock('../../src/static/js/components/MediaListWrapper', () => ({
    MediaListWrapper: (props: any) => (
        <div className="media-list-wrapper">
            {props.title ? <div className="media-list-header">{props.title}</div> : null}
            {props.children}
            {props.viewAllLink ? <a href={props.viewAllLink}>{props.viewAllText}</a> : null}
        </div>
    ),
}));
jest.mock('../../src/static/js/pages/ProfileLikedPage', () => ({
    ProfileLikedPage: () => <div className="mock-profile-liked-page" />,
}));
jest.mock('../../src/static/js/pages/ProfileHistoryPage', () => ({
    ProfileHistoryPage: () => <div className="mock-profile-history-page" />,
}));

const searchStore = SearchFieldStore as any;
const pageStore = PageStore as any;

describe('pages/Browse pages', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        listResultCount = 1;
        searchStore.__reset({ 'search-query': '' });
        pageStore.__reset({
            'config-options': { pages: { profile: { includeLikedMedia: true, includeHistory: true } } },
            'config-media-item': {
                displayViews: true,
                displayAuthor: true,
                displayPublishDate: true,
            },
        });
    });

    test('MembersPage lists users with default title', () => {
        const { container, unmount } = renderIntoContainer(<MembersPage />);
        expect(container.querySelector('.mock-browse-list')).not.toBeNull();
        expect(container.textContent).toContain('Members');
        unmount();
    });

    test('MembersPage with zero search results shows no-match title', () => {
        listResultCount = 0;
        searchStore.__set('search-query', 'nobody');
        const { container, unmount } = renderIntoContainer(<MembersPage />);
        act(() => {});
        expect(container.textContent).toContain('No members match');
        unmount();
    });

    test('TagsPage and CategoriesPage mount browse lists', () => {
        const tags = renderIntoContainer(<TagsPage />);
        const cats = renderIntoContainer(<CategoriesPage />);
        expect(tags.container.querySelector('.mock-browse-list')).not.toBeNull();
        expect(cats.container.querySelector('.mock-browse-list')).not.toBeNull();
        tags.unmount();
        cats.unmount();
    });

    test('Latest, featured and recommended media pages mount lists', () => {
        for (const Page of [LatestMediaPage, FeaturedMediaPage, RecommendedMediaPage]) {
            const { container, unmount } = renderIntoContainer(<Page />);
            expect(container.querySelector('.mock-browse-list')).not.toBeNull();
            unmount();
        }
    });

    test('Anonymous liked and history pages mount lists', () => {
        const liked = renderIntoContainer(<AnonymousLikedMediaPage />);
        const history = renderIntoContainer(<AnonymousHistoryPage />);
        expect(liked.container.querySelector('.mock-browse-list')).not.toBeNull();
        expect(history.container.querySelector('.mock-browse-list')).not.toBeNull();
        liked.unmount();
        history.unmount();
    });

    test('LikedMediaPage routes to profile page when user is signed in', () => {
        const { useUser } = require('../../src/static/js/utils/hooks/');
        useUser.mockReturnValue({ username: 'john', isAnonymous: false });
        const pageLiked = document.createElement('div');
        pageLiked.id = 'page-liked';
        document.body.appendChild(pageLiked);
        const { container, unmount } = renderIntoContainer(<LikedMediaPage />);
        expect(container.querySelector('.mock-profile-liked-page')).not.toBeNull();
        pageLiked.remove();
        unmount();
    });

    test('HistoryPage routes to anonymous list when profile history is disabled', () => {
        pageStore.__set('config-options', { pages: { profile: { includeHistory: false } } });
        const { container, unmount } = renderIntoContainer(<HistoryPage />);
        expect(container.querySelector('.mock-browse-list')).not.toBeNull();
        unmount();
    });
});