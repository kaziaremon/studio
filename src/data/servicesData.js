/**
 * Core Digital Marketing & Consulting Services Data
 * 4 Primary Disciplines: Facebook Advertising, Social Media Marketing, Platform Optimization, Business Growth Planning
 */
export const servicesData = [
  {
    id: "facebook-advertising",
    name: "Facebook Advertising",
    category: "Paid Acquisition",
    badge: "High ROAS",
    tagline: "Hyper-targeted audience modeling & full-funnel acquisition architectures.",
    iconColor: "#1877F2",
    accentGlow: "rgba(24, 119, 242, 0.3)",
    description: "We engineer high-converting Facebook and Meta advertising campaigns combining Advantage+ Shopping Campaigns (ASC), custom Lookalike modeling, structured creative testing (DCT), and rigorous retargeting loops.",
    metrics: [
      { label: "Avg. ROAS", value: "4.4x" },
      { label: "CPA Reduction", value: "-36%" },
      { label: "Tested Hooks/Mo", value: "40+" }
    ],
    features: [
      "Meta Conversions API (CAPI) Server-Side Tracking",
      "Dynamic Creative Testing (DCT) & Hook Fatigue Prevention",
      "High-Intent Custom & Lookalike Audience Modeling",
      "Advantage+ Shopping & Catalog Retargeting Frameworks",
      "Strict Ad Account Policy & Compliance Protection"
    ],
    deliverables: [
      "Full TOFU, MOFU, and BOFU Campaign Architecture",
      "Weekly High-Converting Creative Variations & Angles",
      "Real-time Transparent Performance Dashboard",
      "Dedicated Media Buyer & Copywriting Consultation"
    ],
    idealFor: "E-Commerce, Direct-to-Consumer Brands, B2B Lead Gen, Real Estate"
  },
  {
    id: "social-media-marketing",
    name: "Social Media Marketing",
    category: "Organic & Paid Synergy",
    badge: "Audience Growth",
    tagline: "High-impact visual narratives, viral distribution, and multi-channel engagement.",
    iconColor: "#E1306C",
    accentGlow: "rgba(225, 48, 108, 0.3)",
    description: "Build an active, loyal audience across Instagram, LinkedIn, YouTube, and Pinterest. We craft thumb-stopping short-form video strategies, thought leadership positioning, and organic-to-paid amplification systems.",
    metrics: [
      { label: "Engagement Lift", value: "+280%" },
      { label: "Qualified Reach", value: "450k+" },
      { label: "Content Output", value: "24/mo" }
    ],
    features: [
      "High-Impact Short-Form Video Strategy & Creative Direction",
      "Multi-Platform Repurposing & Unified Brand Aesthetics",
      "Strategic Creator / Influencer Whitelisting Campaigns",
      "Automated Social Lead Funnels & Direct Inquiries",
      "Community Engagement Protocols & Brand Sentiment Tracking"
    ],
    deliverables: [
      "Monthly Content Calendar & Strategic Hook Library",
      "Custom Graphic & Motion Assets Engineered for High CTR",
      "Bi-Weekly Analytics Review & Distribution Audit",
      "Omnichannel Publishing & Engagement Automation"
    ],
    idealFor: "Lifestyle Brands, Professional Services, High-Ticket Agencies, B2B Tech"
  },
  {
    id: "platform-optimization",
    name: "Platform Optimization",
    category: "Technical Telemetry",
    badge: "Zero Data Loss",
    tagline: "Server-side tracking, First-Party data architecture, and funnel conversion lift.",
    iconColor: "#00A86B",
    accentGlow: "rgba(0, 168, 107, 0.3)",
    description: "Eliminate attribution blind spots. We deploy server-side tracking (Meta CAPI, Google Enhanced Conversions, Server GTM), optimize landing page conversion rates (CRO), and unify tracking across Shopify, WooCommerce, and custom platforms.",
    metrics: [
      { label: "Attribution Accuracy", value: "99.4%" },
      { label: "CVR Improvement", value: "+32%" },
      { label: "Event Match Quality", value: "9.2/10" }
    ],
    features: [
      "Server-Side Google Tag Manager (sGTM) Infrastructure",
      "Meta Conversions API (CAPI) & Google Enhanced Tracking",
      "Landing Page Speed Optimization & Core Web Vitals Audits",
      "Conversion Rate Optimization (CRO) & Heatmap Diagnostics",
      "Multi-Touch Attribution Modeling Across Ad Networks"
    ],
    deliverables: [
      "Complete Server-Side Tracking Blueprint & Verification",
      "Detailed CRO Audit with Actionable UX Wireframes",
      "Centralized Looker Studio Attribution Dashboard",
      "30-Day Post-Setup Data Integrity Monitoring"
    ],
    idealFor: "Scaling Brands Experiencing Ad Pixel Discrepancies & Tracking Loss"
  },
  {
    id: "business-growth-planning",
    name: "Business Growth Planning",
    category: "Executive Advisory",
    badge: "Scale Strategy",
    tagline: "Unit economics modeling, blended CAC governance, and sustainable margin expansion.",
    iconColor: "#FF5E1E",
    accentGlow: "rgba(255, 94, 30, 0.3)",
    description: "Scaling ad spend without knowing your unit economics is financial suicide. We build mathematical forecasting models analyzing customer lifetime value (LTV), payback periods, contribution margin, and capital efficiency.",
    metrics: [
      { label: "Margin Protection", value: "+24%" },
      { label: "LTV Expansion", value: "+45%" },
      { label: "Payback Period", value: "<45 Days" }
    ],
    features: [
      "Contribution Margin & Blended Acquisition Cost (MER) Modeling",
      "Customer Lifetime Value (LTV) Cohort Analysis",
      "Cash Flow & Ad Spend Velocity Budgeting Roadmaps",
      "Offer Architecture, Pricing Strategy & Bundle Restructuring",
      "Quarterly Growth OKR Benchmarking & Executive Advisory"
    ],
    deliverables: [
      "Custom Financial Forecasting Model & Scaling Matrix",
      "Unit Economics Diagnostic & Margin Health Scorecard",
      "Bi-Weekly Strategic Advisory Strategy Sessions",
      "Step-by-Step Capital Allocation & Expansion Roadmap"
    ],
    idealFor: "Founders, CMOs, & Business Leaders Scaling from 6 to 7+ Figures"
  }
];

