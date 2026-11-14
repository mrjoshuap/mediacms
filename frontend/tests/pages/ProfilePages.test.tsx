import '../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer } from '../_support/render';
import { installMediaCMSGlobal } from '../_support/mediacmsGlobal';
import { PageStore, ProfilePageStore } from '../../src/static/js/utils/stores/';
import { ProfileMediaPage } from '../../src/static/js/pages/ProfileMediaPage';
import { ProfileAboutPage } from '../../src/static/js/pages/ProfileAboutPage';

jest.mock('../../src/static/js/utils/stores/', () => require('../_support/compD_storeMocks').mockStoresModule());
jest.mock('../../src/static/js/utils/actions/', () => require('../_support/compD_storeMocks').mockActionsModule());
jest.mock('../../src/static/js/utils/hoc/withBulkActions', () => {
    const ReactActual = require('react');
  return {
        withBulkActions: (Wrapped: React.ComponentType<any>) => {
            const bulkActions = {
                selectedMedia: new Set<string>(),
                availableMediaIds: ['m1', 'm2'],
                listKey: 0,
                hasContributorCourses: false,
                getCsrfToken: () => 'csrf',
                handleBulkAction: jest.fn(),
                handleSelectAll: jest.fn(),
                handleDeselectAll: jest.fn(),
                handleMediaSelection: jest.fn(),
                handleItemsUpdate: jest.fn(),
                handleConfirmCancel: jest.fn(),
                handleConfirmProceed: jest.fn(),
                handlePermissionModalCancel: jest.fn(),
                handlePermissionModalSuccess: jest.fn(),
                handlePermissionModalError: jest.fn(),
                handlePlaylistModalCancel: jest.fn(),
                handlePlaylistModalSuccess: jest.fn(),
                handlePlaylistModalError: jest.fn(),
                handleChangeOwnerModalCancel: jest.fn(),
                handleChangeOwnerModalSuccess: jest.fn(),
                handleChangeOwnerModalError: jest.fn(),
                handlePublishStateModalCancel: jest.fn(),
                handlePublishStateModalSuccess: jest.fn(),
                handlePublishStateModalError: jest.fn(),
                handleCategoryModalCancel: jest.fn(),
                handleCategoryModalSuccess: jest.fn(),
                handleCategoryModalError: jest.fn(),
                handleTagModalCancel: jest.fn(),
                handleTagModalSuccess: jest.fn(),
                handleTagModalError: jest.fn(),
                handleCourseCleanupModalCancel: jest.fn(),
                handleCourseCleanupModalSuccess: jest.fn(),
                handleCourseCleanupModalError: jest.fn(),
                showCourseCleanupModal: false,
            };
            return (props: any) => ReactActual.createElement(Wrapped, { ...props, bulkActions });
        },
    };
});
jest.mock('../../src/static/js/components/profile-page/ProfilePagesHeader', () => () => (
    <div className="mock-profile-header" />
));
jest.mock('../../src/static/js/components/profile-page/ProfilePagesContent', () => (props: any) => (
    <div className="mock-profile-content">{props.children}</div>
));
jest.mock('../../src/static/js/components/item-list/LazyLoadItemListAsync', () => ({
    LazyLoadItemListAsync: () => <div className="mock-profile-media-list" />,
}));
jest.mock('../../src/static/js/components/search-filters/ProfileMediaFilters', () => ({
    ProfileMediaFilters: () => null,
}));
jest.mock('../../src/static/js/components/search-filters/ProfileMediaTags', () => ({
    ProfileMediaTags: () => null,
}));
jest.mock('../../src/static/js/components/search-filters/ProfileMediaSorting', () => ({
    ProfileMediaSorting: () => null,
}));
jest.mock('../../src/static/js/components/search-filters/ProfileMediaSharing', () => ({
    ProfileMediaSharing: () => null,
}));
jest.mock('../../src/static/js/components/BulkActionsModals', () => ({
    BulkActionsModals: () => null,
}));
jest.mock('../../src/static/js/pages/_Page', () => {
    const ReactActual = require('react');
    return {
        Page: class Page extends ReactActual.Component {
            render() {
                return ReactActual.createElement('div', { className: 'mock-profile-page' }, this.pageContent());
            }
        },
    };
});

const profileStore = ProfilePageStore as any;
const pageStore = PageStore as any;

const authorJohn = {
    id: 1,
    username: 'john',
    name: 'John',
    description: 'Hello world',
};

const authorOther = {
    id: 2,
    username: 'jane',
    name: 'Jane',
    description: 'About Jane',
};

describe('pages/ProfileMediaPage and ProfileAboutPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        installMediaCMSGlobal();
        pageStore.__reset({
            'config-options': { pages: { profile: { htmlInDescription: false } } },
            'config-media-item': {
                displayViews: true,
                displayAuthor: true,
                displayPublishDate: true,
            },
        });
    });

    test('ProfileMediaPage shows bulk actions for channel owner', () => {
        profileStore.__reset({ 'author-data': authorJohn, 'author-query': '' });
        const { container, unmount } = renderIntoContainer(React.createElement(ProfileMediaPage));
        expect(container.querySelector('.bulk-actions-container')).not.toBeNull();
        unmount();
    });

    test('ProfileMediaPage hides bulk actions for visitors', () => {
        profileStore.__reset({ 'author-data': authorOther, 'author-query': '' });
        const { container, unmount } = renderIntoContainer(React.createElement(ProfileMediaPage));
        expect(container.querySelector('.bulk-actions-container')).toBeNull();
        unmount();
    });

    test('ProfileAboutPage shows contact form for non-owner viewers', () => {
        profileStore.__reset({ 'author-data': authorOther, 'author-query': '' });
        const { container, unmount } = renderIntoContainer(
            React.createElement(ProfileAboutPage, { title: 'Biography' })
        );
        expect(container.querySelector('.profile-contact')).not.toBeNull();
        unmount();
    });

    test('ProfileAboutPage hides contact form for channel owner', () => {
        profileStore.__reset({ 'author-data': authorJohn, 'author-query': '' });
        const { container, unmount } = renderIntoContainer(
            React.createElement(ProfileAboutPage, { title: 'Biography' })
        );
        expect(container.querySelector('.profile-contact')).toBeNull();
        unmount();
    });
});