import '../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer, act } from '../_support/render';
import { _MediaPage } from '../../src/static/js/pages/_MediaPage';
import { MediaPageStore } from '../../src/static/js/utils/stores/';
import { MediaPageActions } from '../../src/static/js/utils/actions/';

jest.mock('../../src/static/js/utils/stores/', () => require('../_support/compD_storeMocks').mockStoresModule());
jest.mock('../../src/static/js/utils/actions/', () => require('../_support/compD_storeMocks').mockActionsModule());
jest.mock('../../src/static/js/components/media-page/ViewerInfo', () => ({
    __esModule: true,
    default: () => null,
}));
jest.mock('../../src/static/js/components/media-page/ViewerSidebar', () => ({
    __esModule: true,
    default: () => null,
}));
jest.mock('../../src/static/js/components/page-layout/', () => ({
    PageMain: ({ children }: { children?: React.ReactNode }) => children,
}));
jest.mock('../../src/static/js/components/_shared', () => ({
    Notifications: () => null,
}));

const mediaStore = MediaPageStore as any;

describe('pages/_MediaPage password and error paths', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mediaStore.__reset({
            'media-id': 'abc',
            'playlist-data': null,
        });
    });

    test('Loads media on mount and shows password form when required', () => {
        const { container, unmount } = renderIntoContainer(<_MediaPage />);
        expect((MediaPageActions as any).loadMediaData).toHaveBeenCalledTimes(1);

        act(() => {
            mediaStore.emit('loaded_media_password_required');
        });

        expect(container.querySelector('.media-password-container')).not.toBeNull();
        expect(container.querySelector('.viewer-section-nested')).toBeNull();
        unmount();
    });

    test('Shows ViewerError when media load fails', () => {
        mediaStore.__set('media-load-error-message', 'Media is private');
        const { container, unmount } = renderIntoContainer(<_MediaPage />);

        act(() => {
            mediaStore.emit('loaded_media_error');
        });

        expect(container.querySelector('.player-container-error .msg-wrap')?.textContent).toBe('Media is private');
        expect(container.querySelector('.media-password-container')).toBeNull();
        unmount();
    });

    test('Shows the viewer shell after media loads', () => {
        const { container, unmount } = renderIntoContainer(<_MediaPage />);

        act(() => {
            mediaStore.emit('loaded_media_data');
        });

        expect(container.querySelector('.viewer-container')).not.toBeNull();
        expect(container.querySelector('.media-password-container')).toBeNull();
        expect(container.querySelector('.player-container-error')).toBeNull();
        unmount();
    });
});