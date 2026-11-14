import '../../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer } from '../../_support/render';
import { click } from '../../_support/compD_dom';
import { PlaylistsSelection } from '../../../src/static/js/components/playlists-selection/PlaylistsSelection';
import { MediaPageStore } from '../../../src/static/js/utils/stores/';
import { MediaPageActions } from '../../../src/static/js/utils/actions/';

jest.mock('../../../src/static/js/utils/stores/', () => require('../../_support/compD_storeMocks').mockStoresModule());
jest.mock('../../../src/static/js/utils/actions/', () => require('../../_support/compD_storeMocks').mockActionsModule());

const mediaStore = MediaPageStore as any;

describe('components/playlists-selection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mediaStore.__reset({
            'media-id': 'tok1',
            playlists: [
                { playlist_id: 'pl-a', title: 'Favorites', status: 'public', media_list: ['tok1'] },
                { playlist_id: 'pl-b', title: 'Watch later', status: 'private', media_list: [] },
            ],
        });
    });

    describe('PlaylistsSelection', () => {
        test('Renders playlist rows with membership reflected in checkboxes', () => {
            const { container, unmount } = renderIntoContainer(<PlaylistsSelection />);
            const labels = Array.from(container.querySelectorAll('.saveto-select label'));
            expect(labels.map((l) => l.textContent)).toEqual(['Favorites', 'Watch later']);
            expect((labels[0].querySelector('input') as HTMLInputElement).checked).toBe(true);
            expect((labels[1].querySelector('input') as HTMLInputElement).checked).toBe(false);
            unmount();
        });

        test('Unchecking removes media from a playlist', () => {
            const { container, unmount } = renderIntoContainer(<PlaylistsSelection />);
            click(container.querySelector('.saveto-select label input'));
            expect((MediaPageActions as any).removeMediaFromPlaylist).toHaveBeenCalledWith('pl-a', 'tok1');
            unmount();
        });

        test('Checking adds media to a playlist', () => {
            const { container, unmount } = renderIntoContainer(<PlaylistsSelection />);
            const inputs = container.querySelectorAll('.saveto-select label input');
            click(inputs[1]);
            expect((MediaPageActions as any).addMediaToPlaylist).toHaveBeenCalledWith('pl-b', 'tok1');
            unmount();
        });

        test('Close button calls triggerPopupClose when provided', () => {
            const triggerPopupClose = jest.fn();
            const { container, unmount } = renderIntoContainer(
                <PlaylistsSelection triggerPopupClose={triggerPopupClose} />
            );
            click(container.querySelector('.saveto-title button'));
            expect(triggerPopupClose).toHaveBeenCalledTimes(1);
            unmount();
        });
    });
});