function toggleMenu() {
    const nav = document.getElementById("navMenu");

    if (nav) {
        nav.classList.toggle("open");
    }
}


document.querySelectorAll("#navMenu a").forEach(function (link) {
    link.addEventListener("click", function () {
        const nav = document.getElementById("navMenu");

        if (nav) {
            nav.classList.remove("open");
        }
    });
});


function getCookie(name) {
    let cookieValue = null;

    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");

        for (let cookie of cookies) {
            cookie = cookie.trim();

            if (cookie.startsWith(name + "=")) {
                cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1)
                );

                break;
            }
        }
    }

    return cookieValue;
}


function openSOS() {
    const modal = document.getElementById("sosModal");
    const modalBox = document.getElementById("sosModalBox");

    if (modal) modal.classList.add("show");
    if (!modalBox) return;

    // Read primary contact data embedded server-side (no fetch needed)
    const phone     = modalBox.dataset.phone       || "";
    const name      = modalBox.dataset.name        || "Primary Contact";
    const hasContact = modalBox.dataset.hasContact === "true";

    const statusText = document.getElementById("sosStatusText");
    const smsBtn     = document.getElementById("sosPrimarySmsBtn");

    function setStatus(msg) {
        if (statusText) statusText.textContent = msg;
    }

    // ── Helper: build and launch the SMS intent with optional map URL ──
    function launchSMS(mapURL) {
        if (!phone || !hasContact) return;

        const body = mapURL
            ? "🚨 EMERGENCY SOS - SheSafe\n\nI need immediate help! Please call me right away.\n\n📍 My live location:\n" + mapURL + "\n\nPlease reach me immediately!"
            : "🚨 EMERGENCY SOS - SheSafe\n\nI need immediate help! Please call me right away.";

        const smsHref = "sms:" + phone + "?body=" + encodeURIComponent(body);

        // Update the SMS button so user can re-tap if needed
        if (smsBtn) {
            smsBtn.href = smsHref;
            smsBtn.querySelector("span").textContent =
                mapURL ? "💬 SMS " + name + " (location included ✓)" : "💬 SMS " + name;
        }

        // Auto-launch the SMS app
        window.location.href = smsHref;
    }

    // ── Step 1: Immediately send a basic SOS SMS (no location yet) ──
    setStatus("📡 Getting your location to include in SMS...");

    if (!hasContact || !phone) {
        setStatus("⚠️ No primary contact set. Use the emergency numbers below.");
        return;
    }

    // ── Step 2: Try to get GPS in the background with a short timeout ──
    // If GPS arrives within 4 s → send SMS with map link.
    // If GPS times out → send SMS without location (already dispatched above).

    let smsSent = false;

    const locationTimeout = setTimeout(function () {
        if (!smsSent) {
            smsSent = true;
            setStatus("⚠️ Location unavailable. Sending SOS SMS without location...");
            launchSMS(null);
        }
    }, 4000); // 4-second max wait for GPS

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                if (smsSent) return; // already sent without location
                clearTimeout(locationTimeout);
                smsSent = true;

                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const mapURL = "https://maps.google.com/?q=" + lat + "," + lng;

                setStatus("📍 Location obtained! Sending emergency SMS with live location...");
                launchSMS(mapURL);
            },
            function () {
                // Permission denied or unavailable — timeout handler will fire
            },
            {
                enableHighAccuracy: true,
                timeout: 3500,
                maximumAge: 0
            }
        );
    } else {
        // Browser has no geolocation at all — send immediately without location
        clearTimeout(locationTimeout);
        smsSent = true;
        setStatus("📵 Location not supported. Sending SOS SMS now...");
        launchSMS(null);
    }
}



