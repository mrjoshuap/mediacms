import '../../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer } from '../../_support/render';
import { UserProvider, UserContext } from '../../../src/static/js/utils/contexts/UserContext';
import { SidebarContext } from '../../../src/static/js/utils/contexts/SidebarContext';
import { LayoutContext } from '../../../src/static/js/utils/contexts/LayoutContext';
import { ThemeContext } from '../../../src/static/js/utils/contexts/ThemeContext';
import { SidebarNavigationMenu } from '../../../src/static/js/components/page-layout/sidebar/SidebarNavigationMenu';
import { PageSidebar } from '../../../src/static/js/components/page-layout/PageSidebar';
import PageStore from '../../../src/static/js/utils/stores/PageStore';

function classes(container: HTMLElement) {
    return Array.from(container.querySelectorAll('li')).map((li) =>
        li.className.split(' ').find((c) => c.startsWith('nav-item-'))
    );
}

describe('components/page-layout', () => {
    afterEach(() => {
        window.history.replaceState(null, '', '/');
    });

    describe('SidebarNavigationMenu', () => {
        test('Lists sections for a signed in admin from the page config', () => {
            const { container, unmount } = renderIntoContainer(
                <UserProvider>
                    <SidebarNavigationMenu />
                </UserProvider>
            );
            expect(classes(container)).toEqual([
                'nav-item-home',
                'nav-item-featured',
                'nav-item-recommended',
                'nav-item-latest',
                'nav-item-tags',
                'nav-item-categories',
                'nav-item-members',
                'nav-item-upload-media',
                'nav-item-my-media',
                'nav-item-my-playlists',
                'nav-item-history',
                'nav-item-liked',
                'nav-item-about',
                'nav-item-terms',
                'nav-item-contact',
                'nav-item-language',
                'nav-item-manage-media',
                'nav-item-manage-users',
                'nav-item-manage-comments',
            ]);
            expect(container.querySelector('.nav-item-manage-users a')?.getAttribute('href')).toBe('/manage/users');
            unmount();
        });

        test('Marks the current page link active', () => {
            window.history.replaceState(null, '', '/tags');
            const { container, unmount } = renderIntoContainer(
                <UserProvider>
                    <SidebarNavigationMenu />
                </UserProvider>
            );
            expect(container.querySelector('.nav-item-tags')?.className).toContain('active');
            expect(container.querySelector('.nav-item-home')?.className).not.toContain('active');
            unmount();
        });

        test('Marks the home link active on the home page', () => {
            window.history.replaceState(null, '', '/');
            const { container, unmount } = renderIntoContainer(
                <UserProvider>
                    <SidebarNavigationMenu />
                </UserProvider>
            );
            expect(container.querySelector('.nav-item-home')?.className).toContain('active');
            expect(container.querySelector('.nav-item-tags')?.className).not.toContain('active');
            unmount();
        });

        test('Places links in sidebar sections and keeps HTML slots out of the menu', () => {
            const sidebar = PageStore.get('config-contents').sidebar;
            const previous = {
                extra: sidebar.mainMenuExtra.items.slice(),
                library: (sidebar.libraryItems || []).slice(),
                personal: (sidebar.personalItems || []).slice(),
                info: (sidebar.infoItems || []).slice(),
                manage: (sidebar.manageItems || []).slice(),
            };
            const item = (text: string, link: string, className: string) => ({
                text,
                link,
                icon: 'article',
                className,
            });
            sidebar.mainMenuExtra.items = [item('Handbook', '/handbook', 'nav-item-cms-page-handbook')];
            sidebar.libraryItems = [item('Drafts', '/drafts', 'nav-item-cms-page-drafts')];
            sidebar.personalItems = [item('Notes', '/notes', 'nav-item-cms-page-notes')];
            sidebar.infoItems = [item('Guide', '/guide', 'nav-item-cms-page-guide')];
            sidebar.manageItems = [item('Policy', '/policy', 'nav-item-cms-page-policy')];

            const signedIn = renderIntoContainer(
                <UserProvider>
                    <SidebarNavigationMenu />
                </UserProvider>
            );
            const signedInClasses = classes(signedIn.container);
            expect(signedInClasses.indexOf('nav-item-members')).toBeLessThan(
                signedInClasses.indexOf('nav-item-cms-page-handbook')
            );
            expect(signedInClasses.indexOf('nav-item-my-playlists')).toBeLessThan(
                signedInClasses.indexOf('nav-item-cms-page-drafts')
            );
            expect(signedInClasses.indexOf('nav-item-liked')).toBeLessThan(
                signedInClasses.indexOf('nav-item-cms-page-notes')
            );
            expect(signedInClasses.indexOf('nav-item-language')).toBeLessThan(
                signedInClasses.indexOf('nav-item-cms-page-guide')
            );
            expect(signedInClasses.indexOf('nav-item-manage-comments')).toBeLessThan(
                signedInClasses.indexOf('nav-item-cms-page-policy')
            );
            expect(signedIn.container.textContent).not.toContain('under the menu');
            signedIn.unmount();

            const anonymousUser = { isAnonymous: true, userCan: { canSeeMembersPage: false }, pages: {} };
            const anonymous = renderIntoContainer(
                <UserContext.Provider value={anonymousUser as any}>
                    <SidebarNavigationMenu />
                </UserContext.Provider>
            );
            const anonymousClasses = classes(anonymous.container);
            expect(anonymousClasses).toContain('nav-item-cms-page-handbook');
            expect(anonymousClasses).toContain('nav-item-cms-page-guide');
            expect(anonymousClasses).not.toContain('nav-item-cms-page-drafts');
            expect(anonymousClasses).not.toContain('nav-item-cms-page-notes');
            expect(anonymousClasses).not.toContain('nav-item-cms-page-policy');
            anonymous.unmount();

            sidebar.mainMenuExtra.items = previous.extra;
            sidebar.libraryItems = previous.library;
            sidebar.personalItems = previous.personal;
            sidebar.infoItems = previous.info;
            sidebar.manageItems = previous.manage;
        });

        test('Respects sidebar hide flags and anonymous users', () => {
            const user = { isAnonymous: true, userCan: { canSeeMembersPage: false }, pages: {} };
            const { container, unmount } = renderIntoContainer(
                <UserContext.Provider value={user as any}>
                    <SidebarContext.Provider
                        value={{ hideHomeLink: true, hideTagsLink: true, hideCategoriesLink: true } as any}
                    >
                        <SidebarNavigationMenu />
                    </SidebarContext.Provider>
                </UserContext.Provider>
            );
            expect(classes(container)).toEqual([
                'nav-item-featured',
                'nav-item-recommended',
                'nav-item-latest',
                'nav-item-history',
                'nav-item-about',
                'nav-item-terms',
                'nav-item-contact',
                'nav-item-language',
            ]);
            unmount();
        });
    });

    describe('PageSidebar', () => {
        test('Renders sidebar sections', () => {
            jest.useFakeTimers();
            const { container, unmount } = renderIntoContainer(
                <UserProvider>
                    <LayoutContext.Provider value={{ visibleSidebar: true, toggleSidebar: jest.fn() } as any}>
                        <ThemeContext.Provider
                            value={
                                {
                                    currentThemeMode: 'light',
                                    changeThemeMode: jest.fn(),
                                    themeModeSwitcher: { enabled: true, position: 'sidebar' },
                                } as any
                            }
                        >
                            <PageSidebar />
                        </ThemeContext.Provider>
                    </LayoutContext.Provider>
                </UserProvider>
            );
            expect(container.querySelector('.page-sidebar')?.className).toContain('page-sidebar');
            expect(container.querySelector('.sidebar-theme-switcher')).not.toBeNull();
            expect(container.querySelector('.page-sidebar-bottom')?.textContent).toBe('Powered by MediaCMS');
            expect(container.querySelector('.nav-item-home')).not.toBeNull();
            jest.runOnlyPendingTimers();
            unmount();
            jest.clearAllTimers();
            jest.useRealTimers();
        });
    });
});
