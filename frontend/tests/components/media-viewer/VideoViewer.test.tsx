import '../../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer } from '../../_support/render';
import VideoViewer from '../../../src/static/js/components/media-viewer/VideoViewer';
import { MediaPageStore, PageStore, VideoViewerStore } from '../../../src/static/js/utils/stores/';
import { VideoViewerActions } from '../../../src/static/js/utils/actions/';

const capturedEmbedProps: { current: Record<string, unknown> | null } = { current: null };
const mockVideoInfo = jest.fn<Record<string, { format: string[]; url: string[] }>, unknown[]>(() => ({
    '720': { format: ['h264'], url: ['https://example.com/media/720.mp4'] },
}));

jest.mock('../../../src/static/js/components/VideoJS/VideoJSEmbed', () => {
    const React = require('react');
    return {
        __esModule: true,
        default: (props: Record<string, unknown>) => {
            capturedEmbedProps.current = props;
            return React.createElement('div', { className: 'video-js-embed-stub', 'data-testid': 'videojs-embed' });
        },
    };
});

jest.mock('../../../src/static/js/components/media-viewer/VideoViewer/functions', () => ({
    orderedSupportedVideoFormats: () => ({
        order: ['h264', 'hls'],
        support: { h264: true, hls: true },
    }),
    videoAvailableCodecsAndResolutions: (...args: unknown[]) => mockVideoInfo(...args),
    extractDefaultVideoResolution: () => '720',
}));

jest.mock('../../../src/static/js/utils/stores/', () => require('../../_support/compD_storeMocks').mockStoresModule());
jest.mock('../../../src/static/js/utils/actions/', () =>
    require('../../_support/compD_storeMocks').mockActionsModule()
);

jest.mock('../../../src/static/js/utils/classes/', () => ({
    BrowserCache: jest.fn(() => ({
        get: jest.fn(() => null),
    })),
    MediaDurationInfo: jest.fn().mockImplementation(() => ({
        update: jest.fn(),
        ISO8601: () => 'PT1M',
    })),
    UpNextLoaderView: jest.fn().mockImplementation(() => ({
        html: () => null,
        setVideoJsPlayerElem: jest.fn(),
        hideTimerView: jest.fn(),
    })),
}));

const mediaStore = MediaPageStore as any;
const pageStore = PageStore as any;
const viewerStore = VideoViewerStore as any;

function wireStoreSet(store: { __set: (k: string, v: unknown) => void; get: jest.Mock; set?: jest.Mock }) {
    store.set = jest.fn((key: string, value: unknown) => {
        store.__set(key, value);
    });
}

const playableData = {
    friendly_token: 'abc123',
    title: 'Sample',
    duration: 120,
    encoding_status: 'success',
    related_media: [{ media_type: 'video', url: '/view?m=next' }],
    encodings_info: {
        '720': {
            h264: {
                url: '/media/720.mp4',
                status: 'success',
                progress: 100,
            },
        },
    },
    hls_info: {},
};

describe('components/media-viewer/VideoViewer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockVideoInfo.mockImplementation(() => ({
            '720': { format: ['h264'], url: ['https://example.com/media/720.mp4'] },
        }));
        capturedEmbedProps.current = null;
        wireStoreSet(mediaStore);
        wireStoreSet(pageStore);
        wireStoreSet(viewerStore);
        mediaStore.__reset({
            'media-load-error-type': null,
            'media-load-error-message': null,
            'media-data': playableData,
            'playlist-id': null,
        });
        pageStore.__reset({ 'media-auto-play': false });
        viewerStore.__reset({ 'in-theater-mode': false, 'video-quality': null });
        pageStore.on = jest.fn();
        pageStore.removeListener = jest.fn();
        mediaStore.on = jest.fn();
        mediaStore.removeListener = jest.fn();
    });

    test('Sets encoding-failed error on the store when encoding_status is fail', () => {
        const { unmount } = renderIntoContainer(
            <VideoViewer data={{ ...playableData, encoding_status: 'fail' }} siteUrl="https://example.com/" inEmbed />
        );
        expect(mediaStore.set).toHaveBeenCalledWith('media-load-error-type', 'encodingFailed');
        expect(mediaStore.set).toHaveBeenCalledWith('media-load-error-message', 'Media encoding failed');
        expect(capturedEmbedProps.current).toBeNull();
        unmount();
    });

    test('Marks the container as error when there are no playable sources', () => {
        mockVideoInfo.mockReturnValue({});
        const { container, unmount } = renderIntoContainer(
            <VideoViewer data={{ ...playableData, encodings_info: {} }} siteUrl="https://example.com/" inEmbed />
        );
        expect(container.querySelector('.player-container-error')).not.toBeNull();
        expect(capturedEmbedProps.current?.sources).toEqual([]);
        unmount();
    });

    test('Renders the VideoJS embed with sources when encodings are available', () => {
        const { container, unmount } = renderIntoContainer(
            <VideoViewer data={playableData} siteUrl="https://example.com/" inEmbed={false} />
        );
        expect(container.querySelector('[data-testid="videojs-embed"]')).not.toBeNull();
        expect(capturedEmbedProps.current?.sources).toEqual(
            expect.arrayContaining([expect.objectContaining({ src: expect.stringContaining('720.mp4') })])
        );
        expect(capturedEmbedProps.current?.hasTheaterMode).toBe(true);
        unmount();
    });

    test('Forwards theater mode changes to VideoViewerActions', () => {
        renderIntoContainer(<VideoViewer data={playableData} siteUrl="https://example.com/" inEmbed={false} />);
        const onStateUpdate = capturedEmbedProps.current?.onStateUpdateCallback as (state: Record<string, unknown>) => void;
        expect(typeof onStateUpdate).toBe('function');
        onStateUpdate({
            theaterMode: true,
            volume: 0.75,
            soundMuted: false,
            quality: '720',
            playbackSpeed: 1,
        });
        expect(VideoViewerActions.set_viewer_mode).toHaveBeenCalledWith(true);
    });
});