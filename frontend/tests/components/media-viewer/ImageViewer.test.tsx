import '../../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer, act } from '../../_support/render';
import { SiteContext } from '../../../src/static/js/utils/contexts/SiteContext';
import { MediaPageStore } from '../../../src/static/js/utils/stores/';
import ImageViewer from '../../../src/static/js/components/media-viewer/ImageViewer';

jest.mock('../../../src/static/js/utils/stores/', () => require('../../_support/compD_storeMocks').mockStoresModule());

jest.mock('../../../src/static/js/components/_shared/ToolTip', () => {
    const React = require('react');
    return {
        __esModule: true,
        default: ({ children }: { children: React.ReactNode }) =>
            React.createElement('div', { className: 'tooltip-stub' }, children),
    };
});

jest.mock('../../../src/static/js/components/_shared', () => {
    const React = require('react');
    return {
        SpinnerLoader: () => React.createElement('motionless', { className: 'spinner-stub' }),
    };
});

const mediaStore = MediaPageStore as any;
const site = { url: 'https://example.com' };

describe('components/media-viewer/ImageViewer', () => {
    beforeEach(() => {
        mediaStore.__reset({
            'media-data': {
                title: 'Still frame',
                poster_url: '/media/poster.jpg',
                thumbnail_url: '/media/thumb.jpg',
                slideshow_items: [],
            },
            'media-original-url': null,
        });
    });

    test('Renders the main image using poster_url', () => {
        const { container, unmount } = renderIntoContainer(
            <SiteContext.Provider value={site}>
                <ImageViewer />
            </SiteContext.Provider>
        );
        const img = container.querySelector('.viewer-image-container img');
        expect(img?.getAttribute('src')).toBe('https://example.com/media/poster.jpg');
        expect(img?.getAttribute('alt')).toBe('Still frame');
        unmount();
    });

    test('Opens the slideshow modal when the image is clicked', () => {
        mediaStore.__reset({
            'media-data': {
                title: 'Gallery',
                thumbnail_url: '/media/thumb.jpg',
                slideshow_items: [
                    {
                        title: 'Slide A',
                        url: '/view/slide-a',
                        thumbnail_url: '/media/a-thumb.jpg',
                        original_media_url: '/media/a-full.jpg',
                    },
                ],
            },
        });
        const { container, unmount } = renderIntoContainer(
            <SiteContext.Provider value={site}>
                <ImageViewer />
            </SiteContext.Provider>
        );
        expect(container.querySelector('.modal-overlay')).toBeNull();
        act(() => {
            (container.querySelector('.viewer-image-container img') as HTMLImageElement).click();
        });
        expect(container.querySelector('.modal-overlay')).not.toBeNull();
        unmount();
    });
});