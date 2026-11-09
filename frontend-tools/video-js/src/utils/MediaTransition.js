/**
 * Soft-load a new media item onto an existing Video.js player without
 * disposing it. Keeps the fullscreen element alive across autoplay/next.
 */

function getMimeType(url, mediaType) {
    if (mediaType === 'audio') {
        if (url && url.toLowerCase().includes('.mp3')) {
            return 'audio/mpeg';
        }
        if (url && url.toLowerCase().includes('.ogg')) {
            return 'audio/ogg';
        }
        if (url && url.toLowerCase().includes('.wav')) {
            return 'audio/wav';
        }
        if (url && url.toLowerCase().includes('.m4a')) {
            return 'audio/mp4';
        }
        return 'audio/mpeg';
    }

    if (url && url.toLowerCase().includes('.webm')) {
        return 'video/webm';
    }
    if (url && url.toLowerCase().includes('.ogg')) {
        return 'video/ogg';
    }

    return 'video/mp4';
}

function resolveUserQuality(player) {
    try {
        const prefs = player?.mediacmsUserPreferences;
        if (prefs && typeof prefs.getQualityPreference === 'function') {
            return prefs.getQualityPreference() || 'auto';
        }
    } catch {
        // ignore
    }
    return 'auto';
}

export function buildSourcesFromMediaData(mediaData, userQuality = 'auto') {
    const siteUrl = mediaData?.siteUrl || '';
    const data = mediaData?.data;

    if (!data) {
        return [];
    }

    if (data.hls_info) {
        if (userQuality === 'auto' && data.hls_info.master_file) {
            return [
                {
                    src: siteUrl + data.hls_info.master_file,
                    type: 'application/x-mpegURL',
                    label: 'Auto',
                },
            ];
        }

        if (userQuality !== 'auto') {
            const qualityKey = `${userQuality.replace('p', '')}_playlist`;
            if (data.hls_info[qualityKey]) {
                return [
                    {
                        src: siteUrl + data.hls_info[qualityKey],
                        type: 'application/x-mpegURL',
                        label: `${userQuality.replace('p', '')}p`,
                    },
                ];
            }
        }

        if (data.hls_info.master_file) {
            return [
                {
                    src: siteUrl + data.hls_info.master_file,
                    type: 'application/x-mpegURL',
                    label: 'Auto',
                },
            ];
        }
    }

    if (data.encodings_info) {
        const encodings = data.encodings_info;

        if (userQuality !== 'auto') {
            const qualityNumber = userQuality.replace('p', '');
            if (encodings[qualityNumber]?.h264?.url) {
                const sourceUrl = encodings[qualityNumber].h264.url;
                return [
                    {
                        src: sourceUrl,
                        type: getMimeType(sourceUrl, data.media_type),
                        label: `${qualityNumber}p`,
                    },
                ];
            }
        }

        const sources = [];
        const availableQualities = Object.keys(encodings)
            .filter((quality) => encodings[quality]?.h264?.url)
            .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

        for (const quality of availableQualities) {
            const sourceUrl = encodings[quality].h264.url;
            sources.push({
                src: sourceUrl,
                type: getMimeType(sourceUrl, data.media_type),
                label: `${quality}p`,
            });
        }

        if (sources.length > 0) {
            return sources;
        }
    }

    if (data.original_media_url) {
        const sourceUrl = siteUrl + data.original_media_url;
        return [
            {
                src: sourceUrl,
                type: getMimeType(sourceUrl, data.media_type),
            },
        ];
    }

    return [];
}

function mapRelatedVideos(relatedMedia) {
    if (!Array.isArray(relatedMedia)) {
        return [];
    }

    return relatedMedia.slice(0, 12).map((media) => ({
        id: media.friendly_token,
        title: media.title,
        author: media.user || media.author_name || 'Unknown',
        views: `${media.views} views`,
        thumbnail: media.thumbnail_url || media.author_thumbnail,
        category: media.media_type,
        url: media.url,
        duration: media.duration,
        size: media.size,
        likes: media.likes,
        dislikes: media.dislikes,
        add_date: media.add_date,
        description: media.description,
    }));
}

function buildPoster(mediaData) {
    const siteUrl = mediaData?.siteUrl || '';
    const data = mediaData?.data;

    if (data?.poster_url) {
        return siteUrl + data.poster_url;
    }

    if (data?.media_type === 'audio') {
        return siteUrl + '/static/video_js/audio-poster.webp';
    }

    if (data?.thumbnail_url) {
        return siteUrl + data.thumbnail_url;
    }

    return '';
}

