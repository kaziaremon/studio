/**
 * WHIZ STUDIO - MY ACCOUNT PORTAL CONTROLLER (CLIENT & ADMIN DUAL-PORTAL)
 * Technology: Vanilla JavaScript, GSAP 3.12+, Tailwind CSS
 * Domain: whizstudio.art | Brand: Whiz Studio
 * 
 * Strict Frontend-Only UI Architecture:
 * - Tab switching between Client and Admin interfaces
 * - Sub-view switching between Client Login and Client Registration
 * - Password visibility toggling with accessible ARIA management
 * - Client-side validation (required fields, email format, password matching)
 * - Temporary informational dispatch ("Account services are not connected yet.")
 * - Background scroll locking & smooth GSAP modal transitions
 * - Accessible keyboard navigation (Escape key & modal focus retention)
 */

(function () {
  'use strict';

  // State Management
  const state = {
    isOpen: false,
    activeTab: 'client', // 'client' | 'admin'
    clientView: 'login', // 'login' | 'register'
    lastFocusedElement: null
  };

  // DOM Elements Cache
  let elements = {};

  function initElements() {
    elements = {
      modal: document.getElementById('accountPortalModal'),
      backdrop: document.getElementById('accountModalBackdrop'),
      content: document.getElementById('accountModalContent'),
      closeBtn: document.getElementById('accountModalCloseBtn'),
      
      // Header elements
      headerIcon: document.getElementById('accountPortalHeaderIcon'),
      headerBadge: document.getElementById('accountPortalHeaderBadge'),

      // Tabs
      tabClientBtn: document.getElementById('tabClientBtn'),
      tabAdminBtn: document.getElementById('tabAdminBtn'),

      // Containers
      clientViewContainer: document.getElementById('clientViewContainer'),
      adminViewContainer: document.getElementById('adminViewContainer'),
      clientLoginView: document.getElementById('clientLoginView'),
      clientRegisterView: document.getElementById('clientRegisterView'),

      // Forms
      clientLoginForm: document.getElementById('clientLoginForm'),
      clientRegisterForm: document.getElementById('clientRegisterForm'),
      adminLoginForm: document.getElementById('adminLoginForm'),

      // Navigation & Switching buttons
      toRegisterBtn: document.getElementById('toRegisterBtn'),
      toLoginBtn: document.getElementById('toLoginBtn'),

      // Alert container
      alertBox: document.getElementById('accountPortalAlert'),

      // Desktop & Mobile Nav Openers
      desktopNavBtn: document.getElementById('myAccountNavBtn'),
      mobileNavBtn: document.getElementById('myAccountMobileNavBtn')
    };
  }

  /**
   * Helper: Show Toast notification safely
   */
  function triggerToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    }
  }

  /**
   * Helper: Email Validator
   */
  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  /**
   * Helper: Display Inline Alert in Modal
   */
  function showAlert(message, type = 'info') {
    if (!elements.alertBox) return;

    elements.alertBox.classList.remove('hidden');

    const styles = {
      info: 'bg-emerald-50/90 text-emerald-950 border-emerald-300 shadow-xs',
      error: 'bg-rose-50/90 text-rose-950 border-rose-300 shadow-xs',
      warning: 'bg-amber-50/90 text-amber-950 border-amber-300 shadow-xs'
    };

    const iconMap = {
      info: 'fa-circle-info text-brand-whiz',
      error: 'fa-triangle-exclamation text-rose-600',
      warning: 'fa-circle-exclamation text-amber-600'
    };

    elements.alertBox.className = `mb-4 p-3.5 rounded-xl text-xs font-semibold border flex items-start space-x-2.5 transition-all duration-200 ${styles[type] || styles.info}`;
    elements.alertBox.innerHTML = `
      <i class="fa-solid ${iconMap[type] || iconMap.info} text-sm mt-0.5 shrink-0"></i>
      <div class="flex-1 leading-relaxed">${escapeHtml(message)}</div>
    `;

    if (window.gsap) {
      gsap.fromTo(elements.alertBox, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
    }
  }

  /**
   * Helper: Clear Inline Alert
   */
  function clearAlert() {
    if (elements.alertBox) {
      elements.alertBox.classList.add('hidden');
      elements.alertBox.innerHTML = '';
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Switch Active Tab (Client vs Admin)
   */
  function switchTab(tab) {
    if (tab !== 'client' && tab !== 'admin') return;
    state.activeTab = tab;
    clearAlert();

    const isClient = tab === 'client';

    // Update Tab Buttons UI
    if (elements.tabClientBtn && elements.tabAdminBtn) {
      if (isClient) {
        elements.tabClientBtn.className = 'account-tab-btn flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 bg-white text-slate-900 shadow-sm border border-slate-200/80 cursor-pointer';
        elements.tabClientBtn.setAttribute('aria-selected', 'true');

        elements.tabAdminBtn.className = 'account-tab-btn flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent cursor-pointer';
        elements.tabAdminBtn.setAttribute('aria-selected', 'false');
      } else {
        elements.tabAdminBtn.className = 'account-tab-btn flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 bg-white text-slate-900 shadow-sm border border-slate-200/80 cursor-pointer';
        elements.tabAdminBtn.setAttribute('aria-selected', 'true');

        elements.tabClientBtn.className = 'account-tab-btn flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent cursor-pointer';
        elements.tabClientBtn.setAttribute('aria-selected', 'false');
      }
    }

    // Update Header Badge and Icon
    if (elements.headerBadge && elements.headerIcon) {
      if (isClient) {
        elements.headerBadge.textContent = 'Client Portal';
        elements.headerBadge.className = 'text-[11px] font-extrabold uppercase tracking-wider text-emerald-950 bg-emerald-100/90 px-3 py-0.5 rounded-full border border-emerald-300/80';
        elements.headerIcon.className = 'fa-solid fa-circle-user text-sm text-brand-whiz';
      } else {
        elements.headerBadge.textContent = 'Admin Portal';
        elements.headerBadge.className = 'text-[11px] font-extrabold uppercase tracking-wider text-slate-900 bg-slate-200 px-3 py-0.5 rounded-full border border-slate-300';
        elements.headerIcon.className = 'fa-solid fa-shield-halved text-sm text-slate-800';
      }
    }

    // Show / Hide Containers
    if (elements.clientViewContainer && elements.adminViewContainer) {
      if (isClient) {
        elements.clientViewContainer.classList.remove('hidden');
        elements.adminViewContainer.classList.add('hidden');
        setClientView('login');
      } else {
        elements.clientViewContainer.classList.add('hidden');
        elements.adminViewContainer.classList.remove('hidden');
        if (window.gsap) {
          gsap.fromTo(elements.adminViewContainer, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
        }
        // Focus admin email
        const adminEmail = document.getElementById('adminEmail');
        if (adminEmail) adminEmail.focus();
      }
    }
  }

  /**
   * Switch between Client Login and Client Registration sub-views
   */
  function setClientView(view) {
    if (view !== 'login' && view !== 'register') return;
    state.clientView = view;
    clearAlert();

    const isLogin = view === 'login';

    if (elements.clientLoginView && elements.clientRegisterView) {
      if (isLogin) {
        elements.clientLoginView.classList.remove('hidden');
        elements.clientRegisterView.classList.add('hidden');
        if (window.gsap) {
          gsap.fromTo(elements.clientLoginView, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
        }
        const clientIdentifier = document.getElementById('clientIdentifier');
        if (clientIdentifier) clientIdentifier.focus();
      } else {
        elements.clientLoginView.classList.add('hidden');
        elements.clientRegisterView.classList.remove('hidden');
        if (window.gsap) {
          gsap.fromTo(elements.clientRegisterView, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
        }
        const clientFullName = document.getElementById('clientFullName');
        if (clientFullName) clientFullName.focus();
      }
    }
  }

  /**
   * Reset All Forms & Visibility Toggles
   */
  function resetForms() {
    if (elements.clientLoginForm) elements.clientLoginForm.reset();
    if (elements.clientRegisterForm) elements.clientRegisterForm.reset();
    if (elements.adminLoginForm) elements.adminLoginForm.reset();

    // Reset password visibility to hidden
    document.querySelectorAll('#accountPortalModal input[data-password-field="true"]').forEach((input) => {
      input.type = 'password';
      const toggleBtn = input.parentElement.querySelector('.password-toggle-btn');
      if (toggleBtn) {
        const icon = toggleBtn.querySelector('i');
        if (icon) {
          icon.className = 'fa-solid fa-eye text-slate-400 hover:text-slate-700 transition-colors';
        }
        toggleBtn.setAttribute('aria-label', 'Show password');
      }
    });

    clearAlert();
  }

  /**
   * Open Account Portal Modal
   */
  function openAccountModal(tab = 'client') {
    if (!elements.modal) initElements();
    if (!elements.modal) return;

    state.lastFocusedElement = document.activeElement;
    state.isOpen = true;

    // Reset to clean default state
    resetForms();
    switchTab(tab);

    elements.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Update ARIA
    if (elements.desktopNavBtn) elements.desktopNavBtn.setAttribute('aria-expanded', 'true');
    if (elements.mobileNavBtn) elements.mobileNavBtn.setAttribute('aria-expanded', 'true');

    // Entrance Animation
    if (window.gsap && elements.content) {
      gsap.fromTo(
        elements.content,
        { opacity: 0, scale: 0.96, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.32, ease: 'power2.out' }
      );
    }
  }

  /**
   * Close Account Portal Modal
   */
  function closeAccountModal() {
    if (!elements.modal || !state.isOpen) return;

    state.isOpen = false;

    // Update ARIA
    if (elements.desktopNavBtn) elements.desktopNavBtn.setAttribute('aria-expanded', 'false');
    if (elements.mobileNavBtn) elements.mobileNavBtn.setAttribute('aria-expanded', 'false');

    // Exit Animation
    if (window.gsap && elements.content) {
      gsap.to(elements.content, {
        opacity: 0,
        scale: 0.96,
        y: 10,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          elements.modal.classList.add('hidden');
          document.body.style.overflow = '';
          resetForms();
          if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === 'function') {
            state.lastFocusedElement.focus();
          }
        }
      });
    } else {
      elements.modal.classList.add('hidden');
      document.body.style.overflow = '';
      resetForms();
      if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === 'function') {
        state.lastFocusedElement.focus();
      }
    }
  }

  /**
   * Setup Password Visibility Controls
   */
  function setupPasswordToggles() {
    document.querySelectorAll('.password-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;

        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';

        const icon = btn.querySelector('i');
        if (icon) {
          icon.className = isPassword
            ? 'fa-solid fa-eye-slash text-brand-whiz transition-colors'
            : 'fa-solid fa-eye text-slate-400 hover:text-slate-700 transition-colors';
        }
        btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      });
    });
  }

  /**
   * Handle Client Login Submit
   */
  function handleClientLogin(e) {
    e.preventDefault();
    clearAlert();

    const identifier = document.getElementById('clientIdentifier')?.value.trim();
    const password = document.getElementById('clientPassword')?.value;

    // Validation
    if (!identifier) {
      showAlert('Please enter your username or email address.', 'error');
      document.getElementById('clientIdentifier')?.focus();
      return;
    }

    if (!password) {
      showAlert('Please enter your password.', 'error');
      document.getElementById('clientPassword')?.focus();
      return;
    }

    // Explicit Requirement: Display polished informational message
    const infoMessage = 'Account services are not connected yet.';
    showAlert(infoMessage, 'info');
    triggerToast(infoMessage, 'info');
  }

  /**
   * Handle Client Registration Submit
   */
  function handleClientRegister(e) {
    e.preventDefault();
    clearAlert();

    const fullName = document.getElementById('clientFullName')?.value.trim();
    const username = document.getElementById('clientRegUsername')?.value.trim();
    const email = document.getElementById('clientRegEmail')?.value.trim();
    const password = document.getElementById('clientRegPassword')?.value;
    const confirmPassword = document.getElementById('clientRegConfirmPassword')?.value;

    // Validation: Required fields
    if (!fullName) {
      showAlert('Please enter your full name.', 'error');
      document.getElementById('clientFullName')?.focus();
      return;
    }

    if (!username) {
      showAlert('Please choose a username.', 'error');
      document.getElementById('clientRegUsername')?.focus();
      return;
    }

    if (username.length < 3) {
      showAlert('Username must be at least 3 characters long.', 'error');
      document.getElementById('clientRegUsername')?.focus();
      return;
    }

    if (!email) {
      showAlert('Please enter your email address.', 'error');
      document.getElementById('clientRegEmail')?.focus();
      return;
    }

    if (!isValidEmail(email)) {
      showAlert('Please provide a valid email address.', 'error');
      document.getElementById('clientRegEmail')?.focus();
      return;
    }

    if (!password) {
      showAlert('Please create a password.', 'error');
      document.getElementById('clientRegPassword')?.focus();
      return;
    }

    if (password.length < 6) {
      showAlert('Password must be at least 6 characters long.', 'error');
      document.getElementById('clientRegPassword')?.focus();
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Passwords do not match. Please re-enter your password.', 'error');
      document.getElementById('clientRegConfirmPassword')?.focus();
      return;
    }

    // Explicit Requirement: Display polished informational message
    const infoMessage = 'Account services are not connected yet.';
    showAlert(infoMessage, 'info');
    triggerToast(infoMessage, 'info');
  }

  /**
   * Handle Admin Login Submit
   */
  function handleAdminLogin(e) {
    e.preventDefault();
    clearAlert();

    const email = document.getElementById('adminEmail')?.value.trim();
    const password = document.getElementById('adminPassword')?.value;

    // Validation
    if (!email) {
      showAlert('Please enter your admin email address.', 'error');
      document.getElementById('adminEmail')?.focus();
      return;
    }

    if (!isValidEmail(email)) {
      showAlert('Please provide a valid admin email address.', 'error');
      document.getElementById('adminEmail')?.focus();
      return;
    }

    if (!password) {
      showAlert('Please enter your password.', 'error');
      document.getElementById('adminPassword')?.focus();
      return;
    }

    // Explicit Requirement: Display polished informational message
    const infoMessage = 'Account services are not connected yet.';
    showAlert(infoMessage, 'info');
    triggerToast(infoMessage, 'info');
  }

  /**
   * Focus Trap for Accessibility
   */
  function setupAccessibility() {
    // Escape key listener
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.isOpen) {
        closeAccountModal();
      }
    });

    // Trap focus inside modal
    if (elements.modal) {
      elements.modal.addEventListener('keydown', (e) => {
        if (!state.isOpen || e.key !== 'Tab') return;

        const focusable = elements.modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const focusableArr = Array.from(focusable).filter(
          (el) => !el.disabled && el.offsetParent !== null
        );

        if (focusableArr.length === 0) return;

        const first = focusableArr[0];
        const last = focusableArr[focusableArr.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      });
    }
  }

  /**
   * Attach All Event Listeners
   */
  function initListeners() {
    // Nav Openers
    if (elements.desktopNavBtn) {
      elements.desktopNavBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openAccountModal('client');
      });
    }

    if (elements.mobileNavBtn) {
      elements.mobileNavBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Close mobile nav drawer if open
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) mobileMenu.classList.add('hidden');
        openAccountModal('client');
      });
    }

    // Close Button & Backdrop
    if (elements.closeBtn) {
      elements.closeBtn.addEventListener('click', closeAccountModal);
    }
    if (elements.backdrop) {
      elements.backdrop.addEventListener('click', closeAccountModal);
    }

    // Tab Switching
    if (elements.tabClientBtn) {
      elements.tabClientBtn.addEventListener('click', () => switchTab('client'));
    }
    if (elements.tabAdminBtn) {
      elements.tabAdminBtn.addEventListener('click', () => switchTab('admin'));
    }

    // View Switching
    if (elements.toRegisterBtn) {
      elements.toRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        setClientView('register');
      });
    }
    if (elements.toLoginBtn) {
      elements.toLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        setClientView('login');
      });
    }

    // Form Submissions
    if (elements.clientLoginForm) {
      elements.clientLoginForm.addEventListener('submit', handleClientLogin);
    }
    if (elements.clientRegisterForm) {
      elements.clientRegisterForm.addEventListener('submit', handleClientRegister);
    }
    if (elements.adminLoginForm) {
      elements.adminLoginForm.addEventListener('submit', handleAdminLogin);
    }

    // Password Toggles
    setupPasswordToggles();

    // Focus & Keyboard
    setupAccessibility();
  }

  /**
   * Initialize on DOM Ready
   */
  function init() {
    initElements();
    initListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose clean public API for future backend services and global control
  window.AccountPortal = {
    open: openAccountModal,
    close: closeAccountModal,
    switchTab: switchTab,
    setClientView: setClientView,
    showAlert: showAlert,
    clearAlert: clearAlert
  };

  // Aliases for inline HTML onclick compatibility
  window.openAccountModal = openAccountModal;
  window.closeAccountModal = closeAccountModal;
})();

