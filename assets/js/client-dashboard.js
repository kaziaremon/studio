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
    if (tabId === 'support') loadClientSupportTickets();
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

  // 4. Client Information Form (CIF) & Daily Quota Management
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

    if (!card) return;

    const cif = state.cif || {};
    const percent = cif.completionPercentage || 0;
    const isComplete = cif.isComplete || percent === 100;
    const missing = cif.missingFields || [];

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
        btnAction.textContent = 'Edit CIF Profile';
        btnAction.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all shadow-xs cursor-pointer';
      }
    } else {
      if (icon) {
        icon.className = 'w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm';
        icon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
      }
      if (title) title.textContent = `CIF Profile Incomplete (${percent}%)`;
      if (desc) desc.textContent = `Complete all mandatory fields to unlock official PDF downloads.`;
      if (missingBox) {
        missingBox.classList.remove('hidden');
        if (missingList) missingList.textContent = missing.length > 0 ? missing.join(', ') : 'Mandatory invoice fields required';
      }
      if (btnAction) {
        btnAction.textContent = 'Complete CIF';
        btnAction.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-[#147D64] hover:bg-[#12694f] text-white transition-all shadow-xs cursor-pointer';
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
    if (countEl) countEl.textContent = `${totalRecords} Published Records (${invoices.length} Invoices, ${payments.length} Confirmed Payments)`;

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
                  <span class="text-[10px] uppercase font-bold text-slate-500">Balance Status</span>
                </div>
                <div class="space-y-1.5 text-xs">
                  <div class="flex justify-between">
                    <span class="text-slate-500">Total Invoiced:</span>
                    <span class="font-mono text-slate-700">${formatCurrency(c.totalInvoicedCents || 0, c.currency)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500">Confirmed Paid:</span>
                    <span class="font-bold text-emerald-600 font-mono">${formatCurrency(c.totalConfirmedPaidCents || c.totalPaidCents || 0, c.currency)}</span>
                  </div>
                  <div class="flex justify-between pt-1 border-t border-slate-100">
                    <span class="text-slate-600 font-semibold">Outstanding Balance:</span>
                    <span class="font-bold text-amber-600 font-mono">${formatCurrency(c.outstandingBalanceCents || 0, c.currency)}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    // Invoices HTML Table & Cards
    let invoicesSectionHtml = '';
    if (invoices.length > 0) {
      invoicesSectionHtml = `
        <div class="space-y-3 mb-8">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-black text-[#172B36] flex items-center gap-2">
              <i class="fa-solid fa-file-invoice text-[#147D64]"></i>
              <span>Invoices (Billing Documents)</span>
            </h3>
            <span class="text-[11px] font-bold text-slate-500">${invoices.length} Invoices</span>
          </div>

          <!-- Mobile Cards -->
          <div class="md:hidden space-y-3">
            ${invoices.map(inv => {
              const num = inv.invoice_number || 'INV-1001';
              const date = inv.issue_date || 'N/A';
              const isPaid = (inv.outstanding_balance_cents === 0) || inv.status === 'paid';
              return `
                <div class="p-4 rounded-2xl bg-white border border-[#E3E9EF] shadow-xs space-y-3">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <span class="font-mono text-xs font-bold text-[#172B36]">${escapeHtml(num)}</span>
                      <div class="text-[11px] text-slate-500 font-mono mt-0.5">Issued: ${escapeHtml(date)}</div>
                    </div>
                    <div class="text-right">
                      <span class="text-sm font-black font-mono text-[#172B36] block">${formatCurrency(inv.total_cents || 0, inv.currency || "USD")}</span>
                      <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'} inline-block mt-0.5">
                        ${isPaid ? 'Paid' : 'Due: ' + formatCurrency(inv.outstanding_balance_cents || 0, inv.currency || 'USD')}
                      </span>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button type="button" class="btn-preview-doc py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all" data-type="invoice" data-id="${inv.id}" data-num="${num}">
                      <i class="fa-solid fa-eye text-[11px]"></i>
                      <span>Preview</span>
                    </button>
                    <button type="button" class="btn-download-doc py-2 rounded-xl bg-[#147D64] hover:bg-[#12694f] text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs" data-type="invoice" data-id="${inv.id}" data-num="${num}">
                      <i class="fa-solid fa-download text-[11px]"></i>
                      <span>Download PDF</span>
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
                    <th class="p-4">Invoice #</th>
                    <th class="p-4">Issue Date</th>
                    <th class="p-4">Due Date</th>
                    <th class="p-4">Total Amount</th>
                    <th class="p-4">Status</th>
                    <th class="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E3E9EF]">
                  ${invoices.map(inv => {
                    const num = inv.invoice_number || 'INV-1001';
                    const isPaid = (inv.outstanding_balance_cents === 0) || inv.status === 'paid';
                    return `
                      <tr class="hover:bg-slate-50 transition-colors">
                        <td class="p-4 font-mono font-bold text-[#172B36]">${escapeHtml(num)}</td>
                        <td class="p-4 text-slate-500">${escapeHtml(inv.issue_date || 'N/A')}</td>
                        <td class="p-4 text-slate-500">${escapeHtml(inv.due_date || 'N/A')}</td>
                        <td class="p-4 font-mono font-bold text-[#172B36]">${formatCurrency(inv.total_cents || 0, inv.currency || "USD")}</td>
                        <td class="p-4">
                          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
                            ${isPaid ? 'Paid in Full' : 'Pending: ' + formatCurrency(inv.outstanding_balance_cents || 0, inv.currency || 'USD')}
                          </span>
                        </td>
                        <td class="p-4 text-right space-x-1.5">
                          <button type="button" class="btn-preview-doc px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer" data-type="invoice" data-id="${inv.id}" data-num="${num}">
                            <i class="fa-solid fa-eye mr-1"></i> Preview
                          </button>
                          <button type="button" class="btn-download-doc px-3 py-1.5 rounded-xl bg-[#147D64] hover:bg-[#12694f] text-white text-xs font-bold transition-all cursor-pointer shadow-xs" data-type="invoice" data-id="${inv.id}" data-num="${num}">
                            <i class="fa-solid fa-download mr-1"></i> PDF Invoice
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

    // Payment Receipts HTML Table & Cards
    let paymentsSectionHtml = '';
    if (payments.length > 0) {
      paymentsSectionHtml = `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
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
                  <div class="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span class="text-[10px] uppercase font-bold text-slate-400">Payment Method</span>
                    <span class="uppercase text-slate-700 font-semibold">${escapeHtml(method)}</span>
                  </div>
                  <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button type="button" class="btn-preview-doc py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all" data-type="receipt" data-id="${p.id}" data-num="${num}">
                      <i class="fa-solid fa-eye text-[11px]"></i>
                      <span>Preview</span>
                    </button>
                    <button type="button" class="btn-download-doc py-2 rounded-xl bg-[#147D64] hover:bg-[#12694f] text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs" data-type="receipt" data-id="${p.id}" data-num="${num}">
                      <i class="fa-solid fa-download text-[11px]"></i>
                      <span>Download PDF</span>
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
                      <tr class="hover:bg-slate-50 transition-colors">
                        <td class="p-4 font-mono font-bold text-[#147D64]">${escapeHtml(num)}</td>
                        <td class="p-4 text-slate-500">${escapeHtml(p.payment_date || p.paymentDate || 'N/A')}</td>
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
        <div class="p-8 rounded-2xl bg-white border border-[#E3E9EF] text-center text-xs text-slate-500 space-y-2">
          <i class="fa-solid fa-file-invoice-dollar text-3xl text-slate-300 block mb-2"></i>
          <p class="font-bold text-[#172B36]">No billing records published yet.</p>
          <p class="text-[11px] text-slate-400">Contracts and invoices confirmed by Whiz Studio finance will appear here for PDF download.</p>
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

  // 6. In-Browser High-Fidelity PDF Generation Engine via pdf-lib
  // Uses authentic Whiz Studio clean master template with zero server binary storage
  async function buildDocumentPdf(docData) {
    if (!window.PDFLib) {
      throw new Error('PDF generation engine unavailable.');
    }

    const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
    const pdfDoc = await PDFDocument.create();
    
    // A4 Size in points: 595.44 x 842.16
    const page = pdfDoc.addPage([595.44, 842.16]);
    const { width, height } = page.getSize();

    // Scale factors from 2481 x 3509 master image
    const toPdfX = (imgX) => (imgX / 2481) * width;
    const toPdfY = (imgY) => height - ((imgY / 3509) * height);

    // Pick appropriate template
    const isReceipt = docData.documentType === 'receipt';
    const templateUrl = isReceipt
      ? '/assets/images/receipt-master-template-clean-2481x3509.png'
      : '/assets/images/invoice-master-template-clean-2481x3509.png';

    try {
      const templateBytes = await fetch(templateUrl).then(r => {
        if (!r.ok) throw new Error(`Failed to load template ${templateUrl}`);
        return r.arrayBuffer();
      });
      const bgImg = await pdfDoc.embedPng(templateBytes);
      page.drawImage(bgImg, { x: 0, y: 0, width, height });
    } catch (e) {
      console.warn('Fallback template embed:', e);
      // Fallback: load invoice template if receipt template 404
      const fallbackBytes = await fetch('/assets/images/invoice-master-template-clean-2481x3509.png').then(r => r.arrayBuffer());
      const bgImg = await pdfDoc.embedPng(fallbackBytes);
      page.drawImage(bgImg, { x: 0, y: 0, width, height });
    }

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Brand Colors
    const tealColor = rgb(43/255, 138/255, 121/255); // #2B8A79
    const darkColor = rgb(34/255, 34/255, 34/255);   // #222222
    const mutedColor = rgb(100/255, 100/255, 100/255); // #666666

    // Text wrapping helper
    function wrapAddress(text, maxChars = 38) {
      if (!text) return [];
      const words = String(text).split(' ');
      const lines = [];
      let current = '';
      for (const w of words) {
        if ((current + ' ' + w).trim().length > maxChars) {
          if (current) lines.push(current.trim());
          current = w;
        } else {
          current = (current + ' ' + w).trim();
        }
      }
      if (current) lines.push(current.trim());
      return lines;
    }

    // 1. If Receipt: Draw "RECEIPT" title and "Client Copy" in top right
    if (isReceipt) {
      page.drawText('RECEIPT', {
        x: toPdfX(1383),
        y: toPdfY(450),
        size: 38,
        font: fontBold,
        color: tealColor
      });
      page.drawText('Official Payment Confirmation', {
        x: toPdfX(1410),
        y: toPdfY(560),
        size: 11,
        font: fontBold,
        color: darkColor
      });
    }

    // 2. BILLED TO (Left Column)
    const client = docData.client || {};
    const clientName = client.billingName || client.fullName || 'Valued Client';
    page.drawText(clientName, {
      x: toPdfX(252),
      y: toPdfY(840),
      size: 12.5,
      font: fontBold,
      color: darkColor
    });

    const fullAddr = [client.billingAddress, client.city, client.country].filter(Boolean).join(', ');
    const addrLines = wrapAddress(fullAddr, 40);
    let addrY = 905;
    addrLines.slice(0, 4).forEach((line, idx) => {
      const prefix = idx === 0 ? 'Address: ' : '';
      page.drawText(prefix + line, {
        x: toPdfX(252),
        y: toPdfY(addrY),
        size: 9.5,
        font: idx === 0 ? fontBold : fontRegular,
        color: darkColor
      });
      addrY += 65;
    });

    if (client.phone) {
      page.drawText(`Phone Number: ${client.phone}`, {
        x: toPdfX(252),
        y: toPdfY(1185),
        size: 9.5,
        font: fontBold,
        color: darkColor
      });
    }

    // 3. Right Details Block (Right-aligned to edge 2238)
    const rightEdgeX = toPdfX(2238);
    const numLabel = isReceipt ? 'RECEIPT NO: ' : 'INVOICE NO: ';
    const docNumber = isReceipt ? (docData.receiptNumber || 'RCPT-1001') : (docData.invoiceNumber || 'INV-1001');

    const numValW = fontRegular.widthOfTextAtSize(docNumber, 10.5);
    const numLabelW = fontBold.widthOfTextAtSize(numLabel, 10.5);

    page.drawText(docNumber, {
      x: rightEdgeX - numValW,
      y: toPdfY(745),
      size: 10.5,
      font: fontRegular,
      color: darkColor
    });
    page.drawText(numLabel, {
      x: rightEdgeX - numValW - numLabelW,
      y: toPdfY(745),
      size: 10.5,
      font: fontBold,
      color: tealColor
    });

    // Date
    const rawDate = isReceipt ? (docData.paymentDate || docData.generatedAt) : (docData.issueDate || docData.generatedAt);
    let formattedDate = rawDate;
    try {
      formattedDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(rawDate));
    } catch (_) {}
    const dateW = fontRegular.widthOfTextAtSize(formattedDate, 10.5);
    page.drawText(formattedDate, {
      x: rightEdgeX - dateW,
      y: toPdfY(835),
      size: 10.5,
      font: fontRegular,
      color: darkColor
    });

    // PAYMENT TYPE
    const pTypeLabel = 'PAYMENT TYPE';
    const pTypeLabelW = fontBold.widthOfTextAtSize(pTypeLabel, 9.5);
    page.drawText(pTypeLabel, {
      x: rightEdgeX - pTypeLabelW,
      y: toPdfY(910),
      size: 9.5,
      font: fontBold,
      color: tealColor
    });

    const pTypeVal = docData.serviceName || 'Digital Agency Services';
    const pTypeValW = fontRegular.widthOfTextAtSize(pTypeVal, 10);
    page.drawText(pTypeVal, {
      x: rightEdgeX - pTypeValW,
      y: toPdfY(1000),
      size: 10,
      font: fontRegular,
      color: darkColor
    });

    // PAYMENT METHOD
    const pMethodLabel = 'PAYMENT METHOD';
    const pMethodLabelW = fontBold.widthOfTextAtSize(pMethodLabel, 9.5);
    page.drawText(pMethodLabel, {
      x: rightEdgeX - pMethodLabelW,
      y: toPdfY(1090),
      size: 9.5,
      font: fontBold,
      color: tealColor
    });

    const pMethodVal = docData.paymentMethod || 'Bank Transfer';
    const pMethodValW = fontRegular.widthOfTextAtSize(pMethodVal, 10.5);
    page.drawText(pMethodVal, {
      x: rightEdgeX - pMethodValW,
      y: toPdfY(1170),
      size: 10.5,
      font: fontRegular,
      color: darkColor
    });

    // Payment Account Details
    const accConfig = docData.paymentAccountDetails || {};
    const accLabel = 'Account Details -';
    const accLabelW = fontRegular.widthOfTextAtSize(accLabel, 9);
    page.drawText(accLabel, {
      x: rightEdgeX - accLabelW,
      y: toPdfY(1240),
      size: 9,
      font: fontRegular,
      color: mutedColor
    });

    const accName = accConfig.accountName || 'Md Kazi Abdur Rahim Emon';
    const accNameW = fontRegular.widthOfTextAtSize(accName, 9.5);
    page.drawText(accName, {
      x: rightEdgeX - accNameW,
      y: toPdfY(1305),
      size: 9.5,
      font: fontRegular,
      color: darkColor
    });

    const accNumStr = accConfig.accountNumber ? `Phone / A/C: ${accConfig.accountNumber}` : (docData.paymentReference ? `Ref: ${docData.paymentReference}` : 'Verified Ledger Record');
    const accNumW = fontRegular.widthOfTextAtSize(accNumStr, 9);
    page.drawText(accNumStr, {
      x: rightEdgeX - accNumW,
      y: toPdfY(1375),
      size: 9,
      font: fontRegular,
      color: darkColor
    });

    // 4. Line Items Table
    const items = (docData.items && docData.items.length > 0) ? docData.items : [{
      description: docData.serviceName || 'Retainer Services',
      quantity: 1,
      unitPriceCents: isReceipt ? docData.amountPaidCents : docData.totalCents,
      totalCents: isReceipt ? docData.amountPaidCents : docData.totalCents
    }];

    const firstItem = items[0];
    const itemDescLines = wrapAddress(firstItem.description || 'Agency Services', 35);
    let descY = 1850;
    itemDescLines.slice(0, 2).forEach(line => {
      page.drawText(line, {
        x: toPdfX(289),
        y: toPdfY(descY),
        size: 9.5,
        font: fontRegular,
        color: darkColor
      });
      descY += 50;
    });

    const qtyStr = String(firstItem.quantity || 1);
    const qtyW = fontRegular.widthOfTextAtSize(qtyStr, 9.5);
    page.drawText(qtyStr, {
      x: toPdfX(1236) - qtyW / 2,
      y: toPdfY(1875),
      size: 9.5,
      font: fontRegular,
      color: darkColor
    });

    const rateVal = ((firstItem.unitPriceCents || firstItem.totalCents || 0) / 100).toFixed(2);
    const rateW = fontRegular.widthOfTextAtSize(rateVal, 9.5);
    page.drawText(rateVal, {
      x: toPdfX(1614) - rateW / 2,
      y: toPdfY(1875),
      size: 9.5,
      font: fontRegular,
      color: darkColor
    });

    const lineTotalVal = ((firstItem.totalCents || 0) / 100).toFixed(2);
    const lineTotalW = fontRegular.widthOfTextAtSize(lineTotalVal, 9.5);
    page.drawText(lineTotalVal, {
      x: toPdfX(2100) - lineTotalW,
      y: toPdfY(1875),
      size: 9.5,
      font: fontRegular,
      color: darkColor
    });

    // 5. TOTAL Row
    const grandTotalCents = isReceipt ? (docData.amountPaidCents || 0) : (docData.totalCents || 0);
    const curr = docData.currency || 'USD';
    const totalFormatted = `${curr} ${(grandTotalCents / 100).toFixed(2)}`;
    const totalFormattedW = fontBold.widthOfTextAtSize(totalFormatted, 11);
    page.drawText(totalFormatted, {
      x: toPdfX(2100) - totalFormattedW,
      y: toPdfY(2090),
      size: 11,
      font: fontBold,
      color: tealColor
    });

    return await pdfDoc.save();
  }

  // 7. Document Action Handler (Preview vs Official Download)
  async function handleDocumentAction(type, id, number, isPreview = false, buttonEl = null) {
    const originalText = buttonEl ? buttonEl.innerHTML : '';
    if (buttonEl) {
      buttonEl.disabled = true;
      buttonEl.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
    }

    try {
      // Rule 4: If not preview, check CIF completion first!
      if (!isPreview && state.cif && !state.cif.isComplete) {
        openCifModal();
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
        if (window.Clerk) {
          await window.Clerk.signOut();
        }
        window.location.href = '/';
      });
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
        body: JSON.stringify({ subject, message })
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

    checkAuthAndInit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
