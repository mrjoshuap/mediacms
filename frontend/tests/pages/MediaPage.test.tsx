import '../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer } from '../_support/render';
import { MediaPageStore } from '../../src/static/js/utils/stores/';
import { MediaPage } from '../../src/static/js/pages/MediaPage';

jest.mock('../../src/static/js/utils/stores/', () => require('../_support/compD_storeMocks').mockStoresModule());
jest.mock('../../src/static/js/pages/_Page', () => ({
    Page: class Page {},
}));
jest.mock('../../src/static/js/components/media-viewer/VideoViewer', () => (props: any) => (
    <div className="mock-video-viewer" data-in-embed={String(props.inEmbed)} />
));
jest.mock('../../src/static/js/components/media-viewer/ImageViewer', () => () => (
    <div className="mock-image-viewer" />
));
jest.mock('../../src/static/js/components/media-viewer/PdfViewer', () => (props: any) => (
    <div className="mock-pdf-viewer" data-url={props.fileUrl} />
));
jest.mock('../../src/static/js/components/media-viewer/AttachmentViewer', () => () => (
    <div className="mock-attachment-viewer" />
));
jest.mock('../../src/static/js/utils/contexts/', () => {
    const ReactActual = require('react');
    return {
        SiteConsumer: ({ children }: any) => children({ url: 'https://example.com/' }),
        SiteContext: ReactActual.createContext({ url: 'https://example.com/' }),
        apiUrlConfig: { media: 'https://example.com/api/v1/media' },
    };
});

const mediaStore = MediaPageStore as any;
const sampleData = { title: 'Sample', id: 'media-1' };

describe('pages/MediaPage viewerContainerContent', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mediaStore.__reset({ 'media-id': 'media-1' });
    });

    function renderViewerContent() {
        const page = new MediaPage({});
        const { container, unmount } = renderIntoContainer(page.viewerContainerContent(sampleData));
        return { container, unmount };
    }

    test('Routes video media to VideoViewer', () => {
        mediaStore.__set('media-type', 'video');
        const { container, unmount } = renderViewerContent();
        expect(container.querySelector('.mock-video-viewer')).not.toBeNull();
        expect(container.querySelector('.mock-image-viewer')).toBeNull();
        unmount();
    });

    test('Routes audio media to VideoViewer', () => {
        mediaStore.__set('media-type', 'audio');
        const { container, unmount } = renderViewerContent();
        expect(container.querySelector('.mock-video-viewer')).not.toBeNull();
        unmount();
    });

    test('Routes image media to ImageViewer', () => {
        mediaStore.__set('media-type', 'image');
        const { container, unmount } = renderViewerContent();
        expect(container.querySelector('.mock-image-viewer')).not.toBeNull();
        unmount();
    });

    test('Routes pdf media to PdfViewer with encoded media id', () => {
        mediaStore.__set('media-type', 'pdf');
        const { container, unmount } = renderViewerContent();
        const pdf = container.querySelector('.mock-pdf-viewer') as HTMLElement;
        expect(pdf).not.toBeNull();
        expect(pdf.getAttribute('data-url')).toBe('https://example.com/api/v1/media/media-1/pdf');
        unmount();
    });

    test('Falls back to AttachmentViewer for unknown types', () => {
        mediaStore.__set('media-type', 'other');
        const { container, unmount } = renderViewerContent();
        expect(container.querySelector('.mock-attachment-viewer')).not.toBeNull();
        unmount();
    });
});