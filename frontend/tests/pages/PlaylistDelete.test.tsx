import '../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer, act } from '../_support/render';
import { click } from '../_support/compD_dom';
import { PlaylistPageStore } from '../../src/static/js/utils/stores/';
import { PageActions, PlaylistPageActions } from '../../src/static/js/utils/actions/';
import { PlaylistAuthor, PlaylistDelete } from '../../src/static/js/pages/PlaylistPage';

jest.mock('../../src/static/js/utils/stores/', () => require('../_support/compD_storeMocks').mockStoresModule());
jest.mock('../../src/static/js/utils/actions/', () => require('../_support/compD_storeMocks').mockActionsModule());
jest.mock('../../src/static/js/components/playlist-form/PlaylistCreationForm', () => ({
    PlaylistCreationForm: () => null,
}));
jest.mock('../../src/static/js/components/playlist-page/PlaylistMediaList', () => ({
    PlaylistMediaList: () => null,
}));
jest.mock('../../src/static/js/pages/_Page', () => ({
    Page: class Page {},
}));

describe('pages/PlaylistPage', () => {
    describe('PlaylistDelete', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.clearAllMocks();
            (PlaylistPageStore as any).__reset();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test('Shows a labeled Delete control', () => {
            const { container, unmount } = renderIntoContainer(<PlaylistDelete />);
            const button = container.querySelector('.delete-playlist > button');
            expect(button?.textContent).toContain('DELETE');
            expect(container.querySelector('.delete-playlist .material-icons')?.getAttribute('data-icon')).toBe('delete');
            unmount();
        });

        test('Opens confirm dialog and cancel closes it', () => {
            const { container, unmount } = renderIntoContainer(<PlaylistDelete />);
            click(container.querySelector('.delete-playlist > button'));
            expect(container.querySelector('.popup-message-title')?.textContent).toBe('Playlist removal');
            click(container.querySelector('.cancel-playlist-removal'));
            expect(container.querySelector('.popup-message')).toBeNull();
            unmount();
        });

        test('Proceeding calls removePlaylist', () => {
            const { container, unmount } = renderIntoContainer(<PlaylistDelete />);
            click(container.querySelector('.delete-playlist > button'));
            click(container.querySelector('.proceed-playlist-removal'));
            expect((PlaylistPageActions as any).removePlaylist).toHaveBeenCalled();
            expect(container.querySelector('.popup-message')).toBeNull();
            unmount();
        });

        test('Removal completed notifies after a delay', () => {
            const { unmount } = renderIntoContainer(<PlaylistDelete />);
            act(() => {
                (PlaylistPageStore as any).emit('playlist_removal_completed');
            });
            act(() => {
                jest.advanceTimersByTime(100);
            });
            expect((PageActions as any).addNotification).toHaveBeenCalledWith(
                'Playlist removed. Redirecting...',
                'playlistDelete'
            );
            unmount();
        });

        test('Removal failed notifies after a delay', () => {
            const { unmount } = renderIntoContainer(<PlaylistDelete />);
            act(() => {
                (PlaylistPageStore as any).emit('playlist_removal_failed');
            });
            act(() => {
                jest.advanceTimersByTime(100);
            });
            expect((PageActions as any).addNotification).toHaveBeenCalledWith(
                'Playlist removal failed',
                'playlistDeleteFail'
            );
            unmount();
        });
    });

    describe('PlaylistAuthor', () => {
        test('Shows Edit and Delete for the playlist owner', () => {
            const { container, unmount } = renderIntoContainer(
                <PlaylistAuthor name="Owner" link="/user/owner" loggedinUserPlaylist />
            );
            expect(container.querySelector('.edit-playlist')).not.toBeNull();
            expect(container.querySelector('.delete-playlist')).not.toBeNull();
            expect(container.querySelector('.delete-playlist')?.textContent).toContain('DELETE');
            unmount();
        });

        test('Hides Edit and Delete for non-owners', () => {
            const { container, unmount } = renderIntoContainer(
                <PlaylistAuthor name="Owner" link="/user/owner" loggedinUserPlaylist={false} />
            );
            expect(container.querySelector('.edit-playlist')).toBeNull();
            expect(container.querySelector('.delete-playlist')).toBeNull();
            expect(container.querySelector('.playlist-author-actions')).toBeNull();
            unmount();
        });
    });
});
