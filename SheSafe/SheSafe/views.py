from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages


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
        password = request.POST.get("password", "")
        confirm_password = request.POST.get("confirm_password", "")

        error = None

        if not username or not email or not password:
            error = "All required fields must be filled."
        elif password != confirm_password:
            error = "Passwords do not match."
        elif len(password) < 6:
            error = "Password must be at least 6 characters long."
        elif User.objects.filter(username__iexact=username).exists():
            error = f"Username '{username}' is already taken. Please choose another."
        elif User.objects.filter(email__iexact=email).exists():
            error = f"An account with email '{email}' already exists. Please log in."

        if error:
            return render(
                request,
                "register.html",
                {
                    "error": error,
                    "username": username,
                    "email": email
                }
            )

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        login(request, user)
        return redirect("home")

    return render(request, "register.html")


def logout_user(request):
    logout(request)
    return redirect("login")

