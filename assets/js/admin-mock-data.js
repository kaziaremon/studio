/**
 * WHIZ STUDIO — ADMIN & SUPER ADMIN MOCK DATA PROVIDER
 * For isolated preview simulation, client demonstrations, and multi-device QA.
 * 100% authentic data structures matching Cloudflare D1 schema.
 */

(function () {
  'use strict';

  const mockAdminData = {
    user: {
      id: 'usr_super_admin_01',
      fullName: 'Kazi Emon',
      full_name: 'Kazi Emon',
      email: 'kaziaremon@gmail.com',
      username: 'kaziaremon',
      role: 'owner',
      isSuperAdmin: true,
      created_at: '2026-01-01'
    },

    stats: {
      totalClients: 28,
      activeProjects: 14,
      activeServices: 12,
      completedTasks: 142,
      pendingTasks: 18,
      confirmedRevenueCents: 6425000,
      confirmedRevenueByCurrency: [
        { total: 6425000, currency: 'USD' },
        { total: 42000000, currency: 'BDT' }
      ],
      serviceDistribution: [
        { name: 'Meta Ads Accelerator', count: 8 },
        { name: 'Organic SMO Architecture', count: 6 },
        { name: 'LinkedIn Executive Growth', count: 5 },
        { name: 'B2B Lead Funnel', count: 4 },
        { name: 'Brand Visual System', count: 3 },
        { name: 'TikTok & Reels Scale', count: 2 }
      ],
      projectProgress: [
        { name: 'Apex Global Q4 Sprint', progress_percent: 75 },
        { name: 'HyperScale Inbound Funnel', progress_percent: 60 },
        { name: 'Luminary BioTech Refresh', progress_percent: 90 },
        { name: 'Al-Mansoor UAE Omnichannel', progress_percent: 45 }
      ],
      taskStatusDistribution: [
        { status: 'completed', count: 142 },
        { status: 'in_progress', count: 28 },
        { status: 'pending', count: 18 }
      ],
      recentActivity: [
        { title: 'Payment Confirmed', desc: '$4,500.00 from Apex Global Inc. via Stripe', time: '12m ago', icon: 'fa-money-bill-check', color: 'emerald' },
        { title: 'Task Checkpoint Delivered', desc: 'Phase 2: Ad Creative Matrix approved by Sarah Jenkins', time: '1h ago', icon: 'fa-check-double', color: 'emerald' },
        { title: 'New Client Onboarded', desc: 'Luminary BioTech completed CIF registration', time: '3h ago', icon: 'fa-user-plus', color: 'blue' },
        { title: 'Blueprint Task Updated', desc: 'Audience Persona Mapping refined by Admin', time: '5h ago', icon: 'fa-pen-to-square', color: 'amber' },
        { title: 'Invoice Generated', desc: 'INV-2026-089 ($3,500.00) issued to Nexus Corp', time: '8h ago', icon: 'fa-file-invoice-dollar', color: 'slate' }
      ]
    },

    clients: [
      {
        id: 'cli_01',
        full_name: 'Sarah Jenkins',
        company_name: 'Apex Global Inc.',
        email: 'sarah@apexglobal.io',
        phone: '+1 (555) 349-2041',
        city: 'San Francisco',
        country: 'United States',
        status: 'active',
        services_count: 2,
        created_at: '2026-08-15'
      },
      {
        id: 'cli_02',
        full_name: 'Marcus Vance',
        company_name: 'HyperScale SaaS',
        email: 'marcus@hyperscale.co',
        phone: '+44 20 7946 0912',
        city: 'London',
        country: 'United Kingdom',
        status: 'active',
        services_count: 3,
        created_at: '2026-09-02'
      },
      {
        id: 'cli_03',
        full_name: 'Elena Rostova',
        company_name: 'Luminary BioTech',
        email: 'elena@luminary.de',
        phone: '+49 30 567890',
        city: 'Berlin',
        country: 'Germany',
        status: 'active',
        services_count: 1,
        created_at: '2026-10-10'
      },
      {
        id: 'cli_04',
        full_name: 'Tariq Al-Mansoor',
        company_name: 'Al-Mansoor Trading',
        email: 'tariq@almansoor.ae',
        phone: '+971 4 321 4567',
        city: 'Dubai',
        country: 'UAE',
        status: 'active',
        services_count: 2,
        created_at: '2026-10-22'
      },
      {
        id: 'cli_05',
        full_name: 'Tanvir Hossain',
        company_name: 'Bengal Digital Media',
        email: 'tanvir@bengaldigital.com',
        phone: '+880 1711-234567',
        city: 'Dhaka',
        country: 'Bangladesh',
        status: 'active',
        services_count: 1,
        created_at: '2026-10-28'
      }
    ],

    services: [
      { id: 'srv_01', name: 'Meta Ads Performance Accelerator', category: 'Paid Advertising', pricing_cents: 450000, currency: 'USD', active_clients: 8, blueprints_count: 6, description: 'Full-funnel Meta acquisition with creative testing matrix, conversion API tracking, and high-ROAS scaling.' },
      { id: 'srv_02', name: 'Organic Social Media Optimization (SMO)', category: 'Brand & Organic', pricing_cents: 320000, currency: 'USD', active_clients: 6, blueprints_count: 5, description: 'Strategic algorithmic content distribution, engagement architecture, and community scaling across networks.' },
      { id: 'srv_03', name: 'Executive LinkedIn Presence Architecture', category: 'Executive Branding', pricing_cents: 380000, currency: 'USD', active_clients: 5, blueprints_count: 4, description: 'Ghostwriting, thought leadership profiling, and B2B executive network expansion for founders.' },
      { id: 'srv_04', name: 'B2B Enterprise Lead Generation Funnel', category: 'Lead Generation', pricing_cents: 550000, currency: 'USD', active_clients: 4, blueprints_count: 5, description: 'High-ticket inbound qualification, multi-touch cold email architecture, and CRM pipeline automation.' },
      { id: 'srv_05', name: 'Luxury Brand Identity & Visual System', category: 'Creative Direction', pricing_cents: 420000, currency: 'USD', active_clients: 3, blueprints_count: 4, description: 'Complete brand guidelines, design tokens, asset kits, typography systems, and high-end visual positioning.' },
      { id: 'srv_06', name: 'Short-Form Video & Reels Virality Hub', category: 'Content Production', pricing_cents: 360000, currency: 'USD', active_clients: 4, blueprints_count: 4, description: 'Script-to-screen short form video production, trend hooks, retention pacing, and multi-platform publishing.' },
      { id: 'srv_07', name: 'Conversion Rate Optimization (CRO) & Funnels', category: 'Performance', pricing_cents: 480000, currency: 'USD', active_clients: 3, blueprints_count: 4, description: 'Data-driven landing page overhauls, Heatmap UX diagnostics, multivariate A/B testing, and checkout optimization.' },
      { id: 'srv_08', name: 'Omnichannel Google Ads & Intent Search', category: 'Paid Advertising', pricing_cents: 400000, currency: 'USD', active_clients: 3, blueprints_count: 4, description: 'High-intent search keyword harvesting, Performance Max optimization, negative bidding, and YouTube bumper ads.' },
      { id: 'srv_09', name: 'Influencer Marketing & Creator Seeding', category: 'Influencer & PR', pricing_cents: 450000, currency: 'USD', active_clients: 2, blueprints_count: 3, description: 'Vetted creator outreach, product seeding contracts, usage rights negotiation, and whitelisted ad amplification.' },
      { id: 'srv_10', name: 'Content Marketing & Thought Leadership', category: 'Content Production', pricing_cents: 340000, currency: 'USD', active_clients: 3, blueprints_count: 3, description: 'Long-form editorial essays, industry benchmark reports, SEO topic clusters, and distribution networks.' },
      { id: 'srv_11', name: 'Email Lifecycle & Retention Engine', category: 'Lifecycle Marketing', pricing_cents: 300000, currency: 'USD', active_clients: 4, blueprints_count: 4, description: 'Klaviyo / HubSpot flow architecture, behavioral triggers, subscriber segment hygiene, and churn prevention.' },
      { id: 'srv_12', name: 'Executive Growth Retainer (Full-Stack)', category: 'Executive Retainer', pricing_cents: 850000, currency: 'USD', active_clients: 2, blueprints_count: 8, description: 'Dedicated marketing director, weekly executive war-room sessions, and cross-channel marketing orchestration.' }
    ],

    blueprints: [
      { id: 'bp_01', phase: 1, title: 'Client Onboarding & CIF Intake Review', role: 'Operations', estimated_hours: 4, description: 'Verify Brand Assets, target personas, pixel access, and ad account verification.' },
      { id: 'bp_02', phase: 1, title: 'Tracking Infrastructure & CAPI Audit', role: 'Technical', estimated_hours: 6, description: 'Configure server-side GTM, Meta Conversions API, Google Analytics 4, and deduplication.' },
      { id: 'bp_03', phase: 1, title: 'Competitor Ad Creative Dissection', role: 'Creative', estimated_hours: 8, description: 'Deconstruct top 10 niche competitors, identify hook angles, offer positioning, and visual fatigue.' },
      { id: 'bp_04', phase: 1, title: 'Strategic Messaging & Offer Formulation', role: 'Copywriting', estimated_hours: 6, description: 'Draft core positioning angles, pain points, transformation hooks, and risk reversals.' },
      { id: 'bp_05', phase: 2, title: 'Creative Production: Hook Testing Matrix', role: 'Creative', estimated_hours: 12, description: 'Produce 10 static visual variants, 5 motion graphics, and 3 video UGC edits for A/B testing.' },
      { id: 'bp_06', phase: 2, title: 'Ad Copywriting: 3 Angles × 3 Formats', role: 'Copywriting', estimated_hours: 6, description: 'Long-form editorial, punchy bulleted direct-response, and short curiosity-driven variants.' },
      { id: 'bp_07', phase: 2, title: 'Campaign Setup: Dynamic Creative Testing (DCT)', role: 'Paid Media', estimated_hours: 5, description: 'Launch Sandbox DCT ad sets with standardized budget caps and automatic bid testing.' },
      { id: 'bp_08', phase: 2, title: 'Mid-Funnel Retargeting Architecture', role: 'Paid Media', estimated_hours: 4, description: 'Deploy 30-day video viewers and 14-day website engaged audience retargeting funnels.' },
      { id: 'bp_09', phase: 3, title: 'Winning Creative Isolation & Budget Scaling', role: 'Media Buyer', estimated_hours: 8, description: 'Extract proven winner post IDs into Advantage+ CBO scaling campaigns.' },
      { id: 'bp_10', phase: 3, title: 'Executive Weekly Performance Briefing', role: 'Account Lead', estimated_hours: 3, description: 'Generate live ROAS, blended CAC, and creative fatigue diagnostics with video walkthrough.' }
    ],

    projects: [
      { id: 'proj_01', name: 'Apex Global Q4 Acquisition Sprint', client_id: 'cli_01', client_name: 'Apex Global Inc.', service_name: 'Meta Ads Performance Accelerator', progress_percent: 75, phase: 'Phase 2: Execution', status: 'active', assigned_to: 'Sazzad Kabir', deadline: '2026-11-28' },
      { id: 'proj_02', name: 'Apex Thought Leadership Pipeline', client_id: 'cli_01', client_name: 'Apex Global Inc.', service_name: 'Executive LinkedIn Presence Architecture', progress_percent: 90, phase: 'Phase 3: Scaling', status: 'active', assigned_to: 'Naimur Rahman', deadline: '2026-11-15' },
      { id: 'proj_03', name: 'HyperScale Inbound Lead Engine', client_id: 'cli_02', client_name: 'HyperScale SaaS', service_name: 'B2B Enterprise Lead Generation Funnel', progress_percent: 60, phase: 'Phase 2: Execution', status: 'active', assigned_to: 'Ayesha Siddiqa', deadline: '2026-12-05' },
      { id: 'proj_04', name: 'Luminary BioTech Visual Identity Overhaul', client_id: 'cli_03', client_name: 'Luminary BioTech', service_name: 'Luxury Brand Identity & Visual System', progress_percent: 90, phase: 'Phase 3: Review', status: 'active', assigned_to: 'Kazi Emon', deadline: '2026-11-10' },
      { id: 'proj_05', name: 'Al-Mansoor UAE Omnichannel Expansion', client_id: 'cli_04', client_name: 'Al-Mansoor Trading', service_name: 'Meta Ads Performance Accelerator', progress_percent: 45, phase: 'Phase 1: Foundation', status: 'active', assigned_to: 'Sazzad Kabir', deadline: '2026-12-15' },
      { id: 'proj_06', name: 'Bengal Media Short-Form Production Hub', client_id: 'cli_05', client_name: 'Bengal Digital Media', service_name: 'Short-Form Video & Reels Virality Hub', progress_percent: 50, phase: 'Phase 2: Execution', status: 'active', assigned_to: 'Naimur Rahman', deadline: '2026-11-30' }
    ],

    tasks: [
      { id: 'tsk_01', title: 'Complete Meta CAPI Event Deduplication Check', project_name: 'Apex Global Q4 Acquisition Sprint', client_name: 'Apex Global Inc.', priority: 'high', status: 'in_progress', due_date: '2026-11-04', assignee: 'Sazzad Kabir' },
      { id: 'tsk_02', title: 'Draft Week 45 Thought Leadership Articles (3x)', project_name: 'Apex Thought Leadership Pipeline', client_name: 'Apex Global Inc.', priority: 'medium', status: 'completed', due_date: '2026-11-02', assignee: 'Naimur Rahman' },
      { id: 'tsk_03', title: 'Review B2B Cold Outreach Deliverability Scores', project_name: 'HyperScale Inbound Lead Engine', client_name: 'HyperScale SaaS', priority: 'high', status: 'in_progress', due_date: '2026-11-05', assignee: 'Ayesha Siddiqa' },
      { id: 'tsk_04', title: 'Deliver Vector Typography System & Specimen Deck', project_name: 'Luminary BioTech Visual Identity Overhaul', client_name: 'Luminary BioTech', priority: 'medium', status: 'review', due_date: '2026-11-06', assignee: 'Kazi Emon' },
      { id: 'tsk_05', title: 'Localize Arabic Ad Copywriting Variants', project_name: 'Al-Mansoor UAE Omnichannel Expansion', client_name: 'Al-Mansoor Trading', priority: 'high', status: 'todo', due_date: '2026-11-08', assignee: 'Naimur Rahman' },
      { id: 'tsk_06', title: 'Sound Design & Subtitle Mastering for 8 Reels', project_name: 'Bengal Media Short-Form Production Hub', client_name: 'Bengal Digital Media', priority: 'medium', status: 'in_progress', due_date: '2026-11-07', assignee: 'Sazzad Kabir' }
    ],

    payments: [
      { id: 'pay_01', receipt_no: 'RCP-2026-081', client_name: 'Apex Global Inc.', client_id: 'cli_01', amount_cents: 450000, currency: 'USD', method: 'Stripe Card Checkout', status: 'confirmed', created_at: '2026-10-31', notes: 'Monthly retainer renewal (Meta Ads Performance)' },
      { id: 'pay_02', receipt_no: 'RCP-2026-080', client_name: 'HyperScale SaaS', client_id: 'cli_02', amount_cents: 550000, currency: 'USD', method: 'Standard Chartered Wire', status: 'confirmed', created_at: '2026-10-29', notes: 'B2B Enterprise Lead Gen Funnel' },
      { id: 'pay_03', receipt_no: 'RCP-2026-079', client_name: 'Luminary BioTech', client_id: 'cli_03', amount_cents: 420000, currency: 'USD', method: 'Eastern Bank PLC', status: 'confirmed', created_at: '2026-10-25', notes: 'Brand Identity Design Deliverable Milestone' },
      { id: 'pay_04', receipt_no: 'RCP-2026-078', client_name: 'Bengal Digital Media', client_id: 'cli_05', amount_cents: 38000000, currency: 'BDT', method: 'bKash Merchant', status: 'confirmed', created_at: '2026-10-24', notes: 'Short-Form Production Month 1' }
    ],

    invoices: [
      { invoice_no: 'INV-2026-104', client_name: 'Apex Global Inc.', amount_cents: 450000, currency: 'USD', issue_date: '2026-10-31', due_date: '2026-11-14', status: 'paid' },
      { invoice_no: 'INV-2026-103', client_name: 'HyperScale SaaS', amount_cents: 550000, currency: 'USD', issue_date: '2026-10-29', due_date: '2026-11-12', status: 'paid' },
      { invoice_no: 'INV-2026-102', client_name: 'Luminary BioTech', amount_cents: 420000, currency: 'USD', issue_date: '2026-10-25', due_date: '2026-11-08', status: 'paid' },
      { invoice_no: 'INV-2026-101', client_name: 'Al-Mansoor Trading', amount_cents: 450000, currency: 'USD', issue_date: '2026-11-01', due_date: '2026-11-15', status: 'pending' },
      { invoice_no: 'INV-2026-100', client_name: 'Bengal Digital Media', amount_cents: 38000000, currency: 'BDT', issue_date: '2026-10-24', due_date: '2026-11-07', status: 'paid' }
    ],

    paymentMethods: [
      { key: 'ebl', title: 'Eastern Bank PLC (BDT & Dual Currency)', type: 'Bank Wire', account_number: '1041060000000', routing_number: '095260000', bank_name: 'Eastern Bank PLC', branch: 'Gulshan Branch, Dhaka', status: 'active', instructions: 'Direct NEFT / RTGS transfer for Bangladesh operations.' },
      { key: 'scb', title: 'Standard Chartered Bank (International USD/EUR)', type: 'Wire Transfer', account_number: '01-1234567-01', swift_code: 'SCBLBDDX', bank_name: 'Standard Chartered Bank', branch: 'Main Branch, Dhaka', status: 'active', instructions: 'SWIFT wire transfer for international corporate retainers.' },
      { key: 'bkash', title: 'bKash Merchant Account', type: 'Mobile Financial Service', account_number: '01711-234567', bank_name: 'bKash Limited', branch: 'Merchant Wallet', status: 'active', instructions: 'Use Make Payment with Invoice Number reference.' },
      { key: 'stripe', title: 'Stripe Global Card Gateway', type: 'Credit / Debit Card', account_number: 'acct_1MWhizStudioGlobal', bank_name: 'Stripe Inc.', branch: 'Online Checkout', status: 'active', instructions: 'Supports Visa, Mastercard, American Express with 3D Secure verification.' }
    ],

    team: [
      { id: 'usr_01', fullName: 'Kazi Emon', full_name: 'Kazi Emon', email: 'kaziaremon@gmail.com', role: 'owner', isSuperAdmin: true, status: 'active', designation: 'Founder & Principal Consultant', created_at: '2026-01-01' },
      { id: 'usr_02', fullName: 'Sazzad Kabir', full_name: 'Sazzad Kabir', email: 'sazzad@whizstudio.io', role: 'admin', isSuperAdmin: false, status: 'active', designation: 'Operations Administrator', created_at: '2026-02-15' },
      { id: 'usr_03', fullName: 'Farhan Ahmed', full_name: 'Farhan Ahmed', email: 'farhan@whizstudio.io', role: 'accountant', isSuperAdmin: false, status: 'active', designation: 'Accounts & Billing Manager', created_at: '2026-03-01' },
      { id: 'usr_04', fullName: 'Ayesha Siddiqa', full_name: 'Ayesha Siddiqa', email: 'ayesha@whizstudio.io', role: 'employee', isSuperAdmin: false, status: 'active', designation: 'Senior Marketing Strategist', created_at: '2026-04-10' },
      { id: 'usr_05', fullName: 'Naimur Rahman', full_name: 'Naimur Rahman', email: 'naimur@whizstudio.io', role: 'employee', isSuperAdmin: false, status: 'active', designation: 'Lead Creative Copywriter', created_at: '2026-05-20' }
    ],

    roleHistory: [
      { id: 'rh_01', user_name: 'Sazzad Kabir', previous_role: 'employee', new_role: 'admin', changed_by: 'Kazi Emon', changed_at: '2026-02-15 10:30' },
      { id: 'rh_02', user_name: 'Farhan Ahmed', previous_role: 'employee', new_role: 'accounts', changed_by: 'Kazi Emon', changed_at: '2026-03-01 14:15' }
    ],

    support: [
      { id: 'sup_01', ticket_number: 'TIC-1092', client_name: 'Sarah Jenkins', client_email: 'sarah@apexglobal.io', org_name: 'Apex Global Inc.', subject: 'Q4 Black Friday creative testing variants', status: 'in_progress', priority: 'high', created_at: '2026-11-01 14:22', message: 'Hello team, we would like to add 3 new static variants and 2 short video hooks focusing on the 30% bundle discount before the Black Friday launch.' },
      { id: 'sup_02', ticket_number: 'TIC-1091', client_name: 'Marcus Vance', client_email: 'marcus@hyperscale.co', org_name: 'HyperScale SaaS', subject: 'Adjust weekly reporting call time', status: 'open', priority: 'medium', created_at: '2026-11-01 09:40', message: 'Can we move our recurring Thursday progress briefing 1 hour later (to 4:00 PM GMT) to accommodate our US partners?' },
      { id: 'sup_03', ticket_number: 'TIC-1090', client_name: 'Elena Rostova', client_email: 'elena@luminary.de', org_name: 'Luminary BioTech', subject: 'Receipt PDF copy for fiscal Q3 closing', status: 'resolved', priority: 'low', created_at: '2026-10-30 11:15', message: 'Our accounting department needs a signed and stamped vector PDF copy of receipt RCP-2026-079.' },
      { id: 'sup_04', ticket_number: 'TIC-1089', client_name: 'Tariq Al-Mansoor', client_email: 'tariq@almansoor.ae', org_name: 'Al-Mansoor Trading', subject: 'Scope inquiry: LinkedIn ads expansion', status: 'open', priority: 'medium', created_at: '2026-10-29 16:05', message: 'We are very pleased with our initial Meta results and would like to explore adding B2B LinkedIn ads next month.' }
    ],

    auditLogs: [
      { id: 'aud_01', user_name: 'Kazi Emon', action: 'PAYMENT_RECORDED', details: 'Confirmed $4,500.00 from Apex Global Inc. (RCP-2026-081)', timestamp: '2026-10-31 16:45:12' },
      { id: 'aud_02', user_name: 'Sazzad Kabir', action: 'BLUEPRINT_APPLIED', details: 'Applied Meta Ads DCT Blueprint to Apex Q4 Sprint', timestamp: '2026-10-30 11:20:00' },
      { id: 'aud_03', user_name: 'Kazi Emon', action: 'SERVICE_CREATED', details: 'Added new service catalog item: Influencer Marketing', timestamp: '2026-10-28 09:12:44' },
      { id: 'aud_04', user_name: 'Farhan Ahmed', action: 'INVOICE_GENERATED', details: 'Generated invoice INV-2026-104 for Apex Global Inc.', timestamp: '2026-10-27 15:33:19' }
    ],

    trustedDevices: [
      { id: 'dev_01', device_name: 'Administrator Workstation (Chrome on Windows 11)', ip_address: '103.145.234.12', last_active: 'Active now (Current Device)', is_current: true },
      { id: 'dev_02', device_name: 'Executive MacBook Pro (Safari on macOS Sonoma)', ip_address: '103.145.234.88', last_active: '3 hours ago', is_current: false },
      { id: 'dev_03', device_name: 'iPhone 15 Pro (Mobile Safari on iOS 18)', ip_address: '103.145.234.95', last_active: 'Yesterday', is_current: false }
    ]
  };

  window.__whizAdminMock = {
    getData: () => mockAdminData,

    handleRequest: function (endpoint, options = {}, state = {}) {
      const ep = endpoint.split('?')[0];
      const method = (options.method || 'GET').toUpperCase();

      console.log(`[Whiz Preview Mock API] [${method}] ${endpoint}`);

      // 1. Current Profile
      if (ep === '/portal/me') {
        const role = (state.adminProfile && state.adminProfile.role) || (state.currentUser && state.currentUser.role) || 'owner';
        const userObj = Object.assign({}, mockAdminData.user, { role: role });
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: { user: userObj } } });
      }

      // 2. Stats & Overview
      if (ep === '/portal/admin/stats') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockAdminData.stats } });
      }

      // 3. Clients
      if (ep === '/clients' || ep === '/portal/admin/clients') {
        if (method === 'POST') {
          const body = JSON.parse(options.body || '{}');
          const newCli = {
            id: 'cli_' + Date.now().toString().slice(-4),
            full_name: body.full_name || body.name || 'New Client',
            company_name: body.company_name || 'New Company',
            email: body.email || 'client@example.com',
            phone: body.phone || '',
            city: body.city || 'Dhaka',
            country: body.country || 'Bangladesh',
            status: 'active',
            services_count: 0,
            created_at: new Date().toISOString().split('T')[0]
          };
          mockAdminData.clients.unshift(newCli);
          return Promise.resolve({ ok: true, status: 200, data: { success: true, message: 'Client registered successfully.', client: newCli } });
        }
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockAdminData.clients } });
      }

      if (ep.startsWith('/clients/')) {
        const parts = ep.split('/');
        const cid = parts[2];
        const client = mockAdminData.clients.find(c => c.id === cid) || mockAdminData.clients[0];
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: client } });
      }

      // 4. Services
      if (ep === '/services' || ep === '/services/catalog') {
        if (method === 'POST') {
          const body = JSON.parse(options.body || '{}');
          const newSrv = {
            id: 'srv_' + Date.now().toString().slice(-4),
            name: body.name || 'Custom Agency Service',
            category: body.category || 'Specialized',
            pricing_cents: parseInt(body.pricing_cents || body.price || 3500) * 100,
            currency: body.currency || 'USD',
            active_clients: 0,
            blueprints_count: 0,
            description: body.description || ''
          };
          mockAdminData.services.unshift(newSrv);
          return Promise.resolve({ ok: true, status: 200, data: { success: true, message: 'Service created successfully.', service: newSrv } });
        }
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockAdminData.services } });
      }

      // 5. Blueprints
      if (ep.includes('/blueprints')) {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockAdminData.blueprints } });
      }

      // 6. Projects
      if (ep === '/projects') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockAdminData.projects } });
      }

      // 7. Tasks
      if (ep === '/portal/admin/live-tasks' || ep === '/tasks') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockAdminData.tasks } });
      }

      // 8. Finance Payments
      if (ep === '/finance/payments') {
        if (method === 'POST') {
          const body = JSON.parse(options.body || '{}');
          const newPay = {
            id: 'pay_' + Date.now().toString().slice(-4),
            receipt_no: 'RCP-2026-' + Math.floor(100 + Math.random() * 900),
            client_name: body.client_name || 'Apex Global Inc.',
            amount_cents: parseInt(body.amount || 1000) * 100,
            currency: body.currency || 'USD',
            method: body.method || 'Stripe Card Checkout',
            status: 'confirmed',
            created_at: new Date().toISOString().split('T')[0],
            notes: body.notes || 'Payment recorded via console'
          };
          mockAdminData.payments.unshift(newPay);
          return Promise.resolve({ ok: true, status: 200, data: { success: true, message: 'Payment recorded successfully.', payment: newPay } });
        }
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockAdminData.payments } });
      }

      // 9. Invoices
      if (ep === '/finance/invoices') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockAdminData.invoices } });
      }

      // 10. Payment Methods
      if (ep === '/finance/payment-methods') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockAdminData.paymentMethods } });
      }

      // 11. Team & Users
      if (ep === '/portal/admin/team' || ep === '/portal/admin/users') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockAdminData.team } });
      }

      if (ep === '/portal/admin/role-history') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockAdminData.roleHistory } });
      }

      // 12. Support Requests
      if (ep === '/portal/admin/support') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockAdminData.support } });
      }

      // 13. Audit History
      if (ep === '/audit-logs' || ep === '/portal/admin/history') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockAdminData.auditLogs } });
      }

      // 14. Trusted Devices
      if (ep === '/security/trusted-devices') {
        return Promise.resolve({ ok: true, status: 200, data: { success: true, data: mockAdminData.trustedDevices } });
      }

      // Default fallback
      return Promise.resolve({ ok: true, status: 200, data: { success: true, message: 'OK (Mock)', data: [] } });
    }
  };
})();

