import '../../../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer } from '../../../_support/render';
import { LayoutContext } from '../../../../src/static/js/utils/contexts/LayoutContext';
import { UserProvider } from '../../../../src/static/js/utils/contexts/UserContext';
import { PageHeader } from '../../../../src/static/js/components/page-layout/PageHeader/PageHeader';
import { PageStore } from '../../../../src/static/js/utils/stores/';

jest.mock('../../../../src/static/js/utils/stores/', () => require('../../../_support/compD_storeMocks').mockStoresModule());

jest.mock('../../../../src/static/js/components/page-layout/PageHeader/SearchField', () => ({
    SearchField: () => require('react').createElement('div', { className: 'mock-search-field' }),
}));
jest.mock('../../../../src/static/js/components/page-layout/PageHeader/HeaderLeft', () => ({
    HeaderLeft: () => require('react').createElement('div', { className: 'mock-header-left' }),
}));
jest.mock('../../../../src/static/js/components/page-layout/PageHeader/HeaderRight', () => ({
    HeaderRight: () => require('react').createElement('div', { className: 'mock-header-right' }),
}));

const pageStore = PageStore as any;

function renderHeader(layout: { visibleMobileSearch?: boolean } = {}) {
    return renderIntoContainer(
        <UserProvider>
            <LayoutContext.Provider
                value={{ visibleMobileSearch: !!layout.visibleMobileSearch, enabledSidebar: true } as any}
            >
                <PageHeader />
            </LayoutContext.Provider>
        </UserProvider>
    );
}

describe('components/page-layout/PageHeader', () => {
    let uploaderWrap: HTMLDivElement | null = null;

    beforeEach(() => {
        pageStore.__reset({
            'current-page': 'add-media',
            'config-contents': { uploader: { belowUploadArea: '<span class="upload-hint">Tip</span>' } },
        });
        uploaderWrap = document.createElement('div');
        uploaderWrap.className = 'media-uploader-wrap';
        document.body.appendChild(uploaderWrap);
    });

    afterEach(() => {
        uploaderWrap?.remove();
        uploaderWrap = null;
        document.querySelectorAll('.alert').forEach((el) => el.remove());
    });

    describe('PageHeader', () => {
        test('Composes header regions and applies layout classes', () => {
            const { container, unmount } = renderHeader({ visibleMobileSearch: true });
            const header = container.querySelector('header.page-header') as HTMLElement;
            expect(header.className).toBe('page-header mobile-search-field');
            expect(container.querySelector('.mock-header-left')).not.toBeNull();
            expect(container.querySelector('.mock-search-field')).not.toBeNull();
            expect(container.querySelector('.mock-header-right')).not.toBeNull();
            unmount();
        });

        test('Injects the pre-upload message on the add-media page', () => {
            const { unmount } = renderHeader();
            const msg = document.querySelector('.media-uploader-wrap .pre-upload-msg') as HTMLElement;
            expect(msg).not.toBeNull();
            expect(msg.querySelector('.upload-hint')?.textContent).toBe('Tip');
            unmount();
        });

        test('Skips uploader messaging when not on the upload page', () => {
            pageStore.__set('current-page', 'home');
            const { unmount } = renderHeader();
            expect(document.querySelector('.media-uploader-wrap .pre-upload-msg')).toBeNull();
            unmount();
        });
    });
});