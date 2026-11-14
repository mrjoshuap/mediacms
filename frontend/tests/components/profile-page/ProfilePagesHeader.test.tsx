import '../../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer, act } from '../../_support/render';
import { changeValue, click, flush } from '../../_support/compD_dom';
import ProfilePagesHeader from '../../../src/static/js/components/profile-page/ProfilePagesHeader';
import { PageStore, ProfilePageStore } from '../../../src/static/js/utils/stores/';

jest.mock('../../../src/static/js/utils/stores/', () => require('../../_support/compD_storeMocks').mockStoresModule());

const pageStore = PageStore as any;
const profileStore = ProfilePageStore as any;

const author = {
    name: 'John',
    thumbnail_url: '/john.png',
    banner_thumbnail_url: null,
};

describe('components/profile-page', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        pageStore.__reset({
            'config-options': { pages: { profile: { includeHistory: true, includeLikedMedia: true } } },
            'config-enabled': {
                pages: { history: { title: 'History' }, liked: { title: 'Liked' } },
            },
        });
        profileStore.__reset({
            'author-data': {
                username: 'john',
                edit_url: '/user/john/edit',
                default_channel_edit_url: '/channel/edit',
            },
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('ProfilePagesHeader', () => {
        test('Author tabs include shared sections and playlists', () => {
            const { container, unmount } = renderIntoContainer(
                <ProfilePagesHeader type="media" author={author} onQueryChange={jest.fn()} />
            );
            const labels = Array.from(container.querySelectorAll('.profile-nav a')).map((a) => a.textContent);
            expect(labels).toEqual(
                expect.arrayContaining(['About', 'Media I own', 'Shared by me', 'Shared with me', 'Playlists', 'History', 'Liked'])
            );
            unmount();
        });

        test('Profile search only notifies after three characters or when cleared', async () => {
            const onQueryChange = jest.fn();
            const { container, unmount } = renderIntoContainer(
                <ProfilePagesHeader type="media" author={author} onQueryChange={onQueryChange} />
            );
            const searchToggle = container.querySelector('li.media-search > span') as HTMLElement;
            click(searchToggle);
            const input = container.querySelector('.media-search input[name="aq"]') as HTMLInputElement;
            changeValue(input, 'ab');
            act(() => {
                jest.advanceTimersByTime(150);
            });
            expect(onQueryChange).not.toHaveBeenCalled();

            changeValue(input, 'abc');
            act(() => {
                jest.advanceTimersByTime(150);
            });
            await flush();
            expect(onQueryChange).toHaveBeenLastCalledWith('abc');

            changeValue(input, '');
            act(() => {
                jest.advanceTimersByTime(150);
            });
            await flush();
            expect(onQueryChange).toHaveBeenLastCalledWith('');
            unmount();
        });
    });
});