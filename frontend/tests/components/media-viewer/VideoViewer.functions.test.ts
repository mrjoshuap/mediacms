import '../../_support/setupMediaCMS';
import {
    orderedSupportedVideoFormats,
    videoAvailableCodecsAndResolutions,
    extractDefaultVideoResolution,
} from '../../../src/static/js/components/media-viewer/VideoViewer/functions';

type CanPlayMap = { [mimeFragment: string]: string };

const nativeCreateElement = document.createElement.bind(document);

function installVideoCanPlayType(map: CanPlayMap) {
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string, options?: ElementCreationOptions) => {
        const el = nativeCreateElement(tagName, options);
        if ('video' === tagName) {
            (el as HTMLVideoElement).canPlayType = ((mime: string) => {
                for (const fragment of Object.keys(map)) {
                    if (mime.includes(fragment)) {
                        return map[fragment] as CanPlayTypeResult;
                    }
                }
                return '' as CanPlayTypeResult;
            }) as HTMLVideoElement['canPlayType'];
        }
        return el;
    });
}

describe('components/media-viewer/VideoViewer/functions', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('orderedSupportedVideoFormats', () => {
        test('Always includes HLS first when canPlayType exists', () => {
            installVideoCanPlayType({});
            const result = orderedSupportedVideoFormats(false);
            expect(result.support.hls).toBe(true);
            expect(result.order[0]).toBe('hls');
        });

        test('Collects codecs that report probably and respects includeAll', () => {
            installVideoCanPlayType({
                hvc1: 'probably',
                avc1: 'probably',
                vp9: 'probably',
                vp8: 'probably',
                theora: 'probably',
                mp4v: 'probably',
            });

            const minimal = orderedSupportedVideoFormats(false);
            expect(minimal.order).toEqual(expect.arrayContaining(['hls', 'h265', 'h264', 'vp9', 'mp4']));
            expect(minimal.support.vp8).toBeUndefined();

            const all = orderedSupportedVideoFormats(true);
            expect(all.support.vp8).toBe(true);
            expect(all.support.theora).toBe(true);
        });
    });

    describe('extractDefaultVideoResolution', () => {
        const resolutions = { '480': { format: [] }, '720': { format: [] }, '1080': { format: [] } };

        test('Returns the key when it exists in the map', () => {
            expect(extractDefaultVideoResolution('720', resolutions)).toBe('720');
        });

        test('Clamps below the smallest and above the largest key', () => {
            expect(extractDefaultVideoResolution(400, resolutions)).toBe('480');
            expect(extractDefaultVideoResolution(2000, resolutions)).toBe('1080');
        });

        test('Picks the next higher step for values between keys', () => {
            expect(extractDefaultVideoResolution(900, resolutions)).toBe('1080');
            expect(extractDefaultVideoResolution(600, resolutions)).toBe('720');
        });
    });

    describe('videoAvailableCodecsAndResolutions', () => {
        beforeEach(() => {
            installVideoCanPlayType({
                avc1: 'probably',
                'application/x-mpegURL': '',
            });
            Object.defineProperty(window, 'screen', {
                value: { width: 1920, height: 1080 },
                configurable: true,
            });
        });

        test('Maps HLS playlists and Auto from hls_info', () => {
            const hls = {
                master_file: '/hls/master.m3u8',
                '720_playlist': '/hls/720.m3u8',
            };
            const result = videoAvailableCodecsAndResolutions({}, hls, undefined) as Record<
                string,
                { format: string[]; url: string[] }
            >;
            expect(result.Auto).toEqual({
                format: ['hls'],
                url: ['https://example.com/hls/master.m3u8'],
            });
            expect(result['720']).toEqual({
                format: ['hls'],
                url: ['https://example.com/hls/720.m3u8'],
            });
        });

        test('Includes progressive encodings when codec and extension match', () => {
            const encodings = {
                '720': {
                    h264: {
                        url: '/media/clip.mp4',
                        status: 'success',
                        progress: 100,
                    },
                },
            };
            const result = videoAvailableCodecsAndResolutions(encodings, {}, undefined) as Record<
                string,
                { format: string[]; url: string[] }
            >;
            expect(result['720'].format).toContain('h264');
            expect(result['720'].url[0]).toBe('https://example.com/media/clip.mp4');
        });

        test('Skips encodings with unsupported extensions or codecs', () => {
            jest.restoreAllMocks();
            installVideoCanPlayType({ avc1: '' });
            Object.defineProperty(window, 'screen', {
                value: { width: 1920, height: 1080 },
                configurable: true,
            });
            const encodings = {
                '720': {
                    h264: {
                        url: '/media/clip.mp4',
                        status: 'success',
                        progress: 100,
                    },
                },
            };
            const result = videoAvailableCodecsAndResolutions(encodings, {}, undefined) as Record<
                string,
                { format: string[]; url: string[] }
            >;
            expect(result['720']).toBeUndefined();
        });
    });
});