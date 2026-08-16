from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from .models import SafetyCheckIn
from contacts.models import TrustedContact


@login_required
def checkin(request):
    if request.method == "POST":
        trusted_contact = request.POST.get("trusted_contact", "").strip()
        message = request.POST.get("message", "").strip()
        duration = request.POST.get("duration", "30")

        try:
            duration = int(duration)
        except (TypeError, ValueError):
            duration = 30

        if not trusted_contact:
            primary = TrustedContact.objects.filter(user=request.user, is_primary=True).first()
            if primary:
                trusted_contact = primary.name
            else:
                first_c = TrustedContact.objects.filter(user=request.user).first()
                trusted_contact = first_c.name if first_c else "Emergency Contact"

        # Complete any older active check-in before creating a new one
        SafetyCheckIn.objects.filter(
            user=request.user,
            is_active=True
        ).update(
            is_active=False,
            completed_at=timezone.now()
        )

        SafetyCheckIn.objects.create(
            user=request.user,
            trusted_contact=trusted_contact,
            message=message,
            duration_minutes=duration,
        )

        return redirect("checkin")

    active_checkin = SafetyCheckIn.objects.filter(
        user=request.user,
        is_active=True
    ).order_by("-started_at").first()

    # Calculate remaining time if checkin is active
    contacts = TrustedContact.objects.filter(user=request.user).order_by("-is_primary", "name")

    return render(
        request,
        "checkin.html",
        {
            "active_checkin": active_checkin,
            "contacts": contacts
        }
    )


@login_required
def complete_checkin(request, checkin_id):
    checkin_obj = get_object_or_404(
        SafetyCheckIn,
        id=checkin_id,
        user=request.user
    )

    checkin_obj.is_active = False
    checkin_obj.completed_at = timezone.now()
    checkin_obj.save()

    return redirect("checkin")