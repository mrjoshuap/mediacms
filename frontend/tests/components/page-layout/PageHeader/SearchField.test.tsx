import '../../../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer, act } from '../../../_support/render';
import { changeValue, click, flush } from '../../../_support/compD_dom';
import { LayoutContext } from '../../../../src/static/js/utils/contexts/LayoutContext';
import { UserProvider } from '../../../../src/static/js/utils/contexts/UserContext';
import { SearchField } from '../../../../src/static/js/components/page-layout/PageHeader/SearchField';
import { PageStore, SearchFieldStore } from '../../../../src/static/js/utils/stores/';
import { SearchFieldActions } from '../../../../src/static/js/utils/actions/';
import { linksConfig } from '../../../../src/static/js/utils/contexts/';

jest.mock('../../../../src/static/js/utils/stores/', () => require('../../../_support/compD_storeMocks').mockStoresModule());
jest.mock('../../../../src/static/js/utils/actions/', () =>
    require('../../../_support/compD_storeMocks').mockActionsModule()
);

const searchStore = SearchFieldStore as any;

function renderSearchField(layout: { visibleMobileSearch?: boolean } = {}) {
    return renderIntoContainer(
        <UserProvider>
            <LayoutContext.Provider
                value={{ visibleMobileSearch: !!layout.visibleMobileSearch, enabledSidebar: true } as any}
            >
                <SearchField />
            </LayoutContext.Provider>
        </UserProvider>
    );
}

describe('components/page-layout/PageHeader', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        searchStore.__reset({ 'search-query': '' });
    });

    describe('SearchField', () => {
        test('Typing a non-empty query requests predictions', () => {
            const { container, unmount } = renderSearchField();
            changeValue(container.querySelector('input[type="text"]') as HTMLInputElement, 'cats');
            expect((SearchFieldActions as any).requestPredictions).toHaveBeenCalledWith('cats');
            unmount();
        });

        test('Empty prediction results hide the predictions list', () => {
            const { container, unmount } = renderSearchField();
            changeValue(container.querySelector('input[type="text"]') as HTMLInputElement, 'x');
            act(() => {
                searchStore.emit('load_predictions', 'x', []);
            });
            expect(container.querySelectorAll('.search-predictions-item').length).toBe(0);
            unmount();
        });

        test('Selecting a prediction submits the search form', () => {
            jest.useFakeTimers();
            const submitSpy = jest.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});
            const { container, unmount } = renderSearchField();
            changeValue(container.querySelector('input[type="text"]') as HTMLInputElement, 'demo');
            act(() => {
                searchStore.emit('load_predictions', 'demo', ['demo video', 'demonstration']);
            });
            expect(container.querySelectorAll('.search-predictions-item').length).toBe(2);
            click(container.querySelector('.search-predictions-item'));
            act(() => {
                jest.advanceTimersByTime(50);
            });
            expect(submitSpy).toHaveBeenCalled();
            submitSpy.mockRestore();
            jest.useRealTimers();
            unmount();
        });

        test('Submit button does not block a non-empty query', () => {
            const { container, unmount } = renderSearchField();
            const form = container.querySelector('form') as HTMLFormElement;
            changeValue(container.querySelector('input[type="text"]') as HTMLInputElement, 'hello');
            expect(form.getAttribute('action')).toBe(linksConfig.search.base);
            const prevented = !form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            expect(prevented).toBe(false);
            unmount();
        });

        test('Whitespace-only query is blocked on submit', () => {
            const submitSpy = jest.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});
            const { container, unmount } = renderSearchField();
            const form = container.querySelector('form') as HTMLFormElement;
            changeValue(container.querySelector('input[type="text"]') as HTMLInputElement, '   ');
            const prevented = !form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            expect(prevented).toBe(true);
            expect(submitSpy).not.toHaveBeenCalled();
            submitSpy.mockRestore();
            unmount();
        });

        test('Shows prediction items when the store loads matches', async () => {
            const { container, unmount } = renderSearchField();
            changeValue(container.querySelector('input[type="text"]') as HTMLInputElement, 'vid');
            act(() => {
                searchStore.emit('load_predictions', 'vid', ['video one']);
                PageStore.emit('window_resize');
            });
            await flush();
            expect(container.querySelector('.search-predictions-item')?.textContent).toBe('video one');
            unmount();
        });
    });
});