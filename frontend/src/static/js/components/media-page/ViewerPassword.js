import React from 'react';
import { MediaPageStore } from '../../utils/stores/';
import { MediaPageActions } from '../../utils/actions/';
import { translateString } from '../../utils/helpers/';

export default class ViewerPassword extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            password: '',
            unlocking: MediaPageStore.get('password-unlocking'),
            error: MediaPageStore.get('password-unlock-error'),
            title: MediaPageStore.get('password-media-title'),
        };
        this.onPending = this.onPending.bind(this);
        this.onFailed = this.onFailed.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    componentDidMount() {
        MediaPageStore.on('media_password_unlock_pending', this.onPending);
        MediaPageStore.on('media_password_unlock_failed', this.onFailed);
    }

    componentWillUnmount() {
        MediaPageStore.removeListener('media_password_unlock_pending', this.onPending);
        MediaPageStore.removeListener('media_password_unlock_failed', this.onFailed);
    }

    onPending() {
        this.setState({
            unlocking: true,
            error: null,
        });
    }

    onFailed() {
        this.setState({
            unlocking: false,
            error: MediaPageStore.get('password-unlock-error'),
        });
    }

    onChange(event) {
        this.setState({ password: event.target.value });
    }

    onSubmit(event) {
        event.preventDefault();
        if (!this.state.password || this.state.unlocking) {
            return;
        }
        MediaPageActions.unlockMediaPassword(this.state.password);
    }

    render() {
        return (
            <div className="viewer-container" key="viewer-container-password">
                <div className="player-container player-container-error">
                    <div className="player-container-inner">
                        <div className="error-container media-password-container">
                            <div className="error-container-inner">
                                <span className="icon-wrap">
                                    <i className="material-icons">lock</i>
                                </span>
                                <span className="msg-wrap">
                                    {this.state.title ? this.state.title : translateString('Password required')}
                                </span>
                                <p className="media-password-help">
                                    {translateString(
                                        'This media is password protected. Enter the password to continue.'
                                    )}
                                </p>
                                <form className="media-password-form" onSubmit={this.onSubmit}>
                                    <input
                                        type="password"
                                        name="password"
                                        autoComplete="current-password"
                                        value={this.state.password}
                                        onChange={this.onChange}
                                        placeholder={translateString('Password')}
                                        disabled={this.state.unlocking}
                                        required
                                    />
                                    {this.state.error ? (
                                        <div className="media-password-error">{this.state.error}</div>
                                    ) : null}
                                    <button type="submit" disabled={this.state.unlocking || !this.state.password}>
                                        {this.state.unlocking
                                            ? translateString('Unlocking...')
                                            : translateString('Unlock')}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
