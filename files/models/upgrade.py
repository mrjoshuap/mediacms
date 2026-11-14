from django.db import models


class UpgradeDecision(models.Model):
    """A choice made once during upgrade_site apply."""

    key = models.CharField(max_length=64, unique=True)
    choice = models.CharField(max_length=64)
    applied = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.key}:{self.choice}"
