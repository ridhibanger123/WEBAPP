/**
 * Authentication Controller (Frontend)
 * Manages tab switching, form submission, and route redirection
 */

document.addEventListener('DOMContentLoaded', async () => {
  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabRegisterBtn = document.getElementById('tab-register-btn');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const helpText = document.getElementById('auth-help-text');

  // Check if admin is already logged in
  try {
    const res = await apiRequest('/api/auth/me');
    if (res.success && res.admin) {
      // User is already authenticated, redirect straight to dashboard
      window.location.href = 'dashboard.html';
      return;
    }
  } catch (err) {
    // Not logged in, stay on login page (normal behavior)
  }

  // Tab switching: Login Tab
  tabLoginBtn.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    helpText.innerHTML = 'First time setup? Click <strong>Register First Admin</strong> to create your credentials.';
  });

  // Tab switching: Register Tab
  tabRegisterBtn.addEventListener('click', () => {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    helpText.innerHTML = 'Already have an administrator account? Switch back to <strong>Admin Login</strong>.';
  });

  // 1. Handle Login Submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('btn-login-submit');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showToast('Please enter both email and password', 'warning');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Authenticating...';

      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      showToast(`Welcome back, ${data.admin.name}! Redirecting...`, 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 700);
    } catch (error) {
      showToast(error.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In to Dashboard';
    }
  });

  // 2. Handle Registration Submission
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('btn-reg-submit');
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!name || !email || !password) {
      showToast('Please fill out all registration fields', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'warning');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Setting up Admin Account...';

      const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      showToast('Admin account created! Directing to dashboard...', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 700);
    } catch (error) {
      showToast(error.message || 'Registration failed', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Admin Account';
    }
  });
});
