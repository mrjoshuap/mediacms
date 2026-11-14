from django.contrib.auth.backends import ModelBackend


class ApprovalBackend(ModelBackend):
    def user_can_authenticate(self, user):
        # Pending users may sign in. Upload and library edits stay refused elsewhere.
        return super().user_can_authenticate(user)
