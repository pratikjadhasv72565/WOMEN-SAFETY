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

        alertMessage.textContent =
            "Requesting your current location...";

        progressBar.style.width = "20%";

        sendAlertBtn.style.display = "none";
        mapBtn.style.display = "none";


        if (!navigator.geolocation) {

            alertMessage.textContent =
                "Location is not supported by this browser.";

            prepareAlert(null, null);

            return;
        }


        navigator.geolocation.getCurrentPosition(

            function (position) {

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;

                progressBar.style.width = "60%";

                sendSOSRequest(
                    latitude,
                    longitude
                );

            },

            function () {

                alertMessage.textContent =
                    "Location permission was not granted. You can still prepare an emergency SMS.";

                progressBar.style.width = "60%";

                sendSOSRequest(null, null);

            }

        );

    }


    function sendSOSRequest(latitude, longitude) {

        const csrfToken = getCSRFToken();

        const formData = new FormData();

        formData.append(
            "contact_id",
            getContactId(selectedContact)
        );

        if (latitude !== null && longitude !== null) {

            formData.append(
                "latitude",
                latitude
            );

            formData.append(
                "longitude",
                longitude
            );
        }


        fetch("/contacts/sos/", {

            method: "POST",

            headers: {
                "X-CSRFToken": csrfToken
            },

            body: formData

        })

        .then(response => response.json())

        .then(data => {

            if (!data.success) {

                alertMessage.textContent =
                    data.message || "Unable to prepare alert.";

                return;
            }


            emergencyMessage = data.message;
            emergencyPhone = data.phone;
            emergencyMap = data.map_url;


            progressBar.style.width = "100%";

            alertMessage.textContent =
                "Your emergency message is ready.";


            sendAlertBtn.style.display = "inline-flex";


            if (emergencyMap) {

                mapBtn.href = emergencyMap;
                mapBtn.style.display = "inline-flex";

            }

        })

        .catch(error => {

            console.error(error);

            alertMessage.textContent =
                "Something went wrong. Please try again.";

        });

    }


    function prepareAlert(latitude, longitude) {

        let message =
            "Emergency alert from SheSafe. I may need help.";

        if (latitude && longitude) {

            const map =
                `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

            message +=
                ` My current location: ${map}`;
        }

        emergencyMessage = message;

        emergencyPhone =
            selectedContact.phone;

        alertMessage.textContent =
            "Emergency message is ready.";

        sendAlertBtn.style.display =
            "inline-flex";

    }


    sendAlertBtn.addEventListener("click", function () {

        if (!emergencyPhone) {
            return;
        }

        const smsURL =
            "sms:" +
            emergencyPhone +
            "?body=" +
            encodeURIComponent(emergencyMessage);

        window.location.href = smsURL;

    });


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