export const trustMetrics = [
  { value: "$48M+", label: "Managed Ad Spend", sub: "Globally across major platforms" },
  { value: "4.8x", label: "Average Client ROAS", sub: "Performance marketing benchmark" },
  { value: "98.2%", label: "Client Retention Rate", sub: "Long-term consulting partnerships" },
  { value: "24/7", label: "Telemetry Health", sub: "Zero-downtime monitoring" },
  { value: "3.2M+", label: "Qualified Inquiries", sub: "Via automated conversational funnels" },
];

export const caseStudiesData = [
  {
    id: 1,
    title: "Aura Luxe Fashion",
    category: "E-Commerce",
    platforms: ["Facebook Advertising", "Social Media Marketing", "Platform Optimization"],
    headline: "Scaling luxury fashion brand from $45k/mo to $380k/mo in 6 months",
    metrics: [
      { key: "ROAS", val: "5.8x" },
      { key: "Revenue Lift", val: "+744%" },
      { key: "Blended CPA", val: "-42%" }
    ],
    quote: "Whiz Studio took over our advertising, restructured our server-side CAPI tracking, and scaled us profitably with zero ad fatigue.",
    clientName: "Elena Vance",
    clientRole: "Head of Growth, Aura Luxe"
  },
  {
    id: 2,
    title: "CloudMatrix SaaS",
    category: "B2B SaaS",
    platforms: ["Social Media Marketing", "Platform Optimization", "Business Growth Planning"],
    headline: "Generating $3.4M in enterprise pipeline with high-intent Search & ABM targeting",
    metrics: [
      { key: "SQL Volume", val: "+310%" },
      { key: "Cost Per Demo", val: "$142" },
      { key: "Pipeline Value", val: "$3.4M" }
    ],
    quote: "The multi-channel strategy engineered by Whiz Studio directly secured 18 enterprise contracts in Q3 alone.",
    clientName: "Marcus Sterling",
    clientRole: "VP of Marketing, CloudMatrix"
  },
  {
    id: 3,
    title: "Verve Nutrition",
    category: "D2C Brands",
    platforms: ["Facebook Advertising", "Social Media Marketing", "Business Growth Planning"],
    headline: "Building automated conversational funnels with 98% open rate and $1.2M in recurring orders",
    metrics: [
      { key: "Conversion Rate", val: "98.2%" },
      { key: "Repeat Order Rate", val: "54%" },
      { key: "Cart Recovery", val: "38.2%" }
    ],
    quote: "Whiz Studio's conversion optimization funnel generated significant repeat subscriptions with transparent attribution.",
    clientName: "Samantha Reed",
    clientRole: "Founder & CEO, Verve Nutrition"
  },
  {
    id: 4,
    title: "Apex Horizon Realty",
    category: "High-Ticket Lead Gen",
    platforms: ["Facebook Advertising", "Platform Optimization", "Business Growth Planning"],
    headline: "Capturing $24M+ in property sales via hyper-targeted video acquisition funnels",
    metrics: [
      { key: "Lead-to-Viewing", val: "28%" },
      { key: "Cost Per Lead", val: "$38" },
      { key: "Sales Closed", val: "$24M+" }
    ],
    quote: "High-intent video ads coupled with instant qualification gave our brokers pre-vetted buyers before competitors could even respond.",
    clientName: "David Chen",
    clientRole: "Managing Director, Apex Horizon"
  }
];

export const faqsData = [
  {
    q: "How does Whiz Studio differ from traditional marketing agencies?",
    a: "Unlike traditional agencies that run cookie-cutter campaigns in silos, Whiz Studio operates as your strategic Digital Platform Management & Marketing Consultant. We connect deep technical server-side tracking (CAPI, sGTM) with high-converting creative testing and financial unit economics modeling."
  },
  {
    q: "What is your minimum monthly ad spend recommendation?",
    a: "We work with businesses starting at low-tier validation budgets ($150–$500/month or ৳15,000–৳50,000/month) all the way up to high-velocity scale ($50,000+/month). Our strategies adapt to the capital efficiency of your specific stage."
  },
  {
    q: "How do you ensure data integrity and accurate attribution?",
    a: "We deploy server-side Conversions API (CAPI) infrastructure alongside Server Google Tag Manager (sGTM) to bypass browser ad blockers and iOS privacy restrictions. This ensures 99%+ of conversion signals are captured without data loss."
  },
  {
    q: "How quickly can our campaigns launch after onboarding?",
    a: "Our standardized 4-Phase Growth Methodology gets your tracking, audience intelligence, and initial creative testing live within 5 to 7 business days following the initial onboarding milestone."
  },
  {
    q: "Do you provide transparent reporting and full account ownership?",
    a: "100% yes. You always maintain full master admin ownership of all your ad accounts, pixels, and data assets. We operate with complete radical transparency—no proprietary lock-ins or hidden markups."
  }
];
