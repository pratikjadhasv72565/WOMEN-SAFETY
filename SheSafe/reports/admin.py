from django.contrib import admin
from .models import SafetyReport


@admin.register(SafetyReport)
class SafetyReportAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "report_type",
        "location",
        "status",
        "created_at",
    )

    list_filter = (
        "report_type",
        "status",
        "created_at",
    )

    search_fields = (
        "user__username",
        "location",
        "description",
    )

    readonly_fields = (
        "created_at",
    )