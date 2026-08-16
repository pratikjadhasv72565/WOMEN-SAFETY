from django.db import models
from django.contrib.auth.models import User


class SafetyCheckIn(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    trusted_contact = models.CharField(
        max_length=100
    )

    message = models.TextField(
        blank=True
    )

    duration_minutes = models.PositiveIntegerField()

    started_at = models.DateTimeField(
        auto_now_add=True
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    is_active = models.BooleanField(
        default=True
    )

    def __str__(self):
        return f"{self.user.username} - Safety Check-In"