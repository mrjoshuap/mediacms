import React from 'react';
import { ApiUrlConsumer, memberConfig } from '../utils/contexts/';
import { PageStore } from '../utils/stores/';
import { inEmbeddedApp } from '../utils/helpers/';
import { usePopup } from '../utils/hooks/';
import { CircleIconButton, MaterialIcon, PopupMain } from '../components/_shared/';
import { MediaListWrapper } from '../components/MediaListWrapper';
import ProfilePagesHeader from '../components/profile-page/ProfilePagesHeader';
import ProfilePagesContent from '../components/profile-page/ProfilePagesContent';
import { LazyLoadItemListAsync } from '../components/item-list/LazyLoadItemListAsync.jsx';
import { PlaylistCreationForm } from '../components/playlist-form/PlaylistCreationForm';
import { ProfileMediaPageBase } from './ProfileMediaPage';

function CreatePlaylistButton(props) {
  const [popupContentRef, PopupContent, PopupTrigger] = usePopup();

  function onClickExit() {
    popupContentRef.current.toggle();
  }

  function onPlaylistSave() {
    onClickExit();
    if (props.onCreated) {
      props.onCreated();
    }
  }

  return (
    <div className="create-playlist-wrap">
      <PopupTrigger contentRef={popupContentRef}>
        <CircleIconButton className="create-playlist-btn" type="button">
          <MaterialIcon type="add" />
          <span>CREATE PLAYLIST</span>
        </CircleIconButton>
      </PopupTrigger>

      <PopupContent contentRef={popupContentRef}>
        <div className="popup-fullscreen">
          <PopupMain>
            <span className="popup-fullscreen-overlay"></span>
            <div className="create-playlist-form-wrap">
              <div className="create-playlist-popup-title">
                Create playlist
                <CircleIconButton type="button" onClick={onClickExit}>
                  <MaterialIcon type="close" />
                </CircleIconButton>
              </div>
              <PlaylistCreationForm onCancel={onClickExit} onPlaylistSave={onPlaylistSave} />
            </div>
          </PopupMain>
        </div>
      </PopupContent>
    </div>
  );
}

export class ProfilePlaylistsPage extends ProfileMediaPageBase {
  constructor(props) {
    super(props, 'author-playlists');

    this.state = {
      loadedAuthor: false,
      loadedPlaylists: false,
      playlistsCount: -1,
      listKey: 0,
    };

    this.getPlaylistsCountFunc = this.getPlaylistsCountFunc.bind(this);
    this.onPlaylistCreated = this.onPlaylistCreated.bind(this);
  }

  getPlaylistsCountFunc(resultsCount) {
    this.setState({
      loadedPlaylists: true,
      playlistsCount: resultsCount,
    });
  }

  onPlaylistCreated() {
    this.setState((prev) => ({
      listKey: prev.listKey + 1,
      loadedPlaylists: false,
      playlistsCount: -1,
    }));
  }

  pageContent() {
    const isOwner = this.state.author && this.state.author.username === memberConfig.username;

    return [
      this.state.author ? (
        <ProfilePagesHeader key="ProfilePagesHeader" author={this.state.author} type="playlists" hideChannelBanner={inEmbeddedApp()} />
      ) : null,
      this.state.author ? (
        <ProfilePagesContent key="ProfilePagesContent">
          <ApiUrlConsumer>
            {(apiUrl) => (
              <MediaListWrapper
                title={-1 < this.state.playlistsCount || isOwner ? 'Created playlists' : void 0}
                className="profile-playlists-content items-list-ver"
              >
                {isOwner ? (
                  <div className="profile-playlists-actions">
                    <CreatePlaylistButton onCreated={this.onPlaylistCreated} />
                    {this.state.loadedPlaylists && 0 === this.state.playlistsCount ? (
                      <p className="empty-profile-page-msg">
                        You haven&apos;t created any playlists yet. Create one, then open a media item and use Save to add
                        it.
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <LazyLoadItemListAsync
                  key={'playlists-list-' + this.state.listKey}
                  requestUrl={apiUrl.user.playlists + this.state.author.username}
                  itemsCountCallback={this.getPlaylistsCountFunc}
                  hideViews={!PageStore.get('config-media-item').displayViews}
                  hideAuthor={!PageStore.get('config-media-item').displayAuthor}
                  hideDate={!PageStore.get('config-media-item').displayPublishDate}
                />
              </MediaListWrapper>
            )}
          </ApiUrlConsumer>
        </ProfilePagesContent>
      ) : null,
    ];
  }
}
