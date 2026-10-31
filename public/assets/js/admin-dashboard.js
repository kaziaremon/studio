/**
 * WHIZ STUDIO — SUPER ADMIN CONSOLE JAVASCRIPT CONTROLLER (v5.0 Enterprise)
 * Technology: Clerk JS SDK, Cloudflare Workers API, Cloudflare D1 Database, pdf-lib
 * Architecture: 100% Free Plan ($0 / month) | Cloudflare Authoritative Engine
 */

(function () {
  'use strict';

  const CLERK_PUBLISHABLE_KEY = 'pk_test_cG9ldGljLWxpZ2VyLTQzNTUuY2xlcmsuYWNjb3VudHMuZGV2JA';
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
    currentBlueprints: []
  };

  // =========================================================================
  // AUTHENTICATED API FETCH HELPER
  // =========================================================================
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
    state.activeTab = tabId;

    const allViews = [
      'overview', 'clients', 'client_details', 'services', 'service_tasks',
      'projects', 'tasks', 'finance', 'receipt_template', 'team',
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
      receipt_template: 'Receipt Template Studio',
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

    // Sidebar active styling
    document.querySelectorAll('[data-dash-tab]').forEach(btn => {
      const isTarget = btn.dataset.dashTab === tabId;
      if (isTarget) {
        btn.classList.add('bg-brand-whiz/15', 'text-brand-whiz', 'border-brand-whiz/30');
        btn.classList.remove('text-slate-400', 'border-transparent');
      } else {
        btn.classList.remove('bg-brand-whiz/15', 'text-brand-whiz', 'border-brand-whiz/30');
        btn.classList.add('text-slate-400', 'border-transparent');
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

  async function loadOverviewData() {
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
          revEl.innerHTML = revByCurr.map(c => `<span class="inline-block mr-2">${formatCurrency(c.total, c.currency)}</span>`).join(' • ');
        }
      }

      renderCharts(d);

      const actEl = document.getElementById('overviewActivityList');
      if (actEl && d.recentActivity) {
        if (d.recentActivity.length === 0) {
          actEl.innerHTML = '<p class="text-slate-500 italic p-4 text-center">No recent system activity recorded in D1.</p>';
        } else {
          actEl.innerHTML = d.recentActivity.map(a => `
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-[#E3E9EF]">
              <div class="flex items-center space-x-2.5">
                <span class="w-2 h-2 rounded-full bg-brand-whiz"></span>
                <span class="font-bold text-[#172B36] uppercase text-[10px]">${a.action}</span>
                <span class="text-slate-500 text-xs">${a.resource_type || ''}</span>
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
            <div class="text-[10px] text-slate-500 font-mono mt-0.5">${escapeHtml(c.id)}</div>
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
              <div class="flex items-center space-x-2 truncate">
                <i class="fa-solid fa-id-badge text-slate-400 text-xs w-3.5"></i>
                <span class="font-mono text-[10px] text-slate-400 truncate">${escapeHtml(c.id)}</span>
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
    if (titleEl) titleEl.textContent = 'Loading Client Record...';

    const res = await apiFetch(`/clients/${clientId}`);
    if (!res.ok || !res.data || !res.data.data) {
      showToast('Failed to load client details.', 'error');
      switchTab('clients');
      return;
    }

    const { client, services, projects, invoices, payments, auditLogs } = res.data.data;

    // Header info
    if (titleEl) titleEl.textContent = client.company_name || client.full_name || 'Client Record';
    if (subEl) subEl.textContent = `${client.full_name || 'Client'} (${client.email})${client.is_unassigned ? ' • Unassigned Company' : ''}`;

    const statusBadge = document.getElementById('clientDetailStatusBadge');
    const btnSuspend = document.getElementById('btnSuspendClientAction');
    const btnReactivate = document.getElementById('btnReactivateClientAction');

    if (statusBadge) {
      if (client.status === 'suspended') {
        statusBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200';
        statusBadge.textContent = 'Suspended';
        btnSuspend?.classList.add('hidden');
        btnReactivate?.classList.remove('hidden');
      } else {
        statusBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200';
        statusBadge.textContent = client.status || 'Active';
        btnSuspend?.classList.remove('hidden');
        btnReactivate?.classList.add('hidden');
      }
    }
    // Profile Card
    const initials = (client.full_name || 'CL').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const avInit = document.getElementById('clientAvatarInitials');
    if (avInit) avInit.textContent = initials;
    const cfn = document.getElementById('clientCardFullName');
    if (cfn) cfn.textContent = client.full_name || 'Valued Client';
    const ccn = document.getElementById('clientCardCompanyName');
    if (ccn) {
      ccn.innerHTML = client.company_name
        ? escapeHtml(client.company_name)
        : `<span class="inline-flex items-center gap-1 text-amber-600 font-semibold"><i class="fa-solid fa-triangle-exclamation text-[10px]"></i> Unassigned (No Linked Organization)</span>`;
    }
    const cEm = document.getElementById('clientCardEmail');
    if (cEm) cEm.textContent = client.email;
    const cPh = document.getElementById('clientCardPhone');
    if (cPh) cPh.textContent = client.phone || 'None provided';
    const cLoc = document.getElementById('clientCardLocation');
    if (cLoc) cLoc.textContent = `${client.address ? client.address + ', ' : ''}${client.city || 'Dhaka'}, ${client.country || 'Bangladesh'}`;
    const cClk = document.getElementById('clientCardClerkId');
    if (cClk) cClk.textContent = client.clerk_user_id || 'Pending Clerk linking';
    const cOrg = document.getElementById('clientCardOrgId');
    if (cOrg) cOrg.textContent = client.organization_id || 'Not Linked';

    // Populate Preferred Currency in Financial Preferences
    const clientCurrency = (client.currency || (client.country === 'Bangladesh' || (client.phone && client.phone.startsWith('+880')) ? 'BDT' : 'USD')).toUpperCase();
    const currSelect = document.getElementById('clientPreferredCurrencySelect');
    if (currSelect) currSelect.value = clientCurrency;
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
          <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] flex items-center justify-between gap-4 shadow-xs">
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
            <div class="flex items-center space-x-3 shrink-0">
              <span class="text-xs font-mono font-bold text-brand-whiz">${formatCurrency(s.price_cents || 0, s.currency || clientCurrency || "USD")}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-600 border border-slate-200'}">${s.status}</span>
              ${s.status === 'active' ? `
                <button type="button" class="btn-cancel-client-service text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors" data-cs="${s.id}" title="Cancel Service">
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
              showToast('Failed to cancel service.', 'error');
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
            <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] space-y-2.5 shadow-xs">
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
        audList.innerHTML = auditLogs.map(a => `
          <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-[#E3E9EF] text-[11px]">
            <div class="flex items-center space-x-2">
              <span class="w-1.5 h-1.5 rounded-full bg-brand-whiz"></span>
              <span class="font-bold text-[#172B36] uppercase">${a.action}</span>
              <span class="text-[#5F7180]">${a.user_email || 'System'}</span>
            </div>
            <span class="text-[#5F7180] font-mono">${new Date(a.created_at).toLocaleDateString()}</span>
          </div>
        `).join('');
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
      grid.innerHTML = state.servicesCache.map(s => `
        <div class="p-5 rounded-3xl bg-white border border-[#E3E9EF] flex flex-col justify-between space-y-4 hover:border-brand-whiz/50 hover:shadow-md transition-all shadow-xs group">
          <div class="space-y-2.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="text-[10px] font-black uppercase tracking-wider text-brand-whiz bg-brand-whiz/10 px-2 py-0.5 rounded-md border border-brand-whiz/20">${s.code}</span>
                <span class="text-[10px] font-mono text-slate-500">v${s.version || 1}</span>
              </div>
              <span class="text-xs font-mono font-bold text-[#172B36]">$${((s.standard_price_cents || 100000) / 100).toFixed(0)}</span>
            </div>
            <h3 class="text-base font-extrabold text-[#172B36] group-hover:text-brand-whiz transition-colors">${s.name}</h3>
            <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">${s.description || 'Comprehensive operational service package.'}</p>
          </div>

          <div class="pt-3 border-t border-[#E3E9EF] flex items-center justify-between gap-2">
            <div class="text-[11px] text-slate-400 flex items-center gap-1.5 font-semibold">
              <i class="fa-solid fa-list-check text-brand-whiz text-xs"></i>
              <span>${s.blueprint_count || 20} SOP Tasks</span>
            </div>
            <div class="flex items-center gap-1.5">
              <button type="button" class="btn-manage-service px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-[#EAF7F1] text-slate-700 hover:text-brand-whiz border border-[#E3E9EF] cursor-pointer transition-all" data-id="${s.id}">
                Manage
              </button>
              <button type="button" class="btn-view-service-tasks px-3 py-1.5 rounded-xl text-xs font-bold btn-glass-primary shadow-xs cursor-pointer transition-all" data-id="${s.id}">
                View & Edit Tasks
              </button>
            </div>
          </div>
        </div>
      `).join('');

      // Wire View & Edit Tasks
      grid.querySelectorAll('.btn-view-service-tasks').forEach(b => {
        b.addEventListener('click', () => openServiceTasksWorkspace(b.dataset.id));
      });

      // Wire Manage Service
      grid.querySelectorAll('.btn-manage-service').forEach(b => {
        b.addEventListener('click', () => openEditServiceModal(b.dataset.id));
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

    const service = state.servicesCache.find(s => s.id === serviceId);
    if (service) {
      if (titleEl) titleEl.textContent = service.name;
      if (codeEl) codeEl.textContent = service.code;
      if (verEl) verEl.textContent = `v${service.version || 1}`;
      if (descEl) descEl.textContent = service.description || 'Master 20-Task SOP Blueprint Library';
    }

    const res = await apiFetch(`/services/${serviceId}/blueprints?includeInactive=1`);
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
      container.innerHTML = '<p class="text-slate-500 italic text-xs p-3">No tasks in this phase.</p>';
      return;
    }

    container.innerHTML = list.map(bp => {
      const isDeactivated = bp.is_active === 0;
      const priorityColors = {
        urgent: 'bg-rose-50 text-rose-700 border-rose-200',
        high: 'bg-amber-50 text-amber-700 border-amber-200',
        medium: 'bg-blue-50 text-blue-700 border-blue-200',
        low: 'bg-slate-50 text-slate-600 border-slate-200'
      };

      return `
        <div class="p-4 rounded-2xl bg-white border ${isDeactivated ? 'border-rose-200 opacity-60' : 'border-[#E3E9EF]'} space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center space-x-2.5 min-w-0">
              <span class="text-xs font-mono font-bold text-brand-whiz bg-brand-whiz/10 border border-brand-whiz/30 px-2 py-0.5 rounded shrink-0">${bp.task_code}</span>
              <h4 class="text-xs font-bold text-[#172B36] truncate ${isDeactivated ? 'line-through text-slate-400' : ''}">${bp.title}</h4>
            </div>
            <div class="flex items-center space-x-2 shrink-0">
              <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${priorityColors[bp.priority] || priorityColors.medium}">${bp.priority}</span>
              <span class="text-[11px] font-mono text-slate-400 hidden sm:inline-block">${bp.estimated_minutes || 60}m</span>
              <button type="button" class="btn-edit-blueprint px-3 py-1 rounded-lg text-xs font-bold bg-slate-50 hover:bg-slate-100 text-[#172B36] border border-[#E3E9EF] cursor-pointer transition-all" data-id="${bp.id}">
                <i class="fa-solid fa-pen-to-square text-[10px] mr-1"></i> Edit
              </button>
              <button type="button" class="btn-duplicate-blueprint p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-all" data-id="${bp.id}" title="Duplicate Blueprint">
                <i class="fa-solid fa-copy text-xs"></i>
              </button>
              <button type="button" class="btn-toggle-blueprint p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer transition-all" data-id="${bp.id}" data-active="${bp.is_active}" title="${isDeactivated ? 'Restore Task' : 'Deactivate Task'}">
                <i class="fa-solid ${isDeactivated ? 'fa-rotate-left text-emerald-400' : 'fa-trash text-xs'}"></i>
              </button>
            </div>
          </div>

          <!-- Structured Operational Details (Phase 8) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] pt-1 border-t border-slate-900">
            <div>
              <span class="text-[#5F7180] font-semibold block">WHY (Strategic Objective):</span>
              <p class="text-[#5F7180] leading-relaxed">${bp.why || bp.instructions || 'Standard operational activity.'}</p>
            </div>
            <div>
              <span class="text-[#5F7180] font-semibold block">DONE WHEN (Measurable Standard):</span>
              <p class="text-[#5F7180] leading-relaxed">${bp.done_when || 'Verified milestone output.'}</p>
            </div>
          </div>

          <div class="text-[11px] text-emerald-700 font-medium bg-emerald-50 p-2 rounded-xl border border-emerald-200">
            <span class="font-bold uppercase text-[10px] tracking-wider text-emerald-700">QA Criteria:</span> ${bp.qa_criteria || 'Verified standard output.'}
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

    // Wire toggle deactivate/restore
    container.querySelectorAll('.btn-toggle-blueprint').forEach(b => {
      b.addEventListener('click', async () => {
        const id = b.dataset.id;
        const isActive = b.dataset.active === '1';
        const endpoint = isActive ? `/services/blueprints/${id}` : `/services/blueprints/${id}/restore`;
        const method = isActive ? 'DELETE' : 'POST';

        const res = await apiFetch(endpoint, { method });
        if (res.ok) {
          showToast(isActive ? 'Task deactivated.' : 'Task restored!', 'info');
          openServiceTasksWorkspace(state.selectedServiceId);
        } else {
          showToast('Failed to change task status.', 'error');
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

    modal.classList.remove('hidden');
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
  // 5. LIVE OPERATIONAL TASKS (Phase 11)
  // =========================================================================
  async function loadTasksData(filter = 'all') {
    const res = await apiFetch('/portal/admin/live-tasks');
    const list = document.getElementById('adminLiveTasksList');
    if (!list) return;

    if (res.ok && res.data && res.data.data) {
      state.tasksCache = res.data.data;
      let tasks = state.tasksCache;
      if (filter !== 'all') {
        tasks = tasks.filter(t => t.status === filter);
      }

      if (tasks.length === 0) {
        list.innerHTML = '<p class="text-slate-500 italic p-4 text-center">No tasks found for current filter.</p>';
        return;
      }

      list.innerHTML = tasks.map(t => {
        const isCompleted = t.status === 'completed';
        return `
          <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] shadow-xs flex items-center justify-between gap-4">
            <div class="flex items-center space-x-3.5 min-w-0">
              <input type="checkbox" class="task-checkbox w-4 h-4 rounded text-[#147D64] bg-white border-slate-300 cursor-pointer" data-id="${t.id}" ${isCompleted ? 'checked' : ''}>
              <div class="min-w-0">
                <div class="text-xs font-bold text-[#172B36] truncate ${isCompleted ? 'line-through text-slate-500' : ''}">${t.title}</div>
                <div class="text-[11px] text-slate-400">${t.project_name} (${t.organization_name})</div>
              </div>
            </div>
            <div class="flex items-center space-x-3 shrink-0">
              <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}">${t.status}</span>
              <span class="text-xs font-mono font-bold text-brand-whiz">${t.progress_percent}% Proj</span>
              <button type="button" class="btn-live-task-detail px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-[#E3E9EF] cursor-pointer transition-all" data-id="${t.id}">
                Details
              </button>
            </div>
          </div>
        `;
      }).join('');

      
      // Wire task search and priority filters
      const taskSearch = document.getElementById('taskSearchInput');
      if (taskSearch && !taskSearch.dataset.bound) {
        taskSearch.dataset.bound = 'true';
        taskSearch.addEventListener('input', () => loadTasksData(state.currentTaskFilter || 'all'));
      }
      const taskPriority = document.getElementById('taskPriorityFilter');
      if (taskPriority && !taskPriority.dataset.bound) {
        taskPriority.dataset.bound = 'true';
        taskPriority.addEventListener('change', () => loadTasksData(state.currentTaskFilter || 'all'));
      }

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
            loadTasksData(filter);
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
          document.getElementById('liveTaskModalTitle').innerHTML = `<i class="fa-solid fa-list-check text-brand-whiz"></i><span>${task.title}</span>`;
          document.getElementById('liveTaskModalProject').textContent = `${task.project_name} (${task.organization_name})`;
          document.getElementById('liveTaskModalDesc').textContent = task.description || 'Standard task execution blueprint.';
          document.getElementById('liveTaskStatus').value = task.status || 'todo';
          document.getElementById('liveTaskPriority').value = task.priority || 'medium';
          document.getElementById('liveTaskNotes').value = task.internal_notes || '';

          modal.classList.remove('hidden');
        });
      });
    }
  }

  // =========================================================================
  // 6. FINANCE & PAYMENTS
  // =========================================================================
  // Store payments in state cache for modal operations
  let paymentsCache = [];

  async function loadFinanceData() {
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
                <button type="button" class="btn-download-receipt-admin px-2.5 py-1 rounded-lg text-xs font-bold btn-glass-primary shadow-xs cursor-pointer" data-receipt="${p.receipt_number}" title="Download Vector PDF Receipt">
                  <i class="fa-solid fa-file-pdf mr-1"></i> Receipt
                </button>
                <button type="button" class="btn-edit-payment-admin px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer" data-id="${p.id}" title="Edit Metadata">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button type="button" class="btn-correct-payment-admin px-2 py-1 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer" data-id="${p.id}" title="Financial Correction">
                  <i class="fa-solid fa-scale-balanced"></i>
                </button>
                ${!isVoided ? `
                  <button type="button" class="btn-void-payment-admin px-2 py-1 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer" data-id="${p.id}" title="Void Payment">
                    <i class="fa-solid fa-ban"></i>
                  </button>
                ` : ''}
                <button type="button" class="btn-delete-payment-admin px-2 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer" data-id="${p.id}" title="Delete Test Payment">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
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
                <button type="button" class="btn-download-receipt-admin flex-1 py-1.5 rounded-xl text-xs font-bold btn-glass-primary text-center cursor-pointer" data-receipt="${p.receipt_number}">
                  <i class="fa-solid fa-file-pdf mr-1"></i> Receipt
                </button>
                <button type="button" class="btn-edit-payment-admin px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer" data-id="${p.id}">
                  Edit
                </button>
                <button type="button" class="btn-correct-payment-admin px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 cursor-pointer" data-id="${p.id}">
                  Correct
                </button>
                ${!isVoided ? `
                  <button type="button" class="btn-void-payment-admin px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer" data-id="${p.id}" title="Void">
                    <i class="fa-solid fa-ban"></i>
                  </button>
                ` : ''}
                <button type="button" class="btn-delete-payment-admin px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-600 cursor-pointer" data-id="${p.id}" title="Delete">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          `;
        }).join('');
      }

      // Attach Event Listeners
      const attachListeners = (container) => {
        if (!container) return;

        // Download Receipt PDF
        container.querySelectorAll('.btn-download-receipt-admin').forEach(b => {
          b.addEventListener('click', async () => {
            const receiptNum = b.dataset.receipt;
            const res = await apiFetch(`/pdf/data/receipt/${receiptNum}`);
            if (res.ok && res.data && res.data.data) {
              await generateReceiptPdfInBrowser(res.data.data);
            } else {
              showToast('Failed to fetch receipt data for download.', 'error');
            }
          });
        });

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
            document.getElementById('editPaymentDate').value = p.payment_date || new Date().toISOString().split('T')[0];
            document.getElementById('editPaymentMethod').value = p.payment_method || 'bank_transfer';
            document.getElementById('editPaymentReference').value = p.payment_reference || '';
            document.getElementById('editPaymentNotes').value = p.financial_notes || '';

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

    let filtered = state.usersCache.filter(u => {
      const fullName = (u.full_name || u.fullName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const username = (u.username || '').toLowerCase();
      const clerkId = (u.clerk_user_id || u.clerkUserId || '').toLowerCase();

      const matchesQuery = !query || 
        fullName.includes(query) ||
        email.includes(query) ||
        username.includes(query) ||
        clerkId.includes(query);

      const matchesRole = roleFilter === 'all' || 
        (roleFilter === 'client' && u.role === 'client') ||
        (roleFilter === 'admin' && u.role === 'admin') ||
        (roleFilter === 'owner' && (u.role === 'owner' || u.role === 'super_admin'));

      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

      return matchesQuery && matchesRole && matchesStatus;
    });

    if (countEl) countEl.textContent = `${filtered.length} account${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
      const emptyMsg = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500 italic">No users match the search filter.</td></tr>';
      if (tbody) tbody.innerHTML = emptyMsg;
      if (cardsContainer) cardsContainer.innerHTML = '<div class="p-6 rounded-2xl bg-white border border-[#E3E9EF] text-center text-xs text-slate-500 italic shadow-xs">No users match search criteria.</div>';
      return;
    }

    // Desktop Table
    if (tbody) {
      tbody.innerHTML = filtered.map(u => {
        const email = u.email || '';
        const isOwner = email.toLowerCase() === 'kaziaremon@gmail.com';
        const fullName = u.full_name || u.fullName || 'Registered User';
        const initials = (fullName || email || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        const clerkId = u.clerk_user_id || u.clerkUserId || '';
        const companyName = u.company_name || u.companyName || '';
        const createdAt = u.created_at || u.createdAt;

        let roleBadge = '';
        if (isOwner || u.role === 'owner' || u.role === 'super_admin') {
          roleBadge = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-crown text-[9px]"></i> Owner</span>';
        } else if (u.role === 'admin') {
          roleBadge = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200"><i class="fa-solid fa-shield-halved text-[9px]"></i> Admin</span>';
        } else {
          roleBadge = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200"><i class="fa-solid fa-user text-[9px]"></i> Client</span>';
        }

        const statusBadge = u.status === 'active' 
          ? '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200">Active</span>'
          : '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase text-amber-700 bg-amber-50 border border-amber-200">Suspended</span>';

        let actionsHtml = '';
        if (isOwner) {
          actionsHtml = '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200"><i class="fa-solid fa-lock text-[10px]"></i> Founding Owner</span>';
        } else if (u.status === 'suspended') {
          actionsHtml = `
            <div class="flex items-center justify-end gap-1.5">
              ${u.role === 'client' ? `<button type="button" class="btn-user-view-details px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-[#172B36] border border-[#E3E9EF] cursor-pointer" data-id="${u.id}"><i class="fa-solid fa-eye mr-1 text-brand-whiz"></i>Details</button>` : ''}
              <button type="button" class="btn-user-reactivate px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer" data-id="${u.id}"><i class="fa-solid fa-play mr-1"></i>Reactivate</button>
              <button type="button" class="btn-user-delete px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer" data-id="${u.id}" data-name="${escapeHtml(fullName)}"><i class="fa-solid fa-trash-can mr-1"></i>Delete</button>
            </div>
          `;
        } else {
          const roleBtn = (!isOwner && u.role === 'admin')
            ? `<button type="button" class="btn-role-action px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-all cursor-pointer" data-id="${u.id}" data-role="client" data-email="${escapeHtml(email)}" data-name="${escapeHtml(fullName)}"><i class="fa-solid fa-arrow-down mr-1 text-[10px]"></i>Revoke Admin Access</button>`
            : '';

          actionsHtml = `
            <div class="flex items-center justify-end gap-1.5">
              ${roleBtn}
              ${!isOwner ? `<button type="button" class="btn-user-suspend px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer" data-id="${u.id}"><i class="fa-solid fa-pause mr-1"></i>Suspend</button>` : ''}
            </div>
          `;
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
                  ${clerkId ? `<div class="text-[10px] text-slate-400 font-mono truncate mt-0.5">${escapeHtml(clerkId)}</div>` : ''}
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

    // Mobile Cards
    if (cardsContainer) {
      cardsContainer.innerHTML = filtered.map(u => {
        const email = u.email || '';
        const isOwner = email.toLowerCase() === 'kaziaremon@gmail.com';
        const fullName = u.full_name || u.fullName || 'Registered User';
        const initials = (fullName || email || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        const companyName = u.company_name || u.companyName || '';
        const createdAt = u.created_at || u.createdAt;

        let roleBadge = '';
        if (isOwner || u.role === 'owner' || u.role === 'super_admin') {
          roleBadge = '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-crown text-[9px]"></i> Owner</span>';
        } else if (u.role === 'admin') {
          roleBadge = '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200"><i class="fa-solid fa-shield-halved text-[9px]"></i> Admin</span>';
        } else {
          roleBadge = '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200"><i class="fa-solid fa-user text-[9px]"></i> Client</span>';
        }

        const statusBadge = u.status === 'active' 
          ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200">Active</span>'
          : '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase text-amber-700 bg-amber-50 border border-amber-200">Suspended</span>';

        return `
          <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] shadow-xs space-y-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center space-x-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-[#172B36] uppercase shrink-0">
                  ${escapeHtml(initials)}
                </div>
                <div class="min-w-0">
                  <h4 class="text-sm font-black text-[#172B36] truncate">${escapeHtml(fullName)}</h4>
                  <p class="text-xs font-mono text-slate-500 truncate">${escapeHtml(email)}</p>
                </div>
              </div>
              <div class="shrink-0 flex flex-col items-end gap-1">
                ${roleBadge}
                ${statusBadge}
              </div>
            </div>

            <div class="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Company: <strong class="text-slate-700">${companyName ? escapeHtml(companyName) : 'None'}</strong></span>
              <span class="font-mono text-[11px]">${createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>

            ${!isOwner ? `
              <div class="pt-2 border-t border-slate-100 flex items-center gap-2">
                ${u.role === 'admin'
                  ? `<button type="button" class="btn-role-action flex-1 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 text-center cursor-pointer" data-id="${u.id}" data-role="client" data-email="${escapeHtml(email)}" data-name="${escapeHtml(fullName)}">Revoke Admin Access</button>`
                  : ''
                }
                ${u.status === 'suspended'
                  ? `<button type="button" class="btn-user-reactivate px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 cursor-pointer" data-id="${u.id}">Reactivate</button>`
                  : `<button type="button" class="btn-user-suspend px-3 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 cursor-pointer" data-id="${u.id}">Suspend</button>`
                }
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }

    function openRoleChangeModal(id, targetRole, email, name) {
      const modal = document.getElementById('modalRoleChange');
      if (!modal) return;
      const idInput = document.getElementById('roleChangeUserId');
      const roleInput = document.getElementById('roleChangeTargetRole');
      const titleEl = document.getElementById('modalRoleChangeTitle');
      const descEl = document.getElementById('modalRoleChangeDesc');
      const submitBtn = document.getElementById('btnSubmitRoleChange');

      if (idInput) idInput.value = id;
      if (roleInput) roleInput.value = targetRole;
      if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-user-xmark text-amber-600 mr-2"></i><span>Revoke Administrator Access</span>';
      if (descEl) descEl.textContent = `Are you sure you want to revoke administrator access for ${name} (${email})? Their account will be downgraded to a standard Client.`;
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fa-solid fa-user-minus text-xs mr-1"></i><span>Revoke Admin Access & Downgrade</span>';
      }
      modal.classList.remove('hidden');
    }

    // Bind action buttons on both
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
      const target = h.target_email || h.target_name || h.target_clerk_user_id || 'User';
      const actor = h.actor_clerk_user_id ? (h.actor_clerk_user_id.startsWith('usr_owner') ? 'Super Admin' : h.actor_clerk_user_id) : 'System';
      const prevRole = h.previous_role || 'client';
      const nextRole = h.new_role || 'admin';
      const result = h.action_result || 'success';
      const reason = h.reason || 'Administrative role update';

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
        const target = h.target_email || h.target_name || h.target_clerk_user_id || 'User';
        const prevRole = h.previous_role || 'client';
        const nextRole = h.new_role || 'admin';
        const result = h.action_result || 'success';
        const reason = h.reason || 'Administrative role update';

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
            <div class="text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
              <span>Reason: <strong>${escapeHtml(reason)}</strong></span>
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
          const name = p.full_name || 'Approved Administrator';
          const email = p.email || p.approved_email || '';
          const role = p.role === 'super_admin' ? 'Super Admin' : 'Admin';
          const createdAt = p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A';
          return `
            <tr class="hover:bg-slate-50 transition-colors border-b border-[#E3E9EF]">
              <td class="px-6 py-4 font-bold text-[#172B36]">${escapeHtml(name)}</td>
              <td class="px-6 py-4 font-mono text-xs text-slate-600">${escapeHtml(email)}</td>
              <td class="px-6 py-4"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">${escapeHtml(role)}</span></td>
              <td class="px-6 py-4 font-mono text-xs text-slate-500">${escapeHtml(createdAt)}</td>
              <td class="px-6 py-4"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">Pending Verification</span></td>
              <td class="px-6 py-4 text-right">
                <button type="button" class="btn-revoke-invitation px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-all" data-id="${p.id}" data-email="${escapeHtml(email)}">
                  <i class="fa-solid fa-ban mr-1 text-[10px]"></i>Revoke Approval
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }

      if (pendingCards) {
        pendingCards.innerHTML = pendingList.map(p => {
          const name = p.full_name || 'Approved Administrator';
          const email = p.email || p.approved_email || '';
          const role = p.role === 'super_admin' ? 'Super Admin' : 'Admin';
          const createdAt = p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A';
          return `
            <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] shadow-xs space-y-2.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-[#172B36]">${escapeHtml(name)}</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">Pending</span>
              </div>
              <div class="font-mono text-xs text-slate-600">${escapeHtml(email)}</div>
              <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>Role: <strong class="text-slate-700">${escapeHtml(role)}</strong></span>
                <span class="font-mono text-[11px]">${escapeHtml(createdAt)}</span>
              </div>
              <button type="button" class="btn-revoke-invitation w-full py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-center cursor-pointer transition-all" data-id="${p.id}" data-email="${escapeHtml(email)}">
                Revoke Approval
              </button>
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
          const roleBadge = isOwner
            ? '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-crown text-[9px] text-amber-500"></i> Owner</span>'
            : '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200"><i class="fa-solid fa-shield-halved text-[9px]"></i> Admin</span>';
          const activatedAt = a.activated_at ? new Date(a.activated_at).toLocaleDateString() : (a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A');

          const actionHtml = isOwner
            ? '<span class="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300"><i class="fa-solid fa-shield mr-1"></i>Founding Super Admin</span>'
            : `<button type="button" class="btn-revoke-admin-access px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer transition-all" data-id="${a.id}" data-email="${escapeHtml(email)}" data-name="${escapeHtml(name)}"><i class="fa-solid fa-user-xmark mr-1 text-[10px]"></i>Revoke Admin Access</button>`;

          return `
            <tr class="hover:bg-slate-50 transition-colors border-b border-[#E3E9EF]">
              <td class="px-6 py-4 font-bold text-[#172B36]">${escapeHtml(name)}</td>
              <td class="px-6 py-4 font-mono text-xs text-slate-600">${escapeHtml(email)}</td>
              <td class="px-6 py-4 font-mono text-[11px] text-slate-400">${escapeHtml(clerkId)}</td>
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
          const isOwner = email.toLowerCase() === 'kaziaremon@gmail.com';
          const name = a.full_name || (isOwner ? 'Kazi Emon' : 'Administrator');
          const clerkId = a.clerk_user_id || '—';
          const activatedAt = a.activated_at ? new Date(a.activated_at).toLocaleDateString() : (a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A');

          return `
            <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] shadow-xs space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="font-bold text-[#172B36] text-sm">${escapeHtml(name)}</span>
                ${isOwner
                  ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">Owner</span>'
                  : '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">Admin</span>'
                }
              </div>
              <div class="font-mono text-xs text-slate-600">${escapeHtml(email)}</div>
              <div class="text-[10px] font-mono text-slate-400">${escapeHtml(clerkId)}</div>
              <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Active since: ${escapeHtml(activatedAt)}</span>
                ${!isOwner ? `
                  <button type="button" class="btn-revoke-admin-access px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer" data-id="${a.id}" data-email="${escapeHtml(email)}" data-name="${escapeHtml(name)}">
                    Revoke Access
                  </button>
                ` : '<span class="text-xs font-bold text-emerald-700">Protected</span>'}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Attach listeners for Revoke Pre-Approval
    document.querySelectorAll('.btn-revoke-invitation').forEach(btn => {
      btn.addEventListener('click', async () => {
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

      const actorEmail = l.user_email || 'System';
      const resourceInfo = l.resource_type ? `${l.resource_type}${l.resource_id ? ` #${l.resource_id.slice(0, 12)}` : ''}` : '';

      let detailsHtml = '';
      if (l.details) {
        let detailsFormatted = '';
        try {
          const parsed = typeof l.details === 'string' ? JSON.parse(l.details) : l.details;
          detailsFormatted = JSON.stringify(parsed, null, 2);
        } catch (e) {
          detailsFormatted = String(l.details);
        }

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

  // =========================================================================
  // OFFICIAL DOCUMENT & PDF GENERATION (pdf-lib, Zero Server Storage)
  // Matching Supplied High-Fidelity Whiz Studio Template
  // =========================================================================
  async function generateOfficialDocumentPdf(docData) {
    if (!window.PDFLib) {
      showToast('PDF generation engine unavailable. Please reload.', 'error');
      return;
    }

    try {
      showToast('Compiling official high-resolution vector PDF...', 'info');

      const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size in points
      const { width, height } = page.getSize();

      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Template Color Palette
      const tealPrimary = rgb(0.08, 0.49, 0.39); // #147D64
      const textDark = rgb(0.09, 0.17, 0.21);   // #172B36
      const textMuted = rgb(0.37, 0.44, 0.50);  // #5F7180

      // 1. Embed Images
      try {
        const [logoBuf, topCornerBuf, botCornerBuf, sigBuf] = await Promise.all([
          fetch('/assets/images/logo.png').then(r => r.arrayBuffer()).catch(() => null),
          fetch('/assets/images/template-corner-top-right.png').then(r => r.arrayBuffer()).catch(() => null),
          fetch('/assets/images/template-corner-bottom-left.png').then(r => r.arrayBuffer()).catch(() => null),
          fetch('/assets/images/official-signature.png').then(r => r.arrayBuffer()).catch(() => null)
        ]);

        if (topCornerBuf) {
          const topCornerImg = await pdfDoc.embedPng(topCornerBuf);
          page.drawImage(topCornerImg, {
            x: width - 150,
            y: height - 61.5,
            width: 150,
            height: 61.5
          });
        }

        if (botCornerBuf) {
          const botCornerImg = await pdfDoc.embedPng(botCornerBuf);
          page.drawImage(botCornerImg, {
            x: 0,
            y: 0,
            width: 130,
            height: 120
          });
        }

        if (logoBuf) {
          const logoImg = await pdfDoc.embedPng(logoBuf);
          const logoW = 140;
          const logoH = 140 * (576 / 1024);
          page.drawImage(logoImg, {
            x: 50,
            y: height - 110,
            width: logoW,
            height: logoH
          });
        } else {
          page.drawText('WHIZ STUDIO', {
            x: 50,
            y: height - 80,
            size: 20,
            font: fontBold,
            color: tealPrimary
          });
        }

        if (sigBuf) {
          const sigImg = await pdfDoc.embedPng(sigBuf);
          page.drawImage(sigImg, {
            x: width - 175,
            y: 75,
            width: 95,
            height: 66
          });
        }
      } catch (e) {
        console.warn('Image embedding fallback:', e);
      }

      // 2. Top-Right Title & Client Copy
      const isInvoice = (docData.type || 'invoice').toLowerCase() === 'invoice';
      const titleText = isInvoice ? 'INVOICE' : 'RECEIPT';
      page.drawText(titleText, {
        x: width - 210,
        y: height - 85,
        size: 28,
        font: fontBold,
        color: tealPrimary
      });

      page.drawText('Client Copy', {
        x: width - 210,
        y: height - 103,
        size: 11,
        font: fontBold,
        color: textDark
      });

      page.drawLine({
        start: { x: width - 210, y: height - 115 },
        end: { x: width - 50, y: height - 115 },
        thickness: 1.5,
        color: tealPrimary
      });

      // 3. Details Section
      let leftY = height - 160;
      page.drawText('BILLED TO:', {
        x: 50,
        y: leftY,
        size: 10,
        font: fontBold,
        color: tealPrimary
      });

      leftY -= 15;
      page.drawText(docData.clientName || 'Valued Client', {
        x: 50,
        y: leftY,
        size: 11.5,
        font: fontBold,
        color: textDark
      });

      leftY -= 13;
      page.drawText('Address: ', {
        x: 50,
        y: leftY,
        size: 8.5,
        font: fontBold,
        color: textDark
      });

      const addressText = docData.clientAddress || 'Dhaka, Bangladesh';
      const words = addressText.split(' ');
      let addrLine = '';
      let addrLines = [];
      for (const w of words) {
        if ((addrLine + w).length > 38) {
          addrLines.push(addrLine.trim());
          addrLine = w + ' ';
        } else {
          addrLine += w + ' ';
        }
      }
      if (addrLine.trim()) addrLines.push(addrLine.trim());

      let currAddrY = leftY;
      addrLines.slice(0, 3).forEach((line, idx) => {
        page.drawText(line, {
          x: idx === 0 ? 95 : 50,
          y: currAddrY,
          size: 8.5,
          font: fontRegular,
          color: textDark
        });
        currAddrY -= 11;
      });

      currAddrY -= 2;
      page.drawText('Phone Number: ', {
        x: 50,
        y: currAddrY,
        size: 8.5,
        font: fontBold,
        color: textDark
      });
      page.drawText(docData.clientPhone || '+880...', {
        x: 120,
        y: currAddrY,
        size: 8.5,
        font: fontRegular,
        color: textDark
      });

      // Right Column Metadata
      const rightX = width - 210;
      let rightY = height - 160;

      const numLabel = isInvoice ? 'INVOICE NO: ' : 'RECEIPT NO: ';
      page.drawText(numLabel, {
        x: rightX,
        y: rightY,
        size: 10,
        font: fontBold,
        color: tealPrimary
      });
      page.drawText(String(docData.docNumber || '829926'), {
        x: rightX + fontBold.widthOfTextAtSize(numLabel, 10),
        y: rightY,
        size: 10,
        font: fontBold,
        color: textDark
      });

      rightY -= 14;
      page.drawText(docData.docDate || '29 September, 2026', {
        x: rightX,
        y: rightY,
        size: 9,
        font: fontRegular,
        color: textMuted
      });

      rightY -= 18;
      page.drawText('PAYMENT TYPE', {
        x: rightX,
        y: rightY,
        size: 9.5,
        font: fontBold,
        color: tealPrimary
      });
      rightY -= 13;
      page.drawText(docData.paymentType || 'Facebook Ads', {
        x: rightX,
        y: rightY,
        size: 9,
        font: fontRegular,
        color: textDark
      });

      rightY -= 16;
      page.drawText('PAYMENT METHOD', {
        x: rightX,
        y: rightY,
        size: 9.5,
        font: fontBold,
        color: tealPrimary
      });
      rightY -= 13;
      page.drawText(docData.paymentMethod || 'Bkash', {
        x: rightX,
        y: rightY,
        size: 9,
        font: fontRegular,
        color: textDark
      });

      rightY -= 12;
      page.drawText('Account Details –', {
        x: rightX,
        y: rightY,
        size: 8,
        font: fontRegular,
        color: textMuted
      });
      rightY -= 11;
      page.drawText(docData.accountDetails || 'Md Kazi Abdur Rahim Emon', {
        x: rightX,
        y: rightY,
        size: 8.5,
        font: fontRegular,
        color: textDark
      });
      rightY -= 11;
      page.drawText(`Phone Number: ${docData.agencyPhone || '+880 1560066374'}`, {
        x: rightX,
        y: rightY,
        size: 8,
        font: fontRegular,
        color: textDark
      });

      // 4. Line Items Table
      const tableY = Math.min(currAddrY, rightY) - 25;

      page.drawLine({
        start: { x: 50, y: tableY + 16 },
        end: { x: width - 50, y: tableY + 16 },
        thickness: 1,
        color: tealPrimary
      });

      page.drawText('Description', { x: 55, y: tableY + 4, size: 9.5, font: fontBold, color: tealPrimary });
      page.drawText('Quantity', { x: 280, y: tableY + 4, size: 9.5, font: fontBold, color: tealPrimary });
      page.drawText('Rate', { x: 380, y: tableY + 4, size: 9.5, font: fontBold, color: tealPrimary });
      page.drawText('Amount', { x: 490, y: tableY + 4, size: 9.5, font: fontBold, color: tealPrimary });

      page.drawLine({
        start: { x: 50, y: tableY - 4 },
        end: { x: width - 50, y: tableY - 4 },
        thickness: 1,
        color: tealPrimary
      });

      let itemY = tableY - 22;
      page.drawText(docData.itemDesc || 'Facebook Ads Expenses & Service Change', {
        x: 55,
        y: itemY,
        size: 9,
        font: fontRegular,
        color: textDark
      });
      page.drawText(String(docData.itemQty || '2'), {
        x: 295,
        y: itemY,
        size: 9,
        font: fontRegular,
        color: textDark
      });
      page.drawText(String(docData.itemRate || '1250'), {
        x: 385,
        y: itemY,
        size: 9,
        font: fontRegular,
        color: textDark
      });
      page.drawText(String(docData.itemAmount || '2500'), {
        x: 495,
        y: itemY,
        size: 9,
        font: fontBold,
        color: textDark
      });

      page.drawLine({
        start: { x: 50, y: itemY - 12 },
        end: { x: width - 50, y: itemY - 12 },
        thickness: 1,
        color: tealPrimary
      });

      const totalY = itemY - 30;
      page.drawText('TOTAL', {
        x: 380,
        y: totalY,
        size: 11,
        font: fontBold,
        color: tealPrimary
      });
      page.drawText(String(docData.totalAmount || '2500'), {
        x: 495,
        y: totalY,
        size: 11,
        font: fontBold,
        color: tealPrimary
      });

      // 5. Notes & Signature
      const notesY = 135;
      page.drawText('NOTES:', {
        x: 120,
        y: notesY,
        size: 9.5,
        font: fontBold,
        color: tealPrimary
      });

      page.drawText('Whiz Studio', {
        x: 120,
        y: notesY - 14,
        size: 9.5,
        font: fontBold,
        color: textDark
      });

      page.drawText('Address: Road 7, Block A, Mirpur 12, Dhaka, Bangladesh – 1216', {
        x: 120,
        y: notesY - 26,
        size: 7.5,
        font: fontRegular,
        color: textDark
      });

      page.drawText('Phone Number: +880 1322196665', {
        x: 120,
        y: notesY - 38,
        size: 7.5,
        font: fontRegular,
        color: textDark
      });

      page.drawText('Email: info@whizstudio.art', {
        x: 120,
        y: notesY - 50,
        size: 7.5,
        font: fontRegular,
        color: textDark
      });

      page.drawLine({
        start: { x: width - 200, y: 68 },
        end: { x: width - 60, y: 68 },
        thickness: 1.5,
        color: tealPrimary
      });

      page.drawText('SIGNATURE', {
        x: width - 150,
        y: 53,
        size: 9.5,
        font: fontBold,
        color: tealPrimary
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `Whiz_Studio_${isInvoice ? 'Invoice' : 'Receipt'}_${docData.docNumber || '829926'}.pdf`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Vector PDF ${fileName} downloaded successfully!`, 'success');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      showToast('Error compiling vector PDF document.', 'error');
    }
  }

  // Wrapper for existing receipt downloads
  async function generateReceiptPdfInBrowser(data) {
    const docData = {
      type: 'receipt',
      docNumber: data.receiptNumber || '829926',
      docDate: data.paymentDate || new Date().toISOString().split('T')[0],
      clientName: data.client?.organizationName || data.client?.companyName || data.client?.contactName || 'Valued Client',
      clientAddress: data.client?.address || 'Dhaka, Bangladesh',
      clientPhone: data.client?.phone || '+880 1624644435',
      paymentType: data.serviceName || 'Agency Service Retainer',
      paymentMethod: (data.paymentMethod || 'Bkash').toUpperCase(),
      accountDetails: data.accountDetails || 'Md Kazi Abdur Rahim Emon',
      agencyPhone: data.agencyPhone || '+880 1560066374',
      itemDesc: data.serviceName || 'Agency Service Retainer',
      itemQty: '1',
      itemRate: ((data.amountPaidCents || 0) / 100).toFixed(0),
      itemAmount: ((data.amountPaidCents || 0) / 100).toFixed(0),
      totalAmount: ((data.amountPaidCents || 0) / 100).toFixed(0),
      currency: data.currency || 'USD'
    };
    await generateOfficialDocumentPdf(docData);
  }

  // =========================================================================
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
  // MODALS & EVENT HANDLERS
  // =========================================================================
  function initModals() {
    // 1. Open Add Client Modal
    const openAddClient = () => {
      const modal = document.getElementById('modalAddClient');
      const box = document.getElementById('addClientServicesCheckboxes');
      if (modal && box) {
        modal.classList.remove('hidden');
        if (state.servicesCache.length > 0) {
          box.innerHTML = state.servicesCache.map(s => `
            <label class="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-whiz/50 cursor-pointer">
              <input type="checkbox" name="services" value="${s.id}" class="w-4 h-4 rounded text-brand-whiz bg-slate-950 border-slate-700">
              <span class="text-xs font-semibold text-white flex-1">${s.name}</span>
              <span class="text-[10px] text-brand-whiz font-bold uppercase">${s.code}</span>
            </label>
          `).join('');
        }
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

    // Edit Client Profile Modal
    document.getElementById('btnOpenEditClientModal')?.addEventListener('click', async () => {
      const clientId = state.selectedClientId;
      if (!clientId) return;

      const res = await apiFetch(`/clients/${clientId}`);
      if (!res.ok || !res.data || !res.data.data?.client) return;

      const c = res.data.data.client;
      document.getElementById('editClientId').value = c.id;
      document.getElementById('editClientFullName').value = c.full_name || '';
      document.getElementById('editClientCompanyName').value = c.company_name || '';
      document.getElementById('editClientEmail').value = c.email || '';
      document.getElementById('editClientPhone').value = c.phone || '';
      document.getElementById('editClientCity').value = c.city || 'Dhaka';
      document.getElementById('editClientCountry').value = c.country || 'Bangladesh';
      document.getElementById('editClientAddress').value = c.address || '';
      document.getElementById('editClientStatus').value = c.status || 'active';

      document.getElementById('modalEditClient')?.classList.remove('hidden');
    });

    document.getElementById('formEditClient')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const clientId = f.clientId.value;
      const submitBtn = f.querySelector('button[type="submit"]');

      setBtnLoading(submitBtn, true, 'Saving changes...');

      const payload = {
        fullName: f.fullName.value,
        companyName: f.companyName.value,
        email: f.email.value,
        phone: f.phone.value,
        city: f.city.value,
        country: f.country.value,
        address: f.address.value,
        status: f.status.value
      };

      const res = await apiFetch(`/clients/${clientId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setBtnLoading(submitBtn, false);

      if (res.ok && res.data && res.data.success) {
        showToast('Client profile updated successfully!', 'success');
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

      document.getElementById('assignServiceStartDate').value = new Date().toISOString().split('T')[0];
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
      const titleEl = document.getElementById('clientDetailTitle');
      const targetNameEl = document.getElementById('deleteClientTargetName');
      if (targetNameEl && titleEl) targetNameEl.textContent = titleEl.textContent;

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

    // 4. SOP Task Blueprint Workspace Handlers
    document.getElementById('btnBackToServices')?.addEventListener('click', () => {
      switchTab('services');
    });

    document.getElementById('btnOpenAddBlueprintModal')?.addEventListener('click', () => {
      document.getElementById('addBlueprintServiceId').value = state.selectedServiceId;
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
        showToast('Task blueprint updated successfully in D1!', 'success');
        document.getElementById('modalEditBlueprint')?.classList.add('hidden');
        openServiceTasksWorkspace(state.selectedServiceId);
      } else {
        showToast(res.data?.error || 'Failed to update blueprint.', 'error');
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

    // 6. Task Filter Buttons
    document.querySelectorAll('.task-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.task-filter-btn').forEach(b => {
          b.classList.remove('bg-slate-800', 'text-white', 'font-bold');
          b.classList.add('text-slate-400', 'font-medium');
        });
        btn.classList.add('bg-slate-800', 'text-white', 'font-bold');
        btn.classList.remove('text-slate-400', 'font-medium');
        loadTasksData(btn.dataset.filter);
      });
    });

    // 7. Open Record Payment Modal
    const openRecordPayment = () => {
      const modal = document.getElementById('modalRecordPayment');
      const select = document.getElementById('paymentClientSelect');
      if (modal && select) {
        modal.classList.remove('hidden');
        select.innerHTML = '<option value="">Select client...</option>' + state.clientsCache.map(c => `
          <option value="${c.organization_id || c.id}">${c.company_name || c.full_name} (${c.email})</option>
        `).join('');
      }
    };

    document.getElementById('btnOpenRecordPaymentModal')?.addEventListener('click', openRecordPayment);
    document.getElementById('btnQuickRecordPayment')?.addEventListener('click', openRecordPayment);

    // Form Record Payment Submit
    document.getElementById('formRecordPayment')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const submitBtn = f.querySelector('button[type="submit"]');
      const orgId = f.organizationId.value;
      const amountDollars = parseFloat(f.amount.value) || 0;
      const currency = f.currency ? f.currency.value : 'USD';
      const paymentDate = f.paymentDate && f.paymentDate.value ? f.paymentDate.value : new Date().toISOString().split('T')[0];
      const paymentMethod = f.paymentMethod.value;
      const paymentReference = f.paymentReference.value;

      setBtnLoading(submitBtn, true, 'Recording payment to ledger...');

      const invRes = await apiFetch('/finance/invoices', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: orgId,
          issueDate: paymentDate,
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          currency,
          items: [{ description: 'Whiz Studio Subscribed Retainer Service', quantity: 1, unitPriceCents: Math.round(amountDollars * 100) }]
        })
      });

      const invoiceId = invRes.data?.data?.invoiceId;
      if (!invoiceId) {
        setBtnLoading(submitBtn, false);
        showToast(invRes.data?.error || 'Failed to create invoice reference for payment.', 'error');
        return;
      }

      const payRes = await apiFetch('/finance/payments', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId,
          amountCents: Math.round(amountDollars * 100),
          currency,
          paymentDate,
          paymentMethod,
          paymentReference
        })
      });

      setBtnLoading(submitBtn, false);

      if (payRes.ok && payRes.data && payRes.data.success) {
        showToast(`Payment of ${formatCurrency(amountDollars * 100, currency)} committed! Receipt ${payRes.data.data.receiptNumber} issued.`, 'success');
        f.reset();
        document.getElementById('modalRecordPayment')?.classList.add('hidden');
        loadFinanceData();
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

    // 8. Authorize Admin Pre-Approval Form (Phase 12)
    document.getElementById('adminInviteForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const submitBtn = f.querySelector('button[type="submit"]');
      const fullName = f.fullName.value.trim();
      const email = f.email.value.trim();

      if (!fullName || !email) return;

      setBtnLoading(submitBtn, true, 'Authorizing administrator...');

      const res = await apiFetch('/portal/admin/team/invite', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, role: 'admin' })
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
      const targetRole = document.getElementById('roleChangeTargetRole')?.value;
      const reason = document.getElementById('roleChangeReason')?.value || 'Role updated by Super Admin';

      if (!userId || !targetRole) return;

      setBtnLoading(submitBtn, true, 'Updating role...');

      const res = await apiFetch(`/portal/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: targetRole, reason })
      });

      setBtnLoading(submitBtn, false);

      if (res.ok && res.data && res.data.success) {
        showToast(res.data.message || 'User role successfully updated in D1.', 'success');
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

    // Template Studio State & Event Handlers
    let tplStudioMode = 'invoice';

    function updateTemplateStudioPreview() {
      const isInvoice = tplStudioMode === 'invoice';
      const docTypeEl = document.getElementById('previewDocType');
      const docNumLabel = document.getElementById('previewDocNumberLabel');
      
      if (docTypeEl) docTypeEl.textContent = isInvoice ? 'INVOICE' : 'RECEIPT';
      if (docNumLabel) docNumLabel.innerHTML = (isInvoice ? 'INVOICE NO: ' : 'RECEIPT NO: ') + `<span class="font-black text-slate-900 text-sm font-mono" id="previewDocNumber">${document.getElementById('tplDocNumber')?.value || '829926'}</span>`;

      const map = [
        ['tplDocDate', 'previewDocDate'],
        ['tplClientName', 'previewClientName'],
        ['tplClientAddress', 'previewClientAddress'],
        ['tplClientPhone', 'previewClientPhone'],
        ['tplPaymentType', 'previewPaymentType'],
        ['tplPaymentMethod', 'previewPaymentMethod'],
        ['tplAccountDetails', 'previewAccountDetails'],
        ['tplAgencyPhone', 'previewAgencyPhone'],
        ['tplItemDesc', 'previewItemDesc'],
        ['tplItemQty', 'previewItemQty']
      ];
      map.forEach(([inpId, prevId]) => {
        const val = document.getElementById(inpId)?.value;
        const prev = document.getElementById(prevId);
        if (prev && val !== undefined) prev.textContent = val;
      });

      const qty = parseFloat(document.getElementById('tplItemQty')?.value || '1');
      const rate = parseFloat(document.getElementById('tplItemRate')?.value || '0');
      const amount = Math.round(qty * rate);

      const itemRateEl = document.getElementById('previewItemRate');
      if (itemRateEl) itemRateEl.textContent = rate.toString();

      const itemAmountInput = document.getElementById('tplItemAmount');
      if (itemAmountInput) itemAmountInput.value = amount.toString();

      const itemRowAmount = document.getElementById('previewItemRowAmount');
      if (itemRowAmount) itemRowAmount.textContent = amount.toString();

      const totalAmount = document.getElementById('previewTotalAmount');
      if (totalAmount) totalAmount.textContent = amount.toString();
    }

    document.getElementById('btnTplModeInvoice')?.addEventListener('click', () => {
      tplStudioMode = 'invoice';
      const invBtn = document.getElementById('btnTplModeInvoice');
      const recBtn = document.getElementById('btnTplModeReceipt');
      if (invBtn) invBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-[#172B36] shadow-sm cursor-pointer';
      if (recBtn) recBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-500 hover:text-[#172B36] cursor-pointer';
      updateTemplateStudioPreview();
    });

    document.getElementById('btnTplModeReceipt')?.addEventListener('click', () => {
      tplStudioMode = 'receipt';
      const invBtn = document.getElementById('btnTplModeInvoice');
      const recBtn = document.getElementById('btnTplModeReceipt');
      if (recBtn) recBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-[#172B36] shadow-sm cursor-pointer';
      if (invBtn) invBtn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-500 hover:text-[#172B36] cursor-pointer';
      updateTemplateStudioPreview();
    });

    ['tplDocNumber', 'tplDocDate', 'tplClientName', 'tplClientAddress', 'tplClientPhone', 'tplPaymentType', 'tplPaymentMethod', 'tplAccountDetails', 'tplAgencyPhone', 'tplItemDesc', 'tplItemQty', 'tplItemRate'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', updateTemplateStudioPreview);
    });

    document.getElementById('btnDownloadTemplatePdf')?.addEventListener('click', () => {
      const isInvoice = tplStudioMode === 'invoice';
      const qty = parseFloat(document.getElementById('tplItemQty')?.value || '1');
      const rate = parseFloat(document.getElementById('tplItemRate')?.value || '0');
      const amount = Math.round(qty * rate);

      const docData = {
        type: isInvoice ? 'invoice' : 'receipt',
        docNumber: document.getElementById('tplDocNumber')?.value || '829926',
        docDate: document.getElementById('tplDocDate')?.value || '29 September, 2026',
        clientName: document.getElementById('tplClientName')?.value || 'Pholl Bihar',
        clientAddress: document.getElementById('tplClientAddress')?.value || 'Dhaka, Bangladesh',
        clientPhone: document.getElementById('tplClientPhone')?.value || '+880 1624644435',
        paymentType: document.getElementById('tplPaymentType')?.value || 'Facebook Ads',
        paymentMethod: document.getElementById('tplPaymentMethod')?.value || 'Bkash',
        accountDetails: document.getElementById('tplAccountDetails')?.value || 'Md Kazi Abdur Rahim Emon',
        agencyPhone: document.getElementById('tplAgencyPhone')?.value || '+880 1560066374',
        itemDesc: document.getElementById('tplItemDesc')?.value || 'Facebook Ads Expenses & Service Change',
        itemQty: qty.toString(),
        itemRate: rate.toString(),
        itemAmount: amount.toString(),
        totalAmount: amount.toString()
      };
      generateOfficialDocumentPdf(docData);
    });

    // Close Modals
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.modal;
        const m = document.getElementById(modalId);
        if (m) m.classList.add('hidden');
      });
    });

    // Test Generate Receipt PDF
    document.getElementById('btnTestGenerateReceipt')?.addEventListener('click', () => {
      document.getElementById('btnDownloadTemplatePdf')?.click();
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
  async function checkAuthAndInit() {
    const authGuard = document.getElementById('dashboardAuthGuard');
    const accessDenied = document.getElementById('dashboardAccessDenied');
    const mainLayout = document.getElementById('dashboardMainLayout');

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
        Boolean(profile.isSuperAdmin);

      if (!isAuthorized) {
        console.warn('Authenticated user does not possess admin permissions:', profile);
        if (authGuard) authGuard.classList.add('hidden');
        if (accessDenied) accessDenied.classList.remove('hidden');
        return;
      }

      // Populate user info in UI
      const name = profile.fullName || profile.full_name || user.fullName || 'Super Admin';
      const email = profile.email || (user.primaryEmailAddress ? user.primaryEmailAddress.emailAddress : '');
      const username = user.username ? `@${user.username}` : (user.id.slice(0, 12) + '...');
      const initials = (name || 'SA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

      document.querySelectorAll('.admin-display-name').forEach(el => el.textContent = name);
      document.querySelectorAll('.admin-display-username').forEach(el => el.textContent = username);
      document.querySelectorAll('.admin-display-initials').forEach(el => el.textContent = initials);

      const emailEl = document.getElementById('secUserEmail');
      if (emailEl) emailEl.textContent = email;
      const userEl = document.getElementById('secClerkUserId');
      if (userEl) userEl.textContent = user.id;

      // Show Main Layout
      if (authGuard) authGuard.classList.add('hidden');
      if (accessDenied) accessDenied.classList.add('hidden');
      if (mainLayout) mainLayout.classList.remove('hidden');

      // Initialize initial tab or deep-linked view
      const hash = (window.location.hash || '').replace('#', '');
      if (hash.startsWith('client-')) {
        const cId = hash.replace('client-', '');
        openClientDetails(cId);
      } else if (hash.startsWith('service-tasks-')) {
        const sId = hash.replace('service-tasks-', '');
        openServiceTasksWorkspace(sId);
      } else {
        const validTabs = ['overview', 'clients', 'services', 'projects', 'tasks', 'finance', 'receipt_template', 'team', 'support', 'history', 'settings'];
        const initialTab = validTabs.includes(hash) ? hash : 'overview';
        switchTab(initialTab);
      }

      // Preload catalog
      loadServicesData();
    } catch (err) {
      console.error('Console Auth Error:', err);
      if (authGuard) authGuard.classList.add('hidden');
      if (accessDenied) accessDenied.classList.remove('hidden');
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
          }
          loadClientsData();
        } else if (targetTab === 'projects') {
          loadProjectsData();
        } else if (targetTab === 'services') {
          loadServicesData();
        } else if (targetTab === 'tasks') {
          const targetStatus = targetFilter === 'pending' ? 'in_progress' : (targetFilter || 'all');
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
          loadTasksData(targetStatus);
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
    document.getElementById('btnRefreshAuditHistory')?.addEventListener('click', async () => {
      await loadHistoryData();
      showToast('Audit feed updated.', 'success');
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
      setTimeout(() => {
        if (icon) icon.classList.remove('fa-spin');
        showToast('Console synchronized successfully.', 'success');
      }, 500);
    });

    // Sign out buttons
    document.querySelectorAll('.btn-admin-signout').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (window.Clerk) {
          await window.Clerk.signOut();
        }
        window.location.href = '/';
      });
    });

    // Password change form
    const changePasswordForm = document.getElementById('adminChangePasswordForm');
    if (changePasswordForm) {
      changePasswordForm.addEventListener('submit', handleAdminPasswordChange);
    }

    initPasswordToggles();
    initModals();

    // Start Auth check
    checkAuthAndInit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
