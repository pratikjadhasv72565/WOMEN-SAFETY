from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

from .models import TrustedContact, SOSAlert


@login_required
def trusted_contacts(request):
    contacts = TrustedContact.objects.filter(
        user=request.user
    ).order_by("-is_primary", "name")

    return render(
        request,
        "trusted_contacts.html",
        {
            "contacts": contacts
        }
    )


@login_required
def add_contact(request):
    if request.method == "POST":
        name = request.POST.get("name", "").strip()
        phone = request.POST.get("phone", "").strip()
        relationship = request.POST.get("relationship", "").strip()
        is_primary = request.POST.get("is_primary") in ["on", "true", "1", True]

        if not name or not phone or not relationship:
            return redirect("trusted_contacts")

        # If this is the user's only contact, make it primary automatically
        existing_count = TrustedContact.objects.filter(user=request.user).count()
        if existing_count == 0:
            is_primary = True

        # Only one primary trusted contact is allowed.
        if is_primary:
            TrustedContact.objects.filter(
                user=request.user
            ).update(
                is_primary=False
            )

        TrustedContact.objects.create(
            user=request.user,
            name=name,
            phone=phone,
            relationship=relationship,
            is_primary=is_primary
        )

    return redirect("trusted_contacts")


@login_required
def delete_contact(request, contact_id):
    contact = get_object_or_404(
        TrustedContact,
        id=contact_id,
        user=request.user
    )

    was_primary = contact.is_primary
    contact.delete()

    # If primary was deleted, promote first remaining contact
    if was_primary:
        next_contact = TrustedContact.objects.filter(user=request.user).first()
        if next_contact:
            next_contact.is_primary = True
            next_contact.save()

    return redirect("trusted_contacts")


@login_required
def emergency_contacts_data(request):
    contacts = TrustedContact.objects.filter(
        user=request.user
    ).order_by("-is_primary", "name")

    data = []
    for contact in contacts:
        data.append({
            "id": contact.id,
            "name": contact.name,
            "phone": contact.phone,
            "relationship": contact.get_relationship_display(),
            "is_primary": contact.is_primary,
        })

    return JsonResponse({
        "success": True,
        "contacts": data
    })


@login_required
def create_sos_alert(request):
    if request.method != "POST":
        return JsonResponse(
            {
                "success": False,
                "message": "Only POST requests are allowed."
            },
            status=405
        )

    contact_id = request.POST.get("contact_id")
    target_contact = None

    if contact_id:
        try:
            target_contact = TrustedContact.objects.filter(
                id=int(contact_id),
                user=request.user
            ).first()
        except (ValueError, TypeError):
            target_contact = None

    if not target_contact:
        # Fallback to primary contact
        target_contact = TrustedContact.objects.filter(
            user=request.user,
            is_primary=True
        ).first()

    if not target_contact:
        # Fallback to any contact
        target_contact = TrustedContact.objects.filter(
            user=request.user
        ).first()

    if not target_contact:
        return JsonResponse(
            {
                "success": False,
                "message": (
                    "No trusted contact found. "
                    "Please add a trusted contact first in the Safety Network."
                )
            },
            status=400
        )

    # Get location from request
    lat_val = request.POST.get("latitude")
    long_val = request.POST.get("longitude")

    latitude = None
    longitude = None

    if lat_val and long_val:
        try:
            latitude = float(lat_val)
            longitude = float(long_val)
        except (ValueError, TypeError):
            latitude = None
            longitude = None

    # Save SOS alert in database
    alert = SOSAlert.objects.create(
        user=request.user,
        latitude=latitude,
        longitude=longitude,
        is_active=True
    )

    # Build Map and SMS message
    if latitude is not None and longitude is not None:
        map_url = f"https://www.google.com/maps/search/?api=1&query={latitude},{longitude}"
        emergency_message = (
            f"🚨 EMERGENCY ALERT - SheSafe\n\n"
            f"Hi {target_contact.name}, I need immediate help. Please contact me right away.\n\n"
            f"📍 My current location:\n{map_url}\n\n"
            f"Please check on me."
        )
    else:
        map_url = ""
        emergency_message = (
            f"🚨 EMERGENCY ALERT - SheSafe\n\n"
            f"Hi {target_contact.name}, I need immediate help. Please call or check on me as soon as possible."
        )

    return JsonResponse(
        {
            "success": True,
            "message": emergency_message,
            "alert_id": alert.id,
            "latitude": latitude,
            "longitude": longitude,
            "contact_name": target_contact.name,
            "phone": target_contact.phone,
            "map_url": map_url
        }
    )

