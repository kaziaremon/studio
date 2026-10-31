/**
 * WHIZ STUDIO — FULL-PAGE CLIENT DASHBOARD CONTROLLER (v2 Enterprise)
 * Technology: Clerk JS SDK, Cloudflare D1 Backend API, Tailwind CSS, pdf-lib
 * Route: /client/dashboard | Free-Tier Architecture ($0 Cost)
 */

(function () {
  'use strict';

  const CLERK_PUBLISHABLE_KEY = window.__CLERK_PUBLISHABLE_KEY__ || 'pk_test_cG9ldGljLWxpZ2VyLTQzNTUuY2xlcmsuYWNjb3VudHMuZGV2JA';
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
    overallProgress: 0,
    organizations: [],
    selectedOrganizationId: null,
    completionChart: null,
    refreshIntervalId: null,
    isRefreshing: false
  };

  async function apiFetch(endpoint, options = {}) {
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
    const tabs = ['overview', 'services', 'tasks', 'finance', 'support', 'settings'];
    tabs.forEach(t => {
      const el = document.getElementById(`view_${t}`);
      if (el) {
        if (t === tabId) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });

    // Update Desktop, Drawer, and Bottom Navigation tabs
    document.querySelectorAll('[data-client-tab]').forEach(btn => {
      const isTarget = btn.dataset.clientTab === tabId;
      if (btn.closest('nav.lg\\:hidden')) {
        // Bottom bar styling
        if (isTarget) {
          btn.classList.add('text-brand-whiz');
          btn.classList.remove('text-slate-500');
        } else {
          btn.classList.remove('text-brand-whiz');
          btn.classList.add('text-slate-500');
        }
      } else {
        // Desktop and Drawer sidebar buttons
        if (isTarget) {
          btn.classList.add('bg-brand-whiz/15', 'text-brand-whiz', 'border-brand-whiz/30');
          btn.classList.remove('text-slate-500', 'border-transparent');
        } else {
          btn.classList.remove('bg-brand-whiz/15', 'text-brand-whiz', 'border-brand-whiz/30');
          btn.classList.add('text-slate-500', 'border-transparent');
        }
      }
    });

    const labels = {
      overview: 'Campaign Overview',
      services: 'My Active Services',
      tasks: 'Deliverables Progress',
      finance: 'Billing & Receipts',
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
  }

  // Load All Workspace Data
  async function loadClientData(isSilent = false) {
    state.isRefreshing = true;
    try {
      const overviewRes = await apiFetch('/portal/client-overview');
      if (overviewRes.ok && overviewRes.data && overviewRes.data.success && overviewRes.data.data) {
        const d = overviewRes.data.data;
        state.services = d.activeServices || d.services || [];
        state.projects = d.activeProjects || d.projects || [];
        state.payments = d.recentPayments || d.payments || [];
        state.invoices = d.invoices || [];
        state.finance = d.finance || null;
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
    if (statInv) statInv.textContent = state.payments.length || state.invoices.length;

    // Overall Progress Badge & Donut Chart
    const progressBadge = document.getElementById('clientOverallProgressBadge');
    if (progressBadge) progressBadge.textContent = `${state.overallProgress}%`;

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
        <div class="p-6 sm:p-8 rounded-2xl bg-slate-50 border border-[#E3E9EF] text-center text-xs text-slate-500 space-y-2">
          <i class="fa-solid fa-shapes text-2xl text-slate-600 block mb-1"></i>
          <p>No active marketing services attached to your organization yet.</p>
          <a href="/#services" class="inline-block mt-2 px-3 py-1.5 rounded-lg bg-brand-whiz/20 text-brand-whiz hover:bg-brand-whiz/30 font-semibold transition-all">
            Browse Service Catalog
          </a>
        </div>
      `;
    } else {
      list.innerHTML = state.services.map(s => {
        const progress = Math.round(Number(s.progress_percent || s.progressPercent || 0));
        const price = formatCurrency(s.price_cents || s.priceCents || 0, s.currency || primaryCurr);
        return `
          <div class="p-4 sm:p-5 rounded-2xl bg-white border border-[#E3E9EF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-brand-whiz/40 hover:shadow-xs transition-all">
            <div class="flex items-center space-x-3.5 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-brand-whiz/15 text-brand-whiz border border-brand-whiz/30 flex items-center justify-center font-bold text-sm shrink-0">
                <i class="fa-solid fa-bolt"></i>
              </div>
              <div class="min-w-0">
                <h4 class="text-xs sm:text-sm font-bold text-[#172B36] truncate">${escapeHtml(s.service_name || s.serviceName || 'Agency Service')}</h4>
                <p class="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>Status: <strong class="text-emerald-700 uppercase">${escapeHtml(s.status || 'Active')}</strong></span>
                  <span>•</span>
                  <span>Tier: <strong class="text-slate-600">${escapeHtml(s.package_name || s.packageName || 'Standard Retainer')}</strong></span>
                  <span>•</span>
                  <span>Progress: <strong class="text-brand-whiz font-mono">${progress}%</strong></span>
                </p>
              </div>
            </div>
            <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E3E9EF]">
              <span class="text-xs sm:text-sm font-mono font-bold text-[#172B36]">${price}</span>
              <button type="button" data-client-tab="services" class="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-[#EAF7F1] text-[#172B36] hover:text-brand-whiz text-[11px] font-semibold transition-all border border-[#E3E9EF] cursor-pointer">
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
                <h4 class="text-sm sm:text-base font-bold text-[#172B36]">${escapeHtml(s.service_name || s.serviceName || 'Marketing Service')}</h4>
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
        <div class="p-8 rounded-2xl bg-white border border-[#E3E9EF] text-center text-xs text-slate-500 space-y-2">
          <i class="fa-solid fa-list-check text-2xl text-slate-600 block mb-1"></i>
          <p>No active project campaigns provisioned yet.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = state.projects.map(p => {
      const progress = Math.min(100, Math.max(0, Math.round(Number(p.progress_percent || p.progressPercent || 0))));
      const completed = Number(p.completedTasksCount || 0);
      const total = Number(p.totalTasksCount || 0);
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
        </div>
      `;
    }).join('');
  }

  // 4. Render Finance, Multi-Currency Ledger & Invoices
  function renderFinanceReceipts() {
    const list = document.getElementById('financeFullList');
    const countEl = document.getElementById('financeReceiptsCount');
    const records = state.payments.length > 0 ? state.payments : state.invoices;
    if (countEl) countEl.textContent = `${records.length} Records`;
    if (!list) return;

    // Multi-Currency Breakdown Cards
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
                  <span class="text-[10px] uppercase font-bold text-slate-500">Currency Summary</span>
                </div>
                <div class="space-y-1.5 text-xs">
                  <div class="flex justify-between">
                    <span class="text-slate-500">Contract Value:</span>
                    <span class="font-bold text-[#172B36] font-mono">${formatCurrency(c.contractValueCents || 0, c.currency)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500">Total Invoiced:</span>
                    <span class="font-mono text-slate-700">${formatCurrency(c.totalInvoicedCents || 0, c.currency)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500">Confirmed Paid:</span>
                    <span class="font-bold text-emerald-600 font-mono">${formatCurrency(c.totalConfirmedPaidCents || 0, c.currency)}</span>
                  </div>
                  <div class="flex justify-between pt-1 border-t border-slate-100">
                    <span class="text-slate-600 font-semibold">Outstanding Due:</span>
                    <span class="font-bold text-amber-600 font-mono">${formatCurrency(c.outstandingBalanceCents || 0, c.currency)}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    if (records.length === 0) {
      list.innerHTML = `
        ${currencyCardsHtml}
        <div class="p-8 rounded-2xl bg-white border border-[#E3E9EF] text-center text-xs text-slate-500 space-y-2">
          <i class="fa-solid fa-file-invoice-dollar text-2xl text-slate-400 block mb-1"></i>
          <p>No individual payment transactions or invoices published yet.</p>
          <p class="text-[11px] text-slate-400">Your provisioned service contract amounts are recorded in the ledger above.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = `
      ${currencyCardsHtml}
      <!-- Mobile Cards (Table-to-Card Pattern, md:hidden) -->
      <div class="md:hidden space-y-3">
        ${records.map(r => {
          const num = r.receipt_number || r.receiptNumber || r.invoice_number || 'INV-1001';
          const date = r.payment_date || r.paymentDate || r.issue_date || 'N/A';
          const paymentId = r.id;
          return `
            <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] shadow-xs space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span class="font-mono text-xs font-bold text-[#147D64]">${escapeHtml(num)}</span>
                  <div class="text-[11px] text-slate-500 font-mono mt-0.5">${escapeHtml(date)}</div>
                </div>
                <div class="text-right">
                  <span class="text-sm font-black font-mono text-[#147D64] block">${formatCurrency((r.amount_cents || r.amountCents || r.total_cents || r.totalCents || 0), r.currency || "USD")}</span>
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block mt-0.5">Paid</span>
                </div>
              </div>

              <div class="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span class="text-[10px] uppercase font-bold text-slate-400">Payment Method</span>
                <span class="uppercase text-slate-700 font-semibold">${escapeHtml(r.payment_method || r.paymentMethod || 'Online')}</span>
              </div>

              <div class="pt-2 border-t border-slate-100">
                <button type="button" class="btn-download-client-receipt w-full py-2.5 rounded-xl bg-[#147D64]/10 hover:bg-[#147D64]/20 text-[#147D64] border border-[#147D64]/30 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs" data-payment-id="${paymentId}" data-receipt-num="${num}">
                  <i class="fa-solid fa-file-arrow-down text-xs"></i>
                  <span>Download PDF Receipt</span>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Desktop Table (hidden md:block) -->
      <div class="hidden md:block rounded-3xl bg-white border border-[#E3E9EF] overflow-hidden shadow-xs">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600 min-w-[650px]">
            <thead class="bg-slate-50/80 border-b border-[#E3E9EF] text-[11px] uppercase font-bold text-slate-500">
              <tr>
                <th class="p-4">Receipt / Invoice #</th>
                <th class="p-4">Date</th>
                <th class="p-4">Amount</th>
                <th class="p-4">Method</th>
                <th class="p-4">Status</th>
                <th class="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E3E9EF]">
              ${records.map(r => {
                const num = r.receipt_number || r.receiptNumber || r.invoice_number || 'INV-1001';
                const date = r.payment_date || r.paymentDate || r.issue_date || 'N/A';
                const paymentId = r.id;
                return `
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="p-4 font-mono font-bold text-[#172B36]">${escapeHtml(num)}</td>
                    <td class="p-4 text-slate-500">${escapeHtml(date)}</td>
                    <td class="p-4 font-mono font-bold text-emerald-600">${formatCurrency((r.amount_cents || r.amountCents || r.total_cents || r.totalCents || 0), r.currency || "USD")}</td>
                    <td class="p-4 uppercase text-[11px] text-slate-500">${escapeHtml(r.payment_method || r.paymentMethod || 'Online')}</td>
                    <td class="p-4">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Paid
                      </span>
                    </td>
                    <td class="p-4 text-right">
                      <button type="button" class="btn-download-client-receipt px-3 py-1.5 rounded-xl bg-brand-whiz/15 hover:bg-brand-whiz/25 text-brand-whiz border border-brand-whiz/30 text-xs font-bold transition-all cursor-pointer shadow-xs" data-payment-id="${paymentId}" data-receipt-num="${num}">
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
    `;

    // Wire PDF Download buttons
    list.querySelectorAll('.btn-download-client-receipt').forEach(btn => {
      btn.addEventListener('click', () => {
        downloadPdfReceipt(btn.dataset.paymentId, btn.dataset.receiptNum, btn);
      });
    });
  }

  // 5. In-Browser PDF Receipt Generation via pdf-lib (100% Free, Zero Server Storage)
  // Exact High-Fidelity Reproduction of Official Whiz Studio Stationery
  async function downloadPdfReceipt(paymentId, receiptNum, buttonEl) {
    if (!buttonEl) return;
    const originalText = buttonEl.innerHTML;
    buttonEl.disabled = true;
    buttonEl.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Generating...';

    try {
      // 1. Authorize receipt with Cloudflare D1 Authority
      const authRes = await apiFetch('/pdf/authorize-receipt', {
        method: 'POST',
        body: JSON.stringify({ paymentId })
      });

      if (!authRes.ok || !authRes.data || !authRes.data.success) {
        throw new Error(authRes.data?.error || 'Authorization for receipt generation failed.');
      }

      const receiptData = authRes.data.data;
      if (!window.PDFLib) {
        throw new Error('PDF generation engine unavailable.');
      }

      // 2. Compile Vector PDF in Browser Memory
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
      } catch (imgErr) {
        console.warn('Image embedding fallback:', imgErr);
      }

      // 2. Top-Right Title & Client Copy
      page.drawText('RECEIPT', {
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

      // 3. BILLED TO (Left) & Metadata (Right)
      let leftY = height - 160;
      page.drawText('BILLED TO:', {
        x: 50,
        y: leftY,
        size: 10,
        font: fontBold,
        color: tealPrimary
      });

      leftY -= 15;
      page.drawText(receiptData.client?.name || receiptData.client?.companyName || 'Valued Client', {
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

      const addressText = receiptData.client?.address || 'Dhaka, Bangladesh';
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
      page.drawText(receiptData.client?.phone || '+880...', {
        x: 120,
        y: currAddrY,
        size: 8.5,
        font: fontRegular,
        color: textDark
      });

      // Right Column
      const rightX = width - 210;
      let rightY = height - 160;

      const numLabel = 'RECEIPT NO: ';
      page.drawText(numLabel, {
        x: rightX,
        y: rightY,
        size: 10,
        font: fontBold,
        color: tealPrimary
      });
      page.drawText(String(receiptData.receiptNumber || receiptNum || '829926'), {
        x: rightX + fontBold.widthOfTextAtSize(numLabel, 10),
        y: rightY,
        size: 10,
        font: fontBold,
        color: textDark
      });

      rightY -= 14;
      page.drawText(receiptData.paymentDate || new Date().toISOString().split('T')[0], {
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
      page.drawText(receiptData.service?.name || 'Growth Retainer', {
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
      page.drawText((receiptData.paymentMethod || 'Bkash').toUpperCase(), {
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
      page.drawText('Md Kazi Abdur Rahim Emon', {
        x: rightX,
        y: rightY,
        size: 8.5,
        font: fontRegular,
        color: textDark
      });
      rightY -= 11;
      page.drawText('Phone Number: +880 1560066374', {
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

      const totalVal = Math.round((receiptData.amountCents || 250000) / 100);

      let itemY = tableY - 22;
      page.drawText(receiptData.service?.name || 'Retainer Marketing & Growth Engineering', {
        x: 55,
        y: itemY,
        size: 9,
        font: fontRegular,
        color: textDark
      });
      page.drawText('1', {
        x: 295,
        y: itemY,
        size: 9,
        font: fontRegular,
        color: textDark
      });
      page.drawText(String(totalVal), {
        x: 385,
        y: itemY,
        size: 9,
        font: fontRegular,
        color: textDark
      });
      page.drawText(String(totalVal), {
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
      page.drawText(String(totalVal), {
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

      // 6. Trigger Browser Download
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `WhizStudio_Receipt_${receiptData.receiptNumber || receiptNum}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);

      showToast(`Receipt ${receiptNum} downloaded successfully!`, 'success');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      showToast(err.message || 'Failed to download receipt.', 'error');
    } finally {
      buttonEl.disabled = false;
      buttonEl.innerHTML = originalText;
    }
  }

  // Authentication Guard & Initializer
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
      const setClerk = document.getElementById('settingsClerkId');
      if (setClerk) setClerk.textContent = user.id;

      const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CL';
      document.querySelectorAll('.userAvatarText').forEach(el => el.textContent = initials);

      // Check if user has administrative rights
      const role = state.clientProfile?.role;
      const isSuperAdmin = state.clientProfile?.isSuperAdmin || (email === 'kaziaremon@gmail.com');
      if (role === 'owner' || role === 'admin' || role === 'super_admin' || isSuperAdmin) {
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
      window.location.href = '/?login=client';
    }
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

    // Dropdown Navigation Links
    document.querySelectorAll('.client-dropdown-tab-link').forEach(link => {
      link.addEventListener('click', () => {
        closeClientDropdown();
        switchTab(link.dataset.tab);
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
        if (window.Clerk) {
          await window.Clerk.signOut();
        }
        window.location.href = '/';
      });
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

    checkAuthAndInit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
