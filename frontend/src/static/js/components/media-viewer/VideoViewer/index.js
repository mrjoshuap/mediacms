import React from 'react';
import { MediaPageActions, VideoViewerActions } from '../../../utils/actions/';
import { siteConfig, SiteConsumer } from '../../../utils/contexts/';
import { PageStore, MediaPageStore, VideoViewerStore } from '../../../utils/stores/';
import { addClassname, removeClassname, formatInnerLink, inEmbeddedApp } from '../../../utils/helpers/';
import { BrowserCache, UpNextLoaderView, MediaDurationInfo } from '../../../utils/classes/';
import {
    orderedSupportedVideoFormats,
    videoAvailableCodecsAndResolutions,
    extractDefaultVideoResolution,
} from './functions';
// import { VideoPlayer, VideoPlayerError } from '../../video-player/VideoPlayer';
import VideoJSEmbed from '../../VideoJS/VideoJSEmbed';

function extractMediaIdFromUrl(url) {
    if (!url || 'string' !== typeof url) {
        return null;
    }

    try {
        const parsed = new URL(url, window.location.origin);
        return parsed.searchParams.get('m');
    } catch (_e) {
        const match = String(url).match(/[?&]m=([^&]+)/);
        return match ? decodeURIComponent(match[1]) : null;
    }
}

function firstPlayableRelatedUrl(related) {
    if (!related || !related.length) {
        return null;
    }

    let i = 0;
    while (i < related.length) {
        const item = related[i];
        if (item && ('video' === item.media_type || 'audio' === item.media_type) && item.url) {
            return item.url;
        }
        i += 1;
    }

    // Fall back to first related item so hard-nav can still open non-AV media.
    return related[0].url || null;
}

function resolveNextLinkUrl() {
    const playlistId = MediaPageStore.get('playlist-id');
    let nextLink = null;

    if (playlistId) {
        nextLink = MediaPageStore.get('playlist-next-media-url');
        if (null === nextLink) {
            nextLink = firstPlayableRelatedUrl(MediaPageStore.get('media-data')?.related_media);
        }
    } else {
        nextLink = firstPlayableRelatedUrl(MediaPageStore.get('media-data')?.related_media);
    }

    return nextLink;
}

function resolvePreviousLinkUrl() {
    const playlistId = MediaPageStore.get('playlist-id');
    let previousLink = null;

    if (playlistId) {
        previousLink = MediaPageStore.get('playlist-previous-media-url');
        if (null === previousLink) {
            previousLink = firstPlayableRelatedUrl(MediaPageStore.get('media-data')?.related_media);
        }
    } else {
        previousLink = firstPlayableRelatedUrl(MediaPageStore.get('media-data')?.related_media);
    }

    return previousLink;
}

function filterVideoEncoding(encoding_status) {
    switch (encoding_status) {
        case 'running_X':
            MediaPageStore.set('media-load-error-type', 'encodingRunning');
            MediaPageStore.set(
                'media-load-error-message',
                'Media encoding is currently running. Try again in few minutes.'
            );
            break;
        case 'pending_X':
            MediaPageStore.set('media-load-error-type', 'encodingPending');
            MediaPageStore.set('media-load-error-message', 'Media encoding is pending');
            break;
        case 'fail':
            MediaPageStore.set('media-load-error-type', 'encodingFailed');
            MediaPageStore.set('media-load-error-message', 'Media encoding failed');
            break;
    }
}

