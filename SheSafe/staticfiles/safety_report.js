const reportForm = document.getElementById("reportForm");

const description = document.getElementById("description");
const charCount = document.getElementById("charCount");

const evidence = document.getElementById("evidence");
const fileName = document.getElementById("fileName");

description.addEventListener("input", function () {

    if (this.value.length > 1000) {
        this.value = this.value.substring(0, 1000);
    }

    charCount.textContent = this.value.length;
});


evidence.addEventListener("change", function () {

    if (this.files.length > 0) {

        fileName.textContent =
            "Selected: " + this.files[0].name;

    } else {

        fileName.textContent = "";

    }

});


reportForm.addEventListener("submit", function () {

    const submitButton =
        document.querySelector(".submit-btn");

    submitButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

    submitButton.disabled = true;

});