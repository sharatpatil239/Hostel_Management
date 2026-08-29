/* =========================================================
   LOGIN PAGE — FRONTEND ONLY
   No backend, no fetch(), no localStorage.
   TODO: Replace the dummy credential check below with a real
   POST /api/auth/login call once the backend is available.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  // Placeholder credentials — will later be verified by the backend.
  // TODO: Replace with POST /api/auth/login { username, password }
  const DUMMY_ADMIN = { username: 'admin', password: 'admin123' };

  const form = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const usernameField = document.getElementById('usernameField');
  const passwordField = document.getElementById('passwordField');
  const loginError = document.getElementById('loginError');
  const loginErrorText = document.getElementById('loginErrorText');
  const pwToggle = document.getElementById('pwToggle');
  const forgotLink = document.getElementById('forgotLink');

  // Toggle password visibility
  pwToggle.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    pwToggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  });

  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Please contact your system administrator to reset your password.');
  });

  function setFieldValid(fieldEl, valid){
    fieldEl.classList.toggle('invalid', !valid);
  }

  function validate(){
    let valid = true;

    if (!usernameInput.value.trim()){
      setFieldValid(usernameField, false);
      valid = false;
    } else {
      setFieldValid(usernameField, true);
    }

    if (!passwordInput.value.trim()){
      setFieldValid(passwordField, false);
      valid = false;
    } else {
      setFieldValid(passwordField, true);
    }

    return valid;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    loginError.classList.remove('show');

    if (!validate()) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // TODO: Replace this dummy check with a real backend authentication call:
    // fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
    if (username === DUMMY_ADMIN.username && password === DUMMY_ADMIN.password){
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Signing in...';
      submitBtn.disabled = true;
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    } else {
      loginErrorText.textContent = 'Invalid username or password. Please try again.';
      loginError.classList.add('show');
    }
  });

  // Clear inline error state as the admin edits fields
  usernameInput.addEventListener('input', () => setFieldValid(usernameField, true));
  passwordInput.addEventListener('input', () => setFieldValid(passwordField, true));
});
