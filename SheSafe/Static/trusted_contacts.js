document.addEventListener("DOMContentLoaded", function () {

    const alertButtons = document.querySelectorAll(".alert-btn");

    const alertModal = document.getElementById("alertModal");
    const closeAlert = document.getElementById("closeAlert");
    const alertMessage = document.getElementById("alertMessage");

    const sendAlertBtn = document.getElementById("sendAlertBtn");
    const mapBtn = document.getElementById("mapBtn");
    const progressBar = document.getElementById("progressBar");

    let selectedContact = null;
    let emergencyMessage = "";
    let emergencyPhone = "";
    let emergencyMap = "";


    alertButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            selectedContact = {
                name: button.dataset.name,
                phone: button.dataset.phone
            };

            openEmergencyAlert();

        });

    });


    function openEmergencyAlert() {
        alertModal.classList.add("active");
        alertMessage.textContent = "🚨 Dispatching emergency alert immediately to " + (selectedContact ? selectedContact.name : "primary contact") + "...";
        progressBar.style.width = "40%";
        sendAlertBtn.style.display = "none";
        mapBtn.style.display = "none";

        // 1. Immediately send SOS request without waiting on location
        let currentLat = null;
        let currentLng = null;
        sendSOSRequest(currentLat, currentLng);

        // 2. In parallel, non-blocking GPS enrichment
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    currentLat = position.coords.latitude;
                    currentLng = position.coords.longitude;
                    sendSOSRequest(currentLat, currentLng, true);
                },
                function () {
                    // Location denied or skipped, SOS already active
                },
                {
                    enableHighAccuracy: true,
                    timeout: 2500,
                    maximumAge: 0
                }
            );
        }
    }


    function sendSOSRequest(latitude, longitude, isLocationUpdate = false) {
        const csrfToken = getCSRFToken();
        const formData = new FormData();

        formData.append(
            "contact_id",
            getContactId(selectedContact)
        );

        if (latitude !== null && longitude !== null && latitude !== undefined) {
            formData.append("latitude", latitude);
            formData.append("longitude", longitude);
        }

        fetch("/contacts/sos/", {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken,
                "X-Requested-With": "XMLHttpRequest"
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alertMessage.textContent = data.message || "Unable to dispatch alert.";
                return;
            }

            emergencyMessage = data.message;
            emergencyPhone = data.phone;
            emergencyMap = data.map_url;

            progressBar.style.width = "100%";
            alertMessage.innerHTML = `🚨 Emergency alert active for <strong>${escapeHTML(data.contact_name || 'Primary Contact')}</strong> (${escapeHTML(data.display_phone || data.phone)})!`;

            sendAlertBtn.href = data.sms_url || ("sms:" + data.phone + "?body=" + encodeURIComponent(emergencyMessage));
            sendAlertBtn.style.display = "inline-flex";

            if (emergencyMap) {
                mapBtn.href = emergencyMap;
                mapBtn.style.display = "inline-flex";
            }

            // Auto-trigger SMS intent immediately without waiting for extra clicks
            if (!isLocationUpdate && emergencyPhone) {
                window.location.href = data.sms_url || ("sms:" + emergencyPhone + "?body=" + encodeURIComponent(emergencyMessage));
            }
        })
        .catch(error => {
            console.error(error);
            alertMessage.textContent = "Emergency alert prepared. Tap Open Emergency SMS to send.";
            if (selectedContact && selectedContact.phone) {
                sendAlertBtn.style.display = "inline-flex";
                sendAlertBtn.href = "sms:" + selectedContact.phone + "?body=Emergency! Please help me.";
            }
        });
    }

    function escapeHTML(str) {
        if (!str) return "";
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }



    if (closeAlert) {

        closeAlert.addEventListener("click", function () {

            alertModal.classList.remove("active");

        });

    }


    if (alertModal) {

        alertModal.addEventListener("click", function (event) {

            if (event.target === alertModal) {

                alertModal.classList.remove("active");

            }

        });

    }


    function getCSRFToken() {

        const cookieValue =
            document.cookie
                .split("; ")
                .find(row =>
                    row.startsWith("csrftoken=")
                );

        if (!cookieValue) {
            return "";
        }

        return decodeURIComponent(
            cookieValue.split("=")[1]
        );
    }


    function getContactId(contact) {

        const card =
            document.querySelector(
                `.alert-btn[data-phone="${CSS.escape(contact.phone)}"]`
            );

        if (!card) {
            return "";
        }

        const contactCard =
            card.closest(".contact-card");

        if (!contactCard) {
            return "";
        }

        return contactCard.dataset.id || "";

    }

});