/**
 * WHIZ STUDIO — FULL-PAGE CLIENT DASHBOARD CONTROLLER
 * Technology: Clerk JS SDK, Cloudflare D1 Backend API, Tailwind CSS, pdf-lib
 * Route: /client/dashboard | Free-Tier Architecture ($0 Cost)
 */

(function () {
  'use strict';

  const CLERK_PUBLISHABLE_KEY = 'pk_test_cG9ldGljLWxpZ2VyLTQzNTUuY2xlcmsuYWNjb3VudHMuZGV2JA';
  const API_BASE = 'https://whiz-api.kaziaremon.workers.dev/api/v1';

  const state = {
    currentUser: null,
    clientProfile: null,
    activeTab: 'overview',
    services: [],
    tasks: [],
    invoices: []
  };

  async function apiFetch(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (window.Clerk && window.Clerk.session) {
      try {
        const token = await window.Clerk.session.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        console.warn('Could not retrieve Clerk token:', e);
      }
    }

    if (window.Clerk && window.Clerk.user) {
      headers['X-Clerk-User-Id'] = window.Clerk.user.id;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      const data = await response.json().catch(() => ({}));
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      console.error('API Fetch Error:', err);
      return { ok: false, status: 500, data: { success: false, error: 'Network connection failure.' } };
    }
  }

  function switchTab(tabId) {
    state.activeTab = tabId;
    const tabs = ['overview', 'services', 'tasks', 'finance', 'support', 'settings'];
    tabs.forEach(t => {
      const el = document.getElementById(`view_${t}`);
      if (el) {
        if (t === tabId) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });

    document.querySelectorAll('[data-client-tab]').forEach(btn => {
      const isTarget = btn.dataset.clientTab === tabId;
      if (isTarget) {
        btn.classList.add('bg-brand-whiz/15', 'text-brand-whiz', 'border-brand-whiz/30');
        btn.classList.remove('text-slate-400', 'border-transparent');
      } else {
        btn.classList.remove('bg-brand-whiz/15', 'text-brand-whiz', 'border-brand-whiz/30');
        btn.classList.add('text-slate-400', 'border-transparent');
      }
    });

    const breadcrumb = document.getElementById('breadcrumbActiveTab');
    if (breadcrumb) breadcrumb.textContent = tabId.charAt(0).toUpperCase() + tabId.slice(1);
  }

  async function loadClientData() {
    try {
      const [srvRes, projRes, finRes] = await Promise.all([
        apiFetch('/services/my-services'),
        apiFetch('/projects'),
        apiFetch('/finance/invoices')
      ]);

      if (srvRes.ok && srvRes.data && srvRes.data.data) {
        state.services = srvRes.data.data.services || [];
      }
      if (projRes.ok && projRes.data && projRes.data.data) {
        state.tasks = projRes.data.data.projects || [];
      }
      if (finRes.ok && finRes.data && finRes.data.data) {
        state.invoices = finRes.data.data.invoices || [];
      }

      renderClientOverview();
    } catch (e) {
      console.warn('Data preload notice:', e);
    }
  }

  function renderClientOverview() {
    const statActive = document.getElementById('statActiveServices');
    const statTasks = document.getElementById('statCompletedTasks');
    const statInv = document.getElementById('statInvoicesCount');

    if (statActive) statActive.textContent = state.services.length;
    if (statTasks) statTasks.textContent = state.tasks.length;
    if (statInv) statInv.textContent = state.invoices.length;

    const list = document.getElementById('overviewServicesList');
    if (!list) return;

    if (state.services.length === 0) {
      list.innerHTML = `
        <div class="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400 space-y-2">
          <i class="fa-solid fa-shapes text-2xl text-slate-600 block mb-1"></i>
          <p>No active marketing services attached to your organization yet.</p>
          <a href="/#services" class="inline-block mt-2 px-3 py-1.5 rounded-lg bg-brand-whiz/20 text-brand-whiz hover:bg-brand-whiz/30 font-semibold transition-all">
            Browse Service Catalog
          </a>
        </div>
      `;
    } else {
      list.innerHTML = state.services.map(s => `
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-9 h-9 rounded-xl bg-brand-whiz/15 text-brand-whiz flex items-center justify-center font-bold text-xs">
              <i class="fa-solid fa-bolt"></i>
            </div>
            <div>
              <h4 class="text-xs font-bold text-white">${s.serviceName || s.packageName || 'Agency Service'}</h4>
              <p class="text-[11px] text-slate-400">Status: <span class="text-emerald-400 font-semibold uppercase">${s.status || 'Active'}</span></p>
            </div>
          </div>
          <span class="text-xs font-mono font-bold text-white">$${((s.priceCents || 0) / 100).toFixed(2)}</span>
        </div>
      `).join('');
    }
  }

  async function checkAuthAndInit() {
    const authGuard = document.getElementById('clientAuthGuard');
    const mainLayout = document.getElementById('clientMainLayout');

    if (!window.Clerk) {
      setTimeout(checkAuthAndInit, 100);
      return;
    }

    try {
      if (!window.Clerk.loaded) {
        await window.Clerk.load({
          publishableKey: CLERK_PUBLISHABLE_KEY
        });
      }

      const user = window.Clerk.user;
      if (!user) {
        window.location.href = '/?login=client';
        return;
      }

      state.currentUser = user;

      const res = await apiFetch('/portal/me');
      if (res.ok && res.data && res.data.success && res.data.data) {
        state.clientProfile = res.data.data.user;
      }

      const name = state.clientProfile?.fullName || state.clientProfile?.full_name || user.fullName || user.username || 'Client';
      const email = state.clientProfile?.email || (user.primaryEmailAddress ? user.primaryEmailAddress.emailAddress : '');

      document.querySelectorAll('.client-greeting-name').forEach(el => el.textContent = name);
      const nameEl = document.getElementById('clientDisplayName');
      if (nameEl) nameEl.textContent = name;
      const emailEl = document.getElementById('clientDisplayEmail');
      if (emailEl) emailEl.textContent = email;
      const setMail = document.getElementById('settingsEmail');
      if (setMail) setMail.textContent = email;
      const setClerk = document.getElementById('settingsClerkId');
      if (setClerk) setClerk.textContent = user.id;

      const avatar = document.getElementById('userAvatarText');
      if (avatar) {
        const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CL';
        avatar.textContent = initials;
      }

      // Check if user has administrative rights
      const role = state.clientProfile?.role;
      const isSuperAdmin = state.clientProfile?.isSuperAdmin;
      if (role === 'owner' || role === 'admin' || role === 'super_admin' || isSuperAdmin) {
        const adminLink = document.getElementById('adminPortalLinkContainer');
        if (adminLink) adminLink.classList.remove('hidden');
      }

      if (authGuard) authGuard.classList.add('hidden');
      if (mainLayout) mainLayout.classList.remove('hidden');

      switchTab('overview');
      loadClientData();
    } catch (err) {
      console.error('Client Auth Guard Error:', err);
      window.location.href = '/?login=client';
    }
  }

  function init() {
    document.querySelectorAll('[data-client-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.clientTab);
      });
    });

    document.querySelectorAll('.btn-client-signout').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (window.Clerk) {
          await window.Clerk.signOut();
        }
        window.location.href = '/';
      });
    });

    checkAuthAndInit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

