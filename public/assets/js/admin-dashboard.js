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
      'support', 'history', 'settings'
    ];

    allViews.forEach(v => {
      const el = document.getElementById(`view_${v}`);
      if (el) {
        if (v === tabId) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });

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

    const statusFilter = document.getElementById('adminClientStatusFilter')?.value || 'active';
    const searchQuery = (document.getElementById('adminClientSearchInput')?.value || '').trim();

    const res = await apiFetch(`/clients?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`);

    if (res.ok && res.data && res.data.data) {
      state.clientsCache = res.data.data;
      renderClientsTable(state.clientsCache);
    } else {
      tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-6 text-center text-rose-400">Failed to load clients directory from D1.</td></tr>';
    }
  }

  function renderClientsTable(clients) {
    const tbody = document.getElementById('adminClientsTableBody');
    if (!tbody) return;

    if (!clients || clients.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-6 text-center text-slate-500 italic">No clients found matching the selected filter. Click "Add New Client" above.</td></tr>';
      return;
    }

    tbody.innerHTML = clients.map(c => {
      const isArchived = c.status === 'archived';
      const isSuspended = c.status === 'suspended';

      let statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>';
      if (isArchived) {
        statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200">Archived</span>';
      } else if (isSuspended) {
        statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">Suspended</span>';
      }

      return `
        <tr class="hover:bg-slate-50 transition-colors border-b border-[#E3E9EF]">
          <td class="px-6 py-4">
            <div class="font-bold text-[#172B36] text-sm">${c.full_name || 'Client'}</div>
            <div class="text-xs text-brand-whiz font-medium">${c.company_name || 'Independent Business'}</div>
            <div class="text-[10px] text-slate-500 font-mono mt-0.5">${c.id}</div>
          </td>
          <td class="px-6 py-4 font-mono text-[#5F7180]">
            <div>${c.email}</div>
            <div class="text-[11px] text-slate-500">${c.phone || 'No phone'}</div>
          </td>
          <td class="px-6 py-4 text-[#5F7180] text-xs">
            ${c.city || 'Dhaka'}, ${c.country || 'Bangladesh'}
          </td>
          <td class="px-6 py-4">
            ${statusBadge}
          </td>
          <td class="px-6 py-4 text-right">
            <button type="button" class="btn-manage-client px-3.5 py-1.5 rounded-xl text-xs font-bold btn-glass-primary shadow-xs hover:shadow-md cursor-pointer transition-all" data-id="${c.id}">
              <i class="fa-solid fa-sliders mr-1 text-[11px]"></i> Manage
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Wire Manage buttons
    tbody.querySelectorAll('.btn-manage-client').forEach(btn => {
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
    if (titleEl) titleEl.textContent = client.company_name || client.full_name;
    if (subEl) subEl.textContent = `${client.full_name} (${client.email})`;

    const statusBadge = document.getElementById('clientDetailStatusBadge');
    if (statusBadge) {
      if (client.status === 'suspended') {
        statusBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200';
        statusBadge.textContent = 'Suspended';
      } else {
        statusBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200';
        statusBadge.textContent = client.status || 'Active';
      }
    }
    // Profile Card
    const initials = (client.full_name || 'CL').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const avInit = document.getElementById('clientAvatarInitials');
    if (avInit) avInit.textContent = initials;
    const cfn = document.getElementById('clientCardFullName');
    if (cfn) cfn.textContent = client.full_name || 'Valued Client';
    const ccn = document.getElementById('clientCardCompanyName');
    if (ccn) ccn.textContent = client.company_name || 'No Company Name';
    const cEm = document.getElementById('clientCardEmail');
    if (cEm) cEm.textContent = client.email;
    const cPh = document.getElementById('clientCardPhone');
    if (cPh) cPh.textContent = client.phone || 'None provided';
    const cLoc = document.getElementById('clientCardLocation');
    if (cLoc) cLoc.textContent = `${client.address ? client.address + ', ' : ''}${client.city || 'Dhaka'}, ${client.country || 'Bangladesh'}`;
    const cClk = document.getElementById('clientCardClerkId');
    if (cClk) cClk.textContent = client.clerk_user_id || 'Pending Clerk linking';
    const cOrg = document.getElementById('clientCardOrgId');
    if (cOrg) cOrg.textContent = client.organization_id || 'None';

    // Financial calculations
    const totalBilledCents = (invoices || []).reduce((sum, inv) => sum + (inv.total_cents || 0), 0);
    const totalPaidCents = (payments || []).reduce((sum, p) => sum + (p.amount_cents || 0), 0);
    const tbEl = document.getElementById('clientCardTotalBilled');
    if (tbEl) tbEl.textContent = `$${(totalBilledCents / 100).toFixed(2)}`;
    const tpEl = document.getElementById('clientCardTotalPaid');
    if (tpEl) tpEl.textContent = `$${(totalPaidCents / 100).toFixed(2)}`;

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
                <div class="text-xs font-bold text-[#172B36] truncate">${s.service_name}</div>
                <div class="text-[11px] text-[#5F7180] flex items-center gap-2">
                  <span>${s.package_name || 'Standard Retainer'}</span>
                  <span>•</span>
                  <span>Started: ${s.start_date || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-3 shrink-0">
              <span class="text-xs font-mono font-bold text-brand-whiz">${formatCurrency(p.amount_cents || 0, p.currency || "USD")}((s.price_cents || 0) / 100).toFixed(0)}</span>
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
    if (!tbody) return;

    if (res.ok && res.data && res.data.data) {
      state.projectsCache = res.data.data;
      const projects = state.projectsCache;

      const actCount = document.getElementById('statActiveProjects');
      if (actCount) actCount.textContent = projects.length;

      if (projects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-6 text-center text-slate-500 italic">No active projects. Add a client with services to auto-provision projects.</td></tr>';
        return;
      }

      tbody.innerHTML = projects.map(p => {
        const percent = p.progress_percent || 0;
        return `
          <tr class="hover:bg-slate-50 transition-colors border-b border-[#E3E9EF]">
            <td class="px-6 py-4 font-bold text-[#172B36]">${p.name}</td>
            <td class="px-6 py-4 text-slate-400">${p.organization_name || 'Organization'}</td>
            <td class="px-6 py-4 font-mono text-xs text-brand-whiz">${p.service_name || 'Service'}</td>
            <td class="px-6 py-4">
              <div class="flex items-center space-x-2">
                <div class="w-24 bg-slate-100 h-2 border border-[#E3E9EF] rounded-full overflow-hidden">
                  <div class="bg-brand-whiz h-full rounded-full transition-all duration-500" style="width: ${percent}%"></div>
                </div>
                <span class="text-xs font-mono font-bold text-[#172B36]">${percent}%</span>
              </div>
            </td>
            <td class="px-6 py-4">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/30">${p.status}</span>
            </td>
            <td class="px-6 py-4 text-right font-mono text-slate-400">
              ${p.completed_tasks || 0} / ${p.total_tasks || 20}
            </td>
          </tr>
        `;
      }).join('');
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
          <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between gap-4">
            <div class="flex items-center space-x-3.5 min-w-0">
              <input type="checkbox" class="task-checkbox w-4 h-4 rounded text-brand-whiz bg-slate-950 border-slate-700 cursor-pointer" data-id="${t.id}" ${isCompleted ? 'checked' : ''}>
              <div class="min-w-0">
                <div class="text-xs font-bold text-white truncate ${isCompleted ? 'line-through text-slate-500' : ''}">${t.title}</div>
                <div class="text-[11px] text-slate-400">${t.project_name} (${t.organization_name})</div>
              </div>
            </div>
            <div class="flex items-center space-x-3 shrink-0">
              <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isCompleted ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-slate-950 text-slate-400 border border-slate-800'}">${t.status}</span>
              <span class="text-xs font-mono font-bold text-brand-whiz">${t.progress_percent}% Proj</span>
              <button type="button" class="btn-live-task-detail px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-all" data-id="${t.id}">
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
  async function loadFinanceData() {
    const res = await apiFetch('/finance/payments');
    const tbody = document.getElementById('adminPaymentsTableBody');
    if (!tbody) return;

    if (res.ok && res.data && res.data.data) {
      const payments = res.data.data;
      if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-6 text-center text-slate-500 italic">No payments recorded. Click "Record New Payment" above.</td></tr>';
        return;
      }

      tbody.innerHTML = payments.map(p => `
        <tr class="hover:bg-slate-50 transition-colors border-b border-[#E3E9EF]">
          <td class="px-6 py-4 font-mono font-bold text-brand-whiz">${p.receipt_number}</td>
          <td class="px-6 py-4">
            <div class="font-bold text-[#172B36]">${p.organization_name || 'Client'}</div>
            <div class="text-[11px] text-slate-500 font-mono">${p.invoice_number || 'INV-DIRECT'}</div>
          </td>
          <td class="px-6 py-4 font-mono font-bold text-brand-whiz">${formatCurrency(p.amount_cents || 0, p.currency || "USD")}((p.amount_cents || 0) / 100).toFixed(2)}</td>
          <td class="px-6 py-4 uppercase text-slate-400 text-xs">${p.payment_method || 'CARD'}</td>
          <td class="px-6 py-4 text-slate-400 text-xs">${p.payment_date || 'N/A'}</td>
          <td class="px-6 py-4 text-right">
            <button type="button" class="btn-download-receipt-admin px-3 py-1 rounded-lg text-xs font-bold btn-glass-primary shadow-xs cursor-pointer" data-receipt="${p.receipt_number}">
              Download PDF
            </button>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('.btn-download-receipt-admin').forEach(b => {
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
    }
  }

  // =========================================================================
  // 7. USER & ACCESS MANAGEMENT (D1 DIRECTORY + ROLE GOVERNANCE)
  // =========================================================================
  async function loadTeamData() {
    const tbody = document.getElementById('userDirectoryTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-6 text-center text-slate-500 italic">Fetching authoritative users directory from Cloudflare D1...</td></tr>';
    }

    try {
      const [usersRes, historyRes] = await Promise.all([
        apiFetch('/portal/admin/users'),
        apiFetch('/portal/admin/role-history')
      ]);

      if (usersRes.ok && usersRes.data && usersRes.data.data) {
        state.usersCache = usersRes.data.data.users || [];
        renderUserDirectory();
      } else {
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-6 text-center text-rose-400">Failed to load users directory.</td></tr>';
      }

      if (historyRes.ok && historyRes.data) {
        state.roleHistoryCache = historyRes.data.data || [];
        renderRoleHistory();
      }
    } catch (err) {
      console.error('User Directory Fetch Error:', err);
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-6 text-center text-rose-400">Network error fetching users directory.</td></tr>';
    }
  }

  function renderUserDirectory() {
    const tbody = document.getElementById('userDirectoryTableBody');
    const countEl = document.getElementById('userDirectoryCount');
    if (!tbody) return;

    const query = (document.getElementById('userDirectorySearch')?.value || '').toLowerCase().trim();
    const roleFilter = document.getElementById('userDirectoryRoleFilter')?.value || 'all';

    let filtered = state.usersCache.filter(u => {
      const matchesQuery = !query || 
        (u.full_name && u.full_name.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.username && u.username.toLowerCase().includes(query));

      const matchesRole = roleFilter === 'all' || 
        (roleFilter === 'client' && u.role === 'client') ||
        (roleFilter === 'admin' && u.role === 'admin') ||
        (roleFilter === 'owner' && (u.role === 'owner' || u.role === 'super_admin'));

      return matchesQuery && matchesRole;
    });

    if (countEl) countEl.textContent = `${filtered.length} account${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500 italic">No users match the search filter.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(u => {
      const isOwner = u.email && u.email.toLowerCase() === 'kaziaremon@gmail.com';
      const initials = (u.full_name || u.email || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

      let roleBadge = '';
      if (isOwner || u.role === 'owner' || u.role === 'super_admin') {
        roleBadge = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"><i class="fa-solid fa-crown text-[9px]"></i> Owner</span>';
      } else if (u.role === 'admin') {
        roleBadge = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30"><i class="fa-solid fa-shield-halved text-[9px]"></i> Admin</span>';
      } else {
        roleBadge = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-800 text-slate-300 border border-slate-700"><i class="fa-solid fa-user text-[9px]"></i> Client</span>';
      }

      const statusBadge = u.status === 'active' 
        ? '<span class="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-500/20">active</span>'
        : '<span class="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase text-amber-400 bg-amber-950/60 border border-amber-500/20">suspended</span>';

      let actionsHtml = '';
      if (isOwner) {
        actionsHtml = '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30"><i class="fa-solid fa-lock text-[10px]"></i> Locked (Founding Owner)</span>';
      } else if (u.role === 'admin') {
        actionsHtml = `<button type="button" class="btn-role-action px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 transition-all cursor-pointer" data-id="${u.id}" data-role="client" data-email="${u.email}" data-name="${u.full_name || u.email}"><i class="fa-solid fa-arrow-down mr-1 text-[10px]"></i>Demote to Client</button>`;
      } else {
        actionsHtml = `<button type="button" class="btn-role-action px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-all cursor-pointer" data-id="${u.id}" data-role="admin" data-email="${u.email}" data-name="${u.full_name || u.email}"><i class="fa-solid fa-arrow-up mr-1 text-[10px]"></i>Promote to Admin</button>`;
      }

      return `
        <tr class="hover:bg-slate-50 transition-colors border-b border-[#E3E9EF]">
          <td class="px-6 py-4">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white uppercase shrink-0">
                ${initials}
              </div>
              <div class="min-w-0">
                <div class="font-bold text-white truncate">${u.full_name || 'Registered User'}</div>
                <div class="text-xs text-slate-400 font-mono truncate">${u.email}</div>
                ${u.clerk_user_id ? `<div class="text-[10px] text-slate-500 font-mono truncate mt-0.5">${u.clerk_user_id}</div>` : ''}
              </div>
            </div>
          </td>
          <td class="px-6 py-4">${roleBadge}</td>
          <td class="px-6 py-4">${statusBadge}</td>
          <td class="px-6 py-4 text-slate-300 text-xs">${u.company_name || '<span class="text-slate-600 italic">None</span>'}</td>
          <td class="px-6 py-4 text-slate-400 text-xs font-mono">${u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</td>
          <td class="px-6 py-4 text-right">${actionsHtml}</td>
        </tr>
      `;
    }).join('');

    // Bind action buttons
    tbody.querySelectorAll('.btn-role-action').forEach(btn => {
      btn.addEventListener('click', () => {
        openRoleChangeModal(btn.dataset.id, btn.dataset.role, btn.dataset.email, btn.dataset.name);
      });
    });
  }

  function renderRoleHistory() {
    const tbody = document.getElementById('roleHistoryTableBody');
    if (!tbody) return;

    if (state.roleHistoryCache.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-6 text-center text-slate-500 italic">No role changes recorded in audit log.</td></tr>';
      return;
    }

    tbody.innerHTML = state.roleHistoryCache.map(h => {
      const prevRoleBadge = `<span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-900 text-slate-400 border border-slate-800">${h.previous_role}</span>`;
      const newRoleBadge = h.new_role === 'admin'
        ? '<span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-950 text-blue-400 border border-blue-500/30">admin</span>'
        : '<span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-900 text-slate-300 border border-slate-700">client</span>';

      return `
        <tr class="hover:bg-slate-50 transition-colors border-b border-[#E3E9EF]">
          <td class="px-6 py-3.5 text-xs text-slate-400 font-mono">${h.action_timestamp || 'N/A'}</td>
          <td class="px-6 py-3.5">
            <div class="font-bold text-white text-xs">${h.target_name || 'User'}</div>
            <div class="text-[11px] text-slate-400 font-mono">${h.target_email || h.target_clerk_user_id}</div>
          </td>
          <td class="px-6 py-3.5 text-xs flex items-center gap-1.5 mt-2">
            ${prevRoleBadge} <i class="fa-solid fa-arrow-right text-[10px] text-slate-500"></i> ${newRoleBadge}
          </td>
          <td class="px-6 py-3.5 text-xs text-slate-400 font-mono truncate max-w-[120px]">${h.actor_clerk_user_id}</td>
          <td class="px-6 py-3.5 text-xs text-slate-300 italic">${h.reason || 'None provided'}</td>
          <td class="px-6 py-3.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-500/20">${h.action_result}</span>
          </td>
        </tr>
      `;
    }).join('');
  }

  function openRoleChangeModal(userId, targetRole, email, name) {
    const modal = document.getElementById('modalRoleChange');
    const title = document.getElementById('modalRoleChangeTitle');
    const desc = document.getElementById('modalRoleChangeDesc');
    const inputId = document.getElementById('roleChangeUserId');
    const inputRole = document.getElementById('roleChangeTargetRole');
    const inputReason = document.getElementById('roleChangeReason');

    if (!modal) return;

    if (inputId) inputId.value = userId;
    if (inputRole) inputRole.value = targetRole;
    if (inputReason) inputReason.value = '';

    if (targetRole === 'admin') {
      if (title) title.innerHTML = '<i class="fa-solid fa-user-shield text-blue-400"></i><span>Promote Account to Admin</span>';
      if (desc) desc.textContent = `You are about to promote ${name} (${email}) to an Administrator. They will have access to the Super Admin Console.`;
    } else {
      if (title) title.innerHTML = '<i class="fa-solid fa-user text-amber-400"></i><span>Demote Account to Client</span>';
      if (desc) desc.textContent = `You are about to demote ${name} (${email}) to a Client. Their administrative privileges will be revoked immediately.`;
    }

    modal.classList.remove('hidden');
  }

  // =========================================================================
  // 8. SUPPORT DESK
  // =========================================================================
  async function loadSupportData() {
    const res = await apiFetch('/portal/admin/support');
    const tbody = document.getElementById('adminSupportTableBody');
    if (!tbody) return;

    if (res.ok && res.data && res.data.data) {
      const tickets = res.data.data;
      if (tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-6 text-center text-slate-500 italic">No support tickets found.</td></tr>';
        return;
      }
      tbody.innerHTML = tickets.map(t => `
        <tr class="hover:bg-slate-50 transition-colors border-b border-[#E3E9EF]">
          <td class="px-6 py-4">
            <div class="font-bold text-white">${t.full_name || 'Client'}</div>
            <div class="text-xs text-slate-400">${t.email}</div>
          </td>
          <td class="px-6 py-4 font-bold text-slate-200">${t.subject}</td>
          <td class="px-6 py-4 text-slate-400 text-xs line-clamp-2">${t.message}</td>
          <td class="px-6 py-4">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.status === 'resolved' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}">${t.status}</span>
          </td>
          <td class="px-6 py-4 text-right">
            <button type="button" class="btn-resolve-ticket px-3 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer" data-id="${t.id}" data-status="${t.status}">
              ${t.status === 'resolved' ? 'Reopen' : 'Resolve'}
            </button>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('.btn-resolve-ticket').forEach(b => {
        b.addEventListener('click', async () => {
          const tid = b.dataset.id;
          const newStatus = b.dataset.status === 'resolved' ? 'open' : 'resolved';
          await apiFetch(`/portal/admin/support/${tid}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
          });
          showToast(`Ticket status updated to ${newStatus}.`, 'success');
          loadSupportData();
        });
      });
    }
  }

  // =========================================================================
  // 9. AUDIT & HISTORY DATA
  // =========================================================================
  async function loadHistoryData() {
    const res = await apiFetch('/portal/admin/stats');
    const container = document.getElementById('adminFullHistoryList');
    if (!container) return;

    if (res.ok && res.data && res.data.data && res.data.data.recentActivity) {
      const logs = res.data.data.recentActivity;
      container.innerHTML = logs.map(l => `
        <div class="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
          <div class="flex items-center space-x-3">
            <i class="fa-solid fa-clock-rotate-left text-brand-whiz"></i>
            <div>
              <span class="font-bold text-white uppercase">${l.action}</span>
              <span class="text-slate-400 ml-2">${l.resource_type}</span>
            </div>
          </div>
          <span class="text-slate-500 font-mono text-[11px]">${new Date(l.created_at).toLocaleString()}</span>
        </div>
      `).join('');
    }
  }

  // =========================================================================
  // PURE BROWSER PDF GENERATION (pdf-lib, Zero Server Storage)
  // =========================================================================
  async function generateReceiptPdfInBrowser(data) {
    try {
      showToast('Compiling high-resolution vector PDF in browser...', 'info');

      const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size in points
      const { width, height } = page.getSize();

      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

      // Colors
      const brandDark = rgb(0.02, 0.04, 0.06);
      const brandGreen = rgb(0.0, 0.66, 0.42);
      const textMuted = rgb(0.4, 0.45, 0.52);
      const textDark = rgb(0.1, 0.12, 0.15);

      // Header Banner
      page.drawRectangle({
        x: 0,
        y: height - 120,
        width: width,
        height: 120,
        color: brandDark
      });

      page.drawText('WHIZ STUDIO', {
        x: 50,
        y: height - 60,
        size: 24,
        font: fontBold,
        color: rgb(1, 1, 1)
      });

      page.drawText('OFFICIAL SERVICE PAYMENT RECEIPT', {
        x: 50,
        y: height - 85,
        size: 10,
        font: fontBold,
        color: brandGreen
      });

      page.drawText(data.receiptNumber || 'REC-XXXXXX', {
        x: width - 200,
        y: height - 60,
        size: 14,
        font: fontMono,
        color: rgb(1, 1, 1)
      });

      page.drawText(`Date: ${data.paymentDate || new Date().toISOString().split('T')[0]}`, {
        x: width - 200,
        y: height - 80,
        size: 9,
        font: fontRegular,
        color: textMuted
      });

      // Client Details Section
      let currentY = height - 160;

      page.drawText('BILLED TO / CLIENT:', {
        x: 50,
        y: currentY,
        size: 9,
        font: fontBold,
        color: textMuted
      });

      currentY -= 20;
      page.drawText(data.client?.organizationName || data.client?.companyName || 'Valued Client', {
        x: 50,
        y: currentY,
        size: 13,
        font: fontBold,
        color: textDark
      });

      currentY -= 16;
      page.drawText(`Attn: ${data.client?.contactName || data.client?.fullName || 'Client Representative'} (${data.client?.email || ''})`, {
        x: 50,
        y: currentY,
        size: 10,
        font: fontRegular,
        color: textMuted
      });

      // Table Header
      currentY -= 40;
      page.drawRectangle({
        x: 50,
        y: currentY,
        width: width - 100,
        height: 25,
        color: rgb(0.95, 0.96, 0.97)
      });

      page.drawText('DESCRIPTION / SERVICE ENGAGEMENT', {
        x: 60,
        y: currentY + 8,
        size: 9,
        font: fontBold,
        color: textMuted
      });

      page.drawText('AMOUNT PAID', {
        x: width - 150,
        y: currentY + 8,
        size: 9,
        font: fontBold,
        color: textMuted
      });

      // Service Row
      currentY -= 35;
      page.drawText(data.serviceName || 'Retainer Marketing & Growth Engineering', {
        x: 60,
        y: currentY,
        size: 11,
        font: fontBold,
        color: textDark
      });

      const amountFormatted = `$${((data.amountPaidCents || 0) / 100).toFixed(2)} ${data.currency || 'USD'}`;
      page.drawText(amountFormatted, {
        x: width - 150,
        y: currentY,
        size: 11,
        font: fontBold,
        color: brandGreen
      });

      // Total Paid Callout Box
      currentY -= 60;
      page.drawRectangle({
        x: width - 260,
        y: currentY,
        width: 210,
        height: 45,
        color: rgb(0.96, 0.99, 0.97),
        borderColor: brandGreen,
        borderWidth: 1
      });

      page.drawText('TOTAL VERIFIED PAID:', {
        x: width - 245,
        y: currentY + 28,
        size: 9,
        font: fontBold,
        color: brandGreen
      });

      page.drawText(amountFormatted, {
        x: width - 245,
        y: currentY + 10,
        size: 14,
        font: fontBold,
        color: brandGreen
      });

      // Footer Notes
      currentY -= 80;
      page.drawText('PAYMENT VERIFICATION & IMMUTABLE RECORD:', {
        x: 50,
        y: currentY,
        size: 9,
        font: fontBold,
        color: textMuted
      });

      currentY -= 15;
      page.drawText(`Payment Method: ${(data.paymentMethod || 'BANK_TRANSFER').toUpperCase()} | Status: CONFIRMED & COMMITTED TO CLOUDFLARE D1`, {
        x: 50,
        y: currentY,
        size: 8,
        font: fontRegular,
        color: textMuted
      });

      currentY -= 15;
      page.drawText('Authorized signature: Whiz Studio Financial Governance • Zero Server Storage Policy', {
        x: 50,
        y: currentY,
        size: 8,
        font: fontRegular,
        color: textMuted
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.receiptNumber || 'Receipt'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Vector Receipt ${data.receiptNumber} downloaded!`, 'success');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      showToast('Error compiling vector PDF receipt.', 'error');
    }
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
        showToast('Client profile updated successfully in Cloudflare D1!', 'success');
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

    // Archive Client Modal & Action
    document.getElementById('btnArchiveClientAction')?.addEventListener('click', () => {
      const clientId = state.selectedClientId;
      if (!clientId) return;

      const titleEl = document.getElementById('clientDetailTitle');
      const targetNameEl = document.getElementById('archiveClientTargetName');
      if (targetNameEl && titleEl) targetNameEl.textContent = titleEl.textContent;

      document.getElementById('modalArchiveClient')?.classList.remove('hidden');
    });

    document.getElementById('btnConfirmArchiveClient')?.addEventListener('click', async () => {
      const clientId = state.selectedClientId;
      if (!clientId) return;

      const btn = document.getElementById('btnConfirmArchiveClient');
      setBtnLoading(btn, true, 'Archiving client...');

      const res = await apiFetch(`/clients/${clientId}/archive`, { method: 'POST' });
      setBtnLoading(btn, false);

      if (res.ok && res.data && res.data.success) {
        showToast(res.data.message || 'Client archived successfully.', 'success');
        document.getElementById('modalArchiveClient')?.classList.add('hidden');
        openClientDetails(clientId);
        loadClientsData();
      } else {
        showToast(res.data?.error || 'Failed to archive client.', 'error');
      }
    });

    // Restore Client Action
    document.getElementById('btnRestoreClientAction')?.addEventListener('click', async () => {
      const clientId = state.selectedClientId;
      if (!clientId) return;

      const res = await apiFetch(`/clients/${clientId}/restore`, { method: 'POST' });
      if (res.ok && res.data && res.data.success) {
        showToast(res.data.message || 'Client restored to active directory.', 'success');
        openClientDetails(clientId);
        loadClientsData();
      } else {
        showToast(res.data?.error || 'Failed to restore client.', 'error');
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

      setBtnLoading(submitBtn, true, 'Saving to Cloudflare D1...');

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
      const paymentMethod = f.paymentMethod.value;
      const paymentReference = f.paymentReference.value;

      setBtnLoading(submitBtn, true, 'Recording payment to ledger...');

      const invRes = await apiFetch('/finance/invoices', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: orgId,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          items: [{ description: 'Whiz Studio Retainer Service', quantity: 1, unitPriceCents: Math.round(amountDollars * 100) }]
        })
      });

      const invoiceId = invRes.data?.data?.invoiceId;
      if (!invoiceId) {
        setBtnLoading(submitBtn, false);
        showToast('Failed to create invoice reference for payment.', 'error');
        return;
      }

      const payRes = await apiFetch('/finance/payments', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId,
          amountCents: Math.round(amountDollars * 100),
          currency: 'USD',
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod,
          paymentReference
        })
      });

      setBtnLoading(submitBtn, false);

      if (payRes.ok && payRes.data && payRes.data.success) {
        showToast(`Payment of $${amountDollars.toFixed(2)} committed! Receipt ${payRes.data.data.receiptNumber} issued.`, 'success');
        f.reset();
        document.getElementById('modalRecordPayment')?.classList.add('hidden');
        loadFinanceData();
      } else {
        showToast(payRes.data?.error || 'Failed to record payment.', 'error');
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
    document.getElementById('btnRefreshUserDir')?.addEventListener('click', () => {
      loadTeamData();
      showToast('Refreshing directory...', 'info');
    });

    // Search and Filter Listeners
    document.getElementById('userDirectorySearch')?.addEventListener('input', () => renderUserDirectory());
    document.getElementById('userDirectoryRoleFilter')?.addEventListener('change', () => renderUserDirectory());

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
      const sampleData = {
        receiptNumber: 'REC-202610-DEMO',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'BANK_TRANSFER',
        currency: 'USD',
        amountPaidCents: 150000,
        serviceName: 'Facebook Ads Management (Growth Retainer)',
        client: {
          organizationName: 'Acme Growth Labs',
          contactName: 'Jane Doe',
          email: 'jane@acme.com'
        }
      };
      generateReceiptPdfInBrowser(sampleData);
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

    // Mobile Drawer Toggle
    const toggleBtn = document.getElementById('mobileMenuToggleBtn');
    const closeBtn = document.getElementById('mobileDrawerCloseBtn');
    const drawer = document.getElementById('mobileDrawer');
    const backdrop = document.getElementById('mobileDrawerBackdrop');

    if (toggleBtn && drawer && backdrop) {
      toggleBtn.addEventListener('click', () => {
        drawer.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
      });
    }

    if (closeBtn && drawer && backdrop) {
      closeBtn.addEventListener('click', () => {
        drawer.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
      });
    }

    if (backdrop && drawer) {
      backdrop.addEventListener('click', () => {
        drawer.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
      });
    }

    if (drawer && backdrop) {
      drawer.querySelectorAll('[data-dash-tab]').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
          drawer.classList.add('-translate-x-full');
          backdrop.classList.add('hidden');
        });
      });
    }

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
