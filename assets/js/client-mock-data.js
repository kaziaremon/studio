/**
 * WHIZ STUDIO — CLIENT DASHBOARD MOCK DATA PROVIDER
 * For isolated preview simulation, client demonstrations, and multi-device QA.
 * 100% authentic data structures matching Cloudflare D1 schema.
 */

(function () {
  'use strict';

  const mockClientData = {
    user: {
      id: 'usr_client_01',
      fullName: 'Sarah Jenkins',
      full_name: 'Sarah Jenkins',
      email: 'sarah@apexglobal.io',
      username: 'sarahjenkins',
      role: 'client',
      company_name: 'Apex Global Inc.',
      companyName: 'Apex Global Inc.',
      website: 'https://apexglobal.io',
      phone: '+1 (555) 349-2041',
      city: 'San Francisco',
      country: 'United States',
      created_at: '2026-08-15'
    },

    overview: {
      activeServices: 2,
      completedTasks: 18,
      pendingTasks: 4,
      completionRate: 82,
      monthlyRetainerCents: 770000,
      currency: 'USD',
      currentSprint: 'Sprint 14: Q4 Acquisition & Conversion Scale',
      nextMilestone: 'Phase 2: Winning Creative Scaling Deployment (Nov 06)',
      recentUpdates: [
        { title: 'Ad Creative Batch Approved', desc: '10 static variants and 3 motion graphics approved for DCT launch.', time: '2 hours ago', icon: 'fa-check-circle' },
        { title: 'Weekly Performance Report Delivered', desc: 'ROAS climbed to 3.84x with a 22% reduction in blended CAC.', time: 'Yesterday', icon: 'fa-chart-line' },
        { title: 'Invoice INV-2026-104 Paid', desc: '$4,500.00 confirmed via Stripe Card Checkout.', time: '3 days ago', icon: 'fa-receipt' }
      ]
    },

    services: [
      {
        id: 'cs_01',
        name: 'Meta Ads Performance Accelerator',
        category: 'Paid Advertising',
        status: 'active',
        billing_cycle: 'Monthly Retainer',
        price_cents: 450000,
        currency: 'USD',
        start_date: '2026-08-15',
        manager: 'Sazzad Kabir',
        progress_percent: 75,
        deliverables: [
          { title: 'Custom Conversions API Server Integration', completed: true },
          { title: 'Dynamic Creative Testing (DCT) Setup', completed: true },
          { title: 'Creative Testing Matrix (10 Variants)', completed: true },
          { title: 'Advantage+ Scaling Campaigns', completed: false },
          { title: 'Executive Weekly ROAS Diagnostic', completed: false }
        ]
      },
      {
        id: 'cs_02',
        name: 'Executive LinkedIn Presence Architecture',
        category: 'Executive Branding',
        status: 'active',
        billing_cycle: 'Monthly Retainer',
        price_cents: 320000,
        currency: 'USD',
        start_date: '2026-09-01',
        manager: 'Naimur Rahman',
        progress_percent: 90,
        deliverables: [
          { title: 'Executive Profile Revamp & Banner Architecture', completed: true },
          { title: 'Thought Leadership Positioning Pillars', completed: true },
          { title: '12 Ghostwritten Viral Essays', completed: true },
          { title: 'B2B Founder Network Amplification', completed: false }
        ]
      }
    ],

    tasks: [
      { id: 'ct_01', title: 'Dynamic Creative Testing Ad Launch', service: 'Meta Ads Performance', phase: 'Phase 2', status: 'completed', delivered_at: '2026-11-01' },
      { id: 'ct_02', title: 'Week 45 Thought Leadership Articles (3x)', service: 'Executive LinkedIn Presence', phase: 'Phase 3', status: 'completed', delivered_at: '2026-11-02' },
      { id: 'ct_03', title: 'Black Friday Bundle Creative Matrix', service: 'Meta Ads Performance', phase: 'Phase 2', status: 'in_progress', due_date: '2026-11-05' },
      { id: 'ct_04', title: 'Mid-Funnel Retargeting Audience Setup', service: 'Meta Ads Performance', phase: 'Phase 2', status: 'in_progress', due_date: '2026-11-08' },
      { id: 'ct_05', title: 'Weekly Growth & ROAS Diagnostic Briefing', service: 'Executive Growth', phase: 'Phase 3', status: 'upcoming', due_date: '2026-11-10' }
    ],

    finance: {
      totalBilledCents: 1450000,
      totalPaidCents: 1100000,
      balanceDueCents: 350000,
      currency: 'USD',
      invoices: [
        { invoice_no: 'INV-2026-104', title: 'Meta Ads Performance Accelerator (Month 3)', amount_cents: 450000, currency: 'USD', issue_date: '2026-10-31', due_date: '2026-11-14', status: 'paid', receipt_no: 'RCP-2026-081' },
        { invoice_no: 'INV-2026-095', title: 'Executive LinkedIn Presence Architecture (Month 2)', amount_cents: 320000, currency: 'USD', issue_date: '2026-09-30', due_date: '2026-10-14', status: 'paid', receipt_no: 'RCP-2026-072' },
        { invoice_no: 'INV-2026-088', title: 'Meta Ads Performance Accelerator (Month 2)', amount_cents: 450000, currency: 'USD', issue_date: '2026-09-30', due_date: '2026-10-14', status: 'paid', receipt_no: 'RCP-2026-071' },
        { invoice_no: 'INV-2026-110', title: 'Q4 Black Friday Creative Ad Budget Amplification', amount_cents: 350000, currency: 'USD', issue_date: '2026-11-01', due_date: '2026-11-15', status: 'pending', receipt_no: null }
      ]
    },

    support: [
      { id: 'cs_sup_01', ticket_number: 'TIC-1092', subject: 'Q4 Black Friday creative testing variants', status: 'in_progress', created_at: '2026-11-01', message: 'Hello team, we would like to add 3 new static variants and 2 short video hooks focusing on the 30% bundle discount before the Black Friday launch.', reply: 'Hi Sarah, our creative team has received your brief and Sazzad has prioritized the 3 static variants. Expect preview links by Wednesday.' },
      { id: 'cs_sup_02', ticket_number: 'TIC-1082', subject: 'Receipt PDF copy for fiscal Q3 accounting', status: 'resolved', created_at: '2026-10-15', message: 'Can you provide official signed and stamped vector receipts for our tax filing?', reply: 'Vector receipt has been generated and is ready for download in your Invoices & Receipts tab.' }
    ],

    cif: {
      companyName: 'Apex Global Inc.',
      brandName: 'Apex Global',
      website: 'https://apexglobal.io',
      industry: 'B2B Enterprise SaaS & Cloud Security',
      targetAudience: 'CTOs, CISOs, and Heads of Infrastructure at Series B+ tech firms in US and UK',
      primaryOffer: 'Autonomous Cloud Compliance & Zero-Trust Vulnerability Scanning',
      adBudgetMonthly: '$25,000 - $50,000 / month',
      brandGuidelinesUrl: 'https://apexglobal.io/brand-assets',
      notes: 'Prioritize high-intent enterprise security decision makers. Avoid casual consumer tone.'
    }
  };

  window.__whizClientMock = {
    getData: () => mockClientData,

    handleRequest: function (endpoint, options = {}) {
      const ep = endpoint.split('?')[0];
      const method = (options.method || 'GET').toUpperCase();

      console.log(`[Whiz Client Mock API] [${method}] ${endpoint}`);

      // 1. Profile
      if (ep === '/portal/me') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: { user: mockClientData.user } } });
      }

      // 2. Overview
      if (ep === '/portal/client-overview') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockClientData.overview } });
      }

      // 3. Services
      if (ep === '/services/my-services') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockClientData.services } });
      }

      // 4. Tasks & Deliverables
      if (ep === '/projects') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockClientData.tasks } });
      }

      // 5. Invoices & Receipts
      if (ep === '/finance/invoices') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockClientData.finance.invoices } });
      }

      // 6. CIF
      if (ep === '/portal/client/cif') {
        if (method === 'POST') {
          const body = JSON.parse(options.body || '{}');
          Object.assign(mockClientData.cif, body);
          return Promise.resolve({ ok: true, status: 200, data: { success: true, message: 'Client Information Form updated successfully.' } });
        }
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockClientData.cif } });
      }

      // 7. Support
      if (ep === '/portal/support/my') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockClientData.support } });
      }

      if (ep === '/portal/support/submit') {
        const body = JSON.parse(options.body || '{}');
        const newTicket = {
          id: 'cs_sup_' + Date.now().toString().slice(-4),
          ticket_number: 'TIC-' + Math.floor(1000 + Math.random() * 9000),
          subject: body.subject || 'Client Inquiry',
          status: 'open',
          created_at: new Date().toISOString().split('T')[0],
          message: body.message || '',
          reply: 'Thank you for reaching out. An account manager has been notified.'
        };
        mockClientData.support.unshift(newTicket);
        return Promise.resolve({ ok: true, status: 200, data: { success: true, message: 'Ticket submitted successfully.', ticket: newTicket } });
      }

      return Promise.resolve({ ok: true, status: 200, data: { success: true, data: [] } });
    }
  };
})();

