from django.conf import settings

from cms.version import VERSION

from .frontend_translations import get_translation, get_translation_strings
from .methods import is_mediacms_editor, is_mediacms_manager
from .models import Page
from .page_slugs import HTML_SECTIONS, INJECT_SLUGS, LINK_SECTIONS, parse_page_slug


def stuff(request):
    """Pass settings to the frontend"""
    ret = {}
    ret["FRONTEND_HOST"] = request.build_absolute_uri('/').rstrip('/')
    ret["DEFAULT_THEME"] = settings.DEFAULT_THEME
    ret["PORTAL_NAME"] = settings.PORTAL_NAME
    groups = {section: [] for section in LINK_SECTIONS}
    html_slots = {section: [] for section in HTML_SECTIONS}
    fragments = {slug.replace("-", "_"): "" for slug in INJECT_SLUGS}
    for page in Page.objects.order_by("title").only("slug", "title", "description"):
        parsed = parse_page_slug(page.slug)
        if parsed.kind == "link":
            groups[parsed.section].append(page)
        elif parsed.kind == "html":
            html_slots[parsed.section].append(page.description or "")
        elif parsed.kind == "inject":
            fragments[page.slug.replace("-", "_")] = page.description or ""
    if not request.user.is_authenticated:
        groups["library"] = []
        groups["personal"] = []
    if not (request.user.is_authenticated and is_mediacms_editor(request.user)):
        groups["manage"] = []
    ret["SIDEBAR_BROWSE"] = groups["browse"]
    ret["SIDEBAR_LIBRARY"] = groups["library"]
    ret["SIDEBAR_PERSONAL"] = groups["personal"]
    ret["SIDEBAR_INFO"] = groups["info"]
    ret["SIDEBAR_MANAGE"] = groups["manage"]
    ret["SIDEBAR_BELOW"] = "".join(html_slots["below"])
    ret["SIDEBAR_AFTER_THEME"] = "".join(html_slots["after-theme"])
    ret["SIDEBAR_FOOTER_HTML"] = "".join(html_slots["footer"])
    ret["PAGE_FRAGMENTS"] = fragments

    ret["PORTAL_LOGO_DARK_SVG"] = getattr(settings, 'PORTAL_LOGO_DARK_SVG', "")
    ret["PORTAL_LOGO_DARK_PNG"] = getattr(settings, 'PORTAL_LOGO_DARK_PNG', "")
    ret["PORTAL_LOGO_LIGHT_SVG"] = getattr(settings, 'PORTAL_LOGO_LIGHT_SVG', "")
    ret["PORTAL_LOGO_LIGHT_PNG"] = getattr(settings, 'PORTAL_LOGO_LIGHT_PNG', "")
    ret["EXTRA_CSS_PATHS"] = getattr(settings, 'EXTRA_CSS_PATHS', [])
    ret["PORTAL_DESCRIPTION"] = settings.PORTAL_DESCRIPTION
    ret["LOAD_FROM_CDN"] = settings.LOAD_FROM_CDN
    ret["CAN_LOGIN"] = settings.LOGIN_ALLOWED
    ret["CAN_REGISTER"] = settings.REGISTER_ALLOWED
    ret["CAN_UPLOAD_MEDIA"] = settings.UPLOAD_MEDIA_ALLOWED
    ret["TIMESTAMP_IN_TIMEBAR"] = settings.TIMESTAMP_IN_TIMEBAR
    ret["CAN_MENTION_IN_COMMENTS"] = settings.ALLOW_MENTION_IN_COMMENTS
    ret["CAN_LIKE_MEDIA"] = settings.CAN_LIKE_MEDIA
    ret["CAN_DISLIKE_MEDIA"] = settings.CAN_DISLIKE_MEDIA
    ret["CAN_REPORT_MEDIA"] = settings.CAN_REPORT_MEDIA
    ret["CAN_SHARE_MEDIA"] = settings.CAN_SHARE_MEDIA
    ret["UPLOAD_MAX_SIZE"] = settings.UPLOAD_MAX_SIZE
    ret["UPLOAD_MAX_FILES_NUMBER"] = settings.UPLOAD_MAX_FILES_NUMBER
    ret["PRE_UPLOAD_MEDIA_MESSAGE"] = settings.PRE_UPLOAD_MEDIA_MESSAGE
    ret["SIDEBAR_FOOTER_TEXT"] = settings.SIDEBAR_FOOTER_TEXT
    ret["POST_UPLOAD_AUTHOR_MESSAGE_UNLISTED_NO_COMMENTARY"] = settings.POST_UPLOAD_AUTHOR_MESSAGE_UNLISTED_NO_COMMENTARY
    ret["IS_MEDIACMS_ADMIN"] = request.user.is_superuser
    ret["IS_MEDIACMS_EDITOR"] = is_mediacms_editor(request.user)
    ret["IS_MEDIACMS_MANAGER"] = is_mediacms_manager(request.user)
    ret["USERS_NEEDS_TO_BE_APPROVED"] = settings.USERS_NEEDS_TO_BE_APPROVED

    can_see_members_page = False
    if request.user.is_authenticated:
        if settings.CAN_SEE_MEMBERS_PAGE == "all":
            can_see_members_page = True
        elif settings.CAN_SEE_MEMBERS_PAGE == "editors" and is_mediacms_editor(request.user):
            can_see_members_page = True
        elif settings.CAN_SEE_MEMBERS_PAGE == "admins" and request.user.is_superuser:
            can_see_members_page = True
    ret["CAN_SEE_MEMBERS_PAGE"] = can_see_members_page
    if request.user.is_authenticated:
        ret["CAN_SEARCH_AUTHORS"] = can_see_members_page
    else:
        ret["CAN_SEARCH_AUTHORS"] = settings.CAN_SEE_MEMBERS_PAGE == "all" and settings.ALLOW_ANONYMOUS_USER_LISTING
    ret["ALLOW_RATINGS"] = settings.ALLOW_RATINGS
    ret["ALLOW_RATINGS_CONFIRMED_EMAIL_ONLY"] = settings.ALLOW_RATINGS_CONFIRMED_EMAIL_ONLY
    ret["VIDEO_PLAYER_FEATURED_VIDEO_ON_INDEX_PAGE"] = settings.VIDEO_PLAYER_FEATURED_VIDEO_ON_INDEX_PAGE
    ret["RSS_URL"] = "/rss"
    ret["TRANSLATION"] = get_translation(request.LANGUAGE_CODE)
    ret["REPLACEMENTS"] = get_translation_strings(request.LANGUAGE_CODE)
    ret["USE_SAML"] = settings.USE_SAML
    ret["USE_RBAC"] = settings.USE_RBAC
    ret["USE_ROUNDED_CORNERS"] = settings.USE_ROUNDED_CORNERS
    ret["INCLUDE_LISTING_NUMBERS"] = settings.INCLUDE_LISTING_NUMBERS
    ret["ALLOW_MEDIA_REPLACEMENT"] = getattr(settings, 'ALLOW_MEDIA_REPLACEMENT', False)
    ret["VERSION"] = VERSION

    if request.user.is_superuser:
        ret["DJANGO_ADMIN_URL"] = settings.DJANGO_ADMIN_URL

    if getattr(settings, 'USE_LTI', False):
        lti_session = request.session.get('lti_session')

        if lti_session and request.user.is_authenticated:
            ret['lti_session'] = lti_session

    return ret