export default class VideoViewer extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            displayPlayer: false,
        };

        this.videoSources = [];

        filterVideoEncoding(this.props.data.encoding_status);

        if (null !== MediaPageStore.get('media-load-error-type')) {
            this.state.displayPlayer = true;
            return;
        }

        if ('string' === typeof this.props.data.poster_url) {
            this.videoPoster = formatInnerLink(this.props.data.poster_url, this.props.siteUrl);
        } else if ('string' === typeof this.props.data.thumbnail_url) {
            this.videoPoster = formatInnerLink(this.props.data.thumbnail_url, this.props.siteUrl);
        }

        this.videoInfo = videoAvailableCodecsAndResolutions(this.props.data.encodings_info, this.props.data.hls_info);

        const resolutionsKeys = Object.keys(this.videoInfo);

        if (!resolutionsKeys.length) {
            this.videoInfo = null;
        } else {
            let defaultResolution = VideoViewerStore.get('video-quality');

            if (null === defaultResolution || ('Auto' === defaultResolution && void 0 === this.videoInfo['Auto'])) {
                defaultResolution = 720; // Default resolution.
            }

            let defaultVideoResolution = extractDefaultVideoResolution(defaultResolution, this.videoInfo);

            if ('Auto' === defaultResolution && void 0 !== this.videoInfo['Auto']) {
                this.videoSources.push({ src: this.videoInfo['Auto'].url[0] });
            }

            const supportedFormats = orderedSupportedVideoFormats();

            let srcUrl, k;

            k = 0;
            while (k < this.videoInfo[defaultVideoResolution].format.length) {
                if ('hls' === this.videoInfo[defaultVideoResolution].format[k]) {
                    this.videoSources.push({
                        src: this.videoInfo[defaultVideoResolution].url[k],
                    });
                    break;
                }
                k += 1;
            }

            for (k in this.props.data.encodings_info[defaultVideoResolution]) {
                if (this.props.data.encodings_info[defaultVideoResolution].hasOwnProperty(k)) {
                    if (supportedFormats.support[k]) {
                        srcUrl = this.props.data.encodings_info[defaultVideoResolution][k].url;

                        if (srcUrl) {
                            srcUrl = formatInnerLink(srcUrl, this.props.siteUrl);

                            this.videoSources.push({
                                src: srcUrl /*.replace("http://", "//").replace("https://", "//")*/,
                                encodings_status: this.props.data.encodings_info[defaultVideoResolution][k].status,
                            });
                        }
                    }
                }
            }

            // console.log( supportedFormats );
            // console.log( this.videoInfo );
            // console.log( defaultVideoResolution );
            // console.log( this.videoSources );
        }

        if (this.videoSources.length) {
            if (
                !this.props.inEmbed &&
                1 === this.videoSources.length &&
                'running' === this.videoSources[0].encodings_status
            ) {
                MediaPageStore.set('media-load-error-type', 'encodingRunning');
                MediaPageStore.set(
                    'media-load-error-message',
                    'Media encoding is currently running. Try again in few minutes.'
                );
                return;
            }
        } else {
            switch (MediaPageStore.get('media-load-error-type')) {
                case 'encodingRunning':
                case 'encodingPending':
                case 'encodingFailed':
                    break;
                default:
                    console.warn('VIDEO DEBUG:', "Video files don't exist");
            }
        }

        PageStore.on('switched_media_auto_play', this.onUpdateMediaAutoPlay.bind(this));

        this.browserCache = new BrowserCache(siteConfig.id, 86400); // Keep cache data "fresh" for one day.

        const _MediaDurationInfo = new MediaDurationInfo();

        _MediaDurationInfo.update(this.props.data.duration);

        this.durationISO8601 = _MediaDurationInfo.ISO8601();

        this.playerElem = null;

        this.playerInstance = null;

        this.onPlayerInit = this.onPlayerInit.bind(this);

        this.onClickNext = this.onClickNext.bind(this);
        this.onClickPrevious = this.onClickPrevious.bind(this);
        this.onStateUpdate = this.onStateUpdate.bind(this);
        this.onSoftNavMediaLoaded = this.onSoftNavMediaLoaded.bind(this);
        this.onSoftNavMediaError = this.onSoftNavMediaError.bind(this);

        this.pendingSoftNavUrl = null;
        this.softNavInProgress = false;
    }

    buildSourcesFromData(data, siteUrl) {
        const videoSources = [];
        const videoInfo = videoAvailableCodecsAndResolutions(data.encodings_info, data.hls_info);
        const resolutionsKeys = Object.keys(videoInfo);

        if (!resolutionsKeys.length) {
            return { videoSources, videoInfo: null, videoPoster: null };
        }

        let defaultResolution = VideoViewerStore.get('video-quality');

        if (null === defaultResolution || ('Auto' === defaultResolution && void 0 === videoInfo['Auto'])) {
            defaultResolution = 720;
        }

        const defaultVideoResolution = extractDefaultVideoResolution(defaultResolution, videoInfo);

        if ('Auto' === defaultResolution && void 0 !== videoInfo['Auto']) {
            videoSources.push({ src: videoInfo['Auto'].url[0] });
        }

        const supportedFormats = orderedSupportedVideoFormats();
        let srcUrl;
        let k = 0;

        while (k < videoInfo[defaultVideoResolution].format.length) {
            if ('hls' === videoInfo[defaultVideoResolution].format[k]) {
                videoSources.push({
                    src: videoInfo[defaultVideoResolution].url[k],
                });
                break;
            }
            k += 1;
        }

        if (data.encodings_info && data.encodings_info[defaultVideoResolution]) {
            for (k in data.encodings_info[defaultVideoResolution]) {
                if (data.encodings_info[defaultVideoResolution].hasOwnProperty(k)) {
                    if (supportedFormats.support[k]) {
                        srcUrl = data.encodings_info[defaultVideoResolution][k].url;

                        if (srcUrl) {
                            srcUrl = formatInnerLink(srcUrl, siteUrl);
                            videoSources.push({
                                src: srcUrl,
                                encodings_status: data.encodings_info[defaultVideoResolution][k].status,
                            });
                        }
                    }
                }
            }
        }

        let videoPoster = null;
        if ('string' === typeof data.poster_url) {
            videoPoster = formatInnerLink(data.poster_url, siteUrl);
        } else if ('string' === typeof data.thumbnail_url) {
            videoPoster = formatInnerLink(data.thumbnail_url, siteUrl);
        }

        return { videoSources, videoInfo, videoPoster };
    }

    componentDidMount() {
        MediaPageStore.on('loaded_media_data', this.onSoftNavMediaLoaded);
        MediaPageStore.on('loaded_media_error', this.onSoftNavMediaError);

        if (this.videoSources.length) {
            this.upNextLoaderView =
                !this.props.inEmbed && this.props.data.related_media.length
                    ? new UpNextLoaderView(this.props.data.related_media[0])
                    : null;

            let topLeftHtml = null;

            if (this.props.inEmbed) {
                let titleLink = document.createElement('a');
                let userThumbLink = document.createElement('a');

                topLeftHtml = document.createElement('div');
                topLeftHtml.setAttribute('class', 'media-links-top-left');

                const linkTarget =
                    inEmbeddedApp() || window.location.href.indexOf('lms_embed_mode') > -1 ? '_self' : '_blank';

                if (titleLink) {
                    titleLink.setAttribute('class', 'title-link');
                    titleLink.setAttribute('href', this.props.data.url || '#');
                    titleLink.setAttribute('target', linkTarget);
                    titleLink.setAttribute('title', this.props.data.title);
                    titleLink.innerHTML = this.props.data.title;
                }

                if (userThumbLink) {
                    userThumbLink.setAttribute('class', 'user-thumb-link');
                    userThumbLink.setAttribute(
                        'href',
                        formatInnerLink(this.props.data.author_profile, this.props.siteUrl)
                    );
                    userThumbLink.setAttribute('title', this.props.data.author_name);
                    userThumbLink.setAttribute('target', linkTarget);
                    userThumbLink.setAttribute(
                        'style',
                        'background-image:url(' +
                            formatInnerLink(MediaPageStore.get('media-author-thumbnail-url'), this.props.siteUrl) +
                            ')'
                    );
                }

                topLeftHtml.appendChild(userThumbLink);
                topLeftHtml.appendChild(titleLink);
            }

            const mediaUrl = MediaPageStore.get('media-url');

            let bottomRightHTML =
                '<button class="share-video-btn"><i class="material-icons">share</i><span>Share</span></button>';
            bottomRightHTML +=
                '<div class="share-options-wrapper">\
									<div class="share-options">\
										<div class="share-options-inner">\
											<div class="sh-option share-email">\
												<a href="mailto:?body=' +
                mediaUrl +
                '" title=""><span><i class="material-icons">email</i></span><span>Email1</span></a>\
											</div></div>\
									</div>\
								</div>';

            this.cornerLayers = {
                topLeft: topLeftHtml,
                topRight: this.upNextLoaderView ? this.upNextLoaderView.html() : null,
                bottomLeft: this.recommendedMedia ? this.recommendedMedia.html() : null,
                bottomRight: this.props.inEmbed ? bottomRightHTML : null,
            };

            this.setState(
                {
                    displayPlayer: true,
                },
                function () {
                    setTimeout(function () {
                        const shareBtn = document.querySelector('.share-video-btn');
                        const shareWrap = document.querySelector('.share-options-wrapper');
                        const shareInner = document.querySelector('.share-options-inner');
                        if (shareBtn) {
                            shareBtn.addEventListener('click', function () {
                                addClassname(
                                    document.querySelector('.video-js.vjs-mediacms'),
                                    'vjs-visible-share-options'
                                );
                            });
                        }
                        if (shareWrap) {
                            shareWrap.addEventListener('click', function (ev) {
                                if (ev.target === shareInner || ev.target === shareWrap) {
                                    removeClassname(
                                        document.querySelector('.video-js.vjs-mediacms'),
                                        'vjs-visible-share-options'
                                    );
                                }
                            });
                        }
                    }, 1000);
                }
            );
        }
    }

    componentWillUnmount() {
        MediaPageStore.removeListener('loaded_media_data', this.onSoftNavMediaLoaded);
        MediaPageStore.removeListener('loaded_media_error', this.onSoftNavMediaError);
    }

    getLivePlayer() {
        if (this.playerInstance && this.playerInstance.player && !this.playerInstance.player.isDisposed?.()) {
            return this.playerInstance.player;
        }

        if (typeof window !== 'undefined' && window.videojsPlayers) {
            const player = window.videojsPlayers['video-main'];
            if (player && !player.isDisposed?.()) {
                return player;
            }
        }

        return null;
    }

    hardNavigate(url) {
        this.pendingSoftNavUrl = null;
        this.softNavInProgress = false;
        if (url) {
            window.location.href = url;
        }
    }

    softNavigateTo(url) {
        if (!url || this.props.inEmbed) {
            this.hardNavigate(url);
            return;
        }

        if (this.softNavInProgress) {
            return;
        }

        const mediaId = extractMediaIdFromUrl(url);
        const player = this.getLivePlayer();
        const currentId =
            MediaPageStore.get('media-id') ||
            (typeof window !== 'undefined' ? window.MEDIA_DATA?.data?.friendly_token : null);

        if (!mediaId || mediaId === currentId || !player || typeof player.mediacmsLoadMedia !== 'function') {
            if (mediaId && mediaId === currentId) {
                return;
            }
            this.hardNavigate(url);
            return;
        }

        this.pendingSoftNavUrl = url;
        this.softNavInProgress = true;

        try {
            window.history.pushState({ mediacmsSoftNav: true, mediaId }, '', url);
        } catch (_e) {
            this.hardNavigate(url);
            return;
        }

        MediaPageActions.loadMediaDataById(mediaId);
    }

    onSoftNavMediaLoaded() {
        if (!this.softNavInProgress || !this.pendingSoftNavUrl) {
            return;
        }

        const fallbackUrl = this.pendingSoftNavUrl;
        const mediaData = MediaPageStore.get('media-data');
        const mediaType = MediaPageStore.get('media-type');
        const player = this.getLivePlayer();

        if (!mediaData || ('video' !== mediaType && 'audio' !== mediaType) || !player) {
            this.hardNavigate(fallbackUrl);
            return;
        }

        const playlistId = MediaPageStore.get('playlist-id');
        let nextLink = null;
        let previousLink = null;

        if (playlistId) {
            nextLink = MediaPageStore.get('playlist-next-media-url');
            previousLink = MediaPageStore.get('playlist-previous-media-url');
        } else if (mediaData.related_media && mediaData.related_media.length) {
            nextLink = mediaData.related_media[0].url;
        }

        const siteUrl = this.props.siteUrl || (typeof window !== 'undefined' ? window.MediaCMS?.site?.url : '') || '';

        const applied = player.mediacmsLoadMedia({
            ...(typeof window !== 'undefined' ? window.MEDIA_DATA || {} : {}),
            data: mediaData,
            siteUrl,
            nextLink: nextLink || null,
            hasNextLink: !!nextLink,
            hasPreviousLink: !!previousLink,
            isPlayList: !!playlistId,
            onClickNextCallback: this.onClickNext,
            onClickPreviousCallback: this.onClickPrevious,
            onStateUpdateCallback: this.onStateUpdate,
            onPlayerInitCallback: this.onPlayerInit,
        });

        if (!applied) {
            this.hardNavigate(fallbackUrl);
            return;
        }

        this.pendingSoftNavUrl = null;
        this.softNavInProgress = false;

        const siteTitle = typeof window !== 'undefined' ? window.MediaCMS?.site?.title : '';
        if (mediaData.title) {
            document.title = siteTitle ? mediaData.title + ' - ' + siteTitle : mediaData.title;
        }

        // Keep local viewer fields aligned for the upcoming parent re-render from loaded_media_data.
        // Do not forceUpdate here: that can re-run VideoJSEmbed with stale props.data and clobber MEDIA_DATA.
        const rebuilt = this.buildSourcesFromData(mediaData, siteUrl);
        this.videoSources = rebuilt.videoSources;
        this.videoInfo = rebuilt.videoInfo;
        if (rebuilt.videoPoster) {
            this.videoPoster = rebuilt.videoPoster;
        }
    }

    onSoftNavMediaError() {
        if (!this.softNavInProgress || !this.pendingSoftNavUrl) {
            return;
        }

        this.hardNavigate(this.pendingSoftNavUrl);
    }

    onClickNext() {
        if (this.props.inEmbed) {
            return;
        }

        const nextLink = resolveNextLinkUrl();
        if (!nextLink) {
            return;
        }

        this.softNavigateTo(nextLink);
    }

    onClickPrevious() {
        if (this.props.inEmbed) {
            return;
        }

        const previousLink = resolvePreviousLinkUrl();
        if (!previousLink) {
            return;
        }

        this.softNavigateTo(previousLink);
    }

    onStateUpdate(newState) {
        if (VideoViewerStore.get('in-theater-mode') !== newState.theaterMode) {
            VideoViewerActions.set_viewer_mode(newState.theaterMode);
        }

        if (VideoViewerStore.get('player-volume') !== newState.volume) {
            VideoViewerActions.set_player_volume(newState.volume);
        }

        if (VideoViewerStore.get('player-sound-muted') !== newState.soundMuted) {
            VideoViewerActions.set_player_sound_muted(newState.soundMuted);
        }

        if (VideoViewerStore.get('video-quality') !== newState.quality) {
            VideoViewerActions.set_video_quality(newState.quality);
        }

        if (VideoViewerStore.get('video-playback-speed') !== newState.playbackSpeed) {
            VideoViewerActions.set_video_playback_speed(newState.playbackSpeed);
        }
    }

    onPlayerInit(instance, elem) {
        this.playerElem = elem;
        this.playerInstance = instance;

        if (this.upNextLoaderView) {
            this.upNextLoaderView.setVideoJsPlayerElem(this.playerInstance.player.el_);
            this.onUpdateMediaAutoPlay();
        }

        if (!this.props.inEmbed) {
            this.playerElem.parentNode.focus(); // Focus on player.
        }
    }

    onUpdateMediaAutoPlay() {
        if (this.upNextLoaderView) {
            if (PageStore.get('media-auto-play')) {
                // non compatible with videojs 8
                // this.upNextLoaderView.showTimerView(this.playerInstance.isEnded());
            } else {
                this.upNextLoaderView.hideTimerView();
            }
        }
    }

    render() {
        let nextLink = null;
        let previousLink = null;

        if (!this.props.inEmbed) {
            nextLink = resolveNextLinkUrl();
            previousLink = resolvePreviousLinkUrl();
        }

        const mediaData = MediaPageStore.get('media-data') || this.props.data;

        const previewSprite = mediaData.sprites_url
            ? {
                  url: this.props.siteUrl + '/' + mediaData.sprites_url.replace(/^\//g, ''),
                  frame: { width: 160, height: 90, seconds: 10 },
              }
            : null;

        return (
            <>
                {/*  {React.createElement(VideoJSEmbed, {
                    data: this.props.data,
                    siteUrl: window.MediaCMS.site.url,
                    onLoad: () => console.log('Video js loaded in VideoViewer'),
                    onError: (error) => console.error('Video js error in VideoViewer:', error),
                })} */}
                <div
                    key={(this.props.inEmbed ? 'embed-' : '') + 'player-container'}
                    className={'player-container' + (this.videoSources.length ? '' : ' player-container-error')}
                    style={this.props.containerStyles}
                >
                    <div className="player-container-inner" style={this.props.containerStyles}>
                        {
                            /* this.state.displayPlayer && */ null == MediaPageStore.get('media-load-error-type') ? (
                                <div className="video-player" key="videoJSPlayerWrapper">
                                    <SiteConsumer>
                                        {(site) => {
                                            return React.createElement(VideoJSEmbed, {
                                                data: mediaData,
                                                useRoundedCorners: site.useRoundedCorners,
                                                version: site.version,
                                                isPlayList: !!MediaPageStore.get('playlist-id'),
                                                playerVolume: this.browserCache.get('player-volume'),
                                                playerSoundMuted: this.browserCache.get('player-sound-muted'),
                                                videoQuality: this.browserCache.get('video-quality'),
                                                videoPlaybackSpeed: parseInt(
                                                    this.browserCache.get('video-playback-speed'),
                                                    10
                                                ),
                                                inTheaterMode: this.browserCache.get('in-theater-mode'),
                                                siteId: site.id,
                                                siteUrl: site.url,
                                                info: this.videoInfo,
                                                cornerLayers: this.cornerLayers,
                                                sources: this.videoSources,
                                                poster: this.videoPoster,
                                                previewSprite: previewSprite,
                                                subtitlesInfo: mediaData.subtitles_info,
                                                inEmbed: this.props.inEmbed,
                                                parentMediaBase: this.props.parentMediaBase || null,
                                                showTitle: this.props.showTitle,
                                                showRelated: this.props.showRelated,
                                                showUserAvatar: this.props.showUserAvatar,
                                                linkTitle: this.props.linkTitle,
                                                urlTimestamp: this.props.timestamp,
                                                hasTheaterMode: !this.props.inEmbed,
                                                hasNextLink: !!nextLink,
                                                nextLink: nextLink,
                                                hasPreviousLink: !!previousLink,
                                                errorMessage: MediaPageStore.get('media-load-error-message'),
                                                onClickNextCallback: this.onClickNext,
                                                onClickPreviousCallback: this.onClickPrevious,
                                                onStateUpdateCallback: this.onStateUpdate,
                                                onPlayerInitCallback: this.onPlayerInit,
                                            });
                                        }}
                                    </SiteConsumer>
                                </div>
                            ) : null
                        }
                    </div>
                </div>
            </>
        );
    }
}

VideoViewer.defaultProps = {
    inEmbed: !0,
    showTitle: !0,
    showRelated: !0,
    showUserAvatar: !0,
    linkTitle: !0,
    timestamp: null,
};
