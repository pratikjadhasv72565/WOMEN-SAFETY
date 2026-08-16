document.addEventListener("DOMContentLoaded", function () {
    const checkinForm = document.getElementById("checkinForm");
    const startButton = document.getElementById("startCheckin");

    if (checkinForm && startButton) {
        checkinForm.addEventListener("submit", function (e) {
            const contactInput = document.getElementById("contact");
            if (contactInput && !contactInput.value.trim()) {
                e.preventDefault();
                alert("Please enter or select a trusted contact name.");
                contactInput.focus();
                return;
            }

            startButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Starting Check-In...';
        });
    }
});

function focusDuration() {
    const element = document.getElementById("duration");
    if (element) {
        element.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
        element.focus();
    }
}

function focusContact() {
    const element = document.getElementById("contact");
    if (element) {
        element.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
        element.focus();
    }
}