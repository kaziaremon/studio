/**
 * WHIZ STUDIO - SECURE CLERK-POWERED CLIENT & ADMIN ACCOUNT SYSTEM
 * Technology: Clerk JS SDK v5, Cloudflare D1 Backend API, Vanilla JS, GSAP 3.12+
 * Domain: whizstudio.art | Security: Role-Based Access Control ($0 Free Tier)
 * 
 * Strict Zero-Exposure Policy:
 * - Administrator emails are NEVER hardcoded or exposed in frontend code.
 * - Server-side authorization validates all administrative permissions.
 * - In-flight request guards prevent duplicate OTP requests and rate limiting.
 * - Official Clerk custom sign-up flow: Email -> OTP -> Credentials -> Complete.
 */

(function () {
  'use strict';

  const CLERK_PUBLISHABLE_KEY = 'pk_test_cG9ldGljLWxpZ2VyLTQzNTUuY2xlcmsuYWNjb3VudHMuZGV2JA';
  const API_BASE = 'https://whiz-api.kaziaremon.workers.dev/api/v1/portal';

  // Global State Machine
  const state = {
    clerkLoaded: false,
    currentUser: null,
    backendProfile: null,
    userRole: 'guest', // 'guest' | 'client' | 'admin' | 'super_admin'
    currentModal: null, // null | 'portal' | 'clientDashboard' | 'adminDashboard'
    activeTab: 'client', // 'client' | 'admin'
    clientSubView: 'login', // 'login' | 'register' | 'otp' | 'forgot' | '2fa'
    adminSubView: 'login', // 'login' | 'activate' | 'otp' | 'credentials' | 'forgot' | '2fa'
    pendingSignUp: null,
    pendingSignIn: null,
    admin2faFactor: null,
    client2faFactor: null,
    activationEmail: '',
    resendCooldown: 0,
    resendInterval: null,
    rateLimitCooldown: 0,
    isRequestInFlight: false
  };

  // Toast Helper
  function toast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    } else {
      console.log(`[Toast ${type.toUpperCase()}]: ${message}`);
    }
  }

  // Mask Email for privacy in OTP prompts
  function maskEmail(email) {
    if (!email || !email.includes('@')) return email || '';
    const [user, domain] = email.split('@');
    if (user.length <= 2) return `${user[0]}*@${domain}`;
    return `${user[0]}${'*'.repeat(Math.min(user.length - 2, 4))}${user[user.length - 1]}@${domain}`;
  }

  // Parse Clerk Error safely
  function parseClerkError(err) {
    if (!err) return { code: 'unknown', message: 'An unexpected error occurred.' };
    const first = (err.errors && err.errors[0]) || {};
    return {
      code: first.code || err.code || 'unknown',
      message: first.message || err.message || 'An unexpected error occurred.',
      longMessage: first.longMessage || first.message || err.message || '',
      meta: first.meta || null
    };
  }

  // Detect rate limit / too many requests across all Clerk error formats
  function isRateLimitError(err) {
    if (!err) return false;
    if (err.status === 429) return true;
    const parsed = parseClerkError(err);
    const code = (parsed.code || '').toLowerCase();
    const msg = ((parsed.message || '') + ' ' + (parsed.longMessage || '')).toLowerCase();
    return (
      code.includes('too_many_requests') ||
      code.includes('rate_limit') ||
      code.includes('verification_code_too_many_requests') ||
      msg.includes('too many verification code requests') ||
      msg.includes('too many requests') ||
      msg.includes('rate limit')
    );
  }

  // API Call Wrapper with Clerk ID header
  async function apiFetch(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (window.Clerk && window.Clerk.session) {
      try {
        const token = await window.Clerk.session.getToken();
        if (token) {
          headers['Authorization'] = 'Bearer ' + token;
        }
      } catch (e) {
        console.warn('Could not retrieve Clerk session token:', e);
      }
    }

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

  // OTP 6-Digit Box Helpers
  function bindOtpInputEvents(containerId, onCompleteCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const inputs = container.querySelectorAll('.otp-box');
    if (!inputs.length) return;

    inputs.forEach((input, idx) => {
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = val.slice(-1);
        if (e.target.value && idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        }
        const fullCode = Array.from(inputs).map(i => i.value).join('');
        if (fullCode.length === 6 && typeof onCompleteCallback === 'function') {
          onCompleteCallback(fullCode);
        }
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
          const fullCode = Array.from(inputs).map(i => i.value).join('');
          if (fullCode.length === 6 && typeof onCompleteCallback === 'function') {
            onCompleteCallback(fullCode);
          }
        }
      });
    });
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
    const inputs = container.querySelectorAll('.otp-box');
    inputs.forEach(i => i.value = '');
    if (inputs[0]) inputs[0].focus();
  }

  // Resend Timer Helper
  function startResendTimer(btnId, timerTextId, durationSeconds = 60) {
    const btn = document.getElementById(btnId);
    const textEl = document.getElementById(timerTextId);
    if (!btn) return;

    if (state.resendInterval) clearInterval(state.resendInterval);
    state.resendCooldown = durationSeconds;
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

  // Tab & Subview Switchers
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
      forgot: document.getElementById('clientForgotView'),
      '2fa': document.getElementById('clientSecondFactorView')
    };

    Object.keys(views).forEach(key => {
      if (views[key]) {
        if (key === subview) views[key].classList.remove('hidden');
        else views[key].classList.add('hidden');
      }
    });

    if (subview === 'otp') {
      clearOtpInputs('clientOtpInputsContainer');
      startResendTimer('clientResendOtpBtn', 'clientResendOtpTimer');
    } else if (subview === '2fa') {
      clearOtpInputs('client2faInputsContainer');
      startResendTimer('clientResend2faBtn', 'clientResend2faTimer');
    } else if (subview === 'login') {
      setTimeout(() => {
        const input = document.getElementById('clientIdentifier');
        if (input) input.focus();
      }, 50);
    } else if (subview === 'register') {
      setTimeout(() => {
        const input = document.getElementById('clientRegFullName');
        if (input) input.focus();
      }, 50);
    } else if (subview === 'forgot') {
      setTimeout(() => {
        const input = document.getElementById('clientForgotEmail');
        if (input) input.focus();
      }, 50);
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
      forgot: document.getElementById('adminForgotView'),
      '2fa': document.getElementById('adminSecondFactorView')
    };

    Object.keys(views).forEach(key => {
      if (views[key]) {
        if (key === subview) views[key].classList.remove('hidden');
        else views[key].classList.add('hidden');
      }
    });

    if (subview === 'otp') {
      clearOtpInputs('adminOtpInputsContainer');
      startResendTimer('adminResendOtpBtn', 'adminResendOtpTimer');
    } else if (subview === '2fa') {
      clearOtpInputs('admin2faInputsContainer');
      startResendTimer('adminResend2faBtn', 'adminResend2faTimer');
    } else if (subview === 'activate') {
      setTimeout(() => {
        const input = document.getElementById('adminActivateEmail');
        if (input) input.focus();
      }, 50);
    } else if (subview === 'login') {
      setTimeout(() => {
        const input = document.getElementById('adminEmail');
        if (input) input.focus();
      }, 50);
    } else if (subview === 'credentials') {
      setTimeout(() => {
        const input = document.getElementById('adminCredFullName');
        if (input) input.focus();
      }, 50);
    } else if (subview === 'forgot') {
      setTimeout(() => {
        const input = document.getElementById('adminForgotEmail');
        if (input) input.focus();
      }, 50);
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

    // Authenticated in Clerk -> Verify backend profile & role from trusted API
    const res = await apiFetch('/me');
    if (res.ok && res.data && res.data.data && res.data.data.user) {
      state.backendProfile = res.data.data.user;
      const role = state.backendProfile.role;
      if (role === 'owner' || state.backendProfile.isSuperAdmin) {
        state.userRole = 'super_admin';
      } else if (role === 'admin') {
        state.userRole = 'admin';
      } else {
        state.userRole = 'client';
      }
    } else {
      // Fallback role resolution
      state.userRole = 'client';
    }

    // Update Nav buttons to show Name & Role
    const displayName = user.firstName || user.username || (user.primaryEmailAddress ? user.primaryEmailAddress.emailAddress.split('@')[0] : 'User');
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

  async function routeAuthenticatedUser(customSuccessMessage) {
    await syncAuthState();
    closeModal('accountPortalModal');
    if (state.userRole === 'super_admin' || state.userRole === 'admin') {
      toast(customSuccessMessage || 'Welcome back! Directing to Super Admin Console...', 'success');
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 350);
    } else {
      toast(customSuccessMessage || 'Signed in successfully! Loading your workspace...', 'success');
      setTimeout(() => {
        window.location.href = '/client/dashboard';
      }, 350);
    }
  }

  async function handleGoogleOAuth(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!window.Clerk) {
      toast('Authentication system is initializing. Please try again.', 'warning');
      return;
    }

    try {
      showPortalAlert('');
      const redirectUrl = window.location.origin + '/sso-callback';
      const redirectUrlComplete = window.location.origin + '/sso-callback';

      const isRegisterTab = state.clientSubView === 'register';
      const primaryClient = isRegisterTab ? window.Clerk.client.signUp : window.Clerk.client.signIn;
      const fallbackClient = isRegisterTab ? window.Clerk.client.signIn : window.Clerk.client.signUp;

      try {
        await primaryClient.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl,
          redirectUrlComplete
        });
      } catch (authErr) {
        console.warn('Primary OAuth client redirect notice, attempting fallback:', authErr);
        await fallbackClient.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl,
          redirectUrlComplete
        });
      }
    } catch (err) {
      console.error('Google OAuth Error:', err);
      const parsed = parseClerkError(err);
      showPortalAlert(parsed.longMessage || parsed.message || 'Unable to connect with Google. Please try again.', 'error');
    }
  }

  async function handleClientLogin(e) {
    e.preventDefault();
    if (state.isRequestInFlight) return;
    showPortalAlert('');

    const form = e.target;
    const identifier = (form.identifier.value || '').trim();
    const password = form.password.value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!identifier || !password) {
      showPortalAlert('Please enter both your username/email and password.', 'error');
      return;
    }

    state.isRequestInFlight = true;
    setBtnLoading(submitBtn, true, 'Signing in...');

    try {
      const signInAttempt = await window.Clerk.client.signIn.create({
        identifier,
        password
      });

      if (signInAttempt.status === 'complete') {
        await window.Clerk.setActive({ session: signInAttempt.createdSessionId });
        
        const email = signInAttempt.identifier || (window.Clerk.user?.primaryEmailAddress?.emailAddress) || '';
        await apiFetch('/sync-client', {
          method: 'POST',
          body: JSON.stringify({
            clerkUserId: signInAttempt.createdUserId,
            email,
            fullName: window.Clerk.user ? (window.Clerk.user.fullName || window.Clerk.user.username) : 'Client'
          })
        });

        await routeAuthenticatedUser('Signed in successfully!');
      } else if (signInAttempt.status === 'needs_second_factor' || signInAttempt.status === 'needs_client_trust') {
        state.pendingSignIn = signInAttempt;
        await setupClientSecondFactor(signInAttempt);
      } else if (signInAttempt.status === 'needs_first_factor') {
        state.pendingSignIn = signInAttempt;
        await setupClientFirstFactor(signInAttempt);
      } else {
        showPortalAlert(`Authentication requires further verification (Status: ${signInAttempt.status}).`, 'warning');
      }
    } catch (err) {
      console.error('Sign In Error:', err);
      const parsed = parseClerkError(err);
      showPortalAlert(parsed.longMessage || parsed.message || 'Invalid username/email or password.', 'error');
    } finally {
      state.isRequestInFlight = false;
      setBtnLoading(submitBtn, false);
    }
  }

  // Client Second-Factor / Device Trust Setup
  async function setupClientSecondFactor(signInAttempt) {
    try {
      const factors = signInAttempt.supportedSecondFactors || [];
      let factor = factors.find(f => f.strategy === 'email_code') || factors[0] || { strategy: 'email_code' };
      state.client2faFactor = factor;

      switchClientSubView('2fa');

      if (factor.strategy === 'email_code') {
        const targetEl = document.getElementById('client2faTarget');
        const targetEmail = factor.safeIdentifier || signInAttempt.identifier || (window.Clerk?.user?.primaryEmailAddress?.emailAddress) || 'your email';
        if (targetEl) targetEl.textContent = maskEmail(targetEmail);

        try {
          await signInAttempt.prepareSecondFactor({
            strategy: 'email_code',
            ...(factor.emailAddressId ? { emailAddressId: factor.emailAddressId } : {})
          });
          toast('Verification code sent to your email.', 'info');
        } catch (e) {
          console.warn('prepareSecondFactor client warning:', e);
          toast('Please enter the verification code sent to your email.', 'info');
        }
      }
    } catch (err) {
      console.error('setupClientSecondFactor error:', err);
      switchClientSubView('2fa');
    }
  }

  // Client First-Factor Setup
  async function setupClientFirstFactor(signInAttempt) {
    const factors = signInAttempt.supportedFirstFactors || [];
    const emailFactor = factors.find(f => f.strategy === 'email_code') || factors[0] || { strategy: 'email_code' };
    state.client2faFactor = emailFactor;

    try {
      await signInAttempt.prepareFirstFactor({
        strategy: 'email_code',
        ...(emailFactor.emailAddressId ? { emailAddressId: emailFactor.emailAddressId } : {})
      });
    } catch (e) {
      console.warn('prepareFirstFactor client warning:', e);
    }
    const targetEl = document.getElementById('client2faTarget');
    const targetEmail = emailFactor.safeIdentifier || signInAttempt.identifier || 'your email';
    if (targetEl) targetEl.textContent = maskEmail(targetEmail);
    switchClientSubView('2fa');
    toast('Verification code sent to your email.', 'info');
  }

  // Client Second-Factor Code Submit
  async function handleClient2faSubmit() {
    if (state.isRequestInFlight) return;
    const signIn = state.pendingSignIn || window.Clerk?.client?.signIn;
    if (!signIn) {
      showPortalAlert('No pending authentication session found.', 'error');
      switchClientSubView('login');
      return;
    }

    const code = getOtpCode('client2faInputsContainer');
    if (!code || code.length < 6) {
      showPortalAlert('Please enter the 6-digit verification code.', 'error');
      return;
    }

    state.isRequestInFlight = true;
    const submitBtn = document.getElementById('clientVerify2faBtn');
    setBtnLoading(submitBtn, true, 'Verifying...');
    showPortalAlert('');

    try {
      const factor = state.client2faFactor || { strategy: 'email_code' };
      let result;
      if (signIn.status === 'needs_first_factor') {
        result = await signIn.attemptFirstFactor({ strategy: factor.strategy, code });
      } else {
        result = await signIn.attemptSecondFactor({ strategy: factor.strategy, code });
      }

      if (result.status === 'complete') {
        await window.Clerk.setActive({ session: result.createdSessionId });
        const email = result.identifier || (window.Clerk.user?.primaryEmailAddress?.emailAddress) || '';
        await apiFetch('/sync-client', {
          method: 'POST',
          body: JSON.stringify({
            clerkUserId: result.createdUserId,
            email,
            fullName: window.Clerk.user ? (window.Clerk.user.fullName || window.Clerk.user.username) : 'Client'
          })
        });
        await syncAuthState();
        closeModal('accountPortalModal');
        toast('Signed in successfully!', 'success');
        openClientDashboard();
      } else {
        showPortalAlert(`Verification status: ${result.status}`, 'warning');
      }
    } catch (err) {
      console.error('Client 2FA Error:', err);
      const parsed = parseClerkError(err);
      showPortalAlert(parsed.longMessage || parsed.message || 'Verification failed. Please try again.', 'error');
      clearOtpInputs('client2faInputsContainer');
    } finally {
      state.isRequestInFlight = false;
      setBtnLoading(submitBtn, false);
    }
  }

  // Client Resend Second-Factor Code
  async function handleClientResend2fa() {
    if (state.isRequestInFlight || state.resendCooldown > 0) return;
    const signIn = state.pendingSignIn || window.Clerk?.client?.signIn;
    if (!signIn) return;

    state.isRequestInFlight = true;
    try {
      const factor = state.client2faFactor || { strategy: 'email_code' };
      if (signIn.status === 'needs_first_factor') {
        await signIn.prepareFirstFactor({ strategy: factor.strategy, ...(factor.emailAddressId ? { emailAddressId: factor.emailAddressId } : {}) });
      } else {
        await signIn.prepareSecondFactor({ strategy: factor.strategy, ...(factor.emailAddressId ? { emailAddressId: factor.emailAddressId } : {}) });
      }
      toast('Verification code resent. Please check your email.', 'info');
      startResendTimer('clientResend2faBtn', 'clientResend2faTimer', 60);
      clearOtpInputs('client2faInputsContainer');
    } catch (err) {
      console.error('Client resend 2fa error:', err);
      if (isRateLimitError(err)) {
        toast('Too many requests. Please wait before requesting another code.', 'warning');
        startResendTimer('clientResend2faBtn', 'clientResend2faTimer', 120);
      } else {
        const parsed = parseClerkError(err);
        toast(parsed.message || 'Failed to resend code.', 'error');
      }
    } finally {
      state.isRequestInFlight = false;
    }
  }

  async function handleClientRegister(e) {
    e.preventDefault();
    if (state.isRequestInFlight) return;
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
      showPortalAlert('Password must be at least 15 characters long as required for high security standards.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showPortalAlert('Passwords do not match. Please verify your password.', 'error');
      return;
    }

    state.isRequestInFlight = true;
    setBtnLoading(submitBtn, true, 'Creating Account...');

    try {
      const nameParts = fullName.split(/\s+/);
      const firstName = nameParts[0] || fullName;
      const lastName = nameParts.slice(1).join(' ') || '';

      const signUpAttempt = await window.Clerk.client.signUp.create({
        username,
        emailAddress: email,
        password,
        firstName,
        lastName
      });

      state.pendingSignUp = signUpAttempt;

      try {
        await signUpAttempt.prepareEmailAddressVerification({ strategy: 'email_code' });
        const targetEl = document.getElementById('clientOtpTargetEmail');
        if (targetEl) targetEl.textContent = maskEmail(email);

        switchClientSubView('otp');
        toast(`Verification code sent. Please check your email.`, 'info');
      } catch (prepErr) {
        if (isRateLimitError(prepErr)) {
          const targetEl = document.getElementById('clientOtpTargetEmail');
          if (targetEl) targetEl.textContent = maskEmail(email);
          switchClientSubView('otp');
          toast('A verification code was already dispatched. Please check your inbox.', 'warning');
          startResendTimer('clientResendOtpBtn', 'clientResendOtpTimer', 120);
        } else {
          throw prepErr;
        }
      }
    } catch (err) {
      console.error('Sign Up Error:', err);
      const parsed = parseClerkError(err);
      if (isRateLimitError(err)) {
        showPortalAlert('Too many requests. Please wait a few moments before trying again.', 'warning');
      } else {
        showPortalAlert(parsed.longMessage || parsed.message || 'Error creating account. Please check your details.', 'error');
      }
    } finally {
      state.isRequestInFlight = false;
      setBtnLoading(submitBtn, false);
    }
  }

  async function handleClientOtpSubmit() {
    if (state.isRequestInFlight) return;
    showPortalAlert('');

    const code = getOtpCode('clientOtpInputsContainer');
    const submitBtn = document.getElementById('clientVerifyOtpBtn');

    if (code.length !== 6) {
      showPortalAlert('Please enter the complete 6-digit verification code.', 'error');
      return;
    }

    const attempt = state.pendingSignUp || window.Clerk.client.signUp;
    if (!attempt) {
      showPortalAlert('Registration session expired. Please start registration again.', 'error');
      switchClientSubView('register');
      return;
    }

    state.isRequestInFlight = true;
    setBtnLoading(submitBtn, true, 'Verifying code...');

    try {
      const completeSignUp = await attempt.attemptEmailAddressVerification({ code });

      if (completeSignUp.status === 'complete') {
        await window.Clerk.setActive({ session: completeSignUp.createdSessionId });

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

        await routeAuthenticatedUser('Account created successfully! Welcome to Whiz Studio.');
      } else {
        showPortalAlert(`Verification pending additional steps (Status: ${completeSignUp.status}).`, 'warning');
      }
    } catch (err) {
      console.error('OTP Verification Error:', err);
      const parsed = parseClerkError(err);
      showPortalAlert(parsed.longMessage || parsed.message || 'Invalid verification code. Please check your email.', 'error');
      clearOtpInputs('clientOtpInputsContainer');
    } finally {
      state.isRequestInFlight = false;
      setBtnLoading(submitBtn, false);
    }
  }

  async function handleClientResendOtp() {
    if (state.isRequestInFlight || state.resendCooldown > 0) return;
    const attempt = state.pendingSignUp || window.Clerk.client.signUp;
    if (!attempt) return;

    state.isRequestInFlight = true;
    try {
      await attempt.prepareEmailAddressVerification({ strategy: 'email_code' });
      toast('Verification code sent. Please check your email.', 'info');
      startResendTimer('clientResendOtpBtn', 'clientResendOtpTimer', 60);
    } catch (err) {
      if (isRateLimitError(err)) {
        toast('Too many requests. Please wait before requesting another code.', 'warning');
        startResendTimer('clientResendOtpBtn', 'clientResendOtpTimer', 120);
      } else {
        const parsed = parseClerkError(err);
        toast(parsed.message || 'Failed to resend code.', 'error');
      }
    } finally {
      state.isRequestInFlight = false;
    }
  }

  async function handleClientForgotSendCode(e) {
    e.preventDefault();
    if (state.isRequestInFlight) return;
    showPortalAlert('');

    const form = e.target;
    const identifier = (form.email.value || '').trim();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!identifier) {
      showPortalAlert('Please enter your account email address.', 'error');
      return;
    }

    state.isRequestInFlight = true;
    setBtnLoading(submitBtn, true, 'Sending Code...');

    try {
      const signInAttempt = await window.Clerk.client.signIn.create({
        strategy: 'reset_password_email_code',
        identifier
      });
      state.pendingSignIn = signInAttempt;

      document.getElementById('clientForgotStep1').classList.add('hidden');
      document.getElementById('clientForgotStep2').classList.remove('hidden');
      toast('Verification code sent. Please check your email.', 'info');
    } catch (err) {
      console.error('Forgot Password Error:', err);
      const parsed = parseClerkError(err);
      showPortalAlert(parsed.longMessage || parsed.message || 'Could not send reset code.', 'error');
    } finally {
      state.isRequestInFlight = false;
      setBtnLoading(submitBtn, false);
    }
  }

  async function handleClientForgotReset(e) {
    e.preventDefault();
    if (state.isRequestInFlight) return;
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

    state.isRequestInFlight = true;
    setBtnLoading(submitBtn, true, 'Updating Password...');

    try {
      const result = await state.pendingSignIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword
      });

      if (result.status === 'complete') {
        await window.Clerk.setActive({ session: result.createdSessionId });
        await routeAuthenticatedUser('Password updated successfully! You are now logged in.');
      } else {
        showPortalAlert(`Status: ${result.status}`, 'warning');
      }
    } catch (err) {
      console.error('Password Reset Error:', err);
      const parsed = parseClerkError(err);
      showPortalAlert(parsed.longMessage || parsed.message || 'Invalid code or password.', 'error');
    } finally {
      state.isRequestInFlight = false;
      setBtnLoading(submitBtn, false);
    }
  }

  // =========================================================================
  // ADMIN AUTHENTICATION & FOUNDING ACTIVATION HANDLERS
  // =========================================================================

  async function handleAdminLogin(e) {
    e.preventDefault();
    if (state.isRequestInFlight) return;
    showPortalAlert('');

    const form = e.target;
    const identifier = (form.adminEmail.value || '').trim();
    const password = form.adminPassword.value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!identifier || !password) {
      showPortalAlert('Please enter your administrator username or email and password.', 'error');
      return;
    }

    state.isRequestInFlight = true;
    setBtnLoading(submitBtn, true, 'Authenticating Admin...');

    try {
      // 1. If identifier is an email, check activation eligibility first
      if (identifier.includes('@')) {
        const checkRes = await apiFetch(`/check-admin?email=${encodeURIComponent(identifier.toLowerCase())}`);
        const checkData = (checkRes && checkRes.data && (checkRes.data.data || checkRes.data)) || null;

        if (checkRes && checkRes.ok && checkData) {
          if (checkData.needsActivation) {
            showPortalAlert('This administrator account has not completed initial activation. Please click "Activate Admin Account" below.', 'warning');
            setBtnLoading(submitBtn, false);
            state.isRequestInFlight = false;
            return;
          }
        }
      }

      // 2. Sign in via Clerk using Username or Email
      const signInAttempt = await window.Clerk.client.signIn.create({
        identifier,
        password
      });

      if (signInAttempt.status === 'complete') {
        await window.Clerk.setActive({ session: signInAttempt.createdSessionId });
        await syncAuthState();

        if (state.userRole !== 'admin' && state.userRole !== 'super_admin') {
          await window.Clerk.signOut();
          showPortalAlert('Access Revoked: Server verified that your account does not possess administrative permissions.', 'error');
          return;
        }

        closeModal('accountPortalModal');
        toast('Welcome to Whiz Studio Admin Console', 'success');
        openAdminDashboard();
      } else if (
        signInAttempt.status === 'needs_second_factor' ||
        signInAttempt.status === 'needs_client_trust' ||
        (signInAttempt.supportedSecondFactors && signInAttempt.supportedSecondFactors.length > 0)
      ) {
        state.pendingSignIn = signInAttempt;
        await setupAdminSecondFactor(signInAttempt);
      } else if (
        signInAttempt.status === 'needs_first_factor' ||
        (signInAttempt.supportedFirstFactors && signInAttempt.supportedFirstFactors.length > 0)
      ) {
        state.pendingSignIn = signInAttempt;
        await setupAdminFirstFactor(signInAttempt);
      } else {
        // Resilient fallback: transition to verification rather than leaving user stuck
        console.warn('[Admin Auth] Unhandled status:', signInAttempt.status, '- attempting 2FA flow');
        state.pendingSignIn = signInAttempt;
        await setupAdminSecondFactor(signInAttempt);
      }
    } catch (err) {
      console.error('Admin Sign In Error:', err);
      const parsed = parseClerkError(err);
      showPortalAlert(parsed.longMessage || parsed.message || 'Invalid administrator credentials.', 'error');
    } finally {
      state.isRequestInFlight = false;
      setBtnLoading(submitBtn, false);
    }
  }

  // Admin Second-Factor / Device Trust Setup
  async function setupAdminSecondFactor(signInAttempt) {
    try {
      const factors = signInAttempt.supportedSecondFactors || [];
      console.log('[Admin 2FA] Status:', signInAttempt.status, 'Supported Factors:', factors);

      // Prefer email_code, then totp, then phone_code, then backup_code
      let factor = factors.find(f => f.strategy === 'email_code') ||
                   factors.find(f => f.strategy === 'totp') ||
                   factors.find(f => f.strategy === 'phone_code') ||
                   factors.find(f => f.strategy === 'backup_code') ||
                   factors[0] ||
                   { strategy: 'email_code' };

      state.admin2faFactor = factor;

      // Switch to 2FA view immediately so the UI transitions right away
      switchAdminSubView('2fa');

      const titleEl = document.getElementById('admin2faTitle');
      const descEl = document.getElementById('admin2faDescription');
      const badgeEl = document.getElementById('admin2faBadgeText');
      const resendRow = document.getElementById('admin2faResendRow');
      const inputsContainer = document.getElementById('admin2faInputsContainer');
      const backupContainer = document.getElementById('admin2faBackupContainer');

      if (factor.strategy === 'email_code') {
        const targetEmail = factor.safeIdentifier || signInAttempt.identifier || 'kaziaremon@gmail.com';
        if (titleEl) titleEl.textContent = 'Verify Your Identity';
        if (badgeEl) badgeEl.textContent = 'Device Verification';
        if (descEl) {
          descEl.innerHTML = `Enter the 6-digit verification code sent to <span id="admin2faTarget" class="font-bold text-slate-900">${maskEmail(targetEmail)}</span>.`;
        }
        if (resendRow) resendRow.classList.remove('hidden');
        if (inputsContainer) inputsContainer.classList.remove('hidden');
        if (backupContainer) backupContainer.classList.add('hidden');

        try {
          await signInAttempt.prepareSecondFactor({
            strategy: 'email_code',
            ...(factor.emailAddressId ? { emailAddressId: factor.emailAddressId } : {})
          });
          toast('Verification code sent to your email.', 'info');
        } catch (prepErr) {
          console.warn('Admin prepareSecondFactor warning:', prepErr);
          if (isRateLimitError(prepErr)) {
            toast('A security code was recently dispatched. Please check your email.', 'info');
          } else {
            toast('Please check your email for the verification code.', 'info');
          }
        }
      } else if (factor.strategy === 'totp') {
        if (titleEl) titleEl.textContent = 'Authenticator Code';
        if (badgeEl) badgeEl.textContent = 'Two-Factor Authentication';
        if (descEl) descEl.textContent = 'Enter the 6-digit verification code generated by your authenticator app.';
        if (resendRow) resendRow.classList.add('hidden');
        if (inputsContainer) inputsContainer.classList.remove('hidden');
        if (backupContainer) backupContainer.classList.add('hidden');
      } else if (factor.strategy === 'backup_code') {
        if (titleEl) titleEl.textContent = 'Backup Security Code';
        if (badgeEl) badgeEl.textContent = 'Recovery Authentication';
        if (descEl) descEl.textContent = 'Enter one of your saved backup security codes.';
        if (resendRow) resendRow.classList.add('hidden');
        if (inputsContainer) inputsContainer.classList.add('hidden');
        if (backupContainer) backupContainer.classList.remove('hidden');
      } else if (factor.strategy === 'phone_code') {
        try {
          await signInAttempt.prepareSecondFactor({
            strategy: 'phone_code',
            ...(factor.phoneNumberId ? { phoneNumberId: factor.phoneNumberId } : {})
          });
        } catch (prepErr) {
          console.warn('Admin prepareSecondFactor phone warning:', prepErr);
        }
        if (titleEl) titleEl.textContent = 'SMS Verification';
        if (badgeEl) badgeEl.textContent = 'Phone Verification';
        if (descEl) descEl.textContent = 'Enter the 6-digit SMS verification code sent to your phone.';
        if (resendRow) resendRow.classList.remove('hidden');
        if (inputsContainer) inputsContainer.classList.remove('hidden');
        if (backupContainer) backupContainer.classList.add('hidden');
        toast('Verification code sent via SMS.', 'info');
      }
    } catch (e) {
      console.error('setupAdminSecondFactor fatal error:', e);
      switchAdminSubView('2fa');
      showPortalAlert('Please enter the 6-digit verification code sent to your email.', 'info');
    }
  }

  // Admin First-Factor Setup (Fallback if First Factor email OTP is used)
  async function setupAdminFirstFactor(signInAttempt) {
    const factors = signInAttempt.supportedFirstFactors || [];
    console.log('[Admin 1FA] Supported First Factors:', factors);
    const emailFactor = factors.find(f => f.strategy === 'email_code') || factors[0] || { strategy: 'email_code' };
    state.admin2faFactor = emailFactor;

    try {
      await signInAttempt.prepareFirstFactor({
        strategy: 'email_code',
        ...(emailFactor.emailAddressId ? { emailAddressId: emailFactor.emailAddressId } : {})
      });
    } catch (e) {
      console.warn('prepareFirstFactor warning:', e);
    }
    const targetEmail = emailFactor.safeIdentifier || signInAttempt.identifier || 'kaziaremon@gmail.com';
    const descEl = document.getElementById('admin2faDescription');
    if (descEl) descEl.innerHTML = `Enter the 6-digit verification code sent to <span id="admin2faTarget" class="font-bold text-slate-900">${maskEmail(targetEmail)}</span>.`;
    switchAdminSubView('2fa');
    toast('Verification code sent to your email.', 'info');
  }

  // Admin Second-Factor Code Submit
  async function handleAdmin2faSubmit() {
    if (state.isRequestInFlight) return;
    const signIn = state.pendingSignIn || window.Clerk?.client?.signIn;
    if (!signIn) {
      showPortalAlert('No pending authentication attempt found. Please enter your credentials again.', 'error');
      switchAdminSubView('login');
      return;
    }

    const factor = state.admin2faFactor || (signIn.supportedSecondFactors && signIn.supportedSecondFactors[0]) || { strategy: 'email_code' };
    let code = '';
    if (factor.strategy === 'backup_code') {
      const backupInput = document.getElementById('admin2faBackupInput');
      code = (backupInput?.value || '').trim();
    } else {
      code = getOtpCode('admin2faInputsContainer');
    }

    if (!code || (factor.strategy !== 'backup_code' && code.length < 6)) {
      showPortalAlert('Please enter the complete 6-digit verification code.', 'error');
      return;
    }

    state.isRequestInFlight = true;
    const submitBtn = document.getElementById('adminVerify2faBtn');
    setBtnLoading(submitBtn, true, 'Verifying Identity...');
    showPortalAlert('');

    try {
      let result;
      if (signIn.status === 'needs_first_factor') {
        result = await signIn.attemptFirstFactor({
          strategy: factor.strategy,
          code
        });
      } else {
        result = await signIn.attemptSecondFactor({
          strategy: factor.strategy,
          code
        });
      }

      if (result.status === 'complete') {
        await window.Clerk.setActive({ session: result.createdSessionId });
        await syncAuthState();

        if (state.userRole !== 'admin' && state.userRole !== 'super_admin') {
          await window.Clerk.signOut();
          showPortalAlert('Access Revoked: Server verified that your account does not possess administrative permissions.', 'error');
          return;
        }

        closeModal('accountPortalModal');
        toast('Admin identity verified. Welcome to Console!', 'success');
        openAdminDashboard();
      } else {
        showPortalAlert(`Verification status: ${result.status}. Please check your verification code.`, 'warning');
      }
    } catch (err) {
      console.error('Admin 2FA Verification Error:', err);
      const parsed = parseClerkError(err);
      if (parsed.code === 'verification_expired') {
        showPortalAlert('Verification code has expired. Please click "Resend Code" to receive a new one.', 'error');
        clearOtpInputs('admin2faInputsContainer');
      } else if (parsed.code === 'verification_failed' || parsed.code === 'form_code_incorrect') {
        showPortalAlert('Incorrect verification code. Please check your email and try again.', 'error');
        clearOtpInputs('admin2faInputsContainer');
      } else if (isRateLimitError(err)) {
        showPortalAlert('Too many failed attempts. Please wait a moment before trying again.', 'error');
      } else {
        showPortalAlert(parsed.longMessage || parsed.message || 'Verification failed. Please try again.', 'error');
      }
    } finally {
      state.isRequestInFlight = false;
      setBtnLoading(submitBtn, false);
    }
  }

  // Admin Resend Second-Factor Code
  async function handleAdminResend2fa() {
    if (state.isRequestInFlight || state.resendCooldown > 0) return;
    const signIn = state.pendingSignIn || window.Clerk?.client?.signIn;
    if (!signIn) return;

    const factor = state.admin2faFactor || (signIn.supportedSecondFactors && signIn.supportedSecondFactors[0]) || { strategy: 'email_code' };
    if (factor.strategy !== 'email_code' && factor.strategy !== 'phone_code') return;

    state.isRequestInFlight = true;
    try {
      if (signIn.status === 'needs_first_factor') {
        await signIn.prepareFirstFactor({
          strategy: factor.strategy,
          ...(factor.emailAddressId ? { emailAddressId: factor.emailAddressId } : {})
        });
      } else {
        await signIn.prepareSecondFactor({
          strategy: factor.strategy,
          ...(factor.emailAddressId ? { emailAddressId: factor.emailAddressId } : {})
        });
      }
      toast('Verification code sent. Please check your email.', 'info');
      startResendTimer('adminResend2faBtn', 'adminResend2faTimer', 60);
      clearOtpInputs('admin2faInputsContainer');
    } catch (err) {
      console.error('Resend 2FA Error:', err);
      if (isRateLimitError(err)) {
        toast('Too many requests. Please wait a moment before requesting another code.', 'warning');
        startResendTimer('adminResend2faBtn', 'adminResend2faTimer', 120);
      } else {
        const parsed = parseClerkError(err);
        toast(parsed.message || 'Failed to resend code.', 'error');
      }
    } finally {
      state.isRequestInFlight = false;
    }
  }

  // Admin Activation Check & OTP Request
  async function handleAdminActivateCheck(e) {
    e.preventDefault();
    if (state.isRequestInFlight) return;
    showPortalAlert('');

    const form = e.target;
    const email = (form.email.value || '').trim().toLowerCase();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!email) {
      showPortalAlert('Please enter your approved administrative email address.', 'error');
      return;
    }

    state.isRequestInFlight = true;
    setBtnLoading(submitBtn, true, 'Verifying Eligibility...');

    try {
      // Step 1: Server-side eligibility check (zero information leakage, defensive response handling)
      const res = await apiFetch(`/check-admin?email=${encodeURIComponent(email)}`);
      const resData = (res && res.data && (res.data.data || res.data)) || null;

      if (!res || !res.ok || !resData || !resData.authorized) {
        showPortalAlert((resData && resData.error) || 'This email address is not eligible for administrator activation.', 'error');
        return;
      }

      const needsActivation = Boolean(resData.needsActivation);
      if (!needsActivation) {
        showPortalAlert('This administrator account has already been activated. Please sign in directly with your password.', 'info');
        switchAdminSubView('login');
        return;
      }

      state.activationEmail = email;

      // Step 2: Check for existing in-progress sign-up in current client session
      const existingSignUp = window.Clerk?.client?.signUp;
      if (
        existingSignUp &&
        existingSignUp.status === 'missing_requirements' &&
        existingSignUp.emailAddress &&
        existingSignUp.emailAddress.toLowerCase() === email
      ) {
        state.pendingSignUp = existingSignUp;

        // Check if email was ALREADY verified in this browser
        if (existingSignUp.verifications?.emailAddress?.status === 'verified') {
          toast('Email is already verified. Please set your credentials.', 'info');
          switchAdminSubView('credentials');
          return;
        }

        // Email OTP code was already prepared/sent; transition to OTP input directly
        const targetEl = document.getElementById('adminOtpTargetEmail');
        if (targetEl) targetEl.textContent = maskEmail(email);

        switchAdminSubView('otp');
        toast('A verification code was previously sent. Please check your inbox.', 'info');
        return;
      }

      // Step 3: Initiate new Sign-Up attempt via Clerk
      let signUpAttempt;
      try {
        signUpAttempt = await window.Clerk.client.signUp.create({
          emailAddress: email
        });
      } catch (createErr) {
        const parsed = parseClerkError(createErr);

        // Account already exists in Clerk
        if (parsed.code === 'form_identifier_exists') {
          showPortalAlert('An account already exists for this email. Please sign in with your password, or use password recovery.', 'info');
          switchAdminSubView('login');
          return;
        }

        // Rate limit reached on sign-up creation
        if (isRateLimitError(createErr)) {
          if (existingSignUp && existingSignUp.emailAddress && existingSignUp.emailAddress.toLowerCase() === email) {
            state.pendingSignUp = existingSignUp;
            const targetEl = document.getElementById('adminOtpTargetEmail');
            if (targetEl) targetEl.textContent = maskEmail(email);
            switchAdminSubView('otp');
            toast('A verification code was already dispatched. Please check your inbox.', 'info');
            startResendTimer('adminResendOtpBtn', 'adminResendOtpTimer', 120);
            return;
          }
          showPortalAlert('Too many requests. Please wait a few moments before trying again.', 'warning');
          return;
        }

        throw createErr;
      }

      state.pendingSignUp = signUpAttempt;

      // Step 4: Dispatch OTP Verification Code
      try {
        await signUpAttempt.prepareEmailAddressVerification({ strategy: 'email_code' });
        const targetEl = document.getElementById('adminOtpTargetEmail');
        if (targetEl) targetEl.textContent = maskEmail(email);

        switchAdminSubView('otp');
        toast('Verification code sent. Please check your email.', 'info');
      } catch (prepareErr) {
        if (isRateLimitError(prepareErr)) {
          // If code was already sent earlier in the window, allow entering it
          const targetEl = document.getElementById('adminOtpTargetEmail');
          if (targetEl) targetEl.textContent = maskEmail(email);
          switchAdminSubView('otp');
          toast('A verification code was already sent earlier. Please enter that code.', 'warning');
          startResendTimer('adminResendOtpBtn', 'adminResendOtpTimer', 120);
        } else {
          throw prepareErr;
        }
      }

    } catch (err) {
      console.error('Admin Activation Error:', err);
      const parsed = parseClerkError(err);
      showPortalAlert(parsed.longMessage || parsed.message || 'Error initiating admin activation.', 'error');
    } finally {
      state.isRequestInFlight = false;
      setBtnLoading(submitBtn, false);
    }
  }

  // Admin OTP Verification Handler
  async function handleAdminOtpSubmit() {
    if (state.isRequestInFlight) return;
    showPortalAlert('');

    const code = getOtpCode('adminOtpInputsContainer');
    const submitBtn = document.getElementById('adminVerifyOtpBtn');

    if (code.length !== 6) {
      showPortalAlert('Please enter the 6-digit verification code.', 'error');
      return;
    }

    const attempt = state.pendingSignUp || window.Clerk?.client?.signUp;
    if (!attempt) {
      showPortalAlert('Activation session expired. Please start again.', 'error');
      switchAdminSubView('activate');
      return;
    }

    state.isRequestInFlight = true;
    setBtnLoading(submitBtn, true, 'Verifying Security Code...');

    try {
      const verifiedSignUp = await attempt.attemptEmailAddressVerification({ code });

      if (verifiedSignUp.verifications?.emailAddress?.status === 'verified') {
        state.pendingSignUp = verifiedSignUp;
        switchAdminSubView('credentials');
        toast('Email verified! Now choose your permanent administrator credentials.', 'success');
      } else {
        showPortalAlert(`Verification status: ${verifiedSignUp.status}`, 'warning');
      }
    } catch (err) {
      console.error('Admin OTP Verification Error:', err);
      const parsed = parseClerkError(err);
      if (parsed.code === 'verification_already_verified') {
        switchAdminSubView('credentials');
        toast('Email already verified. Please set your credentials.', 'info');
      } else if (parsed.code === 'verification_expired') {
        showPortalAlert('Verification code has expired. Please request a new code.', 'error');
        clearOtpInputs('adminOtpInputsContainer');
      } else {
        showPortalAlert(parsed.longMessage || parsed.message || 'Invalid verification code. Please check your email.', 'error');
        clearOtpInputs('adminOtpInputsContainer');
      }
    } finally {
      state.isRequestInFlight = false;
      setBtnLoading(submitBtn, false);
    }
  }

  // Admin Resend OTP Handler
  async function handleAdminResendOtp() {
    if (state.isRequestInFlight || state.resendCooldown > 0) return;
    const attempt = state.pendingSignUp || window.Clerk?.client?.signUp;
    if (!attempt) return;

    state.isRequestInFlight = true;
    try {
      await attempt.prepareEmailAddressVerification({ strategy: 'email_code' });
      toast('Verification code sent. Please check your email.', 'info');
      startResendTimer('adminResendOtpBtn', 'adminResendOtpTimer', 60);
    } catch (err) {
      console.error('Resend OTP Error:', err);
      if (isRateLimitError(err)) {
        toast('Too many requests. Please wait before requesting another code.', 'warning');
        startResendTimer('adminResendOtpBtn', 'adminResendOtpTimer', 120);
      } else {
        const parsed = parseClerkError(err);
        toast(parsed.message || 'Failed to resend code.', 'error');
      }
    } finally {
      state.isRequestInFlight = false;
    }
  }

  // Admin Permanent Credentials Setup Submit
  async function handleAdminCredentialsSubmit(e) {
    e.preventDefault();
    if (state.isRequestInFlight) return;
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

    state.isRequestInFlight = true;
    setBtnLoading(submitBtn, true, 'Activating Administrator Account...');

    try {
      const attempt = state.pendingSignUp || window.Clerk?.client?.signUp;
      if (!attempt) {
        throw new Error('Sign-up attempt not found. Please restart the activation process.');
      }

      const nameParts = fullName.split(/\s+/);
      const firstName = nameParts[0] || fullName;
      const lastName = nameParts.slice(1).join(' ') || '';

      // Update in-progress sign-up with username, password, and name
      const completedSignUp = await attempt.update({
        username,
        password,
        firstName,
        lastName
      });

      if (completedSignUp.status !== 'complete') {
        throw new Error(`Sign-up requirements incomplete (Status: ${completedSignUp.status}). Missing: ${completedSignUp.missingFields?.join(', ')}`);
      }

      // Finalize and activate Clerk session
      await window.Clerk.setActive({ session: completedSignUp.createdSessionId });

      const clerkUserId = completedSignUp.createdUserId || window.Clerk?.user?.id;

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
      toast('Administrator account successfully activated! Welcome to Whiz Studio.', 'success');
      openAdminDashboard();
    } catch (err) {
      console.error('Admin Final Activation Error:', err);
      const parsed = parseClerkError(err);
      showPortalAlert(parsed.longMessage || parsed.message || 'Error finalizing admin account.', 'error');
    } finally {
      state.isRequestInFlight = false;
      setBtnLoading(submitBtn, false);
    }
  }

  // Admin Forgot Password - Step 1: Send Code
  async function handleAdminForgotSendCode(e) {
    e.preventDefault();
    if (state.isRequestInFlight) return;
    showPortalAlert('');

    const form = e.target;
    const identifier = (form.email.value || '').trim().toLowerCase();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!identifier) {
      showPortalAlert('Please enter your administrator email address.', 'error');
      return;
    }

    state.isRequestInFlight = true;
    setBtnLoading(submitBtn, true, 'Sending Reset Code...');

    try {
      const signInAttempt = await window.Clerk.client.signIn.create({
        strategy: 'reset_password_email_code',
        identifier
      });
      state.pendingSignIn = signInAttempt;

      document.getElementById('adminForgotStep1').classList.add('hidden');
      document.getElementById('adminForgotStep2').classList.remove('hidden');
      toast('Verification code sent. Please check your email.', 'info');
    } catch (err) {
      console.error('Admin Forgot Password Error:', err);
      const parsed = parseClerkError(err);
      showPortalAlert(parsed.longMessage || parsed.message || 'Could not send reset code.', 'error');
    } finally {
      state.isRequestInFlight = false;
      setBtnLoading(submitBtn, false);
    }
  }

  // Admin Forgot Password - Step 2: Reset with Code
  async function handleAdminForgotReset(e) {
    e.preventDefault();
    if (state.isRequestInFlight) return;
    showPortalAlert('');

    const form = e.target;
    const code = (form.code.value || '').trim();
    const newPassword = form.newPassword.value;
    const confirmNewPassword = form.confirmNewPassword.value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!code || !newPassword) {
      showPortalAlert('Please enter the verification code and your new password.', 'error');
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

    state.isRequestInFlight = true;
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
        openAdminDashboard();
      } else {
        showPortalAlert(`Status: ${result.status}`, 'warning');
      }
    } catch (err) {
      console.error('Admin Password Reset Error:', err);
      const parsed = parseClerkError(err);
      showPortalAlert(parsed.longMessage || parsed.message || 'Invalid code or password.', 'error');
    } finally {
      state.isRequestInFlight = false;
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
    const tabs = ['overview', 'profile', 'services', 'finance', 'support', 'settings'];
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

    const nameEls = document.querySelectorAll('.client-display-name');
    nameEls.forEach(el => el.textContent = name);
    const emailEls = document.querySelectorAll('.client-display-email');
    emailEls.forEach(el => el.textContent = email);

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

      const createdEl = document.getElementById('clientAccountCreatedDate');
      if (createdEl && u.createdAt) {
        createdEl.textContent = new Date(u.createdAt).toLocaleDateString();
      }
    }
  }

  async function handleClientProfileSave(e) {
    e.preventDefault();
    if (state.isRequestInFlight) return;
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    state.isRequestInFlight = true;
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

    state.isRequestInFlight = false;
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
    if (state.isRequestInFlight) return;
    const form = e.target;
    const subject = (form.subject.value || '').trim();
    const message = (form.message.value || '').trim();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!subject || !message) {
      toast('Please enter both subject and message.', 'error');
      return;
    }

    state.isRequestInFlight = true;
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

    state.isRequestInFlight = false;
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
    window.location.href = '/admin/dashboard';
  }

  function switchAdminDashboardTab(tabName) {
    const tabs = ['overview', 'clients', 'team', 'support', 'settings'];
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
    else if (tabName === 'settings') initAdminSecuritySettings();
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
      if (state.userRole === 'super_admin') {
        badgeEl.textContent = 'Super Admin';
        badgeEl.className = 'text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40';
      } else {
        badgeEl.textContent = 'Admin';
        badgeEl.className = 'text-[10px] font-extrabold uppercase tracking-wider text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700';
      }
    }

    const teamTabBtn = document.getElementById('adminTabBtn_team');
    if (teamTabBtn) {
      if (state.userRole === 'super_admin') teamTabBtn.classList.remove('hidden');
      else teamTabBtn.classList.add('hidden');
    }

    const res = await apiFetch('/admin/stats');
    if (res.ok && res.data && res.data.data) {
      const stats = res.data.data;
      const elClients = document.getElementById('adminStatClients');
      const elAdmins = document.getElementById('adminStatAdmins');
      const elTickets = document.getElementById('adminStatTickets');

      if (elClients) elClients.textContent = stats.totalClients;
      if (elAdmins) elAdmins.textContent = stats.totalAdmins;
      if (elTickets) elTickets.textContent = stats.openSupportRequests;

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

  async function loadAdminTeam() {
    const adminListContainer = document.getElementById('adminTeamTableBody');
    if (!adminListContainer) return;

    adminListContainer.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-xs text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading administrators...</td></tr>';

    const res = await apiFetch('/admin/team');
    if (res.ok && res.data && res.data.data) {
      const { admins } = res.data.data;

      if (!admins.length) {
        adminListContainer.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-xs text-slate-400">No administrators found.</td></tr>';
      } else {
        adminListContainer.innerHTML = admins.map(a => {
          const isSuperAdmin = a.role === 'super_admin';
          return `
            <tr class="border-b border-slate-700/30 hover:bg-slate-800/40 transition-colors text-xs text-slate-300">
              <td class="py-3 px-4 font-semibold text-white">
                ${escapeHtml(a.full_name || 'Admin')}
                ${isSuperAdmin ? '<span class="ml-2 text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">SUPER ADMIN</span>' : ''}
              </td>
              <td class="py-3 px-4">${escapeHtml(a.approved_email)}</td>
              <td class="py-3 px-4"><span class="capitalize">${a.role}</span></td>
              <td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${a.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950 text-amber-400 border border-amber-500/30'}">${a.status}</span></td>
              <td class="py-3 px-4 text-right space-x-2">
                ${!isSuperAdmin ? `
                  <button type="button" class="btn-change-admin-email text-[11px] text-blue-400 hover:text-blue-300 underline cursor-pointer" data-id="${a.id}" data-email="${a.approved_email}">Change Email</button>
                  <button type="button" class="btn-revoke-admin text-[11px] text-rose-400 hover:text-rose-300 underline cursor-pointer" data-id="${a.id}" data-email="${a.approved_email}">Revoke</button>
                ` : '<span class="text-slate-500 text-[10px]">Protected Super Admin</span>'}
              </td>
            </tr>
          `;
        }).join('');

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

  async function handleInviteAdmin(e) {
    e.preventDefault();
    if (state.isRequestInFlight) return;
    const form = e.target;
    const fullName = (form.fullName.value || '').trim();
    const email = (form.email.value || '').trim().toLowerCase();
    const role = form.role.value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!fullName || !email) {
      toast('Please enter name and email.', 'error');
      return;
    }

    state.isRequestInFlight = true;
    setBtnLoading(submitBtn, true, 'Creating Invitation...');

    const res = await apiFetch('/admin/team/invite', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, role })
    });

    state.isRequestInFlight = false;
    setBtnLoading(submitBtn, false);

    if (res.ok && res.data && res.data.success) {
      toast(`Admin invited! ${email} can now activate their account.`, 'success');
      form.reset();
      loadAdminTeam();
    } else {
      toast(res.data?.error || 'Failed to create admin invitation.', 'error');
    }
  }

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

  // Admin Security / Task 1 Authenticated Password Change
  function initAdminSecuritySettings() {}

  async function handleAdminPasswordChange(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (state.isRequestInFlight) return;

    const form = e.target || document.getElementById('adminChangePasswordForm');
    if (!form) return;

    const currentPassword = (form.currentPassword ? form.currentPassword.value : '').trim();
    const newPassword = (form.newPassword ? form.newPassword.value : '').trim();
    const confirmPassword = (form.confirmPassword ? form.confirmPassword.value : '').trim();
    const submitBtn = form.querySelector('button[type="submit"]') || document.getElementById('adminUpdatePasswordBtn');

    if (!currentPassword) {
      toast('Please enter your current password.', 'error');
      return;
    }
    if (!newPassword) {
      toast('Please enter your new password.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      toast('New password must be at least 8 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('New password and confirm password do not match.', 'error');
      return;
    }
    if (currentPassword === newPassword) {
      toast('New password cannot be the same as your current password.', 'warning');
      return;
    }

    state.isRequestInFlight = true;
    if (submitBtn) setBtnLoading(submitBtn, true, 'Updating Password...');

    try {
      const user = window.Clerk?.user || state.currentUser;
      if (!user) {
        throw new Error('No authenticated user session found. Please sign in again.');
      }

      await user.updatePassword({
        currentPassword,
        newPassword,
        signOutOfOtherSessions: true
      });

      toast('Password updated successfully! Other sessions have been signed out.', 'success');
      form.reset();
    } catch (err) {
      console.error('Password Update Error:', err);
      const parsed = parseClerkError(err);
      toast(parsed.longMessage || parsed.message || 'Failed to update password. Check your current password.', 'error');
    } finally {
      state.isRequestInFlight = false;
      if (submitBtn) setBtnLoading(submitBtn, false);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

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

  // Global Event Binding (Attaches handlers ONCE)
  function bindEvents() {
    ['myAccountNavBtn', 'myAccountMobileNavBtn'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          openUserDashboard();
        });
      }
    });

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

    document.querySelectorAll('.btn-portal-signout').forEach(btn => {
      btn.addEventListener('click', handleSignOut);
    });

    const tabClient = document.getElementById('tabClientBtn');
    const tabAdmin = document.getElementById('tabAdminBtn');
    if (tabClient) tabClient.addEventListener('click', () => switchPortalTab('client'));
    if (tabAdmin) tabAdmin.addEventListener('click', () => switchPortalTab('admin'));

    const toRegisterBtn = document.getElementById('toRegisterBtn');
    const toLoginBtn = document.getElementById('toLoginBtn');
    const clientForgotBtn = document.getElementById('clientForgotBtn');
    const clientForgotBackBtn = document.getElementById('clientForgotBackBtn');

    if (toRegisterBtn) toRegisterBtn.addEventListener('click', () => switchClientSubView('register'));
    if (toLoginBtn) toLoginBtn.addEventListener('click', () => switchClientSubView('login'));
    if (clientForgotBtn) clientForgotBtn.addEventListener('click', () => switchClientSubView('forgot'));
    if (clientForgotBackBtn) clientForgotBackBtn.addEventListener('click', () => switchClientSubView('login'));

    const toAdminActivateBtn = document.getElementById('toAdminActivateBtn');
    const adminActivateBackBtn = document.getElementById('adminActivateBackBtn');
    const adminForgotBtn = document.getElementById('adminForgotBtn');
    const adminForgotBackBtn = document.getElementById('adminForgotBackBtn');

    if (toAdminActivateBtn) toAdminActivateBtn.addEventListener('click', () => switchAdminSubView('activate'));
    if (adminActivateBackBtn) adminActivateBackBtn.addEventListener('click', () => switchAdminSubView('login'));
    if (adminForgotBtn) adminForgotBtn.addEventListener('click', () => switchAdminSubView('forgot'));
    if (adminForgotBackBtn) adminForgotBackBtn.addEventListener('click', () => switchAdminSubView('login'));

    // Form Submissions
    // Google OAuth Listeners
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) googleLoginBtn.addEventListener('click', handleGoogleOAuth);

    const googleRegisterBtn = document.getElementById('googleRegisterBtn');
    if (googleRegisterBtn) googleRegisterBtn.addEventListener('click', handleGoogleOAuth);

    document.querySelectorAll('.google-auth-btn').forEach(btn => {
      btn.addEventListener('click', handleGoogleOAuth);
    });

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

    const adminForgotForm1 = document.getElementById('adminForgotStep1');
    if (adminForgotForm1) adminForgotForm1.addEventListener('submit', handleAdminForgotSendCode);

    const adminForgotForm2 = document.getElementById('adminForgotStep2');
    if (adminForgotForm2) adminForgotForm2.addEventListener('submit', handleAdminForgotReset);

    // Admin 2FA Listeners
    const adminVerify2faBtn = document.getElementById('adminVerify2faBtn');
    if (adminVerify2faBtn) adminVerify2faBtn.addEventListener('click', handleAdmin2faSubmit);

    const adminResend2faBtn = document.getElementById('adminResend2faBtn');
    if (adminResend2faBtn) adminResend2faBtn.addEventListener('click', handleAdminResend2fa);

    const admin2faBackBtn = document.getElementById('admin2faBackBtn');
    if (admin2faBackBtn) admin2faBackBtn.addEventListener('click', () => {
      state.pendingSignIn = null;
      switchAdminSubView('login');
    });

    bindOtpInputEvents('admin2faInputsContainer', () => {
      handleAdmin2faSubmit();
    });

    // Client 2FA Listeners
    const clientVerify2faBtn = document.getElementById('clientVerify2faBtn');
    if (clientVerify2faBtn) clientVerify2faBtn.addEventListener('click', handleClient2faSubmit);

    const clientResend2faBtn = document.getElementById('clientResend2faBtn');
    if (clientResend2faBtn) clientResend2faBtn.addEventListener('click', handleClientResend2fa);

    const client2faBackBtn = document.getElementById('client2faBackBtn');
    if (client2faBackBtn) client2faBackBtn.addEventListener('click', () => {
      state.pendingSignIn = null;
      switchClientSubView('login');
    });

    bindOtpInputEvents('client2faInputsContainer', () => {
      handleClient2faSubmit();
    });

    // Bind OTP Inputs ONCE
    bindOtpInputEvents('clientOtpInputsContainer', () => {
      handleClientOtpSubmit();
    });

    bindOtpInputEvents('adminOtpInputsContainer', () => {
      handleAdminOtpSubmit();
    });

    // Client Dashboard Tabs
    ['overview', 'profile', 'services', 'finance', 'support', 'settings'].forEach(tab => {
      const btn = document.getElementById(`clientTabBtn_${tab}`);
      if (btn) btn.addEventListener('click', () => switchClientDashboardTab(tab));
    });

    const clientProfileForm = document.getElementById('clientProfileForm');
    if (clientProfileForm) clientProfileForm.addEventListener('submit', handleClientProfileSave);

    const clientSupportForm = document.getElementById('clientSupportForm');
    if (clientSupportForm) clientSupportForm.addEventListener('submit', handleClientSupportSubmit);

    // Admin Dashboard Tabs
    ['overview', 'clients', 'team', 'support', 'settings'].forEach(tab => {
      const btn = document.getElementById(`adminTabBtn_${tab}`);
      if (btn) btn.addEventListener('click', () => switchAdminDashboardTab(tab));
    });

    const adminChangePasswordForm = document.getElementById('adminChangePasswordForm');
    if (adminChangePasswordForm) adminChangePasswordForm.addEventListener('submit', handleAdminPasswordChange);

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

    const adminInviteForm = document.getElementById('adminInviteForm');
    if (adminInviteForm) adminInviteForm.addEventListener('submit', handleInviteAdmin);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.currentModal) {
        closeModal(state.currentModal);
      }
    });

    // Global Click Delegation ensures all modal, tab, and subview triggers respond instantly
    document.addEventListener('click', (e) => {
      // 1. My Account Nav triggers
      if (e.target.closest('#myAccountNavBtn, #myAccountMobileNavBtn')) {
        e.preventDefault();
        openUserDashboard();
        return;
      }

      // 2. Modal Close triggers
      if (e.target.closest('#accountModalCloseBtn, #accountModalBackdrop')) {
        e.preventDefault();
        closeModal('accountPortalModal');
        return;
      }
      if (e.target.closest('#clientDashboardCloseBtn, #clientDashboardBackdrop')) {
        e.preventDefault();
        closeModal('clientDashboardModal');
        return;
      }
      if (e.target.closest('#adminDashboardCloseBtn, #adminDashboardBackdrop')) {
        e.preventDefault();
        closeModal('adminDashboardModal');
        return;
      }

      // 3. Tab triggers
      if (e.target.closest('#tabClientBtn')) {
        e.preventDefault();
        switchPortalTab('client');
        return;
      }
      if (e.target.closest('#tabAdminBtn')) {
        e.preventDefault();
        switchPortalTab('admin');
        return;
      }

      // 4. Admin Subview triggers
      if (e.target.closest('#toAdminActivateBtn, [data-action="to-admin-activate"]')) {
        e.preventDefault();
        switchAdminSubView('activate');
        return;
      }
      if (e.target.closest('#adminActivateBackBtn, [data-action="to-admin-login"]')) {
        e.preventDefault();
        switchAdminSubView('login');
        return;
      }
      if (e.target.closest('#adminForgotBtn, [data-action="to-admin-forgot"]')) {
        e.preventDefault();
        switchAdminSubView('forgot');
        return;
      }
      if (e.target.closest('#adminForgotBackBtn, #admin2faBackBtn')) {
        e.preventDefault();
        state.pendingSignIn = null;
        switchAdminSubView('login');
        return;
      }
      if (e.target.closest('#client2faBackBtn')) {
        e.preventDefault();
        state.pendingSignIn = null;
        switchClientSubView('login');
        return;
      }

      // 5. Client Subview triggers
      if (e.target.closest('#toRegisterBtn, [data-action="to-client-register"]')) {
        e.preventDefault();
        switchClientSubView('register');
        return;
      }
      if (e.target.closest('#toLoginBtn, [data-action="to-client-login"]')) {
        e.preventDefault();
        switchClientSubView('login');
        return;
      }
      if (e.target.closest('#clientForgotBtn, [data-action="to-client-forgot"]')) {
        e.preventDefault();
        switchClientSubView('forgot');
        return;
      }
      if (e.target.closest('#clientForgotBackBtn')) {
        e.preventDefault();
        switchClientSubView('login');
        return;
      }

      // 6. Sign out buttons
      if (e.target.closest('.btn-portal-signout')) {
        e.preventDefault();
        handleSignOut();
        return;
      }
    });

    setupPasswordToggles();
  }

  // Clerk SDK Initialization
  async function initClerk() {
    if (!window.Clerk) {
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        if (window.Clerk) {
          clearInterval(interval);
          await bootstrapClerk();
        } else if (attempts > 100) {
          clearInterval(interval);
          console.error('Failed to load Clerk SDK.');
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

      window.Clerk.addListener(({ user }) => {
        syncAuthState();
      });

      await syncAuthState();

      // Check if returning from Google OAuth redirect or redirected for login
      const url = new URL(window.location.href);
      const isOAuthReturn = url.searchParams.get('auth_redirect') === 'true' || 
                            url.searchParams.has('__clerk_status') ||
                            url.searchParams.has('__clerk_created_session') ||
                            window.location.hash.includes('__clerk');

      if (isOAuthReturn) {
        try {
          if (typeof window.Clerk.handleRedirectCallback === 'function') {
            await window.Clerk.handleRedirectCallback();
          }
        } catch (cbErr) {
          console.warn('OAuth redirect callback notice:', cbErr);
        }
        url.searchParams.delete('auth_redirect');
        url.searchParams.delete('__clerk_status');
        url.searchParams.delete('__clerk_created_session');
        window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
        if (window.Clerk.user) {
          await routeAuthenticatedUser('Google authentication verified successfully!');
        }
      } else if (url.searchParams.has('login') && !window.Clerk.user) {
        openModal('accountPortalModal');
      }
    } catch (err) {
      console.error('Clerk Initialization Error:', err);
    }
  }

  // Resilient Lifecycle Initialization
  function init() {
    bindEvents();
    initClerk();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
