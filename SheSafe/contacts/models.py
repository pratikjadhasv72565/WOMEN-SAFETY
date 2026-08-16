from django.db import models
from django.contrib.auth.models import User


class TrustedContact(models.Model):

    RELATIONSHIP_CHOICES = [
        ("parent", "Parent"),
        ("sibling", "Sibling"),
        ("friend", "Friend"),
        ("relative", "Relative"),
        ("guardian", "Guardian"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="trusted_contacts"
    )

    name = models.CharField(
        max_length=100
    )

    phone = models.CharField(
        max_length=20
    )

    relationship = models.CharField(
        max_length=20,
        choices=RELATIONSHIP_CHOICES
    )

    is_primary = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.name} - {self.phone}"


class SOSAlert(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sos_alerts"
    )

    latitude = models.FloatField(
        null=True,
        blank=True
    )

    longitude = models.FloatField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    is_active = models.BooleanField(
        default=True
    )

    def __str__(self):
        return f"SOS - {self.user.username} - {self.created_at}"