import '../../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer, act } from '../../_support/render';
import { changeValue, click } from '../../_support/compD_dom';
import { MediaPageStore } from '../../../src/static/js/utils/stores/';
import { MediaPageActions } from '../../../src/static/js/utils/actions/';
import ViewerPassword from '../../../src/static/js/components/media-page/ViewerPassword';

jest.mock('../../../src/static/js/utils/stores/', () => require('../../_support/compD_storeMocks').mockStoresModule());
jest.mock('../../../src/static/js/utils/actions/', () =>
    require('../../_support/compD_storeMocks').mockActionsModule()
);

const mediaStore = MediaPageStore as any;

describe('components/media-page/ViewerPassword', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mediaStore.__reset({
            'password-unlocking': false,
            'password-unlock-error': null,
            'password-media-title': null,
        });
    });

    test('Shows default Password required label when no title is set', () => {
        const { container, unmount } = renderIntoContainer(<ViewerPassword />);
        expect(container.querySelector('.msg-wrap')?.textContent).toBe('Password required');
        expect(container.querySelector('.material-icons')?.textContent).toBe('lock');
        unmount();
    });

    test('Shows the media title from the store when present', () => {
        mediaStore.__set('password-media-title', 'Secret clip');
        const { container, unmount } = renderIntoContainer(<ViewerPassword />);
        expect(container.querySelector('.msg-wrap')?.textContent).toBe('Secret clip');
        unmount();
    });

    test('Submit with a password calls unlockMediaPassword', () => {
        const { container, unmount } = renderIntoContainer(<ViewerPassword />);
        const input = container.querySelector('input[type="password"]') as HTMLInputElement;
        changeValue(input, 's3cret');
        click(container.querySelector('button[type="submit"]'));
        expect((MediaPageActions as any).unlockMediaPassword).toHaveBeenCalledWith('s3cret');
        unmount();
    });

    test('Empty password leaves the submit button disabled and does not unlock', () => {
        const { container, unmount } = renderIntoContainer(<ViewerPassword />);
        const button = container.querySelector('button[type="submit"]') as HTMLButtonElement;
        expect(button.disabled).toBe(true);
        click(button);
        expect((MediaPageActions as any).unlockMediaPassword).not.toHaveBeenCalled();
        unmount();
    });

    test('Pending unlock shows Unlocking state and disables the form', () => {
        const { container, unmount } = renderIntoContainer(<ViewerPassword />);
        changeValue(container.querySelector('input[type="password"]'), 'x');
        act(() => {
            mediaStore.emit('media_password_unlock_pending');
        });
        expect(container.querySelector('button[type="submit"]')?.textContent).toBe('Unlocking...');
        expect((container.querySelector('input[type="password"]') as HTMLInputElement).disabled).toBe(true);
        unmount();
    });

    test('Failed unlock shows the store error message', () => {
        const { container, unmount } = renderIntoContainer(<ViewerPassword />);
        mediaStore.__set('password-unlock-error', 'Incorrect password');
        act(() => {
            mediaStore.emit('media_password_unlock_failed');
        });
        expect(container.querySelector('.media-password-error')?.textContent).toBe('Incorrect password');
        expect(container.querySelector('button[type="submit"]')?.textContent).toBe('Unlock');
        unmount();
    });
});
