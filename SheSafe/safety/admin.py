from django.contrib import admin
from .models import SafetyCheckIn, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "phone_number", "created_at")
    search_fields = ("user__username", "user__email", "phone_number")


@admin.register(SafetyCheckIn)
class SafetyCheckInAdmin(admin.ModelAdmin):

    list_display = (
        "user",
        "trusted_contact",
        "duration_minutes",
        "started_at",
        "is_active",
        "completed_at",
    )

    list_filter = (
        "is_active",
        "started_at",
    )

    search_fields = (
        "user__username",
        "trusted_contact",
    )