async function createSOSAlert(latitude, longitude, isLocationUpdate = false) {
    const csrfToken = getCookie("csrftoken");

    const formData = new FormData();
    if (latitude !== null && longitude !== null && latitude !== undefined) {
        formData.append("latitude", latitude);
        formData.append("longitude", longitude);
    }

    try {
        const response = await fetch(
            "/contacts/sos/",
            {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken || "",
                    "X-Requested-With": "XMLHttpRequest"
                },
                body: formData,
                credentials: "same-origin"
            }
        );

        const data = await response.json();

        if (!data.success) {
            showSOSStatus(data.message || "Unable to dispatch SOS.");
            return;
        }

        const modal = document.getElementById("sosModal");
        const modalBox = modal ? modal.querySelector(".modal-box") : null;

        if (!modalBox) return;

        const oldResult = document.getElementById("sosResult");
        if (oldResult) oldResult.remove();

        const result = document.createElement("div");
        result.id = "sosResult";
        result.style.marginTop = "18px";
        result.style.padding = "16px";
        result.style.borderRadius = "14px";
        result.style.background = "#fff5f5";
        result.style.border = "2px solid #fca5a5";
        result.style.color = "#1f2937";
        result.style.lineHeight = "1.5";
        result.style.textAlign = "center";

        const contactName = data.contact_name || "Primary Contact";
        const contactPhone = data.display_phone || data.phone || "112";

        result.innerHTML = `
            <div style="font-size: 13px; font-weight: 800; color: #dc2626; letter-spacing: 1px; margin-bottom: 6px; text-transform: uppercase;">
                <i class="fa-solid fa-satellite-dish"></i> Emergency SOS Dispatched
            </div>
            <p style="font-size: 14px; margin-bottom: 12px; color: #374151;">
                Primary Contact: <strong style="color: #111827;">${escapeHTML(contactName)}</strong> (${escapeHTML(contactPhone)})
            </p>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                <a href="${data.tel_url || 'tel:' + data.phone}" id="directCallBtn" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: 10px; background: #dc2626; color: #fff; font-weight: 800; font-size: 14px; text-decoration: none; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);">
                    <i class="fa-solid fa-phone-volume"></i> Direct Call Primary Contact (${escapeHTML(contactPhone)})
                </a>
                <a href="${data.sms_url || 'sms:' + data.phone}" id="directSmsBtn" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: 10px; background: #7c3aed; color: #fff; font-weight: 800; font-size: 14px; text-decoration: none; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);">
                    <i class="fa-solid fa-comment-sms"></i> Send Emergency SMS (${escapeHTML(contactName)})
                </a>
                ${data.map_url ? `
                <a href="${data.map_url}" target="_blank" rel="noopener" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 8px; background: #f3f4f6; color: #374151; font-weight: 600; font-size: 12px; text-decoration: none;">
                    <i class="fa-solid fa-location-dot" style="color: #dc2626;"></i> View Live GPS Location
                </a>
                ` : ''}
            </div>
        `;

        modalBox.appendChild(result);

        // Auto trigger direct action on first alert dispatch (without blocking or asking permission)
        if (!isLocationUpdate && data.phone) {
            // Immediately open SMS intent to the primary contact
            window.location.href = data.sms_url || ("sms:" + data.phone + "?body=" + encodeURIComponent(data.message));
        }

        showSOSStatus("🚨 Emergency channels activated for " + escapeHTML(contactName) + ".");
    } catch (error) {
        console.error("SOS error:", error);
        showSOSStatus("Emergency connection error. Please use direct emergency dial below.");
    }
}



function escapeHTML(value) {
    const div =
        document.createElement("div");

    div.textContent =
        value;

    return div.innerHTML;
}


function showSOSStatus(message) {
    let status =
        document.getElementById("sosStatus");


    if (!status) {
        status =
            document.createElement("div");

        status.id =
            "sosStatus";

        status.style.marginTop =
            "15px";

        status.style.padding =
            "12px";

        status.style.borderRadius =
            "10px";

        status.style.fontSize =
            "14px";

        status.style.lineHeight =
            "1.5";


        const modalBox =
            document.querySelector(
                ".modal-box"
            );


        if (modalBox) {
            modalBox.appendChild(status);
        }
    }


    status.textContent =
        message;
}


function closeSOS() {
    const modal =
        document.getElementById(
            "sosModal"
        );


    if (modal) {
        modal.classList.remove(
            "show"
        );
    }
}


const sosModal =
    document.getElementById(
        "sosModal"
    );


if (sosModal) {
    sosModal.addEventListener(
        "click",
        function (event) {
            if (
                event.target ===
                sosModal
            ) {
                closeSOS();
            }
        }
    );
}


document.addEventListener(
    "keydown",
    function (event) {
        if (
            event.key ===
            "Escape"
        ) {
            closeSOS();
        }
    }
);


const themeBtn =
    document.getElementById(
        "themeBtn"
    );


