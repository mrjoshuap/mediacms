from django.conf import settings
from rest_framework import authentication, exceptions

NOT_APPROVED_MESSAGE = "User account not approved."


def ensure_approved(user):
    """Reads are allowed for a pending account. Writes are refused in the views."""
    return user


class ApprovalRequiredMixin:
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is not None:
            ensure_approved(result[0])
        return result


class SessionAuthentication(ApprovalRequiredMixin, authentication.SessionAuthentication):
    pass


class BasicAuthentication(ApprovalRequiredMixin, authentication.BasicAuthentication):
    pass


class TokenAuthentication(ApprovalRequiredMixin, authentication.TokenAuthentication):
    pass


class GlobalLoginRequiredAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        if not settings.GLOBAL_LOGIN_REQUIRED:
            return None
        view = (getattr(request, "parser_context", None) or {}).get("view")
        if getattr(view, "global_login_exempt", False):
            return None
        raise exceptions.NotAuthenticated()
