import '../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer, act } from '../_support/render';
import { MediaPageStore } from '../../src/static/js/utils/stores/';
import { MediaPageActions } from '../../src/static/js/utils/actions/';
import { EmbedPage } from '../../src/static/js/pages/EmbedPage';

jest.mock('../../src/static/js/utils/stores/', () => require('../_support/compD_storeMocks').mockStoresModule());
jest.mock('../../src/static/js/utils/actions/', () => require('../_support/compD_storeMocks').mockActionsModule());
jest.mock('../../src/static/js/components/media-page/ViewerPassword', () => () => (
    <div className="mock-viewer-password" />
));
jest.mock('../../src/static/js/components/media-viewer/VideoViewer', () => (props: any) => (
    <div
        className="mock-video-viewer"
        data-show-title={String(props.showTitle)}
        data-show-related={String(props.showRelated)}
        data-timestamp={String(props.timestamp)}
        data-in-embed={String(props.inEmbed)}
    />
));
jest.mock('../../src/static/js/utils/contexts/', () => {
    const ReactActual = require('react');
    return {
        SiteConsumer: ({ children }: any) => children({ url: 'https://example.com' }),
        SiteContext: ReactActual.createContext({ url: 'https://example.com' }),
    };
});

const mediaStore = MediaPageStore as any;

describe('pages/EmbedPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mediaStore.__reset({
            'media-data': { title: 'Embed me', media_type: 'video' },
            'media-load-error-message': 'Media is private',
        });
        window.history.replaceState(null, '', '/embed?m=abc');
    });

    afterEach(() => {
        window.history.replaceState(null, '', '/');
    });

    test('Loads media data on mount', () => {
        const { unmount } = renderIntoContainer(<EmbedPage />);
        expect((MediaPageActions as any).loadMediaData).toHaveBeenCalled();
        unmount();
    });

    test('Password required shows ViewerPassword and hides the player', () => {
        const { container, unmount } = renderIntoContainer(<EmbedPage />);
        act(() => {
            mediaStore.emit('loaded_media_password_required');
        });
        expect(container.querySelector('.mock-viewer-password')).not.toBeNull();
        expect(container.querySelector('.mock-video-viewer')).toBeNull();
        unmount();
    });

    test('Load error shows the store error message', () => {
        const { container, unmount } = renderIntoContainer(<EmbedPage />);
        act(() => {
            mediaStore.emit('loaded_media_error');
        });
        expect(container.querySelector('.player-container-error .msg-wrap')?.textContent).toBe('Media is private');
        expect(container.querySelector('.mock-video-viewer')).toBeNull();
        unmount();
    });

    test('Loaded video renders VideoViewer in embed mode with query flags', () => {
        window.history.replaceState(null, '', '/embed?m=abc&showTitle=0&showRelated=0&t=42');
        const { container, unmount } = renderIntoContainer(<EmbedPage />);
        act(() => {
            mediaStore.emit('loaded_video_data');
        });
        const viewer = container.querySelector('.mock-video-viewer') as HTMLElement;
        expect(viewer).not.toBeNull();
        expect(viewer.getAttribute('data-in-embed')).toBe('true');
        expect(viewer.getAttribute('data-show-title')).toBe('false');
        expect(viewer.getAttribute('data-show-related')).toBe('false');
        expect(viewer.getAttribute('data-timestamp')).toBe('42');
        unmount();
    });
});
