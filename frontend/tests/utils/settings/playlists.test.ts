import { testUnimplemented } from '../../_support/unimplemented';
import { init, settings } from '../../../src/static/js/utils/settings/playlists';

const playlistsConfig = (plists?: any) => {
    init(plists);
    return settings();
};

describe('utils/settings', () => {
    describe('playlists', () => {
        test('Defaults to both audio and video when no settings provided', () => {
            const cfg = playlistsConfig();
            expect(cfg.mediaTypes).toEqual(['audio', 'video']);
        });

        test('Returns default when provided mediaTypes array is empty', () => {
            const cfg = playlistsConfig({ mediaTypes: [] });
            expect(cfg.mediaTypes).toEqual(['audio', 'video']);
        });

        test('Includes only valid media types when both valid and invalid are provided', () => {
            const cfg = playlistsConfig({ mediaTypes: ['audio', 'invalid', 'video', 'something'] });
            expect(cfg.mediaTypes).toEqual(['audio', 'video']);
        });

        test('Returns default when provided mediaTypes is non-array or undefined/null', () => {
            expect(playlistsConfig({}).mediaTypes).toEqual(['audio', 'video']);
            expect(playlistsConfig({ mediaTypes: undefined }).mediaTypes).toEqual(['audio', 'video']);
            expect(playlistsConfig({ mediaTypes: 'audio' }).mediaTypes).toEqual(['audio', 'video']);
            expect(playlistsConfig({ mediaTypes: 123 }).mediaTypes).toEqual(['audio', 'video']);
        });

        testUnimplemented('playlistsConfig({ mediaTypes: null }) should fall back to default audio/video');

        // Current buggy behavior: duplicates are preserved.
        test('Handles duplicates and preserves order among valid items (current buggy behavior)', () => {
            const cfg = playlistsConfig({ mediaTypes: ['video', 'audio', 'video', 'audio', 'invalid'] });
            expect(cfg.mediaTypes).toEqual(['video', 'audio', 'video', 'audio']);
        });

        testUnimplemented('playlists mediaTypes should dedupe valid entries');

        // Current buggy behavior: case variants are rejected and defaults apply.
        test('Rejects non-exact case values (e.g., "Audio") (current buggy behavior)', () => {
            const cfg = playlistsConfig({ mediaTypes: ['Audio', 'Video'] });
            expect(cfg.mediaTypes).toEqual(['audio', 'video']);
        });

        testUnimplemented('playlists mediaTypes should accept case-insensitive "Audio"/"Video"');

        test('does not mutate the input object', () => {
            const input = { mediaTypes: ['audio', 'video', 'invalid'] };
            const copy = JSON.parse(JSON.stringify(input));
            playlistsConfig(input);
            expect(input).toEqual(copy);
        });
    });
});
