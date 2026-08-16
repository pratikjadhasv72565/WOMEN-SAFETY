import re
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.contrib import messages
from safety.models import UserProfile


def home(request):
    return render(request, "index.html")


def login_page(request):
    if request.user.is_authenticated:
        return redirect("home")

    next_url = request.GET.get("next") or request.POST.get("next") or "/"

    if request.method == "POST":
        login_input = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")

        # Try authenticating directly with username
        user = authenticate(
            request,
            username=login_input,
            password=password
        )

        # If not matched, check if input is an email address
        if user is None and "@" in login_input:
            try:
                user_obj = User.objects.filter(email__iexact=login_input).first()
                if user_obj:
                    user = authenticate(
                        request,
                        username=user_obj.username,
                        password=password
                    )
            except Exception:
                user = None

        if user is not None:
            login(request, user)
            return redirect(next_url if next_url.startswith("/") else "/")

        return render(
            request,
            "login.html",
            {
                "error": "Invalid username/email or password.",
                "login_input": login_input,
                "next_url": next_url,
            }
        )

    return render(request, "login.html", {"next_url": next_url})


def register_page(request):
    if request.user.is_authenticated:
        return redirect("home")

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip().lower()
        phone = request.POST.get("phone", "").strip()
        password = request.POST.get("password", "")
        confirm_password = request.POST.get("confirm_password", "")

        error = None

        # 1. Required fields check
        if not username or not email or not phone or not password or not confirm_password:
            error = "Please fill in all required fields."

        # 2. Username Validation
        elif len(username) < 3 or len(username) > 30:
            error = "Username must be between 3 and 30 characters long."
        elif not re.match(r"^[a-zA-Z0-9_]+$", username):
            error = "Username can only contain letters, numbers, and underscores (no spaces or special symbols)."
        elif not re.search(r"[a-zA-Z]", username):
            error = "Username must contain at least one letter."
        elif User.objects.filter(username__iexact=username).exists():
            error = f"Username '{username}' is already taken. Please choose another."

        # 3. Email Validation
        else:
            try:
                validate_email(email)
            except ValidationError:
                error = "Please enter a valid email address (e.g. name@example.com)."

            if not error and User.objects.filter(email__iexact=email).exists():
                error = f"An account with email '{email}' already exists. Please log in."

        # 4. Phone Number Validation
        if not error:
            cleaned_phone = re.sub(r"[\s\-\(\)]", "", phone)
            if not re.match(r"^(\+?[1-9]\d{0,3})?[0-9]{10}$", cleaned_phone) and not re.match(r"^\+?[0-9]{10,15}$", cleaned_phone):
                error = "Please enter a valid 10-digit mobile number (e.g. 9876543210 or +919876543210)."

        # 5. Password Validation
        if not error:
            if len(password) < 8:
                error = "Password must be at least 8 characters long."
            elif not re.search(r"[A-Z]", password):
                error = "Password must contain at least one uppercase letter (A-Z)."
            elif not re.search(r"[a-z]", password):
                error = "Password must contain at least one lowercase letter (a-z)."
            elif not re.search(r"[0-9]", password):
                error = "Password must contain at least one number (0-9)."
            elif not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=]", password):
                error = "Password must contain at least one special character (!@#$%^&* etc.)."
            elif password.lower() == username.lower() or password.lower() in email.lower():
                error = "Password cannot be identical to your username or email."
            elif password != confirm_password:
                error = "Passwords do not match. Please re-enter your password correctly."

        if error:
            return render(
                request,
                "register.html",
                {
                    "error": error,
                    "username": username,
                    "email": email,
                    "phone": phone,
                }
            )

        # Create user & UserProfile
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        UserProfile.objects.create(
            user=user,
            phone_number=phone
        )

        login(request, user)
        return redirect("home")

    return render(request, "register.html")


def logout_user(request):
    logout(request)
    return redirect("login")


# ================= MOBILE REST/JSON APIs =================

from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
import json


def api_csrf(request):
    """Provides a fresh CSRF token for mobile app clients."""
    token = get_token(request)
    return JsonResponse({"csrfToken": token, "authenticated": request.user.is_authenticated})


@csrf_exempt
def api_login(request):
    """JSON API for mobile app login."""
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "POST required"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8")) if request.body else request.POST
    except Exception:
        data = request.POST

    login_input = data.get("username", "").strip()
    password = data.get("password", "")

    if not login_input or not password:
        return JsonResponse({"success": False, "message": "Username and password required."}, status=400)

    user = authenticate(request, username=login_input, password=password)

    if user is None and "@" in login_input:
        try:
            user_obj = User.objects.filter(email__iexact=login_input).first()
            if user_obj:
                user = authenticate(request, username=user_obj.username, password=password)
        except Exception:
            user = None

    if user is not None:
        login(request, user)
        return JsonResponse({
            "success": True,
            "username": user.username,
            "email": user.email,
        })

    return JsonResponse({"success": False, "message": "Invalid username or password."}, status=401)


@csrf_exempt
def api_register(request):
    """JSON API for mobile app registration."""
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "POST required"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8")) if request.body else request.POST
    except Exception:
        data = request.POST

    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    phone = data.get("phone", "").strip()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")

    if not username or not email or not phone or not password or not confirm_password:
        return JsonResponse({"success": False, "message": "Please fill in all fields."}, status=400)

    if len(username) < 3 or len(username) > 30:
        return JsonResponse({"success": False, "message": "Username must be between 3 and 30 characters."}, status=400)

    if not re.match(r"^[a-zA-Z0-9_]+$", username):
        return JsonResponse({"success": False, "message": "Username can only contain letters, numbers, and underscores."}, status=400)

    if User.objects.filter(username__iexact=username).exists():
        return JsonResponse({"success": False, "message": f"Username '{username}' is already taken."}, status=400)

    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({"success": False, "message": "Invalid email address."}, status=400)

    if User.objects.filter(email__iexact=email).exists():
        return JsonResponse({"success": False, "message": "Email already registered."}, status=400)

    cleaned_phone = re.sub(r"[\s\-\(\)]", "", phone)
    if not re.match(r"^(\+?[1-9]\d{0,3})?[0-9]{10}$", cleaned_phone) and not re.match(r"^\+?[0-9]{10,15}$", cleaned_phone):
        return JsonResponse({"success": False, "message": "Please enter a valid phone number."}, status=400)

    if len(password) < 8:
        return JsonResponse({"success": False, "message": "Password must be at least 8 characters long."}, status=400)

    if password != confirm_password:
        return JsonResponse({"success": False, "message": "Passwords do not match."}, status=400)

    user = User.objects.create_user(username=username, email=email, password=password)
    UserProfile.objects.create(user=user, phone_number=phone)
    login(request, user)

    return JsonResponse({"success": True, "username": user.username, "email": user.email})



