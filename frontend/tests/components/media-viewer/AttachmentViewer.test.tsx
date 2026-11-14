import '../../_support/setupMediaCMS';
import React from 'react';
import { renderIntoContainer } from '../../_support/render';
import AttachmentViewer from '../../../src/static/js/components/media-viewer/AttachmentViewer';

describe('components/media-viewer/AttachmentViewer', () => {
    test('Renders the attachment viewer shell with a file icon', () => {
        const { container, unmount } = renderIntoContainer(<AttachmentViewer />);
        expect(container.querySelector('.viewer-attachment-container')).not.toBeNull();
        expect(container.querySelector('.player-container-inner')).not.toBeNull();
        expect(container.querySelector('i.material-icons')?.textContent).toBe('insert_drive_file');
        unmount();
    });
});