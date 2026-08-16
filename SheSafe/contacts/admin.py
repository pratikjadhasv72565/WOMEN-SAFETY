from django.contrib import admin
from .models import TrustedContact, SOSAlert


@admin.register(TrustedContact)
class TrustedContactAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "name",
        "phone",
        "relationship",
        "is_primary",
        "created_at",
    )

    list_filter = (
        "relationship",
        "is_primary",
    )

    search_fields = (
        "name",
        "phone",
        "user__username",
    )


@admin.register(SOSAlert)
class SOSAlertAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "latitude",
        "longitude",
        "is_active",
        "created_at",
    )

    list_filter = (
        "is_active",
        "created_at",
    )

    search_fields = (
        "user__username",
    )