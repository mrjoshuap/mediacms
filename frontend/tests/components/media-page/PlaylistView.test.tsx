import '../../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer, act } from '../../_support/render';
import { click } from '../../_support/compD_dom';
import PlaylistView from '../../../src/static/js/components/media-page/PlaylistView';
import { PlaylistViewStore, PageStore } from '../../../src/static/js/utils/stores/';
import { PageActions, PlaylistViewActions } from '../../../src/static/js/utils/actions/';

jest.mock('../../../src/static/js/utils/stores/', () => require('../../_support/compD_storeMocks').mockStoresModule());
jest.mock('../../../src/static/js/utils/actions/', () => require('../../_support/compD_storeMocks').mockActionsModule());
jest.mock('../../../src/static/js/components/media-page/PlaylistPlaybackMedia', () => ({
    PlaylistPlaybackMedia: () => require('react').createElement('div', { className: 'mock-playlist-playback' }),
}));

const playlistViewStore = PlaylistViewStore as any;

const playlistData = {
    title: 'My list',
    url: '/playlist/p1',
    user: 'john',
    media_count: 3,
    playlist_media: [{ friendly_token: 'a' }, { friendly_token: 'b' }],
};

describe('components/media-page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        playlistViewStore.__reset({
            'enabled-loop': false,
            'enabled-shuffle': false,
            'saved-playlist': false,
            'saved-playlist-loop': false,
        });
    });

    describe('PlaylistView', () => {
        test('Starts expanded and collapses when the header toggle is clicked', () => {
            const { container, unmount } = renderIntoContainer(
                <PlaylistView playlistData={playlistData} activeItem={1} />
            );
            expect(container.querySelector('.playlist-view')?.className).toContain('playlist-expanded-view');
            click(container.querySelector('button.toggle-playlist-view'));
            expect(container.querySelector('.playlist-view')?.className).not.toContain('playlist-expanded-view');
            expect(container.querySelector('.mock-playlist-playback')).toBeNull();
            unmount();
        });

        test('Loop control forwards to PlaylistViewActions', () => {
            const { container, unmount } = renderIntoContainer(
                <PlaylistView playlistData={playlistData} activeItem={2} />
            );
            click(container.querySelector('.playlist-actions button'));
            expect((PlaylistViewActions as any).toggleLoop).toHaveBeenCalledTimes(1);
            unmount();
        });

        test('Loop store updates add page notifications', () => {
            const { unmount } = renderIntoContainer(<PlaylistView playlistData={playlistData} activeItem={1} />);
            playlistViewStore.__set('enabled-loop', true);
            act(() => {
                playlistViewStore.emit('loop-repeat-updated');
            });
            expect((PageActions as any).addNotification).toHaveBeenCalledWith('Playlist loop is on', 'loop-on');
            playlistViewStore.__set('enabled-loop', false);
            act(() => {
                playlistViewStore.emit('loop-repeat-updated');
            });
            expect((PageActions as any).addNotification).toHaveBeenCalledWith('Playlist loop is off', 'loop-off');
            unmount();
        });

        test('Shuffle and save store updates surface notifications', () => {
            const { unmount } = renderIntoContainer(<PlaylistView playlistData={playlistData} activeItem={1} />);
            playlistViewStore.__set('enabled-shuffle', true);
            act(() => {
                playlistViewStore.emit('shuffle-updated');
            });
            expect((PageActions as any).addNotification).toHaveBeenCalledWith('Playlist shuffle is on', 'shuffle-on');

            playlistViewStore.__set('saved-playlist', true);
            act(() => {
                playlistViewStore.emit('saved-updated');
            });
            expect((PageActions as any).addNotification).toHaveBeenCalledWith(
                'Added to playlists library',
                'added-to-playlists-lib'
            );
            unmount();
        });

        test('Renders playlist meta and playback list when expanded', () => {
            const { container, unmount } = renderIntoContainer(
                <PlaylistView playlistData={playlistData} activeItem={2} />
            );
            expect(container.querySelector('.playlist-title a')?.textContent).toBe('My list');
            expect(container.querySelector('.playlist-meta .counter')?.textContent).toBe('2 / 3');
            expect(container.querySelector('.mock-playlist-playback')).not.toBeNull();
            unmount();
        });
    });
});