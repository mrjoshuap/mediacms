let CONTENTS = null;

function headerContents(contents) {
    const ret = {
        right: '',
        onLogoRight: '',
    };

    if (void 0 !== contents) {
        if ('string' === typeof contents.right) {
            ret.right = contents.right.trim();
        }

        if ('string' === typeof contents.onLogoRight) {
            ret.onLogoRight = contents.onLogoRight.trim();
        }
    }

    return ret;
}

function menuItems(items) {
    const ret = [];
    if (!items) {
        return ret;
    }
    let i = 0;
    while (i < items.length) {
        if (
            'string' === typeof items[i].text &&
            'string' === typeof items[i].link &&
            'string' === typeof items[i].icon
        ) {
            ret.push({
                text: items[i].text,
                link: items[i].link,
                icon: items[i].icon,
                className: items[i].className,
            });
        }
        i += 1;
    }
    return ret;
}

function sidebarContents(contents) {
    const ret = {
        navMenu: {
            items: [],
        },
        mainMenuExtra: {
            items: [],
        },
        libraryItems: [],
        personalItems: [],
        infoItems: [],
        manageItems: [],
        belowNavMenu: '',
        belowThemeSwitcher: '',
        footer: '',
    };

    if (undefined !== contents) {
        ret.mainMenuExtra.items = menuItems(contents.browseItems || contents.mainMenuExtraItems);
        ret.libraryItems = menuItems(contents.libraryItems);
        ret.personalItems = menuItems(contents.personalItems);
        ret.infoItems = menuItems(contents.infoItems);
        ret.manageItems = menuItems(contents.manageItems);

        if (undefined !== contents.navMenuItems) {
            let i = 0;
            while (i < contents.navMenuItems.length) {
                if (
                    'string' === typeof contents.navMenuItems[i].text &&
                    'string' === typeof contents.navMenuItems[i].link &&
                    'string' === typeof contents.navMenuItems[i].icon
                ) {
                    ret.navMenu.items.push({
                        text: contents.navMenuItems[i].text,
                        link: contents.navMenuItems[i].link,
                        icon: contents.navMenuItems[i].icon,
                        className: contents.navMenuItems[i].className,
                    });
                }

                i += 1;
            }
        }

        if ('string' === typeof contents.belowNavMenu) {
            ret.belowNavMenu = contents.belowNavMenu.trim();
        }

        if ('string' === typeof contents.belowThemeSwitcher) {
            ret.belowThemeSwitcher = contents.belowThemeSwitcher.trim();
        }

        if ('string' === typeof contents.footer) {
            ret.footer = contents.footer.trim();
        }
    }

    return ret;
}

function uploaderContents(contents) {
    const ret = {
        belowUploadArea: '',
        postUploadMessage: '',
    };

    if (void 0 !== contents) {
        if ('string' === typeof contents.belowUploadArea) {
            ret.belowUploadArea = contents.belowUploadArea.trim();
        }

        if ('string' === typeof contents.postUploadMessage) {
            ret.postUploadMessage = contents.postUploadMessage.trim();
        }
    }

    return ret;
}

export function init(contents) {
    CONTENTS = {
        header: headerContents(contents.header),
        sidebar: sidebarContents(contents.sidebar),
        uploader: uploaderContents(contents.uploader),
    };
}

export function settings() {
    return CONTENTS;
}
