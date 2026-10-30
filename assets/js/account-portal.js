/**
 * WHIZ STUDIO - COMPLETE CLERK-POWERED CLIENT & ADMIN ACCOUNT SYSTEM
 * Technology: Clerk JS SDK v5, Cloudflare D1 Backend API, Vanilla JS, GSAP 3.12+
 * Domain: whizstudio.art | Security: Role-Based Access Control ($0 Free Tier)
 */

(function () {
  'use strict';

  const CLERK_PUBLISHABLE_KEY = 'pk_test_cG9ldGljLWxpZ2VyLTQzNTUuY2xlcmsuYWNjb3VudHMuZGV2JA';
  const API_BASE = 'https://whiz-api.kaziaremon.workers.dev/api/v1/portal';
  const MANDATORY_FOUNDING_SUPER_ADMIN = 'kaziaremon@gmail.com';

  // Global State
  const state = {
    clerkLoaded: false,
    currentUser: null,
    backendProfile: null,
    userRole: 'guest', // 'guest' | 'client' | 'admin' | 'super_admin'
    currentModal: null, // null | 'portal' | 'clientDashboard' | 'adminDashboard'
    activeTab: 'client', // 'client' | 'admin'
    clientSubView: 'login', // 'login' | 'register' | 'otp' | 'forgot'
    adminSubView: 'login', // 'login' | 'activate' | 'otp' | 'credentials' | 'forgot'
    pendingSignUp: null,
    pendingSignIn: null,
    activationEmail: '',
    resendCooldown: 0,
    resendInterval: null
  };

  // Toast Helper
  function toast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    } else {
      console.log(`[Toast ${type.toUpperCase()}]: ${message}`);
    }
  }

  // API Call Wrapper with Clerk ID header
  async function apiFetch(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (window.Clerk && window.Clerk.user) {
      headers['X-Clerk-User-Id'] = window.Clerk.user.id;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });
      const data = await response.json().catch(() => ({}));
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.error('API Fetch Error:', err);
      return { ok: false, status: 500, data: { success: false, error: 'Network error connecting to Whiz Studio API.' } };
    }
  }

  // OTP 6-Digit Box Binder
  function setupOtpInputs(containerId, onComplete) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const inputs = container.querySelectorAll('.otp-box');
    if (!inputs.length) return;

    inputs.forEach((input, idx) => {
      input.value = '';
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = val.slice(-1);
        if (e.target.value && idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        }
        checkFullOtp();
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && idx > 0) {
          inputs[idx - 1].focus();
        }
      });

      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
        if (pasted) {
          pasted.split('').slice(0, 6).forEach((char, i) => {
            if (inputs[i]) inputs[i].value = char;
          });
          const targetIdx = Math.min(pasted.length, 5);
          inputs[targetIdx].focus();
          checkFullOtp();
        }
      });
    });

    function checkFullOtp() {
      const code = Array.from(inputs).map(i => i.value).join('');
      if (code.length === 6 && typeof onComplete === 'function') {
        onComplete(code);
      }
    }
  }

  function getOtpCode(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return '';
    const inputs = container.querySelectorAll('.otp-box');
    return Array.from(inputs).map(i => i.value.trim()).join('');
  }

  function clearOtpInputs(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.otp-box').forEach(i => i.value = '');
    const first = container.querySelector('.otp-box');
    if (first) first.focus();
  }

  // Resend Timer Helper
  function startResendTimer(btnId, timerTextId) {
    const btn = document.getElementById(btnId);
    const textEl = document.getElementById(timerTextId);
    if (!btn) return;

    if (state.resendInterval) clearInterval(state.resendInterval);
    state.resendCooldown = 60;
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');

    function update() {
      if (state.resendCooldown <= 0) {
        clearInterval(state.resendInterval);
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        if (textEl) textEl.textContent = 'Resend Code';
      } else {
        if (textEl) textEl.textContent = `Resend in ${state.resendCooldown}s`;
        state.resendCooldown--;
      }
    }
    update();
    state.resendInterval = setInterval(update, 1000);
  }

  // Alert Box Helper
  function showPortalAlert(message, type = 'error') {
    const alertBox = document.getElementById('accountPortalAlert');
    if (!alertBox) return;

    if (!message) {
      alertBox.classList.add('hidden');
      alertBox.innerHTML = '';
      return;
    }

    alertBox.classList.remove('hidden');
    const colorClasses = {
      error: 'bg-rose-50 border-rose-300 text-rose-900',
      success: 'bg-emerald-50 border-emerald-300 text-emerald-950',
      info: 'bg-blue-50 border-blue-300 text-blue-900',
      warning: 'bg-amber-50 border-amber-300 text-amber-950'
    };
    const iconClasses = {
      error: 'fa-solid fa-circle-exclamation text-rose-600',
      success: 'fa-solid fa-circle-check text-emerald-600',
      info: 'fa-solid fa-circle-info text-blue-600',
      warning: 'fa-solid fa-triangle-exclamation text-amber-600'
    };

    alertBox.className = `p-3.5 rounded-xl text-xs font-semibold border flex items-start space-x-2.5 transition-all ${colorClasses[type] || colorClasses.info}`;
    alertBox.innerHTML = `
      <i class="${iconClasses[type] || iconClasses.info} text-sm mt-0.5 shrink-0"></i>
      <span class="flex-1">${message}</span>
    `;
  }

  // Button Loading State
  function setBtnLoading(btn, isLoading, loadingText = 'Processing...') {
    if (!btn) return;
    if (isLoading) {
      btn.dataset.origText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i><span>${loadingText}</span>`;
    } else {
      btn.disabled = false;
      if (btn.dataset.origText) {
        btn.innerHTML = btn.dataset.origText;
      }
    }
  }

  // Modal Control Functions
  function openModal(modalId) {
    closeAllModals(false);
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    state.currentModal = modalId;

    if (window.gsap) {
      window.gsap.fromTo(modal.querySelector('.backdrop-blur-2xl') || modal.firstElementChild, 
        { opacity: 0, scale: 0.96 }, 
        { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }
      );
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    if (state.currentModal === modalId) {
      state.currentModal = null;
    }
    showPortalAlert('');
  }

  function closeAllModals(removeBodyLock = true) {
    ['accountPortalModal', 'clientDashboardModal', 'adminDashboardModal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    if (removeBodyLock) {
      document.body.classList.remove('overflow-hidden');
    }
    state.currentModal = null;
    showPortalAlert('');
  }

  // Tab & Subview Switchers for Portal Modal
  function switchPortalTab(tab) {
    state.activeTab = tab;
    showPortalAlert('');

    const tabClient = document.getElementById('tabClientBtn');
    const tabAdmin = document.getElementById('tabAdminBtn');
    const clientContainer = document.getElementById('clientViewContainer');
    const adminContainer = document.getElementById('adminViewContainer');
    const badge = document.getElementById('accountPortalHeaderBadge');
    const icon = document.getElementById('accountPortalHeaderIcon');

    if (tab === 'client') {
      if (tabClient) {
        tabClient.classList.add('bg-white', 'text-slate-900', 'shadow-sm', 'border-slate-200/80');
        tabClient.classList.remove('text-slate-600', 'border-transparent');
      }
      if (tabAdmin) {
        tabAdmin.classList.remove('bg-white', 'text-slate-900', 'shadow-sm', 'border-slate-200/80');
        tabAdmin.classList.add('text-slate-600', 'border-transparent');
      }
      if (clientContainer) clientContainer.classList.remove('hidden');
      if (adminContainer) adminContainer.classList.add('hidden');
      if (badge) {
        badge.textContent = 'Client Portal';
        badge.className = 'text-[11px] font-extrabold uppercase tracking-wider text-emerald-950 bg-emerald-100/90 px-3 py-0.5 rounded-full border border-emerald-300/80';
      }
      if (icon) {
        icon.className = 'fa-solid fa-circle-user text-base text-brand-whiz';
      }
      switchClientSubView('login');
    } else {
      if (tabAdmin) {
        tabAdmin.classList.add('bg-white', 'text-slate-900', 'shadow-sm', 'border-slate-200/80');
        tabAdmin.classList.remove('text-slate-600', 'border-transparent');
      }
      if (tabClient) {
        tabClient.classList.remove('bg-white', 'text-slate-900', 'shadow-sm', 'border-slate-200/80');
        tabClient.classList.add('text-slate-600', 'border-transparent');
      }
      if (adminContainer) adminContainer.classList.remove('hidden');
      if (clientContainer) clientContainer.classList.add('hidden');
      if (badge) {
        badge.textContent = 'Admin Portal';
        badge.className = 'text-[11px] font-extrabold uppercase tracking-wider text-slate-900 bg-slate-200 px-3 py-0.5 rounded-full border border-slate-300';
      }
      if (icon) {
        icon.className = 'fa-solid fa-shield-halved text-base text-slate-800';
      }
      switchAdminSubView('login');
    }
  }

  function switchClientSubView(subview) {
    state.clientSubView = subview;
    showPortalAlert('');

    const views = {
      login: document.getElementById('clientLoginView'),
      register: document.getElementById('clientRegisterView'),
      otp: document.getElementById('clientOtpView'),
      forgot: document.getElementById('clientForgotView')
    };

    Object.keys(views).forEach(key => {
      if (views[key]) {
        if (key === subview) views[key].classList.remove('hidden');
        else views[key].classList.add('hidden');
      }
    });

    if (subview === 'otp') {
      setupOtpInputs('clientOtpInputsContainer', () => {
        handleClientOtpSubmit();
      });
      startResendTimer('clientResendOtpBtn', 'clientResendOtpTimer');
    }
  }

  function switchAdminSubView(subview) {
    state.adminSubView = subview;
    showPortalAlert('');

    const views = {
      login: document.getElementById('adminLoginFormView'),
      activate: document.getElementById('adminActivateEmailView'),
      otp: document.getElementById('adminOtpView'),
      credentials: document.getElementById('adminCredentialsView'),
      forgot: document.getElementById('adminForgotView')
    };

    Object.keys(views).forEach(key => {
      if (views[key]) {
        if (key === subview) views[key].classList.remove('hidden');
        else views[key].classList.add('hidden');
      }
    });

    if (subview === 'otp') {
      setupOtpInputs('adminOtpInputsContainer', () => {
        handleAdminOtpSubmit();
      });
      startResendTimer('adminResendOtpBtn', 'adminResendOtpTimer');
    }
  }

  // Primary Auth Sync & State Handler
  async function syncAuthState() {
    if (!window.Clerk) return;

    const user = window.Clerk.user;
    state.currentUser = user;

    const navBtns = [
      document.getElementById('myAccountNavBtn'),
      document.getElementById('myAccountMobileNavBtn')
    ].filter(Boolean);

    if (!user) {
      state.userRole = 'guest';
      state.backendProfile = null;
      navBtns.forEach(btn => {
        const span = btn.querySelector('span');
        if (span) span.textContent = 'My Account';
        const icon = btn.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-circle-user text-xs sm:text-sm mr-1.5 text-brand-whiz';
      });
      return;
    }

    // Authenticated in Clerk -> Verify backend profile & role
    const primaryEmail = user.primaryEmailAddress ? user.primaryEmailAddress.emailAddress : '';
    
    // Check if user is Super Admin or Admin
    const isSuperAdminEmail = primaryEmail.toLowerCase() === MANDATORY_FOUNDING_SUPER_ADMIN;

    // Fetch profile from backend
    const res = await apiFetch('/me');
    if (res.ok && res.data && res.data.data && res.data.data.user) {
      state.backendProfile = res.data.data.user;
      const role = state.backendProfile.role;
      if (role === 'owner' || isSuperAdminEmail) {
        state.userRole = 'super_admin';
      } else if (role === 'admin') {
        state.userRole = 'admin';
      } else {
        state.userRole = 'client';
      }
    } else {
      // Fallback role resolution
      state.userRole = isSuperAdminEmail ? 'super_admin' : 'client';
    }

    // Update Nav buttons to show Name & Role
    const displayName = user.firstName || user.username || primaryEmail.split('@')[0] || 'User';
    navBtns.forEach(btn => {
      const span = btn.querySelector('span');
      if (span) {
        span.textContent = displayName;
      }
      const icon = btn.querySelector('i');
      if (icon) {
        if (state.userRole === 'super_admin' || state.userRole === 'admin') {
          icon.className = 'fa-solid fa-shield-halved text-xs sm:text-sm mr-1.5 text-slate-800';
        } else {
          icon.className = 'fa-solid fa-circle-user text-xs sm:text-sm mr-1.5 text-brand-whiz';
        }
      }
    });
  }

  // Open Current Dashboard based on Role
  function openUserDashboard() {
    if (!state.currentUser) {
      openModal('accountPortalModal');
      return;
    }

    if (state.userRole === 'super_admin' || state.userRole === 'admin') {
      openAdminDashboard();
    } else {
      openClientDashboard();
    }
  }

  // =========================================================================
  // CLIENT AUTHENTICATION HANDLERS
  // =========================================================================

  // Client Login Submit
  async function handleClientLogin(e) {
    e.preventDefault();
    showPortalAlert('');
    const form = e.target;
    const identifier = (form.identifier.value || '').trim();
    const password = form.password.value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!identifier || !password) {
      showPortalAlert('Please enter both your username/email and password.', 'error');
      return;
    }

    setBtnLoading(submitBtn, true, 'Signing in...');

    try {
      const signInAttempt = await window.Clerk.client.signIn.create({
        identifier,
        password
      });

      if (signInAttempt.status === 'complete') {
        await window.Clerk.setActive({ session: signInAttempt.createdSessionId });
        
        // Sync profile with D1
        const email = signInAttempt.identifier || (window.Clerk.user && window.Clerk.user.primaryEmailAddress ? window.Clerk.user.primaryEmailAddress.emailAddress : '');
        await apiFetch('/sync-client', {
          method: 'POST',
          body: JSON.stringify({
            clerkUserId: signInAttempt.createdUserId,
            email,
            fullName: window.Clerk.user ? (window.Clerk.user.fullName || window.Clerk.user.username) : 'Client'
          })
        });

        await syncAuthState();
        closeModal('accountPortalModal');
        toast('Signed in successfully!', 'success');
        openClientDashboard();
      } else {
        showPortalAlert(`Authentication requires further verification (Status: ${signInAttempt.status}).`, 'warning');
      }
    } catch (err) {
      console.error('Sign In Error:', err);
      const msg = (err.errors && err.errors[0] && err.errors[0].longMessage) || (err.errors && err.errors[0] && err.errors[0].message) || err.message || 'Invalid username/email or password.';
      showPortalAlert(msg, 'error');
    } finally {
      setBtnLoading(submitBtn, false);
    }
  }

  // Client Register Submit
  async function handleClientRegister(e) {
    e.preventDefault();
    showPortalAlert('');
    const form = e.target;
    const fullName = (form.fullName.value || '').trim();
    const username = (form.username.value || '').trim();
    const email = (form.email.value || '').trim().toLowerCase();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!fullName || !username || !email || !password) {
      showPortalAlert('Please fill in all required fields.', 'error');
      return;
    }

    if (password.length < 15) {
      showPortalAlert('Password must be at least 15 characters long as required for high-security standards.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showPortalAlert('Passwords do not match. Please verify your password.', 'error');
      return;
    }

    setBtnLoading(submitBtn, true, 'Creating Account...');

    try {
      const signUpAttempt = await window.Clerk.client.signUp.create({
        username,
        emailAddress: email,
        password,
        firstName: fullName.split(' ')[0] || fullName,
        lastName: fullName.split(' ').slice(1).join(' ') || ''
      });

      state.pendingSignUp = signUpAttempt;

      // Send OTP to email
      await signUpAttempt.prepareEmailAddressVerification({ strategy: 'email_code' });

      // Update OTP subview instructions with masked email
      const targetEl = document.getElementById('clientOtpTargetEmail');
      if (targetEl) targetEl.textContent = email;

      switchClientSubView('otp');
      toast(`Verification code sent to ${email}`, 'info');
    } catch (err) {
      console.error('Sign Up Error:', err);
      const msg = (err.errors && err.errors[0] && err.errors[0].longMessage) || (err.errors && err.errors[0] && err.errors[0].message) || err.message || 'Error creating account. Please check your details.';
      showPortalAlert(msg, 'error');
    } finally {
      setBtnLoading(submitBtn, false);
    }
  }

  // Client OTP Verification Submit
  async function handleClientOtpSubmit() {
    showPortalAlert('');
    const code = getOtpCode('clientOtpInputsContainer');
    const submitBtn = document.getElementById('clientVerifyOtpBtn');

    if (code.length !== 6) {
      showPortalAlert('Please enter the complete 6-digit verification code.', 'error');
      return;
    }

    if (!state.pendingSignUp) {
      showPortalAlert('Registration session expired. Please start registration again.', 'error');
      switchClientSubView('register');
      return;
    }

    setBtnLoading(submitBtn, true, 'Verifying code...');

    try {
      const completeSignUp = await state.pendingSignUp.attemptEmailAddressVerification({ code });

      if (completeSignUp.status === 'complete') {
        await window.Clerk.setActive({ session: completeSignUp.createdSessionId });

        // Sync client profile to D1 database
        const email = completeSignUp.emailAddress;
        const fullName = `${completeSignUp.firstName || ''} ${completeSignUp.lastName || ''}`.trim() || completeSignUp.username || 'Client';

        await apiFetch('/sync-client', {
          method: 'POST',
          body: JSON.stringify({
            clerkUserId: completeSignUp.createdUserId,
            email,
            fullName
          })
        });

        await syncAuthState();
        closeModal('accountPortalModal');
        toast('Account verified and created successfully! Welcome to Whiz Studio.', 'success');
        openClientDashboard();
      } else {
        showPortalAlert(`Verification pending additional steps (Status: ${completeSignUp.status}).`, 'warning');
      }
    } catch (err) {
      console.error('OTP Verification Error:', err);
      const msg = (err.errors && err.errors[0] && err.errors[0].longMessage) || (err.errors && err.errors[0] && err.errors[0].message) || 'Invalid verification code. Please check your email and try again.';
      showPortalAlert(msg, 'error');
      clearOtpInputs('clientOtpInputsContainer');
    } finally {
      setBtnLoading(submitBtn, false);
    }
  }

  // Resend Client OTP
  async function handleClientResendOtp() {
    if (!state.pendingSignUp || state.resendCooldown > 0) return;
    try {
      await state.pendingSignUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      toast('A new 6-digit code has been sent to your email.', 'info');
      startResendTimer('clientResendOtpBtn', 'clientResendOtpTimer');
    } catch (err) {
      toast('Failed to resend code: ' + (err.message || 'Please try again later.'), 'error');
    }
  }

  // Client Forgot Password - Step 1: Send Code
  async function handleClientForgotSendCode(e) {
    e.preventDefault();
    showPortalAlert('');
    const form = e.target;
    const identifier = (form.email.value || '').trim();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!identifier) {
      showPortalAlert('Please enter your account email address.', 'error');
      return;
    }

    setBtnLoading(submitBtn, true, 'Sending Code...');

    try {
      const signInAttempt = await window.Clerk.client.signIn.create({
        strategy: 'reset_password_email_code',
        identifier
      });
      state.pendingSignIn = signInAttempt;

      // Show step 2 in forgot view
      document.getElementById('clientForgotStep1').classList.add('hidden');
      document.getElementById('clientForgotStep2').classList.remove('hidden');
      toast(`Reset code sent to ${identifier}`, 'info');
    } catch (err) {
      console.error('Forgot Password Error:', err);
      const msg = (err.errors && err.errors[0] && err.errors[0].longMessage) || err.message || 'Could not send reset code. Verify the email address.';
      showPortalAlert(msg, 'error');
    } finally {
      setBtnLoading(submitBtn, false);
    }
  }

  // Client Forgot Password - Step 2: Reset with Code
  async function handleClientForgotReset(e) {
    e.preventDefault();
    showPortalAlert('');
    const form = e.target;
    const code = (form.code.value || '').trim();
    const newPassword = form.newPassword.value;
    const confirmNewPassword = form.confirmNewPassword.value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!code || !newPassword) {
      showPortalAlert('Please enter the code and your new password.', 'error');
      return;
    }

    if (newPassword.length < 15) {
      showPortalAlert('New password must be at least 15 characters long.', 'error');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showPortalAlert('Passwords do not match.', 'error');
      return;
    }

    setBtnLoading(submitBtn, true, 'Updating Password...');

    try {
      const result = await state.pendingSignIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword
      });

      if (result.status === 'complete') {
        await window.Clerk.setActive({ session: result.createdSessionId });
        await syncAuthState();
        closeModal('accountPortalModal');
        toast('Password reset successfully! You are now logged in.', 'success');
        openClientDashboard();
      } else {
        showPortalAlert(`Status: ${result.status}`, 'warning');
      }
    } catch (err) {
      console.error('Password Reset Error:', err);
      const msg = (err.errors && err.errors[0] && err.errors[0].longMessage) || err.message || 'Invalid code or password.';
      showPortalAlert(msg, 'error');
    } finally {
      setBtnLoading(submitBtn, false);
    }
  }

  // =========================================================================
  // ADMIN AUTHENTICATION & FOUNDING ACTIVATION HANDLERS
  // =========================================================================

  // Admin Login Submit
  async function handleAdminLogin(e) {
    e.preventDefault();
    showPortalAlert('');
    const form = e.target;
    const email = (form.adminEmail.value || '').trim().toLowerCase();
    const password = form.adminPassword.value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!email || !password) {
      showPortalAlert('Please enter your administrator email and password.', 'error');
      return;
    }

    setBtnLoading(submitBtn, true, 'Authenticating Admin...');

    try {
      // 1. Verify email authorization against backend first
      const checkRes = await apiFetch(`/check-admin?email=${encodeURIComponent(email)}`);
      if (!checkRes.ok || !checkRes.data || !checkRes.data.authorized) {
        showPortalAlert(checkRes.data?.error || 'Access Denied: This account is not authorized for administrative access.', 'error');
        setBtnLoading(submitBtn, false);
        return;
      }

      if (checkRes.data.data && checkRes.data.data.needsActivation) {
        showPortalAlert('This administrator account has not been activated yet. Please click "Activate Admin Account" below.', 'warning');
        setBtnLoading(submitBtn, false);
        return;
      }

      // 2. Sign in with Clerk
      const signInAttempt = await window.Clerk.client.signIn.create({
        identifier: email,
        password
      });

      if (signInAttempt.status === 'complete') {
        await window.Clerk.setActive({ session: signInAttempt.createdSessionId });
        await syncAuthState();

        if (state.userRole !== 'admin' && state.userRole !== 'super_admin') {
          // Fallback authorization check
          await window.Clerk.signOut();
          showPortalAlert('Access Revoked: Server verified that your role does not possess administrative permissions.', 'error');
          return;
        }

        closeModal('accountPortalModal');
        toast('Welcome to Whiz Studio Management Portal', 'success');
        openAdminDashboard();
      } else {
        showPortalAlert(`Admin authentication status: ${signInAttempt.status}`, 'warning');
      }
    } catch (err) {
      console.error('Admin Sign In Error:', err);
      const msg = (err.errors && err.errors[0] && err.errors[0].longMessage) || (err.errors && err.errors[0] && err.errors[0].message) || err.message || 'Invalid admin credentials.';
      showPortalAlert(msg, 'error');
    } finally {
      setBtnLoading(submitBtn, false);
    }
  }

  // Admin First-Time Activation: Email Eligibility Check
  async function handleAdminActivateCheck(e) {
    e.preventDefault();
    showPortalAlert('');
    const form = e.target;
    const email = (form.email.value || '').trim().toLowerCase();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!email) {
      showPortalAlert('Please enter your approved administrative email address.', 'error');
      return;
    }

    setBtnLoading(submitBtn, true, 'Verifying Eligibility...');

    try {
      const res = await apiFetch(`/check-admin?email=${encodeURIComponent(email)}`);

      if (!res.ok || !res.data || !res.data.authorized) {
        showPortalAlert(res.data?.error || 'Access Denied: This email address is not authorized for administrator registration.', 'error');
        return;
      }

      const adminInfo = res.data.data;
      if (!adminInfo.needsActivation) {
        showPortalAlert('This administrator account has already been activated. Please sign in directly with your password.', 'info');
        switchAdminSubView('login');
        return;
      }

      state.activationEmail = email;

      // Start Clerk SignUp for Admin Activation
      // Temporary password for Clerk sign up stage (user sets permanent in credentials view)
      const tempPass = 'TempAdminInit_' + Math.random().toString(36).slice(2) + '!99Aa';
      const tempUsername = 'adm_' + email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 15) + '_' + Math.floor(Math.random()*1000);

      const signUpAttempt = await window.Clerk.client.signUp.create({
        emailAddress: email,
        username: tempUsername,
        password: tempPass
      });

      state.pendingSignUp = signUpAttempt;

      // Send OTP to approved email
      await signUpAttempt.prepareEmailAddressVerification({ strategy: 'email_code' });

      const targetEl = document.getElementById('adminOtpTargetEmail');
      if (targetEl) targetEl.textContent = email;

      switchAdminSubView('otp');
      toast(`Security code dispatched to ${email}`, 'info');
    } catch (err) {
      console.error('Admin Activation Error:', err);
      const msg = (err.errors && err.errors[0] && err.errors[0].longMessage) || (err.errors && err.errors[0] && err.errors[0].message) || err.message || 'Error initiating admin activation.';
      showPortalAlert(msg, 'error');
    } finally {
      setBtnLoading(submitBtn, false);
    }
  }

  // Admin OTP Verification Submit
  async function handleAdminOtpSubmit() {
    showPortalAlert('');
    const code = getOtpCode('adminOtpInputsContainer');
    const submitBtn = document.getElementById('adminVerifyOtpBtn');

    if (code.length !== 6) {
      showPortalAlert('Please enter the 6-digit verification code.', 'error');
      return;
    }

    if (!state.pendingSignUp) {
      showPortalAlert('Activation session expired. Please start again.', 'error');
      switchAdminSubView('activate');
      return;
    }

    setBtnLoading(submitBtn, true, 'Verifying Security Code...');

    try {
      const verifiedSignUp = await state.pendingSignUp.attemptEmailAddressVerification({ code });

      if (verifiedSignUp.status === 'complete' || verifiedSignUp.verifications?.emailAddress?.status === 'verified') {
        // Move to Permanent Credentials View
        state.pendingSignUp = verifiedSignUp;
        switchAdminSubView('credentials');
        toast('Identity verified! Set your permanent credentials.', 'success');
      } else {
        showPortalAlert(`Verification status: ${verifiedSignUp.status}`, 'warning');
      }
    } catch (err) {
      console.error('Admin OTP Verification Error:', err);
      const msg = (err.errors && err.errors[0] && err.errors[0].longMessage) || 'Invalid verification code.';
      showPortalAlert(msg, 'error');
      clearOtpInputs('adminOtpInputsContainer');
    } finally {
      setBtnLoading(submitBtn, false);
    }
  }

  // Resend Admin OTP
  async function handleAdminResendOtp() {
    if (!state.pendingSignUp || state.resendCooldown > 0) return;
    try {
      await state.pendingSignUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      toast('A new security code has been sent to your email.', 'info');
      startResendTimer('adminResendOtpBtn', 'adminResendOtpTimer');
    } catch (err) {
      toast('Failed to resend code: ' + (err.message || 'Please try again.'), 'error');
    }
  }

  // Admin Permanent Credentials Setup Submit
  async function handleAdminCredentialsSubmit(e) {
    e.preventDefault();
    showPortalAlert('');
    const form = e.target;
    const fullName = (form.fullName.value || '').trim();
    const username = (form.username.value || '').trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!fullName || !username || !password) {
      showPortalAlert('Please fill in all credential fields.', 'error');
      return;
    }

    if (password.length < 15) {
      showPortalAlert('Admin password must be at least 15 characters long.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showPortalAlert('Passwords do not match.', 'error');
      return;
    }

    setBtnLoading(submitBtn, true, 'Activating Administrator Account...');

    try {
      // Set session active if not already
      if (state.pendingSignUp.createdSessionId) {
        await window.Clerk.setActive({ session: state.pendingSignUp.createdSessionId });
      }

      const clerkUserId = state.pendingSignUp.createdUserId || (window.Clerk.user ? window.Clerk.user.id : null);

      // Update Clerk user's password, username, and full name
      if (window.Clerk.user) {
        await window.Clerk.user.update({
          username,
          firstName: fullName.split(' ')[0] || fullName,
          lastName: fullName.split(' ').slice(1).join(' ') || '',
          password
        }).catch(err => {
          console.warn('User update notice:', err);
        });
      }

      // Call Backend to Bind Identity & Lock Activation Bootstrap
      const activateRes = await apiFetch('/activate-admin', {
        method: 'POST',
        body: JSON.stringify({
          email: state.activationEmail,
          clerkUserId,
          username,
          fullName
        })
      });

      if (!activateRes.ok || !activateRes.data || !activateRes.data.success) {
        throw new Error(activateRes.data?.error || 'Failed to bind administrator identity on server.');
      }

      await syncAuthState();
      closeModal('accountPortalModal');
      toast('Administrator account successfully activated! Welcome aboard.', 'success');
      openAdminDashboard();
    } catch (err) {
      console.error('Admin Final Activation Error:', err);
      const msg = (err.errors && err.errors[0] && err.errors[0].longMessage) || err.message || 'Error finalizing admin account.';
      showPortalAlert(msg, 'error');
    } finally {
      setBtnLoading(submitBtn, false);
    }
  }

  // =========================================================================
  // CLIENT DASHBOARD INTERACTION & DATA PERSISTENCE
  // =========================================================================

  function openClientDashboard() {
    openModal('clientDashboardModal');
    loadClientDashboardData();
    switchClientDashboardTab('overview');
  }

  function switchClientDashboardTab(tabName) {
    const tabs = ['overview', 'profile', 'services', 'support', 'settings'];
    tabs.forEach(t => {
      const viewEl = document.getElementById(`clientTabContent_${t}`);
      const btnEl = document.getElementById(`clientTabBtn_${t}`);
      if (viewEl) {
        if (t === tabName) viewEl.classList.remove('hidden');
        else viewEl.classList.add('hidden');
      }
      if (btnEl) {
        if (t === tabName) {
          btnEl.classList.add('bg-emerald-500/10', 'text-brand-whiz', 'border-emerald-500/30', 'font-bold');
          btnEl.classList.remove('text-slate-600', 'border-transparent');
        } else {
          btnEl.classList.remove('bg-emerald-500/10', 'text-brand-whiz', 'border-emerald-500/30', 'font-bold');
          btnEl.classList.add('text-slate-600', 'border-transparent');
        }
      }
    });

    if (tabName === 'support') {
      loadClientSupportRequests();
    }
  }

  async function loadClientDashboardData() {
    if (!state.currentUser) return;
    const user = state.currentUser;
    const email = user.primaryEmailAddress ? user.primaryEmailAddress.emailAddress : '';
    const name = user.fullName || user.firstName || user.username || 'Valued Client';

    // Populate Header & Overview
    const nameEls = document.querySelectorAll('.client-display-name');
    nameEls.forEach(el => el.textContent = name);
    const emailEls = document.querySelectorAll('.client-display-email');
    emailEls.forEach(el => el.textContent = email);

    // Fetch Full Profile from D1
    const res = await apiFetch('/me');
    if (res.ok && res.data && res.data.data && res.data.data.user) {
      const u = res.data.data.user;
      state.backendProfile = u;
      
      const form = document.getElementById('clientProfileForm');
      if (form) {
        if (form.fullName) form.fullName.value = u.fullName || '';
        if (form.companyName) form.companyName.value = u.companyName || '';
        if (form.phone) form.phone.value = u.phone || '';
        if (form.country) form.country.value = u.country || '';
        if (form.city) form.city.value = u.city || '';
        if (form.address) form.address.value = u.address || '';
        if (form.bio) form.bio.value = u.bio || '';
      }

      // Settings Info
      const createdEl = document.getElementById('clientAccountCreatedDate');
      if (createdEl && u.createdAt) {
        createdEl.textContent = new Date(u.createdAt).toLocaleDateString();
      }
    }
  }

  async function handleClientProfileSave(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    setBtnLoading(submitBtn, true, 'Saving Changes...');

    const payload = {
      fullName: (form.fullName.value || '').trim(),
      companyName: (form.companyName.value || '').trim(),
      phone: (form.phone.value || '').trim(),
      country: (form.country.value || '').trim(),
      city: (form.city.value || '').trim(),
      address: (form.address.value || '').trim(),
      bio: (form.bio.value || '').trim()
    };

    const res = await apiFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    setBtnLoading(submitBtn, false);

    if (res.ok && res.data && res.data.success) {
      toast('Profile updated successfully!', 'success');
      loadClientDashboardData();
    } else {
      toast(res.data?.error || 'Failed to save profile changes.', 'error');
    }
  }

  async function handleClientSupportSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const subject = (form.subject.value || '').trim();
    const message = (form.message.value || '').trim();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!subject || !message) {
      toast('Please enter both subject and message.', 'error');
      return;
    }

    setBtnLoading(submitBtn, true, 'Submitting Ticket...');

    const email = state.currentUser?.primaryEmailAddress?.emailAddress || '';
    const fullName = state.currentUser?.fullName || 'Client';

    const res = await apiFetch('/support/submit', {
      method: 'POST',
      body: JSON.stringify({
        email,
        fullName,
        subject,
        message,
        clerkUserId: state.currentUser?.id
      })
    });

    setBtnLoading(submitBtn, false);

    if (res.ok && res.data && res.data.success) {
      toast('Support request submitted! We will respond shortly.', 'success');
      form.reset();
      loadClientSupportRequests();
    } else {
      toast(res.data?.error || 'Error submitting support ticket.', 'error');
    }
  }

  async function loadClientSupportRequests() {
    const listContainer = document.getElementById('clientSupportHistoryList');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="py-6 text-center text-slate-400 text-xs"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading your tickets...</div>';

    const res = await apiFetch('/support/my');
    if (res.ok && res.data && Array.isArray(res.data.data)) {
      const tickets = res.data.data;
      if (!tickets.length) {
        listContainer.innerHTML = `
          <div class="py-8 text-center text-slate-500 text-xs">
            <i class="fa-solid fa-inbox text-2xl mb-2 text-slate-300"></i>
            <p>No support requests submitted yet.</p>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = tickets.map(t => `
        <div class="p-3.5 rounded-xl border border-slate-200/80 bg-white/60 hover:bg-white transition-all shadow-xs space-y-1.5">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-xs sm:text-sm text-slate-800">${escapeHtml(t.subject)}</h4>
            <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${t.status === 'resolved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}">${t.status}</span>
          </div>
          <p class="text-xs text-slate-600 line-clamp-2">${escapeHtml(t.message)}</p>
          <div class="text-[10px] text-slate-400">Submitted: ${new Date(t.created_at).toLocaleString()}</div>
        </div>
      `).join('');
    } else {
      listContainer.innerHTML = '<div class="py-4 text-center text-rose-500 text-xs">Failed to load support history.</div>';
    }
  }

  // =========================================================================
  // ADMIN DASHBOARD REAL DATA & ACTIONS
  // =========================================================================

  function openAdminDashboard() {
    openModal('adminDashboardModal');
    loadAdminDashboardData();
    switchAdminDashboardTab('overview');
  }

  function switchAdminDashboardTab(tabName) {
    const tabs = ['overview', 'clients', 'team', 'support'];
    tabs.forEach(t => {
      const viewEl = document.getElementById(`adminTabContent_${t}`);
      const btnEl = document.getElementById(`adminTabBtn_${t}`);
      if (viewEl) {
        if (t === tabName) viewEl.classList.remove('hidden');
        else viewEl.classList.add('hidden');
      }
      if (btnEl) {
        if (t === tabName) {
          btnEl.classList.add('bg-brand-whiz/10', 'text-brand-whiz', 'border-brand-whiz/30', 'font-bold');
          btnEl.classList.remove('text-slate-400', 'border-transparent');
        } else {
          btnEl.classList.remove('bg-brand-whiz/10', 'text-brand-whiz', 'border-brand-whiz/30', 'font-bold');
          btnEl.classList.add('text-slate-400', 'border-transparent');
        }
      }
    });

    if (tabName === 'clients') loadAdminClients();
    else if (tabName === 'team') loadAdminTeam();
    else if (tabName === 'support') loadAdminSupport();
  }

  async function loadAdminDashboardData() {
    if (!state.currentUser) return;
    const user = state.currentUser;
    const email = user.primaryEmailAddress ? user.primaryEmailAddress.emailAddress : '';
    const name = user.fullName || user.firstName || 'Administrator';

    const nameEls = document.querySelectorAll('.admin-display-name');
    nameEls.forEach(el => el.textContent = name);
    const emailEls = document.querySelectorAll('.admin-display-email');
    emailEls.forEach(el => el.textContent = email);

    const badgeEl = document.getElementById('adminRoleBadge');
    if (badgeEl) {
      if (state.userRole === 'super_admin' || email.toLowerCase() === MANDATORY_FOUNDING_SUPER_ADMIN) {
        badgeEl.textContent = 'Super Admin';
        badgeEl.className = 'text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40';
      } else {
        badgeEl.textContent = 'Admin';
        badgeEl.className = 'text-[10px] font-extrabold uppercase tracking-wider text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700';
      }
    }

    // Hide Team Tab if not super_admin/owner
    const teamTabBtn = document.getElementById('adminTabBtn_team');
    if (teamTabBtn) {
      if (state.userRole === 'super_admin') teamTabBtn.classList.remove('hidden');
      else teamTabBtn.classList.add('hidden');
    }

    // Load Stats from /admin/stats
    const res = await apiFetch('/admin/stats');
    if (res.ok && res.data && res.data.data) {
      const stats = res.data.data;
      const elClients = document.getElementById('adminStatClients');
      const elAdmins = document.getElementById('adminStatAdmins');
      const elTickets = document.getElementById('adminStatTickets');
      const elActivity = document.getElementById('adminStatActivity');

      if (elClients) elClients.textContent = stats.totalClients;
      if (elAdmins) elAdmins.textContent = stats.totalAdmins;
      if (elTickets) elTickets.textContent = stats.openSupportRequests;

      // Activity Feed
      const feed = document.getElementById('adminRecentActivityList');
      if (feed && Array.isArray(stats.recentActivity)) {
        if (!stats.recentActivity.length) {
          feed.innerHTML = '<div class="text-xs text-slate-400 py-4 text-center">No recent audit log entries.</div>';
        } else {
          feed.innerHTML = stats.recentActivity.map(act => `
            <div class="flex items-center justify-between py-2 border-b border-slate-700/40 text-xs">
              <div class="flex items-center space-x-2">
                <i class="fa-solid fa-clock-rotate-left text-brand-whiz"></i>
                <span class="font-semibold text-slate-200">${escapeHtml(act.action)}</span>
                <span class="text-slate-400 text-[11px]">(${escapeHtml(act.user_email)})</span>
              </div>
              <span class="text-slate-500 text-[10px]">${new Date(act.created_at).toLocaleString()}</span>
            </div>
          `).join('');
        }
      }
    }
  }

  // Admin: Load Clients Directory
  async function loadAdminClients(searchQuery = '') {
    const tableBody = document.getElementById('adminClientsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-xs text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading clients...</td></tr>';

    const res = await apiFetch(`/admin/clients?search=${encodeURIComponent(searchQuery)}`);
    if (res.ok && res.data && Array.isArray(res.data.data)) {
      const clients = res.data.data;
      if (!clients.length) {
        tableBody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-xs text-slate-400">No client records found.</td></tr>';
        return;
      }

      tableBody.innerHTML = clients.map(c => `
        <tr class="border-b border-slate-700/30 hover:bg-slate-800/40 transition-colors text-xs text-slate-300">
          <td class="py-3 px-4 font-semibold text-white">${escapeHtml(c.full_name || 'N/A')}</td>
          <td class="py-3 px-4">${escapeHtml(c.email)}</td>
          <td class="py-3 px-4">${escapeHtml(c.company_name || 'Individual')}</td>
          <td class="py-3 px-4">${escapeHtml([c.city, c.country].filter(Boolean).join(', ') || 'N/A')}</td>
          <td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}">${c.status}</span></td>
        </tr>
      `).join('');
    } else {
      tableBody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-xs text-rose-400">Error loading client directory.</td></tr>';
    }
  }

  // Admin: Load Team Directory (Super Admin Only)
  async function loadAdminTeam() {
    const adminListContainer = document.getElementById('adminTeamTableBody');
    if (!adminListContainer) return;

    adminListContainer.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-xs text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading administrators...</td></tr>';

    const res = await apiFetch('/admin/team');
    if (res.ok && res.data && res.data.data) {
      const { admins, pendingInvitations } = res.data.data;

      // Admins table
      if (!admins.length) {
        adminListContainer.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-xs text-slate-400">No administrators found.</td></tr>';
      } else {
        adminListContainer.innerHTML = admins.map(a => {
          const isFounding = a.approved_email.toLowerCase() === MANDATORY_FOUNDING_SUPER_ADMIN;
          return `
            <tr class="border-b border-slate-700/30 hover:bg-slate-800/40 transition-colors text-xs text-slate-300">
              <td class="py-3 px-4 font-semibold text-white">
                ${escapeHtml(a.full_name || 'Admin')}
                ${isFounding ? '<span class="ml-2 text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">FOUNDER</span>' : ''}
              </td>
              <td class="py-3 px-4">${escapeHtml(a.approved_email)}</td>
              <td class="py-3 px-4"><span class="capitalize">${a.role}</span></td>
              <td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${a.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950 text-amber-400 border border-amber-500/30'}">${a.status}</span></td>
              <td class="py-3 px-4 text-right space-x-2">
                ${!isFounding ? `
                  <button type="button" class="btn-change-admin-email text-[11px] text-blue-400 hover:text-blue-300 underline cursor-pointer" data-id="${a.id}" data-email="${a.approved_email}">Change Email</button>
                  <button type="button" class="btn-revoke-admin text-[11px] text-rose-400 hover:text-rose-300 underline cursor-pointer" data-id="${a.id}" data-email="${a.approved_email}">Revoke</button>
                ` : '<span class="text-slate-500 text-[10px]">Protected</span>'}
              </td>
            </tr>
          `;
        }).join('');

        // Bind Action Handlers
        adminListContainer.querySelectorAll('.btn-change-admin-email').forEach(btn => {
          btn.addEventListener('click', () => {
            const adminId = btn.dataset.id;
            const currentEmail = btn.dataset.email;
            const newEmail = prompt(`Enter new email address for ${currentEmail}:`);
            if (newEmail && newEmail.trim()) {
              handleChangeAdminEmail(adminId, newEmail.trim());
            }
          });
        });

        adminListContainer.querySelectorAll('.btn-revoke-admin').forEach(btn => {
          btn.addEventListener('click', () => {
            const adminId = btn.dataset.id;
            const email = btn.dataset.email;
            if (confirm(`Are you certain you want to revoke administrative access for ${email}?`)) {
              handleRevokeAdmin(adminId);
            }
          });
        });
      }
    } else {
      adminListContainer.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-xs text-rose-400">Failed to load admin team.</td></tr>';
    }
  }

  // Admin: Invite New Administrator
  async function handleInviteAdmin(e) {
    e.preventDefault();
    const form = e.target;
    const fullName = (form.fullName.value || '').trim();
    const email = (form.email.value || '').trim().toLowerCase();
    const role = form.role.value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!fullName || !email) {
      toast('Please enter name and email.', 'error');
      return;
    }

    setBtnLoading(submitBtn, true, 'Creating Invitation...');

    const res = await apiFetch('/admin/team/invite', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, role })
    });

    setBtnLoading(submitBtn, false);

    if (res.ok && res.data && res.data.success) {
      toast(`Admin invited! ${email} can now activate their account.`, 'success');
      form.reset();
      loadAdminTeam();
    } else {
      toast(res.data?.error || 'Failed to create admin invitation.', 'error');
    }
  }

  // Admin: Change Administrator Email
  async function handleChangeAdminEmail(adminId, newEmail) {
    const res = await apiFetch('/admin/team/email', {
      method: 'PUT',
      body: JSON.stringify({ adminId, newEmail })
    });

    if (res.ok && res.data && res.data.success) {
      toast(`Administrator email updated to ${newEmail}`, 'success');
      loadAdminTeam();
    } else {
      toast(res.data?.error || 'Failed to update admin email.', 'error');
    }
  }

  // Admin: Revoke Administrator Access
  async function handleRevokeAdmin(adminId) {
    const res = await apiFetch('/admin/team/revoke', {
      method: 'POST',
      body: JSON.stringify({ adminId })
    });

    if (res.ok && res.data && res.data.success) {
      toast('Administrative access revoked.', 'success');
      loadAdminTeam();
    } else {
      toast(res.data?.error || 'Failed to revoke admin access.', 'error');
    }
  }

  // Admin: Load Support Requests
  async function loadAdminSupport() {
    const container = document.getElementById('adminSupportTableBody');
    if (!container) return;

    container.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-xs text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading support tickets...</td></tr>';

    const res = await apiFetch('/admin/support');
    if (res.ok && res.data && Array.isArray(res.data.data)) {
      const tickets = res.data.data;
      if (!tickets.length) {
        container.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-xs text-slate-400">No support inquiries found.</td></tr>';
        return;
      }

      container.innerHTML = tickets.map(t => `
        <tr class="border-b border-slate-700/30 hover:bg-slate-800/40 transition-colors text-xs text-slate-300">
          <td class="py-3 px-4 text-slate-400 text-[11px]">${new Date(t.created_at).toLocaleDateString()}</td>
          <td class="py-3 px-4 font-semibold text-white">
            ${escapeHtml(t.full_name)}<br>
            <span class="text-slate-400 font-normal text-[11px]">${escapeHtml(t.email)}</span>
          </td>
          <td class="py-3 px-4">
            <span class="font-bold text-slate-200">${escapeHtml(t.subject)}</span>
            <p class="text-slate-400 text-[11px] mt-0.5 line-clamp-1">${escapeHtml(t.message)}</p>
          </td>
          <td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status === 'resolved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950 text-amber-400 border border-amber-500/30'}">${t.status}</span></td>
          <td class="py-3 px-4 text-right">
            ${t.status !== 'resolved' ? `
              <button type="button" class="btn-resolve-ticket text-[11px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer" data-id="${t.id}">Mark Resolved</button>
            ` : '<span class="text-slate-500 text-[11px]">Resolved</span>'}
          </td>
        </tr>
      `).join('');

      container.querySelectorAll('.btn-resolve-ticket').forEach(btn => {
        btn.addEventListener('click', async () => {
          const ticketId = btn.dataset.id;
          btn.disabled = true;
          const r = await apiFetch(`/admin/support/${ticketId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'resolved' })
          });
          if (r.ok && r.data && r.data.success) {
            toast('Ticket resolved.', 'success');
            loadAdminSupport();
          } else {
            toast(r.data?.error || 'Failed to update ticket.', 'error');
            btn.disabled = false;
          }
        });
      });
    } else {
      container.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-xs text-rose-400">Failed to load support inquiries.</td></tr>';
    }
  }

  // Escape HTML helper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Password visibility toggle helper
  function setupPasswordToggles() {
    document.querySelectorAll('.password-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;

        const icon = btn.querySelector('i');
        if (input.type === 'password') {
          input.type = 'text';
          if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
          }
        } else {
          input.type = 'password';
          if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
          }
        }
      });
    });
  }

  // Sign Out Handler
  async function handleSignOut() {
    if (!window.Clerk) return;
    try {
      await window.Clerk.signOut();
      closeAllModals();
      await syncAuthState();
      toast('You have been signed out.', 'info');
    } catch (err) {
      console.error('Sign Out Error:', err);
    }
  }

  // Global Event Binding
  function bindEvents() {
    // Nav Openers
    ['myAccountNavBtn', 'myAccountMobileNavBtn'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          openUserDashboard();
        });
      }
    });

    // Close buttons
    ['accountModalCloseBtn', 'accountModalBackdrop'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => closeModal('accountPortalModal'));
    });

    ['clientDashboardCloseBtn', 'clientDashboardBackdrop'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => closeModal('clientDashboardModal'));
    });

    ['adminDashboardCloseBtn', 'adminDashboardBackdrop'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => closeModal('adminDashboardModal'));
    });

    // Sign Out Buttons
    document.querySelectorAll('.btn-portal-signout').forEach(btn => {
      btn.addEventListener('click', handleSignOut);
    });

    // Tab Switchers in Portal Modal
    const tabClient = document.getElementById('tabClientBtn');
    const tabAdmin = document.getElementById('tabAdminBtn');
    if (tabClient) tabClient.addEventListener('click', () => switchPortalTab('client'));
    if (tabAdmin) tabAdmin.addEventListener('click', () => switchPortalTab('admin'));

    // Client Subview Transitions
    const toRegisterBtn = document.getElementById('toRegisterBtn');
    const toLoginBtn = document.getElementById('toLoginBtn');
    const clientForgotBtn = document.getElementById('clientForgotBtn');
    const clientForgotBackBtn = document.getElementById('clientForgotBackBtn');

    if (toRegisterBtn) toRegisterBtn.addEventListener('click', () => switchClientSubView('register'));
    if (toLoginBtn) toLoginBtn.addEventListener('click', () => switchClientSubView('login'));
    if (clientForgotBtn) clientForgotBtn.addEventListener('click', () => switchClientSubView('forgot'));
    if (clientForgotBackBtn) clientForgotBackBtn.addEventListener('click', () => switchClientSubView('login'));

    // Admin Subview Transitions
    const toAdminActivateBtn = document.getElementById('toAdminActivateBtn');
    const adminActivateBackBtn = document.getElementById('adminActivateBackBtn');
    if (toAdminActivateBtn) toAdminActivateBtn.addEventListener('click', () => switchAdminSubView('activate'));
    if (adminActivateBackBtn) adminActivateBackBtn.addEventListener('click', () => switchAdminSubView('login'));

    // Form Submissions
    const clientLoginForm = document.getElementById('clientLoginForm');
    if (clientLoginForm) clientLoginForm.addEventListener('submit', handleClientLogin);

    const clientRegisterForm = document.getElementById('clientRegisterForm');
    if (clientRegisterForm) clientRegisterForm.addEventListener('submit', handleClientRegister);

    const clientVerifyOtpBtn = document.getElementById('clientVerifyOtpBtn');
    if (clientVerifyOtpBtn) clientVerifyOtpBtn.addEventListener('click', handleClientOtpSubmit);

    const clientResendOtpBtn = document.getElementById('clientResendOtpBtn');
    if (clientResendOtpBtn) clientResendOtpBtn.addEventListener('click', handleClientResendOtp);

    const clientForgotForm1 = document.getElementById('clientForgotStep1');
    if (clientForgotForm1) clientForgotForm1.addEventListener('submit', handleClientForgotSendCode);

    const clientForgotForm2 = document.getElementById('clientForgotStep2');
    if (clientForgotForm2) clientForgotForm2.addEventListener('submit', handleClientForgotReset);

    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) adminLoginForm.addEventListener('submit', handleAdminLogin);

    const adminActivateForm = document.getElementById('adminActivateEmailForm');
    if (adminActivateForm) adminActivateForm.addEventListener('submit', handleAdminActivateCheck);

    const adminVerifyOtpBtn = document.getElementById('adminVerifyOtpBtn');
    if (adminVerifyOtpBtn) adminVerifyOtpBtn.addEventListener('click', handleAdminOtpSubmit);

    const adminResendOtpBtn = document.getElementById('adminResendOtpBtn');
    if (adminResendOtpBtn) adminResendOtpBtn.addEventListener('click', handleAdminResendOtp);

    const adminCredentialsForm = document.getElementById('adminCredentialsForm');
    if (adminCredentialsForm) adminCredentialsForm.addEventListener('submit', handleAdminCredentialsSubmit);

    // Client Dashboard Tabs
    ['overview', 'profile', 'services', 'support', 'settings'].forEach(tab => {
      const btn = document.getElementById(`clientTabBtn_${tab}`);
      if (btn) btn.addEventListener('click', () => switchClientDashboardTab(tab));
    });

    const clientProfileForm = document.getElementById('clientProfileForm');
    if (clientProfileForm) clientProfileForm.addEventListener('submit', handleClientProfileSave);

    const clientSupportForm = document.getElementById('clientSupportForm');
    if (clientSupportForm) clientSupportForm.addEventListener('submit', handleClientSupportSubmit);

    // Admin Dashboard Tabs
    ['overview', 'clients', 'team', 'support'].forEach(tab => {
      const btn = document.getElementById(`adminTabBtn_${tab}`);
      if (btn) btn.addEventListener('click', () => switchAdminDashboardTab(tab));
    });

    // Admin Client Search Input
    const clientSearchInput = document.getElementById('adminClientSearchInput');
    if (clientSearchInput) {
      let debounceTimer = null;
      clientSearchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          loadAdminClients(e.target.value);
        }, 300);
      });
    }

    // Admin Invite Form
    const adminInviteForm = document.getElementById('adminInviteForm');
    if (adminInviteForm) adminInviteForm.addEventListener('submit', handleInviteAdmin);

    // Escape Key Listener
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.currentModal) {
        closeModal(state.currentModal);
      }
    });

    setupPasswordToggles();
  }

  // Clerk SDK Loader & Initialization
  async function initClerk() {
    if (!window.Clerk) {
      console.warn('Clerk SDK not yet mounted on window. Waiting for script to load...');
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        if (window.Clerk) {
          clearInterval(interval);
          await bootstrapClerk();
        } else if (attempts > 30) {
          clearInterval(interval);
          console.error('Failed to load Clerk SDK from poetic-liger-4355.clerk.accounts.dev');
        }
      }, 200);
    } else {
      await bootstrapClerk();
    }
  }

  async function bootstrapClerk() {
    try {
      await window.Clerk.load({
        publishableKey: CLERK_PUBLISHABLE_KEY
      });
      state.clerkLoaded = true;

      // Listen for Clerk auth state changes
      window.Clerk.addListener(({ user }) => {
        syncAuthState();
      });

      await syncAuthState();
    } catch (err) {
      console.error('Clerk Initialization Error:', err);
    }
  }

  // DOM Content Loaded entry point
  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    initClerk();
  });

})();
