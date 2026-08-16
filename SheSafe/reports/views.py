from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from .models import SafetyReport


@login_required
def safety_report(request):

    if request.method == "POST":

        SafetyReport.objects.create(
            user=request.user,
            report_type=request.POST.get("report_type"),
            incident_date=request.POST.get("incident_date"),
            incident_time=request.POST.get("incident_time"),
            location=request.POST.get("location"),
            description=request.POST.get("description"),
            evidence=request.FILES.get("evidence"),
        )

        return redirect("safety_report")

    reports = SafetyReport.objects.filter(
        user=request.user
    ).order_by("-created_at")

    return render(
        request,
        "safety_report.html",
        {
            "reports": reports
        }
    )