if (themeBtn) {
    themeBtn.addEventListener(
        "click",
        function () {
            document.body.classList.toggle(
                "dark"
            );


            const icon =
                themeBtn.querySelector(
                    "i"
                );


            if (!icon) {
                return;
            }


            if (
                document.body.classList.contains(
                    "dark"
                )
            ) {
                icon.classList.remove(
                    "fa-moon"
                );

                icon.classList.add(
                    "fa-sun"
                );

                localStorage.setItem(
                    "theme",
                    "dark"
                );
            }

            else {
                icon.classList.remove(
                    "fa-sun"
                );

                icon.classList.add(
                    "fa-moon"
                );

                localStorage.setItem(
                    "theme",
                    "light"
                );
            }
        }
    );


    if (
        localStorage.getItem(
            "theme"
        ) === "dark"
    ) {
        document.body.classList.add(
            "dark"
        );


        const icon =
            themeBtn.querySelector(
                "i"
            );


        if (icon) {
            icon.classList.remove(
                "fa-moon"
            );

            icon.classList.add(
                "fa-sun"
            );
        }
    }
}


const subscribeForm =
    document.getElementById(
        "subscribeForm"
    );


if (subscribeForm) {
    subscribeForm.addEventListener(
        "submit",
        function (event) {
            event.preventDefault();


            const emailInput =
                document.getElementById(
                    "email"
                );


            if (!emailInput) {
                return;
            }


            const email =
                emailInput.value.trim();


            if (email === "") {
                return;
            }


            alert(
                "Thank you for subscribing! Safety updates will be shared with you."
            );


            subscribeForm.reset();
        }
    );
}


const sections =
    document.querySelectorAll(
        "section[id]"
    );


const navLinks =
    document.querySelectorAll(
        "#navMenu a"
    );


window.addEventListener(
    "scroll",
    function () {
        let current = "";


        sections.forEach(
            function (section) {
                const sectionTop =
                    section.offsetTop -
                    150;


                if (
                    window.scrollY >=
                    sectionTop
                ) {
                    current =
                        section.getAttribute(
                            "id"
                        );
                }
            }
        );


        navLinks.forEach(
            function (link) {
                link.classList.remove(
                    "active"
                );


                if (
                    link.getAttribute(
                        "href"
                    ) ===
                    "#" + current
                ) {
                    link.classList.add(
                        "active"
                    );
                }
            }
        );
    }
);


function handleEmergencyCall(
    number,
    service
) {
    const notification =
        document.getElementById(
            "emergencyNotification"
        );


    const title =
        document.getElementById(
            "notificationTitle"
        );


    const message =
        document.getElementById(
            "notificationMessage"
        );


    const locationLink =
        document.getElementById(
            "locationLink"
        );


    if (!notification) {
        window.location.href =
            "tel:" + number;

        return;
    }


    notification.classList.add(
        "show"
    );


    if (title) {
        title.textContent =
            service;
    }


    if (message) {
        message.textContent =
            "Requesting your location permission...";
    }


    if (locationLink) {
        locationLink.style.display =
            "none";
    }


    if (!navigator.geolocation) {
        if (message) {
            message.textContent =
                "Location is not supported. Opening the phone dialer.";
        }


        setTimeout(
            function () {
                window.location.href =
                    "tel:" + number;
            },
            800
        );


        return;
    }


    navigator.geolocation.getCurrentPosition(
        function (position) {
            const latitude =
                position.coords.latitude;


            const longitude =
                position.coords.longitude;


            const mapsURL =
                "https://www.google.com/maps?q=" +
                latitude +
                "," +
                longitude;


            if (locationLink) {
                locationLink.href =
                    mapsURL;

                locationLink.style.display =
                    "inline-flex";
            }


            if (message) {
                message.textContent =
                    "Your location is available. Opening the phone dialer.";
            }


            setTimeout(
                function () {
                    window.location.href =
                        "tel:" + number;
                },
                700
            );
        },


        function () {
            if (message) {
                message.textContent =
                    "Location permission was not granted. You can still call " +
                    number +
                    ".";
            }


            setTimeout(
                function () {
                    window.location.href =
                        "tel:" + number;
                },
                1000
            );
        },


        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}


function closeEmergencyNotification() {
    const notification =
        document.getElementById(
            "emergencyNotification"
        );


    if (notification) {
        notification.classList.remove(
            "show"
        );
    }
}


document.addEventListener(
    "DOMContentLoaded",
    function () {
        console.log(
            "SheSafe JavaScript loaded successfully."
        );
    }
);