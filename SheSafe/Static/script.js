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


async function openSOS() {
    const modal = document.getElementById("sosModal");

    if (!modal) {
        return;
    }

    modal.classList.add("show");

    showSOSStatus(
        "🚨 SOS activated. Requesting your current location..."
    );

    if (!navigator.geolocation) {
        showSOSStatus(
            "Location is not supported by this browser."
        );

        return;
    }

    navigator.geolocation.getCurrentPosition(
        async function (position) {
            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            showSOSStatus(
                "📍 Location received. Preparing emergency alert..."
            );

            await createSOSAlert(
                latitude,
                longitude
            );
        },

        function () {
            showSOSStatus(
                "⚠️ Location permission was not granted. Please allow location access and try again."
            );
        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}


async function createSOSAlert(latitude, longitude) {
    const csrfToken = getCookie("csrftoken");

    if (!csrfToken) {
        showSOSStatus(
            "Security token missing. Please refresh the page and try again."
        );

        return;
    }

    const formData = new FormData();

    formData.append(
        "latitude",
        latitude
    );

    formData.append(
        "longitude",
        longitude
    );

    try {
        const response = await fetch(
            "/contacts/sos/",
            {
                method: "POST",

                headers: {
                    "X-CSRFToken": csrfToken,
                    "X-Requested-With": "XMLHttpRequest"
                },

                body: formData,

                credentials: "same-origin"
            }
        );

        const responseText =
            await response.text();

        let data;

        try {
            data = JSON.parse(responseText);
        }

        catch (error) {
            console.error(
                "Invalid server response:",
                responseText
            );

            showSOSStatus(
                "Server returned an invalid response."
            );

            return;
        }

        if (!response.ok) {
            showSOSStatus(
                data.message ||
                "Server error: " + response.status
            );

            return;
        }

        if (!data.success) {
            showSOSStatus(
                data.message ||
                "Unable to create SOS alert."
            );

            return;
        }

        showSOSStatus(
            "🚨 Emergency alert created successfully."
        );


        const modal =
            document.getElementById("sosModal");

        const modalBox =
            modal
                ? modal.querySelector(".modal-box")
                : null;


        if (!modalBox) {
            return;
        }


        const oldResult =
            document.getElementById("sosResult");

        if (oldResult) {
            oldResult.remove();
        }


        const mapURL =
            data.map_url ||
            "https://www.google.com/maps?q=" +
            latitude +
            "," +
            longitude;


        const smsURL =
            "sms:" +
            data.phone +
            "?body=" +
            encodeURIComponent(
                data.message
            );


        const result =
            document.createElement("div");

        result.id = "sosResult";

        result.style.marginTop = "18px";
        result.style.padding = "16px";
        result.style.borderRadius = "12px";
        result.style.background = "#f8f5ff";
        result.style.border = "1px solid #ddd";
        result.style.color = "#222";
        result.style.lineHeight = "1.6";


        const title =
            document.createElement("strong");

        title.textContent =
            "🚨 EMERGENCY ALERT";


        const contact =
            document.createElement("p");

        contact.innerHTML =
            "<strong>Primary Trusted Contact:</strong><br>" +
            escapeHTML(
                data.contact_name ||
                "Not available"
            );


        const message =
            document.createElement("p");

        message.textContent =
            "Your emergency message and current location are ready.";


        const mapButton =
            document.createElement("a");

        mapButton.href = mapURL;
        mapButton.target = "_blank";
        mapButton.rel = "noopener";
        mapButton.textContent =
            "📍 View Current Location";

        mapButton.style.display =
            "inline-block";

        mapButton.style.margin =
            "5px";

        mapButton.style.padding =
            "10px 14px";

        mapButton.style.borderRadius =
            "8px";

        mapButton.style.textDecoration =
            "none";

        mapButton.style.background =
            "#6c35c9";

        mapButton.style.color =
            "#ffffff";


        const smsButton =
            document.createElement("a");

        smsButton.href = smsURL;
        smsButton.textContent =
            "💬 Open SMS";

        smsButton.style.display =
            "inline-block";

        smsButton.style.margin =
            "5px";

        smsButton.style.padding =
            "10px 14px";

        smsButton.style.borderRadius =
            "8px";

        smsButton.style.textDecoration =
            "none";

        smsButton.style.background =
            "#ef4444";

        smsButton.style.color =
            "#ffffff";


        result.appendChild(title);
        result.appendChild(contact);
        result.appendChild(message);
        result.appendChild(mapButton);
        result.appendChild(smsButton);


        modalBox.appendChild(result);


        console.log(
            "SOS Alert ID:",
            data.alert_id
        );

        console.log(
            "Primary Contact:",
            data.contact_name
        );

        console.log(
            "Primary Phone:",
            data.phone
        );

        console.log(
            "Latitude:",
            data.latitude
        );

        console.log(
            "Longitude:",
            data.longitude
        );

        console.log(
            "Google Maps:",
            data.map_url
        );

    }

    catch (error) {
        console.error(
            "SOS connection error:",
            error
        );

        showSOSStatus(
            "Could not connect to the SheSafe server."
        );
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