function replaceSubtitleTracks(player, mediaData) {
    const siteUrl = mediaData?.siteUrl || '';
    const backendSubtitles = mediaData?.data?.subtitles_info || [];

    const existingTracks = player.remoteTextTracks ? player.remoteTextTracks() : null;
    if (existingTracks) {
        const toRemove = [];
        for (let i = 0; i < existingTracks.length; i += 1) {
            toRemove.push(existingTracks[i]);
        }
        toRemove.forEach((track) => {
            try {
                player.removeRemoteTextTrack(track);
            } catch {
                // ignore
            }
        });
    }

    backendSubtitles.forEach((track) => {
        try {
            player.addRemoteTextTrack(
                {
                    kind: 'subtitles',
                    src: siteUrl + track.src,
                    srclang: track.srclang,
                    label: track.label,
                    default: track.default || false,
                },
                false
            );
        } catch {
            // ignore
        }
    });
}

/**
 * Apply a new MEDIA_DATA payload to a live Video.js player.
 * @returns {boolean} true when the source was updated successfully
 */
export function applyMediaToPlayer(player, mediaData) {
    if (!player || player.isDisposed?.() || !mediaData?.data) {
        return false;
    }

    const mediaType = mediaData.data.media_type;
    if (mediaType !== 'video' && mediaType !== 'audio') {
        return false;
    }

    const sources = buildSourcesFromMediaData(mediaData, resolveUserQuality(player));
    if (!sources.length) {
        return false;
    }

    const endScreenHandler = player.customComponents?.endScreenHandler;
    if (endScreenHandler && typeof endScreenHandler.cleanupOverlays === 'function') {
        endScreenHandler.cleanupOverlays();
        if (typeof endScreenHandler.resetControlBarBehavior === 'function') {
            endScreenHandler.resetControlBarBehavior();
        }
    }

    if (typeof window !== 'undefined') {
        window.MEDIA_DATA = {
            ...(window.MEDIA_DATA || {}),
            ...mediaData,
            data: mediaData.data,
            nextLink: mediaData.nextLink ?? null,
            hasNextLink: !!mediaData.nextLink,
            hasPreviousLink: !!mediaData.hasPreviousLink,
            poster: buildPoster(mediaData),
            sources,
            isPlayList: !!mediaData.isPlayList,
            subtitlesInfo: mediaData.data.subtitles_info || [],
        };
    }

    const relatedVideos = mapRelatedVideos(mediaData.data.related_media);
    const currentVideo = {
        id: mediaData.data.friendly_token || 'default-video',
        title: mediaData.data.title || 'Video',
        author_name: mediaData.data.author_name || 'Unknown',
        author_profile: mediaData.data.author_profile
            ? (mediaData.siteUrl || '') + mediaData.data.author_profile
            : '',
        author_thumbnail: mediaData.data.author_thumbnail
            ? (mediaData.siteUrl || '') + mediaData.data.author_thumbnail
            : '',
        url: mediaData.data.url || '',
        poster: buildPoster(mediaData),
        isPlayList: !!mediaData.isPlayList,
        related_media: mediaData.data.related_media || [],
        nextLink: mediaData.nextLink || null,
        sources,
    };

    if (endScreenHandler) {
        endScreenHandler.options = {
            ...endScreenHandler.options,
            mediaData: typeof window !== 'undefined' ? window.MEDIA_DATA : mediaData,
            currentVideo,
            relatedVideos,
        };
    }

    if (mediaType === 'audio') {
        player.addClass('vjs-audio-type');
    } else {
        player.removeClass('vjs-audio-type');
    }

    const poster = buildPoster(mediaData);
    if (poster) {
        player.poster(poster);
    }

    replaceSubtitleTracks(player, mediaData);

    player.src(sources);

    const settingsMenu = player.customComponents?.settingsMenu;
    if (settingsMenu && typeof settingsMenu.setQualities === 'function') {
        try {
            // Rebuild a minimal qualities list from sources for the settings menu.
            const qualities = sources.map((source) => ({
                label: source.label || 'Auto',
                value: (source.label || 'auto').toString().toLowerCase().replace(/\s/g, ''),
                src: source.src,
                type: source.type,
            }));
            if (qualities.length) {
                settingsMenu.setQualities(qualities);
            }
        } catch {
            // ignore
        }
    }

    const playPromise = player.play();
    if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
            // Browser may block unmuted autoplay; leave paused.
        });
    }

    return true;
}
