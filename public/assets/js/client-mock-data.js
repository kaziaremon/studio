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
        service_name: 'Meta Ads Performance Accelerator',
        serviceName: 'Meta Ads Performance Accelerator',
        package_name: 'Standard Retainer',
        packageName: 'Standard Retainer',
        category: 'Paid Advertising',
        status: 'active',
        billing_cycle: 'Monthly Retainer',
        start_date: '2026-08-15',
        progress_percent: 75,
        progressPercent: 75
      },
      {
        id: 'cs_02',
        name: 'Executive LinkedIn Presence Architecture',
        service_name: 'Executive LinkedIn Presence Architecture',
        serviceName: 'Executive LinkedIn Presence Architecture',
        package_name: 'Standard Retainer',
        packageName: 'Standard Retainer',
        category: 'Executive Branding',
        status: 'active',
        billing_cycle: 'Monthly Retainer',
        start_date: '2026-09-01',
        progress_percent: 90,
        progressPercent: 90
      }
    ],

    projects: [
      {
        id: 'prj_01',
        name: 'Meta Ads Performance Campaign',
        projectName: 'Meta Ads Performance Campaign',
        status: 'active',
        progress_percent: 75,
        progressPercent: 75,
        deadline: '2026-11-30',
        completedTasksCount: 12,
        totalTasksCount: 16,
        tasks: []
      },
      {
        id: 'prj_02',
        name: 'Executive LinkedIn Presence Architecture',
        projectName: 'Executive LinkedIn Presence Architecture',
        status: 'active',
        progress_percent: 90,
        progressPercent: 90,
        deadline: '2026-12-15',
        completedTasksCount: 6,
        totalTasksCount: 6,
        tasks: []
      }
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
    data: mockClientData,
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
        const fullOverview = {
          ...mockClientData.overview,
          services: mockClientData.services,
          projects: mockClientData.projects || [],
          invoices: mockClientData.finance ? mockClientData.finance.invoices : [],
          payments: mockClientData.finance ? mockClientData.finance.payments : [],
          finance: mockClientData.finance,
          cif: mockClientData.cif,
          overallProgressPercent: mockClientData.overview.completionRate || 82
        };
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: fullOverview } });
      }
      if (ep === '__unused_legacy_overview__') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockClientData.overview } });
      }

      // 3. Services
      if (ep === '/services/my-services') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockClientData.services } });
      }

      // 4. Tasks & Deliverables
      if (ep === '/projects') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockClientData.projects } });
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

      // 8. PDF Authorization & Document Data
      if (ep.startsWith('/pdf/authorize-') || ep.startsWith('/pdf/data/')) {
        const isReceipt = ep.includes('receipt');
        const num = endpoint.split('/').pop() || (isReceipt ? 'RCP-2026-081' : 'INV-2026-104');
        const inv = (mockClientData.finance && mockClientData.finance.invoices) ? mockClientData.finance.invoices.find(i => i.invoice_no === num || i.receipt_no === num) : null;
        const totalCents = inv ? inv.amount_cents : 450000;
        const srvName = inv ? inv.title : 'Meta Ads Performance Accelerator (Month 3)';
        const docObj = {
          documentType: isReceipt ? 'receipt' : 'invoice',
          number: num,
          invoiceNumber: inv?.invoice_no || num,
          receiptNumber: inv?.receipt_no || (isReceipt ? num : 'RCP-2026-081'),
          issueDate: inv?.issue_date || '2026-10-31',
          paymentDate: inv?.issue_date || '2026-10-31',
          dueDate: inv?.due_date || '2026-11-14',
          currency: inv?.currency || 'USD',
          status: inv?.status || 'paid',
          serviceName: srvName,
          totalCents: totalCents,
          amountPaidCents: totalCents,
          outstandingBalanceCents: 0,
          paymentMethod: 'Stripe Card Checkout',
          paymentReference: 'TXN-98234190',
          items: [{
            description: srvName,
            quantity: 1,
            unitPriceCents: totalCents,
            totalCents: totalCents
          }],
          client: {
            billingName: mockClientData.user.companyName || mockClientData.user.fullName,
            fullName: mockClientData.user.fullName,
            companyName: mockClientData.user.companyName,
            billingAddress: '555 Mission St, Suite 1400',
            city: mockClientData.user.city,
            country: mockClientData.user.country,
            phone: mockClientData.user.phone,
            email: mockClientData.user.email
          },
          issuer: {
            legalName: 'Whiz Studio',
            tagline: 'Digital Marketing & Growth Consultancy',
            address: 'House 53, Road 7, Block A, Mirpur 12, Dhaka 1216, Bangladesh',
            phone: '+880 1815127022',
            email: 'info@whizstudio.art',
            website: 'https://whizstudio.art'
          }
        };
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: docObj, quota: { max: 2, used: 1, remaining: 1 } } });
      }

      return Promise.resolve({ ok: true, status: 200, data: { success: true, data: [] } });
    }
  };
})();

