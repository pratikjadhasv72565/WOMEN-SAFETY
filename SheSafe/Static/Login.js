document.addEventListener("DOMContentLoaded", function () {
    // ----------------------------------------------------
    // Helper function to setup password visibility toggles
    // ----------------------------------------------------
    function setupPasswordToggle(inputId, toggleId) {
        const input = document.getElementById(inputId);
        const toggle = document.getElementById(toggleId);

        if (toggle && input) {
            toggle.addEventListener("click", function () {
                const icon = toggle.querySelector("i");
                if (input.type === "password") {
                    input.type = "text";
                    if (icon) {
                        icon.classList.remove("fa-eye");
                        icon.classList.add("fa-eye-slash");
                    }
                } else {
                    input.type = "password";
                    if (icon) {
                        icon.classList.remove("fa-eye-slash");
                        icon.classList.add("fa-eye");
                    }
                }
            });
        }
    }

    setupPasswordToggle("password", "passwordToggle");
    setupPasswordToggle("confirm_password", "confirmPasswordToggle");

    // ----------------------------------------------------
    // Login Form Submit Handling
    // ----------------------------------------------------
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

    // ----------------------------------------------------
    // Register Form Validation & Interactive Feedback
    // ----------------------------------------------------
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        const usernameInput = document.getElementById("username");
        const emailInput = document.getElementById("email");
        const phoneInput = document.getElementById("phone");
        const passwordInput = document.getElementById("password");
        const confirmPasswordInput = document.getElementById("confirm_password");

        // Helper: update field UI state
        function setFieldState(inputEl, statusIconId, feedbackId, isValid, message) {
            if (!inputEl) return;
            const inputBox = inputEl.closest(".input-box");
            const statusIcon = document.getElementById(statusIconId);
            const feedbackEl = document.getElementById(feedbackId);

            if (inputBox) {
                inputBox.classList.remove("is-valid", "is-invalid");
                if (isValid === true) {
                    inputBox.classList.add("is-valid");
                } else if (isValid === false) {
                    inputBox.classList.add("is-invalid");
                }
            }

            if (statusIcon) {
                if (isValid === true) {
                    statusIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
                } else if (isValid === false) {
                    statusIcon.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
                } else {
                    statusIcon.innerHTML = "";
                }
            }

            if (feedbackEl) {
                if (message) {
                    feedbackEl.innerHTML = `<i class="fa-solid ${isValid ? 'fa-check' : 'fa-circle-exclamation'}"></i> ${message}`;
                    feedbackEl.className = `field-feedback active ${isValid ? 'success-msg' : 'error-msg'}`;
                } else {
                    feedbackEl.innerHTML = "";
                    feedbackEl.className = "field-feedback";
                }
            }
        }

        // 1. Validate Username
        function validateUsername(showRequired = false) {
            if (!usernameInput) return true;
            const val = usernameInput.value.trim();

            if (!val) {
                if (showRequired) {
                    setFieldState(usernameInput, "usernameStatus", "usernameFeedback", false, "Username is required.");
                    return false;
                }
                setFieldState(usernameInput, "usernameStatus", "usernameFeedback", null, "");
                return false;
            }

            if (val.length < 3 || val.length > 30) {
                setFieldState(usernameInput, "usernameStatus", "usernameFeedback", false, "Username must be between 3 and 30 characters.");
                return false;
            }

            if (!/^[a-zA-Z0-9_]+$/.test(val)) {
                setFieldState(usernameInput, "usernameStatus", "usernameFeedback", false, "Only letters, numbers, and underscores are allowed.");
                return false;
            }

            if (!/[a-zA-Z]/.test(val)) {
                setFieldState(usernameInput, "usernameStatus", "usernameFeedback", false, "Username must contain at least one letter.");
                return false;
            }

            setFieldState(usernameInput, "usernameStatus", "usernameFeedback", true, "Username format is valid.");
            return true;
        }

        // 2. Validate Email
        function validateEmail(showRequired = false) {
            if (!emailInput) return true;
            const val = emailInput.value.trim();

            if (!val) {
                if (showRequired) {
                    setFieldState(emailInput, "emailStatus", "emailFeedback", false, "Email address is required.");
                    return false;
                }
                setFieldState(emailInput, "emailStatus", "emailFeedback", null, "");
                return false;
            }

            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(val)) {
                setFieldState(emailInput, "emailStatus", "emailFeedback", false, "Please enter a valid email address (e.g. name@example.com).");
                return false;
            }

            setFieldState(emailInput, "emailStatus", "emailFeedback", true, "Email address looks valid.");
            return true;
        }

        // 3. Validate Phone Number
        function validatePhone(showRequired = false) {
            if (!phoneInput) return true;
            const val = phoneInput.value.trim();

            if (!val) {
                if (showRequired) {
                    setFieldState(phoneInput, "phoneStatus", "phoneFeedback", false, "Phone number is required.");
                    return false;
                }
                setFieldState(phoneInput, "phoneStatus", "phoneFeedback", null, "");
                return false;
            }

            // Remove spaces, hyphens, parentheses
            const clean = val.replace(/[\s\-\(\)]/g, "");

            // Validate Indian/International phone number format
            const phoneRegex = /^(\+?[1-9]\d{0,3})?[0-9]{10}$/;
            const intlRegex = /^\+?[0-9]{10,15}$/;

            if (!phoneRegex.test(clean) && !intlRegex.test(clean)) {
                setFieldState(phoneInput, "phoneStatus", "phoneFeedback", false, "Please enter a valid 10-digit mobile number (e.g. 9876543210).");
                return false;
            }

            setFieldState(phoneInput, "phoneStatus", "phoneFeedback", true, "Phone number format is valid.");
            return true;
        }

        // 4. Validate Password & Strength
        function validatePassword(showRequired = false) {
            if (!passwordInput) return true;
            const val = passwordInput.value;
            const strengthContainer = document.getElementById("passwordStrengthContainer");
            const strengthBarFill = document.getElementById("strengthBarFill");
            const strengthText = document.getElementById("strengthText");

            // Requirements elements
            const reqLength = document.getElementById("req-length");
            const reqUpper = document.getElementById("req-upper");
            const reqLower = document.getElementById("req-lower");
            const reqNumber = document.getElementById("req-number");
            const reqSpecial = document.getElementById("req-special");

            if (!val) {
                if (strengthContainer) strengthContainer.style.display = "none";
                if (showRequired) {
                    setFieldState(passwordInput, null, "passwordFeedback", false, "Password is required.");
                    return false;
                }
                setFieldState(passwordInput, null, "passwordFeedback", null, "");
                return false;
            }

            if (strengthContainer) strengthContainer.style.display = "block";

            // Check criteria
            const hasLength = val.length >= 8;
            const hasUpper = /[A-Z]/.test(val);
            const hasLower = /[a-z]/.test(val);
            const hasNumber = /[0-9]/.test(val);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_+=]/.test(val);

            function updateReqPill(el, isMet) {
                if (!el) return;
                const icon = el.querySelector("i");
                if (isMet) {
                    el.classList.remove("unmet-err");
                    el.classList.add("met");
                    if (icon) {
                        icon.className = "fa-solid fa-circle-check";
                    }
                } else {
                    el.classList.remove("met");
                    if (icon) {
                        icon.className = "fa-solid fa-circle-xmark";
                    }
                }
            }

            updateReqPill(reqLength, hasLength);
            updateReqPill(reqUpper, hasUpper);
            updateReqPill(reqLower, hasLower);
            updateReqPill(reqNumber, hasNumber);
            updateReqPill(reqSpecial, hasSpecial);

            // Calculate strength score
            let score = 0;
            if (hasLength) score++;
            if (hasUpper && hasLower) score++;
            if (hasNumber) score++;
            if (hasSpecial) score++;

            // Strength bar update
            if (strengthBarFill && strengthText) {
                strengthBarFill.className = "strength-bar-fill";
                strengthText.className = "";

                if (score <= 1) {
                    strengthBarFill.classList.add("strength-weak");
                    strengthText.classList.add("strength-weak");
                    strengthText.innerText = "Weak";
                } else if (score === 2) {
                    strengthBarFill.classList.add("strength-fair");
                    strengthText.classList.add("strength-fair");
                    strengthText.innerText = "Fair";
                } else if (score === 3) {
                    strengthBarFill.classList.add("strength-good");
                    strengthText.classList.add("strength-good");
                    strengthText.innerText = "Good";
                } else {
                    strengthBarFill.classList.add("strength-strong");
                    strengthText.classList.add("strength-strong");
                    strengthText.innerText = "Strong";
                }
            }

            const allCriteriaMet = hasLength && hasUpper && hasLower && hasNumber && hasSpecial;
            const inputBox = passwordInput.closest(".input-box");

            if (inputBox) {
                inputBox.classList.remove("is-valid", "is-invalid");
                if (allCriteriaMet) {
                    inputBox.classList.add("is-valid");
                } else if (val.length > 0 && showRequired) {
                    inputBox.classList.add("is-invalid");
                }
            }

            if (!allCriteriaMet && showRequired) {
                setFieldState(passwordInput, null, "passwordFeedback", false, "Please meet all password requirements above.");
                return false;
            } else if (allCriteriaMet) {
                setFieldState(passwordInput, null, "passwordFeedback", true, "Strong password created.");
            } else {
                setFieldState(passwordInput, null, "passwordFeedback", null, "");
            }

            // Also re-validate confirm password if it has a value
            if (confirmPasswordInput && confirmPasswordInput.value) {
                validateConfirmPassword();
            }

            return allCriteriaMet;
        }

        // 5. Validate Confirm Password
        function validateConfirmPassword(showRequired = false) {
            if (!confirmPasswordInput || !passwordInput) return true;
            const passVal = passwordInput.value;
            const confirmVal = confirmPasswordInput.value;

            if (!confirmVal) {
                if (showRequired) {
                    setFieldState(confirmPasswordInput, null, "confirmPasswordFeedback", false, "Please confirm your password.");
                    return false;
                }
                setFieldState(confirmPasswordInput, null, "confirmPasswordFeedback", null, "");
                return false;
            }

            if (passVal !== confirmVal) {
                setFieldState(confirmPasswordInput, null, "confirmPasswordFeedback", false, "Passwords do not match.");
                return false;
            }

            setFieldState(confirmPasswordInput, null, "confirmPasswordFeedback", true, "Passwords match!");
            return true;
        }

        // Event listeners for real-time validation
        if (usernameInput) {
            usernameInput.addEventListener("input", () => validateUsername(false));
            usernameInput.addEventListener("blur", () => validateUsername(true));
        }

        if (emailInput) {
            emailInput.addEventListener("input", () => validateEmail(false));
            emailInput.addEventListener("blur", () => validateEmail(true));
        }

        if (phoneInput) {
            // Allow typing numbers, spaces, plus, hyphens
            phoneInput.addEventListener("input", function (e) {
                // Filter illegal characters
                this.value = this.value.replace(/[^0-9+\s\-()]/g, "");
                validatePhone(false);
            });
            phoneInput.addEventListener("blur", () => validatePhone(true));
        }

        if (passwordInput) {
            passwordInput.addEventListener("input", () => validatePassword(false));
            passwordInput.addEventListener("blur", () => validatePassword(true));
        }

        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener("input", () => validateConfirmPassword(false));
            confirmPasswordInput.addEventListener("blur", () => validateConfirmPassword(true));
        }

        // Trigger initial validation check if fields have pre-filled values from backend error
        if (usernameInput && usernameInput.value) validateUsername(false);
        if (emailInput && emailInput.value) validateEmail(false);
        if (phoneInput && phoneInput.value) validatePhone(false);

        // Form Submit Handler
        registerForm.addEventListener("submit", function (e) {
            const isUserValid = validateUsername(true);
            const isEmailValid = validateEmail(true);
            const isPhoneValid = validatePhone(true);
            const isPassValid = validatePassword(true);
            const isConfirmValid = validateConfirmPassword(true);

            if (!isUserValid || !isEmailValid || !isPhoneValid || !isPassValid || !isConfirmValid) {
                e.preventDefault();

                // Find first invalid input and focus/shake
                const fields = [
                    { valid: isUserValid, id: "group-username", input: usernameInput },
                    { valid: isEmailValid, id: "group-email", input: emailInput },
                    { valid: isPhoneValid, id: "group-phone", input: phoneInput },
                    { valid: isPassValid, id: "group-password", input: passwordInput },
                    { valid: isConfirmValid, id: "group-confirm-password", input: confirmPasswordInput }
                ];

                for (let field of fields) {
                    if (!field.valid) {
                        const group = document.getElementById(field.id);
                        if (group) {
                            group.classList.remove("shake");
                            void group.offsetWidth; // Force reflow
                            group.classList.add("shake");
                        }
                        if (field.input) {
                            field.input.focus();
                        }
                        break;
                    }
                }
                return false;
            }

            const registerButton = registerForm.querySelector(".login-btn");
            if (registerButton) {
                registerButton.disabled = true;
                registerButton.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';
            }
        });
    }
});