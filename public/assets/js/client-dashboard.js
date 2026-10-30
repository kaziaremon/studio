/**
 * WHIZ STUDIO — FULL-PAGE CLIENT DASHBOARD CONTROLLER (v2 Enterprise)
 * Technology: Clerk JS SDK, Cloudflare D1 Backend API, Tailwind CSS, pdf-lib
 * Route: /client/dashboard | Free-Tier Architecture ($0 Cost)
 */

(function () {
  'use strict';

  const CLERK_PUBLISHABLE_KEY = window.__CLERK_PUBLISHABLE_KEY__ || 'pk_test_cG9ldGljLWxpZ2VyLTQzNTUuY2xlcmsuYWNjb3VudHMuZGV2JA';
  const API_BASE = 'https://whiz-api.kaziaremon.workers.dev/api/v1';

  const state = {
    currentUser: null,
    clientProfile: null,
    activeTab: 'overview',
    services: [],
    projects: [],
    invoices: [],
    payments: []
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

  function showToast(message, type = 'info') {
    const existing = document.getElementById('clientGlobalToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'clientGlobalToast';
    const bgClass = type === 'error' ? 'bg-rose-950/90 border-rose-500/50 text-rose-200' :
                    type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' :
                    'bg-slate-900/90 border-slate-700 text-slate-200';
    const icon = type === 'error' ? 'fa-triangle-exclamation text-rose-400' :
                 type === 'success' ? 'fa-circle-check text-emerald-400' :
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
          btn.classList.remove('text-slate-400');
        } else {
          btn.classList.remove('text-brand-whiz');
          btn.classList.add('text-slate-400');
        }
      } else {
        // Desktop and Drawer sidebar buttons
        if (isTarget) {
          btn.classList.add('bg-brand-whiz/15', 'text-brand-whiz', 'border-brand-whiz/30');
          btn.classList.remove('text-slate-400', 'border-transparent');
        } else {
          btn.classList.remove('bg-brand-whiz/15', 'text-brand-whiz', 'border-brand-whiz/30');
          btn.classList.add('text-slate-400', 'border-transparent');
        }
      }
    });

    const breadcrumb = document.getElementById('breadcrumbActiveTab');
    if (breadcrumb) {
      const labels = {
        overview: 'Overview',
        services: 'My Active Services',
        tasks: 'Deliverables & Tasks',
        finance: 'Invoices & Receipts',
        support: 'Support & Requests',
        settings: 'Account Settings'
      };
      breadcrumb.textContent = labels[tabId] || tabId;
    }

    // Scroll to top of content
    const container = document.querySelector('main > div.overflow-y-auto');
    if (container) container.scrollTop = 0;
  }

  // Load All Workspace Data
  async function loadClientData() {
    try {
      const overviewRes = await apiFetch('/portal/client-overview');
      if (overviewRes.ok && overviewRes.data && overviewRes.data.success && overviewRes.data.data) {
        const d = overviewRes.data.data;
        state.services = d.activeServices || [];
        state.projects = d.activeProjects || [];
        state.payments = d.recentPayments || [];
        state.invoices = d.invoices || [];

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
          state.services = srvRes.data.data.services || [];
        }
        if (projRes.ok && projRes.data && projRes.data.data) {
          state.projects = projRes.data.data.projects || [];
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
    }
  }

  // 1. Render Overview
  function renderClientOverview() {
    const statActive = document.getElementById('statActiveServices');
    const statTasks = document.getElementById('statCompletedTasks');
    const statInv = document.getElementById('statInvoicesCount');

    if (statActive) statActive.textContent = state.services.length;
    if (statTasks) {
      const completedCount = state.projects.reduce((acc, p) => acc + (p.completedTasksCount || (p.progress_percent > 0 ? 1 : 0)), 0);
      statTasks.textContent = completedCount;
    }
    if (statInv) statInv.textContent = state.payments.length || state.invoices.length;

    const list = document.getElementById('overviewServicesList');
    if (!list) return;

    if (state.services.length === 0) {
      list.innerHTML = `
        <div class="p-6 sm:p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400 space-y-2">
          <i class="fa-solid fa-shapes text-2xl text-slate-600 block mb-1"></i>
          <p>No active marketing services attached to your organization yet.</p>
          <a href="/#services" class="inline-block mt-2 px-3 py-1.5 rounded-lg bg-brand-whiz/20 text-brand-whiz hover:bg-brand-whiz/30 font-semibold transition-all">
            Browse Service Catalog
          </a>
        </div>
      `;
    } else {
      list.innerHTML = state.services.map(s => `
        <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition-all">
          <div class="flex items-center space-x-3.5 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-brand-whiz/15 text-brand-whiz border border-brand-whiz/30 flex items-center justify-center font-bold text-sm shrink-0">
              <i class="fa-solid fa-bolt"></i>
            </div>
            <div class="min-w-0">
              <h4 class="text-xs sm:text-sm font-bold text-white truncate">${s.service_name || s.serviceName || s.package_name || 'Agency Service'}</h4>
              <p class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Status: <strong class="text-emerald-400 uppercase">${s.status || 'Active'}</strong></span>
                <span>•</span>
                <span>Tier: <strong class="text-slate-300">${s.package_name || 'Standard'}</strong></span>
              </p>
            </div>
          </div>
          <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
            <span class="text-xs sm:text-sm font-mono font-bold text-white">$${(((s.price_cents || s.priceCents || 0)) / 100).toFixed(2)}</span>
            <button type="button" data-client-tab="services" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-all">
              Details
            </button>
          </div>
        </div>
      `).join('');
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
        <div class="p-8 rounded-2xl bg-[#0B111A] border border-[#1A2332] text-center text-xs text-slate-400 space-y-2">
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
      const price = (((s.price_cents || s.priceCents || 0)) / 100).toFixed(2);
      return `
        <div class="p-5 sm:p-6 rounded-3xl bg-[#0B111A] border border-[#1A2332] space-y-4 hover:border-slate-700 transition-all">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div class="flex items-center space-x-3.5">
              <div class="w-11 h-11 rounded-2xl bg-brand-whiz/15 text-brand-whiz border border-brand-whiz/30 flex items-center justify-center font-bold text-base shrink-0">
                <i class="fa-solid fa-shapes"></i>
              </div>
              <div>
                <h4 class="text-sm sm:text-base font-bold text-white">${s.service_name || s.serviceName || 'Marketing Service'}</h4>
                <span class="text-xs text-slate-400">${s.package_name || 'Standard Agency Package'}</span>
              </div>
            </div>
            <div class="flex items-center gap-2.5">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                ${s.status || 'Active'}
              </span>
              <span class="text-sm font-mono font-black text-white">$${price}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-500 block">Deliverables Scope</span>
              <p class="text-slate-300 mt-0.5 leading-relaxed">${s.deliverables || s.scope || 'Full agency execution and verified milestone handoffs.'}</p>
            </div>
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-500 block">Contract Timeline</span>
              <p class="text-slate-300 mt-0.5">Start: ${s.start_date || 'Active'} • Target: ${s.deadline || 'Ongoing'}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 3. Render Deliverables & Project Progress
  function renderDeliverablesTasks() {
    const list = document.getElementById('tasksFullList');
    const countEl = document.getElementById('tasksDeliverablesCount');
    if (countEl) countEl.textContent = `${state.projects.length} Active Campaigns`;
    if (!list) return;

    if (state.projects.length === 0) {
      list.innerHTML = `
        <div class="p-8 rounded-2xl bg-[#0B111A] border border-[#1A2332] text-center text-xs text-slate-400 space-y-2">
          <i class="fa-solid fa-list-check text-2xl text-slate-600 block mb-1"></i>
          <p>No active project campaigns provisioned yet.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = state.projects.map(p => {
      const progress = Math.min(100, Math.max(0, p.progress_percent || p.progressPercent || 0));
      return `
        <div class="p-5 sm:p-6 rounded-3xl bg-[#0B111A] border border-[#1A2332] space-y-4 hover:border-slate-700 transition-all">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              <h4 class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-diagram-project text-brand-whiz text-xs"></i>
                <span>${p.name || p.project_name || 'Campaign Execution'}</span>
              </h4>
              <p class="text-xs text-slate-400 mt-0.5">Target Completion: <strong class="text-slate-300">${p.deadline || 'Scheduled'}</strong></p>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              ${p.status || 'Active'}
            </span>
          </div>

          <!-- Progress Bar & Percentage -->
          <div class="space-y-2 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400 font-medium">Deliverables Checkpoints</span>
              <span class="font-mono font-bold text-brand-whiz text-sm">${progress}%</span>
            </div>
            <div class="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div class="bg-gradient-to-r from-brand-whiz to-emerald-400 h-full rounded-full transition-all duration-500" style="width: ${progress}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 4. Render Finance & Invoices
  function renderFinanceReceipts() {
    const list = document.getElementById('financeFullList');
    const countEl = document.getElementById('financeReceiptsCount');
    const records = state.payments.length > 0 ? state.payments : state.invoices;
    if (countEl) countEl.textContent = `${records.length} Records`;
    if (!list) return;

    if (records.length === 0) {
      list.innerHTML = `
        <div class="p-8 rounded-2xl bg-[#0B111A] border border-[#1A2332] text-center text-xs text-slate-400 space-y-2">
          <i class="fa-solid fa-file-invoice-dollar text-2xl text-slate-600 block mb-1"></i>
          <p>No payment records or invoices issued yet.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = `
      <div class="rounded-3xl bg-[#0B111A] border border-[#1A2332] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300 min-w-[650px]">
            <thead class="bg-slate-950/70 border-b border-[#1A2332] text-[11px] uppercase font-bold text-slate-400">
              <tr>
                <th class="p-4">Receipt / Invoice #</th>
                <th class="p-4">Date</th>
                <th class="p-4">Amount</th>
                <th class="p-4">Method</th>
                <th class="p-4">Status</th>
                <th class="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#1A2332]">
              ${records.map(r => {
                const num = r.receipt_number || r.receiptNumber || r.invoice_number || 'INV-1001';
                const date = r.payment_date || r.issue_date || '2026-10-30';
                const amount = (((r.amount_cents || r.total_cents || 0)) / 100).toFixed(2);
                const paymentId = r.id;
                return `
                  <tr class="hover:bg-slate-900/40 transition-colors">
                    <td class="p-4 font-mono font-bold text-white">${num}</td>
                    <td class="p-4 text-slate-400">${date}</td>
                    <td class="p-4 font-mono font-bold text-emerald-400">$${amount}</td>
                    <td class="p-4 uppercase text-[11px] text-slate-400">${r.payment_method || 'Online'}</td>
                    <td class="p-4">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        Paid
                      </span>
                    </td>
                    <td class="p-4 text-right">
                      <button type="button" class="btn-download-client-receipt px-3 py-1.5 rounded-xl bg-brand-whiz/15 hover:bg-brand-whiz/25 text-brand-whiz border border-brand-whiz/30 text-xs font-bold transition-all" data-payment-id="${paymentId}" data-receipt-num="${num}">
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
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Header Brand
      page.drawRectangle({
        x: 0,
        y: 760,
        width: 595.28,
        height: 82,
        color: rgb(0.043, 0.067, 0.102)
      });

      page.drawText('WHIZ STUDIO', {
        x: 50,
        y: 795,
        size: 20,
        font: fontBold,
        color: rgb(0, 0.659, 0.42)
      });

      page.drawText('OFFICIAL AGENCY RECEIPT', {
        x: 50,
        y: 775,
        size: 10,
        font: fontBold,
        color: rgb(0.8, 0.8, 0.8)
      });

      page.drawText(`Receipt #: ${receiptData.receiptNumber || receiptNum}`, {
        x: 400,
        y: 795,
        size: 11,
        font: fontBold,
        color: rgb(1, 1, 1)
      });

      page.drawText(`Date: ${receiptData.paymentDate || '2026-10-30'}`, {
        x: 400,
        y: 775,
        size: 10,
        font: fontRegular,
        color: rgb(0.7, 0.7, 0.7)
      });

      // Client & Agency details
      page.drawText('ISSUED TO:', { x: 50, y: 720, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(receiptData.client?.name || 'Valued Client', { x: 50, y: 705, size: 12, font: fontBold });
      page.drawText(receiptData.client?.email || '', { x: 50, y: 690, size: 10, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

      // Financial Details Box
      page.drawRectangle({
        x: 50,
        y: 560,
        width: 495.28,
        height: 100,
        color: rgb(0.96, 0.97, 0.98),
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 1
      });

      page.drawText('Description', { x: 70, y: 635, size: 10, font: fontBold });
      page.drawText('Total Paid', { x: 450, y: 635, size: 10, font: fontBold });

      page.drawText(receiptData.service?.name || 'Whiz Studio Agency Subscribed Marketing Services', {
        x: 70,
        y: 600,
        size: 10,
        font: fontRegular
      });

      const totalFormatted = `$${(((receiptData.amountCents || 0)) / 100).toFixed(2)}`;
      page.drawText(totalFormatted, {
        x: 450,
        y: 600,
        size: 12,
        font: fontBold,
        color: rgb(0, 0.659, 0.42)
      });

      // Footer notice
      page.drawText('Verified by Whiz Studio Cloudflare D1 Authority Engine • 100% Free Tier Architecture', {
        x: 50,
        y: 50,
        size: 8,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5)
      });

      // 3. Trigger Browser Download
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

    // 2. Mobile Drawer Controls
    const toggleBtn = document.getElementById('clientMobileToggleBtn');
    const closeBtn = document.getElementById('clientMobileCloseBtn');
    const drawer = document.getElementById('clientMobileDrawer');
    const backdrop = document.getElementById('clientMobileBackdrop');

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

    // 3. Sign Out Buttons
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
