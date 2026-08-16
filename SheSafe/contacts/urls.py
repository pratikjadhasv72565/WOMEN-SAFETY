from django.urls import path
from . import views

urlpatterns = [
    path("", views.trusted_contacts, name="trusted_contacts"),

    path(
        "add/",
        views.add_contact,
        name="add_contact"
    ),

    path(
        "delete/<int:contact_id>/",
        views.delete_contact,
        name="delete_contact"
    ),

    path(
        "data/",
        views.emergency_contacts_data,
        name="emergency_contacts_data"
    ),

    path(
        "sos/",
        views.create_sos_alert,
        name="create_sos_alert"
    ),

    path(
        "sos/create/",
        views.create_sos_alert,
        name="create_sos_alert_direct"
    ),
]