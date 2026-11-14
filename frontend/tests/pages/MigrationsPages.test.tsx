import '../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer, act } from '../_support/render';
import { click } from '../_support/compD_dom';
import { MigrationsPage } from '../../src/static/js/pages/MigrationsPage';
import { MigrationNewPage } from '../../src/static/js/pages/MigrationNewPage';
import { MigrationDetailPage } from '../../src/static/js/pages/MigrationDetailPage';
import { MigrationEditPage } from '../../src/static/js/pages/MigrationEditPage';

jest.mock('../../src/static/js/utils/api/migrations.js', () => ({
    listMigrations: jest.fn(),
    controlMigration: jest.fn(),
    deleteMigration: jest.fn(),
    getMigration: jest.fn(),
    getProgress: jest.fn(),
    getRecords: jest.fn(),
    createMigration: jest.fn(),
    updateMigration: jest.fn(),
    getServerTime: jest.fn(),
    listLtiPlatforms: jest.fn(),
    checkConnection: jest.fn(),
    checkSavedConnection: jest.fn(),
    listSavedSourceCategories: jest.fn(),
    listSavedSourceRoles: jest.fn(),
    listSourceCategories: jest.fn(),
    listSourceRoles: jest.fn(),
}));
jest.mock('../../src/static/js/pages/_Page', () => {
    const React = require('react');
    class Page extends React.Component {
        constructor(props: unknown, _pageId?: string) {
            super(props as object);
        }
        render() {
            return <div className="mock-page">{(this as { pageContent?: () => React.ReactNode }).pageContent?.()}</div>;
        }
    }
    return { Page };
});

const api = require('../../src/static/js/utils/api/migrations.js');
const { listMigrations, controlMigration, deleteMigration, getMigration, getProgress, getRecords } = api;

describe('pages/Migrations*', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        (window as any).MIGRATION_ID = 7;
        (window as any).MIGRATION_PROVIDER = 'kaltura';
        listMigrations.mockResolvedValue({ data: { results: [] } });
        controlMigration.mockResolvedValue({});
        deleteMigration.mockResolvedValue({});
        getMigration.mockResolvedValue({
            data: { id: 7, name: 'Detail mig', provider: 'kaltura', status: 'pending', connection: {}, options: {}, totals: {} },
        });
        getProgress.mockResolvedValue({ data: { totals: {} } });
        getRecords.mockResolvedValue({ data: { results: [], count: 0 } });
        api.getServerTime.mockResolvedValue({ data: { now: '2024-01-01T00:00:00Z' } });
        api.listLtiPlatforms.mockResolvedValue({ data: [] });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('MigrationsPage shows loading then empty list', async () => {
        const { container, unmount } = renderIntoContainer(<MigrationsPage />);
        expect(container.textContent).toMatch(/Loading|loading/i);
        await act(async () => {
            await Promise.resolve();
        });
        expect(listMigrations).toHaveBeenCalled();
        unmount();
    });

    test('MigrationsPage shows error when list fails', async () => {
        listMigrations.mockRejectedValueOnce(new Error('boom'));
        const { container, unmount } = renderIntoContainer(<MigrationsPage />);
        await act(async () => {
            await Promise.resolve();
        });
        expect(container.textContent).toContain('Could not load migrations');
        unmount();
    });

    test('MigrationsPage renders rows and primary start action', async () => {
        listMigrations.mockResolvedValueOnce({
            data: {
                results: [
                    {
                        id: 1,
                        name: 'Kaltura import',
                        provider: 'kaltura',
                        status: 'pending',
                        totals: { media_discovered: 10, media_migrated: 0, media_skipped: 0, media_failed: 0 },
                        connection: {},
                        options: {},
                    },
                ],
            },
        });
        const { container, unmount } = renderIntoContainer(<MigrationsPage />);
        await act(async () => {
            await Promise.resolve();
        });
        expect(container.textContent).toContain('Kaltura import');
        const startBtn = container.querySelector('button[aria-label="Start"]');
        expect(startBtn).toBeTruthy();
        await act(async () => {
            click(startBtn!);
            await Promise.resolve();
        });
        expect(controlMigration).toHaveBeenCalledWith(1, 'start');
        unmount();
    });

    test('MigrationNewPage lists providers including experimental badges', () => {
        const { container, unmount } = renderIntoContainer(<MigrationNewPage />);
        expect(container.textContent).toMatch(/Kaltura/i);
        expect(container.textContent).toMatch(/Panopto|YouTube/i);
        expect(container.textContent).toMatch(/experimental/i);
        unmount();
    });

    test('MigrationDetailPage loads migration and shows its name', async () => {
        const { container, unmount } = renderIntoContainer(<MigrationDetailPage />);
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(getMigration).toHaveBeenCalledWith(7);
        expect(container.textContent).toContain('Detail mig');
        unmount();
    });

    test('MigrationDetailPage shows error when migration is missing', async () => {
        getMigration.mockRejectedValueOnce({ response: { status: 404 } });
        const { container, unmount } = renderIntoContainer(<MigrationDetailPage />);
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(container.textContent).toContain('That migration no longer exists.');
        unmount();
    });

    test('MigrationEditPage mounts the Kaltura connection form for a new migration', async () => {
        window.history.replaceState(null, '', '/migrations/new/kaltura');
        const { container, unmount } = renderIntoContainer(<MigrationEditPage />);
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(container.textContent).toMatch(/Service URL|Partner ID|App token/i);
        unmount();
        window.history.replaceState(null, '', '/');
    });
});
