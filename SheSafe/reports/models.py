from django.db import models
from django.contrib.auth.models import User


class SafetyReport(models.Model):

    REPORT_TYPES = [
        ("harassment", "Harassment"),
        ("unsafe_location", "Unsafe Location"),
        ("cyber_safety", "Cyber Safety"),
        ("transport", "Transportation Safety"),
        ("domestic", "Domestic Safety"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("submitted", "Submitted"),
        ("under_review", "Under Review"),
        ("resolved", "Resolved"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    report_type = models.CharField(
        max_length=50,
        choices=REPORT_TYPES
    )

    incident_date = models.DateField()

    incident_time = models.TimeField()

    location = models.CharField(
        max_length=255
    )

    description = models.TextField()

    evidence = models.FileField(
        upload_to="reports/",
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="submitted"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Report #{self.id} - {self.user.username}"