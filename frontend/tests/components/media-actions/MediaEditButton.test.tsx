import '../../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer } from '../../_support/render';
import { MediaPageStore } from '../../../src/static/js/utils/stores/';
import { MediaEditButton } from '../../../src/static/js/components/media-actions/MediaEditButton';

jest.mock('../../../src/static/js/utils/stores/', () => require('../../_support/compD_storeMocks').mockStoresModule());
jest.mock('../../../src/static/js/utils/hooks/', () => ({
    useUser: jest.fn(),
}));
jest.mock('../../../src/static/js/utils/helpers/', () => {
    const actual = jest.requireActual('../../../src/static/js/utils/helpers/');
    return { ...actual, inEmbeddedApp: jest.fn(() => false) };
});

const { useUser } = require('../../../src/static/js/utils/hooks/');
const { inEmbeddedApp } = require('../../../src/static/js/utils/helpers/');
const mediaStore = MediaPageStore as any;

describe('components/media-actions/MediaEditButton', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mediaStore.__reset({
            'media-data': { edit_url: '/edit?m=abc' },
        });
        (window as any).MediaCMS.site.devEnv = false;
        useUser.mockReturnValue({ userCan: { editMedia: true } });
        inEmbeddedApp.mockReturnValue(false);
    });

    test('Returns null when the user cannot edit media', () => {
        useUser.mockReturnValue({ userCan: { editMedia: false } });
        const { container, unmount } = renderIntoContainer(<MediaEditButton />);
        expect(container.innerHTML).toBe('');
        unmount();
    });

    test('Renders edit link from media data', () => {
        const { container, unmount } = renderIntoContainer(<MediaEditButton />);
        const link = container.querySelector('.edit a') as HTMLAnchorElement;
        expect(link.getAttribute('href')).toBe('/edit?m=abc');
        expect(container.textContent).toContain('EDIT');
        unmount();
    });

    test('Appends LMS embed mode query when embedded', () => {
        inEmbeddedApp.mockReturnValue(true);
        const { container, unmount } = renderIntoContainer(<MediaEditButton />);
        expect((container.querySelector('.edit a') as HTMLAnchorElement).getAttribute('href')).toBe(
            '/edit?m=abc&mode=lms_embed_mode'
        );
        unmount();
    });

    test('Uses local edit-media.html path in the frontend dev environment', () => {
        (window as any).MediaCMS.site.devEnv = true;
        const { container, unmount } = renderIntoContainer(<MediaEditButton />);
        expect((container.querySelector('.edit a') as HTMLAnchorElement).getAttribute('href')).toBe('/edit-media.html');
        unmount();
    });
});
