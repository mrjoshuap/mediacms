import { testUnimplemented } from '../_support/unimplemented';

describe('unimplemented / stubbed features', () => {
    describe('VideoViewer encoding status', () => {
        testUnimplemented(
            'VideoViewer should show encoding-running error when encoding_status is "running" (today only "running_X" matches)'
        );
        testUnimplemented(
            'VideoViewer should show encoding-pending error when encoding_status is "pending" (today only "pending_X" matches)'
        );
    });

    describe('Audio viewer', () => {
        testUnimplemented(
            'MediaPage should route audio media to a dedicated AudioViewer (AudioViewer import is commented out; audio uses VideoViewer)'
        );
    });

    describe('Playlist page', () => {
        testUnimplemented('PlaylistPage should display playlist views count (views UI is commented out)');
    });

    describe('Home page', () => {
        testUnimplemented(
            'HomePage featured/recommended section titles should come from site config (titles are hardcoded via translateString)'
        );
    });

    describe('Upload', () => {
        testUnimplemented(
            'React should own the add-media upload workflow (entries/add-media.js mounts shell only; upload remains Django + Fine Uploader)'
        );
    });

    describe('Comment video markers', () => {
        testUnimplemented(
            'Comment timestamp links should seek the Video.js player via videojs-markers integration'
        );
    });

    describe('Bug-locking copy / settings', () => {
        testUnimplemented(
            'MediaPageStore network load error message should use Latin "An error" (today uses Greek Alpha "Αn error")'
        );
    });

    describe('Playlist list items', () => {
        testUnimplemented(
            'Generic MediaItem (image/pdf/attachment) should show playlist order number and remove options on playlist pages (today only video/audio items do)'
        );
    });
});
