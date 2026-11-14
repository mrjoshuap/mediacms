import React from 'react';
import Sortable from 'sortablejs';
import { PageActions, PlaylistPageActions } from '../../utils/actions';
import { apiUrlConfig } from '../../utils/contexts';
import { putRequest, csrfToken } from '../../utils/helpers';
import { PlaylistPageMedia } from './PlaylistPageMedia';

export class PlaylistMediaList extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            media: props.media,
            listVersion: 0,
        };
        this.containerRef = React.createRef();
        this.sortable = null;
        this.onItemsLoad = this.onItemsLoad.bind(this);
    }

    componentWillUnmount() {
        if (this.sortable) {
            this.sortable.destroy();
            this.sortable = null;
        }
    }

    onItemsLoad() {
        if (!this.props.loggedinUserPlaylist) {
            return;
        }

        const container = this.containerRef.current && this.containerRef.current.querySelector('.items-list');

        if (!container) {
            return;
        }

        if (this.sortable) {
            this.sortable.destroy();
            this.sortable = null;
        }

        const playlistId = this.props.id;

        const getMediaArray = function (index) {
            return this.state.media[index];
        }.bind(this);

        const updateMediaData = function (newMediaOrder) {
            const newMediadata = [];
            let i = 0;
            while (i < newMediaOrder.length) {
                newMediadata.push(this.state.media[newMediaOrder[i]]);
                i += 1;
            }

            // Remount the list so React DOM matches Sortable's order (avoids broken options menus).
            this.setState(
                {
                    media: newMediadata,
                    listVersion: this.state.listVersion + 1,
                },
                () => {
                    PlaylistPageActions.reorderedMediaInPlaylist(this.state.media);
                }
            );
        }.bind(this);

        this.sortable = Sortable.create(container, {
            handle: '.item-order-number',
            draggable: '.item',
            animation: 150,
            onStart: function () {
                container.classList.add('on-dragging');
            },
            onEnd: function () {
                const newMediaOrder = [];
                const reorderRequests = [];

                const itemsOrderNumElems = container.querySelectorAll('.item-order-number div div');
                let oldOrdering, newOrdering, friendly_token;
                let i = 0;
                while (i < itemsOrderNumElems.length) {
                    oldOrdering = parseInt(itemsOrderNumElems[i].getAttribute('data-order'), 10);
                    newOrdering = i + 1;

                    if (newOrdering !== oldOrdering) {
                        friendly_token = getMediaArray(oldOrdering - 1).friendly_token;

                        reorderRequests.push(
                            new Promise(function (resolve) {
                                putRequest(
                                    apiUrlConfig.playlists + '/' + playlistId,
                                    {
                                        type: 'ordering',
                                        ordering: newOrdering,
                                        media_friendly_token: friendly_token,
                                    },
                                    {
                                        headers: {
                                            'X-CSRFToken': csrfToken(),
                                        },
                                    },
                                    false,
                                    function () {
                                        resolve(true);
                                    },
                                    function () {
                                        resolve(false);
                                    }
                                );
                            })
                        );
                    }

                    newMediaOrder.push(oldOrdering - 1);

                    itemsOrderNumElems[i].setAttribute('data-order', newOrdering);
                    itemsOrderNumElems[i].innerHTML = newOrdering;

                    i += 1;
                }

                container.classList.remove('on-dragging');

                updateMediaData(newMediaOrder);

                if (reorderRequests.length) {
                    Promise.all(reorderRequests).then(function (results) {
                        setTimeout(function () {
                            if (results.every(Boolean)) {
                                PageActions.addNotification('Playlist order saved', 'playlistReorder');
                            } else {
                                PageActions.addNotification('Playlist reorder failed', 'playlistReorderFail');
                            }
                        }, 100);
                    });
                }
            },
        });
    }

    render() {
        return (
            <div
                ref={this.containerRef}
                className={'playlist-videos-list' + (this.props.loggedinUserPlaylist ? ' draggable' : '')}
            >
                {this.state.media.length ? (
                    <PlaylistPageMedia
                        key={'playlist-media-' + this.state.listVersion}
                        itemsLoadCallback={this.onItemsLoad}
                        playlistId={this.props.id}
                        media={this.state.media}
                        hidePlaylistOptions={!this.props.loggedinUserPlaylist}
                    />
                ) : null}
            </div>
        );
    }
}
