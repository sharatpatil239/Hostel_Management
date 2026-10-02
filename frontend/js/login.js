/* =========================================================
   LOGIN PAGE — REAL AUTHENTICATION
   Connects to POST /api/auth/login, stores JWT and manages session.
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
    // If the user already has a valid token, redirect directly to dashboard
    const existingToken = api.getToken();
    if (existingToken) {
        try {
            await api.get('/api/auth/me');
            window.location.href = 'dashboard.html';
            return;
        } catch {
            // Stale or invalid token — clear and proceed with login
            api.removeToken();
            api.removeUser();
        }
    }

    const form = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const usernameField = document.getElementById('usernameField');
    const passwordField = document.getElementById('passwordField');
    const loginError = document.getElementById('loginError');
    const loginErrorText = document.getElementById('loginErrorText');
    const pwToggle = document.getElementById('pwToggle');
    const forgotLink = document.getElementById('forgotLink');
    const submitBtn = document.getElementById('loginSubmitBtn') || form.querySelector('button[type="submit"]');

    // Toggle password visibility
    pwToggle.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        pwToggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });

    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Please run the backend seed script or contact the administrator to reset credentials.');
    });

    function setFieldValid(fieldEl, valid) {
        fieldEl.classList.toggle('invalid', !valid);
    }

    function validate() {
        let valid = true;

        if (!usernameInput.value.trim()) {
            setFieldValid(usernameField, false);
            valid = false;
        } else {
            setFieldValid(usernameField, true);
        }

        if (!passwordInput.value.trim()) {
            setFieldValid(passwordField, false);
            valid = false;
        } else {
            setFieldValid(passwordField, true);
        }

        return valid;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.classList.remove('show');

        if (!validate()) return;

        const identifier = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // UI Loading State
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Signing in...';
        submitBtn.disabled = true;

        try {
            const response = await api.post('/api/auth/login', {
                email: identifier,
                username: identifier,
                password
            });

            const token = response.token || response.data?.token;
            const admin = response.data?.admin || response.admin;

            if (token) {
                api.setToken(token);
                if (admin) api.setUser(admin);

                submitBtn.textContent = 'Success! Redirecting...';
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 300);
            } else {
                throw new Error('Authentication succeeded but no token was provided');
            }
        } catch (error) {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;

            const message = error.message || 'Invalid email/username or password. Please try again.';
            loginErrorText.textContent = message;
            loginError.classList.add('show');
        }
    });

    // Clear inline error state on user typing
    usernameInput.addEventListener('input', () => setFieldValid(usernameField, true));
    passwordInput.addEventListener('input', () => setFieldValid(passwordField, true));
});
