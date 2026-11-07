/**
 * WHIZ STUDIO — FULL-PAGE CLIENT DASHBOARD CONTROLLER (v2 Enterprise)
 * Technology: Clerk JS SDK, Cloudflare D1 Backend API, Tailwind CSS, pdf-lib
 * Route: /client/dashboard | Free-Tier Architecture ($0 Cost)
 */

(function () {
  'use strict';

  const CLERK_PUBLISHABLE_KEY = window.__CLERK_PUBLISHABLE_KEY__ || 'pk_live_Y2xlcmsud2hpenN0dWRpby5hcnQk';
  const API_BASE = 'https://whiz-api.kaziaremon.workers.dev/api/v1';

  
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

  let clientChart = null;

  const state = {
    currentUser: null,
    clientProfile: null,
    activeTab: 'overview',
    services: [],
    projects: [],
    invoices: [],
    payments: [],
    finance: null,
    cif: null,
    receiptQuota: { used: 0, max: 2, remaining: 2, isLimitReached: false },
    overallProgress: 0,
    organizations: [],
    selectedOrganizationId: null,
    completionChart: null,
    refreshIntervalId: null,
    isRefreshing: false
  };

  async function apiFetch(endpoint, options = {}) {
    if (state.isPreview && window.__whizClientMock) {
      return window.__whizClientMock.handleRequest(endpoint, options);
    }
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (state.selectedOrganizationId) {
      headers['X-Organization-Id'] = state.selectedOrganizationId;
    }

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

  function showToast(message, type = 'info') {
    const existing = document.getElementById('clientGlobalToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'clientGlobalToast';
    const bgClass = type === 'error' ? 'bg-white border-rose-400 text-[#172B36]' :
                    type === 'success' ? 'bg-white border-emerald-400 text-[#172B36]' :
                    'bg-white border-[#E3E9EF] text-[#172B36]';
    const icon = type === 'error' ? 'fa-triangle-exclamation text-rose-500' :
                 type === 'success' ? 'fa-circle-check text-emerald-500' :
                 'fa-circle-info text-brand-whiz';

    toast.className = `fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl text-xs font-medium transition-all transform translate-y-2 opacity-0 ${bgClass}`;
    toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function switchTab(tabId) {
    state.activeTab = tabId;
    const tabs = ['overview', 'services', 'tasks', 'finance', 'profile', 'support', 'settings'];
    tabs.forEach(t => {
      const el = document.getElementById(`view_${t}`);
      if (el) {
        if (t === tabId) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });

    // Update Desktop, Drawer, and Floating Bottom Navigation tabs (Task 3 & 4)
    document.querySelectorAll('[data-client-tab]').forEach(btn => {
      const isTarget = btn.dataset.clientTab === tabId;
      if (btn.closest('nav.lg\\:hidden')) {
        // Floating Glass Bottom Bar styling (Task 3)
        if (isTarget) {
          btn.classList.add('bg-[#EAF5F1]', 'text-[#087F70]', 'font-bold', 'border-[#087F70]/25', 'shadow-2xs');
          btn.classList.remove('text-[#74817D]', 'border-transparent', 'font-semibold');
        } else {
          btn.classList.remove('bg-[#EAF5F1]', 'text-[#087F70]', 'font-bold', 'border-[#087F70]/25', 'shadow-2xs');
          btn.classList.add('text-[#74817D]', 'border-transparent', 'font-semibold');
        }
      } else {
        // Desktop Sidebar and Mobile Drawer buttons (Task 4: Admin Sidebar parity)
        const icon = btn.querySelector('i');
        if (isTarget) {
          btn.classList.add('bg-[#EAF5F1]', 'text-[#087F70]', 'font-bold', 'border-[#087F70]/20', 'shadow-2xs');
          btn.classList.remove('text-[#74817D]', 'border-transparent', 'font-medium', 'font-semibold');
          if (icon) {
            icon.classList.add('text-[#087F70]');
            icon.classList.remove('text-[#74817D]');
          }
        } else {
          btn.classList.remove('bg-[#EAF5F1]', 'text-[#087F70]', 'font-bold', 'border-[#087F70]/20', 'shadow-2xs');
          btn.classList.add('text-[#74817D]', 'border-transparent', 'font-semibold');
          if (icon) {
            icon.classList.remove('text-[#087F70]');
            icon.classList.add('text-[#74817D]');
          }
        }
      }
    });

    const labels = {
      overview: 'Campaign Overview',
      services: 'My Active Services',
      tasks: 'Deliverables Progress',
      finance: 'Invoices',
      profile: 'My Profile',
      support: 'Support & Inquiries',
      settings: 'Account Security'
    };

    const breadcrumb = document.getElementById('breadcrumbActiveTab');
    if (breadcrumb) {
      breadcrumb.textContent = labels[tabId] || tabId;
    }

    const subheaderTitle = document.getElementById('clientSubheaderTitle');
    if (subheaderTitle) {
      subheaderTitle.textContent = labels[tabId] || tabId;
    }

    // Scroll to top of content
    const container = document.querySelector('main > div.overflow-y-auto');
    if (container) container.scrollTop = 0;
    if (tabId === 'profile') {
      populateProfileForm(state.cif || state.clientProfile);
    }
    if (tabId === 'support') loadClientSupportTickets();
  }

  // Load All Workspace Data
  async function loadClientData(isSilent = false) {
    state.isRefreshing = true;
    try {
      const overviewRes = await apiFetch('/portal/client-overview');
      if (overviewRes.ok && overviewRes.data && overviewRes.data.success && overviewRes.data.data) {
        const d = overviewRes.data.data;
        state.services = Array.isArray(d.services) ? d.services : (Array.isArray(d.activeServices) ? d.activeServices : []);
        state.projects = Array.isArray(d.projects) ? d.projects : (Array.isArray(d.activeProjects) ? d.activeProjects : []);
        state.payments = d.recentPayments || d.payments || [];
        state.invoices = d.invoices || [];
        state.finance = d.finance || null;
      state.cif = d.cif || null;
      if (d.receiptQuota) state.receiptQuota = d.receiptQuota;
      updateCifUi();
      updateQuotaUi();
        state.overallProgress = Math.round(Number(d.overallProgressPercent || 0));
        state.organizations = d.organizations || [];

        renderClientOverview();
        renderServicesPortfolio();
        renderDeliverablesTasks();
        renderFinanceReceipts();
      } else {
        // Fallback to individual endpoints
        const [srvRes, projRes, finRes] = await Promise.all([
          apiFetch('/services/my-services'),
          apiFetch('/projects'),
          apiFetch('/finance/invoices')
        ]);

        if (srvRes.ok && srvRes.data && srvRes.data.data) {
          state.services = srvRes.data.data.services || srvRes.data.data || [];
        }
        if (projRes.ok && projRes.data && projRes.data.data) {
          state.projects = projRes.data.data.projects || projRes.data.data || [];
        }
        if (finRes.ok && finRes.data && finRes.data.data) {
          state.invoices = finRes.data.data.invoices || [];
          state.payments = finRes.data.data.payments || [];
        }

        renderClientOverview();
        renderServicesPortfolio();
        renderDeliverablesTasks();
        renderFinanceReceipts();
      }
    } catch (e) {
      console.warn('Data preload notice:', e);
    } finally {
      state.isRefreshing = false;
    }
  }

  // 1. Render Overview
  function renderClientOverview() {
    const statActive = document.getElementById('statActiveServices');
    const statTasks = document.getElementById('statCompletedTasks');
    const statInv = document.getElementById('statInvoicesCount');

    if (statActive) statActive.textContent = state.services.length;
    if (statTasks) {
      const totalCompleted = state.projects.reduce((acc, p) => acc + (p.completedTasksCount || 0), 0);
      const totalTasks = state.projects.reduce((acc, p) => acc + (p.totalTasksCount || 0), 0);
      statTasks.textContent = totalTasks > 0 ? `${totalCompleted}/${totalTasks}` : `${totalCompleted}`;
    }
    if (statInv) statInv.textContent = state.invoices.length;

    // Overall Progress Badge & Donut Chart
    const progressBadge = document.getElementById('clientOverallProgressBadge');
    if (progressBadge) progressBadge.textContent = `${state.overallProgress}%`;
    const miniProg = document.getElementById('statOverallProgressPercent');
    if (miniProg) miniProg.textContent = `${state.overallProgress}%`;

    const canvas = document.getElementById('chartClientCompletion');
    const emptyState = document.getElementById('chartClientEmptyState');
    if (canvas) {
      if (state.services.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (state.completionChart) {
          state.completionChart.destroy();
          state.completionChart = null;
        }
      } else {
        if (emptyState) emptyState.classList.add('hidden');
        if (typeof Chart !== 'undefined') {
          if (state.completionChart) {
            state.completionChart.destroy();
          }
          const ctx = canvas.getContext('2d');
          state.completionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: ['Completed', 'Remaining'],
              datasets: [{
                data: [state.overallProgress, Math.max(0, 100 - state.overallProgress)],
                backgroundColor: ['#147D64', '#E3E9EF'],
                borderWidth: 0,
                hoverOffset: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '76%',
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (item) => ` ${item.label}: ${item.raw}%`
                  }
                }
              }
            }
          });
        }
      }
    }

    // Financial Summary Status
    const primaryCurr = state.finance?.currency || 'USD';
    const totalBilledEl = document.getElementById('clientSummaryTotalBilled');
    const totalPaidEl = document.getElementById('clientSummaryTotalPaid');
    const balanceEl = document.getElementById('clientSummaryBalance');
    const contractValEl = document.getElementById('clientSummaryContractValue');

    if (contractValEl) {
      contractValEl.textContent = formatCurrency(state.finance?.contractValueCents || 0, primaryCurr);
    }
    if (totalBilledEl) {
      totalBilledEl.textContent = formatCurrency(state.finance?.totalInvoicedCents || 0, primaryCurr);
    }
    if (totalPaidEl) {
      totalPaidEl.textContent = formatCurrency(state.finance?.totalPaidCents || 0, primaryCurr);
    }
    if (balanceEl) {
      balanceEl.textContent = formatCurrency(state.finance?.outstandingBalanceCents || 0, primaryCurr);
    }

    const list = document.getElementById('overviewServicesList');
    if (!list) return;

    if (state.services.length === 0) {
      list.innerHTML = `
        <div class="p-5 sm:p-7 rounded-2xl bg-[#F7FAF9] border border-[#E6ECE9] text-center space-y-3.5">
          <div class="w-11 h-11 rounded-2xl bg-[#EAF5F1] text-[#087F70] border border-[#087F70]/20 flex items-center justify-center mx-auto text-base shadow-2xs">
            <i class="fa-solid fa-shapes"></i>
          </div>
          <div class="space-y-1 max-w-sm mx-auto">
            <p class="font-bold text-xs text-[#202D2A]">No active marketing services attached yet</p>
            <p class="text-[11px] text-[#74817D] leading-relaxed">Explore our marketing packages and dedicated campaign execution to accelerate your brand.</p>
          </div>
          <div class="pt-1">
            <a href="/#services" class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#087F70] hover:bg-[#066559] active:bg-[#054f46] text-white text-xs font-bold transition-all shadow-xs cursor-pointer touch-manipulation">
              <i class="fa-solid fa-compass text-xs"></i>
              <span>Browse Service Catalog</span>
            </a>
          </div>
        </div>
      `;
    } else {
      list.innerHTML = state.services.map(s => {
        const progress = Math.round(Number(s.progress_percent || s.progressPercent || 0));
        const price = formatCurrency(s.price_cents || s.priceCents || 0, s.currency || primaryCurr);
        return `
          <div class="p-4 sm:p-5 rounded-2xl bg-white border border-[#E6ECE9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 hover:border-[#087F70]/40 hover:shadow-xs transition-all">
            <div class="flex items-start sm:items-center space-x-3.5 min-w-0 w-full sm:w-auto">
              <div class="w-10 h-10 rounded-xl bg-[#EAF5F1] text-[#087F70] border border-[#087F70]/25 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                <i class="fa-solid fa-bolt"></i>
              </div>
              <div class="min-w-0 flex-1">
                <h4 class="text-xs sm:text-sm font-bold text-[#202D2A] truncate">${escapeHtml(s.service_name || s.serviceName || 'Agency Service')}</h4>
                <p class="text-[11px] text-[#74817D] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                  <span>Status: <strong class="text-[#087F70] uppercase font-bold">${escapeHtml(s.status || 'Active')}</strong></span>
                  <span class="text-slate-300">•</span>
                  <span>Tier: <strong class="text-[#202D2A] font-medium">${escapeHtml(s.package_name || s.packageName || 'Standard Retainer')}</strong></span>
                  <span class="text-slate-300">•</span>
                  <span>Progress: <strong class="text-[#087F70] font-mono font-bold">${progress}%</strong></span>
                </p>
              </div>
            </div>
            <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[#E6ECE9]">
              <span class="text-xs sm:text-sm font-mono font-bold text-[#202D2A]">${price}</span>
              <button type="button" data-client-tab="services" class="px-3 py-1.5 rounded-lg bg-[#F7FAF9] hover:bg-[#EAF5F1] text-[#202D2A] hover:text-[#087F70] text-[11px] font-semibold transition-all border border-[#E6ECE9] hover:border-[#087F70]/20 cursor-pointer touch-manipulation">
                Details
              </button>
            </div>
          </div>
        `;
      }).join('');

      list.querySelectorAll('[data-client-tab]').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.clientTab));
      });
    }
  }

  // 2. Render Services Portfolio
  function renderServicesPortfolio() {
    const list = document.getElementById('servicesFullList');
    const countEl = document.getElementById('servicesPortfolioCount');
    if (countEl) countEl.textContent = `${state.services.length} Active Services`;
    if (!list) return;

    if (state.services.length === 0) {
      list.innerHTML = `
        <div class="p-8 rounded-2xl bg-white border border-[#E3E9EF] text-center text-xs text-slate-500 space-y-2">
          <i class="fa-solid fa-layer-group text-2xl text-slate-600 block mb-1"></i>
          <p>No active services provisioned for this account.</p>
          <a href="/#services" class="inline-block mt-2 px-3.5 py-1.5 rounded-xl bg-brand-whiz text-white font-bold transition-all">
            Explore Services
          </a>
        </div>
      `;
      return;
    }

    list.innerHTML = state.services.map(s => {
      const price = formatCurrency(s.price_cents || s.priceCents || 0, s.currency || 'USD');
      const progress = Math.round(Number(s.progress_percent || s.progressPercent || 0));
      return `
        <div class="p-5 sm:p-6 rounded-3xl bg-white border border-[#E3E9EF] space-y-4 hover:border-brand-whiz/40 hover:shadow-sm transition-all">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div class="flex items-center space-x-3.5">
              <div class="w-11 h-11 rounded-2xl bg-brand-whiz/15 text-brand-whiz border border-brand-whiz/30 flex items-center justify-center font-bold text-base shrink-0">
                <i class="fa-solid fa-shapes"></i>
              </div>
              <div>
                <h4 class="text-sm sm:text-base font-bold text-[#172B36]">${escapeHtml(s.service_name || s.serviceName || s.name || 'Marketing Service')}</h4>
                <span class="text-xs text-slate-500">${escapeHtml(s.package_name || s.packageName || 'Standard Agency Package')}</span>
              </div>
            </div>
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                ${escapeHtml(s.status || 'Active')}
              </span>
              <span class="text-sm font-mono font-black text-[#172B36]">${price}</span>
            </div>
          </div>

          <!-- Progress Bar & Milestone Info -->
          <div class="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-[#E3E9EF]">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-600 font-semibold">Service Delivery Milestone Completion</span>
              <span class="font-mono font-bold text-brand-whiz text-sm">${progress}%</span>
            </div>
            <div class="w-full bg-slate-200/70 rounded-full h-2.5 overflow-hidden border border-[#E3E9EF]">
              <div class="bg-gradient-to-r from-brand-whiz to-emerald-400 h-full rounded-full transition-all duration-500" style="width: ${progress}%"></div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-2xl border border-[#E3E9EF]">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-500 block">Deliverables Scope</span>
              <p class="text-slate-600 mt-0.5 leading-relaxed">${escapeHtml(s.deliverables || s.scope || 'Full agency execution and verified milestone handoffs.')}</p>
            </div>
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-500 block">Contract Timeline</span>
              <p class="text-slate-600 mt-0.5">Start: ${escapeHtml(s.start_date || s.startDate || 'Active')} • Target: ${escapeHtml(s.deadline || 'Ongoing')}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 3. Render Deliverables & Project Progress (INTERNAL SOP TASKS REMAIN HIDDEN)
  function renderDeliverablesTasks() {
    const list = document.getElementById('tasksFullList');
    const countEl = document.getElementById('tasksDeliverablesCount');
    if (countEl) countEl.textContent = `${state.projects.length} Active Campaigns`;
    if (!list) return;

    if (state.projects.length === 0) {
      list.innerHTML = `
        <div class="p-8 sm:p-12 rounded-3xl bg-white border border-[#E3E9EF] text-center space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            <i class="fa-solid fa-list-check"></i>
          </div>
          <div class="space-y-1">
            <h4 class="font-bold text-sm text-[#172B36]">No active project campaigns provisioned yet</h4>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">When your service agreement is activated, milestone checkpoints and progress updates will appear here.</p>
          </div>
        </div>
      `;
      return;
    }

    list.innerHTML = state.projects.map(p => {
      const progress = Math.min(100, Math.max(0, Math.round(Number(p.progress_percent || p.progressPercent || 0))));
      const completed = Number(p.completedTasksCount || 0);
      const total = Number(p.totalTasksCount || 0);
      const tasks = Array.isArray(p.tasks) ? p.tasks : [];

      return `
        <div class="p-5 sm:p-6 rounded-3xl bg-white border border-[#E3E9EF] space-y-4 hover:border-brand-whiz/40 hover:shadow-xs transition-all">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              <h4 class="text-sm sm:text-base font-bold text-[#172B36] flex items-center gap-2">
                <i class="fa-solid fa-diagram-project text-brand-whiz text-xs"></i>
                <span>${escapeHtml(p.name || p.projectName || 'Campaign Execution')}</span>
              </h4>
              <p class="text-xs text-slate-500 mt-0.5">Target Completion: <strong class="text-slate-600">${escapeHtml(p.deadline || 'Scheduled')}</strong></p>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              ${escapeHtml(p.status || 'Active')}
            </span>
          </div>

          <!-- Progress Bar & Percentage -->
          <div class="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-[#E3E9EF]">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-600 font-semibold">Campaign Deliverables Progress</span>
              <div class="flex items-center gap-2">
                ${total > 0 ? `<span class="text-[11px] font-mono text-slate-400">(${completed}/${total} Checkpoints)</span>` : ''}
                <span class="font-mono font-bold text-brand-whiz text-sm">${progress}%</span>
              </div>
            </div>
            <div class="w-full bg-slate-200/70 rounded-full h-2.5 overflow-hidden border border-[#E3E9EF]">
              <div class="bg-gradient-to-r from-brand-whiz to-emerald-400 h-full rounded-full transition-all duration-500" style="width: ${progress}%"></div>
            </div>
          </div>

          <!-- Milestone Tasks & Deliverables Checkpoints List -->
          ${tasks.length > 0 ? `
            <div class="space-y-2 pt-2 border-t border-slate-100">
              <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Delivered Milestone Checkpoints</span>
              <div class="space-y-1.5">
                ${tasks.map(t => {
                  const isDone = t.status === 'completed';
                  const inProg = t.status === 'in_progress';
                  return `
                    <div class="p-3 rounded-xl ${isDone ? 'bg-emerald-50/50 border border-emerald-200/50' : (inProg ? 'bg-amber-50/50 border border-amber-200/50' : 'bg-slate-50 border border-slate-100')} flex items-start justify-between gap-3 text-xs">
                      <div class="flex items-start gap-2.5 min-w-0 flex-1">
                        <i class="fa-solid ${isDone ? 'fa-circle-check text-emerald-600' : (inProg ? 'fa-circle-notch fa-spin text-amber-600' : 'fa-circle text-slate-300')} mt-0.5 text-xs shrink-0"></i>
                        <div class="min-w-0">
                          <p class="font-bold text-[#172B36] truncate">${escapeHtml(t.title)}</p>
                          ${t.description ? `<p class="text-[11px] text-slate-500 line-clamp-1 mt-0.5">${escapeHtml(t.description)}</p>` : ''}
                        </div>
                      </div>
                      <span class="px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold ${isDone ? 'bg-emerald-100 text-emerald-800' : (inProg ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600')} shrink-0">
                        ${isDone ? 'Delivered' : (inProg ? 'In Progress' : 'Queued')}
                      </span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  // 4. Client Information Form (CIF) & Daily Quota Management
  
  // 4a. Client Profile & CIF Form Controller (Phase 3 & 4)
  function populateProfileForm(cif) {
    const data = cif || state.cif || {};
    const setInput = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = (val !== undefined && val !== null) ? val : '';
    };

    const clerkUser = window.Clerk?.user;
    const verifiedEmail = (data.email || state.currentUser?.email || (clerkUser?.primaryEmailAddress?.emailAddress) || '').toLowerCase();
    const defaultName = data.fullName || data.full_name || state.currentUser?.fullName || (clerkUser ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() : '') || 'Client';

    setInput('profileFullName', defaultName);
    setInput('profileEmail', verifiedEmail);
    setInput('profilePhone', data.phone || '');
    setInput('profileCompanyName', data.companyName || data.company_name || state.currentUser?.companyName || '');
    setInput('profileBillingName', data.billingName || data.billing_name || defaultName);
    setInput('profileCurrency', data.billingCurrency || data.billing_currency || 'USD');
    setInput('profileAddress', data.billingAddress || data.billing_address || '');
    setInput('profileCity', data.city || '');
    setInput('profileCountry', data.country || 'Bangladesh');
    setInput('profilePostalCode', data.postalCode || data.postal_code || '');
    setInput('profileTaxId', data.taxId || data.tax_id || '');

    updateProfileFormProgress();
    applyProfileLockUi(data.isLocked || data.is_locked === 1);
  }

  function applyProfileLockUi(isLocked) {
    const isProfileLocked = Boolean(isLocked);
    const saveBtn = document.getElementById('btnSaveClientProfile');
    const lockedBanner = document.getElementById('profileLockedNoticeBanner');

    const inputs = [
      'profileFullName', 'profileBillingName', 'profileCompanyName',
      'profilePhone', 'profileAddress', 'profileCity', 'profileCountry',
      'profilePostalCode', 'profileCurrency', 'profileTaxId'
    ];

    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (isProfileLocked) {
          el.disabled = true;
          el.classList.add('bg-slate-100', 'cursor-not-allowed', 'text-slate-600', 'border-slate-200');
          el.classList.remove('bg-slate-50', 'bg-white');
        } else {
          el.disabled = false;
          el.classList.remove('bg-slate-100', 'cursor-not-allowed', 'text-slate-600', 'border-slate-200');
          el.classList.add('bg-slate-50');
        }
      }
    });

    if (saveBtn) {
      if (isProfileLocked) {
        saveBtn.classList.add('hidden');
      } else {
        saveBtn.classList.remove('hidden');
      }
    }

    if (lockedBanner) {
      if (isProfileLocked) {
        lockedBanner.classList.remove('hidden');
      } else {
        lockedBanner.classList.add('hidden');
      }
    }
  }

  function updateProfileFormProgress() {
    const mandatoryFields = [
      { id: 'profileFullName', label: 'Full Legal Name' },
      { id: 'profileBillingName', label: 'Billing Name' },
      { id: 'profileEmail', label: 'Verified Email' },
      { id: 'profilePhone', label: 'Phone Number' },
      { id: 'profileAddress', label: 'Full Billing Address' },
      { id: 'profileCity', label: 'City' },
      { id: 'profileCountry', label: 'Country' },
      { id: 'profileCurrency', label: 'Billing Currency' }
    ];

    let completedCount = 0;
    const missing = [];

    mandatoryFields.forEach(f => {
      const el = document.getElementById(f.id);
      const val = el ? el.value.trim() : '';
      if (val.length > 0) {
        completedCount++;
      } else {
        missing.push(f.label);
      }
    });

    const percent = Math.round((completedCount / mandatoryFields.length) * 100);
    const isComplete = percent === 100;

    const bar = document.getElementById('profileStatusProgressBar');
    const badge = document.getElementById('profileStatusPercentBadge');
    const title = document.getElementById('profileStatusBannerTitle');
    const desc = document.getElementById('profileStatusBannerDesc');
    const icon = document.getElementById('profileStatusBannerIcon');
    const alertBox = document.getElementById('profileMissingFieldsAlert');
    const alertList = document.getElementById('profileMissingFieldsList');

    if (bar) {
      bar.style.width = `${percent}%`;
      bar.className = isComplete ? 'h-full bg-emerald-500 transition-all duration-300' : 'h-full bg-amber-500 transition-all duration-300';
    }
    if (badge) {
      badge.textContent = `${percent}% Complete`;
      badge.className = isComplete
        ? 'text-xs font-extrabold text-emerald-700 font-mono px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200'
        : 'text-xs font-extrabold text-amber-700 font-mono px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200';
    }

    if (isComplete) {
      if (title) title.textContent = 'Profile Verified (100%)';
      if (desc) desc.textContent = 'All 8 mandatory billing fields verified. Official PDF invoice generation active.';
      if (icon) {
        icon.className = 'w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0';
        icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
      }
      if (alertBox) alertBox.classList.add('hidden');
    } else {
      if (title) title.textContent = `Profile Incomplete (${percent}%)`;
      if (desc) desc.textContent = 'Complete all 8 mandatory fields to enable official invoice PDF downloads.';
      if (icon) {
        icon.className = 'w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0';
        icon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
      }
      if (alertBox) {
        alertBox.classList.remove('hidden');
        if (alertList) alertList.textContent = missing.join(', ');
      }
    }
  }

  async function handleSaveClientProfile(e) {
    if (e && e.preventDefault) e.preventDefault();
    const btn = document.getElementById('btnSaveClientProfile');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving changes...';
    }

    try {
      const getVal = (id) => (document.getElementById(id)?.value || '').trim();

      const payload = {
        fullName: getVal('profileFullName'),
        email: getVal('profileEmail') || state.currentUser?.email || '',
        phone: getVal('profilePhone'),
        companyName: getVal('profileCompanyName'),
        billingName: getVal('profileBillingName'),
        billingCurrency: getVal('profileCurrency') || 'USD',
        billingAddress: getVal('profileAddress'),
        city: getVal('profileCity'),
        country: getVal('profileCountry') || 'Bangladesh',
        postalCode: getVal('profilePostalCode'),
        taxId: getVal('profileTaxId')
      };

      // Client-side mandatory validation
      const mandatory = [
        { field: payload.fullName, name: 'Full Legal Name', id: 'profileFullName' },
        { field: payload.billingName, name: 'Billing / Invoicing Entity Name', id: 'profileBillingName' },
        { field: payload.phone, name: 'Phone Number', id: 'profilePhone' },
        { field: payload.billingAddress, name: 'Full Billing Street Address', id: 'profileAddress' },
        { field: payload.city, name: 'City', id: 'profileCity' },
        { field: payload.country, name: 'Country', id: 'profileCountry' },
        { field: payload.billingCurrency, name: 'Preferred Billing Currency', id: 'profileCurrency' }
      ];

      for (const m of mandatory) {
        if (!m.field) {
          const el = document.getElementById(m.id);
          if (el) el.focus();
          throw new Error(`Please provide your ${m.name}.`);
        }
      }

      const res = await apiFetch('/portal/client/cif', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.status === 403 || res.data?.code === 'PROFILE_LOCKED') {
        showToast(res.data?.error || 'Your profile is verified and locked. Contact Whiz Studio Support to request changes.', 'error');
        applyProfileLockUi(true);
        return;
      }

      if (!res.ok || !res.data || !res.data.success) {
        throw new Error(res.data?.error || 'Failed to save profile.');
      }

      state.cif = res.data.data;
      if (state.clientProfile) {
        Object.assign(state.clientProfile, res.data.data);
      }

      updateCifUi();
      populateProfileForm(state.cif);
      updateProfileFormProgress();

      showToast(res.data.message || 'Profile saved and verified successfully!', 'success');
    } catch (err) {
      console.error('Save profile error:', err);
      showToast(err.message || 'Error saving profile details.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText || '<i class="fa-solid fa-floppy-disk"></i> <span>Save Changes</span>';
      }
    }
  }



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
        delete btn.dataset.origText;
      }
    }
  }

  function updatePasswordUi() {
    try {
      const clerkUser = window.Clerk?.user;
      const hasPassword = Boolean(clerkUser?.passwordEnabled);
      const statusBadge = document.getElementById('settingsPasswordStatusBadge');
      const helpText = document.getElementById('settingsPasswordHelpText');
      const btnText = document.getElementById('btnOpenPasswordModalText');
      const modalTitle = document.getElementById('modalClientPasswordTitle');
      const containerCurrent = document.getElementById('containerCurrentPassword');

      if (statusBadge) {
        statusBadge.textContent = hasPassword ? 'Password Active' : 'No Password Set';
        statusBadge.className = hasPassword
          ? 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200';
      }
      if (helpText) {
        helpText.textContent = hasPassword
          ? 'Your account is protected with a password in addition to Google Single Sign-On.'
          : 'You registered with Google SSO. You can optionally set a password for direct email/password sign-in.';
      }
      if (btnText) btnText.textContent = hasPassword ? 'Change Password' : 'Set Password';
      if (modalTitle) modalTitle.textContent = hasPassword ? 'Change Account Password' : 'Set Account Password';
      if (containerCurrent) {
        if (hasPassword) {
          containerCurrent.classList.remove('hidden');
          const inputCurr = document.getElementById('inputCurrentPassword');
          if (inputCurr) inputCurr.required = true;
        } else {
          containerCurrent.classList.add('hidden');
          const inputCurr = document.getElementById('inputCurrentPassword');
          if (inputCurr) inputCurr.required = false;
        }
      }
    } catch (e) {
      console.warn('updatePasswordUi error:', e);
    }
  }

  function populateSettingsView() {
    try {
      const clerkUser = window.Clerk?.user;
      if (!clerkUser) return;
      const email = (state.clientProfile?.email || clerkUser.primaryEmailAddress?.emailAddress || '').toLowerCase();
      const setMail = document.getElementById('settingsEmail');
      if (setMail) setMail.textContent = email;

      const setClerkId = document.getElementById('settingsClerkUserId');
      if (setClerkId) setClerkId.innerHTML = '<i class="fa-solid fa-shield-check text-[#147D64] mr-1.5"></i><span>Hardware-Backed SSO Session Active</span>';

      const setAuthProv = document.getElementById('settingsAuthProvider');
      const hasGoogle = clerkUser.externalAccounts?.some(a => a.provider === 'google');
      if (setAuthProv) {
        setAuthProv.textContent = hasGoogle ? 'Google Single Sign-On (SSO)' : 'Email Authentication';
      }

      updatePasswordUi();
    } catch (e) {
      console.warn('populateSettingsView error:', e);
    }
  }

  function updateCifUi() {
    const card = document.getElementById('cifStatusCard');
    const icon = document.getElementById('cifStatusIcon');
    const title = document.getElementById('cifStatusTitle');
    const desc = document.getElementById('cifStatusDescription');
    const badge = document.getElementById('cifPercentageBadge');
    const bar = document.getElementById('cifProgressBar');
    const missingBox = document.getElementById('cifMissingFieldsContainer');
    const missingList = document.getElementById('cifMissingFieldsList');
    const btnAction = document.getElementById('btnCifAction');

    const cif = state.cif || {};
    const percent = cif.completionPercentage !== undefined ? cif.completionPercentage : (cif.isComplete ? 100 : 0);
    const isComplete = Boolean((cif.isComplete || percent === 100) && (cif.isLocked || cif.is_locked === 1));
    const missing = cif.missingFields || [];

    // Header Verification Badge (Section 3: Verified / Unverified)
    const headerBadge = document.getElementById('clientHeaderVerificationBadge');
    const headerDot = document.getElementById('clientHeaderVerificationDot');
    const headerText = document.getElementById('clientHeaderVerificationText');

    if (headerBadge && headerText && headerDot) {
      headerBadge.classList.remove('hidden');
      if (isComplete) {
        headerBadge.className = 'hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all cursor-pointer shadow-2xs select-none bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
        headerDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-500';
        headerText.textContent = 'Verified';
        headerBadge.title = 'CIF Profile 100% verified. Invoice generation active.';
      } else {
        headerBadge.className = 'hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all cursor-pointer shadow-2xs select-none bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
        headerDot.className = 'w-1.5 h-1.5 rounded-full bg-rose-500';
        headerText.textContent = 'Unverified';
        headerBadge.title = 'CIF profile incomplete. Click to complete profile.';
      }

      if (!headerBadge.dataset.bound) {
        headerBadge.dataset.bound = 'true';
        headerBadge.addEventListener('click', () => switchTab('profile'));
      }
    }

    if (badge) badge.textContent = `${percent}% Complete`;
    if (bar) {
      bar.style.width = `${percent}%`;
      bar.className = isComplete ? 'h-full bg-emerald-500 transition-all duration-300' : 'h-full bg-amber-500 transition-all duration-300';
    }

    if (isComplete) {
      if (icon) {
        icon.className = 'w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm';
        icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
      }
      if (title) title.textContent = 'CIF Profile Complete (100%)';
      if (desc) desc.textContent = 'All mandatory billing fields verified. Official PDF generation is enabled.';
      if (missingBox) missingBox.classList.add('hidden');
      if (btnAction) {
        btnAction.textContent = 'Edit Profile Details';
        btnAction.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all shadow-xs cursor-pointer';
        btnAction.onclick = () => switchTab('profile');
      }
    } else {
      if (icon) {
        icon.className = 'w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm';
        icon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
      }
      if (title) title.textContent = `CIF Profile Incomplete (${percent}%)`;
      if (desc) desc.textContent = 'Complete all mandatory fields to unlock official PDF downloads.';
      if (missingBox) {
        missingBox.classList.remove('hidden');
        if (missingList) missingList.textContent = missing.length > 0 ? missing.join(', ') : 'Mandatory invoice fields required';
      }
      if (btnAction) {
        btnAction.textContent = 'Complete Profile';
        btnAction.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-[#147D64] hover:bg-[#12694f] text-white transition-all shadow-xs cursor-pointer';
        btnAction.onclick = () => switchTab('profile');
      }
    }
  }

  function updateQuotaUi() {
    const quotaText = document.getElementById('quotaRemainingText');
    const notice = document.getElementById('previewAllowanceNotice');
    const q = state.receiptQuota || { remaining: 2, max: 2, used: 0 };
    const str = `Daily PDF Allowance: ${q.remaining}/${q.max} remaining`;
    if (quotaText) quotaText.textContent = str;
    if (notice) notice.textContent = `Daily Allowance: ${q.remaining}/${q.max} remaining today (Resets at midnight Dhaka time)`;
  }

  async function loadCifProfile() {
    try {
      const res = await apiFetch('/portal/client/cif');
      if (res.ok && res.data && res.data.success) {
        state.cif = res.data.data;
        updateCifUi();
        populateCifModal(state.cif);
      }
    } catch (e) {
      console.warn('Failed to load CIF profile:', e);
    }
  }

  function populateCifModal(cif) {
    if (!cif) return;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };
    setVal('cifInputFullName', cif.fullName);
    setVal('cifInputBillingName', cif.billingName);
    setVal('cifInputCompanyName', cif.companyName);
    setVal('cifInputEmail', cif.email);
    setVal('cifInputPhone', cif.phone);
    setVal('cifInputAddress', cif.billingAddress);
    setVal('cifInputCity', cif.city);
    setVal('cifInputCountry', cif.country);
    setVal('cifInputPostalCode', cif.postalCode);
    setVal('cifInputCurrency', cif.billingCurrency || 'USD');
    setVal('cifInputTaxId', cif.taxId);
    updateModalCifProgress();
  }

  function updateModalCifProgress() {
    const requiredIds = [
      'cifInputFullName', 'cifInputBillingName', 'cifInputEmail',
      'cifInputPhone', 'cifInputAddress', 'cifInputCity',
      'cifInputCountry', 'cifInputCurrency'
    ];
    let filled = 0;
    requiredIds.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value.trim().length > 0) filled++;
    });
    const percent = Math.round((filled / requiredIds.length) * 100);
    const pText = document.getElementById('modalCifPercentText');
    const pBar = document.getElementById('modalCifProgressBar');
    if (pText) pText.textContent = `${percent}% (${filled}/8 Mandatory Fields)`;
    if (pBar) {
      pBar.style.width = `${percent}%`;
      pBar.className = percent === 100 ? 'h-full bg-emerald-500 transition-all duration-300' : 'h-full bg-[#147D64] transition-all duration-300';
    }
  }

  function openCifModal() {
    const modal = document.getElementById('modalClientCif');
    if (!modal) return;
    if (state.cif) populateCifModal(state.cif);
    modal.classList.remove('hidden');
  }

  function closeCifModal() {
    const modal = document.getElementById('modalClientCif');
    if (modal) modal.classList.add('hidden');
  }

  async function handleSaveCif(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveCif');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';
    }

    try {
      const payload = {
        fullName: document.getElementById('cifInputFullName')?.value.trim(),
        billingName: document.getElementById('cifInputBillingName')?.value.trim(),
        companyName: document.getElementById('cifInputCompanyName')?.value.trim(),
        email: document.getElementById('cifInputEmail')?.value.trim(),
        phone: document.getElementById('cifInputPhone')?.value.trim(),
        billingAddress: document.getElementById('cifInputAddress')?.value.trim(),
        city: document.getElementById('cifInputCity')?.value.trim(),
        country: document.getElementById('cifInputCountry')?.value.trim(),
        postalCode: document.getElementById('cifInputPostalCode')?.value.trim(),
        billingCurrency: document.getElementById('cifInputCurrency')?.value || 'USD',
        taxId: document.getElementById('cifInputTaxId')?.value.trim()
      };

      const res = await apiFetch('/portal/client/cif', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!res.ok || !res.data || !res.data.success) {
        throw new Error(res.data?.error || 'Failed to save CIF profile.');
      }

      state.cif = res.data.data;
      updateCifUi();
      closeCifModal();
      showToast(res.data.message || 'CIF profile saved successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Error saving CIF profile.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save &amp; Validate CIF';
      }
    }
  }

  // 5. Render Finance Invoices & Payment Receipts
  function renderFinanceReceipts() {
    const list = document.getElementById('financeFullList');
    const countEl = document.getElementById('financeReceiptsCount');
    if (!list) return;

    updateCifUi();
    updateQuotaUi();

    const invoices = state.invoices || [];
    const payments = state.payments || [];
    const totalRecords = invoices.length + payments.length;
    if (countEl) countEl.textContent = `${invoices.length} Published Invoices, ${payments.length} Confirmed Payments`;

    // Multi-Currency Ledger Breakdown Cards
    let currencyCardsHtml = '';
    if (state.finance && state.finance.byCurrency) {
      const currs = Object.values(state.finance.byCurrency);
      if (currs.length > 0) {
        currencyCardsHtml = `
          <div class="grid grid-cols-1 sm:grid-cols-${Math.min(currs.length, 3)} gap-4 mb-6">
            ${currs.map(c => `
              <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] shadow-xs space-y-2">
                <div class="flex items-center justify-between pb-2 border-b border-[#E3E9EF]">
                  <span class="text-xs font-black uppercase text-brand-whiz bg-brand-whiz/10 px-2 py-0.5 rounded-md border border-brand-whiz/20">${escapeHtml(c.currency)}</span>
                  <span class="text-[10px] uppercase font-bold text-slate-500">Currency Ledger</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span class="text-[10px] uppercase font-bold text-slate-400 block">Total Invoiced</span>
                    <span class="font-bold text-[#172B36] font-mono">${formatCurrency(c.totalInvoicedCents || 0, c.currency)}</span>
                  </div>
                  <div>
                    <span class="text-[10px] uppercase font-bold text-slate-400 block">Total Paid</span>
                    <span class="font-bold text-emerald-600 font-mono">${formatCurrency(c.totalPaidCents || 0, c.currency)}</span>
                  </div>
                </div>
                <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span class="text-[10px] uppercase font-bold text-slate-400">Due Balance</span>
                  <span class="font-black font-mono ${c.outstandingBalanceCents > 0 ? 'text-amber-600' : 'text-emerald-600'}">${formatCurrency(c.outstandingBalanceCents || 0, c.currency)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    // Invoices Section
    let invoicesSectionHtml = '';
    if (invoices.length > 0) {
      invoicesSectionHtml = `
        <div class="space-y-4 mb-8">
          <div class="flex items-center justify-between pb-2 border-b border-[#E3E9EF]">
            <h3 class="text-sm font-black text-[#172B36] flex items-center gap-2">
              <i class="fa-solid fa-file-invoice text-[#147D64]"></i>
              <span>Official Client Invoices</span>
            </h3>
            <span class="text-[11px] font-bold text-slate-500">${invoices.length} Invoices Available</span>
          </div>

          <!-- Mobile Cards -->
          <div class="md:hidden space-y-3">
            ${invoices.map(inv => {
              const num = inv.invoice_number || 'INV-1001';
              const date = inv.issue_date || 'N/A';
              const srvName = inv.service_name || inv.serviceName || 'Agency Retainer Service';
              const isPaid = (inv.outstanding_balance_cents === 0) || inv.status === 'paid';
              return `
                <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] shadow-xs space-y-3">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <span class="font-mono text-xs font-bold text-[#147D64]">${escapeHtml(num)}</span>
                      <div class="text-[11px] font-bold text-[#172B36] mt-0.5">${escapeHtml(srvName)}</div>
                      <div class="text-[10px] text-slate-400 font-mono">Issued: ${escapeHtml(date)} • Due: ${escapeHtml(inv.due_date || 'N/A')}</div>
                    </div>
                    <div class="text-right">
                      <span class="text-sm font-black font-mono text-[#172B36] block">${formatCurrency(inv.total_cents || 0, inv.currency || "USD")}</span>
                      <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'} inline-block mt-0.5">
                        ${isPaid ? 'Paid in Full' : 'Due: ' + formatCurrency(inv.outstanding_balance_cents || 0, inv.currency || 'USD')}
                      </span>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button type="button" class="btn-preview-doc py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all" data-type="invoice" data-id="${inv.id}" data-num="${num}">
                      <i class="fa-solid fa-eye text-[11px]"></i>
                      <span>Preview</span>
                    </button>
                    <button type="button" class="btn-download-doc py-2 rounded-xl bg-[#147D64] hover:bg-[#12694f] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs" data-type="invoice" data-id="${inv.id}" data-num="${num}">
                      <i class="fa-solid fa-file-arrow-down text-[11px]"></i>
                      <span>Generate PDF</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Desktop Table -->
          <div class="hidden md:block rounded-3xl bg-white border border-[#E3E9EF] overflow-hidden shadow-xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-600 min-w-[760px]">
                <thead class="bg-slate-50/80 border-b border-[#E3E9EF] text-[11px] uppercase font-bold text-slate-500">
                  <tr>
                    <th class="p-4">Invoice #</th>
                    <th class="p-4">Purchased Service</th>
                    <th class="p-4">Issue Date</th>
                    <th class="p-4">Total Amount</th>
                    <th class="p-4">Amount Paid</th>
                    <th class="p-4">Outstanding</th>
                    <th class="p-4">Status</th>
                    <th class="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E3E9EF]">
                  ${invoices.map(inv => {
                    const num = inv.invoice_number || 'INV-1001';
                    const srvName = inv.service_name || inv.serviceName || 'Professional Retainer';
                    const isPaid = (inv.outstanding_balance_cents === 0) || inv.status === 'paid';
                    return `
                      <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="p-4 font-mono font-bold text-[#147D64]">${escapeHtml(num)}</td>
                        <td class="p-4">
                          <div class="font-bold text-[#172B36]">${escapeHtml(srvName)}</div>
                          <div class="text-[10px] text-slate-400 font-mono">Due: ${escapeHtml(inv.due_date || 'N/A')}</div>
                        </td>
                        <td class="p-4 text-slate-500 font-mono">${escapeHtml(inv.issue_date || 'N/A')}</td>
                        <td class="p-4 font-mono font-bold text-[#172B36]">${formatCurrency(inv.total_cents || 0, inv.currency || "USD")}</td>
                        <td class="p-4 font-mono text-emerald-600 font-semibold">${formatCurrency(inv.amount_paid_cents || 0, inv.currency || "USD")}</td>
                        <td class="p-4 font-mono font-bold ${isPaid ? 'text-slate-400' : 'text-amber-600'}">${formatCurrency(inv.outstanding_balance_cents || 0, inv.currency || "USD")}</td>
                        <td class="p-4">
                          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
                            ${isPaid ? 'Paid in Full' : 'Pending'}
                          </span>
                        </td>
                        <td class="p-4 text-right space-x-1.5">
                          <button type="button" class="btn-preview-doc px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer" data-type="invoice" data-id="${inv.id}" data-num="${num}" title="View instant vector preview">
                            <i class="fa-solid fa-eye mr-1"></i> Preview
                          </button>
                          <button type="button" class="btn-download-doc px-3.5 py-1.5 rounded-xl bg-[#147D64] hover:bg-[#12694f] text-white text-xs font-bold transition-all cursor-pointer shadow-xs" data-type="invoice" data-id="${inv.id}" data-num="${num}" title="Generate authentic vector A4 PDF">
                            <i class="fa-solid fa-file-arrow-down mr-1"></i> Generate PDF
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }

    // Payment Receipts Section
    let paymentsSectionHtml = '';
    if (payments.length > 0) {
      paymentsSectionHtml = `
        <div class="space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-[#E3E9EF]">
            <h3 class="text-sm font-black text-[#172B36] flex items-center gap-2">
              <i class="fa-solid fa-receipt text-[#147D64]"></i>
              <span>Payment Receipts (Evidence of Payment)</span>
            </h3>
            <span class="text-[11px] font-bold text-slate-500">${payments.length} Receipts</span>
          </div>

          <!-- Mobile Cards -->
          <div class="md:hidden space-y-3">
            ${payments.map(p => {
              const num = p.receipt_number || p.receiptNumber || 'RCPT-1001';
              const date = p.payment_date || p.paymentDate || 'N/A';
              const method = p.payment_method || p.paymentMethod || 'Online';
              return `
                <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] shadow-xs space-y-3">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <span class="font-mono text-xs font-bold text-[#147D64]">${escapeHtml(num)}</span>
                      <div class="text-[11px] text-slate-500 font-mono mt-0.5">Paid: ${escapeHtml(date)}</div>
                    </div>
                    <div class="text-right">
                      <span class="text-sm font-black font-mono text-emerald-600 block">${formatCurrency(p.amount_cents || p.amountCents || 0, p.currency || "USD")}</span>
                      <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block mt-0.5">Confirmed</span>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button type="button" class="btn-preview-doc py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all" data-type="receipt" data-id="${p.id}" data-num="${num}">
                      <i class="fa-solid fa-eye text-[11px]"></i>
                      <span>Preview</span>
                    </button>
                    <button type="button" class="btn-download-doc py-2 rounded-xl bg-[#147D64] hover:bg-[#12694f] text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs" data-type="receipt" data-id="${p.id}" data-num="${num}">
                      <i class="fa-solid fa-download text-[11px]"></i>
                      <span>Download Receipt</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Desktop Table -->
          <div class="hidden md:block rounded-3xl bg-white border border-[#E3E9EF] overflow-hidden shadow-xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-600 min-w-[650px]">
                <thead class="bg-slate-50/80 border-b border-[#E3E9EF] text-[11px] uppercase font-bold text-slate-500">
                  <tr>
                    <th class="p-4">Receipt #</th>
                    <th class="p-4">Payment Date</th>
                    <th class="p-4">Payment Method</th>
                    <th class="p-4">Amount Paid</th>
                    <th class="p-4">Invoice Link</th>
                    <th class="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E3E9EF]">
                  ${payments.map(p => {
                    const num = p.receipt_number || p.receiptNumber || 'RCPT-1001';
                    return `
                      <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="p-4 font-mono font-bold text-[#147D64]">${escapeHtml(num)}</td>
                        <td class="p-4 text-slate-500 font-mono">${escapeHtml(p.payment_date || p.paymentDate || 'N/A')}</td>
                        <td class="p-4 uppercase text-[11px] text-slate-600 font-semibold">${escapeHtml(p.payment_method || p.paymentMethod || 'Online')}</td>
                        <td class="p-4 font-mono font-bold text-emerald-600">${formatCurrency(p.amount_cents || p.amountCents || 0, p.currency || "USD")}</td>
                        <td class="p-4 font-mono text-slate-500">${escapeHtml(p.invoice_number || '—')}</td>
                        <td class="p-4 text-right space-x-1.5">
                          <button type="button" class="btn-preview-doc px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer" data-type="receipt" data-id="${p.id}" data-num="${num}">
                            <i class="fa-solid fa-eye mr-1"></i> Preview
                          </button>
                          <button type="button" class="btn-download-doc px-3 py-1.5 rounded-xl bg-[#147D64] hover:bg-[#12694f] text-white text-xs font-bold transition-all cursor-pointer shadow-xs" data-type="receipt" data-id="${p.id}" data-num="${num}">
                            <i class="fa-solid fa-download mr-1"></i> PDF Receipt
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }

    let emptyNotice = '';
    if (invoices.length === 0 && payments.length === 0) {
      emptyNotice = `
        <div class="p-8 sm:p-12 rounded-3xl bg-white border border-[#E3E9EF] text-center space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            <i class="fa-solid fa-file-invoice"></i>
          </div>
          <div class="space-y-1">
            <h4 class="font-bold text-sm text-[#172B36]">No billing records published yet</h4>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">When Whiz Studio finance confirms and issues an official invoice for your marketing contract, it will appear here for instant preview and A4 PDF generation.</p>
          </div>
        </div>
      `;
    }

    list.innerHTML = `
      ${currencyCardsHtml}
      ${invoicesSectionHtml}
      ${paymentsSectionHtml}
      ${emptyNotice}
    `;

    // Wire actions
    list.querySelectorAll('.btn-preview-doc').forEach(btn => {
      btn.addEventListener('click', () => {
        handleDocumentAction(btn.dataset.type, btn.dataset.id, btn.dataset.num, true, btn);
      });
    });

    list.querySelectorAll('.btn-download-doc').forEach(btn => {
      btn.addEventListener('click', () => {
        handleDocumentAction(btn.dataset.type, btn.dataset.id, btn.dataset.num, false, btn);
      });
    });
  }

  // 6. In-Browser Pure Vector High-Fidelity PDF Generation Engine via WhizDocumentPdf & pdf-lib
  async function buildDocumentPdf(docData) {
    if (window.WhizDocumentPdf && typeof window.WhizDocumentPdf.compileWhizDocumentPdf === 'function') {
      return await window.WhizDocumentPdf.compileWhizDocumentPdf(docData);
    }
    if (typeof window.compileWhizDocumentPdf === 'function') {
      return await window.compileWhizDocumentPdf(docData);
    }
    throw new Error('WHIZ Document PDF Vector Engine unavailable. Please refresh the page.');
  }

  // 7. Document Action Handler (Preview vs Official Download)
  async function handleDocumentAction(type, id, number, isPreview = false, buttonEl = null) {
    const originalText = buttonEl ? buttonEl.innerHTML : '';
    if (buttonEl) {
      buttonEl.disabled = true;
      buttonEl.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
    }

    try {
      // CIF Verification Guard: If CIF incomplete, redirect to profile immediately!
      if (!isPreview && state.cif && !state.cif.isComplete) {
        switchTab('profile');
        const modalReq = document.getElementById('modalProfileRequired');
        if (modalReq) modalReq.classList.remove('hidden');
        showToast('Client Information Form (CIF) is incomplete. 100% profile completion required before PDF download.', 'error');
        return;
      }

      // Rule 8: If not preview, check daily quota
      if (!isPreview && state.receiptQuota && state.receiptQuota.remaining <= 0) {
        showToast("You have reached today's PDF generation limit (2/2). Allowance resets at midnight Dhaka time.", 'error');
        return;
      }

      let docData = null;

      if (isPreview) {
        // Free preview does NOT consume quota!
        const endpoint = type === 'receipt' ? `/pdf/data/receipt/${encodeURIComponent(number)}` : `/pdf/data/invoice/${encodeURIComponent(number)}`;
        const res = await apiFetch(endpoint);
        if (!res.ok || !res.data || !res.data.success) {
          throw new Error(res.data?.error || 'Failed to retrieve preview data.');
        }
        docData = res.data.data;

        // Compile PDF in browser memory
        const pdfBytes = await buildDocumentPdf(docData);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        const iframe = document.getElementById('previewDocIframe');
        const spinner = document.getElementById('previewLoadingSpinner');
        const title = document.getElementById('previewDocTitle');
        const modal = document.getElementById('modalDocumentPreview');
        const downloadBtn = document.getElementById('btnDownloadFromPreview');

        if (title) title.textContent = `${type === 'receipt' ? 'Receipt' : 'Invoice'} Preview: ${number}`;
        if (iframe) iframe.src = blobUrl;
        if (spinner) spinner.classList.add('hidden');
        if (downloadBtn) {
          downloadBtn.onclick = () => {
            closePreviewModal();
            handleDocumentAction(type, id, number, false, buttonEl);
          };
        }
        if (modal) modal.classList.remove('hidden');

      } else {
        // Official Issuance Workflow: Atomically enforced with Cloudflare D1
        const endpoint = type === 'receipt' ? '/pdf/authorize-receipt' : '/pdf/authorize-invoice';
        const idempotencyKey = `whiz_pdf_${type}_${number}_${Date.now()}`;
        const payload = type === 'receipt'
          ? { paymentId: id, receiptNumber: number, idempotencyKey }
          : { invoiceId: id, invoiceNumber: number, idempotencyKey };

        const authRes = await apiFetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (!authRes.ok || !authRes.data || !authRes.data.success) {
          if (authRes.data?.code === 'CIF_INCOMPLETE') {
            openCifModal();
            throw new Error(authRes.data.error || 'CIF profile must be 100% complete.');
          }
          throw new Error(authRes.data?.error || 'Authorization for PDF generation failed.');
        }

        docData = authRes.data.data;
        if (authRes.data.quota) {
          state.receiptQuota = authRes.data.quota;
          updateQuotaUi();
        }

        const pdfBytes = await buildDocumentPdf(docData);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `WhizStudio_${type === 'receipt' ? 'Receipt' : 'Invoice'}_${number}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(downloadUrl);

        showToast(`Official ${type === 'receipt' ? 'Receipt' : 'Invoice'} ${number} downloaded successfully!`, 'success');
      }
    } catch (err) {
      console.error('Document generation error:', err);
      showToast(err.message || 'Operation failed.', 'error');
    } finally {
      if (buttonEl) {
        buttonEl.disabled = false;
        buttonEl.innerHTML = originalText;
      }
    }
  }

  function closePreviewModal() {
    const modal = document.getElementById('modalDocumentPreview');
    if (modal) modal.classList.add('hidden');
    const iframe = document.getElementById('previewDocIframe');
    if (iframe) iframe.src = 'about:blank';
  }

  // Authentication Guard & Initializer
  let clientClerkAttempts = 0;
  async function checkAuthAndInit() {
    const authGuard = document.getElementById('clientAuthGuard');
    const mainLayout = document.getElementById('clientMainLayout');

    const urlParams = new URLSearchParams(window.location.search);
    const isPreview = urlParams.get('preview') === '1' || urlParams.get('preview') === 'true' || urlParams.get('demo') === '1' || (window.self !== window.top && urlParams.get('preview') !== '0');

    if (isPreview) {
      state.isPreview = true;
      const mockData = window.__whizClientMock ? (window.__whizClientMock.data || (typeof window.__whizClientMock.getData === 'function' ? window.__whizClientMock.getData() : null)) : null;
      const user = (mockData && mockData.user) || {
        id: 'usr_client_01',
        fullName: 'Sarah Jenkins',
        full_name: 'Sarah Jenkins',
        email: 'sarah@apexglobal.io',
        username: 'sarahjenkins',
        role: 'client',
        companyName: 'Apex Global Inc.',
        company_name: 'Apex Global Inc.',
        phone: '+1 (555) 349-2041',
        city: 'San Francisco',
        country: 'United States'
      };

      state.currentUser = user;
      state.clientProfile = user;

      const name = user.fullName;
      const email = user.email;

      document.querySelectorAll('.client-greeting-name').forEach(el => el.textContent = name);
      document.querySelectorAll('.clientDisplayName').forEach(el => el.textContent = name);
      document.querySelectorAll('.clientDisplayEmail').forEach(el => el.textContent = email);

      const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'SJ';
      document.querySelectorAll('.userAvatarText').forEach(el => el.textContent = initials);

      const setMail = document.getElementById('settingsEmail');
      if (setMail) setMail.textContent = email;
      const setAuth = document.getElementById('settingsAuthStatus');
      if (setAuth) setAuth.innerHTML = '<i class="fa-solid fa-shield-check text-[#087F70]"></i> Verified (Google & Email SSO)';

      if (authGuard) authGuard.classList.add('hidden');
      if (mainLayout) mainLayout.classList.remove('hidden');

      try {
        await loadCifProfile();
      } catch (cifErr) {
        console.warn('loadCifProfile non-fatal:', cifErr);
      }
      try {
        populateProfileForm(state.cif || state.clientProfile);
      } catch (profileErr) {
        console.warn('Non-fatal profile form population warning:', profileErr);
      }

      switchTab('overview');
      loadClientData();
      return;
    }

    if (!window.Clerk) {
      clientClerkAttempts++;
      if (clientClerkAttempts > 50) {
        console.error('Clerk SDK load timeout in client dashboard');
        if (authGuard) {
          authGuard.innerHTML = `
            <div class="mb-5 flex items-center justify-center">
              <img src="/assets/images/logo.png" alt="Whiz Studio" class="h-12 w-auto object-contain">
            </div>
            <h2 class="text-xl font-bold text-[#172B36] tracking-tight">Authentication Service Unavailable</h2>
            <p class="text-xs text-rose-500 mt-2 max-w-sm">Unable to connect to Clerk authentication services. Please verify your internet connection or disable tracking blockers.</p>
            <div class="mt-5 flex items-center justify-center gap-3">
              <button onclick="window.location.reload()" class="px-4 py-2 bg-[#147D64] text-white text-xs font-bold rounded-xl hover:bg-[#12694f] cursor-pointer">Retry Connection</button>
              <a href="/?login=client" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer">Return to Login</a>
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
        window.location.href = '/?login=client';
        return;
      }

      state.currentUser = user;

      // Sync/Fetch profile
      const res = await apiFetch('/portal/me');
      if (res.ok && res.data && res.data.success && res.data.data) {
        state.clientProfile = res.data.data.user;
      }

      const name = state.clientProfile?.fullName || state.clientProfile?.full_name || user.fullName || user.username || 'Client';
      const email = (state.clientProfile?.email || (user.primaryEmailAddress ? user.primaryEmailAddress.emailAddress : '')).toLowerCase();

      document.querySelectorAll('.client-greeting-name').forEach(el => el.textContent = name);
      document.querySelectorAll('.clientDisplayName').forEach(el => el.textContent = name);
      document.querySelectorAll('.clientDisplayEmail').forEach(el => el.textContent = email);

      const setMail = document.getElementById('settingsEmail');
      if (setMail) setMail.textContent = email;
      const setAuth = document.getElementById('settingsAuthStatus');
      if (setAuth) setAuth.innerHTML = '<i class="fa-solid fa-shield-check text-[#147D64]"></i> Verified (Google & Email SSO)';
      try {
        populateSettingsView();
      } catch (settingsErr) {
        console.warn('Non-fatal settings view population warning:', settingsErr);
      }
      try {
        await loadCifProfile();
      } catch (cifErr) {
        console.warn('loadCifProfile non-fatal:', cifErr);
      }

      try {
        populateProfileForm(state.cif || state.clientProfile);
      } catch (profileErr) {
        console.warn('Non-fatal profile form population warning:', profileErr);
      }

      const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CL';
      document.querySelectorAll('.userAvatarText').forEach(el => el.textContent = initials);

      // Check if user has administrative rights
      const role = (state.clientProfile?.role || '').toLowerCase();
      const isSuperAdmin = Boolean(state.clientProfile?.isSuperAdmin || role === 'super_admin' || role === 'owner' || email === 'kaziaremon@gmail.com');
      const isStaffUser = Boolean(state.clientProfile?.isStaff || isSuperAdmin || role === 'admin' || role === 'owner' || role === 'super_admin');

      if (isStaffUser) {
        const urlParams = new URLSearchParams(window.location.search);
        const isPreviewMode = urlParams.get('preview') === 'true';
        if (!isPreviewMode) {
          console.log('[Route Guard] Administrative user accessed client portal. Redirecting to admin dashboard...');
          window.location.replace('/admin/dashboard/');
          return;
        }
        // Explicit preview mode: reveal shortcuts
        const adminLink = document.getElementById('adminPortalLinkContainer');
        if (adminLink) adminLink.classList.remove('hidden');
        const mobileAdminLink = document.getElementById('mobileAdminPortalLinkContainer');
        if (mobileAdminLink) mobileAdminLink.classList.remove('hidden');
      }

      if (authGuard) authGuard.classList.add('hidden');
      if (mainLayout) mainLayout.classList.remove('hidden');

      switchTab('overview');
      loadClientData();
    } catch (err) {
      console.error('Client Auth Guard Error:', err);
      if (authGuard) {
        authGuard.innerHTML = `
          <div class="mb-5 flex items-center justify-center">
            <img src="/assets/images/logo.png" alt="Whiz Studio" class="h-12 w-auto object-contain">
          </div>
          <h2 class="text-xl font-bold text-[#172B36] tracking-tight">Workspace Initialization Failed</h2>
          <p class="text-xs text-rose-500 mt-2 max-w-sm">${escapeHtml(err.message || 'An unexpected error occurred while preparing your workspace.')}</p>
          <div class="mt-5 flex items-center justify-center gap-3">
            <button onclick="window.location.reload()" class="px-4 py-2 bg-[#147D64] text-white text-xs font-bold rounded-xl hover:bg-[#12694f] cursor-pointer">Retry</button>
            <a href="/?login=client" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer">Return to Login</a>
          </div>
        `;
      }
    }
  }


  // =========================================================================
  // CLIENT SUPPORT DESK DATA & HANDLERS
  // =========================================================================
  async function loadClientSupportTickets() {
    const container = document.getElementById('clientSupportTicketsContainer');
    if (!container) return;

    try {
      const res = await apiFetch('/portal/support/my');
      if (res.ok && res.data) {
        const tickets = Array.isArray(res.data.data) ? res.data.data : [];
        renderClientSupportTickets(tickets);
      } else {
        container.innerHTML = '<div class="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-500 italic">No support requests found.</div>';
      }
    } catch (e) {
      console.error('loadClientSupportTickets error:', e);
      container.innerHTML = '<div class="p-6 rounded-2xl bg-rose-50 text-center text-xs text-rose-500 font-medium">Failed to load support requests.</div>';
    }
  }

  function renderClientSupportTickets(tickets) {
    const container = document.getElementById('clientSupportTicketsContainer');
    if (!container) return;

    if (!tickets || tickets.length === 0) {
      container.innerHTML = '<div class="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-500 italic">No support requests submitted yet. Use the form above to reach our team.</div>';
      return;
    }

    const STATUS_BADGES = {
      open: '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">Open</span>',
      in_progress: '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200">In Progress</span>',
      resolved: '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>',
      closed: '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200">Closed</span>'
    };

    container.innerHTML = tickets.map(t => {
      const dateStr = t.created_at ? new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
      const badge = STATUS_BADGES[t.status] || STATUS_BADGES.open;

      return `
        <div class="p-4 rounded-2xl bg-slate-50 border border-[#E3E9EF] space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs text-[#172B36]">${escapeHtml(t.subject)}</span>
            ${badge}
          </div>
          <p class="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">${escapeHtml(t.message)}</p>
          ${t.admin_notes ? `
            <div class="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-900 mt-2 space-y-1">
              <div class="font-bold text-[10px] uppercase tracking-wider text-emerald-700">Team Response / Notes:</div>
              <div>${escapeHtml(t.admin_notes)}</div>
            </div>
          ` : ''}
          <div class="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200/60 flex items-center justify-between">
            <span>Ticket: ${escapeHtml(t.id)}</span>
            <span>Submitted: ${escapeHtml(dateStr)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function init() {
    // 1. Tab Switching Listeners (Desktop, Drawer, Bottom Bar)
    document.querySelectorAll('[data-client-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.clientTab);
        // Auto-close mobile drawer if open
        const drawer = document.getElementById('clientMobileDrawer');
        const backdrop = document.getElementById('clientMobileBackdrop');
        if (drawer && backdrop) {
          drawer.classList.add('-translate-x-full');
          backdrop.classList.add('hidden');
        }
      });
    });

    // 2. Mobile Drawer Controls with Body Scroll Locking
    const toggleBtn = document.getElementById('clientMobileToggleBtn');
    const closeBtn = document.getElementById('clientMobileCloseBtn');
    const drawer = document.getElementById('clientMobileDrawer');
    const backdrop = document.getElementById('clientMobileBackdrop');

    function openClientDrawer() {
      if (drawer && backdrop) {
        drawer.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
      }
    }

    function closeClientDrawer() {
      if (drawer && backdrop) {
        drawer.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
    }

    if (toggleBtn) toggleBtn.addEventListener('click', openClientDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeClientDrawer);
    if (backdrop) backdrop.addEventListener('click', closeClientDrawer);

    if (drawer) {
      drawer.querySelectorAll('[data-client-tab]').forEach(tabBtn => {
        tabBtn.addEventListener('click', closeClientDrawer);
      });
    }

    // Interactive Client Profile Dropdown Menu Wiring
    const userMenuBtn = document.getElementById('clientUserMenuBtn');
    const userDropdown = document.getElementById('clientUserAccountDropdown');
    const userChevron = document.getElementById('clientUserMenuChevron');

    function toggleClientDropdown() {
      if (!userDropdown) return;
      const isHidden = userDropdown.classList.contains('hidden');
      if (isHidden) {
        userDropdown.classList.remove('hidden');
        if (userChevron) userChevron.classList.add('rotate-180');
        if (userMenuBtn) userMenuBtn.setAttribute('aria-expanded', 'true');
      } else {
        closeClientDropdown();
      }
    }

    function closeClientDropdown() {
      if (!userDropdown) return;
      userDropdown.classList.add('hidden');
      if (userChevron) userChevron.classList.remove('rotate-180');
      if (userMenuBtn) userMenuBtn.setAttribute('aria-expanded', 'false');
    }

    if (userMenuBtn) {
      userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleClientDropdown();
      });
    }

    // Close on outside click & Escape key
    document.addEventListener('click', (e) => {
      if (userDropdown && !userDropdown.classList.contains('hidden')) {
        if (!userDropdown.contains(e.target) && !userMenuBtn?.contains(e.target)) {
          closeClientDropdown();
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeClientDropdown();
        closeClientDrawer();
      }
    });

    // Dropdown Navigation & Account Links (Priority 6)
    document.querySelectorAll('.client-dropdown-account-link, .client-dropdown-tab-link').forEach(link => {
      link.addEventListener('click', () => {
        closeClientDropdown();
        const action = link.dataset.clientAction;
        const tab = link.dataset.tab;
        if (action) {
          switchTab('settings');
        } else if (tab) {
          switchTab(tab);
        }
      });
    });

    // Mobile Subheader Refresh Button
    document.getElementById('btnRefreshClientDashboardMobile')?.addEventListener('click', async () => {
      const icon = document.getElementById('btnRefreshClientIconMobile');
      if (icon) icon.classList.add('fa-spin');
      try {
        await loadClientData();
        showToast('Portal synchronized successfully.', 'success');
      } catch (e) {
        showToast('Failed to refresh data.', 'error');
      } finally {
        if (icon) icon.classList.remove('fa-spin');
      }
    });

    // 3. Sign Out Buttons
    document.querySelectorAll('.btn-client-signout').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (state.refreshIntervalId) clearInterval(state.refreshIntervalId);
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

    // Wire Request Profile Update Action
    document.getElementById('btnRequestProfileUpdate')?.addEventListener('click', () => {
      switchTab('support');
      const subj = document.querySelector('#supportRequestForm input[name="subject"]');
      if (subj) subj.value = `Profile Information Update Request — ${state.currentUser?.fullName || 'Client'}`;
      const msg = document.querySelector('#supportRequestForm textarea[name="message"]');
      if (msg) {
        msg.value = 'Please describe the profile fields you would like our administrative team to update (e.g. phone, address, legal entity, tax ID):\n\n- Field to update:\n- New value:\n- Reason:';
        msg.focus();
      }
    });

    // Support Request Form Submit & Refresh
    document.getElementById('supportRequestForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const subject = f.subject.value.trim();
      const message = f.message.value.trim();
      const btn = document.getElementById('btnSubmitClientSupport');

      if (!subject || !message) {
        showToast('Please enter both subject and message.', 'warn');
        return;
      }

      setBtnLoading(btn, true, 'Sending...');
      const res = await apiFetch('/portal/support/submit', {
        method: 'POST',
        body: JSON.stringify({
          subject,
          message,
          email: state.currentUser?.email || (window.Clerk?.user?.primaryEmailAddress?.emailAddress) || '',
          fullName: state.currentUser?.fullName || (window.Clerk?.user?.fullName) || ''
        })
      });
      setBtnLoading(btn, false);

      if (res.ok && res.data?.success) {
        showToast('Support request submitted successfully! Our team will review it shortly.', 'success');
        f.reset();
        loadClientSupportTickets();
      } else {
        showToast(res.data?.error || 'Failed to submit request.', 'error');
      }
    });

    document.getElementById('btnRefreshClientSupport')?.addEventListener('click', () => {
      loadClientSupportTickets();
      showToast('Support history refreshed.', 'info');
    });

    // 4. Manual Live Refresh / Sync Button
    document.getElementById('btnRefreshClientDashboard')?.addEventListener('click', async () => {
      const icon = document.getElementById('btnRefreshClientIcon');
      if (icon) icon.classList.add('fa-spin');
      try {
        await loadClientData();
        showToast('Dashboard synchronized successfully.', 'success');
      } catch (e) {
        showToast('Failed to refresh data.', 'error');
      } finally {
        if (icon) icon.classList.remove('fa-spin');
      }
    });

    // 5. Automatic Revalidation & Bounded Polling (Phase 8: Free Tier Compliant)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !state.isRefreshing && state.currentUser) {
        loadClientData(true);
      }
    });

    window.addEventListener('focus', () => {
      if (!state.isRefreshing && state.currentUser) {
        loadClientData(true);
      }
    });

    if (state.refreshIntervalId) clearInterval(state.refreshIntervalId);
    state.refreshIntervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && !state.isRefreshing && state.currentUser) {
        loadClientData(true);
      }
    }, 25000);

    
    // Wire Client Profile Form (Section 3: My Profile & CIF)
    const formProfile = document.getElementById('formClientProfile');
    if (formProfile) {
      formProfile.addEventListener('submit', handleSaveClientProfile);
      formProfile.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', updateProfileFormProgress);
      });
    }

    const btnSaveProf = document.getElementById('btnSaveClientProfile');
    if (btnSaveProf) {
      btnSaveProf.addEventListener('click', handleSaveClientProfile);
    }

    // Close Profile Required modal
    document.getElementById('btnCloseProfileRequiredModal')?.addEventListener('click', () => {
      document.getElementById('modalProfileRequired')?.classList.add('hidden');
    });

    // Password Management Wiring (Requirement 8)
    const btnOpenPasswordModal = document.getElementById('btnOpenPasswordModal');
    const modalClientPassword = document.getElementById('modalClientPassword');
    const btnClosePasswordModal = document.getElementById('btnClosePasswordModal');
    const btnCancelPasswordModal = document.getElementById('btnCancelPasswordModal');
    const formClientPassword = document.getElementById('formClientPassword');
    const btnOpenClerkProfile = document.getElementById('btnOpenClerkSecurityProfile');

    if (btnOpenPasswordModal) {
      btnOpenPasswordModal.addEventListener('click', () => {
        updatePasswordUi();
        const errEl = document.getElementById('passwordErrorMsg');
        if (errEl) errEl.classList.add('hidden');
        if (formClientPassword) formClientPassword.reset();
        modalClientPassword?.classList.remove('hidden');
      });
    }

    const closePasswordModal = () => {
      modalClientPassword?.classList.add('hidden');
    };
    if (btnClosePasswordModal) btnClosePasswordModal.addEventListener('click', closePasswordModal);
    if (btnCancelPasswordModal) btnCancelPasswordModal.addEventListener('click', closePasswordModal);

    if (btnOpenClerkProfile) {
      btnOpenClerkProfile.addEventListener('click', () => {
        if (window.Clerk && typeof window.Clerk.openUserProfile === 'function') {
          window.Clerk.openUserProfile();
        } else {
          showToast('Clerk User Profile is loading. Please try again.', 'info');
        }
      });
    }

    if (formClientPassword) {
      formClientPassword.addEventListener('submit', async (e) => {
        e.preventDefault();
        const clerkUser = window.Clerk?.user;
        if (!clerkUser) {
          showToast('Authentication session not loaded.', 'error');
          return;
        }

        const inputCurr = document.getElementById('inputCurrentPassword');
        const inputNew = document.getElementById('inputNewPassword');
        const inputConfirm = document.getElementById('inputConfirmPassword');
        const errEl = document.getElementById('passwordErrorMsg');
        const submitBtn = document.getElementById('btnSubmitPassword');

        const currentPassword = inputCurr ? inputCurr.value : '';
        const newPassword = inputNew ? inputNew.value : '';
        const confirmPassword = inputConfirm ? inputConfirm.value : '';

        if (errEl) errEl.classList.add('hidden');

        if (newPassword.length < 8) {
          if (errEl) {
            errEl.textContent = 'New password must be at least 8 characters.';
            errEl.classList.remove('hidden');
          }
          return;
        }

        if (newPassword !== confirmPassword) {
          if (errEl) {
            errEl.textContent = 'Passwords do not match. Please verify.';
            errEl.classList.remove('hidden');
          }
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';
        }

        try {
          const hasPassword = Boolean(clerkUser.passwordEnabled);
          if (hasPassword) {
            if (!currentPassword) {
              throw new Error('Please enter your current password.');
            }
            await clerkUser.updatePassword({
              currentPassword,
              newPassword,
              signOutOfOtherSessions: false
            });
            showToast('Account password changed successfully!', 'success');
          } else {
            await clerkUser.createPassword({
              newPassword,
              signOutOfOtherSessions: false
            });
            showToast('Account password set successfully! You can now log in with email/password.', 'success');
          }

          closePasswordModal();
          updatePasswordUi();
        } catch (pwErr) {
          console.error('Password operation error:', pwErr);
          const msg = pwErr?.errors?.[0]?.message || pwErr.message || 'Failed to update password.';
          if (errEl) {
            errEl.textContent = msg;
            errEl.classList.remove('hidden');
          } else {
            showToast(msg, 'error');
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span id="btnSubmitPasswordText">Save Password</span>';
          }
        }
      });
    }

    checkAuthAndInit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
