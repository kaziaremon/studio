/**
 * WHIZ STUDIO — FULL-PAGE SUPER ADMIN DASHBOARD CONTROLLER
 * Technology: Clerk JS SDK v5/v6, Cloudflare D1 Backend API, Tailwind CSS
 * Domain: whizstudio.art/admin/dashboard | Free-Tier Architecture ($0 Cost)
 */

(function () {
  'use strict';

  const CLERK_PUBLISHABLE_KEY = 'pk_test_cG9ldGljLWxpZ2VyLTQzNTUuY2xlcmsuYWNjb3VudHMuZGV2JA';
  const API_BASE = 'https://whiz-api.kaziaremon.workers.dev/api/v1/portal';

  const state = {
    clerkLoaded: false,
    currentUser: null,
    adminProfile: null,
    activeTab: 'overview',
    isRequestInFlight: false,
    clientsCache: [],
    statsCache: null
  };

  // Toast Helper
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) {
      console.log(`[Toast ${type.toUpperCase()}]: ${message}`);
      return;
    }

    const toast = document.createElement('div');
    const colorClasses = {
      success: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200',
      error: 'bg-rose-950/90 border-rose-500/50 text-rose-200',
      warning: 'bg-amber-950/90 border-amber-500/50 text-amber-200',
      info: 'bg-slate-900/90 border-slate-700/80 text-slate-200'
    };
    const iconClasses = {
      success: 'fa-circle-check text-emerald-400',
      error: 'fa-circle-exclamation text-rose-400',
      warning: 'fa-triangle-exclamation text-amber-400',
      info: 'fa-circle-info text-blue-400'
    };

    toast.className = `flex items-center space-x-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl text-xs font-semibold transition-all duration-300 transform translate-y-2 opacity-0 ${colorClasses[type] || colorClasses.info}`;
    toast.innerHTML = `
      <i class="fa-solid ${iconClasses[type] || iconClasses.info} text-sm shrink-0"></i>
      <span class="flex-1">${message}</span>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', '-translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Parse Clerk Error
  function parseClerkError(err) {
    if (!err) return { code: 'unknown', message: 'An unexpected error occurred.' };
    const first = (err.errors && err.errors[0]) || {};
    return {
      code: first.code || err.code || 'unknown',
      message: first.message || err.message || 'An unexpected error occurred.',
      longMessage: first.longMessage || first.message || err.message || ''
    };
  }

  // Button Loading State
  function setBtnLoading(btn, isLoading, loadingText = 'Processing...') {
    if (!btn) return;
    if (isLoading) {
      btn.disabled = true;
      btn.dataset.originalHtml = btn.innerHTML;
      btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-xs mr-2"></i><span>${loadingText}</span>`;
      btn.classList.add('opacity-60', 'cursor-not-allowed');
    } else {
      btn.disabled = false;
      if (btn.dataset.originalHtml) {
        btn.innerHTML = btn.dataset.originalHtml;
      }
      btn.classList.remove('opacity-60', 'cursor-not-allowed');
    }
  }

  // Authenticated Backend Fetch
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

  // Security Alert Helper
  function showSecurityAlert(message, type = 'error') {
    const alertBox = document.getElementById('adminSecurityAlert');
    if (!alertBox) return;

    alertBox.classList.remove('hidden');
    const colorClasses = {
      error: 'bg-rose-950/60 border-rose-500/40 text-rose-200',
      success: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200',
      warning: 'bg-amber-950/60 border-amber-500/40 text-amber-200',
      info: 'bg-blue-950/60 border-blue-500/40 text-blue-200'
    };
    const iconClasses = {
      error: 'fa-circle-exclamation text-rose-400',
      success: 'fa-circle-check text-emerald-400',
      warning: 'fa-triangle-exclamation text-amber-400',
      info: 'fa-circle-info text-blue-400'
    };

    alertBox.className = `p-4 rounded-xl text-xs font-medium border flex items-start space-x-2.5 transition-all ${colorClasses[type] || colorClasses.error}`;
    alertBox.innerHTML = `
      <i class="fa-solid ${iconClasses[type] || iconClasses.error} text-sm mt-0.5 shrink-0"></i>
      <div class="flex-1">${message}</div>
    `;
  }

  function hideSecurityAlert() {
    const alertBox = document.getElementById('adminSecurityAlert');
    if (alertBox) alertBox.classList.add('hidden');
  }

  // Password Visibility Toggle
  function initPasswordToggles() {
    document.querySelectorAll('.password-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        const icon = btn.querySelector('i');
        if (!input) return;

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

  // =========================================================================
  // TASK 1: STANDARD AUTHENTICATED PASSWORD CHANGE WORKFLOW
  // =========================================================================

  async function handleAdminPasswordChange(e) {
    e.preventDefault();
    if (state.isRequestInFlight) return;

    const form = e.target;
    const currentPassword = form.currentPassword ? form.currentPassword.value : '';
    const newPassword = form.newPassword ? form.newPassword.value : '';
    const confirmNewPassword = form.confirmNewPassword ? form.confirmNewPassword.value : '';
    const signOutOfOtherSessions = form.signOutOfOtherSessions ? form.signOutOfOtherSessions.checked : true;
    const submitBtn = form.querySelector('button[type="submit"]');

    // 1. Client-Side Validation
    if (!currentPassword) {
      showSecurityAlert('Please enter your current administrator password.', 'error');
      return;
    }
    if (!newPassword) {
      showSecurityAlert('Please enter your new permanent password.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showSecurityAlert('New password must be at least 8 characters long (15+ recommended).', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showSecurityAlert('New password and confirmation password do not match. Please re-enter carefully.', 'error');
      return;
    }
    if (currentPassword === newPassword) {
      showSecurityAlert('New password must be different from your current password.', 'warning');
      return;
    }

    state.isRequestInFlight = true;
    setBtnLoading(submitBtn, true, 'Updating Credentials...');
    hideSecurityAlert();

    try {
      const user = window.Clerk?.user;
      if (!user) {
        showSecurityAlert('No active administrator session detected. Please sign in again.', 'error');
        return;
      }

      // 2. Official Clerk JS SDK user.updatePassword call
      await user.updatePassword({
        currentPassword,
        newPassword,
        signOutOfOtherSessions
      });

      // 3. Success confirmation (ONLY after Clerk API confirms)
      showSecurityAlert('Password updated successfully! Your new permanent password is now active.', 'success');
      showToast('Password updated successfully!', 'success');

      // 4. Secure Cleanup: Immediately reset inputs (zero memory/storage retention)
      form.reset();

      // Refresh Clerk user instance
      if (typeof user.reload === 'function') {
        await user.reload().catch(() => {});
      }
    } catch (err) {
      console.error('Password Update Error:', err);
      const parsed = parseClerkError(err);

      if (parsed.code === 'form_password_incorrect') {
        showSecurityAlert('Current password is incorrect. Please verify and try again.', 'error');
      } else if (parsed.code === 'form_password_pwned') {
        showSecurityAlert('This password has been flagged in global data breaches. Please choose a more complex, high-entropy password.', 'error');
      } else if (parsed.code === 'form_password_length_too_short') {
        showSecurityAlert(parsed.longMessage || parsed.message || 'Password does not meet minimum length requirement.', 'error');
      } else if (parsed.code === 'reverification_required' || parsed.code === 'session_reverification_required') {
        showSecurityAlert('Security Check: Clerk requires session re-authentication before updating your password. Please sign out and sign back in to reverify.', 'warning');
      } else {
        showSecurityAlert(parsed.longMessage || parsed.message || 'Failed to update password. Please check your credentials.', 'error');
      }
    } finally {
      state.isRequestInFlight = false;
      setBtnLoading(submitBtn, false);
    }
  }

  // =========================================================================
  // TASK 2: FULL-PAGE SAAS ADMIN DASHBOARD CONTROLLER
  // =========================================================================

  // Tab switching
  function switchTab(tabId) {
    state.activeTab = tabId;
    window.location.hash = tabId;

    const views = {
      overview: document.getElementById('view_overview'),
      clients: document.getElementById('view_clients'),
      team: document.getElementById('view_team'),
      support: document.getElementById('view_support'),
      modules: document.getElementById('view_modules'),
      settings: document.getElementById('view_settings'),
      infra: document.getElementById('view_infra')
    };

    const breadcrumbs = {
      overview: 'Overview & KPIs',
      clients: 'Client Directory',
      team: 'Team Management',
      support: 'Support Requests',
      modules: 'Workspace Modules',
      settings: 'Account Security',
      infra: 'API & Infrastructure'
    };

    // Toggle views
    Object.keys(views).forEach(key => {
      if (views[key]) {
        if (key === tabId) views[key].classList.remove('hidden');
        else views[key].classList.add('hidden');
      }
    });

    // Update active nav button styles
    document.querySelectorAll('[data-dash-tab]').forEach(btn => {
      const target = btn.dataset.dashTab;
      if (target === tabId) {
        btn.classList.add('bg-brand-whiz/15', 'text-brand-whiz', 'border-brand-whiz/30');
        btn.classList.remove('text-slate-400', 'border-transparent', 'hover:bg-slate-800/60');
      } else {
        btn.classList.remove('bg-brand-whiz/15', 'text-brand-whiz', 'border-brand-whiz/30');
        btn.classList.add('text-slate-400', 'border-transparent', 'hover:bg-slate-800/60');
      }
    });

    // Update breadcrumb
    const bcEl = document.getElementById('currentViewBreadcrumb');
    if (bcEl) bcEl.textContent = breadcrumbs[tabId] || 'Overview';

    // Lazy load data for tab
    if (tabId === 'overview') loadOverviewStats();
    else if (tabId === 'clients') loadClientsDirectory();
    else if (tabId === 'team') loadTeamDirectory();
    else if (tabId === 'support') loadSupportTickets();

    // Close mobile drawer if open
    closeMobileDrawer();
  }

  // Load Overview KPIs & Audit Logs
  async function loadOverviewStats() {
    const res = await apiFetch('/admin/stats');
    if (!res || !res.ok) return;

    const stats = (res.data && (res.data.data || res.data)) || {};
    state.statsCache = stats;

    const clientCountEl = document.getElementById('kpiClientsCount');
    if (clientCountEl) clientCountEl.textContent = stats.totalClients || '0';

    const adminCountEl = document.getElementById('kpiAdminsCount');
    if (adminCountEl) adminCountEl.textContent = stats.activeAdmins || '1';

    const ticketCountEl = document.getElementById('kpiTicketsCount');
    if (ticketCountEl) ticketCountEl.textContent = stats.openTickets || '0';

    // Render activity feed
    const activityContainer = document.getElementById('auditActivityFeed');
    if (activityContainer && Array.isArray(stats.recentActivity)) {
      if (stats.recentActivity.length === 0) {
        activityContainer.innerHTML = `
          <div class="py-6 text-center text-xs text-slate-500">
            <i class="fa-solid fa-clock-rotate-left text-slate-600 text-lg mb-2 block"></i>
            No recent activity recorded yet.
          </div>
        `;
      } else {
        activityContainer.innerHTML = stats.recentActivity.map(item => `
          <div class="flex items-start space-x-3 py-2.5 px-3 rounded-xl hover:bg-slate-800/40 border border-transparent hover:border-slate-800 transition-all text-xs">
            <span class="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <i class="fa-solid fa-shield-halved text-[10px]"></i>
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-slate-200 font-medium truncate">${item.action || 'System Event'}</p>
              <p class="text-[11px] text-slate-500">${item.details || ''}</p>
            </div>
            <span class="text-[10px] text-slate-500 shrink-0 font-mono">${item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}</span>
          </div>
        `).join('');
      }
    }
  }

  // Load Clients
  async function loadClientsDirectory() {
    const res = await apiFetch('/admin/clients');
    if (!res || !res.ok) return;

    const clients = (res.data && (res.data.data || res.data)) || [];
    state.clientsCache = Array.isArray(clients) ? clients : [];
    renderClientsTable(state.clientsCache);
  }

  function renderClientsTable(clients) {
    const tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;

    if (!clients || clients.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="py-8 text-center text-xs text-slate-500">
            <i class="fa-solid fa-users-slash text-xl mb-2 text-slate-600 block"></i>
            No registered clients found in Cloudflare D1.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = clients.map(client => `
      <tr class="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors text-xs text-slate-300">
        <td class="py-3.5 px-4 font-semibold text-white flex items-center space-x-2.5">
          <div class="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[11px] text-brand-whiz uppercase">
            ${(client.full_name || client.fullName || 'C')[0]}
          </div>
          <span>${client.full_name || client.fullName || 'Client'}</span>
        </td>
        <td class="py-3.5 px-4 font-mono text-slate-400">${client.email || 'N/A'}</td>
        <td class="py-3.5 px-4">${client.company_name || client.company || '—'}</td>
        <td class="py-3.5 px-4">${client.country || client.location || 'Global'}</td>
        <td class="py-3.5 px-4">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">Active</span>
        </td>
      </tr>
    `).join('');
  }

  // Load Team
  async function loadTeamDirectory() {
    const res = await apiFetch('/admin/team');
    if (!res || !res.ok) return;

    const admins = (res.data && (res.data.data || res.data)) || [];
    const tbody = document.getElementById('teamTableBody');
    if (!tbody) return;

    if (!admins || admins.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="py-8 text-center text-xs text-slate-500">
            No administrator accounts found.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = admins.map(admin => `
      <tr class="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors text-xs text-slate-300">
        <td class="py-3.5 px-4 font-semibold text-white flex items-center space-x-2.5">
          <div class="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[11px] text-brand-whiz uppercase">
            ${(admin.full_name || admin.fullName || 'A')[0]}
          </div>
          <span>${admin.full_name || admin.fullName || 'Administrator'}</span>
        </td>
        <td class="py-3.5 px-4 font-mono text-slate-400">${admin.email || admin.approved_email || 'N/A'}</td>
        <td class="py-3.5 px-4">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${admin.role === 'owner' || admin.role === 'super_admin' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40' : 'bg-blue-950/80 text-blue-300 border border-blue-500/40'}">
            ${admin.role === 'owner' || admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </span>
        </td>
        <td class="py-3.5 px-4">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">Active</span>
        </td>
        <td class="py-3.5 px-4 text-right">
          ${admin.role === 'owner' ? '<span class="text-[11px] text-slate-500 font-semibold">Protected</span>' : '<button class="text-rose-400 hover:text-rose-300 font-bold hover:underline cursor-pointer">Revoke</button>'}
        </td>
      </tr>
    `).join('');
  }

  // Load Support Tickets
  async function loadSupportTickets() {
    const res = await apiFetch('/admin/support');
    if (!res || !res.ok) return;

    const tickets = (res.data && (res.data.data || res.data)) || [];
    const tbody = document.getElementById('supportTableBody');
    if (!tbody) return;

    if (!tickets || tickets.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="py-8 text-center text-xs text-slate-500">
            <i class="fa-solid fa-inbox text-xl mb-2 text-slate-600 block"></i>
            No active client support inquiries found.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = tickets.map(ticket => `
      <tr class="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors text-xs text-slate-300">
        <td class="py-3.5 px-4 font-mono text-slate-400">${ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'Recent'}</td>
        <td class="py-3.5 px-4 font-semibold text-white">${ticket.client_name || ticket.client_email || 'Client'}</td>
        <td class="py-3.5 px-4">
          <div class="font-medium text-slate-200">${ticket.subject || 'Inquiry'}</div>
          <div class="text-[11px] text-slate-500 truncate max-w-xs">${ticket.message || ''}</div>
        </td>
        <td class="py-3.5 px-4">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ticket.status === 'resolved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950 text-amber-400 border border-amber-500/30'}">${ticket.status || 'open'}</span>
        </td>
        <td class="py-3.5 px-4 text-right">
          ${ticket.status === 'resolved' ? '<span class="text-emerald-400 text-xs"><i class="fa-solid fa-check"></i> Resolved</span>' : `<button class="px-2.5 py-1 rounded-lg bg-emerald-900/50 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold cursor-pointer transition-all">Mark Resolved</button>`}
        </td>
      </tr>
    `).join('');
  }

  // Handle Authorize Admin Form
  async function handleAdminInvite(e) {
    e.preventDefault();
    if (state.isRequestInFlight) return;

    const form = e.target;
    const fullName = (form.fullName.value || '').trim();
    const email = (form.email.value || '').trim().toLowerCase();
    const role = form.role.value || 'admin';
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!fullName || !email) {
      showToast('Please fill in all administrator invitation fields.', 'warning');
      return;
    }

    state.isRequestInFlight = true;
    setBtnLoading(submitBtn, true, 'Authorizing Administrator...');

    try {
      const res = await apiFetch('/admin/team/invite', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, role })
      });

      if (res && res.ok && res.data && res.data.success) {
        showToast(`Administrator invitation created for ${email}`, 'success');
        form.reset();
        loadTeamDirectory();
      } else {
        const err = (res && res.data && res.data.error) || 'Failed to authorize administrator.';
        showToast(err, 'error');
      }
    } catch (err) {
      console.error('Invite Error:', err);
      showToast('Error authorizing administrator.', 'error');
    } finally {
      state.isRequestInFlight = false;
      setBtnLoading(submitBtn, false);
    }
  }

  // Mobile Drawer Toggle
  function openMobileDrawer() {
    const drawer = document.getElementById('mobileDrawer');
    const backdrop = document.getElementById('mobileDrawerBackdrop');
    if (drawer && backdrop) {
      drawer.classList.remove('-translate-x-full');
      backdrop.classList.remove('hidden');
    }
  }

  function closeMobileDrawer() {
    const drawer = document.getElementById('mobileDrawer');
    const backdrop = document.getElementById('mobileDrawerBackdrop');
    if (drawer && backdrop) {
      drawer.classList.add('-translate-x-full');
      backdrop.classList.add('hidden');
    }
  }

  // Sign Out Handler
  async function handleSignOut() {
    try {
      if (window.Clerk) {
        await window.Clerk.signOut();
      }
      window.location.href = '/?portal=admin';
    } catch (err) {
      console.error('Sign Out Error:', err);
      window.location.href = '/';
    }
  }

  // =========================================================================
  // AUTH GUARD & INITIALIZATION
  // =========================================================================

  async function checkAuthAndInit() {
    const authGuard = document.getElementById('dashboardAuthGuard');
    const mainLayout = document.getElementById('dashboardMainLayout');
    const deniedScreen = document.getElementById('dashboardAccessDenied');

    // Wait for Clerk
    if (!window.Clerk) {
      setTimeout(checkAuthAndInit, 100);
      return;
    }

    // Wait until Clerk is loaded
    if (!window.Clerk.loaded) {
      window.Clerk.addOnLoaded(checkAuthAndInit);
      return;
    }

    state.clerkLoaded = true;
    const user = window.Clerk.user;

    // 1. Unauthenticated -> Redirect to Login
    if (!user) {
      console.warn('[Admin Guard] Unauthenticated session. Redirecting to login.');
      window.location.href = '/?portal=admin&returnUrl=' + encodeURIComponent(window.location.pathname);
      return;
    }

    state.currentUser = user;

    // 2. Verify Role against Cloudflare D1 Backend
    const meRes = await apiFetch('/me');
    const meData = (meRes && meRes.data && (meRes.data.data || meRes.data)) || {};

    const userRole = meData.role || (user.publicMetadata && user.publicMetadata.role) || 'guest';
    const isSuperAdmin = userRole === 'owner' || userRole === 'super_admin';
    const isAdmin = isSuperAdmin || userRole === 'admin';

    // 3. Unauthorized Role -> Show Denied Screen
    if (!isAdmin) {
      console.error('[Admin Guard] Access Revoked: Insufficient privileges for user', user.id);
      if (authGuard) authGuard.classList.add('hidden');
      if (mainLayout) mainLayout.classList.add('hidden');
      if (deniedScreen) deniedScreen.classList.remove('hidden');
      return;
    }

    state.adminProfile = meData;

    // 4. Authorized -> Render Shell
    const displayName = user.fullName || user.username || meData.fullName || 'Kazi Emon';
    const email = (user.primaryEmailAddress ? user.primaryEmailAddress.emailAddress : '') || meData.email || 'kaziaremon@gmail.com';
    const username = user.username || 'kaziaremon';
    const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'SA';

    // Populate UI User Elements
    document.querySelectorAll('.admin-display-name').forEach(el => el.textContent = displayName);
    document.querySelectorAll('.admin-display-email').forEach(el => el.textContent = email);
    document.querySelectorAll('.admin-display-username').forEach(el => el.textContent = `@${username}`);
    document.querySelectorAll('.admin-display-initials').forEach(el => el.textContent = initials);

    const roleBadge = document.getElementById('adminRoleBadge');
    if (roleBadge) {
      roleBadge.textContent = isSuperAdmin ? 'Super Admin' : 'Admin';
    }

    const secUserId = document.getElementById('secClerkUserId');
    if (secUserId) secUserId.textContent = user.id;

    const secEmail = document.getElementById('secUserEmail');
    if (secEmail) secEmail.textContent = email;

    const secUsername = document.getElementById('secUsername');
    if (secUsername) secUsername.textContent = username;

    // Hide loader, show main layout
    if (authGuard) authGuard.classList.add('hidden');
    if (mainLayout) mainLayout.classList.remove('hidden');

    // Tab navigation event listeners
    document.querySelectorAll('[data-dash-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.dataset.dashTab;
        if (tab) switchTab(tab);
      });
    });

    // Mobile drawer toggles
    const mobileToggleBtn = document.getElementById('mobileMenuToggleBtn');
    if (mobileToggleBtn) mobileToggleBtn.addEventListener('click', openMobileDrawer);

    const mobileCloseBtn = document.getElementById('mobileDrawerCloseBtn');
    if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', closeMobileDrawer);

    const mobileBackdrop = document.getElementById('mobileDrawerBackdrop');
    if (mobileBackdrop) mobileBackdrop.addEventListener('click', closeMobileDrawer);

    // Sign out buttons
    document.querySelectorAll('.btn-admin-signout').forEach(btn => {
      btn.addEventListener('click', handleSignOut);
    });

    // Password change form (TASK 1)
    const changePasswordForm = document.getElementById('adminChangePasswordForm');
    if (changePasswordForm) {
      changePasswordForm.addEventListener('submit', handleAdminPasswordChange);
    }

    // Authorize Admin Form
    const inviteForm = document.getElementById('adminInviteForm');
    if (inviteForm) {
      inviteForm.addEventListener('submit', handleAdminInvite);
    }

    // Client search filter
    const clientSearchInput = document.getElementById('adminClientSearchInput');
    if (clientSearchInput) {
      clientSearchInput.addEventListener('input', (e) => {
        const query = (e.target.value || '').trim().toLowerCase();
        if (!query) {
          renderClientsTable(state.clientsCache);
          return;
        }
        const filtered = state.clientsCache.filter(c => 
          (c.full_name || '').toLowerCase().includes(query) ||
          (c.email || '').toLowerCase().includes(query) ||
          (c.company_name || '').toLowerCase().includes(query)
        );
        renderClientsTable(filtered);
      });
    }

    // Password show/hide eye toggles
    initPasswordToggles();

    // Initialize initial view from URL hash or default
    const initialHash = (window.location.hash || '').replace('#', '');
    const validTabs = ['overview', 'clients', 'team', 'support', 'modules', 'settings', 'infra'];
    const startTab = validTabs.includes(initialHash) ? initialHash : 'overview';
    switchTab(startTab);
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuthAndInit);
  } else {
    checkAuthAndInit();
  }
})();

