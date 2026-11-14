import '../../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer, act } from '../../_support/render';
import ViewerInfo from '../../../src/static/js/components/media-page/ViewerInfo';
import ViewerInfoTitleBanner from '../../../src/static/js/components/media-page/ViewerInfoTitleBanner';
import { MediaPageStore, PageStore } from '../../../src/static/js/utils/stores/';

jest.mock('../../../src/static/js/utils/stores/', () => require('../../_support/compD_storeMocks').mockStoresModule());
jest.mock('../../../src/static/js/utils/actions/', () => require('../../_support/compD_storeMocks').mockActionsModule());
jest.mock('../../../src/static/js/components/comments/Comments', () => ({
    __esModule: true,
    default: () => null,
}));
jest.mock('../../../src/static/js/components/media-actions', () => ({
    MediaLikeIcon: () => require('react').createElement('span', { className: 'mock-like' }),
    MediaDislikeIcon: () => require('react').createElement('span', { className: 'mock-dislike' }),
    MediaEditButton: () => require('react').createElement('span', { className: 'mock-edit' }),
    OtherMediaDownloadLink: () => null,
    VideoMediaDownloadLink: () => null,
    MediaSaveButton: () => null,
    MediaShareButton: () => null,
    MediaMoreOptionsIcon: () => null,
}));

const mediaStore = MediaPageStore as any;
const pageStore = PageStore as any;

function seedLoadedMedia(overrides: { state?: string; is_shared?: boolean; views?: number } = {}) {
    mediaStore.__set('media-id', 'm1');
    mediaStore.__set('media-type', 'image');
    mediaStore.__set('media-original-url', '/media/files/photo.jpg');
    mediaStore.__set('media-author-thumbnail-url', '/thumb.png');
    mediaStore.__set('user-liked-media', false);
    mediaStore.__set('user-disliked-media', false);
    mediaStore.__set('media-data', {
        title: 'Sample media',
        views: overrides.views ?? 1,
        categories_info: [],
        author_name: 'John',
        author_profile: '/user/john',
        add_date: '2024-01-01',
        description: 'Desc',
        allow_download: true,
        state: overrides.state ?? 'public',
        is_shared: overrides.is_shared ?? false,
        edit_url: '/edit/m1',
    });
}

describe('components/media-page', () => {
    beforeEach(() => {
        pageStore.__reset({
            'config-options': { pages: { media: { displayViews: true, categoriesWithTitle: false } } },
            'config-enabled': {
                taxonomies: { tags: { enabled: false }, categories: { enabled: false } },
            },
            'config-media-item': { displayPublishDate: false },
        });
        mediaStore.__reset();
        mediaStore.__set('media-tags', []);
        mediaStore.__set('media-categories', []);
    });

    describe('ViewerInfo', () => {
        test('Renders nothing until media data has loaded', () => {
            const { container, unmount } = renderIntoContainer(<ViewerInfo />);
            expect(container.innerHTML).toBe('');
            seedLoadedMedia();
            act(() => {
                mediaStore.emit('loaded_media_data');
            });
            expect(container.querySelector('.viewer-info h1')?.textContent).toBe('Sample media');
            unmount();
        });
    });

    describe('ViewerInfoTitleBanner', () => {
        test('Shows private state label and singular view count', () => {
            seedLoadedMedia({ state: 'private', views: 1 });
            const { container, unmount } = renderIntoContainer(
                <ViewerInfoTitleBanner title="Sample media" views={1} categories={[]} allowDownload={false} />
            );
            expect(container.querySelector('.media-label-state span')?.textContent).toBe('private');
            expect(container.querySelector('.media-views')?.textContent).toContain('view');
            unmount();
        });

        test('Shows unlisted state label', () => {
            seedLoadedMedia({ state: 'unlisted', views: 42 });
            const { container, unmount } = renderIntoContainer(
                <ViewerInfoTitleBanner title="Hidden" views={42} categories={[]} allowDownload={false} />
            );
            expect(container.querySelector('.media-label-state span')?.textContent).toBe('unlisted');
            expect(container.querySelector('.media-views')?.textContent).toContain('views');
            unmount();
        });

        test('Shows shared label when media is shared', () => {
            seedLoadedMedia({ is_shared: true, state: 'public' });
            const { container, unmount } = renderIntoContainer(
                <ViewerInfoTitleBanner title="Shared item" views={5} categories={[]} allowDownload={false} />
            );
            expect(container.querySelector('.media-label-state span')?.textContent).toBe('shared');
            unmount();
        });

        test('Omits visibility labels for public non-shared media', () => {
            seedLoadedMedia({ state: 'public', is_shared: false });
            const { container, unmount } = renderIntoContainer(
                <ViewerInfoTitleBanner title="Open" views={3} categories={[]} allowDownload={false} />
            );
            expect(container.querySelector('.media-labels-area')).toBeNull();
            unmount();
        });
    });
});