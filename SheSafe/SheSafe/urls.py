from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views
from safety import views as safety_views
from reports import views as reports_views
from contacts import views as contacts_views
from resources import views as resources_views

urlpatterns = [
    path("admin/", admin.site.urls),

    path("", views.home, name="home"),

    path("login/", views.login_page, name="login"),

    path("register/", views.register_page, name="register"),

    path("logout/", views.logout_user, name="logout"),

    path("checkin/", safety_views.checkin, name="checkin"),

    path(
        "checkin/complete/<int:checkin_id>/",
        safety_views.complete_checkin,
        name="complete_checkin"
    ),

    path(
    "safety-report/",
    reports_views.safety_report,
    name="safety_report"),

    path(
    "trusted-contacts/",
    contacts_views.trusted_contacts,
    name="trusted_contacts"),

    path(
    "trusted-contacts/delete/<int:contact_id>/",
    contacts_views.delete_contact,
    name="delete_contact"),

    path(
    "resources/",
    resources_views.resources_page,
    name="resources"),

    path("contacts/", include("contacts.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)