class ApprovalMiddleware:
    """Kept so existing deployments that list this middleware still boot.

    Pending accounts are allowed through. Upload, edits, and manage pages refuse them.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)
