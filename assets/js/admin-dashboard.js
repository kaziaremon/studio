/**
 * WHIZ STUDIO — FULL-PAGE SUPER ADMIN DASHBOARD CONTROLLER
 * Technology: Clerk JS SDK, Cloudflare D1 Backend API, Tailwind CSS, pdf-lib
 * Domain: whizstudio.art/admin/dashboard | Free-Tier Architecture ($0 Cost)
 */

(function () {
  'use strict';

  const CLERK_PUBLISHABLE_KEY = 'pk_test_cG9ldGljLWxpZ2VyLTQzNTUuY2xlcmsuYWNjb3VudHMuZGV2JA';
  const API_BASE = 'https://whiz-api.kaziaremon.workers.dev/api/v1';

  const state = {
    clerkLoaded: false,
    currentUser: null,
    adminProfile: null,
    activeTab: 'overview',
    isRequestInFlight: false,
    clientsCache: [],
    servicesCache: [],
    projectsCache: [],
    tasksCache: []
  };

  // Toast Notification Helper
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

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
    requestAnimationFrame(() => toast.classList.remove('translate-y-2', 'opacity-0'));

    setTimeout(() => {
      toast.classList.add('opacity-0', '-translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function parseClerkError(err) {
    if (!err) return { code: 'unknown', message: 'An unexpected error occurred.' };
    const first = (err.errors && err.errors[0]) || {};
    return {
      code: first.code || err.code || 'unknown',
      message: first.message || err.message || 'An unexpected error occurred.',
      longMessage: first.longMessage || first.message || err.message || ''
    };
  }

  function setBtnLoading(btn, isLoading, loadingText = 'Processing...') {
    if (!btn) return;
    if (isLoading) {
      btn.disabled = true;
      btn.dataset.originalHtml = btn.innerHTML;
      btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-xs mr-2"></i><span>${loadingText}</span>`;
      btn.classList.add('opacity-60', 'cursor-not-allowed');
    } else {
      btn.disabled = false;
      if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
      btn.classList.remove('opacity-60', 'cursor-not-allowed');
    }
  }

  // Authenticated Backend Fetch to Cloudflare API Worker
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
    alertBox.className = `p-4 rounded-xl text-xs font-medium border flex items-start space-x-2.5 transition-all ${colorClasses[type] || colorClasses.error}`;
    alertBox.innerHTML = `
      <i class="fa-solid fa-circle-exclamation text-sm mt-0.5 shrink-0"></i>
      <div class="flex-1">${message}</div>
    `;
  }

  function hideSecurityAlert() {
    const alertBox = document.getElementById('adminSecurityAlert');
    if (alertBox) alertBox.classList.add('hidden');
  }

  function initPasswordToggles() {
    document.querySelectorAll('.password-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.innerHTML = `<i class="fa-solid fa-eye${isPassword ? '-slash' : ''} text-xs"></i>`;
      });
    });
  }

  // =========================================================================
  // TASK 1: AUTHENTICATED PASSWORD UPDATE (user.updatePassword)
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

    if (!currentPassword) {
      showSecurityAlert('Please enter your current administrator password.', 'error');
      return;
    }
    if (!newPassword) {
      showSecurityAlert('Please enter your new permanent password.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showSecurityAlert('New password must be at least 8 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showSecurityAlert('New password and confirmation password do not match.', 'error');
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

      await user.updatePassword({
        currentPassword,
        newPassword,
        signOutOfOtherSessions
      });

      showSecurityAlert('Password updated successfully! Your new permanent password is active.', 'success');
      showToast('Password updated successfully!', 'success');
      form.reset();

      if (typeof user.reload === 'function') {
        await user.reload().catch(() => {});
      }
    } catch (err) {
      console.error('Password Update Error:', err);
      const parsed = parseClerkError(err);
      if (parsed.code === 'form_password_incorrect') {
        showSecurityAlert('Current password is incorrect. Please verify and try again.', 'error');
      } else if (parsed.code === 'form_password_pwned') {
        showSecurityAlert('This password has been flagged in data breaches. Please choose a more complex password.', 'error');
      } else {
        showSecurityAlert(parsed.longMessage || parsed.message || 'Failed to update password.', 'error');
      }
    } finally {
      state.isRequestInFlight = false;
      setBtnLoading(submitBtn, false);
    }
  }

  // =========================================================================
  // BROWSER-SIDE VECTOR PDF GENERATOR (ZERO SERVER STORAGE)
  // =========================================================================
  async function generateReceiptPdfInBrowser(receiptData) {
    if (!window.PDFLib) {
      showToast('Loading PDF engine... Please try again in a moment.', 'warning');
      return;
    }

    try {
      const { PDFDocument, rgb, StandardFonts, PageSizes } = window.PDFLib;
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage(PageSizes.A4);
      const { width, height } = page.getSize();

      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const primaryColor = rgb(0, 0.658, 0.419); // #00A86B
      const textColor = rgb(0.1, 0.1, 0.1);
      const mutedColor = rgb(0.4, 0.4, 0.4);

      let cursorY = height - 40;

      // Header Banner
      page.drawRectangle({
        x: 40,
        y: cursorY - 50,
        width: width - 80,
        height: 50,
        color: rgb(0.96, 0.98, 0.96)
      });

      page.drawText('WHIZ STUDIO', {
        x: 55,
        y: cursorY - 26,
        size: 18,
        font: fontBold,
        color: primaryColor
      });

      page.drawText('Integrated Agency Management | Official Receipt', {
        x: 55,
        y: cursorY - 42,
        size: 9,
        font: fontRegular,
        color: mutedColor
      });

      // Receipt Badge
      page.drawText('CONFIRMED PAYMENT', {
        x: width - 200,
        y: cursorY - 30,
        size: 11,
        font: fontBold,
        color: primaryColor
      });

      cursorY -= 70;

      // Details 2-Column Grid
      page.drawText('RECEIPT INFORMATION', { x: 40, y: cursorY, size: 10, font: fontBold, color: mutedColor });
      page.drawText('BILL TO CLIENT', { x: width / 2 + 10, y: cursorY, size: 10, font: fontBold, color: mutedColor });

      cursorY -= 16;
      page.drawText(`Receipt Reference: ${receiptData.receiptNumber}`, { x: 40, y: cursorY, size: 9, font: fontBold, color: textColor });
      page.drawText(`Client: ${receiptData.client.organizationName || receiptData.client.contactName}`, { x: width / 2 + 10, y: cursorY, size: 9, font: fontBold, color: textColor });

      cursorY -= 14;
      page.drawText(`Payment Date: ${receiptData.paymentDate}`, { x: 40, y: cursorY, size: 9, font: fontRegular, color: textColor });
      page.drawText(`Contact: ${receiptData.client.contactName} (${receiptData.client.email || 'N/A'})`, { x: width / 2 + 10, y: cursorY, size: 9, font: fontRegular, color: textColor });

      cursorY -= 14;
      page.drawText(`Payment Method: ${receiptData.paymentMethod.toUpperCase()}`, { x: 40, y: cursorY, size: 9, font: fontRegular, color: textColor });
      page.drawText(`Service Contract: ${receiptData.serviceName}`, { x: width / 2 + 10, y: cursorY, size: 9, font: fontRegular, color: textColor });

      cursorY -= 30;

      // Amount Highlight Box
      page.drawRectangle({
        x: 40,
        y: cursorY - 40,
        width: width - 80,
        height: 40,
        color: rgb(0.93, 0.97, 0.95)
      });

      const formattedAmount = `${receiptData.currency} ${(receiptData.amountPaidCents / 100).toFixed(2)}`;
      page.drawText('AMOUNT RECEIVED:', { x: 55, y: cursorY - 24, size: 10, font: fontBold, color: mutedColor });
      page.drawText(formattedAmount, { x: width - 200, y: cursorY - 26, size: 16, font: fontBold, color: primaryColor });

      cursorY -= 60;

      // Notes & Footer
      page.drawText('Authorized Statement Notes:', { x: 40, y: cursorY, size: 9, font: fontBold, color: mutedColor });
      cursorY -= 14;
      page.drawText(receiptData.notes || 'Official electronic payment confirmation generated by Whiz Studio.', { x: 40, y: cursorY, size: 8, font: fontRegular, color: textColor });

      cursorY = 50;
      page.drawText('Whiz Studio Platform | www.whizstudio.art | info@whizstudio.art | Zero-Storage Client Architecture', {
        x: 40,
        y: cursorY,
        size: 7.5,
        font: fontRegular,
        color: mutedColor
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `WhizStudio-Receipt-${receiptData.receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

      showToast(`Receipt ${receiptData.receiptNumber} generated in browser!`, 'success');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      showToast('Failed to compile PDF in browser.', 'error');
    }
  }

  // =========================================================================
  // TAB NAVIGATION & DATA CONTROLLER
  // =========================================================================
  function switchTab(tabId) {
    state.activeTab = tabId;
    const allTabs = ['overview', 'clients', 'services', 'projects', 'tasks', 'finance', 'receipt_template', 'team', 'support', 'history', 'settings'];

    allTabs.forEach(t => {
      const viewEl = document.getElementById(`view_${t}`);
      if (viewEl) {
        if (t === tabId) viewEl.classList.remove('hidden');
        else viewEl.classList.add('hidden');
      }
    });

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

    const breadcrumb = document.getElementById('breadcrumbActiveTab');
    if (breadcrumb) breadcrumb.textContent = tabId.replace('_', ' ');

    window.location.hash = tabId;

    // Load data for specific tab
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

  // 1. OVERVIEW DATA
  async function loadOverviewData() {
    const res = await apiFetch('/portal/admin/stats');
    if (res.ok && res.data && res.data.data) {
      const d = res.data.data;
      const totalClientsEl = document.getElementById('statTotalClients');
      if (totalClientsEl) totalClientsEl.textContent = d.totalClients || 0;

      const actEl = document.getElementById('overviewActivityList');
      if (actEl && d.recentActivity) {
        if (d.recentActivity.length === 0) {
          actEl.innerHTML = '<p class="text-slate-500 italic">No recent system activity recorded.</p>';
        } else {
          actEl.innerHTML = d.recentActivity.map(a => `
            <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <div class="flex items-center space-x-2.5">
                <span class="w-2 h-2 rounded-full bg-brand-whiz"></span>
                <span class="font-bold text-white uppercase text-[10px]">${a.action}</span>
                <span class="text-slate-400 text-xs">${a.resource_type}</span>
              </div>
              <span class="text-[11px] text-slate-500 font-mono">${new Date(a.created_at).toLocaleTimeString()}</span>
            </div>
          `).join('');
        }
      }
    }
  }

  // 2. CLIENTS DATA
  async function loadClientsData() {
    const res = await apiFetch('/portal/admin/clients');
    const tbody = document.getElementById('adminClientsTableBody');
    if (!tbody) return;

    if (res.ok && res.data && res.data.data) {
      state.clientsCache = res.data.data;
      renderClientsTable(state.clientsCache);
    } else {
      tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-6 text-center text-rose-400">Failed to load clients.</td></tr>';
    }
  }

  function renderClientsTable(clients) {
    const tbody = document.getElementById('adminClientsTableBody');
    if (!tbody) return;

    if (!clients || clients.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-6 text-center text-slate-500 italic">No clients registered yet. Click "Add New Client" above.</td></tr>';
      return;
    }

    tbody.innerHTML = clients.map(c => `
      <tr class="hover:bg-slate-800/40 transition-colors">
        <td class="px-6 py-4">
          <div class="font-bold text-white">${c.full_name || 'Client'}</div>
          <div class="text-[11px] text-brand-whiz">${c.company_name || 'No company'}</div>
        </td>
        <td class="px-6 py-4 font-mono text-slate-300">
          <div>${c.email}</div>
          <div class="text-[11px] text-slate-500">${c.phone || 'No phone'}</div>
        </td>
        <td class="px-6 py-4 text-slate-400 text-xs">
          ${c.city || 'Dhaka'}, ${c.country || 'Bangladesh'}
        </td>
        <td class="px-6 py-4">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/30">Active</span>
        </td>
        <td class="px-6 py-4 text-right">
          <button type="button" class="btn-create-project-for-client px-3 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700" data-org="${c.id}" data-name="${c.company_name || c.full_name}">
            Manage
          </button>
        </td>
      </tr>
    `).join('');
  }

  // 3. SERVICES & 240 BLUEPRINTS
  async function loadServicesData() {
    const res = await apiFetch('/services/catalog');
    const grid = document.getElementById('adminServicesGrid');
    if (!grid) return;

    if (res.ok && res.data && res.data.data) {
      state.servicesCache = res.data.data;
      grid.innerHTML = state.servicesCache.map(s => `
        <div class="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex flex-col justify-between space-y-4 hover:border-brand-whiz/50 transition-all shadow-lg group">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase tracking-wider text-brand-whiz bg-brand-whiz/10 px-2 py-0.5 rounded-md border border-brand-whiz/20">${s.code}</span>
              <span class="text-xs font-mono font-bold text-white">$${(s.standard_price_cents / 100).toFixed(0)}</span>
            </div>
            <h3 class="text-base font-extrabold text-white group-hover:text-brand-whiz transition-colors">${s.name}</h3>
            <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">${s.description}</p>
          </div>

          <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <div class="text-[11px] text-slate-400 flex items-center gap-1.5 font-semibold">
              <i class="fa-solid fa-list-check text-brand-whiz text-xs"></i>
              <span>${s.blueprint_count || 20} SOP Tasks</span>
            </div>
            <button type="button" class="btn-inspect-blueprints px-3 py-1.5 rounded-xl text-xs font-bold btn-glass-primary shadow-xs cursor-pointer" data-id="${s.id}" data-name="${s.name}" data-code="${s.code}">
              Inspect SOPs
            </button>
          </div>
        </div>
      `).join('');

      // Attach inspect buttons
      document.querySelectorAll('.btn-inspect-blueprints').forEach(b => {
        b.addEventListener('click', () => openBlueprintsModal(b.dataset.id, b.dataset.name, b.dataset.code));
      });
    }
  }

  // Inspect Blueprints Modal
  async function openBlueprintsModal(serviceId, serviceName, serviceCode) {
    const modal = document.getElementById('modalInspectBlueprints');
    const title = document.getElementById('modalBlueprintsTitle');
    const subtitle = document.getElementById('modalBlueprintsSubtitle');
    const list = document.getElementById('modalBlueprintsList');
    if (!modal || !list) return;

    if (title) title.textContent = `Master SOP Blueprints — ${serviceName}`;
    if (subtitle) subtitle.textContent = `20 authoritative SOP task blueprints for service [${serviceCode}]`;

    modal.classList.remove('hidden');
    list.innerHTML = '<p class="text-slate-500 italic p-4">Loading 20 blueprints from Cloudflare D1...</p>';

    const res = await apiFetch(`/services/${serviceId}/blueprints`);
    if (res.ok && res.data && res.data.data) {
      const bps = res.data.data;
      list.innerHTML = bps.map((bp, i) => `
        <div class="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="text-xs font-mono font-bold text-brand-whiz px-2 py-0.5 rounded bg-brand-whiz/10 border border-brand-whiz/20">${bp.task_code}</span>
              <span class="text-xs font-extrabold text-white">${bp.title}</span>
            </div>
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">${bp.priority}</span>
          </div>
          <div class="text-[11px] text-slate-400 font-mono bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 whitespace-pre-line leading-relaxed">
${bp.instructions}
          </div>
          <div class="text-[11px] text-emerald-400 font-medium">
            <span class="font-bold">QA Criteria:</span> ${bp.qa_criteria || 'Standard delivery verification.'}
          </div>
        </div>
      `).join('');
    } else {
      list.innerHTML = '<p class="text-rose-400 p-4">Failed to load task blueprints.</p>';
    }
  }

  // 4. PROJECTS DATA (WITH LIVE COMPUTED PROGRESS %)
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
          <tr class="hover:bg-slate-800/40 transition-colors">
            <td class="px-6 py-4 font-bold text-white">${p.name}</td>
            <td class="px-6 py-4 text-slate-400">${p.organization_name || 'Organization'}</td>
            <td class="px-6 py-4 font-mono text-xs text-brand-whiz">${p.service_name || 'Service'}</td>
            <td class="px-6 py-4">
              <div class="flex items-center space-x-2">
                <div class="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="bg-brand-whiz h-full rounded-full transition-all duration-500" style="width: ${percent}%"></div>
                </div>
                <span class="text-xs font-mono font-bold text-white">${percent}%</span>
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

  // 5. LIVE OPERATIONAL TASKS
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
        list.innerHTML = '<p class="text-slate-500 italic p-4">No tasks found for current filter.</p>';
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
            </div>
          </div>
        `;
      }).join('');

      // Wire task checkbox completion
      document.querySelectorAll('.task-checkbox').forEach(cb => {
        cb.addEventListener('change', async (e) => {
          const taskId = cb.dataset.id;
          const res = await apiFetch(`/projects/tasks/${taskId}/complete`, {
            method: 'PUT',
            body: JSON.stringify({ notes: 'Marked completed in Super Admin Console' })
          });
          if (res.ok && res.data && res.data.success) {
            showToast(`Task status updated! Project progress is now ${res.data.data.newProgressPercent}%.`, 'success');
            loadTasksData(filter);
            loadProjectsData();
          } else {
            showToast('Failed to update task status.', 'error');
            cb.checked = !cb.checked;
          }
        });
      });
    }
  }

  // 6. FINANCE & PAYMENTS
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
        <tr class="hover:bg-slate-800/40 transition-colors">
          <td class="px-6 py-4 font-mono font-bold text-brand-whiz">${p.receipt_number}</td>
          <td class="px-6 py-4">
            <div class="font-bold text-white">${p.organization_name || 'Client'}</div>
            <div class="text-[11px] text-slate-500 font-mono">${p.invoice_number || 'INV-DIRECT'}</div>
          </td>
          <td class="px-6 py-4 font-mono font-bold text-emerald-400">$${(p.amount_cents / 100).toFixed(2)}</td>
          <td class="px-6 py-4 uppercase text-slate-400 text-xs">${p.payment_method}</td>
          <td class="px-6 py-4 text-slate-400 text-xs">${p.payment_date}</td>
          <td class="px-6 py-4 text-right">
            <button type="button" class="btn-download-receipt-admin px-3 py-1 rounded-lg text-xs font-bold btn-glass-primary shadow-xs cursor-pointer" data-receipt="${p.receipt_number}">
              Download PDF
            </button>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.btn-download-receipt-admin').forEach(b => {
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

  // 7. TEAM DATA
  async function loadTeamData() {
    const res = await apiFetch('/portal/admin/team');
    const tbody = document.getElementById('adminTeamTableBody');
    if (!tbody) return;

    if (res.ok && res.data && res.data.data) {
      const admins = res.data.data.admins || [];
      tbody.innerHTML = admins.map(a => `
        <tr class="hover:bg-slate-800/40 transition-colors">
          <td class="px-6 py-4">
            <div class="font-bold text-white">${a.full_name || 'Admin'}</div>
            <div class="text-xs text-slate-400 font-mono">${a.approved_email}</div>
          </td>
          <td class="px-6 py-4">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${a.role === 'super_admin' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900 text-slate-400'}">${a.role}</span>
          </td>
          <td class="px-6 py-4">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${a.status === 'active' ? 'text-emerald-400 bg-emerald-950/50' : 'text-amber-400 bg-amber-950/50'}">${a.status}</span>
          </td>
          <td class="px-6 py-4 text-slate-400 text-xs">${a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A'}</td>
          <td class="px-6 py-4 text-right">
            ${a.role !== 'super_admin' ? `<button type="button" class="text-rose-400 hover:text-rose-300 text-xs font-bold">Revoke</button>` : '<span class="text-slate-600 text-xs">Locked</span>'}
          </td>
        </tr>
      `).join('');
    }
  }

  // 8. SUPPORT DATA
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
        <tr class="hover:bg-slate-800/40 transition-colors">
          <td class="px-6 py-4">
            <div class="font-bold text-white">${t.full_name}</div>
            <div class="text-xs text-slate-400">${t.email}</div>
          </td>
          <td class="px-6 py-4 font-bold text-slate-200">${t.subject}</td>
          <td class="px-6 py-4 text-slate-400 text-xs line-clamp-2">${t.message}</td>
          <td class="px-6 py-4">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.status === 'resolved' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}">${t.status}</span>
          </td>
          <td class="px-6 py-4 text-right">
            <button type="button" class="btn-resolve-ticket px-3 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white" data-id="${t.id}" data-status="${t.status}">
              ${t.status === 'resolved' ? 'Reopen' : 'Resolve'}
            </button>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.btn-resolve-ticket').forEach(b => {
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

  // 9. AUDIT HISTORY DATA
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
  // MODAL HANDLERS & FORMS
  // =========================================================================
  function initModals() {
    // Open Add Client Modal
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

    const btnOpenAddClient = document.getElementById('btnOpenAddClientModal');
    if (btnOpenAddClient) btnOpenAddClient.addEventListener('click', openAddClient);
    const btnQuickAddClient = document.getElementById('btnQuickAddClient');
    if (btnQuickAddClient) btnQuickAddClient.addEventListener('click', openAddClient);

    // Form Add Client Submit
    const formAddClient = document.getElementById('formAddClient');
    if (formAddClient) {
      formAddClient.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const selectedServices = Array.from(f.querySelectorAll('input[name="services"]:checked')).map(i => i.value);

        const payload = {
          fullName: f.fullName.value,
          companyName: f.companyName.value,
          email: f.email.value,
          phone: f.phone.value,
          selectedServiceIds: selectedServices
        };

        const res = await apiFetch('/portal/admin/clients', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (res.ok && res.data && res.data.success) {
          showToast(`Client created! Auto-provisioned ${res.data.data.createdProjectsCount} projects with ${res.data.data.generatedTasksCount} tasks.`, 'success');
          f.reset();
          document.getElementById('modalAddClient').classList.add('hidden');
          loadClientsData();
          loadProjectsData();
          loadTasksData();
        } else {
          showToast(res.data?.error || 'Failed to create client.', 'error');
        }
      });
    }

    // Open Record Payment Modal
    const openRecordPayment = () => {
      const modal = document.getElementById('modalRecordPayment');
      const select = document.getElementById('paymentClientSelect');
      if (modal && select) {
        modal.classList.remove('hidden');
        select.innerHTML = '<option value="">Select client...</option>' + state.clientsCache.map(c => `
          <option value="${c.id}">${c.company_name || c.full_name} (${c.email})</option>
        `).join('');
      }
    };

    const btnOpenRecordPayment = document.getElementById('btnOpenRecordPaymentModal');
    if (btnOpenRecordPayment) btnOpenRecordPayment.addEventListener('click', openRecordPayment);
    const btnQuickRecordPayment = document.getElementById('btnQuickRecordPayment');
    if (btnQuickRecordPayment) btnQuickRecordPayment.addEventListener('click', openRecordPayment);

    // Form Record Payment Submit
    const formRecordPayment = document.getElementById('formRecordPayment');
    if (formRecordPayment) {
      formRecordPayment.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const orgId = f.organizationId.value;
        const amountDollars = parseFloat(f.amount.value) || 0;
        const paymentMethod = f.paymentMethod.value;
        const paymentReference = f.paymentReference.value;

        // First find or create invoice for client
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

        if (payRes.ok && payRes.data && payRes.data.success) {
          showToast(`Payment of $${amountDollars.toFixed(2)} committed! Receipt ${payRes.data.data.receiptNumber} issued.`, 'success');
          f.reset();
          document.getElementById('modalRecordPayment').classList.add('hidden');
          loadFinanceData();
        } else {
          showToast(payRes.data?.error || 'Failed to record payment.', 'error');
        }
      });
    }

    // Close Modals
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.modal;
        const m = document.getElementById(modalId);
        if (m) m.classList.add('hidden');
      });
    });

    // Test Generate Receipt PDF
    const btnTest = document.getElementById('btnTestGenerateReceipt');
    if (btnTest) {
      btnTest.addEventListener('click', () => {
        const sampleData = {
          receiptNumber: 'REC-202610-DEMO',
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'BANK_TRANSFER',
          currency: 'USD',
          amountPaidCents: 150000,
          serviceName: 'Facebook Ads Management (Growth Retainer)',
          notes: 'Sample test receipt generated in browser. Zero bytes stored on server.',
          client: {
            organizationName: 'Acme Growth Labs',
            contactName: 'Jane Doe',
            email: 'jane@acme.com'
          }
        };
        generateReceiptPdfInBrowser(sampleData);
      });
    }
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
      if (!window.Clerk.isReady()) {
        await window.Clerk.load();
      }

      const user = window.Clerk.user;
      if (!user) {
        window.location.href = '/?login=admin';
        return;
      }

      state.currentUser = user;

      // Verify Administrator Authorization with Cloudflare Backend API
      const res = await apiFetch('/portal/me');
      if (!res.ok || !res.data || !res.data.success || !res.data.data || !res.data.data.user) {
        if (authGuard) authGuard.classList.add('hidden');
        if (accessDenied) accessDenied.classList.remove('hidden');
        return;
      }

      const profile = res.data.data.user;
      state.adminProfile = profile;

      if (profile.role !== 'owner' && profile.role !== 'admin' && profile.role !== 'super_admin') {
        if (authGuard) authGuard.classList.add('hidden');
        if (accessDenied) accessDenied.classList.remove('hidden');
        return;
      }

      // Populate user info in UI
      const name = profile.full_name || user.fullName || 'Super Admin';
      const email = profile.email || (user.primaryEmailAddress ? user.primaryEmailAddress.emailAddress : '');
      const username = user.username ? `@${user.username}` : (user.id.slice(0, 12) + '...');

      document.querySelectorAll('.admin-display-name').forEach(el => el.textContent = name);
      document.querySelectorAll('.admin-display-username').forEach(el => el.textContent = username);
      const emailEl = document.getElementById('secUserEmail');
      if (emailEl) emailEl.textContent = email;
      const userEl = document.getElementById('secClerkUserId');
      if (userEl) userEl.textContent = user.id;

      // Show Main Layout
      if (authGuard) authGuard.classList.add('hidden');
      if (mainLayout) mainLayout.classList.remove('hidden');

      // Initialize initial tab
      const hash = (window.location.hash || '').replace('#', '');
      const validTabs = ['overview', 'clients', 'services', 'projects', 'tasks', 'finance', 'receipt_template', 'team', 'support', 'history', 'settings'];
      const initialTab = validTabs.includes(hash) ? hash : 'overview';
      switchTab(initialTab);

      // Preload services catalog
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
