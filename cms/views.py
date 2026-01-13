"""Health check view for the API service."""
from django.http import JsonResponse


def health_check(request):
    """
    Health check endpoint that verifies the Django application is fully loaded.

    This endpoint will only return successfully when:
    - Django is initialized
    - All middleware is loaded
    - URL routing is functional
    - The application is ready to serve requests
    """
    return JsonResponse({'status': 'healthy'}, status=200)
