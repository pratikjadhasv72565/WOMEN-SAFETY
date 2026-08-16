from .models import TrustedContact


def primary_contact_processor(request):
    """
    Exposes the authenticated user's primary contact details globally to all templates
    so SOS can trigger immediate direct phone call without network delays.
    """
    if request.user.is_authenticated:
        primary = TrustedContact.objects.filter(
            user=request.user,
            is_primary=True
        ).first()

        if not primary:
            primary = TrustedContact.objects.filter(
                user=request.user
            ).first()

        if primary:
            clean_phone = primary.phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
            return {
                "primary_contact_name": primary.name,
                "primary_contact_phone": clean_phone,
                "primary_contact_display_phone": primary.phone,
                "has_trusted_contact": True,
            }

    return {
        "primary_contact_name": "National Emergency Services",
        "primary_contact_phone": "112",
        "primary_contact_display_phone": "112",
        "has_trusted_contact": False,
    }
