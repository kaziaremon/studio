/**
 * WHIZ STUDIO — SUPER ADMIN CONSOLE JAVASCRIPT CONTROLLER (v5.0 Enterprise)
 * Technology: Clerk JS SDK, Cloudflare Workers API, Cloudflare D1 Database, pdf-lib
 * Architecture: 100% Free Plan ($0 / month) | Cloudflare Authoritative Engine
 */

(function () {
  'use strict';

  const CLERK_PUBLISHABLE_KEY = 'pk_live_Y2xlcmsud2hpenN0dWRpby5hcnQk';
  const API_BASE = 'https://whiz-api.kaziaremon.workers.dev/api/v1';

  // Global State
  
  const CURRENCY_CONFIG = {
    BDT: { symbol: '৳', name: 'Bangladeshi Taka', locale: 'bn-BD', decimals: 2 },
    USD: { symbol: '$', name: 'US Dollar', locale: 'en-US', decimals: 2 },
    GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB', decimals: 2 },
    EUR: { symbol: '€', name: 'Euro', locale: 'de-DE', decimals: 2 },
    AED: { symbol: 'AED', name: 'UAE Dirham', locale: 'ar-AE', decimals: 2 },
    SAR: { symbol: 'SAR', name: 'Saudi Riyal', locale: 'ar-SA', decimals: 2 },
    CAD: { symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA', decimals: 2 },
    AUD: { symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', decimals: 2 },
    SGD: { symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', decimals: 2 },
    INR: { symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimals: 2 },
    JPY: { symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', decimals: 0 },
    MYR: { symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY', decimals: 2 }
  };

  function formatCurrency(amountCents, currencyCode = 'USD') {
    const code = (currencyCode || 'USD').toUpperCase();
    const conf = CURRENCY_CONFIG[code] || { symbol: code, locale: 'en-US', decimals: 2 };
    const divisor = conf.decimals === 0 ? 1 : 100;
    const value = (Number(amountCents) || 0) / divisor;

    try {
      return new Intl.NumberFormat(conf.locale, {
        style: 'currency',
        currency: code,
        minimumFractionDigits: conf.decimals,
        maximumFractionDigits: conf.decimals
      }).format(value);
    } catch (e) {
      return conf.symbol + value.toFixed(conf.decimals);
    }
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const state = {
    currentUser: null,
    adminProfile: null,
    activeTab: 'overview',
    selectedClientId: null,
    selectedServiceId: null,
    clientsCache: [],
    servicesCache: [],
    projectsCache: [],
    tasksCache: [],
    usersCache: [],
    roleHistoryCache: [],
    supportCache: [],
    trustedDevicesCache: [],
    currentBlueprints: [],
    currentTaskStatus: 'all'
  };

  // =========================================================================
  // ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION ENGINE
  // =========================================================================
  function normalizeRole(role) {
    if (!role) return 'client';
    const r = String(role).trim().toLowerCase();
    if (r === 'owner' || r === 'super_admin' || r === 'superadmin') return 'super_admin';
    if (r === 'admin' || r === 'administrator') return 'admin';
    if (r === 'accountant' || r === 'accounts' || r === 'finance' || r === 'billing') return 'accountant';
    if (r === 'employee' || r === 'staff' || r === 'project_manager' || r === 'operations') return 'employee';
    return 'client';
  }

  function formatRoleName(role) {
    const norm = normalizeRole(role);
    if (norm === 'super_admin') return 'Super Admin';
    if (norm === 'admin') return 'Admin';
    if (norm === 'accountant') return 'Accountant';
    if (norm === 'employee') return 'Employee';
    return 'Client';
  }

  function isCurrentUserOwner() {
    if (!state.adminProfile) return false;
    const role = (state.adminProfile.role || '').toLowerCase();
    // Non-owner roles are NEVER elevated regardless of email or flags
    if (role === 'accountant' || role === 'accounts' || role === 'employee' || role === 'client') {
      return false;
    }
    const email = (state.adminProfile.email || '').toLowerCase();
    if (email === 'kaziaremon@gmail.com') return true;
    if (role === 'owner' || role === 'super_admin' || role === 'superadmin') return true;
    const isa = state.adminProfile.isSuperAdmin ?? state.adminProfile.is_super_admin;
    return isa === true || isa === 1 || isa === 'true' || isa === '1';
  }

  function getRoleBadgeForRole(rawRole, isOwner = false) {
    const norm = normalizeRole(rawRole);
    if ((isOwner && norm !== 'accountant' && norm !== 'employee' && norm !== 'client') || norm === 'super_admin') {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs"><i class="fa-solid fa-crown text-[9px] text-amber-500"></i> Super Admin</span>';
    } else if (norm === 'admin') {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 shadow-xs"><i class="fa-solid fa-shield-halved text-[9px]"></i> Admin</span>';
    } else if (norm === 'accountant') {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 shadow-xs"><i class="fa-solid fa-calculator text-[9px]"></i> Accountant</span>';
    } else if (norm === 'employee') {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 shadow-xs"><i class="fa-solid fa-briefcase text-[9px]"></i> Employee</span>';
    } else {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 shadow-xs"><i class="fa-solid fa-user text-[9px]"></i> Client</span>';
    }
  }

  function applyRoleAdaptiveUI(profile) {
    if (!profile) return;
    const isOwner = isCurrentUserOwner();
    const normRole = isOwner ? 'super_admin' : normalizeRole(profile.role);
    const displayRole = isOwner ? 'Super Admin' : formatRoleName(profile.role);

    // 1. Update Header Role Label
    const headerRoleEl = document.getElementById('adminHeaderRoleLabel');
    if (headerRoleEl) {
      if (normRole === 'super_admin') {
        headerRoleEl.textContent = 'Super Admin Console';
      } else if (normRole === 'admin') {
        headerRoleEl.textContent = 'Admin Workspace';
      } else if (normRole === 'accountant') {
        headerRoleEl.textContent = 'Accountant Portal';
      } else if (normRole === 'employee') {
        headerRoleEl.textContent = 'Employee Workspace';
      } else {
        headerRoleEl.textContent = 'Management Console';
      }
    }

    // 2. Update Profile & Security Badges
    const badge = document.getElementById('dropdownRoleBadge');
    const sidebarRoleBadge = document.getElementById('sidebarRoleBadge');
    const drawerRoleBadge = document.getElementById('drawerRoleBadge');
    const secRoleHeader = document.getElementById('secRoleBadgeHeader');
    const secRoleBadge = document.getElementById('secRoleBadge');

    if (sidebarRoleBadge) sidebarRoleBadge.textContent = displayRole;
    if (drawerRoleBadge) drawerRoleBadge.textContent = displayRole;
    if (secRoleHeader) {
      secRoleHeader.innerHTML = `<i class="fa-solid fa-shield-halved text-[9px]"></i> ${displayRole.toUpperCase()}`;
    }

    if (badge) {
      badge.textContent = displayRole;
      if (normRole === 'super_admin') {
        badge.className = 'font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-[#147D64] border border-emerald-200 text-[10px] uppercase';
      } else if (normRole === 'admin') {
        badge.className = 'font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] uppercase';
      } else if (normRole === 'accountant') {
        badge.className = 'font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] uppercase';
      } else if (normRole === 'employee') {
        badge.className = 'font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-[10px] uppercase';
      } else {
        badge.className = 'font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] uppercase';
      }
    }

    if (secRoleBadge) {
      secRoleBadge.innerHTML = isOwner
        ? '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-crown text-[9px] text-amber-500"></i> Founding Owner</span>'
        : getRoleBadgeForRole(profile.role, false);
    }

    // 3. Strict Navigation & UI Element RBAC Visibility Constraints
    const sidebarFinance = document.getElementById('sidebarSectionFinance');
    const drawerFinance = document.getElementById('drawerSectionFinance');
    const bottomNavFinance = document.getElementById('bottomNavFinance');
    const sidebarTeam = document.getElementById('sidebarNavTeam');
    const drawerTeam = document.getElementById('drawerNavTeam');
    const sidebarHistory = document.getElementById('sidebarNavHistory');
    const drawerHistory = document.getElementById('drawerNavHistory');

    const sidebarServices = document.getElementById('sidebarNavServices');
    const sidebarProjects = document.getElementById('sidebarNavProjects');
    const sidebarTasks = document.getElementById('sidebarNavTasks');
    const drawerServices = document.getElementById('drawerNavServices');
    const drawerProjects = document.getElementById('drawerNavProjects');
    const drawerTasks = document.getElementById('drawerNavTasks');
    const bottomNavServices = document.getElementById('bottomNavServices');
    const bottomNavTasks = document.getElementById('bottomNavTasks');

    const kpiRevenue = document.getElementById('kpiCardRevenue');
    const chartRev = document.getElementById('chartRevenueContainer');
    const kpiProjects = document.getElementById('kpiCardProjects');
    const kpiServices = document.getElementById('kpiCardServices');
    const kpiTasksComp = document.getElementById('kpiCardCompletedTasks');
    const kpiTasksPend = document.getElementById('kpiCardPendingTasks');

    const chartServices = document.getElementById('chartServiceDistributionContainer');
    const chartProjects = document.getElementById('chartProjectProgressContainer');
    const chartTasks = document.getElementById('chartTaskStatusContainer');

    const clientFinSummary = document.getElementById('clientFinancialSummaryCard');
    const clientFinPrefs = document.getElementById('clientFinancialPreferencesCard');
    const btnAssignService = document.getElementById('btnOpenAssignServiceClientModal');
    const clientAssignedServices = document.getElementById('clientAssignedServicesCard');
    const clientProjects = document.getElementById('clientProjectsCard');
    const clientAuditCard = document.getElementById('clientAuditHistoryCard');

    // Rule A: Audit & Operational History is STRICTLY PRIVATE to Admin and Super Admin
    const canAccessAudit = normRole === 'super_admin' || normRole === 'admin';
    if (sidebarHistory) sidebarHistory.classList.toggle('hidden', !canAccessAudit);
    if (drawerHistory) drawerHistory.classList.toggle('hidden', !canAccessAudit);
    if (clientAuditCard) clientAuditCard.classList.toggle('hidden', !canAccessAudit);

    // Rule B: Team Governance is restricted to Admin & Super Admin
    const canAccessTeam = normRole === 'super_admin' || normRole === 'admin';
    if (sidebarTeam) sidebarTeam.classList.toggle('hidden', !canAccessTeam);
    if (drawerTeam) drawerTeam.classList.toggle('hidden', !canAccessTeam);

    // Rule C: Accountant Dashboard Constraints (Financial-Only Mode)
    if (normRole === 'accountant') {
      // STRICTLY HIDE all Service provisioning, Task pipelines, and Project management modules
      if (sidebarServices) sidebarServices.classList.add('hidden');
      if (sidebarProjects) sidebarProjects.classList.add('hidden');
      if (sidebarTasks) sidebarTasks.classList.add('hidden');
      if (drawerServices) drawerServices.classList.add('hidden');
      if (drawerProjects) drawerProjects.classList.add('hidden');
      if (drawerTasks) drawerTasks.classList.add('hidden');
      if (bottomNavServices) bottomNavServices.classList.add('hidden');
      if (bottomNavTasks) bottomNavTasks.classList.add('hidden');

      if (kpiProjects) kpiProjects.classList.add('hidden');
      if (kpiServices) kpiServices.classList.add('hidden');
      if (kpiTasksComp) kpiTasksComp.classList.add('hidden');
      if (kpiTasksPend) kpiTasksPend.classList.add('hidden');

      if (chartServices) chartServices.classList.add('hidden');
      if (chartProjects) chartProjects.classList.add('hidden');
      if (chartTasks) chartTasks.classList.add('hidden');

      if (btnAssignService) btnAssignService.classList.add('hidden');
      if (clientProjects) clientProjects.classList.add('hidden');
      if (clientAssignedServices) clientAssignedServices.classList.add('hidden');

      // EXCLUSIVELY DISPLAY financial, billing, invoicing, and ledger modules
      if (sidebarFinance) sidebarFinance.classList.remove('hidden');
      if (drawerFinance) drawerFinance.classList.remove('hidden');
      if (bottomNavFinance) bottomNavFinance.classList.remove('hidden');
      if (kpiRevenue) kpiRevenue.classList.remove('hidden');
      if (chartRev) chartRev.classList.remove('hidden');
      if (clientFinSummary) clientFinSummary.classList.remove('hidden');
      if (clientFinPrefs) clientFinPrefs.classList.remove('hidden');

      document.querySelectorAll('.role-operational-nav').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.role-operational-only').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.role-financial-only').forEach(el => el.classList.remove('hidden'));
    }
    // Rule D: Employee Dashboard Constraints (Operational-Only Mode, Zero Financial Access)
    else if (normRole === 'employee') {
      // STRICTLY HIDE all accounting, revenue, billing, and financial preference modules
      if (sidebarFinance) sidebarFinance.classList.add('hidden');
      if (drawerFinance) drawerFinance.classList.add('hidden');
      if (bottomNavFinance) bottomNavFinance.classList.add('hidden');
      if (kpiRevenue) kpiRevenue.classList.add('hidden');
      if (chartRev) chartRev.classList.add('hidden');
      if (clientFinSummary) clientFinSummary.classList.add('hidden');
      if (clientFinPrefs) clientFinPrefs.classList.add('hidden');
      document.querySelectorAll('.role-financial-only').forEach(el => el.classList.add('hidden'));

      // DISPLAY assigned operational tasks, SOPs, and project workflows
      if (sidebarServices) sidebarServices.classList.remove('hidden');
      if (sidebarProjects) sidebarProjects.classList.remove('hidden');
      if (sidebarTasks) sidebarTasks.classList.remove('hidden');
      if (drawerServices) drawerServices.classList.remove('hidden');
      if (drawerProjects) drawerProjects.classList.remove('hidden');
      if (drawerTasks) drawerTasks.classList.remove('hidden');
      if (bottomNavServices) bottomNavServices.classList.remove('hidden');
      if (bottomNavTasks) bottomNavTasks.classList.remove('hidden');

      if (kpiProjects) kpiProjects.classList.remove('hidden');
      if (kpiServices) kpiServices.classList.remove('hidden');
      if (kpiTasksComp) kpiTasksComp.classList.remove('hidden');
      if (kpiTasksPend) kpiTasksPend.classList.remove('hidden');

      if (chartServices) chartServices.classList.remove('hidden');
      if (chartProjects) chartProjects.classList.remove('hidden');
      if (chartTasks) chartTasks.classList.remove('hidden');

      if (clientProjects) clientProjects.classList.remove('hidden');
      if (clientAssignedServices) clientAssignedServices.classList.remove('hidden');

      document.querySelectorAll('.role-operational-nav').forEach(el => el.classList.remove('hidden'));
      document.querySelectorAll('.role-operational-only').forEach(el => el.classList.remove('hidden'));
    }
    // Rule E: Admin and Super Admin (Full operational & financial access)
    else {
      if (sidebarFinance) sidebarFinance.classList.remove('hidden');
      if (drawerFinance) drawerFinance.classList.remove('hidden');
      if (bottomNavFinance) bottomNavFinance.classList.remove('hidden');
      if (sidebarServices) sidebarServices.classList.remove('hidden');
      if (sidebarProjects) sidebarProjects.classList.remove('hidden');
      if (sidebarTasks) sidebarTasks.classList.remove('hidden');
      if (drawerServices) drawerServices.classList.remove('hidden');
      if (drawerProjects) drawerProjects.classList.remove('hidden');
      if (drawerTasks) drawerTasks.classList.remove('hidden');
      if (bottomNavServices) bottomNavServices.classList.remove('hidden');
      if (bottomNavTasks) bottomNavTasks.classList.remove('hidden');

      if (kpiRevenue) kpiRevenue.classList.remove('hidden');
      if (chartRev) chartRev.classList.remove('hidden');
      if (kpiProjects) kpiProjects.classList.remove('hidden');
      if (kpiServices) kpiServices.classList.remove('hidden');
      if (kpiTasksComp) kpiTasksComp.classList.remove('hidden');
      if (kpiTasksPend) kpiTasksPend.classList.remove('hidden');

      if (chartServices) chartServices.classList.remove('hidden');
      if (chartProjects) chartProjects.classList.remove('hidden');
      if (chartTasks) chartTasks.classList.remove('hidden');

      if (clientFinSummary) clientFinSummary.classList.remove('hidden');
      if (clientFinPrefs) clientFinPrefs.classList.remove('hidden');
      if (btnAssignService) btnAssignService.classList.remove('hidden');
      if (clientProjects) clientProjects.classList.remove('hidden');
      if (clientAssignedServices) clientAssignedServices.classList.remove('hidden');

      document.querySelectorAll('.role-operational-nav').forEach(el => el.classList.remove('hidden'));
      document.querySelectorAll('.role-operational-only').forEach(el => el.classList.remove('hidden'));
      document.querySelectorAll('.role-financial-only').forEach(el => el.classList.remove('hidden'));
    }

    // 4. Configure Staff Invite Form role options
    const inviteRoleSelect = document.getElementById('inviteRole');
    if (inviteRoleSelect) {
      if (normRole === 'admin' && !isOwner) {
        // Admins can only invite Accountant or Employee
        const adminOption = inviteRoleSelect.querySelector('option[value="admin"]');
        if (adminOption) adminOption.remove();
      }
    }
  }

  function isCurrentAdminSelf(target) {
    if (!target) return false;
    const currentEmail = (state.adminProfile?.email || state.currentUser?.primaryEmailAddress?.emailAddress || '').toLowerCase();
    const currentUserId = state.adminProfile?.id;
    const currentClerkId = state.currentUser?.id || state.adminProfile?.clerkUserId;

    const targetEmail = (target.email || target.approved_email || '').toLowerCase();
    const targetId = target.id;
    const targetClerkId = target.clerk_user_id || target.clerkUserId;

    if (currentEmail && targetEmail && currentEmail === targetEmail) return true;
    if (currentUserId && targetId && currentUserId === targetId) return true;
    if (currentClerkId && targetClerkId && currentClerkId === targetClerkId) return true;
    return false;
  }

  // =========================================================================
  // IDENTITY & AUDIT PRIVACY PROTECTION ENGINE (ZERO RAW ID LEAKAGE)
  // =========================================================================
  function resolveUserIdentity(rawIdOrEmail, roleHint = '') {
    if (!rawIdOrEmail) return roleHint === 'target' ? 'Authorized Account' : 'System';
    const clean = String(rawIdOrEmail).trim();
    if (!clean || clean === '—' || clean === 'null' || clean === 'undefined') {
      return roleHint === 'target' ? 'Authorized Account' : 'System';
    }

    // Direct owner checks
    if (clean.toLowerCase() === 'kaziaremon@gmail.com' || clean.startsWith('usr_owner') || clean === 'owner') {
      return 'Super Admin';
    }

    // Direct email check (already a human-readable email)
    if (clean.includes('@')) {
      const userWithEmail = (state.usersCache || []).find(u => (u.email || '').toLowerCase() === clean.toLowerCase());
      if (userWithEmail && (userWithEmail.full_name || userWithEmail.fullName)) {
        return userWithEmail.full_name || userWithEmail.fullName;
      }
      return clean;
    }

    // Search usersCache by Clerk ID, ID, or Email
    const cachedUser = (state.usersCache || []).find(u =>
      (u.clerk_user_id && u.clerk_user_id === clean) ||
      (u.clerkUserId && u.clerkUserId === clean) ||
      (u.id && u.id === clean) ||
      (u.email && u.email.toLowerCase() === clean.toLowerCase())
    );
    if (cachedUser) {
      return cachedUser.full_name || cachedUser.fullName || cachedUser.email || (cachedUser.role === 'admin' ? 'Administrator' : 'Team Member');
    }

    // Search clientsCache by Clerk ID, ID, or Email
    const cachedClient = (state.clientsCache || []).find(c =>
      (c.clerk_user_id && c.clerk_user_id === clean) ||
      (c.id && c.id === clean) ||
      (c.email && c.email.toLowerCase() === clean.toLowerCase())
    );
    if (cachedClient) {
      return cachedClient.full_name || cachedClient.company_name || cachedClient.email || 'Client';
    }

    // Search active Clerk session user
    if (window.Clerk?.user && (window.Clerk.user.id === clean || clean === window.Clerk.user.primaryEmailAddress?.emailAddress)) {
      return window.Clerk.user.fullName || window.Clerk.user.primaryEmailAddress?.emailAddress || 'Administrator';
    }

    // STRICT PRIVACY PROTECTION: Block any raw Clerk ID (user_...) or backend hash
    if (clean.startsWith('user_') || clean.startsWith('usr_') || clean.startsWith('org_') || /^[a-zA-Z0-9_-]{20,}$/.test(clean)) {
      if (roleHint === 'target') return 'Authorized Account';
      if (roleHint === 'client') return 'Client';
      return 'Administrator';
    }

    return clean;
  }

  function sanitizeAuditDetails(details, fallbackName = '') {
    if (!details) return '';
    let text = '';
    if (typeof details === 'object') {
      try {
        const copy = JSON.parse(JSON.stringify(details));
        for (const [k, v] of Object.entries(copy)) {
          if (typeof v === 'string') {
            if (v.startsWith('user_') || v.startsWith('usr_')) {
              copy[k] = resolveUserIdentity(v, k.includes('target') ? 'target' : 'actor');
            }
          }
        }
        text = JSON.stringify(copy, null, 2);
      } catch (e) {
        text = String(details);
      }
    } else {
      text = String(details);
    }

    // Regex replace any remaining Clerk ID string patterns (e.g., user_3LSEtPcTNnyxAwwf7LdhNCK7ROO)
    text = text.replace(/user_[a-zA-Z0-9]{15,}/g, (match) => {
      return resolveUserIdentity(match, 'target');
    });

    // Replace internal owner IDs
    text = text.replace(/usr_owner[a-zA-Z0-9_]*/g, 'Super Admin');

    // Replace backend architecture references
    text = text.replace(/Cloudflare\s+D1/gi, 'Cloud Database');
    text = text.replace(/\bD1\b/g, 'Database');

    return text;
  }

  // =========================================================================
  // AUTHENTICATED API FETCH HELPER
  // =========================================================================
  async function apiFetch(endpoint, options = {}) {
    if (state.isPreview && window.__whizAdminMock) {
      return window.__whizAdminMock.handleRequest(endpoint, options, state);
    }
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

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const colors = {
      success: 'bg-white border-emerald-400 text-[#172B36] shadow-emerald-100/60',
      error: 'bg-white border-rose-400 text-[#172B36] shadow-rose-100/60',
      info: 'bg-white border-[#147D64]/50 text-[#172B36] shadow-slate-100/60',
      warn: 'bg-white border-amber-400 text-[#172B36] shadow-amber-100/60'
    };
    const icons = {
      success: 'fa-circle-check text-emerald-500',
      error: 'fa-circle-exclamation text-rose-500',
      info: 'fa-circle-info text-[#147D64]',
      warn: 'fa-triangle-exclamation text-amber-500'
    };

    toast.className = `p-4 rounded-2xl border backdrop-blur-xl shadow-xl flex items-start space-x-3 text-xs transition-all duration-300 transform translate-y-2 pointer-events-auto ${colors[type] || colors.info}`;
    toast.innerHTML = `
      <i class="fa-solid ${icons[type] || icons.info} text-sm mt-0.5 shrink-0"></i>
      <div class="flex-1 font-medium leading-relaxed">${message}</div>
      <button type="button" class="text-slate-400 hover:text-[#172B36] cursor-pointer ml-2">
        <i class="fa-solid fa-xmark text-xs"></i>
      </button>
    `;

    toast.querySelector('button').addEventListener('click', () => toast.remove());
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.remove('translate-y-2'));

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  function setBtnLoading(btn, isLoading, loadingText = 'Processing...') {
    if (!btn) return;
    if (isLoading) {
      btn.dataset.originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-xs mr-2"></i><span>${loadingText}</span>`;
      btn.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
      btn.disabled = false;
      if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
  }

  // =========================================================================
  // TAB NAVIGATION & ROUTING
  // =========================================================================
  function switchTab(tabId, updateHash = true) {
    if (typeof closeActiveGlassMenu === "function") closeActiveGlassMenu();
    if (tabId === 'settings') tabId = 'security';

    // Strict RBAC Route Guard
    const userRole = state.adminProfile?.role || '';
    const normRole = typeof normalizeRole === 'function' ? normalizeRole(userRole) : userRole.toLowerCase();
    const isOwner = typeof isCurrentUserOwner === 'function' ? isCurrentUserOwner() : false;

    // Hard Rule 1: Audit & Operational History is strictly restricted to Admin and Super Admin
    if (tabId === 'history' && !isOwner && normRole !== 'admin' && normRole !== 'super_admin') {
      showToast('Access Denied: Audit & Operational History is strictly restricted to Administrators.', 'error');
      tabId = normRole === 'accountant' ? 'finance' : (normRole === 'employee' ? 'tasks' : 'overview');
    }
    // Hard Rule 2: Accountant Dashboard Constraints (Financial only)
    else if (normRole === 'accountant' && ['services', 'service_tasks', 'projects', 'tasks', 'team', 'history'].includes(tabId)) {
      showToast('Access Denied: Operational pipelines and user governance are restricted for accountant accounts.', 'warning');
      tabId = 'finance';
    }
    // Hard Rule 3: Employee Dashboard Constraints (Operational only)
    else if (normRole === 'employee' && ['finance', 'team', 'history'].includes(tabId)) {
      showToast('Access Denied: Financial and administrative modules are strictly restricted for employee accounts.', 'warning');
      tabId = 'tasks';
    }

    state.activeTab = tabId;

    const allViews = [
      'overview', 'clients', 'client_details', 'services', 'service_tasks',
      'projects', 'tasks', 'finance', 'team',
      'support', 'history', 'security'
    ];

    allViews.forEach(v => {
      const el = document.getElementById(`view_${v}`);
      if (el) {
        if (v === tabId) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });

    // Friendly Title Mapping
    const tabTitles = {
      overview: 'Overview & KPIs',
      clients: 'Client Directory',
      client_details: 'Client Workspace',
      services: 'Service Catalog',
      service_tasks: 'Task Blueprints',
      projects: 'Service Projects',
      tasks: 'Live Tasks',
      finance: 'Payments & Ledger',
      team: 'User & Access Management',
      support: 'Support Requests',
      history: 'Audit & History',
      security: 'Account Security'
    };

    const activeTitle = tabTitles[tabId] || tabId.replace(/_/g, ' ');

    // Update Mobile Subheader Title
    const subheaderTitle = document.getElementById('mobileSubheaderTitle');
    if (subheaderTitle) {
      subheaderTitle.textContent = activeTitle;
    }

    // Sidebar & Mobile Bottom Nav active styling
    document.querySelectorAll('[data-dash-tab]').forEach(btn => {
      const isTarget = btn.dataset.dashTab === tabId;
      if (btn.closest('#adminMobileBottomNav')) {
        const label = btn.querySelector('.dash-bottom-label');
        if (isTarget) {
          btn.classList.add('bg-[#EAF5F1]', 'text-[#087F70]', 'border-[#087F70]/25', 'shadow-2xs');
          btn.classList.remove('text-[#74817D]', 'border-transparent');
          btn.setAttribute('aria-current', 'page');
          if (label) {
            label.classList.add('font-bold');
            label.classList.remove('font-semibold');
          }
        } else {
          btn.classList.remove('bg-[#EAF5F1]', 'text-[#087F70]', 'border-[#087F70]/25', 'shadow-2xs');
          btn.classList.add('text-[#74817D]', 'border-transparent');
          btn.removeAttribute('aria-current');
          if (label) {
            label.classList.remove('font-bold');
            label.classList.add('font-semibold');
          }
        }
      } else {
        if (isTarget) {
          btn.classList.add('dock-active', 'bg-[#EAF5F1]', 'text-[#087F70]', 'border-[#087F70]/20');
          btn.classList.remove('text-[#74817D]', 'text-slate-400', 'border-transparent', 'hover:bg-[#F7FAF9]');
          btn.setAttribute('aria-current', 'page');
        } else {
          btn.classList.remove('dock-active', 'bg-[#EAF5F1]', 'text-[#087F70]', 'border-[#087F70]/20', 'bg-brand-whiz/15', 'text-brand-whiz', 'border-brand-whiz/30');
          btn.classList.add('text-[#74817D]', 'border-transparent');
          btn.removeAttribute('aria-current');
        }
      }
    });

    // Breadcrumb
    const breadcrumb = document.getElementById('breadcrumbActiveTab');
    if (breadcrumb) {
      if (tabId === 'client_details') breadcrumb.textContent = 'Client Workspace';
      else if (tabId === 'service_tasks') breadcrumb.textContent = 'Task Blueprints';
      else breadcrumb.textContent = tabId.replace('_', ' ');
    }

    if (updateHash && !tabId.includes('_details') && !tabId.includes('_tasks')) {
      window.location.hash = tabId;
    }

    // Lazy load tab data
    if (tabId === 'overview') loadOverviewData();
    else if (tabId === 'clients') loadClientsData();
    else if (tabId === 'services') loadServicesData();
    else if (tabId === 'projects') loadProjectsData();
    else if (tabId === 'tasks') loadTasksData();
    else if (tabId === 'finance') loadFinanceData();
    else if (tabId === 'team') loadTeamData();
    else if (tabId === 'support') loadSupportData();
    else if (tabId === 'history') loadHistoryData();
    else if (tabId === 'security') loadSecurityData();

    if (typeof initGlassSelects === 'function') initGlassSelects();
  }

  // =========================================================================
  // 1. OVERVIEW DATA
  // =========================================================================
    let charts = {
    services: null,
    projects: null,
    tasks: null,
    revenue: null
  };

  function renderCharts(d) {
    if (typeof Chart === 'undefined') return;

    // 1. Service Distribution
    const serviceCtx = document.getElementById('chartServiceDistribution');
    const serviceEmpty = document.getElementById('chartServiceEmptyState');
    if (serviceCtx) {
      if (charts.services) charts.services.destroy();
      const items = d.serviceDistribution || [];
      if (items.length === 0) {
        serviceCtx.style.display = 'none';
        if (serviceEmpty) serviceEmpty.classList.remove('hidden');
      } else {
        serviceCtx.style.display = 'block';
        if (serviceEmpty) serviceEmpty.classList.add('hidden');
        charts.services = new Chart(serviceCtx, {
          type: 'doughnut',
          data: {
            labels: items.map(i => i.name),
            datasets: [{
              data: items.map(i => i.count),
              backgroundColor: ['#147D64', '#06B6D4', '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'],
              borderWidth: 2,
              borderColor: '#FFFFFF'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10, family: 'Inter' }, color: '#64748B' } }
            }
          }
        });
      }
    }

    // 2. Project Progress
    const projCtx = document.getElementById('chartProjectProgress');
    const projEmpty = document.getElementById('chartProjectEmptyState');
    if (projCtx) {
      if (charts.projects) charts.projects.destroy();
      const projects = d.projectProgress || [];
      if (projects.length === 0) {
        projCtx.style.display = 'none';
        if (projEmpty) projEmpty.classList.remove('hidden');
      } else {
        projCtx.style.display = 'block';
        if (projEmpty) projEmpty.classList.add('hidden');
        charts.projects = new Chart(projCtx, {
          type: 'bar',
          data: {
            labels: projects.map(p => p.name.length > 20 ? p.name.substring(0, 18) + '...' : p.name),
            datasets: [{
              label: 'Progress %',
              data: projects.map(p => p.progress_percent || 0),
              backgroundColor: '#147D64',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
              x: { min: 0, max: 100, ticks: { callback: v => v + '%', color: '#64748B', font: { size: 10 } }, grid: { color: '#F1F5F9' } },
              y: { ticks: { color: '#1E293B', font: { size: 10 } }, grid: { display: false } }
            },
            plugins: { legend: { display: false } }
          }
        });
      }
    }

    // 3. Task Status Distribution
    const taskCtx = document.getElementById('chartTaskStatus');
    const taskEmpty = document.getElementById('chartTaskEmptyState');
    if (taskCtx) {
      if (charts.tasks) charts.tasks.destroy();
      const tasks = d.taskStatusDistribution || [];
      const totalTasks = tasks.reduce((acc, t) => acc + (t.count || 0), 0);
      if (totalTasks === 0) {
        taskCtx.style.display = 'none';
        if (taskEmpty) taskEmpty.classList.remove('hidden');
      } else {
        taskCtx.style.display = 'block';
        if (taskEmpty) taskEmpty.classList.add('hidden');
        charts.tasks = new Chart(taskCtx, {
          type: 'doughnut',
          data: {
            labels: tasks.map(t => (t.status || 'todo').toUpperCase()),
            datasets: [{
              data: tasks.map(t => t.count),
              backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#94A3B8'],
              borderWidth: 2,
              borderColor: '#FFFFFF'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10, family: 'Inter' }, color: '#64748B' } }
            }
          }
        });
      }
    }

    // 4. Monthly Revenue
    const revCtx = document.getElementById('chartMonthlyRevenue');
    const revEmpty = document.getElementById('chartRevenueEmptyState');
    if (revCtx) {
      if (charts.revenue) charts.revenue.destroy();
      const revenueCents = d.confirmedRevenueCents || 0;
      if (revenueCents === 0) {
        revCtx.style.display = 'none';
        if (revEmpty) revEmpty.classList.remove('hidden');
      } else {
        revCtx.style.display = 'block';
        if (revEmpty) revEmpty.classList.add('hidden');
        charts.revenue = new Chart(revCtx, {
          type: 'bar',
          data: {
            labels: ['Current Month'],
            datasets: [{
              label: 'Confirmed Payments ($ USD)',
              data: [revenueCents / 100],
              backgroundColor: '#10B981',
              borderRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { ticks: { callback: v => '$' + v, color: '#64748B', font: { size: 10 } }, grid: { color: '#F1F5F9' } },
              x: { ticks: { color: '#1E293B', font: { size: 10 } }, grid: { display: false } }
            },
            plugins: { legend: { display: false } }
          }
        });
      }
    }
  }

  function updateOverviewGreeting() {
    const greetingEl = document.getElementById('overviewGreetingTitle');
    const quoteEl = document.getElementById('overviewMotivationalQuote');
    if (!greetingEl && !quoteEl) return;

    // Dynamic time-aware greeting based on local hour
    const hour = new Date().getHours();
    let timeGreeting = 'Good Morning';
    if (hour >= 12 && hour < 17) {
      timeGreeting = 'Good Afternoon';
    } else if (hour >= 17 || hour < 4) {
      timeGreeting = 'Good Evening';
    }

    // Resolve authenticated user's first name
    const rawFullName = state.adminProfile?.full_name || 
                        state.adminProfile?.fullName || 
                        window.Clerk?.user?.firstName || 
                        window.Clerk?.user?.fullName || 
                        '';
    let firstName = '';
    if (rawFullName) {
      const parts = rawFullName.trim().split(/\s+/);
      firstName = parts[0];
      if (['md', 'md.', 'mr', 'mr.', 'ms', 'ms.', 'dr', 'dr.'].includes(firstName.toLowerCase()) && parts.length > 1) {
        firstName = parts[1];
      }
    } else {
      firstName = 'Kazi';
    }

    if (firstName) {
      firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    }

    if (greetingEl) {
      greetingEl.textContent = `${timeGreeting}, ${firstName}!`;
    }

    // Rotating motivational subtext
    const quotes = [
      "Ready to crush your agency goals today?",
      "Here is a snapshot of your operational momentum today.",
      "Let's scale your agency to new heights with seamless execution.",
      "Operational excellence and client success start with daily focus.",
      "Empowering enterprise growth with real-time clarity and precision.",
      "Every milestone achieved is another step towards scaling mastery."
    ];

    if (quoteEl) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      quoteEl.textContent = randomQuote;
    }
  }

  async function loadOverviewData() {
    updateOverviewGreeting();
    const res = await apiFetch('/portal/admin/stats');
    if (res.ok && res.data && res.data.data) {
      const d = res.data.data;
      const totalClientsEl = document.getElementById('statTotalClients');
      if (totalClientsEl) totalClientsEl.textContent = d.totalClients || 0;

      const actCount = document.getElementById('statActiveProjects');
      if (actCount) actCount.textContent = d.activeProjects || 0;

      const srvCount = document.getElementById('statActiveServices');
      if (srvCount) srvCount.textContent = d.activeServices || 0;

      const compTasks = document.getElementById('statCompletedTasks');
      if (compTasks) compTasks.textContent = d.completedTasks || 0;

      const pendTasks = document.getElementById('statPendingTasks');
      if (pendTasks) pendTasks.textContent = d.pendingTasks || 0;

      const revEl = document.getElementById('statConfirmedRevenue');
      if (revEl) {
        const revByCurr = d.confirmedRevenueByCurrency || d.revenueByCurrency || [];
        if (revByCurr.length === 0) {
          revEl.textContent = '$0.00';
        } else if (revByCurr.length === 1) {
          revEl.textContent = formatCurrency(revByCurr[0].total, revByCurr[0].currency);
        } else {
          revEl.textContent = formatCurrency(revByCurr[0].total, revByCurr[0].currency);
        }
      }

      renderCharts(d);

      const actEl = document.getElementById('overviewActivityList');
      if (actEl && d.recentActivity) {
        if (d.recentActivity.length === 0) {
          actEl.innerHTML = '<p class="text-slate-500 italic p-4 text-center">No recent system activity recorded.</p>';
        } else {
          actEl.innerHTML = d.recentActivity.map(a => `
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-[#E3E9EF]">
              <div class="flex items-center space-x-2.5">
                <span class="w-2 h-2 rounded-full bg-brand-whiz"></span>
                <span class="font-bold text-[#172B36] uppercase text-[10px]">${escapeHtml(a.action)}</span>
                <span class="text-slate-500 text-xs">${escapeHtml(sanitizeAuditDetails(a.resource_type || ''))}</span>
              </div>
              <span class="text-[11px] text-slate-400 font-mono">${new Date(a.created_at).toLocaleTimeString()}</span>
            </div>
          `).join('');
        }
      }
    }
  }

  // =========================================================================
  // 2. CLIENT DIRECTORY & CLIENT DETAILS WORKSPACE (Phase 3 & 4)
  // =========================================================================
  async function loadClientsData() {
    const tbody = document.getElementById('adminClientsTableBody');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-10 text-center">
          <div class="inline-flex items-center gap-2.5 text-xs font-semibold text-slate-500">
            <i class="fa-solid fa-circle-notch fa-spin text-brand-whiz text-sm"></i>
            <span>Loading clients directory...</span>
          </div>
        </td>
      </tr>
    `;

    const statusFilter = document.getElementById('adminClientStatusFilter')?.value || 'active';
    const searchQuery = (document.getElementById('adminClientSearchInput')?.value || '').trim();

    const res = await apiFetch(`/clients?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`);

    if (res.ok && res.data && Array.isArray(res.data.data)) {
      state.clientsCache = res.data.data;
      renderClientsTable(state.clientsCache);
    } else {
      const errMsg = res.data?.error || 'Failed to communicate with database.';
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-8 text-center">
            <div class="max-w-md mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-2">
              <div class="flex items-center justify-center gap-2 font-bold text-rose-800">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>Unable to load clients directory</span>
              </div>
              <p class="text-[11px] text-rose-600">${escapeHtml(errMsg)}</p>
              <button type="button" id="btnRetryLoadClients" class="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-xs">
                <i class="fa-solid fa-rotate-right"></i> Retry Connection
              </button>
            </div>
          </td>
        </tr>
      `;
      document.getElementById('btnRetryLoadClients')?.addEventListener('click', () => {
        loadClientsData();
      });
    }
  }

  function renderClientsTable(clients) {
    const tbody = document.getElementById('adminClientsTableBody');
    const cardsContainer = document.getElementById('adminClientsCardsContainer');
    if (!tbody) return;

    if (!clients || clients.length === 0) {
      const emptyHtml = `
        <div class="p-8 rounded-2xl bg-white border border-[#E3E9EF] text-center max-w-sm mx-auto space-y-3">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-lg">
            <i class="fa-solid fa-users-slash"></i>
          </div>
          <div>
            <h4 class="text-sm font-bold text-[#172B36]">No Clients Found</h4>
            <p class="text-xs text-slate-500 mt-0.5">No registered client accounts match the selected filter or search criteria.</p>
          </div>
          <button type="button" class="btn-empty-add-client inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#147D64] text-white hover:bg-[#116954] text-xs font-bold transition-all shadow-xs cursor-pointer">
            <i class="fa-solid fa-user-plus"></i> Add New Client
          </button>
        </div>
      `;

      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-12 text-center">${emptyHtml}</td>
        </tr>
      `;

      if (cardsContainer) cardsContainer.innerHTML = emptyHtml;

      document.querySelectorAll('.btn-empty-add-client').forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('btnOpenAddClientModal')?.click();
        });
      });
      return;
    }

    // 1. Desktop Table Rows
    tbody.innerHTML = clients.map(c => {
      const isSuspended = c.status === 'suspended';
      const isDeleted = c.status === 'deleted';

      let statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>';
      if (isSuspended) {
        statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200">Suspended</span>';
      } else if (isDeleted) {
        statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">Deleted</span>';
      }

      const companyDisplay = (c.company_name && c.company_name.trim())
        ? `<div class="text-xs text-[#147D64] font-medium truncate max-w-[220px]">${escapeHtml(c.company_name)}</div>`
        : `<div class="mt-0.5"><span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"><i class="fa-solid fa-building-circle-exclamation text-amber-500 text-[9px]"></i> Unassigned Company</span></div>`;

      return `
        <tr class="hover:bg-slate-50 transition-colors border-b border-[#E3E9EF]">
          <td class="px-6 py-4">
            <div class="font-bold text-[#172B36] text-sm">${escapeHtml(c.full_name || 'Client')}</div>
            ${companyDisplay}
            
          </td>
          <td class="px-6 py-4 font-mono text-[#5F7180]">
            <div>${escapeHtml(c.email)}</div>
            <div class="text-[11px] text-slate-500">${escapeHtml(c.phone || 'No phone')}</div>
          </td>
          <td class="px-6 py-4 text-[#5F7180] text-xs">
            ${escapeHtml(c.city || 'Dhaka')}, ${escapeHtml(c.country || 'Bangladesh')}
          </td>
          <td class="px-6 py-4">
            ${statusBadge}
          </td>
          <td class="px-6 py-4 text-right">
            <button type="button" class="btn-manage-client px-3.5 py-1.5 rounded-xl text-xs font-bold btn-glass-primary shadow-xs hover:shadow-md cursor-pointer transition-all" data-id="${escapeHtml(c.id)}">
              <i class="fa-solid fa-sliders mr-1 text-[11px]"></i> Manage
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // 2. Mobile Cards List (Table-to-Card Pattern)
    if (cardsContainer) {
      cardsContainer.innerHTML = clients.map(c => {
        const isSuspended = c.status === 'suspended';
        const isDeleted = c.status === 'deleted';

        let statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>';
        if (isSuspended) {
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200">Suspended</span>';
        } else if (isDeleted) {
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">Deleted</span>';
        }

        const companyDisplay = (c.company_name && c.company_name.trim())
          ? `<span class="text-xs font-semibold text-[#147D64] truncate">${escapeHtml(c.company_name)}</span>`
          : `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"><i class="fa-solid fa-building-circle-exclamation text-amber-500 text-[9px]"></i> Unassigned</span>`;

        return `
          <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] shadow-xs space-y-3">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h4 class="text-sm font-black text-[#172B36] truncate">${escapeHtml(c.full_name || 'Client')}</h4>
                <div class="mt-0.5">${companyDisplay}</div>
              </div>
              <div class="shrink-0">${statusBadge}</div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-100">
              <div class="flex items-center space-x-2 truncate">
                <i class="fa-solid fa-envelope text-slate-400 text-xs w-3.5"></i>
                <span class="truncate font-mono text-[11px]">${escapeHtml(c.email)}</span>
              </div>
              <div class="flex items-center space-x-2 truncate">
                <i class="fa-solid fa-phone text-slate-400 text-xs w-3.5"></i>
                <span class="text-[11px]">${escapeHtml(c.phone || 'No phone')}</span>
              </div>
              <div class="flex items-center space-x-2 truncate">
                <i class="fa-solid fa-location-dot text-slate-400 text-xs w-3.5"></i>
                <span class="text-[11px]">${escapeHtml(c.city || 'Dhaka')}, ${escapeHtml(c.country || 'Bangladesh')}</span>
              </div>
            </div>

            <div class="pt-2 border-t border-slate-100">
              <button type="button" class="btn-manage-client w-full py-2.5 rounded-xl text-xs font-bold bg-[#147D64] hover:bg-[#116954] active:bg-[#0e5645] text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs" data-id="${escapeHtml(c.id)}">
                <i class="fa-solid fa-sliders text-xs"></i>
                <span>Manage Client Workspace</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Wire Manage buttons on both table and cards
    document.querySelectorAll('.btn-manage-client').forEach(btn => {
      btn.addEventListener('click', () => {
        openClientDetails(btn.dataset.id);
      });
    });
  }

  // Open Full-Page Client Details Workspace
  async function openClientDetails(clientId) {
    state.selectedClientId = clientId;
    switchTab('client_details', false);
    window.location.hash = `client-${clientId}`;

    const titleEl = document.getElementById('clientDetailTitle');
    const subEl = document.getElementById('clientDetailSubtitle');
    if (titleEl) {
      titleEl.textContent = 'Loading Client Record...';
      titleEl.title = '';
    }

    const res = await apiFetch(`/clients/${clientId}`);
    if (!res.ok || !res.data || !res.data.data) {
      showToast('Failed to load client details.', 'error');
      switchTab('clients');
      return;
    }

    const { client, services, projects, invoices, payments, auditLogs } = res.data.data;
    state.selectedClient = client;

    // Header info
    if (titleEl) {
      titleEl.textContent = 'Client Workspace';
      titleEl.title = titleEl.textContent;
    }
    if (subEl) {
      subEl.textContent = client.is_unassigned ? 'Unassigned Organization • Master Operational Record' : 'Authoritative Client Record & Active Services';
      subEl.title = subEl.textContent;
    }

    const statusBadges = [
      document.getElementById('clientDetailStatusBadge'),
      document.getElementById('clientCardStatusBadge')
    ].filter(Boolean);
    const btnSuspend = document.getElementById('btnSuspendClientAction');
    const btnReactivate = document.getElementById('btnReactivateClientAction');

    statusBadges.forEach(statusBadge => {
      if (client.status === 'suspended') {
        statusBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/90 shadow-2xs shrink-0 select-none';
        statusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span><span>Suspended</span>';
      } else {
        statusBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs shrink-0 select-none';
        statusBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span><span>${escapeHtml(client.status || 'Active')}</span>`;
      }
    });

    if (client.status === 'suspended') {
      btnSuspend?.classList.add('hidden');
      btnReactivate?.classList.remove('hidden');
    } else {
      btnSuspend?.classList.remove('hidden');
      btnReactivate?.classList.add('hidden');
    }
    // Profile Card
    const cif = client.cif || {};
    const effectiveFullName = cif.fullName || client.full_name || 'Valued Client';
    const effectiveCompanyName = cif.companyName || client.company_name;
    const effectivePhone = cif.phone || client.phone || 'None provided';
    const effectiveAddress = cif.address || client.address;
    const effectiveCity = cif.city || client.city || 'Dhaka';
    const effectiveCountry = cif.country || client.country || 'Bangladesh';

    const initials = effectiveFullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const avInit = document.getElementById('clientAvatarInitials');
    if (avInit) avInit.textContent = initials;
    const cfn = document.getElementById('clientCardFullName');
    if (cfn) cfn.textContent = effectiveFullName;
    const ccn = document.getElementById('clientCardCompanyName');
    if (ccn) {
      ccn.innerHTML = effectiveCompanyName
        ? escapeHtml(effectiveCompanyName)
        : `<span class="inline-flex items-center gap-1 text-amber-600 font-semibold"><i class="fa-solid fa-triangle-exclamation text-[10px]"></i> Unassigned (No Linked Organization)</span>`;
    }
    const cEm = document.getElementById('clientCardEmail');
    if (cEm) cEm.textContent = client.email;
    const cPh = document.getElementById('clientCardPhone');
    if (cPh) cPh.textContent = effectivePhone;
    const cLoc = document.getElementById('clientCardLocation');
    if (cLoc) cLoc.textContent = `${effectiveAddress ? effectiveAddress + ', ' : ''}${effectiveCity}, ${effectiveCountry}`;
    const cClk = document.getElementById('clientCardClerkId');
    if (cClk) cClk.innerHTML = client.clerk_user_id ? '<span class="text-emerald-700 font-semibold"><i class="fa-solid fa-shield-check text-[#147D64] mr-1"></i>SSO Verified</span>' : '<span class="text-slate-400">Pending SSO link</span>';
    const cOrg = document.getElementById('clientCardOrgId');
    if (cOrg) {
      cOrg.textContent = client.organization_name || (client.organization_id ? (client.organization_id.startsWith('org_') ? 'Primary Client Workspace' : client.organization_id) : 'Personal Workspace');
    }

    // Populate Preferred Currency in Financial Preferences
    const clientCurrency = (cif.currency || client.currency || (effectiveCountry === 'Bangladesh' || (effectivePhone && effectivePhone.startsWith('+880')) ? 'BDT' : 'USD')).toUpperCase();
    const currSelect = document.getElementById('clientPreferredCurrencySelect');
    if (currSelect) {
      currSelect.value = clientCurrency;
      if (typeof syncClientPreferredCurrencyDropdown === 'function') {
        syncClientPreferredCurrencyDropdown(clientCurrency);
      }
    }
    const currBadge = document.getElementById('clientPreferredCurrencyBadge');
    if (currBadge) currBadge.textContent = clientCurrency;

    // Wire Save Currency button
    const saveCurrBtn = document.getElementById('btnSaveClientCurrency');
    if (saveCurrBtn) {
      saveCurrBtn.onclick = async () => {
        const newCurr = currSelect.value;
        setBtnLoading(saveCurrBtn, true, 'Saving...');
        const updRes = await apiFetch(`/clients/${clientId}`, {
          method: 'PUT',
          body: JSON.stringify({ currency: newCurr })
        });
        setBtnLoading(saveCurrBtn, false);
        if (updRes.ok) {
          showToast(`Client billing currency updated to ${newCurr}!`, 'success');
          if (currBadge) currBadge.textContent = newCurr;
        } else {
          showToast(updRes.data?.error || 'Failed to update currency.', 'error');
        }
      };
    }

    // Financial calculations
    const totalBilledCents = (invoices || []).reduce((sum, inv) => sum + (inv.total_cents || 0), 0);
    const totalPaidCents = (payments || []).reduce((sum, p) => sum + (p.amount_cents || 0), 0);
    const tbEl = document.getElementById('clientCardTotalBilled');
    if (tbEl) tbEl.textContent = formatCurrency(totalBilledCents, clientCurrency);
    const tpEl = document.getElementById('clientCardTotalPaid');
    if (tpEl) tpEl.textContent = formatCurrency(totalPaidCents, clientCurrency);

    // Render Assigned Services
    const srvCountEl = document.getElementById('clientServicesCount');
    if (srvCountEl) srvCountEl.textContent = `${services.length} Total`;
    const srvList = document.getElementById('clientAssignedServicesList');
    if (srvList) {
      if (services.length === 0) {
        srvList.innerHTML = `
          <div class="p-6 rounded-2xl bg-slate-50 border border-[#E3E9EF] text-center text-xs text-[#5F7180] space-y-2">
            <i class="fa-solid fa-shapes text-2xl text-slate-600 block mb-1"></i>
            <p>No services assigned to this client organization yet.</p>
            <button type="button" class="btn-open-assign-service-inline mt-2 px-3.5 py-1.5 rounded-xl bg-brand-whiz/15 text-brand-whiz hover:bg-brand-whiz/30 font-bold transition-all cursor-pointer">
              Assign Service from Catalog
            </button>
          </div>
        `;
        srvList.querySelector('.btn-open-assign-service-inline')?.addEventListener('click', () => {
          document.getElementById('btnOpenAssignServiceClientModal')?.click();
        });
      } else {
        srvList.innerHTML = services.map(s => `
          <div class="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#E6ECE9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-2xs hover:border-[#087F70]/30 transition-all">
            <div class="flex items-center space-x-3 min-w-0">
              <div class="w-9 h-9 rounded-xl bg-brand-whiz/15 text-brand-whiz border border-brand-whiz/30 flex items-center justify-center font-bold text-xs shrink-0">
                <i class="fa-solid fa-bolt"></i>
              </div>
              <div class="min-w-0">
                <div class="text-xs font-bold text-[#172B36] truncate">${escapeHtml(s.service_name)}</div>
                <div class="text-[11px] text-[#5F7180] flex items-center gap-2">
                  <span>${escapeHtml(s.package_name || 'Standard Retainer')}</span>
                  <span>•</span>
                  <span>Started: ${escapeHtml(s.start_date || 'N/A')}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-3 shrink-0 self-end sm:self-auto">
              ${state.adminProfile?.role !== 'employee' && s.price_cents != null ? `<span class="text-xs font-mono font-bold text-brand-whiz">${formatCurrency(s.price_cents || 0, s.currency || clientCurrency || "USD")}</span>` : ''}
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-600 border border-slate-200'}">${s.status}</span>
              ${s.status === 'active' ? `
                <button type="button" class="btn-cancel-client-service text-slate-500 hover:text-rose-600 p-1 cursor-pointer transition-colors" data-cs="${s.id}" title="Cancel Service">
                  <i class="fa-solid fa-ban text-xs"></i>
                </button>
              ` : ''}
            </div>
          </div>
        `).join('');

        // Wire cancel service buttons
        srvList.querySelectorAll('.btn-cancel-client-service').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to cancel this service engagement?')) return;
            const csId = btn.dataset.cs;
            const cancelRes = await apiFetch(`/clients/${clientId}/services/${csId}`, { method: 'DELETE' });
            if (cancelRes.ok) {
              showToast('Service cancelled.', 'info');
              openClientDetails(clientId);
            } else {
              showToast(cancelRes.data?.error || 'Failed to cancel service.', 'error');
            }
          });
        });
      }
    }

    // Render Projects
    const prjCountEl = document.getElementById('clientProjectsCount');
    if (prjCountEl) prjCountEl.textContent = `${projects.length} Projects`;
    const prjList = document.getElementById('clientProjectsList');
    if (prjList) {
      if (projects.length === 0) {
        prjList.innerHTML = '<p class="text-slate-500 italic text-xs p-4 text-center">No projects auto-provisioned yet.</p>';
      } else {
        prjList.innerHTML = projects.map(p => {
          const percent = p.progress_percent || 0;
          return `
            <div class="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#E6ECE9] space-y-2.5 shadow-2xs hover:border-[#087F70]/30 transition-all">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold text-[#172B36]">${p.name}</h4>
                  <p class="text-[11px] text-[#5F7180] font-mono">${p.service_name || 'Standard Engagement'}</p>
                </div>
                <span class="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">${p.status}</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden border border-[#E3E9EF]">
                  <div class="bg-gradient-to-r from-brand-whiz to-emerald-400 h-full rounded-full transition-all duration-500" style="width: ${percent}%"></div>
                </div>
                <span class="text-xs font-mono font-bold text-brand-whiz">${percent}%</span>
                <span class="text-[11px] font-mono text-slate-400">(${p.completed_tasks || 0}/${p.total_tasks || 20} Tasks)</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render Audit Trail
    const audList = document.getElementById('clientAuditHistoryList');
    if (audList) {
      if (!auditLogs || auditLogs.length === 0) {
        audList.innerHTML = '<p class="text-slate-500 italic text-xs">No audit logs for this client yet.</p>';
      } else {
        audList.innerHTML = auditLogs.map(a => {
          const actionText = escapeHtml(a.action || 'ACTIVITY');
          const actorEmail = escapeHtml(resolveUserIdentity(a.user_email || a.user_name || a.actor_id || a.clerk_id, 'actor'));
          const dateStr = a.created_at || a.timestamp ? new Date(a.created_at || a.timestamp).toLocaleDateString() : '';
          const detailsStr = a.details ? sanitizeAuditDetails(a.details, effectiveFullName) : '';

          return `
            <div class="p-2.5 rounded-xl bg-slate-50/70 border border-[#E6ECE9] text-[11px] min-w-0 max-w-full overflow-hidden space-y-1.5 [overflow-wrap:anywhere] [word-break:break-all] break-all" style="overflow-wrap: anywhere; word-break: break-all;">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 min-w-0">
                <div class="flex items-start sm:items-center gap-1.5 min-w-0 flex-1 flex-wrap [overflow-wrap:anywhere] [word-break:break-all] break-all" style="overflow-wrap: anywhere; word-break: break-all;">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#087F70] shrink-0 mt-1 sm:mt-0"></span>
                  <span class="font-bold text-[#172B36] uppercase tracking-wide [overflow-wrap:anywhere] [word-break:break-all] break-all" style="overflow-wrap: anywhere; word-break: break-all;">${actionText}</span>
                  <span class="text-[#5F7180] [overflow-wrap:anywhere] [word-break:break-all] break-all" style="overflow-wrap: anywhere; word-break: break-all;">• ${actorEmail}</span>
                </div>
                ${dateStr ? `<span class="text-[#5F7180] font-mono text-[10px] shrink-0 self-start sm:self-auto">${dateStr}</span>` : ''}
              </div>
              ${detailsStr ? `
                <div class="text-[10px] text-slate-600 bg-white/80 p-2 rounded-lg border border-[#E6ECE9] [overflow-wrap:anywhere] [word-break:break-all] break-all whitespace-pre-wrap leading-relaxed select-text" style="overflow-wrap: anywhere; word-break: break-all;">
                  ${escapeHtml(detailsStr)}
                </div>
              ` : ''}
            </div>
          `;
        }).join('');
      }
    }
  }

  // =========================================================================
  // 3. SERVICE MANAGEMENT & 240 SOP TASK BLUEPRINTS (Phase 5, 6, 7, 8, 9)
  // =========================================================================
  async function loadServicesData() {
    const res = await apiFetch('/services/catalog');
    const grid = document.getElementById('adminServicesGrid');
    if (!grid) return;

    if (res.ok && res.data && res.data.data) {
      state.servicesCache = res.data.data;

      const countBadge = document.getElementById('serviceCatalogCountBadge');
      if (countBadge) {
        countBadge.textContent = `${state.servicesCache.length} Active Services`;
      }

      grid.innerHTML = state.servicesCache.map(s => {
        const canViewPricing = state.adminProfile?.role !== 'employee';
        const priceCents = s.standard_price_cents != null ? s.standard_price_cents : s.pricing_cents;
        const priceFormatted = priceCents != null ? formatCurrency(priceCents, s.currency || 'USD') : null;

        return `
          <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E6ECE9] flex flex-col justify-between space-y-4 hover:border-[#087F70]/40 hover:shadow-md transition-all shadow-2xs group">
            <div class="space-y-3">
              <!-- Top Row: Code Badge, Version Tag, Price -->
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-xs font-mono font-bold uppercase tracking-wider text-[#087F70] bg-[#EAF5F1] px-2.5 py-0.5 rounded-md border border-[#087F70]/25 whitespace-nowrap shrink-0">${escapeHtml(s.code || (s.id || "").toUpperCase())}</span>
                  <span class="text-[10px] font-mono font-semibold text-[#74817D] bg-[#F7FAF9] px-1.5 py-0.5 rounded border border-[#E6ECE9] whitespace-nowrap">v${s.version || 1}</span>
                </div>
                ${canViewPricing && priceFormatted ? `
                  <div class="text-right shrink-0">
                    <span class="text-xs sm:text-sm font-mono font-bold text-[#202D2A]">${priceFormatted}</span>
                    <span class="text-[10px] text-[#74817D] font-medium hidden sm:inline ml-0.5">/mo</span>
                  </div>
                ` : ''}
              </div>

              <!-- Service Title & Description -->
              <div class="space-y-1">
                <h3 class="text-base font-bold text-[#202D2A] group-hover:text-[#087F70] transition-colors leading-snug break-words">${escapeHtml(s.name)}</h3>
                <p class="text-xs text-[#74817D] line-clamp-2 leading-relaxed" title="${escapeHtml(s.description || '')}">${escapeHtml(s.description || 'Comprehensive operational service package.')}</p>
              </div>

              <!-- Metadata Pills -->
              <div class="flex flex-wrap items-center gap-1.5 text-[11px] pt-0.5">
                <span class="inline-flex items-center gap-1 font-semibold text-[#087F70] bg-[#EAF5F1] px-2 py-0.5 rounded-md border border-[#087F70]/20 truncate max-w-[180px]">
                  <i class="fa-solid fa-layer-group text-[10px]"></i>
                  <span class="truncate">${escapeHtml(s.category || 'Core Service')}</span>
                </span>
                <span class="inline-flex items-center gap-1 font-medium text-[#74817D] bg-[#F7FAF9] px-2 py-0.5 rounded-md border border-[#E6ECE9] whitespace-nowrap">
                  <i class="fa-solid fa-list-check text-[10px] text-[#087F70]"></i>
                  <span>${s.blueprint_count != null ? s.blueprint_count : (s.blueprints_count || 0)} SOPs</span>
                </span>
              </div>
            </div>

            <!-- Actions: Prominent Primary Button + Secondary Row -->
            <div class="pt-3 border-t border-[#E6ECE9] space-y-2">
              <button type="button" class="btn-view-service-tasks w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-[#087F70] hover:bg-[#06685c] text-white shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation select-none" data-id="${s.id}">
                <i class="fa-solid fa-list-check text-xs"></i>
                <span>View &amp; Edit Tasks (${s.blueprint_count != null ? s.blueprint_count : (s.blueprints_count || 0)})</span>
              </button>
              <div class="flex items-center gap-2">
                <button type="button" class="btn-manage-service flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-[#F7FAF9] hover:bg-[#EAF5F1] text-[#202D2A] border border-[#E6ECE9] hover:border-[#087F70]/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation select-none" data-id="${s.id}">
                  <i class="fa-solid fa-sliders text-[11px] text-[#74817D]"></i>
                  <span>Manage</span>
                </button>
                <button type="button" class="btn-delete-service p-2 w-10 h-8 rounded-xl text-xs font-semibold text-[#74817D] hover:text-rose-600 bg-[#F7FAF9] hover:bg-rose-50 border border-[#E6ECE9] hover:border-rose-200 transition-all flex items-center justify-center cursor-pointer touch-manipulation shrink-0 select-none" data-id="${s.id}" title="Permanently Delete Service" aria-label="Delete Service">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Wire View & Edit Tasks
      grid.querySelectorAll('.btn-view-service-tasks').forEach(b => {
        b.addEventListener('click', () => openServiceTasksWorkspace(b.dataset.id));
      });

      // Wire Manage Service
      grid.querySelectorAll('.btn-manage-service').forEach(b => {
        b.addEventListener('click', () => openEditServiceModal(b.dataset.id));
      });

      // Wire Delete Service
      grid.querySelectorAll('.btn-delete-service').forEach(b => {
        b.addEventListener('click', () => openDeleteServiceModal(b.dataset.id));
      });
    }
  }

  // Open Full-Page Task Blueprint Workspace (Phase 7)
  async function openServiceTasksWorkspace(serviceId) {
    state.selectedServiceId = serviceId;
    switchTab('service_tasks', false);
    window.location.hash = `service-tasks-${serviceId}`;

    const titleEl = document.getElementById('serviceTasksTitle');
    const codeEl = document.getElementById('serviceTasksCodeBadge');
    const verEl = document.getElementById('serviceTasksVersionBadge');
    const descEl = document.getElementById('serviceTasksDescription');

    // Ensure services cache is populated
    if (!state.servicesCache || state.servicesCache.length === 0) {
      const catRes = await apiFetch('/services/catalog');
      if (catRes.ok && catRes.data?.data) {
        state.servicesCache = catRes.data.data;
      }
    }

    const service = state.servicesCache?.find(s => s.id === serviceId);
    if (service) {
      if (titleEl) titleEl.textContent = service.name;
      if (codeEl) codeEl.textContent = service.code;
      if (verEl) verEl.textContent = `v${service.version || 1}`;
      if (descEl) descEl.textContent = service.description || `Master ${service.blueprint_count || 20}-Task SOP Blueprint Library`;
    }

    const res = await apiFetch(`/services/${serviceId}/blueprints`);
    if (!res.ok || !res.data || !res.data.data) {
      showToast('Failed to load task blueprints.', 'error');
      return;
    }

    state.currentBlueprints = res.data.data;
    renderBlueprintsWorkspace();
  }

  function renderBlueprintsWorkspace() {
    const bps = state.currentBlueprints;

    // Categorize into 3 phases: Beginning (1-7), Intermediate (8-14), Advanced (15-20)
    const beginning = bps.filter(b => (b.phase || '').toLowerCase().includes('begin') || (b.sort_order <= 7 && !b.phase?.includes('Inter') && !b.phase?.includes('Adv')));
    const intermediate = bps.filter(b => (b.phase || '').toLowerCase().includes('inter') || (b.sort_order > 7 && b.sort_order <= 14));
    const advanced = bps.filter(b => (b.phase || '').toLowerCase().includes('adv') || b.sort_order > 14);

    const bCount = document.getElementById('phaseBeginningCount');
    if (bCount) bCount.textContent = `${beginning.length} Tasks`;
    const iCount = document.getElementById('phaseIntermediateCount');
    if (iCount) iCount.textContent = `${intermediate.length} Tasks`;
    const aCount = document.getElementById('phaseAdvancedCount');
    if (aCount) aCount.textContent = `${advanced.length} Tasks`;

    renderBlueprintPhaseGroup('blueprintsPhaseBeginning', beginning);
    renderBlueprintPhaseGroup('blueprintsPhaseIntermediate', intermediate);
    renderBlueprintPhaseGroup('blueprintsPhaseAdvanced', advanced);
  }

  function renderBlueprintPhaseGroup(containerId, list) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = '<p class="text-[#74817D] italic text-xs p-3">No tasks in this phase.</p>';
      return;
    }

    container.innerHTML = list.map(bp => {
      const priorityColors = {
        urgent: 'bg-rose-50 text-rose-700 border-rose-200',
        high: 'bg-amber-50 text-amber-700 border-amber-200',
        medium: 'bg-blue-50 text-blue-700 border-blue-200',
        low: 'bg-slate-50 text-slate-600 border-slate-200'
      };

      const hasExtraDetails = Boolean(bp.steps || bp.where_location || bp.qa_criteria);

      return `
        <div class="p-3 sm:p-5 rounded-2xl bg-[#FDFEFE] hover:bg-white border border-[#E6ECE9] hover:border-[#087F70]/30 shadow-2xs hover:shadow-xs transition-all space-y-2.5 sm:space-y-3 group" data-blueprint-id="${bp.id}">
          <!-- Top Row: Code Badge + Priority + Estimate -->
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-[#087F70] bg-[#EAF5F1] border border-[#087F70]/25 px-2.5 py-0.5 rounded-md whitespace-nowrap">${escapeHtml(bp.task_code || 'SOP')}</span>
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${priorityColors[bp.priority] || priorityColors.medium}">${escapeHtml(bp.priority || 'medium')}</span>
            </div>
            <div class="flex items-center gap-1.5 text-xs font-mono text-[#74817D]">
              <i class="fa-regular fa-clock text-[11px] text-[#74817D]/70"></i>
              <span>${bp.estimated_minutes || (bp.estimated_hours ? bp.estimated_hours * 60 : 60)} min</span>
            </div>
          </div>

          <!-- Task Title: Readable, naturally wrapping -->
          <div>
            <h4 class="text-sm sm:text-base font-bold text-[#202D2A] leading-snug break-words group-hover:text-[#087F70] transition-colors">${escapeHtml(bp.title)}</h4>
          </div>

          <!-- Operational Core: WHY (Strategic Objective) -->
          <div class="p-2.5 sm:p-3 rounded-xl bg-[#F7FAF9] border border-[#E6ECE9] space-y-1">
            <div class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#087F70]">
              <i class="fa-solid fa-bullseye text-[10px]"></i>
              <span>Why (Strategic Objective)</span>
            </div>
            <p class="text-xs sm:text-[13px] text-[#202D2A] leading-relaxed break-words">${escapeHtml(bp.why || bp.instructions || bp.description || 'Standard operational activity.')}</p>
          </div>

          <!-- Operational Core: DONE WHEN (Measurable Standard) -->
          <div class="p-2.5 sm:p-3 rounded-xl bg-white border border-[#E6ECE9] space-y-1">
            <div class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#202D2A]">
              <i class="fa-solid fa-circle-check text-[10px] text-[#087F70]"></i>
              <span>Done When (Measurable Standard)</span>
            </div>
            <p class="text-xs sm:text-[13px] text-[#202D2A] leading-relaxed break-words">${escapeHtml(bp.done_when || 'Verified milestone output.')}</p>
          </div>

          <!-- Expandable Detailed Specifications (Steps, QA, Location) -->
          ${hasExtraDetails ? `
            <div id="bp_details_${bp.id}" class="hidden pt-2 border-t border-[#E6ECE9] space-y-2.5 text-xs">
              ${bp.steps ? `
                <div class="space-y-1">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-[#74817D] block">Operational Steps:</span>
                  <div class="p-2 sm:p-2.5 rounded-xl bg-[#F7FAF9] border border-[#E6ECE9] text-xs text-[#202D2A] whitespace-pre-line leading-relaxed font-sans">${escapeHtml(bp.steps)}</div>
                </div>
              ` : ''}
              ${bp.where_location ? `
                <div class="flex items-center gap-1.5 text-xs text-[#74817D]">
                  <span class="font-semibold text-[#202D2A]">Location:</span>
                  <span class="truncate font-mono text-[11px]">${escapeHtml(bp.where_location)}</span>
                </div>
              ` : ''}
              ${bp.qa_criteria ? `
                <div class="p-2 sm:p-2.5 rounded-xl bg-[#EAF5F1]/60 border border-[#087F70]/20 text-xs text-[#087F70]">
                  <span class="font-bold uppercase text-[10px] tracking-wider block mb-0.5">QA Criteria:</span>
                  <span class="text-[#202D2A]">${escapeHtml(bp.qa_criteria)}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <!-- Card Action Controls & Expand Toggle -->
          <div class="pt-2 border-t border-[#E6ECE9] flex items-center justify-between gap-2 flex-wrap">
            <!-- Expand / Collapse Details Control -->
            ${hasExtraDetails ? `
              <button type="button" class="btn-toggle-bp-details text-xs font-semibold text-[#087F70] hover:text-[#06685c] flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-[#EAF5F1] transition-all cursor-pointer touch-manipulation select-none" data-target="bp_details_${bp.id}" aria-expanded="false">
                <span>Show Details</span>
                <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200 icon-chevron"></i>
              </button>
            ` : '<div class="text-[11px] text-[#74817D] italic">Core SOP Standard</div>'}

            <!-- Task Action Buttons: Edit, Duplicate, Delete -->
            <div class="flex items-center gap-1.5">
              <button type="button" class="btn-edit-blueprint px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F7FAF9] hover:bg-[#EAF5F1] text-[#202D2A] hover:text-[#087F70] border border-[#E6ECE9] hover:border-[#087F70]/30 transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation select-none" data-id="${bp.id}" title="Edit Task Blueprint">
                <i class="fa-solid fa-pen-to-square text-[11px]"></i>
                <span>Edit</span>
              </button>
              <button type="button" class="btn-duplicate-blueprint p-2 rounded-xl text-xs font-semibold text-[#74817D] hover:text-[#202D2A] bg-[#F7FAF9] hover:bg-slate-100 border border-[#E6ECE9] transition-all flex items-center justify-center cursor-pointer touch-manipulation select-none" data-id="${bp.id}" title="Duplicate Task Blueprint" aria-label="Duplicate Task">
                <i class="fa-solid fa-copy text-xs"></i>
              </button>
              <button type="button" class="btn-delete-blueprint p-2 rounded-xl text-xs font-semibold text-[#74817D] hover:text-rose-600 bg-[#F7FAF9] hover:bg-rose-50 border border-[#E6ECE9] hover:border-rose-200 transition-all flex items-center justify-center cursor-pointer touch-manipulation select-none" data-id="${bp.id}" title="Delete Task Blueprint" aria-label="Delete Task">
                <i class="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Wire edit buttons
    container.querySelectorAll('.btn-edit-blueprint').forEach(b => {
      b.addEventListener('click', () => openEditBlueprintModal(b.dataset.id));
    });

    // Wire duplicate buttons
    container.querySelectorAll('.btn-duplicate-blueprint').forEach(b => {
      b.addEventListener('click', async () => {
        const id = b.dataset.id;
        const dupRes = await apiFetch(`/services/blueprints/${id}/duplicate`, { method: 'POST' });
        if (dupRes.ok && dupRes.data && dupRes.data.success) {
          showToast(`Task duplicated as [${dupRes.data.data.taskCode}]!`, 'success');
          openServiceTasksWorkspace(state.selectedServiceId);
        } else {
          showToast('Failed to duplicate blueprint.', 'error');
        }
      });
    });

    // Wire delete blueprint buttons (Hard Delete confirmation)
    container.querySelectorAll('.btn-delete-blueprint').forEach(b => {
      b.addEventListener('click', () => {
        openDeleteBlueprintModal(b.dataset.id);
      });
    });

    // Wire expandable detail toggles
    container.querySelectorAll('.btn-toggle-bp-details').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const details = document.getElementById(targetId);
        if (!details) return;
        const isHidden = details.classList.contains('hidden');
        if (isHidden) {
          details.classList.remove('hidden');
          btn.setAttribute('aria-expanded', 'true');
          const span = btn.querySelector('span');
          if (span) span.textContent = 'Hide Details';
          const icon = btn.querySelector('.icon-chevron');
          if (icon) icon.classList.add('rotate-180');
        } else {
          details.classList.add('hidden');
          btn.setAttribute('aria-expanded', 'false');
          const span = btn.querySelector('span');
          if (span) span.textContent = 'Show Details';
          const icon = btn.querySelector('.icon-chevron');
          if (icon) icon.classList.remove('rotate-180');
        }
      });
    });
  }

  function openEditBlueprintModal(blueprintId) {
    const bp = state.currentBlueprints.find(b => b.id === blueprintId);
    if (!bp) return;

    const modal = document.getElementById('modalEditBlueprint');
    if (!modal) return;

    document.getElementById('editBlueprintId').value = bp.id;
    document.getElementById('editBlueprintTaskCode').value = bp.task_code || '';
    document.getElementById('editBlueprintTitle').value = bp.title || '';
    document.getElementById('editBlueprintPhase').value = bp.phase || 'Beginning';
    document.getElementById('editBlueprintPriority').value = bp.priority || 'medium';
    document.getElementById('editBlueprintSortOrder').value = bp.sort_order || 1;
    document.getElementById('editBlueprintEstMinutes').value = bp.estimated_minutes || 60;
    document.getElementById('editBlueprintWhy').value = bp.why || '';
    document.getElementById('editBlueprintWhere').value = bp.where_location || '';
    document.getElementById('editBlueprintSteps').value = bp.steps || bp.instructions || '';
    document.getElementById('editBlueprintDoneWhen').value = bp.done_when || '';
    document.getElementById('editBlueprintQACriteria').value = bp.qa_criteria || '';
    initGlassSelects();

    modal.classList.remove('hidden');
  }

  function openDeleteBlueprintModal(blueprintId) {
    const bp = state.currentBlueprints.find(b => b.id === blueprintId);
    if (!bp) {
      showToast('Task blueprint not found.', 'error');
      return;
    }

    state.selectedBlueprintId = blueprintId;
    const currentService = state.servicesCache.find(s => s.id === (bp.service_id || state.selectedServiceId));

    const codeEl = document.getElementById('deleteBlueprintTaskCode');
    const titleEl = document.getElementById('deleteBlueprintTaskTitle');
    const srvEl = document.getElementById('deleteBlueprintServiceName');
    const modal = document.getElementById('modalDeleteBlueprint');

    if (codeEl) codeEl.textContent = bp.task_code || bp.id;
    if (titleEl) titleEl.textContent = bp.title || 'Untitled Task';
    if (srvEl) srvEl.textContent = currentService ? currentService.name : (bp.service_id || 'Service');

    const confirmBtn = document.getElementById('btnConfirmDeleteBlueprint');
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="fa-solid fa-trash-can text-xs"></i> <span>Permanently Delete Task</span>';
    }

    if (modal) modal.classList.remove('hidden');
  }

  function openEditServiceModal(serviceId) {
    const service = state.servicesCache.find(s => s.id === serviceId);
    if (!service) return;

    const modal = document.getElementById('modalEditService');
    if (!modal) return;

    document.getElementById('editServiceId').value = service.id;
    document.getElementById('editServiceName').value = service.name || '';
    document.getElementById('editServiceCode').value = service.code || '';
    document.getElementById('editServiceCategory').value = service.category || '';
    document.getElementById('editServicePrice').value = ((service.standard_price_cents || 100000) / 100).toFixed(0);
    document.getElementById('editServicePackage').value = service.default_package || 'Standard Retainer';
    document.getElementById('editServiceDescription').value = service.description || '';
    document.getElementById('editServiceIsActive').checked = service.is_active === 1;

    modal.classList.remove('hidden');
  }

  async function openDeleteServiceModal(serviceId) {
    const service = state.servicesCache.find(s => s.id === serviceId);
    if (!service) {
      showToast('Service not found.', 'error');
      return;
    }

    state.selectedServiceId = serviceId;
    const modal = document.getElementById('modalDeleteService');
    if (!modal) return;

    const nameEl = document.getElementById('deleteServiceTargetName');
    const codeEl = document.getElementById('deleteServiceTargetCode');
    const countEl = document.getElementById('deleteServiceBlueprintCount');
    const catEl = document.getElementById('deleteServiceCategory');
    const depContainer = document.getElementById('deleteServiceDependencyContainer');
    const confirmSection = document.getElementById('deleteServiceConfirmSection');
    const expectedNameEl = document.getElementById('deleteServiceExpectedName');
    const confirmInput = document.getElementById('deleteServiceConfirmInput');
    const confirmBtn = document.getElementById('btnConfirmDeleteService');

    if (nameEl) nameEl.textContent = service.name;
    if (codeEl) codeEl.textContent = service.code || service.id;
    if (countEl) countEl.textContent = `${service.blueprint_count || 0} Tasks`;
    if (catEl) catEl.textContent = service.category || 'General';
    if (expectedNameEl) expectedNameEl.textContent = `"${service.name}"`;
    if (confirmInput) confirmInput.value = '';
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="fa-solid fa-trash-can text-xs"></i> <span>Permanently Delete Service</span>';
    }
    if (confirmSection) confirmSection.classList.add('hidden');

    if (depContainer) {
      depContainer.innerHTML = `
        <div class="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
          <i class="fa-solid fa-circle-notch fa-spin text-brand-whiz"></i>
          <span>Checking database dependencies & live client records...</span>
        </div>
      `;
    }

    modal.classList.remove('hidden');

    try {
      const res = await apiFetch(`/services/${serviceId}/delete-check`);
      if (!res.ok || !res.data || !res.data.data) {
        if (depContainer) {
          depContainer.innerHTML = `
            <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <p class="font-bold">Failed to verify dependencies.</p>
              <p class="text-[11px] mt-0.5">Could not confirm safe deletion status. Please retry.</p>
            </div>
          `;
        }
        return;
      }

      const check = res.data.data;
      if (!check.canDelete) {
        const dep = check.dependencies || {};
        if (depContainer) {
          depContainer.innerHTML = `
            <div class="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div class="flex items-center gap-2 font-bold text-amber-800">
                <i class="fa-solid fa-triangle-exclamation text-amber-600 text-sm"></i>
                <span>Deletion Blocked: Active Dependencies Detected</span>
              </div>
              <p class="text-[11px] leading-relaxed text-amber-800/90">
                This service cannot be deleted because it is currently linked to authoritative client and financial records:
              </p>
              <div class="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                <div class="p-2 rounded-xl bg-white/80 border border-amber-200">
                  <span class="block text-sm font-black text-amber-900">${dep.clientServicesCount || 0}</span>
                  <span class="text-[9px] uppercase font-bold text-amber-700">Client Agrmts</span>
                </div>
                <div class="p-2 rounded-xl bg-white/80 border border-amber-200">
                  <span class="block text-sm font-black text-amber-900">${dep.projectsCount || 0}</span>
                  <span class="text-[9px] uppercase font-bold text-amber-700">Projects</span>
                </div>
                <div class="p-2 rounded-xl bg-white/80 border border-amber-200">
                  <span class="block text-sm font-black text-amber-900">${dep.invoicesCount || 0}</span>
                  <span class="text-[9px] uppercase font-bold text-amber-700">Invoices</span>
                </div>
              </div>
              <p class="text-[11px] text-amber-800 italic pt-1">
                To delete this service, unassign or conclude all linked client contracts and projects first.
              </p>
            </div>
          `;
        }
        if (confirmSection) confirmSection.classList.add('hidden');
        if (confirmBtn) confirmBtn.disabled = true;
      } else {
        if (depContainer) {
          depContainer.innerHTML = `
            <div class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
              <div class="flex items-center gap-2 font-bold text-emerald-800">
                <i class="fa-solid fa-shield-check text-emerald-600 text-sm"></i>
                <span>0 Live Dependencies — Safe to Permanently Purge</span>
              </div>
              <p class="text-[11px] text-emerald-800/90 leading-relaxed">
                No active client contracts, projects, or invoices reference this service.
                Permanently deleting it will purge the service catalog record and all <strong>${check.taskBlueprintCount || 0} master SOP blueprints</strong>.
              </p>
            </div>
          `;
        }
        if (confirmSection) confirmSection.classList.remove('hidden');
        if (confirmInput) confirmInput.focus();
      }
    } catch (err) {
      if (depContainer) {
        depContainer.innerHTML = `
          <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <p class="font-bold">Dependency check failed.</p>
          </div>
        `;
      }
    }
  }

  // =========================================================================
  // 4. SERVICE PROJECTS (Phase 10)
  // =========================================================================
  async function loadProjectsData() {
    const res = await apiFetch('/projects');
    const tbody = document.getElementById('adminProjectsTableBody');
    const cardsContainer = document.getElementById('adminProjectsCardsContainer');
    if (!tbody) return;

    if (res.ok && res.data && res.data.data) {
      state.projectsCache = res.data.data;
      const projects = state.projectsCache;

      const actCount = document.getElementById('statActiveProjects');
      if (actCount) actCount.textContent = projects.length;

      if (projects.length === 0) {
        const emptyMsg = '<tr><td colspan="6" class="px-6 py-6 text-center text-slate-500 italic">No active projects. Add a client with services to auto-provision projects.</td></tr>';
        tbody.innerHTML = emptyMsg;
        if (cardsContainer) cardsContainer.innerHTML = '<div class="p-6 rounded-2xl bg-white border border-[#E3E9EF] text-center text-xs text-slate-500 italic">No active projects provisioned yet.</div>';
        return;
      }

      // Desktop Table
      tbody.innerHTML = projects.map(p => {
        const percent = p.progress_percent || 0;
        return `
          <tr class="hover:bg-slate-50 transition-colors border-b border-[#E3E9EF]">
            <td class="px-6 py-4 font-bold text-[#172B36]">${p.name}</td>
            <td class="px-6 py-4 text-slate-600">${p.organization_name || 'Organization'}</td>
            <td class="px-6 py-4 font-mono text-xs text-[#147D64] font-semibold">${p.service_name || 'Service'}</td>
            <td class="px-6 py-4">
              <div class="flex items-center space-x-2">
                <div class="w-24 bg-slate-100 h-2 border border-[#E3E9EF] rounded-full overflow-hidden">
                  <div class="bg-[#147D64] h-full rounded-full transition-all duration-500" style="width: ${percent}%"></div>
                </div>
                <span class="text-xs font-mono font-bold text-[#172B36]">${percent}%</span>
              </div>
            </td>
            <td class="px-6 py-4">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">${p.status || 'Active'}</span>
            </td>
            <td class="px-6 py-4 text-right font-mono text-slate-500 text-xs">
              ${p.completed_tasks || 0} / ${p.total_tasks || 20}
            </td>
          </tr>
        `;
      }).join('');

      // Mobile Cards
      if (cardsContainer) {
        cardsContainer.innerHTML = projects.map(p => {
          const percent = p.progress_percent || 0;
          return `
            <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] shadow-xs space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h4 class="text-sm font-black text-[#172B36]">${p.name}</h4>
                  <p class="text-xs text-slate-500">${p.organization_name || 'Organization'}</p>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">${p.status || 'Active'}</span>
              </div>

              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-xs font-semibold">
                  <span class="text-[#147D64]">${p.service_name || 'Service'}</span>
                  <span class="font-mono text-[#172B36]">${percent}% Complete</span>
                </div>
                <div class="w-full bg-slate-100 h-2 border border-[#E3E9EF] rounded-full overflow-hidden">
                  <div class="bg-[#147D64] h-full rounded-full" style="width: ${percent}%"></div>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>Completed Tasks</span>
                <span class="font-mono font-bold text-slate-700">${p.completed_tasks || 0} of ${p.total_tasks || 20}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  // =========================================================================
  // 5. LIVE OPERATIONAL TASKS (Phase 11 - WHIZ Smart Task Workspace)
  // =========================================================================
  async function loadTasksData(filterStatus = null) {
    if (filterStatus) {
      state.currentTaskStatus = filterStatus;
      updateStatusFilterButtons(filterStatus);
    } else if (!state.currentTaskStatus) {
      state.currentTaskStatus = 'all';
    }

    const list = document.getElementById('adminLiveTasksList');
    if (!list) return;

    // Show loading state if cache is empty
    if (!state.tasksCache || state.tasksCache.length === 0) {
      list.innerHTML = `
        <div class="p-8 rounded-2xl bg-white border border-[#E6ECE9] text-center space-y-2 shadow-2xs">
          <i class="fa-solid fa-circle-notch fa-spin text-lg text-[#087F70]"></i>
          <p class="text-xs text-[#74817D]">Loading operational tasks...</p>
        </div>
      `;
    }

    const res = await apiFetch('/portal/admin/live-tasks');

    if (!res.ok || !res.data || !res.data.data) {
      const errMsg = res.data?.error || 'Unable to connect to live tasks database.';
      list.innerHTML = `
        <div class="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-rose-200 text-center space-y-3 shadow-2xs">
          <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-lg border border-rose-200/60 shadow-2xs">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div class="space-y-1">
            <h4 class="text-sm sm:text-base font-bold text-[#202D2A]">Failed to Load Operational Tasks</h4>
            <p class="text-xs text-[#74817D] max-w-sm mx-auto leading-relaxed">${escapeHtml(errMsg)}</p>
          </div>
          <button type="button" id="btnRetryLoadTasks" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#087F70] hover:bg-[#06685c] text-white shadow-2xs transition-all cursor-pointer touch-manipulation select-none">
            <i class="fa-solid fa-rotate-right text-xs"></i>
            <span>Retry Connection</span>
          </button>
        </div>
      `;
      document.getElementById('btnRetryLoadTasks')?.addEventListener('click', () => loadTasksData());
      return;
    }

    state.tasksCache = res.data.data;
    renderFilteredTasks();
  }

  function renderFilteredTasks() {
    const list = document.getElementById('adminLiveTasksList');
    if (!list) return;

    const allTasks = state.tasksCache || [];
    const searchInput = document.getElementById('taskSearchInput');
    const prioritySelect = document.getElementById('taskPriorityFilter');
    const clearSearchBtn = document.getElementById('btnClearTaskSearch');

    const searchVal = (searchInput?.value || '').trim().toLowerCase();
    const priorityVal = (prioritySelect?.value || 'all').toLowerCase();
    const statusVal = state.currentTaskStatus || 'all';

    if (clearSearchBtn) {
      clearSearchBtn.classList.toggle('hidden', !searchVal);
    }

    // Case 1: Database has zero tasks across all projects
    if (allTasks.length === 0) {
      list.innerHTML = `
        <div class="p-8 sm:p-12 rounded-2xl sm:rounded-3xl bg-white border border-[#E6ECE9] text-center space-y-3.5 shadow-2xs">
          <div class="w-14 h-14 rounded-2xl bg-[#EAF5F1] text-[#087F70] flex items-center justify-center mx-auto text-xl border border-[#087F70]/25 shadow-2xs">
            <i class="fa-solid fa-clipboard-check"></i>
          </div>
          <div class="space-y-1">
            <h4 class="text-base sm:text-lg font-bold text-[#202D2A]">No active tasks yet</h4>
            <p class="text-xs sm:text-sm text-[#74817D] max-w-sm mx-auto leading-relaxed">Tasks assigned to active projects will appear here.</p>
          </div>
        </div>
      `;
      return;
    }

    // Filter tasks
    const filtered = allTasks.filter(t => {
      // Status filter: pending matches any incomplete task
      if (statusVal === 'completed' && t.status !== 'completed') return false;
      if (statusVal === 'pending' && t.status === 'completed') return false;

      // Priority filter
      if (priorityVal !== 'all' && (t.priority || '').toLowerCase() !== priorityVal) return false;

      // Search filter
      if (searchVal) {
        const title = (t.title || '').toLowerCase();
        const project = (t.project_name || '').toLowerCase();
        const org = (t.organization_name || t.client_name || '').toLowerCase();
        const code = (t.task_code || t.id || '').toLowerCase();
        if (!title.includes(searchVal) && !project.includes(searchVal) && !org.includes(searchVal) && !code.includes(searchVal)) {
          return false;
        }
      }

      return true;
    });

    // Update count badge if present
    const countBadge = document.getElementById('liveTasksCountBadge');
    if (countBadge) {
      countBadge.textContent = `${filtered.length} of ${allTasks.length} Tasks`;
    }

    // Case 2: Filters active, but no matching tasks
    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="p-8 sm:p-12 rounded-2xl sm:rounded-3xl bg-white border border-[#E6ECE9] text-center space-y-3.5 shadow-2xs">
          <div class="w-14 h-14 rounded-2xl bg-[#F7FAF9] text-[#74817D] flex items-center justify-center mx-auto text-xl border border-[#E6ECE9] shadow-2xs">
            <i class="fa-solid fa-filter-circle-xmark"></i>
          </div>
          <div class="space-y-1">
            <h4 class="text-base sm:text-lg font-bold text-[#202D2A]">No matching tasks</h4>
            <p class="text-xs sm:text-sm text-[#74817D] max-w-sm mx-auto leading-relaxed">Try changing your search or filters.</p>
          </div>
          <div>
            <button type="button" id="btnClearTaskFilters" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#EAF5F1] hover:bg-[#087F70] text-[#087F70] hover:text-white border border-[#087F70]/25 transition-all cursor-pointer touch-manipulation select-none shadow-2xs">
              <i class="fa-solid fa-xmark text-xs"></i>
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      `;

      document.getElementById('btnClearTaskFilters')?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (prioritySelect) prioritySelect.value = 'all';
        state.currentTaskStatus = 'all';
        updateStatusFilterButtons('all');
        renderFilteredTasks();
      });
      return;
    }

    // Priority color mapping
    const priorityColors = {
      urgent: 'bg-rose-50 text-rose-700 border-rose-200',
      high: 'bg-amber-50 text-amber-700 border-amber-200',
      medium: 'bg-blue-50 text-blue-700 border-blue-200',
      low: 'bg-slate-50 text-slate-600 border-slate-200'
    };

    // Render task cards
    list.innerHTML = filtered.map(t => {
      const isCompleted = t.status === 'completed';
      const statusLabel = isCompleted ? 'Completed' : (t.status === 'in_progress' ? 'In Progress' : (t.status === 'review' ? 'In Review' : 'Pending'));
      const statusClass = isCompleted 
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
        : 'bg-[#EAF5F1] text-[#087F70] border-[#087F70]/25';

      return `
        <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E6ECE9] hover:border-[#087F70]/30 shadow-2xs hover:shadow-xs transition-all space-y-3 group ${isCompleted ? 'bg-[#FDFEFE]/80' : ''}" data-task-id="${t.id}">
          <!-- Top Row: Priority Badge + Status Badge + Progress -->
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${priorityColors[t.priority] || priorityColors.medium}">
                ${escapeHtml(t.priority || 'medium')}
              </span>
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusClass}">
                ${statusLabel}
              </span>
            </div>
            <div class="flex items-center gap-1.5 text-xs font-mono font-bold text-[#087F70]">
              <i class="fa-solid fa-chart-pie text-[11px] text-[#087F70]/70"></i>
              <span>${t.progress_percent || 0}% Proj</span>
            </div>
          </div>

          <!-- Middle Row: Checkbox + Title -->
          <div class="flex items-start gap-3">
            <div class="pt-0.5 shrink-0">
              <input type="checkbox" class="task-checkbox w-5 h-5 rounded-md text-[#087F70] bg-white border-[#CBD5E1] cursor-pointer focus:ring-2 focus:ring-[#087F70]/20 transition-all select-none" data-id="${t.id}" ${isCompleted ? 'checked' : ''} aria-label="Mark task complete">
            </div>
            <div class="min-w-0 flex-1 space-y-1">
              <h4 class="text-sm sm:text-base font-bold text-[#202D2A] leading-snug break-words group-hover:text-[#087F70] transition-colors ${isCompleted ? 'line-through text-[#74817D]/70' : ''}">
                ${escapeHtml(t.title)}
              </h4>
              ${t.description ? `<p class="text-xs text-[#74817D] line-clamp-2 leading-relaxed">${escapeHtml(t.description)}</p>` : ''}
            </div>
          </div>

          <!-- Context Row: Project, Client, Deadline, Details Button -->
          <div class="pt-2 border-t border-[#E6ECE9] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div class="flex flex-wrap items-center gap-2 text-[#74817D] min-w-0">
              <div class="inline-flex items-center gap-1.5 font-medium truncate max-w-[220px]" title="${escapeHtml(t.project_name || 'Active Project')}">
                <i class="fa-solid fa-folder-tree text-[11px] text-[#087F70] shrink-0"></i>
                <span class="truncate text-[#202D2A]">${escapeHtml(t.project_name || 'Active Project')}</span>
              </div>
              ${t.organization_name || t.client_name ? `
                <span class="text-[#CBD5E1]">•</span>
                <div class="inline-flex items-center gap-1 font-medium truncate max-w-[180px]" title="${escapeHtml(t.organization_name || t.client_name)}">
                  <i class="fa-regular fa-building text-[10px] text-[#74817D] shrink-0"></i>
                  <span class="truncate">${escapeHtml(t.organization_name || t.client_name)}</span>
                </div>
              ` : ''}
              ${t.deadline ? `
                <span class="text-[#CBD5E1]">•</span>
                <div class="inline-flex items-center gap-1 text-[11px] font-mono text-[#74817D]">
                  <i class="fa-regular fa-calendar text-[10px]"></i>
                  <span>${escapeHtml(t.deadline)}</span>
                </div>
              ` : ''}
            </div>

            <!-- Action Button -->
            <div class="flex items-center gap-2 shrink-0 ml-auto">
              <button type="button" class="btn-live-task-detail px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F7FAF9] hover:bg-[#EAF5F1] text-[#202D2A] hover:text-[#087F70] border border-[#E6ECE9] hover:border-[#087F70]/30 transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation select-none" data-id="${t.id}">
                <i class="fa-solid fa-circle-info text-[11px]"></i>
                <span>Details</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Wire task checkbox completion
    list.querySelectorAll('.task-checkbox').forEach(cb => {
      cb.addEventListener('change', async () => {
        const taskId = cb.dataset.id;
        const res = await apiFetch(`/projects/tasks/${taskId}/complete`, {
          method: 'PUT',
          body: JSON.stringify({ notes: 'Completed via Super Admin Console' })
        });
        if (res.ok && res.data && res.data.success) {
          showToast(`Task updated! Project progress is now ${res.data.data.newProgressPercent}%.`, 'success');
          const localTask = state.tasksCache.find(t => t.id === taskId);
          if (localTask) {
            localTask.status = cb.checked ? 'completed' : 'todo';
          }
          renderFilteredTasks();
          loadProjectsData();
        } else {
          showToast('Failed to update task status.', 'error');
          cb.checked = !cb.checked;
        }
      });
    });

    // Wire live task details
    list.querySelectorAll('.btn-live-task-detail').forEach(btn => {
      btn.addEventListener('click', () => {
        const task = state.tasksCache.find(t => t.id === btn.dataset.id);
        if (!task) return;

        const modal = document.getElementById('modalLiveTaskDetail');
        if (!modal) return;

        document.getElementById('liveTaskId').value = task.id;
        const modalTitle = document.getElementById('liveTaskModalTitle');
        if (modalTitle) {
          modalTitle.innerHTML = `<i class="fa-solid fa-list-check text-[#087F70]"></i><span>${escapeHtml(task.title)}</span>`;
        }
        const modalProject = document.getElementById('liveTaskModalProject');
        if (modalProject) {
          modalProject.textContent = `${task.project_name || 'Project'} (${task.organization_name || task.client_name || 'Client'})`;
        }
        const modalDesc = document.getElementById('liveTaskModalDesc');
        if (modalDesc) {
          modalDesc.textContent = task.description || 'Standard task execution blueprint.';
        }
        const modalStatus = document.getElementById('liveTaskStatus');
        if (modalStatus) modalStatus.value = task.status || 'todo';
        const modalPriority = document.getElementById('liveTaskPriority');
        if (modalPriority) modalPriority.value = task.priority || 'medium';
        const modalNotes = document.getElementById('liveTaskNotes');
        if (modalNotes) modalNotes.value = task.internal_notes || '';
        initGlassSelects();

        modal.classList.remove('hidden');
      });
    });
  }

  function updateStatusFilterButtons(activeFilter) {
    document.querySelectorAll('.task-filter-btn').forEach(b => {
      const isTarget = b.dataset.filter === activeFilter;
      if (isTarget) {
        b.classList.add('bg-[#EAF5F1]', 'text-[#087F70]', 'font-bold', 'border-[#087F70]/25', 'shadow-2xs');
        b.classList.remove('text-[#74817D]', 'border-transparent', 'font-semibold');
      } else {
        b.classList.remove('bg-[#EAF5F1]', 'text-[#087F70]', 'font-bold', 'border-[#087F70]/25', 'shadow-2xs');
        b.classList.add('text-[#74817D]', 'border-transparent', 'font-semibold');
      }
    });
  }

  // =========================================================================
  // 6. FINANCE & PAYMENTS
  // =========================================================================
  // Store payments in state cache for modal operations
  let paymentsCache = [];

  async function loadFinanceData() {
    initFinanceSubtabs();
    const res = await apiFetch('/finance/payments');
    const tbody = document.getElementById('adminPaymentsTableBody');
    const cardsContainer = document.getElementById('adminFinanceCardsContainer');
    if (!tbody) return;

    if (res.ok && res.data && res.data.data) {
      const payments = res.data.data;
      paymentsCache = payments;

      if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-6 text-center text-slate-500 italic">No payments recorded. Click "Record New Payment" above.</td></tr>';
        if (cardsContainer) cardsContainer.innerHTML = '<div class="p-6 rounded-2xl bg-white border border-[#E3E9EF] text-center text-slate-500 italic">No payments recorded.</div>';
        return;
      }

      // Desktop Table
      tbody.innerHTML = payments.map(p => {
        const isVoided = (p.financial_notes && p.financial_notes.includes('[VOIDED]')) || (p.payment_reference && p.payment_reference.startsWith('VOIDED'));
        const formattedAmount = formatCurrency(p.amount_cents || 0, p.currency || "USD");

        return `
          <tr class="hover:bg-slate-50/80 transition-colors border-b border-[#E3E9EF] ${isVoided ? 'opacity-60 bg-rose-50/20' : ''}">
            <td class="px-6 py-4 font-mono font-bold text-brand-whiz">
              ${p.receipt_number}
              ${isVoided ? '<span class="ml-2 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">VOIDED</span>' : ''}
            </td>
            <td class="px-6 py-4">
              <div class="font-bold text-[#172B36]">${p.organization_name || 'Client'}</div>
              <div class="text-[11px] text-slate-500 font-mono">${p.invoice_number || 'INV-DIRECT'}</div>
            </td>
            <td class="px-6 py-4 font-mono font-bold ${isVoided ? 'line-through text-slate-400' : 'text-brand-whiz'}">${formattedAmount}</td>
            <td class="px-6 py-4 uppercase text-slate-500 text-xs font-semibold">${(p.payment_method || 'card').replace('_', ' ')}</td>
            <td class="px-6 py-4 text-slate-500 text-xs">${p.payment_date || 'N/A'}</td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end space-x-1.5">
                                <button type="button" class="btn-edit-payment-admin px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer" data-id="${p.id}" title="Edit Metadata">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button type="button" class="btn-correct-payment-admin px-2 py-1 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer" data-id="${p.id}" title="Financial Correction">
                  <i class="fa-solid fa-scale-balanced"></i>
                </button>
                ${!isVoided && state.adminProfile?.role !== 'accounts' ? `
                  <button type="button" class="btn-void-payment-admin px-2 py-1 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer" data-id="${p.id}" title="Void Payment">
                    <i class="fa-solid fa-ban"></i>
                  </button>
                ` : ''}
                ${state.adminProfile?.role !== 'accounts' ? `
                  <button type="button" class="btn-delete-payment-admin px-2 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer" data-id="${p.id}" title="Delete Test Payment">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Mobile Responsive Cards
      if (cardsContainer) {
        cardsContainer.innerHTML = payments.map(p => {
          const isVoided = (p.financial_notes && p.financial_notes.includes('[VOIDED]')) || (p.payment_reference && p.payment_reference.startsWith('VOIDED'));
          const formattedAmount = formatCurrency(p.amount_cents || 0, p.currency || "USD");

          return `
            <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] shadow-sm space-y-3 ${isVoided ? 'opacity-60 bg-rose-50/20' : ''}">
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-mono text-xs font-bold text-brand-whiz">${p.receipt_number}</span>
                  ${isVoided ? '<span class="ml-2 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">VOIDED</span>' : ''}
                </div>
                <div class="font-mono font-bold text-sm ${isVoided ? 'line-through text-slate-400' : 'text-brand-whiz'}">${formattedAmount}</div>
              </div>

              <div class="space-y-1 text-xs">
                <div class="font-bold text-[#172B36]">${p.organization_name || 'Client'}</div>
                <div class="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Invoice: <strong class="font-mono text-slate-700">${p.invoice_number || 'INV-DIRECT'}</strong></span>
                  <span>${p.payment_date || 'N/A'}</span>
                </div>
                <div class="text-[11px] text-slate-500 uppercase">
                  Method: <strong class="text-slate-700">${(p.payment_method || 'card').replace('_', ' ')}</strong>
                </div>
              </div>

              <div class="flex items-center justify-end gap-1.5 pt-2 border-t border-[#E3E9EF]">
                                <button type="button" class="btn-edit-payment-admin px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer" data-id="${p.id}">
                  Edit
                </button>
                <button type="button" class="btn-correct-payment-admin px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 cursor-pointer" data-id="${p.id}">
                  Correct
                </button>
                ${!isVoided && state.adminProfile?.role !== 'accounts' ? `
                  <button type="button" class="btn-void-payment-admin px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer" data-id="${p.id}" title="Void">
                    <i class="fa-solid fa-ban"></i>
                  </button>
                ` : ''}
                ${state.adminProfile?.role !== 'accounts' ? `
                  <button type="button" class="btn-delete-payment-admin px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-600 cursor-pointer" data-id="${p.id}" title="Delete">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('');
      }

      // Attach Event Listeners
      const attachListeners = (container) => {
        if (!container) return;

        
        // Edit Payment Details Modal
        container.querySelectorAll('.btn-edit-payment-admin').forEach(b => {
          b.addEventListener('click', () => {
            const pid = b.dataset.id;
            const p = paymentsCache.find(x => x.id === pid);
            if (!p) return;

            document.getElementById('editPaymentId').value = p.id;
            document.getElementById('editPaymentReceiptNum').textContent = p.receipt_number;
            document.getElementById('editPaymentInvoiceNum').textContent = p.invoice_number || 'INV-DIRECT';
            document.getElementById('editPaymentAmountDisplay').textContent = formatCurrency(p.amount_cents || 0, p.currency || 'USD');
            const epd = document.getElementById('editPaymentDate');
            if (epd) {
              epd.value = p.payment_date || new Date().toISOString().split('T')[0];
              if (typeof updateDatePickerTrigger === 'function') updateDatePickerTrigger(epd);
            }
            document.getElementById('editPaymentMethod').value = p.payment_method || 'bank_transfer';
            document.getElementById('editPaymentReference').value = p.payment_reference || '';
            document.getElementById('editPaymentNotes').value = p.financial_notes || '';
            initGlassSelects();

            document.getElementById('modalEditPayment')?.classList.remove('hidden');
          });
        });

        // Financial Correction Modal
        container.querySelectorAll('.btn-correct-payment-admin').forEach(b => {
          b.addEventListener('click', () => {
            const pid = b.dataset.id;
            const p = paymentsCache.find(x => x.id === pid);
            if (!p) return;

            document.getElementById('correctPaymentId').value = p.id;
            document.getElementById('correctOriginalAmountDisplay').textContent = formatCurrency(p.amount_cents || 0, p.currency || 'USD');
            document.getElementById('correctInvoiceNumDisplay').textContent = p.invoice_number || 'INV-DIRECT';
            document.getElementById('correctAmountInput').value = ((p.amount_cents || 0) / 100).toFixed(2);
            document.getElementById('correctCurrencySelect').value = p.currency || 'USD';
            document.getElementById('correctReasonInput').value = '';
            initGlassSelects();

            document.getElementById('modalCorrectPayment')?.classList.remove('hidden');
          });
        });

        // Void Payment
        container.querySelectorAll('.btn-void-payment-admin').forEach(b => {
          b.addEventListener('click', async () => {
            const pid = b.dataset.id;
            const p = paymentsCache.find(x => x.id === pid);
            if (!p) return;

            const confirmed = window.confirm(`Are you sure you want to VOID payment ${p.payment_number} (${formatCurrency(p.amount_cents, p.currency)})?\n\nThis will record an audited reversal and adjust the client invoice balance.`);
            if (!confirmed) return;

            const reason = window.prompt('Please enter the reason for voiding this payment:', 'Audited administrative reversal');
            if (!reason) return;

            const vRes = await apiFetch(`/finance/payments/${pid}/void`, {
              method: 'POST',
              body: JSON.stringify({ reason })
            });

            if (vRes.ok && vRes.data && vRes.data.success) {
              showToast(`Payment ${p.payment_number} voided successfully. Invoice balance adjusted.`, 'success');
              loadFinanceData();
            } else {
              showToast(vRes.data?.error || 'Failed to void payment.', 'error');
            }
          });
        });

        // Delete Disposable Test Payment
        container.querySelectorAll('.btn-delete-payment-admin').forEach(b => {
          b.addEventListener('click', async () => {
            const pid = b.dataset.id;
            const p = paymentsCache.find(x => x.id === pid);
            if (!p) return;

            const confirmed = window.confirm(`Permanently delete test payment ${p.payment_number} (${formatCurrency(p.amount_cents, p.currency)})?\n\nThis will remove the test payment record and recalculate invoice balances. This action cannot be undone.`);
            if (!confirmed) return;

            const dRes = await apiFetch(`/finance/payments/${pid}`, {
              method: 'DELETE'
            });

            if (dRes.ok && dRes.data && dRes.data.success) {
              showToast(`Payment ${p.payment_number} permanently removed from ledger.`, 'success');
              loadFinanceData();
            } else {
              showToast(dRes.data?.error || 'Failed to delete payment.', 'error');
            }
          });
        });
      };

      attachListeners(tbody);
      if (cardsContainer) attachListeners(cardsContainer);
    }
  }

  // =========================================================================
  // 7. USER & ACCESS MANAGEMENT (D1 DIRECTORY + ROLE GOVERNANCE)
  // =========================================================================
  
  // =========================================================================
  // WHIZ LIQUID GLASS SELECTION MENU CONTROLLER (PORTAL POPOVER ARCHITECTURE)
  // Renders dropdown popovers into an elevated body portal to prevent clipping
  // and stacking-context collision from parent cards or sibling containers.
  // =========================================================================
  let _activeGlassMenu = null;
  let _activeGlassTrigger = null;
  let _activeGlassWrapper = null;
  let _glassPortalElement = null;

  function getGlassPortal() {
    if (!_glassPortalElement || !document.body.contains(_glassPortalElement)) {
      _glassPortalElement = document.getElementById('whizGlassSelectPortal');
      if (!_glassPortalElement) {
        _glassPortalElement = document.createElement('div');
        _glassPortalElement.id = 'whizGlassSelectPortal';
        _glassPortalElement.className = 'whiz-glass-portal-root';
        _glassPortalElement.setAttribute('aria-hidden', 'false');
        _glassPortalElement.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:0;overflow:visible;pointer-events:none;z-index:10005;';
        document.body.appendChild(_glassPortalElement);
      } else {
        _glassPortalElement.style.zIndex = '10005';
        _glassPortalElement.style.pointerEvents = 'none';
      }
    }
    return _glassPortalElement;
  }

  function positionGlassMenu(triggerBtn, menuEl) {
    if (!triggerBtn || !menuEl) return;
    const rect = triggerBtn.getBoundingClientRect();

    // If trigger scrolled off screen, close gracefully
    if (rect.bottom < -30 || rect.top > window.innerHeight + 30) {
      closeActiveGlassMenu();
      return;
    }

    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const isMobile = vw < 768;
    const bottomNavReserve = isMobile ? 68 : 16;
    const topMargin = 12;

    // Estimate or measure menu height
    const menuHeight = menuEl.offsetHeight || menuEl.scrollHeight || 180;
    const spaceBelow = vh - rect.bottom - bottomNavReserve;
    const spaceAbove = rect.top - topMargin;

    let isDropup = false;
    let top = 0;
    let maxHeight = 270;

    // Viewport collision: if space below is less than required (or < 155) and space above is greater
    if (spaceBelow < Math.min(menuHeight, 155) && spaceAbove > spaceBelow) {
      isDropup = true;
      maxHeight = Math.max(110, Math.min(270, spaceAbove - 10));
      top = Math.max(topMargin, rect.top - Math.min(menuHeight, maxHeight) - 6);
    } else {
      isDropup = false;
      maxHeight = Math.max(110, Math.min(270, spaceBelow - 10));
      top = rect.bottom + 6;
    }

    let left = rect.left;
    let width = rect.width || triggerBtn.offsetWidth || 240;

    // Clamping for narrow mobile viewports (320px - 430px)
    const maxAllowedWidth = vw - 16;
    if (width > maxAllowedWidth) {
      width = maxAllowedWidth;
      left = 8;
    } else if (left + width > vw - 8) {
      left = Math.max(8, vw - width - 8);
    } else if (left < 8) {
      left = 8;
    }

    menuEl.classList.toggle('dropup', isDropup);
    menuEl.style.position = 'fixed';
    menuEl.style.top = Math.round(top) + 'px';
    menuEl.style.left = Math.round(left) + 'px';
    menuEl.style.width = Math.round(width) + 'px';
    menuEl.style.maxHeight = Math.round(maxHeight) + 'px';
    menuEl.style.zIndex = '10010';
    menuEl.style.pointerEvents = 'auto';
  }

  function closeActiveGlassMenu() {
    if (!_activeGlassMenu) return;
    const menuEl = _activeGlassMenu;
    const triggerBtn = _activeGlassTrigger;
    const wrapper = _activeGlassWrapper;

    menuEl.classList.remove('open', 'dropup');
    menuEl.style.display = 'none';
    triggerBtn?.classList.remove('active');
    triggerBtn?.setAttribute('aria-expanded', 'false');

    // Return menu to wrapper
    if (wrapper && menuEl.parentNode !== wrapper) {
      wrapper.appendChild(menuEl);
    }

    menuEl.style.position = '';
    menuEl.style.top = '';
    menuEl.style.left = '';
    menuEl.style.width = '';
    menuEl.style.maxHeight = '';
    menuEl.style.zIndex = '';
    menuEl.style.pointerEvents = '';

    _activeGlassMenu = null;
    _activeGlassTrigger = null;
    _activeGlassWrapper = null;
  }

  function initGlassSelects() {
    const wrappers = document.querySelectorAll('[data-glass-select]');
    wrappers.forEach(wrapper => {
      const selectEl = wrapper.querySelector('select');
      const triggerBtn = wrapper.querySelector('.glass-select-trigger');
      const menuEl = wrapper.querySelector('.glass-select-menu') || 
                     (document.getElementById('whizGlassSelectPortal')?.querySelector('[id="' + wrapper.dataset.glassSelect + 'Menu"]'));
      const labelSpan = triggerBtn?.querySelector('.select-label');
      const iconEl = triggerBtn?.querySelector('.select-icon');

      if (!triggerBtn || !menuEl) return;

      // Smart scrollbar containment: Ensure options live inside .glass-select-menu-inner
      const directOptions = Array.from(menuEl.children).filter(c => c.classList && c.classList.contains('glass-select-option'));
      if (directOptions.length > 0) {
        let innerEl = menuEl.querySelector('.glass-select-menu-inner');
        if (!innerEl) {
          innerEl = document.createElement('div');
          innerEl.className = 'glass-select-menu-inner';
          menuEl.appendChild(innerEl);
        }
        directOptions.forEach(opt => innerEl.appendChild(opt));
      } else if (!menuEl.querySelector('.glass-select-menu-inner')) {
        const searchBar = menuEl.querySelector('#paymentClientSearchInput')?.closest('.sticky') || menuEl.querySelector('.sticky');
        const existingList = menuEl.querySelector('#paymentClientOptionsList');
        if (existingList) {
          existingList.classList.add('glass-select-menu-inner');
        } else if (menuEl.children.length > 0) {
          const innerEl = document.createElement('div');
          innerEl.className = 'glass-select-menu-inner';
          const children = Array.from(menuEl.children);
          children.forEach(child => {
            if (child !== searchBar) {
              innerEl.appendChild(child);
            }
          });
          menuEl.appendChild(innerEl);
        }
      }

      const getOptions = () => Array.from(menuEl.querySelectorAll('.glass-select-option'));

      if (wrapper.dataset.glassInitialized === 'true') {
        // Sync trigger display and option highlights with current select value
        const val = selectEl?.value || '';
        const opts = getOptions();
        opts.forEach(opt => {
          const isMatch = opt.dataset.value === val;
          opt.classList.toggle('selected', isMatch);
          opt.setAttribute('aria-selected', isMatch ? 'true' : 'false');
          if (isMatch) {
            if (labelSpan) {
              const optText = opt.querySelector('.select-opt-text')?.textContent || opt.querySelector('span:not(.currency-badge)')?.textContent || opt.querySelector('span')?.textContent || opt.textContent.trim();
              labelSpan.textContent = optText;
            }
            const optIcon = opt.querySelector('.option-icon');
            if (optIcon && iconEl) {
              iconEl.className = optIcon.className.replace('option-icon', 'select-icon');
            }
            const symbolBadge = triggerBtn.querySelector('.select-currency-symbol');
            const optBadge = opt.querySelector('.currency-badge');
            if (symbolBadge && optBadge) {
              symbolBadge.textContent = optBadge.textContent;
            }
          }
        });
        return;
      }
      wrapper.dataset.glassInitialized = 'true';

      function setSelected(val, triggerChangeEvent = true) {
        if (selectEl) {
          selectEl.value = val;
        }
        const opts = getOptions();
        opts.forEach(opt => {
          const isMatch = opt.dataset.value === val;
          opt.classList.toggle('selected', isMatch);
          opt.setAttribute('aria-selected', isMatch ? 'true' : 'false');
          if (isMatch) {
            if (labelSpan) {
              const optText = opt.querySelector('.select-opt-text')?.textContent || opt.querySelector('span:not(.currency-badge)')?.textContent || opt.querySelector('span')?.textContent || opt.textContent.trim();
              labelSpan.textContent = optText;
            }
            if (iconEl) {
              const optIcon = opt.querySelector('.option-icon');
              if (optIcon) {
                iconEl.className = optIcon.className.replace('option-icon', 'select-icon');
              }
            }
            const symbolBadge = triggerBtn.querySelector('.select-currency-symbol');
            const optBadge = opt.querySelector('.currency-badge');
            if (symbolBadge && optBadge) {
              symbolBadge.textContent = optBadge.textContent;
            }
          }
        });
        if (triggerChangeEvent && selectEl) {
          selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      function toggleMenu(force) {
        const willOpen = typeof force === 'boolean' ? force : (menuEl !== _activeGlassMenu || !menuEl.classList.contains('open'));
        if (willOpen) {
          if (_activeGlassMenu && _activeGlassMenu !== menuEl) {
            closeActiveGlassMenu();
          }

          _activeGlassMenu = menuEl;
          _activeGlassTrigger = triggerBtn;
          _activeGlassWrapper = wrapper;

          // Teleport to portal on body
          const portal = getGlassPortal();
          portal.appendChild(menuEl);
          menuEl.style.display = 'block';

          // Position anchored to trigger
          positionGlassMenu(triggerBtn, menuEl);

          requestAnimationFrame(() => {
            menuEl.classList.add('open');
            triggerBtn.classList.add('active');
            triggerBtn.setAttribute('aria-expanded', 'true');
            positionGlassMenu(triggerBtn, menuEl);
            const opts = getOptions();
            const currentSelected = menuEl.querySelector('.glass-select-option.selected') || opts[0];
            currentSelected?.focus();
          });
        } else {
          closeActiveGlassMenu();
        }
      }

      triggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMenu();
      });

      triggerBtn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleMenu(true);
        } else if (e.key === 'Escape') {
          toggleMenu(false);
        }
      });

      // Delegated click on menu options (handles dynamically injected options)
      menuEl.addEventListener('click', (e) => {
        const opt = e.target.closest('.glass-select-option');
        if (opt) {
          e.preventDefault();
          e.stopPropagation();
          setSelected(opt.dataset.value, true);
          closeActiveGlassMenu();
          triggerBtn.focus();
        }
      });

      // Keydown navigation on menu
      menuEl.addEventListener('keydown', (e) => {
        const opt = e.target.closest('.glass-select-option');
        if (!opt) return;
        const opts = getOptions();
        const idx = opts.indexOf(opt);

        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setSelected(opt.dataset.value, true);
          closeActiveGlassMenu();
          triggerBtn.focus();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = opts[idx + 1] || opts[0];
          next?.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = opts[idx - 1] || opts[opts.length - 1];
          prev?.focus();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeActiveGlassMenu();
          triggerBtn.focus();
        } else if (e.key === 'Tab') {
          closeActiveGlassMenu();
        }
      });

      if (selectEl) {
        selectEl.addEventListener('change', () => {
          setSelected(selectEl.value, false);
        });
        if (selectEl.value) {
          setSelected(selectEl.value, false);
        }
      }

      const parentForm = wrapper.closest('form');
      if (parentForm) {
        parentForm.addEventListener('reset', () => {
          setTimeout(() => {
            if (selectEl) setSelected(selectEl.value, false);
          }, 10);
        });
      }
    });
  }

  // Global Outside Click, Escape, and Reposition listeners
  if (typeof window !== 'undefined' && !window._glassSelectGlobalBound) {
    window._glassSelectGlobalBound = true;

    // Reposition on scroll or resize
    const handleGlassReposition = () => {
      if (_activeGlassMenu && _activeGlassTrigger) {
        positionGlassMenu(_activeGlassTrigger, _activeGlassMenu);
      }
    };
    window.addEventListener('scroll', handleGlassReposition, { passive: true, capture: true });
    window.addEventListener('resize', handleGlassReposition, { passive: true });

    document.addEventListener('click', (e) => {
      if (!_activeGlassMenu) return;
      const clickedTrigger = _activeGlassTrigger && (_activeGlassTrigger === e.target || _activeGlassTrigger.contains(e.target));
      const clickedMenu = _activeGlassMenu && (_activeGlassMenu === e.target || _activeGlassMenu.contains(e.target));
      if (!clickedTrigger && !clickedMenu) {
        closeActiveGlassMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && _activeGlassMenu) {
        const trigger = _activeGlassTrigger;
        closeActiveGlassMenu();
        trigger?.focus();
      }
    });
  }

  // Standardized Role & Status Badge Builders
  function getUserRoleBadge(u, isOwner) {
    if (isOwner || u.role === 'owner' || u.role === 'super_admin' || u.is_owner === 1 || u.is_owner === true) {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs"><i class="fa-solid fa-crown text-[9px] text-amber-500"></i> Super Admin</span>';
    } else if (u.role === 'admin') {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 shadow-xs"><i class="fa-solid fa-shield-halved text-[9px]"></i> Admin</span>';
    } else if (u.role === 'accounts') {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 shadow-xs"><i class="fa-solid fa-calculator text-[9px]"></i> Accounts</span>';
    } else if (u.role === 'employee' || u.role === 'project_manager') {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 shadow-xs"><i class="fa-solid fa-briefcase text-[9px]"></i> Employee</span>';
    } else {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 shadow-xs"><i class="fa-solid fa-user text-[9px]"></i> Client</span>';
    }
  }

  function getUserStatusBadge(status) {
    const s = (status || 'active').toLowerCase();
    if (s === 'active') {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active</span>';
    } else if (s === 'suspended') {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Suspended</span>';
    } else if (s === 'revoked') {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Revoked</span>';
    } else {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> ' + escapeHtml(status || 'Pending') + '</span>';
    }
  }

  async function loadTeamData() {
    const tbody = document.getElementById('userDirectoryTableBody');
    const cardsContainer = document.getElementById('adminUserCardsContainer');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500 italic"><i class="fa-solid fa-circle-notch fa-spin mr-2 text-[#147D64]"></i>Loading users directory...</td></tr>';
    }
    if (cardsContainer) {
      cardsContainer.innerHTML = '<div class="p-6 rounded-2xl bg-white border border-[#E3E9EF] text-center text-xs text-slate-500 italic shadow-xs"><i class="fa-solid fa-circle-notch fa-spin mr-2 text-[#147D64]"></i>Loading users directory...</div>';
    }

    try {
      const [usersSettled, historySettled, teamSettled] = await Promise.allSettled([
        apiFetch('/portal/admin/users'),
        apiFetch('/portal/admin/role-history'),
        apiFetch('/portal/admin/team')
      ]);

      const usersRes = usersSettled.status === 'fulfilled' ? usersSettled.value : null;
      const historyRes = historySettled.status === 'fulfilled' ? historySettled.value : null;
      const teamRes = teamSettled.status === 'fulfilled' ? teamSettled.value : null;

      if (usersRes && usersRes.ok && usersRes.data && usersRes.data.data) {
        state.usersCache = usersRes.data.data.users || [];
        initGlassSelects(); // Sync team selects
        try {
          renderUserDirectory();
        } catch (renderErr) {
          console.error('renderUserDirectory error:', renderErr);
        }
      } else {
        const errorMsg = usersRes?.data?.error || (usersSettled.status === 'rejected' ? 'Connection error' : 'Failed to load users directory.');
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-6 text-center text-rose-500 font-medium">${escapeHtml(errorMsg)}</td></tr>`;
        if (cardsContainer) cardsContainer.innerHTML = `<div class="p-6 rounded-2xl bg-white border border-rose-200 text-center text-xs text-rose-500 font-medium shadow-xs">${escapeHtml(errorMsg)}</div>`;
      }

      if (historyRes && historyRes.ok && historyRes.data) {
        state.roleHistoryCache = historyRes.data.data || [];
        try {
          renderRoleHistory();
        } catch (histErr) {
          console.error('renderRoleHistory error:', histErr);
        }
      }

      if (teamRes && teamRes.ok && teamRes.data) {
        const teamData = teamRes.data.data || teamRes.data;
        try {
          renderTeamManagement(teamData);
        } catch (teamErr) {
          console.error('renderTeamManagement error:', teamErr);
        }
      }
    } catch (err) {
      console.error('User Directory Fetch Error:', err);
      const failMsg = 'Failed to load user directory. Please retry.';
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-6 text-center text-rose-500 font-medium">${failMsg}</td></tr>`;
      if (cardsContainer) cardsContainer.innerHTML = `<div class="p-6 rounded-2xl bg-white border border-rose-200 text-center text-xs text-rose-500 font-medium shadow-xs">${failMsg}</div>`;
    }
  }

  function renderUserDirectory() {
    const tbody = document.getElementById('userDirectoryTableBody');
    const countEl = document.getElementById('userDirectoryCount');
    const cardsContainer = document.getElementById('adminUserCardsContainer');
    if (!tbody && !cardsContainer) return;

    const query = (document.getElementById('userDirectorySearch')?.value || '').toLowerCase().trim();
    const roleFilter = document.getElementById('userDirectoryRoleFilter')?.value || 'all';
    const statusFilter = document.getElementById('userDirectoryStatusFilter')?.value || 'all';

    // Toggle clear search button
    const clearBtn = document.getElementById('userDirectorySearchClear');
    if (clearBtn) {
      clearBtn.classList.toggle('hidden', !query);
    }

    let filtered = state.usersCache.filter(u => {
      const fullName = (u.full_name || u.fullName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const username = (u.username || '').toLowerCase();
      const clerkId = (u.clerk_user_id || u.clerkUserId || '').toLowerCase();
      const company = (u.company_name || u.companyName || '').toLowerCase();
      const role = (u.role || '').toLowerCase();

      const matchesQuery = !query || 
        fullName.includes(query) ||
        email.includes(query) ||
        username.includes(query) ||
        clerkId.includes(query) ||
        company.includes(query) ||
        role.includes(query);

      const matchesRole = roleFilter === 'all' || 
        (roleFilter === 'client' && u.role === 'client') ||
        (roleFilter === 'admin' && u.role === 'admin') ||
        (roleFilter === 'accounts' && u.role === 'accounts') ||
        (roleFilter === 'employee' && (u.role === 'employee' || u.role === 'project_manager')) ||
        (roleFilter === 'owner' && (u.role === 'owner' || u.role === 'super_admin'));

      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

      return matchesQuery && matchesRole && matchesStatus;
    });

    if (countEl) countEl.textContent = `${filtered.length} account${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
      const emptyMsg = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500 italic">No users match the search filter.</td></tr>';
      if (tbody) tbody.innerHTML = emptyMsg;
      if (cardsContainer) {
        cardsContainer.innerHTML = `
          <div class="p-8 rounded-2xl sm:rounded-3xl bg-white border border-[#E3E9EF] text-center shadow-xs space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mx-auto text-slate-400">
              <i class="fa-solid fa-users-slash text-lg"></i>
            </div>
            <h4 class="text-sm font-bold text-[#172B36]">No Accounts Match Your Filter</h4>
            <p class="text-xs text-slate-500 max-w-xs mx-auto">No registered user accounts match the current search query or role/status filters.</p>
            <button type="button" id="btnClearUserFilters" class="h-10 px-4 rounded-xl text-xs font-bold text-[#087F70] bg-[#EAF5F1] hover:bg-[#D5EDE5] border border-[#087F70]/20 transition-all inline-flex items-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-filter-circle-xmark text-xs"></i>
              <span>Reset All Filters</span>
            </button>
          </div>
        `;
      }
      return;
    }

    // Desktop Table
    if (tbody) {
      tbody.innerHTML = filtered.map(u => {
        const email = u.email || '';
        const isOwner = email.toLowerCase() === 'kaziaremon@gmail.com' || u.role === 'owner' || u.role === 'super_admin' || u.is_owner === 1 || u.is_owner === true;
        const fullName = u.full_name || u.fullName || 'Registered User';
        const initials = (fullName || email || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        const clerkId = u.clerk_user_id || u.clerkUserId || '';
        const companyName = u.company_name || u.companyName || '';
        const createdAt = u.created_at || u.createdAt;

        const roleBadge = getUserRoleBadge(u, isOwner);
        const statusBadge = getUserStatusBadge(u.status);

        const isSelf = isCurrentAdminSelf(u);
        const isOwnerActor = isCurrentUserOwner();
        const isTargetOwner = isOwner;

        let actionsHtml = '';
        if (isTargetOwner) {
          actionsHtml = '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300"><i class="fa-solid fa-crown text-[10px] text-amber-500"></i> Founding Owner</span>';
        } else if (isSelf) {
          actionsHtml = '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200"><i class="fa-solid fa-user-check text-[#087F70] text-[10px]"></i> Current Account</span>';
        } else if (u.status === 'suspended') {
          const canManageSuspended = u.role !== 'admin' || isOwnerActor;
          actionsHtml = `
            <div class="flex items-center justify-end gap-1.5">
              ${u.role === 'client' ? `<button type="button" class="btn-user-view-details px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-[#172B36] border border-[#E3E9EF] cursor-pointer" data-id="${u.id}"><i class="fa-solid fa-eye mr-1 text-[#087F70]"></i>Details</button>` : ''}
              ${canManageSuspended ? `<button type="button" class="btn-user-reactivate px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer" data-id="${u.id}"><i class="fa-solid fa-play mr-1"></i>Reactivate</button>` : ''}
              ${canManageSuspended ? `<button type="button" class="btn-user-delete px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer" data-id="${u.id}" data-name="${escapeHtml(fullName)}"><i class="fa-solid fa-trash-can mr-1"></i>Delete</button>` : ''}
            </div>
          `;
        } else {
          const canRevokeAdmin = isOwnerActor && u.role === 'admin';
          const canDemoteStaff = isOwnerActor && (u.role === 'accounts' || u.role === 'employee');
          const canSuspend = u.role === 'client' || ((u.role === 'admin' || u.role === 'accounts' || u.role === 'employee') && isOwnerActor);

          const roleBtn = canRevokeAdmin
            ? `<button type="button" class="btn-role-action px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-all cursor-pointer" data-id="${u.id}" data-role="client" data-email="${escapeHtml(email)}" data-name="${escapeHtml(fullName)}"><i class="fa-solid fa-arrow-down mr-1 text-[10px]"></i>Revoke Admin</button>`
            : (canDemoteStaff
                ? `<button type="button" class="btn-role-action px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-all cursor-pointer" data-id="${u.id}" data-role="client" data-email="${escapeHtml(email)}" data-name="${escapeHtml(fullName)}"><i class="fa-solid fa-arrow-down mr-1 text-[10px]"></i>Demote Role</button>`
                : '');

          const suspendBtn = canSuspend
            ? `<button type="button" class="btn-user-suspend px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer" data-id="${u.id}"><i class="fa-solid fa-pause mr-1"></i>Suspend</button>`
            : '';

          actionsHtml = (roleBtn || suspendBtn)
            ? `<div class="flex items-center justify-end gap-1.5">${roleBtn}${suspendBtn}</div>`
            : '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200">Active</span>';
        }

        return `
          <tr class="hover:bg-slate-50 transition-colors border-b border-[#E3E9EF]">
            <td class="px-6 py-4">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-[#172B36] uppercase shrink-0">
                  ${escapeHtml(initials)}
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-[#172B36] truncate">${escapeHtml(fullName)}</div>
                  <div class="text-xs text-slate-500 font-mono truncate">${escapeHtml(email)}</div>
                  ${clerkId ? `<div class="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold mt-0.5"><i class="fa-solid fa-shield-check text-[9px]"></i>SSO Linked</div>` : '<div class="text-[10px] text-slate-400 mt-0.5">Direct Verified</div>'}
                </div>
              </div>
            </td>
            <td class="px-6 py-4">${roleBadge}</td>
            <td class="px-6 py-4">${statusBadge}</td>
            <td class="px-6 py-4 text-slate-600 text-xs">${companyName ? escapeHtml(companyName) : '<span class="text-slate-400 italic">None</span>'}</td>
            <td class="px-6 py-4 text-slate-500 text-xs font-mono">${createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}</td>
            <td class="px-6 py-4 text-right">${actionsHtml}</td>
          </tr>
        `;
      }).join('');
    }

    // Mobile Cards (Task 3 & 7)
    if (cardsContainer) {
      cardsContainer.innerHTML = filtered.map(u => {
        const email = u.email || '';
        const isOwner = email.toLowerCase() === 'kaziaremon@gmail.com' || u.role === 'owner' || u.role === 'super_admin' || u.is_owner === 1 || u.is_owner === true;
        const fullName = u.full_name || u.fullName || 'Registered User';
        const initials = (fullName || email || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        const clerkId = u.clerk_user_id || u.clerkUserId || '';
        const companyName = u.company_name || u.companyName || '';
        const createdAt = u.created_at || u.createdAt;
        const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

        const roleBadge = getUserRoleBadge(u, isOwner);
        const statusBadge = getUserStatusBadge(u.status);

        const isSelf = isCurrentAdminSelf(u);
        const isOwnerActor = isCurrentUserOwner();
        const isTargetOwner = isOwner;

        let actionsHtml = '';
        if (isTargetOwner) {
          actionsHtml = `
            <div class="p-3 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 flex items-center justify-between text-xs">
              <div class="flex items-center gap-2 font-bold text-emerald-800">
                <i class="fa-solid fa-crown text-amber-500 text-xs"></i>
                <span>Founding Owner &amp; Super Admin</span>
              </div>
              <span class="text-[10px] font-mono font-extrabold uppercase bg-emerald-100/90 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">Protected</span>
            </div>
          `;
        } else if (isSelf) {
          actionsHtml = `
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div class="flex items-center gap-2 font-bold text-slate-700">
                <i class="fa-solid fa-user-check text-[#087F70] text-xs"></i>
                <span>Active Session (Your Account)</span>
              </div>
              <span class="text-[10px] font-mono font-bold uppercase bg-white text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200">Current</span>
            </div>
          `;
        } else if (u.status === 'suspended') {
          const canManageSuspended = u.role !== 'admin' || isOwnerActor;
          actionsHtml = `
            <div class="grid ${canManageSuspended ? 'grid-cols-2' : 'grid-cols-1'} gap-2">
              ${canManageSuspended ? `
                <button type="button" class="btn-user-reactivate h-11 px-3 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs" data-id="${u.id}">
                  <i class="fa-solid fa-play text-[10px]"></i>
                  <span>Reactivate</span>
                </button>
                <button type="button" class="btn-user-delete h-11 px-3 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs" data-id="${u.id}" data-name="${escapeHtml(fullName)}">
                  <i class="fa-solid fa-trash-can text-[10px]"></i>
                  <span>Delete</span>
                </button>
              ` : '<span class="text-xs text-slate-400 italic text-center py-2.5">Suspended Account</span>'}
            </div>
          `;
        } else {
          const canRevokeAdmin = isOwnerActor && u.role === 'admin';
          const canDemoteStaff = isOwnerActor && (u.role === 'accounts' || u.role === 'employee');
          const canSuspend = u.role === 'client' || ((u.role === 'admin' || u.role === 'accounts' || u.role === 'employee') && isOwnerActor);

          if (u.role === 'client') {
            actionsHtml = `
              <div class="grid grid-cols-2 gap-2">
                <button type="button" class="btn-user-view-details h-11 px-3 rounded-xl text-xs font-bold text-[#172B36] bg-white hover:bg-slate-50 border border-[#E3E9EF] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs" data-id="${u.id}">
                  <i class="fa-solid fa-eye text-[#087F70] text-[11px]"></i>
                  <span>View Details</span>
                </button>
                ${canSuspend ? `
                  <button type="button" class="btn-user-suspend h-11 px-3 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs" data-id="${u.id}">
                    <i class="fa-solid fa-pause text-[10px]"></i>
                    <span>Suspend</span>
                  </button>
                ` : ''}
              </div>
            `;
          } else if (u.role === 'admin') {
            actionsHtml = `
              <div class="grid ${canRevokeAdmin && canSuspend ? 'grid-cols-2' : 'grid-cols-1'} gap-2">
                ${canRevokeAdmin ? `
                  <button type="button" class="btn-role-action h-11 px-3 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs" data-id="${u.id}" data-role="client" data-email="${escapeHtml(email)}" data-name="${escapeHtml(fullName)}">
                    <i class="fa-solid fa-user-minus text-[10px]"></i>
                    <span>Revoke Admin</span>
                  </button>
                ` : ''}
                ${canSuspend ? `
                  <button type="button" class="btn-user-suspend h-11 px-3 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs" data-id="${u.id}">
                    <i class="fa-solid fa-pause text-[10px]"></i>
                    <span>Suspend</span>
                  </button>
                ` : ''}
              </div>
            `;
          } else {
            actionsHtml = `
              <div class="grid ${canDemoteStaff && canSuspend ? 'grid-cols-2' : 'grid-cols-1'} gap-2">
                ${canDemoteStaff ? `
                  <button type="button" class="btn-role-action h-11 px-3 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs" data-id="${u.id}" data-role="client" data-email="${escapeHtml(email)}" data-name="${escapeHtml(fullName)}">
                    <i class="fa-solid fa-arrow-down text-[10px]"></i>
                    <span>Demote Role</span>
                  </button>
                ` : ''}
                ${canSuspend ? `
                  <button type="button" class="btn-user-suspend h-11 px-3 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs" data-id="${u.id}">
                    <i class="fa-solid fa-pause text-[10px]"></i>
                    <span>Suspend</span>
                  </button>
                ` : ''}
              </div>
            `;
          }
        }

        return `
          <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E6ECE9] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(20,125,100,0.08)] transition-all space-y-3.5">
            <!-- Section A: User Identity -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#EAF5F1] to-[#D5EDE5] border border-[#087F70]/20 flex items-center justify-center font-black text-xs text-[#087F70] uppercase shrink-0 shadow-xs">
                  ${escapeHtml(initials)}
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-sm font-black text-[#172B36] truncate leading-tight" title="${escapeHtml(fullName)}">
                    ${escapeHtml(fullName)}
                  </h4>
                  <p class="text-xs font-mono text-slate-500 truncate mt-0.5" title="${escapeHtml(email)}">
                    ${escapeHtml(email)}
                  </p>
                  <div class="flex items-center gap-1.5 mt-1">
                    ${clerkId ? `
                      <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        <i class="fa-solid fa-shield-check text-[9px]"></i> SSO Linked
                      </span>
                    ` : `
                      <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                        <i class="fa-solid fa-envelope-circle-check text-[9px]"></i> Direct Account
                      </span>
                    `}
                  </div>
                </div>
              </div>
              
              <div class="shrink-0 flex flex-col items-end gap-1.5">
                ${roleBadge}
                ${statusBadge}
              </div>
            </div>

            <!-- Section B: Account Details (Key-Value Grid) -->
            <div class="p-3 rounded-xl bg-slate-50/70 border border-slate-100/80 grid grid-cols-2 gap-2 text-xs">
              <div class="min-w-0">
                <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Workspace / Company</span>
                <span class="font-bold text-[#172B36] truncate block mt-0.5" title="${escapeHtml(companyName || 'None')}">
                  ${companyName ? escapeHtml(companyName) : '<span class="text-slate-400 font-normal italic">None</span>'}
                </span>
              </div>
              <div class="min-w-0">
                <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Registered On</span>
                <span class="font-mono text-slate-600 block mt-0.5">${escapeHtml(formattedDate)}</span>
              </div>
            </div>

            <!-- Section C: Account Actions -->
            <div class="pt-1 border-t border-slate-100/80">
              ${actionsHtml}
            </div>
          </div>
        `;
      }).join('');
    }

    function openRoleChangeModal(id, targetRole, email, name) {
      if (!isCurrentUserOwner()) {
        showToast('Action denied: Only the Founding Super Admin may modify administrative roles.', 'error');
        return;
      }
      if (email && email.toLowerCase() === 'kaziaremon@gmail.com') {
        showToast('Protection violation: Founding Super Admin account cannot be altered.', 'error');
        return;
      }
      if (isCurrentAdminSelf({ id, email })) {
        showToast('Self-management violation: You cannot alter your own account permissions.', 'error');
        return;
      }
      const modal = document.getElementById('modalRoleChange');
      if (!modal) return;
      const idInput = document.getElementById('roleChangeUserId');
      const roleInput = document.getElementById('roleChangeTargetRole');
      const newRoleSelect = document.getElementById('roleChangeNewRole');
      const titleEl = document.getElementById('modalRoleChangeTitle');
      const descEl = document.getElementById('modalRoleChangeDesc');
      const submitBtn = document.getElementById('btnSubmitRoleChange');

      if (idInput) idInput.value = id;
      if (roleInput) roleInput.value = targetRole;
      if (newRoleSelect) {
        newRoleSelect.value = targetRole;
        newRoleSelect.dispatchEvent(new Event('change'));
      }
      if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-user-gear text-[#087F70] mr-2"></i><span>Update Account Role & Permissions</span>';
      if (descEl) descEl.textContent = `Configure new security role permissions for ${name} (${email}). An authoritative audit record will be registered.`;
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fa-solid fa-check text-xs mr-1"></i><span>Confirm & Update Role</span>';
      }
      modal.classList.remove('hidden');
    }

    // Bind action buttons
    document.querySelectorAll('.btn-role-action').forEach(btn => {
      btn.addEventListener('click', () => {
        openRoleChangeModal(btn.dataset.id, btn.dataset.role, btn.dataset.email, btn.dataset.name);
      });
    });

    document.querySelectorAll('.btn-user-view-details').forEach(btn => {
      btn.addEventListener('click', () => {
        openClientDetails(btn.dataset.id);
      });
    });

    document.querySelectorAll('.btn-user-reactivate').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.id;
        const res = await apiFetch(`/portal/admin/users/${uid}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'active' })
        });
        if (res.ok) {
          showToast('Account reactivated.', 'success');
          loadTeamData();
        } else {
          showToast('Failed to reactivate.', 'error');
        }
      });
    });

    document.querySelectorAll('.btn-user-suspend').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.id;
        const targetUser = state.usersCache.find(u => u.id === uid);
        if (isCurrentAdminSelf(targetUser)) {
          showToast('Self-management violation: You cannot suspend your own account.', 'error');
          return;
        }
        const isTargetOwner = targetUser?.email?.toLowerCase() === 'kaziaremon@gmail.com' || targetUser?.role === 'owner' || targetUser?.role === 'super_admin';
        if (isTargetOwner) {
          showToast('Protection violation: The Founding Super Admin account cannot be suspended.', 'error');
          return;
        }
        if (targetUser?.role === 'admin' && !isCurrentUserOwner()) {
          showToast('Action denied: Only the Founding Super Admin may suspend an Administrator.', 'error');
          return;
        }
        if (!confirm('Suspend this user account?')) return;
        const res = await apiFetch(`/portal/admin/users/${uid}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'suspended' })
        });
        if (res.ok) {
          showToast('Account suspended.', 'success');
          loadTeamData();
        } else {
          showToast('Failed to suspend.', 'error');
        }
      });
    });

    document.querySelectorAll('.btn-user-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.id;
        const uname = btn.dataset.name;
        const targetUser = state.usersCache.find(u => u.id === uid);
        if (isCurrentAdminSelf(targetUser)) {
          showToast('Self-management violation: You cannot delete your own account.', 'error');
          return;
        }
        const isTargetOwner = targetUser?.email?.toLowerCase() === 'kaziaremon@gmail.com' || targetUser?.role === 'owner' || targetUser?.role === 'super_admin';
        if (isTargetOwner) {
          showToast('Protection violation: The Founding Super Admin account cannot be deleted.', 'error');
          return;
        }
        if (targetUser?.role === 'admin' && !isCurrentUserOwner()) {
          showToast('Action denied: Only the Founding Super Admin may delete an Administrator.', 'error');
          return;
        }
        if (!confirm(`Permanently delete user account for ${uname}? This action cannot be undone.`)) return;
        const res = await apiFetch(`/portal/admin/users/${uid}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          showToast('Account permanently removed.', 'success');
          loadTeamData();
        } else {
          showToast('Failed to delete account.', 'error');
        }
      });
    });
  }

  function renderRoleHistory() {
    const tbody = document.getElementById('roleHistoryTableBody');
    const cardsContainer = document.getElementById('roleHistoryCardsContainer');
    if (!tbody) return;

    const history = state.roleHistoryCache || [];

    if (history.length === 0) {
      const emptyMsg = '<tr><td colspan="6" class="px-6 py-6 text-center text-slate-500 italic">No role transition records yet.</td></tr>';
      tbody.innerHTML = emptyMsg;
      if (cardsContainer) {
        cardsContainer.innerHTML = '<div class="p-6 rounded-2xl bg-white border border-[#E3E9EF] text-center text-xs text-slate-500 italic shadow-xs">No role transition records yet.</div>';
      }
      return;
    }

    // Desktop Table
    tbody.innerHTML = history.map(h => {
      const dateStr = h.action_timestamp ? new Date(h.action_timestamp).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
      }) : '—';
      const target = resolveUserIdentity(h.target_email || h.target_name || h.target_clerk_user_id || h.user_name || 'User', 'target');
      const actor = resolveUserIdentity(h.actor_email || h.actor_name || h.actor_clerk_user_id || h.changed_by, 'actor');
      const prevRole = h.previous_role || 'client';
      const nextRole = h.new_role || 'admin';
      const result = h.action_result || 'success';
      const reason = sanitizeAuditDetails(h.reason || 'Administrative role update');

      return `
        <tr class="hover:bg-slate-50 transition-colors border-b border-[#E3E9EF]">
          <td class="px-6 py-4 font-mono text-[11px] text-slate-500">${escapeHtml(dateStr)}</td>
          <td class="px-6 py-4 font-bold text-[#172B36] truncate max-w-[200px]">${escapeHtml(target)}</td>
          <td class="px-6 py-4">
            <span class="inline-flex items-center gap-1.5 text-xs font-semibold">
              <span class="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700">${escapeHtml(prevRole)}</span>
              <i class="fa-solid fa-arrow-right text-[10px] text-slate-400"></i>
              <span class="capitalize px-2 py-0.5 rounded font-bold ${nextRole === 'admin' || nextRole === 'owner' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'}">${escapeHtml(nextRole)}</span>
            </span>
          </td>
          <td class="px-6 py-4 text-slate-600 text-xs">${escapeHtml(actor)}</td>
          <td class="px-6 py-4 text-slate-500 text-xs truncate max-w-[180px]">${escapeHtml(reason)}</td>
          <td class="px-6 py-4">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${result === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">${escapeHtml(result)}</span>
          </td>
        </tr>
      `;
    }).join('');

    // Mobile Cards
    if (cardsContainer) {
      cardsContainer.innerHTML = history.map(h => {
        const dateStr = h.action_timestamp ? new Date(h.action_timestamp).toLocaleString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        }) : '—';
        const target = resolveUserIdentity(h.target_email || h.target_name || h.target_clerk_user_id || h.user_name || 'User', 'target');
        const actor = resolveUserIdentity(h.actor_email || h.actor_name || h.actor_clerk_user_id || h.changed_by, 'actor');
        const prevRole = h.previous_role || 'client';
        const nextRole = h.new_role || 'admin';
        const result = h.action_result || 'success';
        const reason = sanitizeAuditDetails(h.reason || 'Administrative role update');

        return `
          <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] shadow-xs space-y-2.5">
            <div class="flex items-center justify-between text-xs">
              <span class="font-mono text-[11px] text-slate-500">${escapeHtml(dateStr)}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${result === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">${escapeHtml(result)}</span>
            </div>
            <div class="text-xs font-bold text-[#172B36] truncate">${escapeHtml(target)}</div>
            <div class="flex items-center gap-1.5 text-xs">
              <span class="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">${escapeHtml(prevRole)}</span>
              <i class="fa-solid fa-arrow-right text-[9px] text-slate-400"></i>
              <span class="capitalize px-2 py-0.5 rounded font-bold text-[11px] ${nextRole === 'admin' || nextRole === 'owner' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'}">${escapeHtml(nextRole)}</span>
            </div>
            <div class="text-[11px] text-slate-500 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
              <span>By <strong>${escapeHtml(actor)}</strong></span>
              <span class="truncate max-w-[160px] text-slate-400">${escapeHtml(reason)}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  function renderTeamManagement(teamData) {
    const pendingTbody = document.getElementById('pendingApprovalsTableBody');
    const pendingCards = document.getElementById('pendingApprovalsCardsContainer');
    const pendingCount = document.getElementById('pendingApprovalsCount');

    const activeTbody = document.getElementById('activeAdminsTableBody');
    const activeCards = document.getElementById('activeAdminsCardsContainer');
    const activeCount = document.getElementById('activeAdminsCount');

    const rawAdmins = teamData.admins || [];
    const pendingInvs = teamData.pendingInvitations || [];

    const isOwnerActor = isCurrentUserOwner();

    // Enable staff pre-approval form for Super Admin and Admin
    const inviteForm = document.getElementById('adminInviteForm');
    if (inviteForm) {
      const canInvite = isOwnerActor || state.adminProfile?.role === 'admin';
      const inputs = inviteForm.querySelectorAll('input, select, button');
      inputs.forEach(el => el.disabled = !canInvite);
      const submitBtn = inviteForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        if (!canInvite) {
          submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
          submitBtn.title = 'Only Super Admin and Admin may authorize staff accounts';
        } else {
          submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
          submitBtn.title = '';
        }
      }
    }

    const pendingList = pendingInvs.length > 0
      ? pendingInvs
      : rawAdmins.filter(a => a.status === 'pending');

    const activeList = rawAdmins.filter(a => a.status === 'active' || (a.clerk_user_id && a.status !== 'revoked' && a.status !== 'pending'));

    if (pendingCount) pendingCount.textContent = `${pendingList.length} pending`;
    if (activeCount) activeCount.textContent = `${activeList.length} active`;

    // 1. Render Pending Approvals
    if (pendingList.length === 0) {
      const emptyPending = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500 italic">No pending administrator pre-approvals.</td></tr>';
      if (pendingTbody) pendingTbody.innerHTML = emptyPending;
      if (pendingCards) pendingCards.innerHTML = '<div class="p-6 rounded-2xl bg-white border border-[#E3E9EF] text-center text-xs text-slate-500 italic shadow-xs">No pending administrator pre-approvals.</div>';
    } else {
      if (pendingTbody) {
        pendingTbody.innerHTML = pendingList.map(p => {
          const name = p.full_name || 'Approved Staff Member';
          const email = p.email || p.approved_email || '';
          const roleName = typeof formatRoleName === 'function' ? formatRoleName(p.role) : (p.role || 'Staff');
          const roleBadge = typeof getRoleBadgeForRole === 'function' ? getRoleBadgeForRole(p.role, false) : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200 uppercase">${escapeHtml(roleName)}</span>`;
          const createdAt = p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A';
          const actionCol = isOwnerActor
            ? `<button type="button" class="btn-revoke-invitation px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-all" data-id="${p.id}" data-email="${escapeHtml(email)}">
                <i class="fa-solid fa-ban mr-1 text-[10px]"></i>Revoke Approval
              </button>`
            : '<span class="text-xs font-medium text-slate-400 italic">Owner Only</span>';

          return `
            <tr class="hover:bg-slate-50 transition-colors border-b border-[#E3E9EF]">
              <td class="px-6 py-4 font-bold text-[#172B36]">${escapeHtml(name)}</td>
              <td class="px-6 py-4 font-mono text-xs text-slate-600">${escapeHtml(email)}</td>
              <td class="px-6 py-4">${roleBadge}</td>
              <td class="px-6 py-4 font-mono text-xs text-slate-500">${escapeHtml(createdAt)}</td>
              <td class="px-6 py-4"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">Pending Verification</span></td>
              <td class="px-6 py-4 text-right">${actionCol}</td>
            </tr>
          `;
        }).join('');
      }

      if (pendingCards) {
        pendingCards.innerHTML = pendingList.map(p => {
          const name = p.full_name || 'Approved Administrator';
          const email = p.email || p.approved_email || '';
          const roleName = typeof formatRoleName === 'function' ? formatRoleName(p.role) : (p.role || 'Staff');
          const createdAt = p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A';
          return `
            <div class="p-4 sm:p-5 rounded-2xl bg-white border border-[#E6ECE9] shadow-xs space-y-3">
              <div class="flex items-center justify-between text-xs gap-2">
                <span class="font-bold text-[#172B36] text-sm truncate">${escapeHtml(name)}</span>
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Pending</span>
              </div>
              <div class="font-mono text-xs text-slate-500 break-all">${escapeHtml(email)}</div>
              <div class="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Role: <strong class="text-slate-700">${escapeHtml(roleName)}</strong></span>
                <span class="font-mono text-[11px]">${escapeHtml(createdAt)}</span>
              </div>
              ${isOwnerActor ? `
                <button type="button" class="btn-revoke-invitation w-full h-11 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs" data-id="${p.id}" data-email="${escapeHtml(email)}">
                  <i class="fa-solid fa-ban text-[10px]"></i>
                  <span>Revoke Pre-Approval</span>
                </button>
              ` : ''}
            </div>
          `;
        }).join('');
      }
    }

    // 2. Render Active Administrators
    if (activeList.length === 0) {
      const emptyActive = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500 italic">No active administrators found.</td></tr>';
      if (activeTbody) activeTbody.innerHTML = emptyActive;
      if (activeCards) activeCards.innerHTML = '<div class="p-6 rounded-2xl bg-white border border-[#E3E9EF] text-center text-xs text-slate-500 italic shadow-xs">No active administrators found.</div>';
    } else {
      if (activeTbody) {
        activeTbody.innerHTML = activeList.map(a => {
          const email = a.approved_email || a.email || '';
          const isOwner = email.toLowerCase() === 'kaziaremon@gmail.com';
          const name = a.full_name || (isOwner ? 'Kazi Emon' : 'Administrator');
          const clerkId = a.clerk_user_id || '—';
          const isSelf = isCurrentAdminSelf(a);

          const isActualOwner = email.toLowerCase() === 'kaziaremon@gmail.com' || a.role === 'owner' || a.role === 'super_admin';
          const roleBadge = typeof getRoleBadgeForRole === 'function' ? getRoleBadgeForRole(a.role, isActualOwner) : (isActualOwner ? '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-crown text-[9px] text-amber-500"></i> Owner</span>' : '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200"><i class="fa-solid fa-shield-halved text-[9px]"></i> Admin</span>');
          const activatedAt = a.activated_at ? new Date(a.activated_at).toLocaleDateString() : (a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A');

          let actionHtml = '';
          if (isOwner) {
            actionHtml = '<span class="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300"><i class="fa-solid fa-shield mr-1"></i>Founding Super Admin</span>';
          } else if (isSelf) {
            actionHtml = '<span class="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200"><i class="fa-solid fa-user-check text-brand-whiz mr-1 text-[10px]"></i>Current Account (You)</span>';
          } else if (isOwnerActor) {
            actionHtml = `<button type="button" class="btn-revoke-admin-access px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer transition-all" data-id="${a.id}" data-email="${escapeHtml(email)}" data-name="${escapeHtml(name)}"><i class="fa-solid fa-user-xmark mr-1 text-[10px]"></i>Revoke Admin Access</button>`;
          } else {
            actionHtml = '<span class="text-xs font-medium text-slate-400 italic">Protected</span>';
          }

          return `
            <tr class="hover:bg-slate-50 transition-colors border-b border-[#E3E9EF]">
              <td class="px-6 py-4 font-bold text-[#172B36]">${escapeHtml(name)}</td>
              <td class="px-6 py-4 font-mono text-xs text-slate-600">${escapeHtml(email)}</td>
              <td class="px-6 py-4 font-mono text-[11px]">${clerkId && clerkId !== '—' ? '<span class="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]"><i class="fa-solid fa-shield-check text-[10px]"></i> SSO Linked</span>' : '<span class="text-slate-400">Direct Pending</span>'}</td>
              <td class="px-6 py-4">${roleBadge}</td>
              <td class="px-6 py-4 font-mono text-xs text-slate-500">${escapeHtml(activatedAt)}</td>
              <td class="px-6 py-4 text-right">${actionHtml}</td>
            </tr>
          `;
        }).join('');
      }

      if (activeCards) {
        activeCards.innerHTML = activeList.map(a => {
          const email = a.approved_email || a.email || '';
          const isOwner = email.toLowerCase() === 'kaziaremon@gmail.com' || a.role === 'owner' || a.role === 'super_admin';
          const name = a.full_name || (isOwner ? 'Kazi Emon' : 'Administrator');
          const clerkId = a.clerk_user_id || '';
          const isSelf = isCurrentAdminSelf(a);
          const activatedAt = a.activated_at ? new Date(a.activated_at).toLocaleDateString() : (a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A');

          let cardActionHtml = '';
          if (isOwner) {
            cardActionHtml = '<div class="p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between text-xs w-full"><span class="font-bold text-emerald-800"><i class="fa-solid fa-crown text-amber-500 mr-1.5"></i>Founding Owner</span><span class="text-[10px] font-mono font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Immune</span></div>';
          } else if (isSelf) {
            cardActionHtml = '<div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs w-full"><span class="font-bold text-slate-700"><i class="fa-solid fa-user-check text-[#087F70] mr-1.5"></i>Current Account (You)</span><span class="text-[10px] font-mono font-bold uppercase bg-white text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">Session</span></div>';
          } else if (isOwnerActor) {
            cardActionHtml = `<button type="button" class="btn-revoke-admin-access w-full h-11 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-xs" data-id="${a.id}" data-email="${escapeHtml(email)}" data-name="${escapeHtml(name)}"><i class="fa-solid fa-user-minus text-[10px]"></i><span>Revoke Admin Access</span></button>`;
          } else {
            cardActionHtml = '<span class="text-xs font-medium text-slate-400 italic">Protected Administrator</span>';
          }

          return `
            <div class="p-4 sm:p-5 rounded-2xl bg-white border border-[#E6ECE9] shadow-xs space-y-3">
              <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-[#172B36] text-sm truncate">${escapeHtml(name)}</span>
                ${typeof getRoleBadgeForRole === 'function' ? getRoleBadgeForRole(a.role, isOwner) : (isOwner ? '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs"><i class="fa-solid fa-crown text-[9px] text-amber-500"></i> Super Admin</span>' : '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 shadow-xs"><i class="fa-solid fa-shield-halved text-[9px]"></i> Admin</span>')}
              </div>
              <div class="font-mono text-xs text-slate-500 break-all">${escapeHtml(email)}</div>
              <div class="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Active Since</span>
                <span class="font-mono text-slate-700 font-semibold">${escapeHtml(activatedAt)}</span>
              </div>
              <div class="pt-1 border-t border-slate-100">
                ${cardActionHtml}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Attach listeners for Revoke Pre-Approval
    document.querySelectorAll('.btn-revoke-invitation').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!isCurrentUserOwner()) {
          showToast('Action denied: Only the Founding Super Admin may revoke administrator pre-approvals.', 'error');
          return;
        }
        const id = btn.dataset.id;
        const email = btn.dataset.email;
        if (!confirm(`Are you sure you want to revoke administrator pre-approval for ${email}?`)) return;

        setBtnLoading(btn, true, 'Revoking...');
        const res = await apiFetch('/portal/admin/team/revoke', {
          method: 'POST',
          body: JSON.stringify({ invitationId: id, email })
        });
        setBtnLoading(btn, false);

        if (res.ok && res.data && res.data.success) {
          showToast(res.data.message || `Pre-approval for ${email} revoked.`, 'success');
          loadTeamData();
        } else {
          showToast(res.data?.error || 'Failed to revoke pre-approval.', 'error');
        }
      });
    });

    // Attach listeners for Revoke Admin Access
    document.querySelectorAll('.btn-revoke-admin-access').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const email = btn.dataset.email;
        const name = btn.dataset.name;
        if (!isCurrentUserOwner()) {
          showToast('Action denied: Only the Founding Super Admin may revoke administrator access.', 'error');
          return;
        }
        if (isCurrentAdminSelf({ id, email })) {
          showToast('Self-management violation: You cannot revoke your own account.', 'error');
          return;
        }
        openRoleChangeModal(id, 'client', email, name);
      });
    });
  }

  // =========================================================================
  // 9. AUDIT & HISTORY DATA (Redesigned Light-Themed Activity Feed - Priority 7)
  // =========================================================================
  let auditLogsCache = [];

  const ACTION_CONFIG = {
    'PAYMENT_RECORDED': { label: 'Payment Recorded', category: 'payments', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'fa-receipt' },
    'PAYMENT_CORRECTED': { label: 'Payment Corrected', category: 'payments', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'fa-pen-to-square' },
    'PAYMENT_VOIDED': { label: 'Payment Voided', category: 'payments', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', icon: 'fa-ban' },
    'PAYMENT_DELETED': { label: 'Payment Removed', category: 'payments', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', icon: 'fa-trash' },
    'CLIENT_CREATED': { label: 'Client Registered', category: 'clients', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'fa-user-plus' },
    'CLIENT_STATUS_UPDATED': { label: 'Client Status Changed', category: 'clients', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'fa-user-gear' },
    'CLIENT_SUSPENDED': { label: 'Client Suspended', category: 'clients', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'fa-user-lock' },
    'CLIENT_REACTIVATED': { label: 'Client Reactivated', category: 'clients', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'fa-user-check' },
    'CLIENT_DELETED': { label: 'Client Permanently Deleted', category: 'clients', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', icon: 'fa-user-xmark' },
    'ROLE_ASSIGNED': { label: 'Access Role Assigned', category: 'access', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200', icon: 'fa-shield-halved' },
    'ROLE_REVOKED': { label: 'Access Role Revoked', category: 'access', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', icon: 'fa-user-shield' },
    'SERVICE_PROVISIONED': { label: 'Service Provisioned', category: 'services', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'fa-layer-group' },
    'TASK_COMPLETED': { label: 'Task Milestone Delivered', category: 'tasks', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'fa-circle-check' },
    'TASK_CREATED': { label: 'Task Created', category: 'tasks', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', icon: 'fa-list-check' },
    'PROJECT_CREATED': { label: 'Project Created', category: 'services', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: 'fa-folder-plus' }
  };

  async function loadHistoryData() {
    const container = document.getElementById('adminFullHistoryList');
    if (!container) return;

    // Strict RBAC Guard: Audit & Operational History is strictly restricted to Admin and Super Admin
    const userRole = state.adminProfile?.role || '';
    const normRole = typeof normalizeRole === 'function' ? normalizeRole(userRole) : userRole.toLowerCase();
    const isOwner = typeof isCurrentUserOwner === 'function' ? isCurrentUserOwner() : false;
    if (!isOwner && normRole !== 'admin' && normRole !== 'super_admin') {
      console.warn('[RBAC Guard] Unauthorized attempt to load Audit & History by role:', userRole);
      container.innerHTML = `
        <div class="p-8 rounded-2xl bg-white border border-rose-200 text-center text-rose-600 font-semibold shadow-xs">
          <i class="fa-solid fa-shield-halved text-2xl mb-2 text-rose-500 block"></i>
          Access Restricted: Audit & Operational History is strictly restricted to Administrators.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="p-8 rounded-2xl bg-white border border-[#E3E9EF] text-center text-slate-500 italic shadow-xs">
        Loading immutable audit trail...
      </div>
    `;

    // Fetch up to 100 immutable audit entries
    const res = await apiFetch('/audit-logs?limit=100');
    if (res.ok && res.data && res.data.data) {
      auditLogsCache = res.data.data;
    } else {
      // Fallback to recentActivity from stats
      const statsRes = await apiFetch('/portal/admin/stats');
      if (statsRes.ok && statsRes.data && statsRes.data.data?.recentActivity) {
        auditLogsCache = statsRes.data.data.recentActivity;
      }
    }

    renderAuditHistoryList();
  }

  function renderAuditHistoryList() {
    const container = document.getElementById('adminFullHistoryList');
    const countBadge = document.getElementById('auditLogCount');
    if (!container) return;

    const searchTerm = (document.getElementById('auditSearchInput')?.value || '').toLowerCase().trim();
    const category = document.getElementById('auditCategoryFilter')?.value || 'all';

    const filtered = auditLogsCache.filter(l => {
      const conf = ACTION_CONFIG[l.action] || {};
      const cat = conf.category || 'all';

      const matchesCat = category === 'all' || cat === category;
      if (!matchesCat) return false;

      if (!searchTerm) return true;

      const actText = (conf.label || l.action || '').toLowerCase();
      const emailText = (l.user_email || '').toLowerCase();
      const resText = (l.resource_type || '').toLowerCase();
      const resId = (l.resource_id || '').toLowerCase();

      return actText.includes(searchTerm) || emailText.includes(searchTerm) || resText.includes(searchTerm) || resId.includes(searchTerm);
    });

    if (countBadge) {
      countBadge.textContent = `${filtered.length} Event${filtered.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="p-8 rounded-2xl bg-white border border-[#E3E9EF] text-center text-slate-500 italic shadow-xs">
          No audit log events match the current filter.
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(l => {
      const conf = ACTION_CONFIG[l.action] || {
        label: (l.action || 'ACTIVITY').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: 'fa-clock-rotate-left'
      };

      const dateStr = l.created_at ? new Date(l.created_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) : '—';

      const actorEmail = resolveUserIdentity(l.user_email || l.user_id || l.actor_id || 'System', 'actor');
      let resourceInfo = '';
      if (l.resource_type) {
        let resId = l.resource_id ? String(l.resource_id) : '';
        if (resId.startsWith('user_') || resId.startsWith('usr_')) {
          resId = resolveUserIdentity(resId, 'target');
          resourceInfo = `${l.resource_type} (${resId})`;
        } else if (resId.startsWith('org_')) {
          resourceInfo = `${l.resource_type} (Workspace)`;
        } else if (resId) {
          resourceInfo = `${l.resource_type} #${resId.slice(0, 10)}`;
        } else {
          resourceInfo = l.resource_type;
        }
      }

      let detailsHtml = '';
      if (l.details) {
        const detailsFormatted = sanitizeAuditDetails(l.details);

        detailsHtml = `
          <details class="mt-2.5 pt-2 border-t border-slate-100 text-slate-600">
            <summary class="cursor-pointer text-[#147D64] hover:underline font-semibold text-[11px] select-none inline-flex items-center gap-1">
              <i class="fa-solid fa-code text-[10px]"></i>
              <span>Inspection Details</span>
            </summary>
            <pre class="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 overflow-x-auto text-[10px] font-mono text-slate-700 leading-relaxed">${escapeHtml(detailsFormatted)}</pre>
          </details>
        `;
      }

      return `
        <div class="p-4 sm:p-5 rounded-2xl bg-white border border-[#E3E9EF] shadow-xs hover:border-[#147D64]/30 hover:shadow-sm transition-all duration-150">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div class="flex items-center space-x-3 min-w-0">
              <div class="w-9 h-9 rounded-xl bg-slate-50 border border-[#E3E9EF] flex items-center justify-center text-slate-600 shrink-0">
                <i class="fa-solid ${conf.icon || 'fa-clock-rotate-left'} text-xs text-[#147D64]"></i>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-xs text-[#172B36]">${escapeHtml(conf.label)}</span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${conf.badgeClass}">
                    ${escapeHtml(l.action)}
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>By <strong class="text-slate-700">${escapeHtml(actorEmail)}</strong></span>
                  ${resourceInfo ? `<span class="text-slate-300">•</span><span class="font-mono text-slate-600">${escapeHtml(resourceInfo)}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="text-left sm:text-right shrink-0">
              <span class="text-[11px] font-mono text-slate-500">${escapeHtml(dateStr)}</span>
            </div>
          </div>
          ${detailsHtml}
        </div>
      `;
    }).join('');
  }

  // Admin Panel: Pure ledger data-entry and management interface. Zero admin PDF generation.

  // Finance Subtab Loaders
  async function loadInvoicesData() {
    const tbody = document.getElementById('adminInvoicesTableBody');
    if (!tbody) return;

    try {
      const res = await apiFetch('/finance/invoices');
      if (res.ok && res.data && res.data.data) {
        const invoices = res.data.data;
        if (invoices.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500 italic">No invoices created yet. Recording payments will auto-link invoices.</td></tr>';
          return;
        }

        tbody.innerHTML = invoices.map(inv => {
          const isPaid = inv.outstanding_balance_cents === 0 || inv.status === 'paid';
          return `
            <tr class="hover:bg-slate-50/80 transition-colors border-b border-[#E3E9EF]">
              <td class="px-6 py-4 font-mono font-bold text-[#172B36]">${escapeHtml(inv.invoice_number)}</td>
              <td class="px-6 py-4">
                <div class="font-bold text-[#172B36]">${escapeHtml(inv.organization_name || 'Client')}</div>
                <div class="text-[11px] text-slate-400">Due: ${escapeHtml(inv.due_date || 'N/A')}</div>
              </td>
              <td class="px-6 py-4 font-mono font-bold text-[#172B36]">${formatCurrency(inv.total_cents || 0, inv.currency || 'USD')}</td>
              <td class="px-6 py-4 font-mono font-bold ${isPaid ? 'text-emerald-600' : 'text-amber-600'}">${formatCurrency(inv.outstanding_balance_cents || 0, inv.currency || 'USD')}</td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
                  ${isPaid ? 'Paid in Full' : 'Pending'}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <span class="text-xs font-mono text-slate-400 font-semibold">Recorded</span>
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (e) {
      console.warn('Error loading invoices:', e);
    }
  }

  async function loadPaymentMethodsData() {
    const container = document.getElementById('paymentMethodsConfigList');
    if (!container) return;

    try {
      const res = await apiFetch('/finance/payment-methods');
      if (res.ok && res.data && res.data.data) {
        const methods = res.data.data;
        container.innerHTML = methods.map(m => {
          return `
            <div class="p-4 rounded-2xl bg-slate-50 border border-[#E3E9EF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-xs text-[#172B36]">${escapeHtml(m.display_name)}</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white border border-[#E3E9EF] text-slate-600">${escapeHtml(m.method_key)}</span>
                </div>
                <div class="text-[11px] text-slate-500">
                  <span>Provider: <strong class="text-slate-700">${escapeHtml(m.provider_name || 'N/A')}</strong></span>
                  <span class="mx-1.5">•</span>
                  <span>Account: <strong class="text-slate-700">${escapeHtml(m.account_name || 'N/A')}</strong> (${escapeHtml(m.account_number || 'N/A')})</span>
                  ${m.bank_name ? `<span class="mx-1.5">•</span><span>Bank: ${escapeHtml(m.bank_name)}</span>` : ''}
                </div>
              </div>
              <button type="button" class="btn-edit-method px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-[#E3E9EF] text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto" data-key="${m.method_key}">
                <i class="fa-solid fa-pen-to-square mr-1 text-[#147D64]"></i> Configure Details
              </button>
            </div>
          `;
        }).join('');

        container.querySelectorAll('.btn-edit-method').forEach(btn => {
          btn.addEventListener('click', () => {
            const m = methods.find(x => x.method_key === btn.dataset.key);
            if (!m) return;
            document.getElementById('editMethodKey').value = m.method_key;
            document.getElementById('editMethodModalTitle').textContent = `Configure ${m.display_name}`;
            document.getElementById('editMethodDisplayName').value = m.display_name;
            document.getElementById('editMethodProvider').value = m.provider_name || '';
            document.getElementById('editMethodAccountName').value = m.account_name || '';
            document.getElementById('editMethodAccountNumber').value = m.account_number || '';
            document.getElementById('editMethodBankName').value = m.bank_name || '';
            document.getElementById('editMethodBranchName').value = m.branch_name || '';
            document.getElementById('editMethodInstructions').value = m.instructions || '';
            document.getElementById('modalEditPaymentMethod')?.classList.remove('hidden');
          });
        });
      }
    } catch (e) {
      console.warn('Error loading payment methods:', e);
    }
  }

  function initFinanceSubtabs() {
    const tabPay = document.getElementById('subtabPayments');
    const tabInv = document.getElementById('subtabInvoices');
    const tabMet = document.getElementById('subtabMethods');
    const secPay = document.getElementById('sectionFinancePayments');
    const secInv = document.getElementById('sectionFinanceInvoices');
    const secMet = document.getElementById('sectionFinanceMethods');

    const setActive = (activeTab, activeSec) => {
      [tabPay, tabInv, tabMet].forEach(t => {
        if (!t) return;
        t.className = (t === activeTab)
          ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-[#147D64] text-white transition-all cursor-pointer'
          : 'px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer';
      });
      [secPay, secInv, secMet].forEach(s => {
        if (!s) return;
        s.classList.toggle('hidden', s !== activeSec);
      });
    };

    if (tabPay) tabPay.onclick = () => { setActive(tabPay, secPay); loadFinanceData(); };
    if (tabInv) tabInv.onclick = () => { setActive(tabInv, secInv); loadInvoicesData(); };
    if (tabMet) tabMet.onclick = () => { setActive(tabMet, secMet); loadPaymentMethodsData(); };

    // Method settings modal save
    const formMethod = document.getElementById('formEditPaymentMethod');
    if (formMethod && !formMethod.dataset.bound) {
      formMethod.dataset.bound = 'true';
      formMethod.addEventListener('submit', async (e) => {
        e.preventDefault();
        const key = document.getElementById('editMethodKey').value;
        const payload = {
          displayName: document.getElementById('editMethodDisplayName').value.trim(),
          providerName: document.getElementById('editMethodProvider').value.trim(),
          accountName: document.getElementById('editMethodAccountName').value.trim(),
          accountNumber: document.getElementById('editMethodAccountNumber').value.trim(),
          bankName: document.getElementById('editMethodBankName').value.trim() || null,
          branchName: document.getElementById('editMethodBranchName').value.trim() || null,
          instructions: document.getElementById('editMethodInstructions').value.trim() || null
        };

        const res = await apiFetch(`/finance/payment-methods/${key}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });

        if (res.ok && res.data && res.data.success) {
          showToast('Payment method configuration updated!', 'success');
          document.getElementById('modalEditPaymentMethod')?.classList.add('hidden');
          loadPaymentMethodsData();
        } else {
          showToast(res.data?.error || 'Failed to update payment method.', 'error');
        }
      });
    }

    const btnOpenMethods = document.getElementById('btnOpenPaymentMethodsModal');
    if (btnOpenMethods) {
      btnOpenMethods.onclick = () => {
        setActive(tabMet, secMet);
        loadPaymentMethodsData();
      };
    }
  }

  // CLERK AUTHENTICATED PASSWORD CHANGE WORKFLOW
  // =========================================================================
  async function handleAdminPasswordChange(e) {
    e.preventDefault();
    const btn = document.getElementById('adminUpdatePasswordBtn');
    const currentPassEl = document.getElementById('adminCurrentPassword');
    const newPassEl = document.getElementById('adminNewPassword');
    const confirmPassEl = document.getElementById('adminConfirmNewPassword');
    const signOthersEl = document.getElementById('adminSignOutOfOthers');

    const currentPassword = currentPassEl.value;
    const newPassword = newPassEl.value;
    const confirmPassword = confirmPassEl.value;
    const signOutOfOtherSessions = signOthersEl ? signOthersEl.checked : true;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please complete all password fields.', 'warn');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match. Please verify.', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', 'warn');
      return;
    }

    setBtnLoading(btn, true, 'Updating via Clerk...');

    try {
      const user = window.Clerk.user;
      if (!user) throw new Error('No active Clerk authentication session.');

      await user.updatePassword({
        currentPassword,
        newPassword,
        signOutOfOtherSessions
      });

      showToast('Password updated successfully! All other sessions signed out.', 'success');
      e.target.reset();
    } catch (err) {
      console.error('Password change error:', err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Failed to update password.';
      showToast(msg, 'error');
    } finally {
      setBtnLoading(btn, false);
    }
  }


  // =========================================================================
  // 10. CLIENT SUPPORT DESK DATA & WORKFLOWS
  // =========================================================================
  async function loadSupportData(showNotification = false) {
    const tbody = document.getElementById('adminSupportTableBody');
    const cards = document.getElementById('adminSupportCardsContainer');
    const emptyState = document.getElementById('supportEmptyState');
    const tableCard = document.getElementById('adminSupportTableCard');
    const refreshBtn = document.getElementById('btnRefreshSupport');

    if (refreshBtn) {
      const icon = refreshBtn.querySelector('i');
      if (icon) icon.classList.add('fa-spin');
    }

    // Loading State
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500 italic"><i class="fa-solid fa-circle-notch fa-spin mr-2 text-[#087F70]"></i>Loading support tickets...</td></tr>';
    }
    if (cards) {
      cards.innerHTML = '<div class="p-8 rounded-2xl bg-white border border-[#E3E9EF] text-center shadow-xs space-y-2"><i class="fa-solid fa-circle-notch fa-spin text-[#087F70] text-lg"></i><p class="text-xs text-slate-500 font-medium">Loading support requests...</p></div>';
    }

    try {
      const res = await apiFetch('/portal/admin/support');
      if (refreshBtn) {
        const icon = refreshBtn.querySelector('i');
        if (icon) icon.classList.remove('fa-spin');
      }

      if (res.ok && res.data) {
        state.supportCache = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        initGlassSelects();
        renderSupport();
        if (showNotification) showToast('Support tickets synchronized.', 'success');
      } else {
        const err = res.data?.error || 'Failed to retrieve support requests.';
        console.error('Support Fetch Error:', err);
        const errorCard = `
          <div class="p-6 rounded-2xl sm:rounded-3xl bg-white border border-rose-200 text-center space-y-3 shadow-xs">
            <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-base">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h4 class="text-xs font-bold text-rose-600">${escapeHtml(err)}</h4>
            <p class="text-xs text-slate-500 max-w-xs mx-auto">Unable to retrieve support tickets from the backend. Please check connection and retry.</p>
            <button type="button" class="btn-retry-support h-10 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs">
              <i class="fa-solid fa-arrows-rotate text-xs text-[#087F70]"></i>
              <span>Retry Connection</span>
            </button>
          </div>
        `;
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-6 text-center text-rose-500 font-medium">${escapeHtml(err)} <button type="button" class="btn-retry-support ml-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"><i class="fa-solid fa-arrows-rotate mr-1"></i>Retry</button></td></tr>`;
        if (cards) cards.innerHTML = errorCard;
        if (showNotification) showToast(err, 'error');
      }
    } catch (e) {
      console.error('loadSupportData exception:', e);
      if (refreshBtn) {
        const icon = refreshBtn.querySelector('i');
        if (icon) icon.classList.remove('fa-spin');
      }
      const failMsg = 'Network error fetching support tickets. Please retry.';
      const errorCard = `
        <div class="p-6 rounded-2xl sm:rounded-3xl bg-white border border-rose-200 text-center space-y-3 shadow-xs">
          <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-base">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h4 class="text-xs font-bold text-rose-600">${failMsg}</h4>
          <p class="text-xs text-slate-500 max-w-xs mx-auto">Unable to reach the support service. Please check connection and retry.</p>
          <button type="button" class="btn-retry-support h-10 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs">
            <i class="fa-solid fa-arrows-rotate text-xs text-[#087F70]"></i>
            <span>Retry Connection</span>
          </button>
        </div>
      `;
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-6 text-center text-rose-500 font-medium">${failMsg} <button type="button" class="btn-retry-support ml-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"><i class="fa-solid fa-arrows-rotate mr-1"></i>Retry</button></td></tr>`;
      if (cards) cards.innerHTML = errorCard;
      if (showNotification) showToast(failMsg, 'error');
    }
  }

  function renderSupport() {
    const tbody = document.getElementById('adminSupportTableBody');
    const cards = document.getElementById('adminSupportCardsContainer');
    const emptyState = document.getElementById('supportEmptyState');
    const tableCard = document.getElementById('adminSupportTableCard');

    const totalEl = document.getElementById('supportTotalCount');
    const openEl = document.getElementById('supportOpenCount');
    const inProgEl = document.getElementById('supportInProgressCount');
    const resolvedEl = document.getElementById('supportResolvedCount');

    const tickets = state.supportCache || [];

    const totalCount = tickets.length;
    const openCount = tickets.filter(t => t.status === 'open').length;
    const inProgCount = tickets.filter(t => t.status === 'in_progress').length;
    const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

    if (totalEl) totalEl.textContent = totalCount;
    if (openEl) openEl.textContent = openCount;
    if (inProgEl) inProgEl.textContent = inProgCount;
    if (resolvedEl) resolvedEl.textContent = resolvedCount;

    // Empty state when 0 tickets exist in DB
    if (totalCount === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      if (tableCard) tableCard.classList.add('hidden');
      if (cards) cards.innerHTML = '';
      return;
    } else {
      if (emptyState) emptyState.classList.add('hidden');
      if (tableCard) tableCard.classList.remove('hidden');
    }

    const query = (document.getElementById('supportSearchInput')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('supportStatusFilter')?.value || 'all';

    // Toggle search clear button
    const searchClearBtn = document.getElementById('supportSearchClear');
    if (searchClearBtn) {
      searchClearBtn.classList.toggle('hidden', !query);
    }

    const filtered = tickets.filter(t => {
      const matchQuery = !query ||
        (t.full_name || '').toLowerCase().includes(query) ||
        (t.email || '').toLowerCase().includes(query) ||
        (t.organization_name || '').toLowerCase().includes(query) ||
        (t.subject || '').toLowerCase().includes(query) ||
        (t.message || '').toLowerCase().includes(query) ||
        (t.id || '').toLowerCase().includes(query);

      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchQuery && matchStatus;
    });

    if (filtered.length === 0) {
      const noMatchMsg = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500 italic">No support requests match your search criteria.</td></tr>';
      if (tbody) tbody.innerHTML = noMatchMsg;
      if (cards) {
        cards.innerHTML = `
          <div class="p-8 rounded-2xl sm:rounded-3xl bg-white border border-[#E3E9EF] text-center shadow-xs space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mx-auto text-slate-400">
              <i class="fa-solid fa-filter-circle-xmark text-lg"></i>
            </div>
            <h4 class="text-sm font-bold text-[#172B36]">No Matching Requests</h4>
            <p class="text-xs text-slate-500 max-w-xs mx-auto">Try changing your search query or status filter.</p>
            <button type="button" id="btnClearSupportFilters" class="h-10 px-4 rounded-xl text-xs font-bold text-[#087F70] bg-[#EAF5F1] hover:bg-[#D5EDE5] border border-[#087F70]/20 transition-all inline-flex items-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-arrows-rotate text-xs"></i>
              <span>Reset All Filters</span>
            </button>
          </div>
        `;
      }
      return;
    }

    const STATUS_BADGES = {
      open: '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 shadow-xs"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Open</span>',
      in_progress: '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-xs"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> In Progress</span>',
      resolved: '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Resolved</span>',
      closed: '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 shadow-xs"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Closed</span>'
    };

    // Desktop Table View
    if (tbody) {
      tbody.innerHTML = filtered.map(t => {
        const dateStr = t.created_at ? new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
        const excerpt = (t.message || '').length > 65 ? (t.message.slice(0, 65) + '...') : t.message;
        const orgBadge = t.organization_name ? `<span class="text-[10px] text-slate-400 font-medium">(${escapeHtml(t.organization_name)})</span>` : '';
        const badge = STATUS_BADGES[t.status] || STATUS_BADGES.open;

        return `
          <tr class="hover:bg-slate-50 transition-colors border-b border-[#E3E9EF]">
            <td class="px-6 py-4">
              <div class="font-bold text-[#172B36] flex items-center gap-1.5">
                <span>${escapeHtml(t.full_name || 'Client')}</span>
                ${orgBadge}
              </div>
              <div class="font-mono text-xs text-slate-500">${escapeHtml(t.email)}</div>
            </td>
            <td class="px-6 py-4 font-semibold text-[#172B36] max-w-[200px] truncate">${escapeHtml(t.subject)}</td>
            <td class="px-6 py-4 text-xs text-slate-600 max-w-[260px] truncate">${escapeHtml(excerpt)}</td>
            <td class="px-6 py-4 font-mono text-xs text-slate-500">${escapeHtml(dateStr)}</td>
            <td class="px-6 py-4">${badge}</td>
            <td class="px-6 py-4 text-right">
              <button type="button" class="btn-view-support-ticket h-9 px-3 rounded-xl text-xs font-bold bg-[#087F70]/10 text-[#087F70] hover:bg-[#087F70]/20 border border-[#087F70]/20 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs" data-id="${t.id}">
                <i class="fa-solid fa-eye text-[10px]"></i>
                <span>View Request</span>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Mobile Cards View (Task 5: WHIZ Premium Support Command Center)
    if (cards) {
      cards.innerHTML = filtered.map(t => {
        const dateStr = t.created_at ? new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
        const excerpt = (t.message || '').length > 120 ? (t.message.slice(0, 120) + '...') : t.message;
        const badge = STATUS_BADGES[t.status] || STATUS_BADGES.open;
        const rawId = t.id || '';
        const ticketRef = rawId.length > 10 ? ('#' + rawId.slice(0, 8).toUpperCase()) : ('#' + rawId);
        const name = t.full_name || 'Client';
        const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CL';

        return `
          <div class="support-ticket-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E6ECE9] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(20,125,100,0.08)] transition-all space-y-3.5">
            <!-- Header: Reference ID + Organization Tag + Status Badge -->
            <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div class="flex items-center gap-2 min-w-0">
                <span class="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] font-bold shrink-0">
                  ${escapeHtml(ticketRef)}
                </span>
                ${t.organization_name ? `
                  <span class="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 truncate" title="${escapeHtml(t.organization_name)}">
                    ${escapeHtml(t.organization_name)}
                  </span>
                ` : ''}
              </div>
              <div class="shrink-0 flex items-center gap-2">
                ${badge}
              </div>
            </div>

            <!-- Client Identity & Submission Date -->
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#EAF5F1] to-[#D5EDE5] border border-[#087F70]/20 flex items-center justify-center font-black text-xs text-[#087F70] uppercase shrink-0 shadow-xs">
                ${escapeHtml(initials)}
              </div>
              <div class="min-w-0 flex-1">
                <h4 class="text-sm font-black text-[#172B36] truncate leading-tight">${escapeHtml(name)}</h4>
                <p class="text-xs font-mono text-slate-500 truncate mt-0.5">${escapeHtml(t.email)}</p>
                <div class="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-1">
                  <i class="fa-regular fa-clock text-[9px]"></i>
                  <span>${escapeHtml(dateStr)}</span>
                </div>
              </div>
            </div>

            <!-- Ticket Subject & Message Content Excerpt -->
            <div class="p-3 rounded-xl bg-slate-50/70 border border-slate-100/80 space-y-1">
              <div class="text-xs font-bold text-[#172B36] break-words line-clamp-1">${escapeHtml(t.subject)}</div>
              <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed">${escapeHtml(excerpt)}</p>
            </div>

            <!-- Action Area (44px touch target) -->
            <div class="pt-1 flex items-center justify-end">
              <button type="button" class="btn-view-support-ticket w-full sm:w-auto h-11 px-5 rounded-xl text-xs font-bold btn-glass-primary shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer" data-id="${t.id}">
                <i class="fa-solid fa-eye text-xs"></i>
                <span>View &amp; Resolve Ticket</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Bind View Detail Buttons
    document.querySelectorAll('.btn-view-support-ticket').forEach(btn => {
      btn.addEventListener('click', () => {
        openSupportDetailModal(btn.dataset.id);
      });
    });
  }

  function openSupportDetailModal(ticketId) {
    const ticket = (state.supportCache || []).find(t => t.id === ticketId);
    if (!ticket) return;

    const modal = document.getElementById('modalSupportDetail');
    if (!modal) return;

    const idEl = document.getElementById('modalSupportTicketId');
    const nameEl = document.getElementById('modalSupportClientName');
    const emailEl = document.getElementById('modalSupportClientEmail');
    const orgEl = document.getElementById('modalSupportOrgName');
    const dateEl = document.getElementById('modalSupportCreatedAt');
    const subjEl = document.getElementById('modalSupportSubject');
    const msgEl = document.getElementById('modalSupportMessage');
    const statusSelect = document.getElementById('modalSupportNewStatus');
    const notesEl = document.getElementById('modalSupportAdminNotes');
    const hiddenId = document.getElementById('modalSupportHiddenId');
    const badgeEl = document.getElementById('modalSupportStatusBadge');

    if (idEl) idEl.textContent = ticket.id;
    if (nameEl) nameEl.textContent = ticket.full_name || 'Client';
    if (emailEl) emailEl.textContent = ticket.email;
    if (orgEl) orgEl.textContent = ticket.organization_name || 'Individual Client';
    if (dateEl) dateEl.textContent = ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'N/A';
    if (subjEl) subjEl.textContent = ticket.subject;
    if (msgEl) msgEl.textContent = ticket.message;
    if (statusSelect) {
      statusSelect.value = ticket.status || 'open';
      statusSelect.dispatchEvent(new Event('change'));
    }
    if (notesEl) notesEl.value = ticket.admin_notes || '';
    if (hiddenId) hiddenId.value = ticket.id;

    if (badgeEl) {
      badgeEl.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ' +
        (ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
         ticket.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
         'bg-blue-50 text-blue-700 border-blue-200');
      badgeEl.textContent = (ticket.status || 'open').replace('_', ' ');
    }

    modal.classList.remove('hidden');
  }

  // =========================================================================
  // 11. ACCOUNT SECURITY & TRUSTED DEVICES WORKFLOWS
  // =========================================================================
  async function loadSecurityData() {
    const user = window.Clerk?.user || state.currentUser;
    const profile = state.adminProfile || {};

    const fullName = user?.fullName || profile.full_name || 'Administrator';
    const email = user?.primaryEmailAddress?.emailAddress || profile.email || 'admin@example.com';
    const username = user?.username ? `@${user.username}` : (profile.email ? `@${profile.email.split('@')[0]}` : '@admin');
    const clerkId = user?.id || profile.clerkUserId || 'user_...';
    const isOwner = isCurrentUserOwner();

    const fullNameEl = document.getElementById('secFullName');
    const emailEl = document.getElementById('secUserEmail');
    const usernameEl = document.getElementById('secUsername');
    const clerkIdEl = document.getElementById('secClerkUserId');
    const clerkIdShortEl = document.getElementById('secClerkIdShort');
    const roleBadgeEl = document.getElementById('secRoleBadge');
    const authProviderEl = document.getElementById('secAuthProvider');
    const currentDeviceEl = document.getElementById('secCurrentDevice');
    const lastActiveEl = document.getElementById('secLastActiveTime');

    if (fullNameEl) fullNameEl.textContent = fullName;
    if (emailEl) emailEl.textContent = email;
    if (usernameEl) usernameEl.textContent = username;
    if (clerkIdEl) clerkIdEl.innerHTML = '<i class="fa-solid fa-shield-halved text-[#147D64]"></i> Hardware-Backed SSO Token Active';
    if (clerkIdShortEl) clerkIdShortEl.innerHTML = '<i class="fa-solid fa-shield-halved text-[10px] mr-1"></i>SSO Session Verified';
    if (lastActiveEl) lastActiveEl.textContent = `Session Active (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;

    if (roleBadgeEl) {
      roleBadgeEl.innerHTML = isOwner
        ? '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-crown text-[9px] text-amber-500"></i> Founding Owner</span>'
        : (typeof getRoleBadgeForRole === 'function' ? getRoleBadgeForRole(profile.role, false) : '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200"><i class="fa-solid fa-shield-halved text-[9px]"></i> ' + escapeHtml(profile.role || 'Staff') + '</span>');
    }

    const hasGoogle = user?.externalAccounts?.some(a => a.provider === 'google');
    if (authProviderEl) {
      if (hasGoogle) {
        authProviderEl.innerHTML = '<i class="fa-brands fa-google text-slate-700 text-xs"></i><span>Google OAuth SSO</span>';
      } else {
        authProviderEl.innerHTML = '<i class="fa-solid fa-key text-slate-700 text-xs"></i><span>Clerk Password</span>';
      }
    }

    const googleNotice = document.getElementById('adminGoogleOnlyNotice');
    const currentPassDiv = document.getElementById('divCurrentPassword');
    const hasPassword = user?.passwordEnabled ?? true;

    if (!hasPassword && hasGoogle) {
      if (googleNotice) googleNotice.classList.remove('hidden');
      if (currentPassDiv) currentPassDiv.classList.add('hidden');
    } else {
      if (googleNotice) googleNotice.classList.add('hidden');
      if (currentPassDiv) currentPassDiv.classList.remove('hidden');
    }

    if (currentDeviceEl) {
      const ua = navigator.userAgent;
      let dev = 'Desktop Browser';
      if (/Android/i.test(ua)) dev = 'Android Device';
      else if (/iPhone/i.test(ua)) dev = 'Apple iPhone';
      else if (/iPad/i.test(ua)) dev = 'Apple iPad';
      else if (/Macintosh/i.test(ua)) dev = 'macOS Workstation';
      else if (/Windows/i.test(ua)) dev = 'Windows PC';
      currentDeviceEl.textContent = dev;
    }

    await loadTrustedDevices();
  }

  async function loadTrustedDevices() {
    const container = document.getElementById('trustedDevicesList');
    if (!container) return;

    try {
      const res = await apiFetch('/security/trusted-devices');
      if (res.ok && res.data) {
        state.trustedDevicesCache = Array.isArray(res.data.data) ? res.data.data : [];
        renderTrustedDevices();
      } else {
        container.innerHTML = `<div class="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500 italic">No application-trusted devices registered yet.</div>`;
      }
    } catch (e) {
      console.error('loadTrustedDevices error:', e);
      container.innerHTML = `<div class="p-6 rounded-2xl bg-rose-50 border border-rose-100 text-center text-xs text-rose-500 font-medium">Failed to load recognized devices.</div>`;
    }
  }

  function renderTrustedDevices() {
    const container = document.getElementById('trustedDevicesList');
    if (!container) return;

    const devices = state.trustedDevicesCache || [];

    if (devices.length === 0) {
      container.innerHTML = `
        <div class="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
          <div class="text-xs font-bold text-[#172B36]">No Trusted Devices Registered</div>
          <p class="text-[11px] text-slate-500 max-w-sm mx-auto">Click "Trust Current Device" above to register this browser into Cloudflare security policies.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = devices.map(d => {
      const dateStr = d.last_used_at ? new Date(d.last_used_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';
      return `
        <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <i class="fa-solid fa-laptop text-xs"></i>
            </div>
            <div>
              <div class="text-xs font-bold text-[#172B36] flex items-center gap-2">
                <span>${escapeHtml(d.device_name || 'Browser Device')}</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">Trusted</span>
              </div>
              <div class="text-[11px] font-mono text-slate-400 mt-0.5">${escapeHtml(d.ip_address || '127.0.0.1')} • Last active: ${escapeHtml(dateStr)}</div>
            </div>
          </div>
          <button type="button" class="btn-revoke-device px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all self-start sm:self-auto cursor-pointer" data-id="${d.id}" data-name="${escapeHtml(d.device_name || 'Device')}">
            <i class="fa-solid fa-trash-can mr-1 text-[10px]"></i>Revoke
          </button>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.btn-revoke-device').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        if (!confirm(`Are you sure you want to revoke trust for '${name}'?`)) return;

        setBtnLoading(btn, true, 'Revoking...');
        const res = await apiFetch(`/security/trusted-devices/${id}`, { method: 'DELETE' });
        setBtnLoading(btn, false);

        if (res.ok && res.data?.success) {
          showToast(`Device '${name}' revoked successfully.`, 'success');
          loadTrustedDevices();
        } else {
          showToast(res.data?.error || 'Failed to revoke device.', 'error');
        }
      });
    });
  }

  // =========================================================================
  // MODALS & EVENT HANDLERS
  // =========================================================================
  function initModals() {
    // 1. Open Add Client Modal
    const renderAddClientServices = () => {
      const box = document.getElementById('addClientServicesCheckboxes');
      if (!box) return;
      if (state.servicesCache && state.servicesCache.length > 0) {
        box.innerHTML = state.servicesCache.map(s => {
          const code = escapeHtml(s.code || (s.id || '').toUpperCase());
          const name = escapeHtml(s.name || '');
          const cat = escapeHtml(s.category || '');
          const id = escapeHtml(s.id || '');
          return `
            <label class="service-checkbox-card group flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#E3E9EF] hover:border-[#087F70]/40 hover:bg-[#FAFCFB] transition-all cursor-pointer shadow-2xs select-none">
              <input type="checkbox" name="services" value="${id}" class="service-checkbox-input mt-0.5 w-4 h-4 rounded text-[#087F70] accent-[#087F70] border-slate-300 focus:ring-[#087F70] focus:ring-offset-0 cursor-pointer shrink-0">
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <span class="service-card-title text-xs font-semibold text-[#172B36] group-hover:text-[#087F70] transition-colors truncate">${name}</span>
                  <span class="service-card-badge text-[10px] font-mono font-bold uppercase tracking-wider text-[#087F70] bg-[#EAF5F1] px-2 py-0.5 rounded-md border border-[#087F70]/20 shrink-0">${code}</span>
                </div>
                ${cat ? `<p class="service-card-cat text-[11px] text-slate-500 font-normal truncate mt-0.5">${cat}</p>` : ''}
              </div>
            </label>
          `;
        }).join('');
      }
    };

    // Wire up live service card highlight sync
    const serviceBox = document.getElementById('addClientServicesCheckboxes');
    serviceBox?.addEventListener('change', (e) => {
      if (e.target && e.target.name === 'services') {
        const card = e.target.closest('.service-checkbox-card');
        if (card) {
          card.classList.toggle('is-checked', e.target.checked);
        }
      }
    });

    const openAddClient = () => {
      const modal = document.getElementById('modalAddClient');
      if (modal) {
        modal.classList.remove('hidden');
        renderAddClientServices();
        initGlassSelects();
      }
    };

    document.getElementById('btnOpenAddClientModal')?.addEventListener('click', openAddClient);
    document.getElementById('btnQuickAddClient')?.addEventListener('click', openAddClient);

    // Form Add Client Submit
    document.getElementById('formAddClient')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const submitBtn = f.querySelector('button[type="submit"]');
      const selectedServices = Array.from(f.querySelectorAll('input[name="services"]:checked')).map(i => i.value);

      const payload = {
        fullName: f.fullName.value,
        companyName: f.companyName.value,
        email: f.email.value,
        phone: f.phone.value,
        city: f.city.value,
        country: f.country.value,
        address: f.address.value,
        currency: f.currency ? f.currency.value : 'BDT',
        selectedServiceIds: selectedServices
      };

      setBtnLoading(submitBtn, true, 'Creating client & provisioning tasks...');

      const res = await apiFetch('/clients', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setBtnLoading(submitBtn, false);

      if (res.ok && res.data && res.data.success) {
        showToast(res.data.message || 'Client created successfully!', 'success');
        f.reset();
        initGlassSelects();
        document.querySelectorAll('#addClientServicesCheckboxes .service-checkbox-card').forEach(c => c.classList.remove('is-checked'));
        document.getElementById('modalAddClient')?.classList.add('hidden');
        loadClientsData();
        loadProjectsData();
        loadTasksData();
        if (res.data.data?.clientId) {
          openClientDetails(res.data.data.clientId);
        }
      } else {
        showToast(res.data?.error || 'Failed to create client.', 'error');
      }
    });

    // 2. Client Details Workspace Handlers
    document.getElementById('btnBackToClients')?.addEventListener('click', () => {
      switchTab('clients');
    });

    // Client Search & Status Filter
    document.getElementById('adminClientSearchInput')?.addEventListener('input', () => {
      loadClientsData();
    });

    document.getElementById('adminClientStatusFilter')?.addEventListener('change', () => {
      loadClientsData();
    });

    // Edit Client Profile & Authoritative CIF Modal
    // Reset Client Receipt Download Limit (Phase 1 Flexibility Control & Quota Recovery)
    document.getElementById('btnResetClientReceiptLimit')?.addEventListener('click', async () => {
      const clientId = state.selectedClientId;
      if (!clientId) {
        showToast('Please select a client first.', 'error');
        return;
      }
      const clientName = document.getElementById('clientCardFullName')?.textContent?.trim() || 'Client';
      const btn = document.getElementById('btnResetClientReceiptLimit');
      setBtnLoading(btn, true, 'Restoring limit...');
      try {
        const payload = {
          clientId,
          daily_pdf_downloads: 0,
          organizationId: state.selectedClient?.organization_id || null,
          userId: state.selectedClient?.id || null,
          clerkUserId: state.selectedClient?.clerk_user_id || null,
          email: state.selectedClient?.email || null
        };
        // Use POST for universal preflight and proxy compatibility
        const res = await apiFetch(`/pdf/quota/reset/${encodeURIComponent(clientId)}`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setBtnLoading(btn, false);
        if (res.ok && res.data && res.data.success) {
          if (state.selectedClient) {
            state.selectedClient.receiptQuota = { used: 0, max: 2, remaining: 2, isLimitReached: false };
            state.selectedClient.dailyPdfDownloads = 0;
          }
          showToast(`Receipt download limit for ${clientName} has been successfully restored (2/2 allowance available).`, 'success');
        } else {
          showToast(res.data?.error || 'Failed to reset download limit.', 'error');
        }
      } catch (err) {
        setBtnLoading(btn, false);
        showToast('Network error while resetting quota.', 'error');
      }
    });

    document.getElementById('btnOpenEditClientModal')?.addEventListener('click', async () => {
      const clientId = state.selectedClientId;
      if (!clientId) return;

      const res = await apiFetch(`/clients/${clientId}`);
      if (!res.ok || !res.data || !res.data.data?.client) return;

      const c = res.data.data.client;
      const cif = c.cif || {};

      document.getElementById('editClientId').value = c.id;
      document.getElementById('editClientFullName').value = cif.fullName || c.full_name || '';
      document.getElementById('editClientBillingName').value = cif.billingName || cif.fullName || c.full_name || '';
      document.getElementById('editClientCompanyName').value = cif.companyName || c.company_name || '';
      document.getElementById('editClientEmail').value = c.email || '';
      document.getElementById('editClientPhone').value = cif.phone || c.phone || '';
      document.getElementById('editClientAddress').value = cif.address || c.address || '';
      document.getElementById('editClientCity').value = cif.city || c.city || 'Dhaka';
      document.getElementById('editClientPostalCode').value = cif.postalCode || '';
      document.getElementById('editClientCountry').value = cif.country || c.country || 'Bangladesh';
      document.getElementById('editClientCurrency').value = cif.currency || c.currency || 'USD';
      document.getElementById('editClientTaxId').value = cif.taxId || '';

      const lockSelect = document.getElementById('editClientIsLocked');
      if (lockSelect) {
        lockSelect.value = cif.isLocked ? '1' : '0';
      }

      document.getElementById('editClientStatus').value = c.status || 'active';

      // Completion badge
      const badge = document.getElementById('editClientCompletionBadge');
      if (badge) {
        const pct = cif.completionPercentage !== undefined ? cif.completionPercentage : (c.cif_completion_percentage || 0);
        const locked = Boolean(cif.isLocked);
        if (pct === 100 && locked) {
          badge.className = 'text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60';
          badge.textContent = '100% (Verified & Locked)';
        } else if (pct === 100) {
          badge.className = 'text-xs px-2.5 py-1 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60';
          badge.textContent = '100% (Unlocked Draft)';
        } else {
          badge.className = 'text-xs px-2.5 py-1 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60';
          badge.textContent = `${pct}% (Incomplete)`;
        }
      }

      // Audit trail note
      const auditText = document.getElementById('editClientAuditText');
      if (auditText) {
        const parts = [];
        if (cif.lastModifiedBy) {
          parts.push(`Last modified by ${cif.lastModifiedBy} (${cif.lastModifiedAt ? new Date(cif.lastModifiedAt).toLocaleDateString() : 'N/A'})`);
        }
        if (cif.lockedAt) {
          parts.push(`Locked by ${cif.lockedBy || 'System'} on ${new Date(cif.lockedAt).toLocaleDateString()}`);
        }
        auditText.textContent = parts.length > 0 ? parts.join(' • ') : 'No modifications recorded yet.';
      }

      initGlassSelects();
      document.getElementById('modalEditClient')?.classList.remove('hidden');
    });

    document.getElementById('formEditClient')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const clientId = f.clientId.value;
      const submitBtn = f.querySelector('button[type="submit"]');

      setBtnLoading(submitBtn, true, 'Saving changes...');

      const payload = {
        fullName: f.fullName.value.trim(),
        billingName: f.billingName.value.trim(),
        companyName: f.companyName.value.trim(),
        phone: f.phone.value.trim(),
        address: f.address.value.trim(),
        city: f.city.value.trim(),
        postalCode: f.postalCode.value.trim(),
        country: f.country.value.trim(),
        currency: f.currency.value,
        taxId: f.taxId.value.trim(),
        isLocked: f.isLocked.value === '1',
        status: f.status.value
      };

      const res = await apiFetch(`/clients/${clientId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setBtnLoading(submitBtn, false);

      if (res.ok && res.data && res.data.success) {
        showToast('Client profile and CIF updated successfully!', 'success');
        document.getElementById('modalEditClient')?.classList.add('hidden');
        openClientDetails(clientId);
        loadClientsData();
      } else {
        showToast(res.data?.error || 'Failed to update profile.', 'error');
      }
    });

    // Assign Service to Client
    document.getElementById('btnOpenAssignServiceClientModal')?.addEventListener('click', () => {
      const clientId = state.selectedClientId;
      if (!clientId) return;

      document.getElementById('assignServiceClientId').value = clientId;
      const select = document.getElementById('assignServiceSelect');
      const menu = document.getElementById('assignServiceMenu');
      const triggerLabel = document.getElementById('assignServiceCurrentLabel');

      if (select) {
        select.innerHTML = '<option value="">Choose a service...</option>' + state.servicesCache.map(s => `
          <option value="${s.id}" data-price="${(s.standard_price_cents || 100000) / 100}" data-pkg="${s.default_package || 'Standard Retainer'}">[${s.code}] ${s.name}</option>
        `).join('');

        select.addEventListener('change', () => {
          const opt = select.selectedOptions[0];
          if (opt) {
            const price = opt.dataset.price;
            if (price) document.getElementById('assignServicePrice').value = price;
          }
        });
      }

      if (triggerLabel) triggerLabel.textContent = 'Choose a service...';
      if (menu) {
        menu.innerHTML = '<div class="whiz-dropdown-inner max-h-56 overflow-y-auto overflow-x-hidden p-1.5 pr-2.5 space-y-0.5">' +
          '<button type="button" class="custom-assign-service-option w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-[#087F70]/10 hover:text-[#087F70] cursor-pointer transition-colors select-none font-sans text-left" data-value="" data-label="Choose a service..."><span>Choose a service...</span></button>' + state.servicesCache.map(s => `
          <button type="button" class="custom-assign-service-option w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-[#087F70]/10 hover:text-[#087F70] cursor-pointer transition-colors select-none font-sans text-left" data-value="${s.id}" data-price="${(s.standard_price_cents || 100000) / 100}" data-pkg="${escapeHtml(s.default_package || 'Standard Retainer')}" data-label="[${s.code}] ${escapeHtml(s.name)}">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-1.5 h-1.5 rounded-full bg-[#087F70]"></span>
              <span class="truncate">[${s.code}] ${escapeHtml(s.name)}</span>
            </div>
            <span class="font-mono text-[11px] text-slate-400 group-hover:text-[#087F70] shrink-0">$${((s.standard_price_cents || 100000) / 100).toFixed(2)}</span>
          </button>
        `).join('') + '</div>';

        menu.querySelectorAll('.custom-assign-service-option').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const val = btn.dataset.value;
            const label = btn.dataset.label;
            const price = btn.dataset.price;
            const pkg = btn.dataset.pkg;
            if (triggerLabel) triggerLabel.textContent = label;
            if (select) {
              select.value = val;
              select.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (price) {
              const priceInput = document.getElementById('assignServicePrice');
              if (priceInput) priceInput.value = price;
            }
            if (pkg) {
              const pkgInput = document.querySelector('#formAssignService input[name="packageName"]');
              if (pkgInput) pkgInput.value = pkg;
            }
            closeAssignServiceMenu();
          });
        });
      }

      // Sync active client's preferred currency into modal
      const activeClient = state.clientsCache?.find(c => c.id === clientId);
      const clientCur = (activeClient?.currency || 'USD').toUpperCase();
      if (typeof syncAssignCurrencyDropdown === 'function') {
        syncAssignCurrencyDropdown(clientCur);
      }

      // Sync start date & deadline datepicker displays
      const todayIso = new Date().toISOString().split('T')[0];
      const startInput = document.getElementById('assignServiceStartDate');
      if (startInput) {
        startInput.value = todayIso;
        if (typeof updateDatePickerTrigger === 'function') updateDatePickerTrigger(startInput);
      }
      const deadlineInput = document.getElementById('assignServiceDeadline');
      if (deadlineInput) {
        deadlineInput.value = '';
        if (typeof updateDatePickerTrigger === 'function') updateDatePickerTrigger(deadlineInput);
      }
      initGlassSelects();

      document.getElementById('modalAssignService')?.classList.remove('hidden');
    });

    document.getElementById('formAssignService')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const clientId = f.clientId.value;
      const submitBtn = f.querySelector('button[type="submit"]');

      const payload = {
        serviceId: f.serviceId.value,
        packageName: f.packageName.value,
        priceCents: Math.round(parseFloat(f.priceDollars.value) * 100),
        startDate: f.startDate.value,
        deadline: f.deadline.value || null
      };

      setBtnLoading(submitBtn, true, 'Provisioning service & tasks...');

      const res = await apiFetch(`/clients/${clientId}/services`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setBtnLoading(submitBtn, false);

      if (res.ok && res.data && res.data.success) {
        showToast(res.data.message || 'Service assigned with auto-generated SOP tasks!', 'success');
        document.getElementById('modalAssignService')?.classList.add('hidden');
        openClientDetails(clientId);
        loadProjectsData();
        loadTasksData();
      } else {
        showToast(res.data?.error || 'Failed to assign service.', 'error');
      }
    });

    // Suspend Client Action
    document.getElementById('btnSuspendClientAction')?.addEventListener('click', async () => {
      const clientId = state.selectedClientId;
      if (!clientId) return;
      if (!confirm('Are you sure you want to suspend this client? The client will lose access to the portal until reactivated.')) return;

      const btn = document.getElementById('btnSuspendClientAction');
      setBtnLoading(btn, true, 'Suspending...');

      const res = await apiFetch(`/clients/${clientId}/suspend`, { method: 'POST' });
      setBtnLoading(btn, false);

      if (res.ok && res.data && res.data.success) {
        showToast(res.data.message || 'Client account suspended.', 'success');
        openClientDetails(clientId);
        loadClientsData();
      } else {
        showToast(res.data?.error || 'Failed to suspend client.', 'error');
      }
    });

    // Reactivate Client Action
    document.getElementById('btnReactivateClientAction')?.addEventListener('click', async () => {
      const clientId = state.selectedClientId;
      if (!clientId) return;

      const btn = document.getElementById('btnReactivateClientAction');
      setBtnLoading(btn, true, 'Reactivating...');

      const res = await apiFetch(`/clients/${clientId}/reactivate`, { method: 'POST' });
      setBtnLoading(btn, false);

      if (res.ok && res.data && res.data.success) {
        showToast(res.data.message || 'Client account reactivated successfully.', 'success');
        openClientDetails(clientId);
        loadClientsData();
      } else {
        showToast(res.data?.error || 'Failed to reactivate client.', 'error');
      }
    });

    // Delete Client Action (opens modal)
    document.getElementById('btnDeleteClientAction')?.addEventListener('click', () => {
      const clientId = state.selectedClientId;
      if (!clientId) return;
      const nameEl = document.getElementById('clientCardFullName') || document.getElementById('clientDetailTitle');
      const targetNameEl = document.getElementById('deleteClientTargetName');
      if (targetNameEl && nameEl) targetNameEl.textContent = nameEl.textContent;

      // Ensure Clerk deletion option is unchecked by default
      const clerkOpt = document.getElementById('deleteClientClerkOption');
      if (clerkOpt) clerkOpt.checked = false;

      // Ensure delete button is reset and ready
      const confirmBtn = document.getElementById('btnConfirmDeleteClient');
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        confirmBtn.innerHTML = '<i class="fa-solid fa-trash-can text-xs"></i> <span>Permanently Delete Client</span>';
      }

      document.getElementById('modalDeleteClient')?.classList.remove('hidden');
    });

    // Confirm Permanent Delete Client
    document.getElementById('btnConfirmDeleteClient')?.addEventListener('click', async () => {
      const clientId = state.selectedClientId;
      if (!clientId) return;

      const btn = document.getElementById('btnConfirmDeleteClient');
      if (btn.disabled) return;
      setBtnLoading(btn, true, 'Deleting client...');

      const deleteClerk = document.getElementById('deleteClientClerkOption')?.checked === true;

      try {
        const res = await apiFetch(`/clients/${clientId}?delete_clerk=${deleteClerk}`, { method: 'DELETE' });
        setBtnLoading(btn, false);

        if (res.ok && res.data && res.data.success) {
          showToast(res.data.message || 'Client deleted successfully.', 'success');
          document.getElementById('modalDeleteClient')?.classList.add('hidden');
          switchTab('clients');
          loadClientsData();
          loadTeamData();
        } else {
          showToast(res.data?.error || 'Unable to delete this client. No changes were completed. Please retry or review the account records.', 'error');
        }
      } catch (err) {
        setBtnLoading(btn, false);
        showToast('Network error while processing client deletion. Please retry.', 'error');
      }
    });

    // 3. Service Management Modals
    document.getElementById('btnOpenAddServiceModal')?.addEventListener('click', () => {
      initGlassSelects();
      document.getElementById('modalAddService')?.classList.remove('hidden');
    });

    document.getElementById('formAddService')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const submitBtn = f.querySelector('button[type="submit"]');

      const payload = {
        name: f.name.value,
        code: f.code.value,
        category: f.category.value,
        defaultPackage: f.defaultPackage.value,
        standardPriceCents: Math.round(parseFloat(f.standardPriceDollars.value) * 100),
        description: f.description.value
      };

      setBtnLoading(submitBtn, true, 'Creating service...');

      const res = await apiFetch('/services', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setBtnLoading(submitBtn, false);

      if (res.ok && res.data && res.data.success) {
        showToast(res.data.message || 'Service created successfully!', 'success');
        f.reset();
        document.getElementById('modalAddService')?.classList.add('hidden');
        loadServicesData();
      } else {
        showToast(res.data?.error || 'Failed to create service.', 'error');
      }
    });

    document.getElementById('formEditService')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const srvId = f.serviceId.value;
      const submitBtn = f.querySelector('button[type="submit"]');

      const payload = {
        name: f.name.value,
        code: f.code.value,
        category: f.category.value,
        defaultPackage: f.defaultPackage.value,
        standardPriceCents: Math.round(parseFloat(f.standardPriceDollars.value) * 100),
        description: f.description.value,
        isActive: f.isActive.checked
      };

      setBtnLoading(submitBtn, true, 'Saving changes & version snapshot...');

      const res = await apiFetch(`/services/${srvId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setBtnLoading(submitBtn, false);

      if (res.ok && res.data && res.data.success) {
        showToast(res.data.message || 'Service updated successfully!', 'success');
        document.getElementById('modalEditService')?.classList.add('hidden');
        loadServicesData();
      } else {
        showToast(res.data?.error || 'Failed to update service.', 'error');
      }
    });

    // Delete Service Triggers & Confirmation
    document.getElementById('btnDeleteFromEditServiceModal')?.addEventListener('click', () => {
      const srvId = document.getElementById('editServiceId')?.value;
      if (!srvId) return;
      document.getElementById('modalEditService')?.classList.add('hidden');
      openDeleteServiceModal(srvId);
    });

    document.getElementById('deleteServiceConfirmInput')?.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      const service = state.servicesCache.find(s => s.id === state.selectedServiceId);
      const confirmBtn = document.getElementById('btnConfirmDeleteService');
      if (!confirmBtn || !service) return;

      const isMatch = val.toUpperCase() === 'DELETE' || val.toLowerCase() === service.name.trim().toLowerCase();
      confirmBtn.disabled = !isMatch;
    });

    document.getElementById('btnConfirmDeleteService')?.addEventListener('click', async () => {
      const serviceId = state.selectedServiceId;
      if (!serviceId) return;

      const btn = document.getElementById('btnConfirmDeleteService');
      if (btn.disabled) return;

      const service = state.servicesCache.find(s => s.id === serviceId);
      const serviceName = service ? service.name : 'Service';

      setBtnLoading(btn, true, 'Permanently purging service & blueprints...');

      try {
        const res = await apiFetch(`/services/${serviceId}`, { method: 'DELETE' });
        setBtnLoading(btn, false);

        if (res.ok && res.data && res.data.success) {
          showToast(`Service "${serviceName}" and all SOP blueprints permanently deleted.`, 'success');
          document.getElementById('modalDeleteService')?.classList.add('hidden');

          state.servicesCache = state.servicesCache.filter(s => s.id !== serviceId);
          loadServicesData();

          if (state.activeTab === 'service_tasks') {
            switchTab('services');
          }
        } else {
          showToast(res.data?.error || 'Failed to delete service. Check dependencies.', 'error');
        }
      } catch (err) {
        setBtnLoading(btn, false);
        showToast('Network error while deleting service.', 'error');
      }
    });

    // 4. SOP Task Blueprint Workspace Handlers
    document.getElementById('btnBackToServices')?.addEventListener('click', () => {
      switchTab('services');
    });

    document.getElementById('btnOpenAddBlueprintModal')?.addEventListener('click', () => {
      document.getElementById('addBlueprintServiceId').value = state.selectedServiceId;
      initGlassSelects();
      document.getElementById('modalAddBlueprint')?.classList.remove('hidden');
    });

    document.getElementById('formAddBlueprint')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const serviceId = f.serviceId.value;
      const submitBtn = f.querySelector('button[type="submit"]');

      const payload = {
        taskCode: f.taskCode.value,
        title: f.title.value,
        phase: f.phase.value,
        priority: f.priority.value,
        estimatedMinutes: parseInt(f.estimatedMinutes.value) || 60,
        steps: f.steps.value,
        instructions: f.steps.value,
        qaCriteria: f.qaCriteria.value
      };

      setBtnLoading(submitBtn, true, 'Adding task blueprint...');

      const res = await apiFetch(`/services/${serviceId}/blueprints`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setBtnLoading(submitBtn, false);

      if (res.ok && res.data && res.data.success) {
        showToast(res.data.message || 'Blueprint added successfully!', 'success');
        f.reset();
        document.getElementById('modalAddBlueprint')?.classList.add('hidden');
        openServiceTasksWorkspace(serviceId);
      } else {
        showToast(res.data?.error || 'Failed to add blueprint.', 'error');
      }
    });

    document.getElementById('formEditBlueprint')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const bpId = f.blueprintId.value;
      const submitBtn = f.querySelector('button[type="submit"]');

      const payload = {
        taskCode: f.taskCode.value,
        title: f.title.value,
        phase: f.phase.value,
        priority: f.priority.value,
        sortOrder: parseInt(f.sortOrder.value) || 1,
        estimatedMinutes: parseInt(f.estimatedMinutes.value) || 60,
        why: f.why.value,
        whereLocation: f.whereLocation.value,
        steps: f.steps.value,
        instructions: f.steps.value,
        doneWhen: f.doneWhen.value,
        qaCriteria: f.qaCriteria.value
      };

      setBtnLoading(submitBtn, true, 'Saving changes...');

      const res = await apiFetch(`/services/blueprints/${bpId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setBtnLoading(submitBtn, false);

      if (res.ok && res.data && res.data.success) {
        showToast('Task blueprint updated successfully!', 'success');
        document.getElementById('modalEditBlueprint')?.classList.add('hidden');
        openServiceTasksWorkspace(state.selectedServiceId);
      } else {
        showToast(res.data?.error || 'Failed to update blueprint.', 'error');
      }
    });

    // Delete Task Blueprint Triggers & Confirmation
    document.getElementById('btnDeleteFromEditBlueprintModal')?.addEventListener('click', () => {
      const bpId = document.getElementById('editBlueprintId')?.value;
      if (!bpId) return;
      document.getElementById('modalEditBlueprint')?.classList.add('hidden');
      openDeleteBlueprintModal(bpId);
    });

    document.getElementById('btnConfirmDeleteBlueprint')?.addEventListener('click', async () => {
      const bpId = state.selectedBlueprintId;
      if (!bpId) return;

      const btn = document.getElementById('btnConfirmDeleteBlueprint');
      if (btn.disabled) return;

      setBtnLoading(btn, true, 'Permanently deleting task...');

      try {
        const res = await apiFetch(`/services/blueprints/${bpId}`, { method: 'DELETE' });
        setBtnLoading(btn, false);

        if (res.ok && res.data && res.data.success) {
          showToast(res.data.message || 'Task blueprint permanently deleted.', 'success');
          document.getElementById('modalDeleteBlueprint')?.classList.add('hidden');

          state.currentBlueprints = state.currentBlueprints.filter(b => b.id !== bpId);
          renderBlueprintsWorkspace();

          const serviceId = state.selectedServiceId;
          const service = state.servicesCache.find(s => s.id === serviceId);
          if (service) {
            service.blueprint_count = Math.max(0, (service.blueprint_count || 1) - 1);
          }
        } else {
          showToast(res.data?.error || 'Unable to delete task. It may be referenced by active projects.', 'error');
        }
      } catch (err) {
        setBtnLoading(btn, false);
        showToast('Network error while deleting task blueprint.', 'error');
      }
    });

    // Apply Template to Active Projects Modal
    document.getElementById('btnOpenApplyTemplateModal')?.addEventListener('click', () => {
      document.getElementById('modalApplyTemplate')?.classList.remove('hidden');
    });

    document.getElementById('btnConfirmApplyTemplate')?.addEventListener('click', async () => {
      const serviceId = state.selectedServiceId;
      if (!serviceId) return;

      const btn = document.getElementById('btnConfirmApplyTemplate');
      setBtnLoading(btn, true, 'Synchronizing projects...');

      const res = await apiFetch(`/services/${serviceId}/apply-to-projects`, { method: 'POST' });
      setBtnLoading(btn, false);

      if (res.ok && res.data && res.data.success) {
        showToast(res.data.message || 'Template synchronized across active client projects!', 'success');
        document.getElementById('modalApplyTemplate')?.classList.add('hidden');
        loadProjectsData();
        loadTasksData();
      } else {
        showToast(res.data?.error || 'Failed to apply template.', 'error');
      }
    });

    // 5. Live Task Details Form
    document.getElementById('formLiveTaskDetail')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const taskId = f.taskId.value;
      const submitBtn = f.querySelector('button[type="submit"]');

      const payload = {
        status: f.status.value,
        priority: f.priority.value,
        internalNotes: f.internalNotes.value
      };

      setBtnLoading(submitBtn, true, 'Updating task...');

      const res = await apiFetch(`/projects/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setBtnLoading(submitBtn, false);

      if (res.ok && res.data && res.data.success) {
        showToast(`Task updated! Project progress is now ${res.data.data.newProgressPercent}%.`, 'success');
        document.getElementById('modalLiveTaskDetail')?.classList.add('hidden');
        loadTasksData();
        loadProjectsData();
      } else {
        showToast(res.data?.error || 'Failed to update task.', 'error');
      }
    });

    // 6. Task Filter Buttons & Search Controls (WHIZ Smart Task Workspace)
    document.querySelectorAll('.task-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        state.currentTaskStatus = filter;
        updateStatusFilterButtons(filter);
        renderFilteredTasks();
      });
    });

    const taskSearch = document.getElementById('taskSearchInput');
    const taskPriority = document.getElementById('taskPriorityFilter');
    const clearSearchBtn = document.getElementById('btnClearTaskSearch');

    if (taskSearch) {
      taskSearch.addEventListener('input', () => {
        renderFilteredTasks();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (taskSearch) {
          taskSearch.value = '';
          taskSearch.focus();
        }
        renderFilteredTasks();
      });
    }

    if (taskPriority) {
      taskPriority.addEventListener('change', () => {
        renderFilteredTasks();
      });
    }

    // 7. Open Record Payment Modal
    const openRecordPayment = () => {
      const modal = document.getElementById('modalRecordPayment');
      const select = document.getElementById('paymentClientSelect');
      const clientMenu = document.getElementById('paymentClientSelectMenu') || document.querySelector('#whizGlassSelectPortal #paymentClientSelectMenu');
      const invSelect = document.getElementById('paymentInvoiceSelect');
      const invMenu = document.getElementById('paymentInvoiceSelectMenu') || document.querySelector('#whizGlassSelectPortal #paymentInvoiceSelectMenu');
      const dateInput = document.getElementById('paymentDateInput');
      const refInput = document.getElementById('paymentReferenceInput');

      if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
        if (typeof updateDatePickerTrigger === 'function') {
          updateDatePickerTrigger(dateInput);
        }
      }
      if (refInput && !refInput.value) refInput.value = 'TXN-' + Math.floor(100000 + Math.random() * 900000);

      if (modal && select) {
        modal.classList.remove('hidden');

        // Populate native select
        select.innerHTML = '<option value="">Select client...</option>' + state.clientsCache.map(c => `
          <option value="${c.organization_id || c.id}">${escapeHtml(c.company_name || c.full_name)} (${escapeHtml(c.email)})</option>
        `).join('');

        // Populate custom searchable glass select menu
        if (clientMenu) {
          clientMenu.innerHTML = `
            <div class="p-2 border-b border-[#E3E9EF] sticky top-0 bg-white z-10" onclick="event.stopPropagation()">
              <div class="relative">
                <i class="fa-solid fa-magnifying-glass text-slate-400 text-xs absolute left-2.5 top-1/2 -translate-y-1/2"></i>
                <input type="text" id="paymentClientSearchInput" placeholder="Search client by name or email..." class="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E3E9EF] bg-slate-50 focus:bg-white focus:outline-none font-sans text-[#172B36]">
              </div>
            </div>
            <div id="paymentClientOptionsList" class="max-h-60 overflow-y-auto">
              <button type="button" class="glass-select-option selected" data-value="" role="option" aria-selected="true">
                <i class="fa-solid fa-building text-slate-400 text-xs shrink-0 option-icon"></i>
                <span class="select-opt-text truncate font-sans font-medium text-slate-500">Select client...</span>
                <i class="fa-solid fa-check check-icon"></i>
              </button>
              ${state.clientsCache.map(c => `
                <button type="button" class="glass-select-option" data-value="${escapeHtml(c.organization_id || c.id)}" role="option" aria-selected="false">
                  <i class="fa-solid fa-building text-[#087F70] text-xs shrink-0 option-icon"></i>
                  <div class="flex-1 min-w-0 text-left">
                    <span class="select-opt-text truncate block font-sans font-medium text-[#172B36]">${escapeHtml(c.company_name || c.full_name)}</span>
                    <span class="text-[11px] text-slate-400 truncate block">${escapeHtml(c.email)}</span>
                  </div>
                  <i class="fa-solid fa-check check-icon"></i>
                </button>
              `).join('')}
            </div>
          `;

          const searchInput = clientMenu.querySelector('#paymentClientSearchInput');
          searchInput?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            clientMenu.querySelectorAll('#paymentClientOptionsList .glass-select-option').forEach(opt => {
              if (!opt.dataset.value) return; // Keep "Select client..."
              const text = opt.textContent.toLowerCase();
              opt.style.display = text.includes(q) ? '' : 'none';
            });
          });
          searchInput?.addEventListener('keydown', (e) => e.stopPropagation());
        }

        if (invSelect) {
          invSelect.innerHTML = '<option value="">Auto-create or match client contract...</option>';
        }
        if (invMenu) {
          invMenu.innerHTML = `
            <button type="button" class="glass-select-option selected" data-value="" role="option" aria-selected="true">
              <i class="fa-solid fa-file-invoice-dollar text-[#087F70] text-xs shrink-0 option-icon"></i>
              <span class="select-opt-text truncate font-sans font-medium text-slate-500">Auto-create or match client contract...</span>
              <i class="fa-solid fa-check check-icon"></i>
            </button>
          `;
        }

        initGlassSelects();

        if (!select.dataset.bound) {
          select.dataset.bound = 'true';
          select.addEventListener('change', async () => {
            const orgId = select.value;
            const targetInvMenu = document.getElementById('paymentInvoiceSelectMenu') || document.querySelector('#whizGlassSelectPortal #paymentInvoiceSelectMenu');
            if (!orgId || !invSelect) return;
            invSelect.innerHTML = '<option value="">Loading client invoices...</option>';
            if (targetInvMenu) {
              targetInvMenu.innerHTML = '<div class="p-2.5 text-xs text-slate-400 italic">Loading client invoices...</div>';
            }
            try {
              const res = await apiFetch(`/finance/invoices?organizationId=${orgId}`);
              if (res.ok && res.data && res.data.data) {
                const invs = res.data.data;
                if (invs.length === 0) {
                  invSelect.innerHTML = '<option value="">Auto-create new invoice on commitment</option>';
                  if (targetInvMenu) {
                    targetInvMenu.innerHTML = `
                      <button type="button" class="glass-select-option selected" data-value="" role="option" aria-selected="true">
                        <i class="fa-solid fa-file-invoice text-slate-400 text-xs shrink-0 option-icon"></i>
                        <span class="select-opt-text truncate font-sans font-medium">Auto-create new invoice on commitment</span>
                        <i class="fa-solid fa-check check-icon"></i>
                      </button>
                    `;
                  }
                } else {
                  invSelect.innerHTML = '<option value="">Auto-create new invoice on commitment</option>' + invs.map(i => `
                    <option value="${i.id}">${i.invoice_number} — Due: ${formatCurrency(i.outstanding_balance_cents || 0, i.currency || 'USD')}</option>
                  `).join('');
                  if (targetInvMenu) {
                    targetInvMenu.innerHTML = `
                      <button type="button" class="glass-select-option selected" data-value="" role="option" aria-selected="true">
                        <i class="fa-solid fa-file-invoice text-slate-400 text-xs shrink-0 option-icon"></i>
                        <span class="select-opt-text truncate font-sans font-medium">Auto-create new invoice on commitment</span>
                        <i class="fa-solid fa-check check-icon"></i>
                      </button>
                    ` + invs.map(i => `
                      <button type="button" class="glass-select-option" data-value="${escapeHtml(i.id)}" role="option" aria-selected="false">
                        <i class="fa-solid fa-file-invoice-dollar text-[#087F70] text-xs shrink-0 option-icon"></i>
                        <div class="flex-1 min-w-0 text-left">
                          <span class="select-opt-text truncate block font-sans font-medium text-[#172B36]">${escapeHtml(i.invoice_number)}</span>
                          <span class="text-[11px] text-[#087F70] font-mono block">Due: ${formatCurrency(i.outstanding_balance_cents || 0, i.currency || 'USD')}</span>
                        </div>
                        <i class="fa-solid fa-check check-icon"></i>
                      </button>
                    `).join('');
                  }
                }
              } else {
                invSelect.innerHTML = '<option value="">Auto-create new invoice on commitment</option>';
              }
            } catch (e) {
              invSelect.innerHTML = '<option value="">Auto-create new invoice on commitment</option>';
            }
            initGlassSelects();
          });
        }
      }
    };

    document.getElementById('btnOpenRecordPaymentModal')?.addEventListener('click', openRecordPayment);
    document.getElementById('btnQuickRecordPayment')?.addEventListener('click', openRecordPayment);

    // Form Record Payment Submit (Financial & Receipt Ledger Architecture)
    document.getElementById('formRecordPayment')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const submitBtn = f.querySelector('button[type="submit"]');
      const orgId = f.organizationId ? f.organizationId.value : '';
      const serviceProvided = (f.serviceProvided ? f.serviceProvided.value.trim() : '') || 'Whiz Studio Retainer Service';
      const amountDollars = parseFloat(f.amount.value) || 0;
      const currency = f.currency ? f.currency.value : 'USD';
      const rawPaymentDate = f.paymentDate ? f.paymentDate.value.trim() : '';
      const paymentMethod = f.paymentMethod ? f.paymentMethod.value : 'bank_transfer';
      const paymentReference = f.paymentReference ? f.paymentReference.value : ('TXN-' + Math.floor(100000 + Math.random() * 900000));
      const financialNotes = f.financialNotes ? f.financialNotes.value.trim() : null;
      let selectedInvoiceId = f.invoiceId ? f.invoiceId.value.trim() : '';

      // Strict Frontend Validations
      if (!orgId) {
        showToast('Please select a client organization.', 'error');
        return;
      }

      if (!rawPaymentDate || !/^\d{4}-\d{2}-\d{2}$/.test(rawPaymentDate) || isNaN(Date.parse(rawPaymentDate))) {
        showToast('Please select a valid payment date.', 'error');
        const dateTrigger = document.querySelector('[data-datepicker-target="paymentDateInput"] .custom-datepicker-trigger');
        if (dateTrigger) {
          dateTrigger.classList.add('ring-2', 'ring-rose-500', 'border-rose-400');
          dateTrigger.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          setTimeout(() => dateTrigger.classList.remove('ring-2', 'ring-rose-500', 'border-rose-400'), 3000);
        }
        return;
      }
      const paymentDate = rawPaymentDate;

      if (amountDollars <= 0) {
        showToast('Please enter a valid payment amount greater than zero.', 'error');
        f.amount?.focus();
        return;
      }

      if (!f.serviceProvided || !f.serviceProvided.value.trim()) {
        showToast('Please specify the service provided for this ledger entry.', 'error');
        f.serviceProvided?.focus();
        return;
      }

      setBtnLoading(submitBtn, true, 'Recording payment to ledger...');

      // Determine if Auto-Create is selected or needed
      const isAutoCreate = !selectedInvoiceId || selectedInvoiceId === 'auto' || selectedInvoiceId.toLowerCase().includes('auto');

      const payRes = await apiFetch('/finance/payments', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: isAutoCreate ? null : selectedInvoiceId,
          autoCreate: isAutoCreate,
          organizationId: orgId,
          serviceProvided,
          amountCents: Math.round(amountDollars * 100),
          currency,
          paymentDate,
          paymentMethod,
          paymentReference,
          financialNotes,
          idempotencyKey: `adm_pay_${paymentReference}_${Date.now()}`
        })
      });

      setBtnLoading(submitBtn, false);

      if (payRes.ok && payRes.data && payRes.data.success) {
        // Instant Client Ledger Synchronization
        try {
          const clientOption = document.querySelector(`#paymentClientSelect option[value="${orgId}"]`);
          const clientName = clientOption ? clientOption.textContent.split('(')[0].trim() : (state.clients.find(c => c.id === orgId)?.name || 'Valued Client');
          const receiptNumber = payRes.data.data?.receiptNumber || payRes.data.data?.receipt_no || `RCPT-2026-${Math.floor(100 + Math.random() * 900)}`;
          const invoiceNumber = payRes.data.data?.invoiceNumber || payRes.data.data?.invoice_no || `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
          const realInvoiceId = payRes.data.data?.invoiceId || selectedInvoiceId || ('inv_' + Date.now());

          const newLedgerItem = {
            id: payRes.data.data?.id || `pay_${Date.now()}`,
            invoice_id: realInvoiceId,
            invoice_no: invoiceNumber,
            invoice_number: invoiceNumber,
            receipt_number: receiptNumber,
            receipt_no: receiptNumber,
            organization_id: orgId,
            client_name: clientName,
            service_name: serviceProvided,
            title: serviceProvided,
            description: serviceProvided,
            amount_cents: Math.round(amountDollars * 100),
            total_cents: Math.round(amountDollars * 100),
            amount_paid_cents: Math.round(amountDollars * 100),
            outstanding_balance_cents: 0,
            currency: currency,
            payment_date: paymentDate,
            issue_date: paymentDate,
            due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            payment_method: paymentMethod,
            payment_reference: paymentReference,
            status: 'paid',
            created_at: new Date().toISOString()
          };

          const synced = JSON.parse(localStorage.getItem('whiz_synced_ledger_records') || '[]');
          synced.unshift(newLedgerItem);
          localStorage.setItem('whiz_synced_ledger_records', JSON.stringify(synced));
        } catch (syncErr) {
          console.warn('[Ledger Sync] Failed to cache synced ledger record:', syncErr);
        }

        showToast(`Payment of ${formatCurrency(amountDollars * 100, currency)} committed! Client ledger updated instantly.`, 'success');
        f.reset();
        initGlassSelects();
        document.getElementById('modalRecordPayment')?.classList.add('hidden');
        loadFinanceData();
        loadInvoicesData();
      } else {
        showToast(payRes.data?.error || 'Failed to record payment.', 'error');
      }
    });


    // Form Edit Payment Submit
    document.getElementById('formEditPayment')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const submitBtn = f.querySelector('button[type="submit"]');
      const pid = f.paymentId.value;
      const paymentDate = f.paymentDate.value;
      const paymentMethod = f.paymentMethod.value;
      const paymentReference = f.paymentReference.value;
      const financialNotes = f.financialNotes.value;

      setBtnLoading(submitBtn, true, 'Updating payment...');
      const res = await apiFetch(`/finance/payments/${pid}`, {
        method: 'PUT',
        body: JSON.stringify({ paymentDate, paymentMethod, paymentReference, financialNotes })
      });
      setBtnLoading(submitBtn, false);

      if (res.ok && res.data && res.data.success) {
        showToast('Payment details updated successfully.', 'success');
        document.getElementById('modalEditPayment')?.classList.add('hidden');
        loadFinanceData();
      } else {
        showToast(res.data?.error || 'Failed to update payment details.', 'error');
      }
    });

    // Form Correct Payment Submit
    document.getElementById('formCorrectPayment')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const submitBtn = f.querySelector('button[type="submit"]');
      const pid = f.paymentId.value;
      const amountDollars = parseFloat(f.amount.value) || 0;
      const currency = f.currency.value;
      const reason = f.reason.value;

      if (amountDollars <= 0) {
        showToast('Please enter a valid positive corrected amount.', 'error');
        return;
      }
      if (!reason || reason.trim().length < 3) {
        showToast('A reason for the financial correction is required.', 'error');
        return;
      }

      const p = paymentsCache.find(x => x.id === pid);
      const newAmountCents = Math.round(amountDollars * 100);
      if (state.adminProfile?.role === 'accounts' && p && newAmountCents < (p.amount_cents || 0)) {
        showToast('Accounts Restriction: You cannot reduce a previously recorded payment amount. Reductions require Admin or Super Admin authorization.', 'error');
        return;
      }

      setBtnLoading(submitBtn, true, 'Committing correction...');
      const res = await apiFetch(`/finance/payments/${pid}/correct`, {
        method: 'POST',
        body: JSON.stringify({
          amountCents: Math.round(amountDollars * 100),
          currency,
          reason
        })
      });
      setBtnLoading(submitBtn, false);

      if (res.ok && res.data && res.data.success) {
        showToast('Financial correction committed! Invoice balance recalculated.', 'success');
        document.getElementById('modalCorrectPayment')?.classList.add('hidden');
        loadFinanceData();
      } else {
        showToast(res.data?.error || 'Failed to commit financial correction.', 'error');
      }
    });

    // 8. Authorize Staff Pre-Approval Form (Phase 12)
    document.getElementById('adminInviteForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const isOwner = isCurrentUserOwner();
      const isAdmin = state.adminProfile?.role === 'admin';
      if (!isOwner && !isAdmin) {
        showToast('Action denied: Only Super Admin and Admin may authorize staff pre-approvals.', 'error');
        return;
      }
      const f = e.target;
      const submitBtn = f.querySelector('button[type="submit"]');
      const fullName = (f.fullName?.value || '').trim();
      const email = (f.email?.value || '').trim();
      const selectedRole = (document.getElementById('inviteRole')?.value || 'employee').toLowerCase();

      if (!fullName || !email) {
        showToast('Please provide both staff member full name and email.', 'warning');
        return;
      }

      if (isAdmin && !isOwner && (selectedRole === 'admin' || selectedRole === 'super_admin' || selectedRole === 'owner')) {
        showToast('Hierarchy Restriction: Admins may only invite Accounts or Employee team members.', 'error');
        return;
      }

      setBtnLoading(submitBtn, true, 'Authorizing staff member...');

      const res = await apiFetch('/portal/admin/team/invite', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, role: selectedRole })
      });

      setBtnLoading(submitBtn, false);

      if (res.ok && res.data && res.data.success) {
        showToast(res.data.message || `Administrator pre-approval granted for ${email}!`, 'success');
        f.reset();
        loadTeamData();
      } else {
        showToast(res.data?.error || 'Failed to authorize administrator.', 'error');
      }
    });

    // 9. Role Change Form Submit
    document.getElementById('formRoleChange')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btnSubmitRoleChange');
      const userId = document.getElementById('roleChangeUserId')?.value;
      const targetRole = document.getElementById('roleChangeNewRole')?.value || document.getElementById('roleChangeTargetRole')?.value;
      const reason = document.getElementById('roleChangeReason')?.value || 'Role updated by Super Admin';

      if (!userId || !targetRole) return;

      setBtnLoading(submitBtn, true, 'Updating role...');

      const res = await apiFetch(`/portal/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: targetRole, reason })
      });

      setBtnLoading(submitBtn, false);

      if (res.ok && res.data && res.data.success) {
        showToast(res.data.message || 'User role successfully updated.', 'success');
        document.getElementById('modalRoleChange')?.classList.add('hidden');
        loadTeamData();
      } else {
        showToast(res.data?.error || 'Failed to update user role.', 'error');
      }
    });

    // Refresh User Directory Button
    document.getElementById('btnRefreshUserDir')?.addEventListener('click', async () => {
      const icon = document.getElementById('btnRefreshUserDirIcon');
      if (icon) icon.classList.add('fa-spin');
      try {
        await loadTeamData();
        showToast('User directory refreshed.', 'success');
      } catch (e) {
        showToast('Failed to refresh user directory.', 'error');
      } finally {
        if (icon) icon.classList.remove('fa-spin');
      }
    });

    // Search and Filter Listeners
    document.getElementById('userDirectorySearch')?.addEventListener('input', () => renderUserDirectory());
    document.getElementById('userDirectoryRoleFilter')?.addEventListener('change', () => renderUserDirectory());
    document.getElementById('userDirectoryStatusFilter')?.addEventListener('change', () => renderUserDirectory());

    // User Directory Search Clear Button
    document.getElementById('userDirectorySearchClear')?.addEventListener('click', () => {
      const searchInput = document.getElementById('userDirectorySearch');
      if (searchInput) {
        searchInput.value = '';
        renderUserDirectory();
        searchInput.focus();
      }
    });

    // Delegated Reset Filters Button
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btnClearUserFilters')) {
        const searchInput = document.getElementById('userDirectorySearch');
        if (searchInput) searchInput.value = '';
        const roleFilter = document.getElementById('userDirectoryRoleFilter');
        if (roleFilter) {
          roleFilter.value = 'all';
          roleFilter.dispatchEvent(new Event('change'));
        }
        const statusFilter = document.getElementById('userDirectoryStatusFilter');
        if (statusFilter) {
          statusFilter.value = 'all';
          statusFilter.dispatchEvent(new Event('change'));
        }
        renderUserDirectory();
      }
    });

    // =========================================================================
    // STANDARDIZED MODAL DISMISSAL & CLOSE EVENT HANDLERS
    // =========================================================================
    // 1. Direct Binding for Record Payment Modal 'X' Close Button
    const btnCloseRecordPayment = document.getElementById('btnCloseRecordPaymentModal');
    if (btnCloseRecordPayment) {
      btnCloseRecordPayment.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const m = document.getElementById('modalRecordPayment');
        if (m) m.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      });
    }

    // 2. Direct Binding for Record Payment Modal 'Cancel' Button
    const btnCancelRecordPayment = document.getElementById('btnCancelRecordPaymentModal');
    if (btnCancelRecordPayment) {
      btnCancelRecordPayment.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const m = document.getElementById('modalRecordPayment');
        if (m) m.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      });
    }

    // 3. Global Event Delegation for ALL .btn-close-modal & [data-modal] buttons
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('.btn-close-modal, .whiz-modal-close-btn, [data-modal]');
      if (!closeBtn) return;
      
      const modalId = closeBtn.dataset.modal || closeBtn.getAttribute('data-modal');
      const isCloseAction = closeBtn.classList.contains('btn-close-modal') ||
                            closeBtn.classList.contains('whiz-modal-close-btn') ||
                            closeBtn.textContent.trim().toLowerCase() === 'cancel' ||
                            closeBtn.textContent.trim().toLowerCase() === 'close';
      
      if (isCloseAction) {
        e.preventDefault();
        e.stopPropagation();
        if (modalId) {
          const m = document.getElementById(modalId);
          if (m) {
            m.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
          }
        } else {
          const parentModal = closeBtn.closest('.fixed[id^="modal"], [id^="modal"]');
          if (parentModal) {
            parentModal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
          }
        }
      }
    });

    // 4. Backdrop Click Dismissal on all Modal Overlays
    document.querySelectorAll('.fixed[id^="modal"], [id^="modal"]').forEach(modalEl => {
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
          modalEl.classList.add('hidden');
          document.body.classList.remove('overflow-hidden');
        }
      });
    });

    // 5. Global Keyboard ESC Dismissal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.fixed[id^="modal"]:not(.hidden), [id^="modal"]:not(.hidden)').forEach(modalEl => {
          modalEl.classList.add('hidden');
        });
        document.body.classList.remove('overflow-hidden');
      }
    });

    
  }

  function initPasswordToggles() {
    document.querySelectorAll('.password-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        if (input) {
          const isPass = input.type === 'password';
          input.type = isPass ? 'text' : 'password';
          btn.innerHTML = `<i class="fa-solid ${isPass ? 'fa-eye-slash' : 'fa-eye'} text-xs"></i>`;
        }
      });
    });
  }

  // =========================================================================
  // CLERK AUTHENTICATION & INITIALIZATION
  // =========================================================================
  let clerkCheckAttempts = 0;
  async function checkAuthAndInit() {
    // PREVIEW & DEMO BYPASS GUARD (For isolated testing & simulator)
    const urlParams = new URLSearchParams(window.location.search);
    const isPreview = urlParams.get('preview') === '1' || urlParams.get('demo') === '1' || (window.self !== window.top && urlParams.get('preview') !== '0');

    if (isPreview) {
      state.isPreview = true;
      const roleName = urlParams.get('role') || 'super_admin';
      const profile = {
        id: 'usr_super_admin_01',
        fullName: 'Kazi Emon',
        full_name: 'Kazi Emon',
        email: (roleName === 'super_admin' || roleName === 'owner') ? 'kaziaremon@gmail.com' : `${roleName}@whizstudio.io`,
        username: 'kaziaremon',
        role: roleName === 'super_admin' ? 'owner' : roleName,
        isSuperAdmin: roleName === 'super_admin' || roleName === 'owner'
      };

      state.currentUser = profile;
      state.adminProfile = profile;

      applyRoleAdaptiveUI(profile);
      updateOverviewGreeting();
      initGlassSelects(); // Initial setup on load

      const name = profile.fullName;
      const username = '@' + profile.username;
      const initials = 'KE';

      document.querySelectorAll('.admin-display-name').forEach(el => el.textContent = name);
      document.querySelectorAll('.admin-display-username').forEach(el => el.textContent = username);
      document.querySelectorAll('.admin-display-initials').forEach(el => el.textContent = initials);

      const emailEl = document.getElementById('secUserEmail');
      if (emailEl) emailEl.textContent = profile.email;
      const emailHeaderEl = document.getElementById('secUserEmailHeader');
      if (emailHeaderEl) emailHeaderEl.textContent = profile.email;
      const userEl = document.getElementById('secClerkUserId');
      if (userEl) userEl.innerHTML = '<span class="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold"><i class="fa-solid fa-shield-check text-[#147D64]"></i> Preview Session Active</span>';

      const authGuard = document.getElementById('dashboardAuthGuard');
      const accessDenied = document.getElementById('dashboardAccessDenied');
      const mainLayout = document.getElementById('dashboardMainLayout');

      if (authGuard) authGuard.classList.add('hidden');
      if (accessDenied) accessDenied.classList.add('hidden');
      if (mainLayout) mainLayout.classList.remove('hidden');

      const hash = (window.location.hash || '').replace('#', '');
      const validTabs = ['overview', 'clients', 'services', 'projects', 'tasks', 'finance', 'team', 'support', 'history', 'security'];
      const initialTab = validTabs.includes(hash) ? hash : 'overview';
      switchTab(initialTab, false);

      loadServicesData();
      return;
    }
    const authGuard = document.getElementById('dashboardAuthGuard');
    const accessDenied = document.getElementById('dashboardAccessDenied');
    const mainLayout = document.getElementById('dashboardMainLayout');

    if (!window.Clerk) {
      clerkCheckAttempts++;
      if (clerkCheckAttempts > 50) {
        console.error('Clerk SDK load timeout in admin dashboard');
        if (authGuard) {
          authGuard.innerHTML = `
            <div class="mb-5 flex items-center justify-center">
              <img src="/assets/images/logo.png" alt="Whiz Studio" class="h-12 w-auto object-contain">
            </div>
            <h2 class="text-xl font-bold text-[#172B36] tracking-tight">Authentication Service Unavailable</h2>
            <p class="text-xs text-rose-500 mt-2 max-w-sm">Unable to connect to Clerk authentication services. Please verify your internet connection or disable tracking blockers.</p>
            <div class="mt-5 flex items-center justify-center gap-3">
              <button onclick="window.location.reload()" class="px-4 py-2 bg-[#147D64] text-white text-xs font-bold rounded-xl hover:bg-[#12694f] cursor-pointer">Retry Connection</button>
              <a href="/?login=admin" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer">Return to Login</a>
            </div>
          `;
        }
        return;
      }
      setTimeout(checkAuthAndInit, 100);
      return;
    }

    try {
      if (!window.Clerk.loaded) {
        await Promise.race([
          window.Clerk.load({
            publishableKey: CLERK_PUBLISHABLE_KEY
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Authentication system connection timeout')), 8000))
        ]);
      }

      const user = window.Clerk.user;
      if (!user) {
        console.warn('No active Clerk user found, redirecting to login...');
        window.location.href = '/?login=admin';
        return;
      }

      state.currentUser = user;

      // Verify Administrator Authorization with Cloudflare Backend API
      const res = await apiFetch('/portal/me');
      if (!res.ok || !res.data || !res.data.success || !res.data.data || !res.data.data.user) {
        console.error('Admin verification failed from API:', res);
        if (authGuard) authGuard.classList.add('hidden');
        if (accessDenied) accessDenied.classList.remove('hidden');
        return;
      }

      const profile = res.data.data.user;
      state.adminProfile = profile;

      const isAuthorized = 
        profile.role === 'owner' || 
        profile.role === 'admin' || 
        profile.role === 'super_admin' || 
        profile.role === 'accounts' || 
        profile.role === 'employee' || 
        Boolean(profile.isSuperAdmin) ||
        Boolean(profile.isStaff);

      if (!isAuthorized) {
        if (profile.role === 'client') {
          console.warn('[Route Guard] Client user attempted to access admin portal. Redirecting to client dashboard...');
          window.location.replace('/client/dashboard/');
          return;
        }
        console.warn('Authenticated user does not possess staff permissions:', profile);
        if (authGuard) authGuard.classList.add('hidden');
        if (accessDenied) accessDenied.classList.remove('hidden');
        return;
      }

      applyRoleAdaptiveUI(profile);
      updateOverviewGreeting();

      // Populate user info in UI
      const name = profile.fullName || profile.full_name || user.fullName || 'Super Admin';
      const email = profile.email || (user.primaryEmailAddress ? user.primaryEmailAddress.emailAddress : '');
      const username = user.username ? `@${user.username}` : (email ? `@${email.split('@')[0]}` : '@admin');
      const initials = (name || 'SA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

      document.querySelectorAll('.admin-display-name').forEach(el => el.textContent = name);
      document.querySelectorAll('.admin-display-username').forEach(el => el.textContent = username);
      document.querySelectorAll('.admin-display-initials').forEach(el => el.textContent = initials);

      const emailEl = document.getElementById('secUserEmail');
      if (emailEl) emailEl.textContent = email;
      const userEl = document.getElementById('secClerkUserId');
      if (userEl) userEl.innerHTML = '<span class="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold"><i class="fa-solid fa-shield-check text-[#147D64]"></i> SSO Session Active</span>';

      // Show Main Layout
      if (authGuard) authGuard.classList.add('hidden');
      if (accessDenied) accessDenied.classList.add('hidden');
      if (mainLayout) mainLayout.classList.remove('hidden');
      if (typeof initGlassSelects === 'function') initGlassSelects();

      // Initialize initial tab or deep-linked view
      const hash = (window.location.hash || '').replace('#', '');
      if (hash.startsWith('client-')) {
        const cId = hash.replace('client-', '');
        openClientDetails(cId);
      } else if (hash.startsWith('service-tasks-')) {
        const sId = hash.replace('service-tasks-', '');
        openServiceTasksWorkspace(sId);
      } else {
        const validTabs = ['overview', 'clients', 'services', 'projects', 'tasks', 'finance', 'team', 'support', 'history', 'security', 'settings'];
        const initialTab = validTabs.includes(hash) ? hash : 'overview';
        switchTab(initialTab);
      }

      // Preload catalog
      loadServicesData();
    } catch (err) {
      console.error('Console Auth Error:', err);
      if (authGuard) {
        authGuard.innerHTML = `
          <div class="mb-5 flex items-center justify-center">
            <img src="/assets/images/logo.png" alt="Whiz Studio" class="h-12 w-auto object-contain">
          </div>
          <h2 class="text-xl font-bold text-[#172B36] tracking-tight">Workspace Initialization Failed</h2>
          <p class="text-xs text-rose-500 mt-2 max-w-sm">${escapeHtml(err.message || 'An unexpected error occurred while preparing your workspace.')}</p>
          <div class="mt-5 flex items-center justify-center gap-3">
            <button onclick="window.location.reload()" class="px-4 py-2 bg-[#147D64] text-white text-xs font-bold rounded-xl hover:bg-[#12694f] cursor-pointer">Retry</button>
            <a href="/" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer">Return Home</a>
          </div>
        `;
      }
    }
  }

  // =========================================================================
  // BOOTSTRAP EVENT LISTENERS
  // =========================================================================
  function init() {
    // Tab switching
    document.querySelectorAll('[data-dash-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.dashTab;
        switchTab(tab);
        const drawer = document.getElementById('mobileDrawer');
        const backdrop = document.getElementById('mobileDrawerBackdrop');
        if (drawer) drawer.classList.add('-translate-x-full');
        if (backdrop) backdrop.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      });
    });

    // KPI Metric Cards Navigation Mapping (Priority 1)
    document.querySelectorAll('[data-kpi-nav]').forEach(card => {
      const handleKpiNavigation = () => {
        const targetTab = card.dataset.kpiNav;
        const targetFilter = card.dataset.kpiFilter;
        if (!targetTab) return;

        // Switch to the target view
        switchTab(targetTab);

        // Apply tab-specific filters & load data
        if (targetTab === 'clients') {
          const filterSelect = document.getElementById('adminClientStatusFilter');
          if (filterSelect) {
            filterSelect.value = targetFilter || 'active';
            syncClientStatusDropdown(filterSelect.value);
          }
          loadClientsData();
        } else if (targetTab === 'projects') {
          loadProjectsData();
        } else if (targetTab === 'services') {
          loadServicesData();
        } else if (targetTab === 'tasks') {
          const targetStatus = targetFilter || 'all';
          document.querySelectorAll('.task-filter-btn').forEach(b => {
            const matches = b.dataset.filter === targetStatus || (targetFilter === 'pending' && b.dataset.filter === 'in_progress');
            if (matches) {
              b.classList.add('bg-slate-800', 'text-white', 'font-bold');
              b.classList.remove('text-slate-400', 'font-medium');
            } else {
              b.classList.remove('bg-slate-800', 'text-white', 'font-bold');
              b.classList.add('text-slate-400', 'font-medium');
            }
          });
          state.currentTaskStatus = targetStatus; updateStatusFilterButtons(targetStatus); loadTasksData(targetStatus);
        } else if (targetTab === 'finance') {
          loadFinanceData();
        }
      };

      card.addEventListener('click', handleKpiNavigation);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleKpiNavigation();
        }
      });
    });

    // Audit & History Filters & Refresh (Priority 7)
    document.getElementById('auditSearchInput')?.addEventListener('input', () => {
      renderAuditHistoryList();
    });
    document.getElementById('auditCategoryFilter')?.addEventListener('change', () => {
      renderAuditHistoryList();
    });

    // Custom Glassmorphic Audit Category Dropdown Component
    const auditCatTrigger = document.getElementById('btnAuditCategoryDropdown');
    const auditCatMenu = document.getElementById('auditCategoryDropdownMenu');
    const auditCatChevron = document.getElementById('auditCategoryDropdownChevron');
    const auditCatLabel = document.getElementById('auditCategoryDropdownCurrentLabel');
    const nativeAuditCatSelect = document.getElementById('auditCategoryFilter');

    function toggleAuditCatMenu() {
      if (!auditCatMenu) return;
      const isHidden = auditCatMenu.classList.contains('hidden');
      if (isHidden) {
        auditCatMenu.classList.remove('hidden');
        if (auditCatChevron) auditCatChevron.classList.add('rotate-180');
        if (auditCatTrigger) auditCatTrigger.setAttribute('aria-expanded', 'true');
      } else {
        closeAuditCatMenu();
      }
    }

    function closeAuditCatMenu() {
      if (!auditCatMenu) return;
      auditCatMenu.classList.add('hidden');
      if (auditCatChevron) auditCatChevron.classList.remove('rotate-180');
      if (auditCatTrigger) auditCatTrigger.setAttribute('aria-expanded', 'false');
    }

    if (auditCatTrigger) {
      auditCatTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAuditCatMenu();
      });
    }

    document.querySelectorAll('.custom-audit-cat-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = opt.getAttribute('data-value') || 'all';
        const labelText = opt.querySelector('span')?.textContent || 'All Categories';

        if (auditCatLabel) auditCatLabel.textContent = labelText;

        document.querySelectorAll('.custom-audit-cat-option').forEach(o => {
          const isSelected = o === opt;
          o.setAttribute('aria-selected', isSelected ? 'true' : 'false');
          const check = o.querySelector('.audit-option-check');
          const icon = o.querySelector('i:first-child');
          if (isSelected) {
            o.className = 'custom-audit-cat-option w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#087F70] bg-[#087F70]/10 hover:bg-[#087F70]/15 cursor-pointer transition-colors select-none font-sans text-left';
            if (check) check.classList.remove('hidden');
            if (icon) {
              icon.classList.remove('text-slate-400');
              icon.classList.add('text-[#087F70]');
            }
          } else {
            o.className = 'custom-audit-cat-option w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-[#087F70]/10 hover:text-[#087F70] cursor-pointer transition-colors select-none font-sans text-left';
            if (check) check.classList.add('hidden');
            if (icon && !icon.classList.contains('fa-layer-group')) {
              icon.classList.add('text-slate-400');
              icon.classList.remove('text-[#087F70]');
            }
          }
        });

        if (nativeAuditCatSelect) {
          nativeAuditCatSelect.value = val;
          nativeAuditCatSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        closeAuditCatMenu();
      });
    });

    document.addEventListener('click', (e) => {
      if (auditCatMenu && !auditCatMenu.classList.contains('hidden')) {
        if (!auditCatMenu.contains(e.target) && !auditCatTrigger?.contains(e.target)) {
          closeAuditCatMenu();
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && auditCatMenu && !auditCatMenu.classList.contains('hidden')) {
        closeAuditCatMenu();
      }
    });
    document.getElementById('btnRefreshAuditHistory')?.addEventListener('click', async () => {
      await loadHistoryData();
      showToast('Audit feed updated.', 'success');
    });

    // Custom Glassmorphic Client Status Filter Dropdown Component
    const clientStatusTrigger = document.getElementById('btnClientStatusDropdown');
    const clientStatusMenu = document.getElementById('clientStatusDropdownMenu');
    const clientStatusChevron = document.getElementById('clientStatusDropdownChevron');
    const clientStatusLabel = document.getElementById('clientStatusDropdownCurrentLabel');
    const nativeClientStatusSelect = document.getElementById('adminClientStatusFilter');

    function toggleClientStatusMenu() {
      if (!clientStatusMenu) return;
      const isHidden = clientStatusMenu.classList.contains('hidden');
      if (isHidden) {
        clientStatusMenu.classList.remove('hidden');
        if (clientStatusChevron) clientStatusChevron.classList.add('rotate-180');
        if (clientStatusTrigger) clientStatusTrigger.setAttribute('aria-expanded', 'true');
      } else {
        closeClientStatusMenu();
      }
    }

    function closeClientStatusMenu() {
      if (!clientStatusMenu) return;
      clientStatusMenu.classList.add('hidden');
      if (clientStatusChevron) clientStatusChevron.classList.remove('rotate-180');
      if (clientStatusTrigger) clientStatusTrigger.setAttribute('aria-expanded', 'false');
    }

    function syncClientStatusDropdown(val) {
      document.querySelectorAll('.custom-client-status-option').forEach(opt => {
        const optVal = opt.getAttribute('data-value');
        const isSelected = optVal === val;
        opt.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        const check = opt.querySelector('.client-status-option-check');
        if (isSelected) {
          opt.className = 'custom-client-status-option w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#087F70] bg-[#087F70]/10 hover:bg-[#087F70]/15 cursor-pointer transition-colors select-none font-sans text-left';
          if (check) check.classList.remove('hidden');
          const labelSpan = opt.querySelector('span:last-child');
          const labelText = labelSpan ? labelSpan.textContent.trim() : (val === 'active' ? 'Active Clients Only' : (val === 'suspended' ? 'Suspended Clients' : 'All Clients'));
          if (clientStatusLabel) clientStatusLabel.textContent = labelText;
        } else {
          opt.className = 'custom-client-status-option w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-[#087F70]/10 hover:text-[#087F70] cursor-pointer transition-colors select-none font-sans text-left';
          if (check) check.classList.add('hidden');
        }
      });
    }

    if (clientStatusTrigger) {
      clientStatusTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleClientStatusMenu();
      });
    }

    document.querySelectorAll('.custom-client-status-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = opt.getAttribute('data-value') || 'active';
        syncClientStatusDropdown(val);

        if (nativeClientStatusSelect) {
          nativeClientStatusSelect.value = val;
          nativeClientStatusSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        closeClientStatusMenu();
      });
    });

    document.addEventListener('click', (e) => {
      if (clientStatusMenu && !clientStatusMenu.classList.contains('hidden')) {
        if (!clientStatusMenu.contains(e.target) && !clientStatusTrigger?.contains(e.target)) {
          closeClientStatusMenu();
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && clientStatusMenu && !clientStatusMenu.classList.contains('hidden')) {
        closeClientStatusMenu();
      }
    });

    if (nativeClientStatusSelect) {
      nativeClientStatusSelect.addEventListener('change', () => {
        syncClientStatusDropdown(nativeClientStatusSelect.value);
      });
      syncClientStatusDropdown(nativeClientStatusSelect.value || 'active');
    }

    // -------------------------------------------------------------------------
    // Custom Glassmorphic Client Preferred Currency Dropdown Component
    // -------------------------------------------------------------------------
    const clientCurrTrigger = document.getElementById('btnClientCurrencyDropdown');
    const clientCurrMenu = document.getElementById('clientCurrencyDropdownMenu');
    const clientCurrChevron = document.getElementById('clientCurrencyDropdownChevron');
    const clientCurrLabel = document.getElementById('clientCurrencyDropdownCurrentLabel');
    const nativeClientCurrSelect = document.getElementById('clientPreferredCurrencySelect');

    function toggleClientCurrMenu() {
      if (!clientCurrMenu) return;
      const isHidden = clientCurrMenu.classList.contains('hidden');
      if (isHidden) {
        clientCurrMenu.classList.remove('hidden');
        if (clientCurrChevron) clientCurrChevron.classList.add('rotate-180');
        if (clientCurrTrigger) clientCurrTrigger.setAttribute('aria-expanded', 'true');
      } else {
        closeClientCurrMenu();
      }
    }

    function closeClientCurrMenu() {
      if (!clientCurrMenu) return;
      clientCurrMenu.classList.add('hidden');
      if (clientCurrChevron) clientCurrChevron.classList.remove('rotate-180');
      if (clientCurrTrigger) clientCurrTrigger.setAttribute('aria-expanded', 'false');
    }

    function syncClientPreferredCurrencyDropdown(val) {
      if (!val) return;
      const cleanVal = val.toUpperCase();
      document.querySelectorAll('.custom-client-currency-option').forEach(opt => {
        const optVal = (opt.getAttribute('data-value') || '').toUpperCase();
        const isSelected = optVal === cleanVal;
        opt.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        const check = opt.querySelector('.currency-option-check');
        if (isSelected) {
          opt.className = 'custom-client-currency-option w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#087F70] bg-[#087F70]/10 hover:bg-[#087F70]/15 cursor-pointer transition-colors select-none font-sans text-left';
          if (check) check.classList.remove('hidden');
          const optText = opt.querySelector('span')?.textContent || opt.textContent.trim();
          if (clientCurrLabel) clientCurrLabel.textContent = optText;
        } else {
          opt.className = 'custom-client-currency-option w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-[#087F70]/10 hover:text-[#087F70] cursor-pointer transition-colors select-none font-sans text-left';
          if (check) check.classList.add('hidden');
        }
      });
      if (nativeClientCurrSelect && nativeClientCurrSelect.value !== cleanVal) {
        nativeClientCurrSelect.value = cleanVal;
      }
    }

    if (clientCurrTrigger) {
      clientCurrTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleClientCurrMenu();
      });
    }

    document.querySelectorAll('.custom-client-currency-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = opt.getAttribute('data-value') || 'USD';
        syncClientPreferredCurrencyDropdown(val);
        if (nativeClientCurrSelect) {
          nativeClientCurrSelect.value = val;
          nativeClientCurrSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        closeClientCurrMenu();
      });
    });

    if (nativeClientCurrSelect) {
      nativeClientCurrSelect.addEventListener('change', () => {
        syncClientPreferredCurrencyDropdown(nativeClientCurrSelect.value);
      });
    }

    // -------------------------------------------------------------------------
    // Custom Glassmorphic Assign Service Modal Dropdowns
    // -------------------------------------------------------------------------
    const assignServiceTrigger = document.getElementById('btnAssignServiceTrigger');
    const assignServiceMenu = document.getElementById('assignServiceMenu');
    const assignServiceChevron = document.getElementById('assignServiceChevron');
    const assignServiceLabel = document.getElementById('assignServiceCurrentLabel');
    const nativeAssignServiceSelect = document.getElementById('assignServiceSelect');

    function toggleAssignServiceMenu() {
      if (!assignServiceMenu) return;
      const isHidden = assignServiceMenu.classList.contains('hidden');
      if (isHidden) {
        assignServiceMenu.classList.remove('hidden');
        if (assignServiceChevron) assignServiceChevron.classList.add('rotate-180');
        if (assignServiceTrigger) assignServiceTrigger.setAttribute('aria-expanded', 'true');
      } else {
        closeAssignServiceMenu();
      }
    }

    function closeAssignServiceMenu() {
      if (!assignServiceMenu) return;
      assignServiceMenu.classList.add('hidden');
      if (assignServiceChevron) assignServiceChevron.classList.remove('rotate-180');
      if (assignServiceTrigger) assignServiceTrigger.setAttribute('aria-expanded', 'false');
    }

    if (assignServiceTrigger) {
      assignServiceTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAssignServiceMenu();
      });
    }

    // Assign Currency Dropdown
    const assignCurrTrigger = document.getElementById('btnAssignCurrencyTrigger');
    const assignCurrMenu = document.getElementById('assignCurrencyMenu');
    const assignCurrChevron = document.getElementById('assignCurrencyChevron');
    const assignCurrLabel = document.getElementById('assignCurrencyCurrentLabel');
    const nativeAssignCurrSelect = document.getElementById('assignServiceCurrency');

    function toggleAssignCurrencyMenu() {
      if (!assignCurrMenu) return;
      const isHidden = assignCurrMenu.classList.contains('hidden');
      if (isHidden) {
        assignCurrMenu.classList.remove('hidden');
        if (assignCurrChevron) assignCurrChevron.classList.add('rotate-180');
        if (assignCurrTrigger) assignCurrTrigger.setAttribute('aria-expanded', 'true');
      } else {
        closeAssignCurrencyMenu();
      }
    }

    function closeAssignCurrencyMenu() {
      if (!assignCurrMenu) return;
      assignCurrMenu.classList.add('hidden');
      if (assignCurrChevron) assignCurrChevron.classList.remove('rotate-180');
      if (assignCurrTrigger) assignCurrTrigger.setAttribute('aria-expanded', 'false');
    }

    function syncAssignCurrencyDropdown(val) {
      if (!val) return;
      const cleanVal = val.toUpperCase();
      document.querySelectorAll('.custom-assign-currency-option').forEach(opt => {
        const optVal = (opt.getAttribute('data-value') || '').toUpperCase();
        const isSelected = optVal === cleanVal;
        opt.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        const check = opt.querySelector('.assign-currency-check');
        if (isSelected) {
          opt.className = 'custom-assign-currency-option w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#087F70] bg-[#087F70]/10 hover:bg-[#087F70]/15 cursor-pointer transition-colors select-none font-sans text-left';
          if (check) check.classList.remove('hidden');
          const optText = opt.querySelector('span')?.textContent || opt.textContent.trim();
          if (assignCurrLabel) assignCurrLabel.textContent = optText;
        } else {
          opt.className = 'custom-assign-currency-option w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-[#087F70]/10 hover:text-[#087F70] cursor-pointer transition-colors select-none font-sans text-left';
          if (check) check.classList.add('hidden');
        }
      });
      if (nativeAssignCurrSelect && nativeAssignCurrSelect.value !== cleanVal) {
        nativeAssignCurrSelect.value = cleanVal;
      }
    }

    if (assignCurrTrigger) {
      assignCurrTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAssignCurrencyMenu();
      });
    }

    document.querySelectorAll('.custom-assign-currency-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = opt.getAttribute('data-value') || 'USD';
        syncAssignCurrencyDropdown(val);
        if (nativeAssignCurrSelect) {
          nativeAssignCurrSelect.value = val;
          nativeAssignCurrSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        closeAssignCurrencyMenu();
      });
    });

    // -------------------------------------------------------------------------
    // Universal Custom Glassmorphic Date Picker Controller
    // -------------------------------------------------------------------------
    let _activeDatePickerTarget = null;
    let _activeDatePickerTrigger = null;
    let _calendarYear = new Date().getFullYear();
    let _calendarMonth = new Date().getMonth();

    function formatDisplayDate(isoDateStr) {
      if (!isoDateStr) return 'Select date...';
      const parts = isoDateStr.split('-').map(Number);
      if (parts.length !== 3 || isNaN(parts[0])) return isoDateStr;
      const [y, m, d] = parts;
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function updateDatePickerTrigger(inputEl) {
      if (!inputEl) return;
      const wrapper = inputEl.closest('.custom-datepicker-wrapper') || document.querySelector(`[data-datepicker-target="${inputEl.id}"]`);
      if (!wrapper) return;
      const label = wrapper.querySelector('.datepicker-label');
      if (!label) return;
      const val = inputEl.value;
      if (!val) {
        label.textContent = 'Select date...';
        label.classList.add('text-slate-400');
        label.classList.remove('text-[#172B36]');
      } else {
        label.textContent = formatDisplayDate(val);
        label.classList.remove('text-slate-400');
        label.classList.add('text-[#172B36]');
      }
    }

    function positionDatePicker(triggerEl, popoverEl) {
      if (!triggerEl || !popoverEl) return;
      const rect = triggerEl.getBoundingClientRect();
      const popoverWidth = Math.min(300, window.innerWidth - 24);
      popoverEl.style.width = `${popoverWidth}px`;
      const popoverHeight = 330;

      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - popoverWidth - 12);
      }
      if (left < 12) left = 12;

      let top = rect.bottom + 6;
      if (top + popoverHeight > window.innerHeight - 12) {
        if (rect.top - popoverHeight - 6 >= 12) {
          top = rect.top - popoverHeight - 6; // Flip above trigger
        } else {
          top = Math.max(12, window.innerHeight - popoverHeight - 12);
        }
      }

      popoverEl.style.left = `${Math.round(left)}px`;
      popoverEl.style.top = `${Math.round(top)}px`;
      popoverEl.style.zIndex = '10000';
    }

    function renderCalendarGrid() {
      const popover = document.getElementById('whizCustomDatePickerPopover');
      const label = document.getElementById('datepickerMonthYearLabel');
      const grid = document.getElementById('datepickerDaysGrid');
      if (!popover || !label || !grid) return;

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      label.textContent = `${monthNames[_calendarMonth]} ${_calendarYear}`;

      grid.innerHTML = '';

      const firstDayIndex = new Date(_calendarYear, _calendarMonth, 1).getDay();
      const lastDayOfMonth = new Date(_calendarYear, _calendarMonth + 1, 0).getDate();
      const prevMonthLastDay = new Date(_calendarYear, _calendarMonth, 0).getDate();

      const selectedVal = _activeDatePickerTarget ? _activeDatePickerTarget.value : '';
      const today = new Date();
      const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Previous month filler days
      for (let i = firstDayIndex - 1; i >= 0; i--) {
        const dayNum = prevMonthLastDay - i;
        const filler = document.createElement('div');
        filler.className = 'w-8 h-8 rounded-lg text-xs font-normal text-slate-300 flex items-center justify-center pointer-events-none select-none';
        filler.textContent = dayNum;
        grid.appendChild(filler);
      }

      // Current month days
      for (let day = 1; day <= lastDayOfMonth; day++) {
        const isoString = `${_calendarYear}-${String(_calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isSelected = selectedVal === isoString;
        const isToday = todayIso === isoString;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = day;
        btn.dataset.isoDate = isoString;

        let cls = 'w-8 h-8 rounded-lg text-xs font-medium flex items-center justify-center cursor-pointer transition-colors select-none font-sans ';
        if (isSelected) {
          cls += 'bg-[#087F70] text-white font-bold shadow-xs hover:bg-[#066559]';
        } else if (isToday) {
          cls += 'ring-1.5 ring-[#087F70] font-bold text-[#087F70] hover:bg-[#087F70]/10';
        } else {
          cls += 'text-[#172B36] hover:bg-[#087F70]/10 hover:text-[#087F70]';
        }
        btn.className = cls;

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (_activeDatePickerTarget) {
            _activeDatePickerTarget.value = isoString;
            _activeDatePickerTarget.dispatchEvent(new Event('input', { bubbles: true }));
            _activeDatePickerTarget.dispatchEvent(new Event('change', { bubbles: true }));
            updateDatePickerTrigger(_activeDatePickerTarget);
          }
          closeDatePicker();
        });

        grid.appendChild(btn);
      }

      // Next month filler days
      const totalCells = firstDayIndex + lastDayOfMonth;
      const remainingCells = (7 - (totalCells % 7)) % 7;
      for (let j = 1; j <= remainingCells; j++) {
        const filler = document.createElement('div');
        filler.className = 'w-8 h-8 rounded-lg text-xs font-normal text-slate-300 flex items-center justify-center pointer-events-none select-none';
        filler.textContent = j;
        grid.appendChild(filler);
      }
    }

    function openDatePicker(targetInput, triggerBtn) {
      const popover = document.getElementById('whizCustomDatePickerPopover');
      if (!popover || !targetInput) return;

      _activeDatePickerTarget = targetInput;
      _activeDatePickerTrigger = triggerBtn;

      const currentVal = targetInput.value;
      if (currentVal && /^\d{4}-\d{2}-\d{2}$/.test(currentVal)) {
        const [y, m] = currentVal.split('-').map(Number);
        _calendarYear = y;
        _calendarMonth = m - 1;
      } else {
        const today = new Date();
        _calendarYear = today.getFullYear();
        _calendarMonth = today.getMonth();
      }

      positionDatePicker(triggerBtn, popover);
      popover.classList.remove('hidden');
      renderCalendarGrid();
      positionDatePicker(triggerBtn, popover);
      triggerBtn?.classList.add('border-[#087F70]', 'ring-2', 'ring-[#087F70]/20');
    }

    window.addEventListener('resize', () => {
      const popover = document.getElementById('whizCustomDatePickerPopover');
      if (_activeDatePickerTrigger && popover && !popover.classList.contains('hidden')) {
        positionDatePicker(_activeDatePickerTrigger, popover);
      }
    });
    window.addEventListener('scroll', () => {
      const popover = document.getElementById('whizCustomDatePickerPopover');
      if (_activeDatePickerTrigger && popover && !popover.classList.contains('hidden')) {
        positionDatePicker(_activeDatePickerTrigger, popover);
      }
    }, true);

    function closeDatePicker() {
      const popover = document.getElementById('whizCustomDatePickerPopover');
      if (popover) popover.classList.add('hidden');
      if (_activeDatePickerTrigger) {
        _activeDatePickerTrigger.classList.remove('border-[#087F70]', 'ring-2', 'ring-[#087F70]/20');
      }
      _activeDatePickerTarget = null;
      _activeDatePickerTrigger = null;
    }

    document.getElementById('btnDatepickerPrevMonth')?.addEventListener('click', (e) => {
      e.stopPropagation();
      _calendarMonth--;
      if (_calendarMonth < 0) {
        _calendarMonth = 11;
        _calendarYear--;
      }
      renderCalendarGrid();
    });

    document.getElementById('btnDatepickerNextMonth')?.addEventListener('click', (e) => {
      e.stopPropagation();
      _calendarMonth++;
      if (_calendarMonth > 11) {
        _calendarMonth = 0;
        _calendarYear++;
      }
      renderCalendarGrid();
    });

    document.getElementById('btnDatepickerToday')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const today = new Date();
      const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      if (_activeDatePickerTarget) {
        _activeDatePickerTarget.value = todayIso;
        _activeDatePickerTarget.dispatchEvent(new Event('input', { bubbles: true }));
        _activeDatePickerTarget.dispatchEvent(new Event('change', { bubbles: true }));
        updateDatePickerTrigger(_activeDatePickerTarget);
      }
      closeDatePicker();
    });

    document.getElementById('btnDatepickerClear')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (_activeDatePickerTarget) {
        _activeDatePickerTarget.value = '';
        _activeDatePickerTarget.dispatchEvent(new Event('input', { bubbles: true }));
        _activeDatePickerTarget.dispatchEvent(new Event('change', { bubbles: true }));
        updateDatePickerTrigger(_activeDatePickerTarget);
      }
      closeDatePicker();
    });

    // Wire all datepicker triggers
    document.querySelectorAll('.custom-datepicker-wrapper').forEach(wrapper => {
      const targetId = wrapper.dataset.datepickerTarget;
      const targetInput = targetId ? document.getElementById(targetId) : wrapper.querySelector('input');
      const triggerBtn = wrapper.querySelector('.custom-datepicker-trigger');
      if (triggerBtn && targetInput) {
        triggerBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const popover = document.getElementById('whizCustomDatePickerPopover');
          if (popover && !popover.classList.contains('hidden') && _activeDatePickerTarget === targetInput) {
            closeDatePicker();
          } else {
            openDatePicker(targetInput, triggerBtn);
          }
        });
        targetInput.addEventListener('change', () => updateDatePickerTrigger(targetInput));
        updateDatePickerTrigger(targetInput);
      }
    });

    // Global click outside and escape handlers for custom popovers
    document.addEventListener('click', (e) => {
      // Date Picker
      const dpPopover = document.getElementById('whizCustomDatePickerPopover');
      if (dpPopover && !dpPopover.classList.contains('hidden')) {
        if (!dpPopover.contains(e.target) && !_activeDatePickerTrigger?.contains(e.target)) {
          closeDatePicker();
        }
      }
      // Client Currency Menu
      if (clientCurrMenu && !clientCurrMenu.classList.contains('hidden')) {
        if (!clientCurrMenu.contains(e.target) && !clientCurrTrigger?.contains(e.target)) {
          closeClientCurrMenu();
        }
      }
      // Assign Service Menu
      if (assignServiceMenu && !assignServiceMenu.classList.contains('hidden')) {
        if (!assignServiceMenu.contains(e.target) && !assignServiceTrigger?.contains(e.target)) {
          closeAssignServiceMenu();
        }
      }
      // Assign Currency Menu
      if (assignCurrMenu && !assignCurrMenu.classList.contains('hidden')) {
        if (!assignCurrMenu.contains(e.target) && !assignCurrTrigger?.contains(e.target)) {
          closeAssignCurrencyMenu();
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDatePicker();
        closeClientCurrMenu();
        closeAssignServiceMenu();
        closeAssignCurrencyMenu();
      }
    });

    // Hash change handler for deep linking & back/forward
    window.addEventListener('hashchange', () => {
      const hash = (window.location.hash || '').replace('#', '');
      if (hash.startsWith('client-')) {
        const cId = hash.replace('client-', '');
        openClientDetails(cId);
      } else if (hash.startsWith('service-tasks-')) {
        const sId = hash.replace('service-tasks-', '');
        openServiceTasksWorkspace(sId);
      } else if (hash) {
        switchTab(hash, false);
      }
    });

    // Desktop Dock Collapse/Expand Controller & Persistence (WHIZ Adaptive Dock)
    const desktopSidebar = document.getElementById('adminDesktopSidebar');
    const collapseToggleBtn = document.getElementById('sidebarCollapseToggleBtn');
    const collapseIcon = document.getElementById('sidebarCollapseIcon');

    function applySidebarState(isCollapsed) {
      if (!desktopSidebar) return;
      if (isCollapsed) {
        desktopSidebar.setAttribute('data-collapsed', 'true');
        document.documentElement.classList.add('dock-init-collapsed');
        if (collapseToggleBtn) {
          collapseToggleBtn.setAttribute('title', 'Expand sidebar (260px)');
          collapseToggleBtn.setAttribute('aria-label', 'Expand sidebar');
        }
        if (collapseIcon) {
          collapseIcon.className = 'fa-solid fa-angles-right text-xs transition-transform duration-200';
        }
      } else {
        desktopSidebar.removeAttribute('data-collapsed');
        document.documentElement.classList.remove('dock-init-collapsed');
        if (collapseToggleBtn) {
          collapseToggleBtn.setAttribute('title', 'Collapse sidebar (72px)');
          collapseToggleBtn.setAttribute('aria-label', 'Collapse sidebar');
        }
        if (collapseIcon) {
          collapseIcon.className = 'fa-solid fa-angles-left text-xs transition-transform duration-200';
        }
      }
    }

    try {
      const savedState = localStorage.getItem('whiz_sidebar_state');
      applySidebarState(savedState === 'collapsed');
    } catch (e) {
      applySidebarState(false);
    }

    if (collapseToggleBtn) {
      collapseToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCollapsed = desktopSidebar?.getAttribute('data-collapsed') === 'true';
        const nextState = !isCollapsed;
        applySidebarState(nextState);
        try {
          localStorage.setItem('whiz_sidebar_state', nextState ? 'collapsed' : 'expanded');
        } catch (err) {}
      });
    }

    // Keyboard shortcut '[' or 'Ctrl+B' to toggle sidebar
    document.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.key === '[' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        collapseToggleBtn?.click();
      }
    });

    // Mobile Drawer Toggle with Body Scroll Locking
    const toggleBtn = document.getElementById('mobileMenuToggleBtn');
    const closeBtn = document.getElementById('mobileDrawerCloseBtn');
    const drawer = document.getElementById('mobileDrawer');
    const backdrop = document.getElementById('mobileDrawerBackdrop');

    function openMobileDrawer() {
      if (drawer && backdrop) {
        drawer.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
      }
    }

    function closeMobileDrawer() {
      if (drawer && backdrop) {
        drawer.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
    }

    if (toggleBtn) toggleBtn.addEventListener('click', openMobileDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeMobileDrawer);
    if (backdrop) backdrop.addEventListener('click', closeMobileDrawer);

    if (drawer) {
      drawer.querySelectorAll('[data-dash-tab]').forEach(tabBtn => {
        tabBtn.addEventListener('click', closeMobileDrawer);
      });
    }

    // Interactive Profile Dropdown Menu Wiring
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userAccountDropdown');
    const userChevron = document.getElementById('userMenuChevron');

    function toggleUserDropdown() {
      if (!userDropdown) return;
      const isHidden = userDropdown.classList.contains('hidden');
      if (isHidden) {
        userDropdown.classList.remove('hidden');
        if (userChevron) userChevron.classList.add('rotate-180');
        if (userMenuBtn) userMenuBtn.setAttribute('aria-expanded', 'true');
      } else {
        closeUserDropdown();
      }
    }

    function closeUserDropdown() {
      if (!userDropdown) return;
      userDropdown.classList.add('hidden');
      if (userChevron) userChevron.classList.remove('rotate-180');
      if (userMenuBtn) userMenuBtn.setAttribute('aria-expanded', 'false');
    }

    if (userMenuBtn) {
      userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleUserDropdown();
      });
    }

    // Close dropdown on outside click or Escape key
    document.addEventListener('click', (e) => {
      if (userDropdown && !userDropdown.classList.contains('hidden')) {
        if (!userDropdown.contains(e.target) && !userMenuBtn?.contains(e.target)) {
          closeUserDropdown();
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeUserDropdown();
        closeMobileDrawer();
      }
    });

    // Dropdown Navigation Links
    document.getElementById('dropdownLinkProfile')?.addEventListener('click', () => {
      closeUserDropdown();
      switchTab('overview');
    });

    document.getElementById('dropdownLinkSettings')?.addEventListener('click', () => {
      closeUserDropdown();
      switchTab('team');
    });

    document.getElementById('dropdownLinkSecurity')?.addEventListener('click', () => {
      closeUserDropdown();
      switchTab('security');
    });

    // Support Requests Event Listeners
    document.getElementById('btnRefreshSupport')?.addEventListener('click', () => loadSupportData(true));
    document.getElementById('supportSearchInput')?.addEventListener('input', () => renderSupport());
    document.getElementById('supportStatusFilter')?.addEventListener('change', () => renderSupport());

    // Support Search Clear Button
    document.getElementById('supportSearchClear')?.addEventListener('click', () => {
      const input = document.getElementById('supportSearchInput');
      if (input) {
        input.value = '';
        renderSupport();
        input.focus();
      }
    });

    // Delegated Reset Support Filters
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btnClearSupportFilters')) {
        const input = document.getElementById('supportSearchInput');
        if (input) input.value = '';
        const filter = document.getElementById('supportStatusFilter');
        if (filter) {
          filter.value = 'all';
          filter.dispatchEvent(new Event('change'));
        }
        renderSupport();
      } else if (e.target.closest('.btn-retry-support')) {
        loadSupportData(true);
      }
    });

    // Support Modal Close Listeners
    const closeSupportModal = () => {
      document.getElementById('modalSupportDetail')?.classList.add('hidden');
    };
    document.getElementById('btnCloseSupportModal')?.addEventListener('click', closeSupportModal);
    document.getElementById('btnCancelSupportModal')?.addEventListener('click', closeSupportModal);

    // Support Status Form Submit
    document.getElementById('formUpdateSupportStatus')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ticketId = document.getElementById('modalSupportHiddenId')?.value;
      const status = document.getElementById('modalSupportNewStatus')?.value;
      const adminNotes = document.getElementById('modalSupportAdminNotes')?.value;
      const submitBtn = document.getElementById('btnSubmitSupportStatus');

      if (!ticketId) return;

      setBtnLoading(submitBtn, true, 'Saving...');
      const res = await apiFetch(`/portal/admin/support/${ticketId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, adminNotes })
      });
      setBtnLoading(submitBtn, false);

      if (res.ok && res.data?.success) {
        showToast(`Support request marked as ${status.replace('_', ' ')}!`, 'success');
        closeSupportModal();
        loadSupportData();
      } else {
        showToast(res.data?.error || 'Failed to update ticket status.', 'error');
      }
    });

    // Trusted Devices Actions
    document.getElementById('btnTrustThisDevice')?.addEventListener('click', async () => {
      const devName = prompt('Enter a label for this trusted device (e.g. Work Laptop, Chrome on Windows):', `Device ${new Date().toLocaleDateString()}`);
      if (!devName) return;

      const res = await apiFetch('/security/trusted-devices', {
        method: 'POST',
        body: JSON.stringify({ deviceName: devName.trim() })
      });

      if (res.ok && res.data?.success) {
        showToast('Device added to trusted devices!', 'success');
        loadTrustedDevices();
      } else {
        showToast(res.data?.error || 'Failed to register trusted device.', 'error');
      }
    });

    document.getElementById('btnRevokeAllDevices')?.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to revoke ALL trusted devices for your account?')) return;

      const res = await apiFetch('/security/trusted-devices', { method: 'DELETE' });
      if (res.ok && res.data?.success) {
        showToast('All trusted devices revoked.', 'success');
        loadTrustedDevices();
      } else {
        showToast(res.data?.error || 'Failed to revoke devices.', 'error');
      }
    });

    // Mobile Quick Refresh Button
    document.getElementById('mobileQuickRefreshBtn')?.addEventListener('click', () => {
      const icon = document.getElementById('mobileQuickRefreshIcon');
      if (icon) icon.classList.add('fa-spin');
      const tabId = state.activeTab || 'overview';
      if (tabId === 'overview') loadOverviewData();
      else if (tabId === 'clients') loadClientsData();
      else if (tabId === 'services') loadServicesData();
      else if (tabId === 'projects') loadProjectsData();
      else if (tabId === 'tasks') loadTasksData();
      else if (tabId === 'finance') loadFinanceData();
      else if (tabId === 'team') loadTeamData();
      else if (tabId === 'support') loadSupportData();
      else if (tabId === 'history') loadHistoryData();
      else if (tabId === 'security') loadSecurityData();
      setTimeout(() => {
        if (icon) icon.classList.remove('fa-spin');
        showToast('Console synchronized successfully.', 'success');
      }, 500);
    });

    // Sign out buttons
    document.querySelectorAll('.btn-admin-signout').forEach(btn => {
      btn.addEventListener('click', async () => {
        document.cookie = 'whiz_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax; Secure';
        try {
          localStorage.removeItem('whiz_last_role');
          sessionStorage.clear();
        } catch (e) {}
        if (window.Clerk) {
          await window.Clerk.signOut();
        }
        window.location.replace('/');
      });
    });

    // Password change form
    const changePasswordForm = document.getElementById('adminChangePasswordForm');
    if (changePasswordForm) {
      changePasswordForm.addEventListener('submit', handleAdminPasswordChange);
    }

    initPasswordToggles();
    initModals();
    if (typeof initGlassSelects === 'function') initGlassSelects();

    // Start Auth check
    checkAuthAndInit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
