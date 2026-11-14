import '../../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer, act } from '../../_support/render';
import VideoJSEmbed from '../../../src/static/js/components/VideoJS/VideoJSEmbed';

const VideoEmbed = VideoJSEmbed as unknown as React.ComponentType<Record<string, unknown>>;

describe('components/VideoJS/VideoJSEmbed', () => {
    const originalMediaData = (window as any).MEDIA_DATA;

    beforeEach(() => {
        jest.useFakeTimers();
        delete (window as any).MEDIA_DATA;
        document.head.innerHTML = '';
        document.body.innerHTML = '';
    });

    afterEach(() => {
        jest.useRealTimers();
        (window as any).MEDIA_DATA = originalMediaData;
    });

    test('Publishes viewer props on window.MEDIA_DATA and mounts the main player root', () => {
        const data = { friendly_token: 'tok', title: 'Clip' };
        const sources = [{ src: 'https://example.com/v.mp4' }];
        const { container, unmount } = renderIntoContainer(
            <VideoEmbed data={data} siteUrl="https://example.com" version="9" sources={sources} inEmbed={false} />
        );

        expect(container.querySelector('#video-js-root-main')).not.toBeNull();
        expect((window as any).MEDIA_DATA.data).toEqual(data);
        expect((window as any).MEDIA_DATA.sources).toEqual(sources);
        expect((window as any).MEDIA_DATA.siteUrl).toBe('https://example.com');
        expect(document.querySelector('link[href*="video-js.css"]')?.getAttribute('href')).toContain('video-js.css');
        expect(document.querySelector('script[src*="video-js.js"]')?.getAttribute('src')).toContain('video-js.js');
        unmount();
    });

    test('Uses the embed root and dispatches mount trigger when inEmbed', () => {
        const dispatch = jest.spyOn(document, 'dispatchEvent');
        const { container, unmount } = renderIntoContainer(
            <VideoEmbed data={{ friendly_token: 'e1' }} siteUrl="https://example.com" version="1" inEmbed />
        );

        expect(container.querySelector('#video-js-root-embed')).not.toBeNull();
        act(() => {
            jest.advanceTimersByTime(150);
        });
        expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'triggerVideoJSMount' }));
        dispatch.mockRestore();
        unmount();
    });

    test('Removes the timestamp click listener on unmount', () => {
        const removeSpy = jest.spyOn(document, 'removeEventListener');
        const view = renderIntoContainer(
            <VideoEmbed data={{ friendly_token: 'x' }} siteUrl="https://example.com" version="1" inEmbed />
        );
        view.unmount();
        expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function));
        removeSpy.mockRestore();
    });
});