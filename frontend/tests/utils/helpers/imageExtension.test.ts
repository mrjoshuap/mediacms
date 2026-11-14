import { testUnimplemented } from '../../_support/unimplemented';
import { imageExtension } from '../../../src/static/js/utils/helpers/imageExtension';

describe('js/utils/helpers', () => {
    describe('imageExtension', () => {
        testUnimplemented('imageExtension should be renamed to fileExtension (it is not image-specific)');

        test('Returns the extension for a typical filename', () => {
            expect(imageExtension('photo.png')).toBe('png');
            expect(imageExtension('document.pdf')).toBe('pdf');
        });

        test('Returns the last segment for filenames with multiple dots', () => {
            expect(imageExtension('archive.tar.gz')).toBe('gz');
            expect(imageExtension('backup.2024.12.31.zip')).toBe('zip');
        });

        // Current buggy behavior: no-dot inputs return the whole string.
        test('Returns the entire string when there is no dot in the filename (current buggy behavior)', () => {
            expect(imageExtension('file')).toBe('file');
            expect(imageExtension('README')).toBe('README');
        });

        testUnimplemented('imageExtension should return undefined (not the whole string) when there is no dot');

        test('Handles hidden files that start with a dot', () => {
            expect(imageExtension('.gitignore')).toBe('gitignore');
            expect(imageExtension('.env.local')).toBe('local');
        });

        test('Returns undefined for falsy or empty inputs', () => {
            expect(imageExtension('')).toBeUndefined();
            expect(imageExtension(undefined as unknown as string)).toBeUndefined();
            expect(imageExtension(null as unknown as string)).toBeUndefined();
        });

        test('Extracts the extension from URL-like paths', () => {
            expect(imageExtension('https://example.com/images/avatar.jpeg')).toBe('jpeg');
            expect(imageExtension('/static/assets/icons/favicon.ico')).toBe('ico');
        });

        test('Preserves case of the extension', () => {
            expect(imageExtension('UPPER.CASE.JPG')).toBe('JPG');
            expect(imageExtension('Mixed.Extension.PnG')).toBe('PnG');
        });

        test('Returns empty string when the filename ends with a trailing dot', () => {
            expect(imageExtension('weird.')).toBe('');
        });
    });
});
