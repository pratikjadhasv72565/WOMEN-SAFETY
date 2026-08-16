document.addEventListener("DOMContentLoaded", function () {
    const passwordInput = document.getElementById("password");
    const passwordToggle = document.getElementById("passwordToggle");

    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener("click", function () {
            const icon = passwordToggle.querySelector("i");

            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                if (icon) {
                    icon.classList.remove("fa-eye");
                    icon.classList.add("fa-eye-slash");
                }
            } else {
                passwordInput.type = "password";
                if (icon) {
                    icon.classList.remove("fa-eye-slash");
                    icon.classList.add("fa-eye");
                }
            }
        });
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function () {
            const loginButton = loginForm.querySelector(".login-btn");
            if (loginButton) {
                loginButton.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Signing In...';
            }
        });
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", function () {
            const registerButton = registerForm.querySelector(".login-btn");
            if (registerButton) {
                registerButton.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';
            }
        });
    }
});