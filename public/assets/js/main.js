/**
 * WHIZ STUDIO - MAIN JAVASCRIPT CONTROLLER
 * Tech Stack: Vanilla JavaScript, GSAP 3.12+, ScrollTrigger
 * Domain: whizstudio.art | Brand: Whiz Studio
 */

// =============================================================================
// 1. CONFIGURATION & WEBHOOK INTEGRATIONS
// =============================================================================

// CLOUDFLARE WORKER BACKEND ENGINE API
const CLOUDFLARE_WORKER_API = 'https://whizstudio-proxy.kaziaremon.workers.dev';
const API_BASE = CLOUDFLARE_WORKER_API;


// =============================================================================
// 2. DATA REGISTRIES (SERVICES & SEO ARTICLES)
// =============================================================================

const SERVICES_DATA = {
  "facebook-marketing": {
    title: "Facebook Marketing",
    subtitle: "Organic Authority & Community Retention",
    badge: "Community & Trust",
    necessityHeadline: "Why Your Brand Cannot Rely on Sporadic Organic Posting",
    whyNeed: `In today's fast-moving social landscape, an organic Facebook presence is no longer about broadcast vanity metrics. It is the digital storefront where high-intent buyers vet your legitimacy before making financial commitments. 

When potential clients discover your brand, the first action they take is verifying your social presence. An unmaintained page with irregular updates, generic stock graphics, and unmoderated comments signals business instability. Consistent, strategic Facebook marketing establishes immediate credibility, builds an active community around your value proposition, and keeps your brand top-of-mind when purchasing needs arise. Without it, you actively leak warm, high-intent prospects to competitors whose pages look established and active every single day.`,
    whoNeeds: `• B2C & Local Businesses seeking consistent customer retention and regional market trust.
• Service Companies where client trust, customer reviews, and direct messenger inquiries drive deal flow.
• Direct-to-Consumer (D2C) brands needing a dedicated, engaged community for repeat lifetime value (LTV).`,
    keyTakeaway: "A dormant Facebook page actively repels paying clients. A structured marketing presence converts casual visitors into long-term brand advocates."
  },

  "instagram-marketing": {
    title: "Instagram Marketing",
    subtitle: "Visual Prestige & Cultural Positioning",
    badge: "Brand Positioning",
    necessityHeadline: "Why Visual Credibility Dictates Your Premium Pricing Power",
    whyNeed: `Instagram is the premier visual proof engine of the internet. Perceived value is largely visual: when aesthetic presentation feels disjointed, amateur, or inconsistent, prospective buyers immediately question your pricing and product quality.

A disorganized feed directly erodes client confidence before they ever reach your checkout or booking calendar. High-value clients make quick judgments based on aesthetic polish, narrative coherence, and social proof. Without intentional Instagram positioning, you are forced to compete on price rather than brand prestige, leaving significant enterprise margin on the table.`,
    whoNeeds: `• Lifestyle, Fashion, Retail & Hospitality brands where aesthetic appeal directly influences buying decisions.
• Modern Professional Services, Clinics & Creative Studios seeking high-ticket client acquisition.
• Founders & Brands launching modern products that demand premium positioning in a crowded market.`,
    keyTakeaway: "Your visual feed is your modern retail storefront. Inconsistency reduces buyer confidence; curated prestige unlocks premium pricing."
  },

  "facebook-ads": {
    title: "Facebook Ads",
    subtitle: "Scalable Customer Acquisition Engine",
    badge: "Direct Response Ads",
    necessityHeadline: "Why Relying Solely on Organic Reach Kills Business Scalability",
    whyNeed: `Organic reach across Meta platforms is algorithmically limited to a minute fraction of your existing following. Hoping that organic posts will consistently generate revenue is not a growth strategy, it is business gambling.

Paid Facebook advertising is the only reliable mechanism that allows an ambitious company to predict customer acquisition costs, test offer messaging against tens of thousands of qualified prospects daily, and control lead pipeline volume on demand. If you do not operate a structured paid ad engine, your business growth is held hostage by word-of-mouth plateau and unpredictable algorithmic whims.`,
    whoNeeds: `• Validated Businesses that need predictable, scalable monthly client and sales volume.
• E-commerce Brands seeking repeatable customer acquisition with measurable Return on Ad Spend (ROAS).
• Lead Generation Companies needing a daily influx of qualified discovery calls and quote requests.`,
    keyTakeaway: "Organic social maintains existing relationships; structured paid advertising is the engine that reliably acquires new customers at scale."
  },

  "instagram-ads": {
    title: "Instagram Ads",
    subtitle: "High-Converting Vertical Video & Impulse Capture",
    badge: "Impulse Acquisition",
    necessityHeadline: "Why Ignoring Vertical Format Ads Forfeits Modern Impulse Buyers",
    whyNeed: `Consumer attention has decisively shifted to mobile-first vertical content, including Reels and Stories. Modern buyers make rapid buying decisions and book consultations directly within their native Instagram browsing experience.

Failing to deploy dedicated, high-converting Instagram ad placements forfeits the highest-converting mobile impulse-traffic channel available. If your ads are merely resized desktop banners or generic text posts, users swipe past in milliseconds. Without strategic, thumb-stopping Instagram ad campaigns, you surrender modern demographic attention to competitors who understand the vertical video format.`,
    whoNeeds: `• Brands targeting active demographics (ages 18–45) who interact and buy primarily on mobile feeds.
• Direct-to-Consumer & Fast-Moving Consumer Goods (FMCG) businesses driving instant purchases.
• Event Organizers, Educational Programs & Mobile Funnels requiring rapid action and instant registration.`,
    keyTakeaway: "Attention lives in vertical feeds. Native vertical ad creatives capture impulse buyers before hesitation sets in."
  },

  "social-media-optimization": {
    title: "Social Media Optimization (SMO)",
    subtitle: "Profile Architecture & Conversion Infrastructure",
    badge: "Conversion Hygiene",
    necessityHeadline: "Why Running Ads to Unoptimized Profiles Wastes Your Marketing Budget",
    whyNeed: `Driving paid traffic to an unoptimized social profile is the equivalent of pouring water into a leaky bucket. When users see your advertisement, a massive percentage will click through to your main profile to inspect your credentials before completing a purchase or inquiry.

If your bio is vague, your call-to-action is broken, your highlights lack essential social proof, or your profile search keywords are missing, that hard-won traffic vanishes instantly. Without Social Media Optimization (SMO), your customer acquisition cost (CAC) artificially doubles because your platform infrastructure fails to convert the visitors you already paid to attract.`,
    whoNeeds: `• Any business currently running paid campaigns experiencing low conversion rates on profile clicks.
• Brands transitioning into new markets or launching refreshed service lines.
• Established companies whose social media profiles have become cluttered, outdated, or confusing.`,
    keyTakeaway: "Paid traffic brings visitors to your doorstep; Social Media Optimization turns that doorstep into an automated conversion funnel."
  },

  "linkedin-optimization": {
    title: "LinkedIn Optimization",
    subtitle: "Executive Authority & High-Ticket B2B Pipeline",
    badge: "B2B Authority",
    necessityHeadline: "Why Anonymous Company Pages Fail to Close High-Ticket B2B Contracts",
    whyNeed: `In enterprise B2B sales and high-ticket consulting, corporate buyers do not buy from faceless company logos. They buy from trusted executives, industry thought leaders, and credible practitioners.

If an executive's or company's LinkedIn profile looks like a generic resume rather than a value-driven client-landing asset, procurement heads and founders will quietly dismiss your proposals in favor of competitors who project clear authority. An unoptimized LinkedIn profile causes high-value B2B opportunities to stall before initial discovery conversations even commence.`,
    whoNeeds: `• B2B Founders, Agency Leaders & Managing Directors closing five- and six-figure contracts.
• Corporate Consultants, Professional Advisors & IT/SaaS Executives seeking inbound partnership inquiries.
• Companies targeting corporate procurement teams, institutional investors, and strategic alliances.`,
    keyTakeaway: "High-ticket enterprise buyers vet the people behind the pitch. An authoritative LinkedIn presence transforms cold outreach into warm inbound respect."
  }
};

const ARTICLES_DATA = {
  "organic-reach-reality": {
    title: "Why Organic Reach Alone Can't Sustain Growth on Meta in 2026",
    category: "Paid Acquisition Strategy",
    date: "Corporate Insights • 5 Min Read",
    excerpt: "The mathematical reality of social platform algorithms and why combining organic positioning with structured paid ads is the only predictable growth path.",
    content: `
      <h3>The Algorithmic Reality of Meta Platforms in 2026</h3>
      <p>For high-growth brands and enterprise leaders, relying purely on organic distribution on Facebook and Instagram is no longer a viable <strong>marketing strategy</strong>. Over the past several years, Meta has systematically recalibrated its recommendation engine to prioritize paid commercial inventory, private messaging circles, and creator-led reels. As a result, organic reach for commercial pages has plummeted to an average of under 2%, rendering organic posting alone incapable of driving predictable business expansion.</p>
      
      <p>When an enterprise publishes high-effort content without targeted amplification, over 98% of its existing follower base never sees it in their feeds. Relying exclusively on organic dissemination creates severe revenue bottlenecks, unpredictable lead flow, and volatile customer acquisition cycles. To unlock continuous scaling, modern businesses require a dual-engine architecture combining organic authority with enterprise-grade <strong>Facebook Ads management</strong>.</p>

      <h3>The Interdependence of Organic Credibility and Paid Precision</h3>
      <p>Top-performing commercial brands recognize that organic engagement and performance media are not adversarial tactics; they are mutually reinforcing components of a unified growth engine:</p>
      <ul>
        <li><strong>Foundation via Social Media Optimization (SMO):</strong> Polished profiles, authoritative story highlights, and optimized bios turn cold traffic into verified inquiries when prospects conduct due diligence.</li>
        <li><strong>Precision Paid Distribution:</strong> Systematic paid campaigns bypass algorithmic suppression, guaranteeing consistent daily impressions in front of in-market buyer personas.</li>
        <li><strong>Data-Driven Growth Infrastructure:</strong> Advanced pixel tracking, custom audience segmentation, and multi-channel attribution bridge top-of-funnel discovery with measurable pipeline velocity.</li>
        <li><strong>High-Value B2B Lead Generation:</strong> Combining brand awareness funnels with targeted lead magnets captures procurement managers, executive directors, and key stakeholders.</li>
      </ul>

      <h3>Engineering Scalable Revenue with Dual-Engine Synergies</h3>
      <p>Without disciplined paid media, organic content is broadcast into a void; without organic brand credibility, paid advertising suffers from depressed conversion rates and soaring acquisition costs. Sustainable expansion demands continuous creative validation, real-time funnel optimization, and relentless split-testing across target demographics.</p>

      <p>At <strong>Whiz Studio</strong>, recognized as a <strong>top digital marketing agency</strong>, we implement comprehensive, <strong>data-driven growth</strong> frameworks to solve this exact challenge. Our team fuses rigorous <strong>Facebook Ads management</strong> with conversion-focused <strong>Social Media Optimization (SMO)</strong> to engineer predictable customer acquisition pipelines that insulate your brand against unpredictable algorithm updates and maximize lifetime return on ad spend.</p>
    `
  },

  "smo-ad-efficiency": {
    title: "Social Media Optimization (SMO): The Overlooked Foundation of Paid Ad Efficiency",
    category: "Platform Infrastructure",
    date: "Optimization Analysis • 6 Min Read",
    excerpt: "How conversion rate leaks across bios, highlights, and profile architecture artificially inflate customer acquisition costs across all campaigns.",
    content: `
      <h3>The Hidden Leak in Performance Marketing Budgets</h3>
      <p>When customer acquisition costs spike or advertising returns begin to stagnate, growth teams routinely assign blame to ad creative variations, copy angles, or bidding strategies. However, in our comprehensive audits across enterprise accounts, the true conversion bottleneck frequently sits outside the ad manager entirely: the brand's digital storefront. In today's discerning consumer ecosystem, <strong>Social Media Optimization (SMO)</strong> serves as the indispensable bridge between initial impression and commercial conversion.</p>
      
      <p>Modern buyer behavior has fundamentally shifted. Over 45% of users who encounter a sponsored ad do not click directly to an external landing page; instead, they tap through to the brand’s main profile handle. If that profile features an ambiguous bio, outdated posts, broken link routing, or disjointed visual branding, prospects immediately drop off. This "leaky bucket" phenomenon artificially drives up costs across every <strong>Facebook Ads management</strong> initiative, sabotaging overall ROI.</p>

      <h3>Core Pillars of High-Conversion Social Infrastructure</h3>
      <p>Establishing an authoritative profile ecosystem transforms casual profile visitors into high-intent inbound inquiries. A robust <strong>marketing strategy</strong> focuses on four essential pillars:</p>
      <ul>
        <li><strong>Value-Engineered Bio Positioning:</strong> Clearly articulate target clientele, proprietary value propositions, and primary calls to action within seconds of visitor arrival.</li>
        <li><strong>Curated Social Proof Archives:</strong> Organize verified client reviews, portfolio case studies, and corporate milestones into structured, evergreen highlights.</li>
        <li><strong>Frictionless Inbound Gateways:</strong> Eliminate complex navigation in favor of streamlined WhatsApp routing, calendar scheduling links, and direct messaging funnels.</li>
        <li><strong>Enterprise B2B Lead Generation:</strong> Align executive messaging with institutional procurement expectations, turning organic profiles into active lead capture assets.</li>
      </ul>

      <h3>Compounding Returns Through Profile Optimization</h3>
      <p>Profile optimization yields compounding financial dividends. Improving profile visitor-to-inquiry conversion rates from 2% to 4% effectively cuts your overall acquisition expenditure in half without requiring an extra penny of media budget. It ensures that every ad impression generates maximum commercial equity across both retail and corporate audiences.</p>

      <p>At <strong>Whiz Studio</strong>, acknowledged as a <strong>top digital marketing agency</strong>, we implement tailored, <strong>data-driven growth</strong> frameworks to solve this conversion discrepancy. By synchronizing rigorous <strong>Social Media Optimization (SMO)</strong> with high-performance <strong>Facebook Ads management</strong>, we help scaling enterprises plug conversion leaks, strengthen market credibility, and maximize every dollar deployed across digital channels.</p>
    `
  },

  "linkedin-executive-presence": {
    title: "LinkedIn Optimization for Founders: Turning Profiles into Enterprise Magnets",
    category: "B2B Positioning",
    date: "Executive Strategy • 5 Min Read",
    excerpt: "Why enterprise decision-makers evaluate the executive behind the contract, and how to structure personal profiles to drive inbound procurement conversations.",
    content: `
      <h3>The Psychology of Enterprise Due Diligence</h3>
      <p>Securing five-figure retainers, institutional contracts, and corporate partnerships requires a level of trust that generic corporate advertising cannot establish on its own. In enterprise transactions, decision-makers don't merely evaluate company collateral—they rigorously vet the executives leading the organization. For founders, CEOs, and practice leads, an unoptimized personal profile represents a massive missed opportunity for scalable <strong>B2B lead generation</strong>.</p>
      
      <p>Too many executive profiles remain structured as passive online resumes, showcasing employment histories rather than authoritative market solutions. When procurement heads, venture partners, or enterprise clients search your name, a passive resume signals an individual seeking a job rather than a thought leader steering an enterprise. Transforming personal channels through executive <strong>Social Media Optimization (SMO)</strong> converts executive presence into a primary inbound acquisition engine.</p>

      <h3>Structuring an Institutional Inbound Sales Asset</h3>
      <p>To establish market prominence and command pricing power, executive profiles must operate as dedicated commercial landing pages. A sophisticated founder-led <strong>marketing strategy</strong> incorporates four tactical elements:</p>
      <ul>
        <li><strong>Outcome-Driven Headline Architecture:</strong> Replace generic titles with a concise breakdown of who you empower, the economic outcomes you create, and verifiable social proof.</li>
        <li><strong>Commercial Featured Media:</strong> Anchor high-impact client testimonials, white papers, industry keynotes, and direct appointment scheduling links prominently above the fold.</li>
        <li><strong>Narrative Authority in the About Section:</strong> Articulate your industry philosophy, the fundamental operational pitfalls you eliminate, and explicit next steps for enterprise consultation.</li>
        <li><strong>Synergy with Multi-Platform Campaigns:</strong> Integrate executive credibility with paid <strong>Facebook Ads management</strong> and cross-channel retargeting to surround key accounts with continuous institutional touchpoints.</li>
      </ul>

      <h3>Elevating Executive Capital into Measurable Pipeline</h3>
      <p>When founders position their personal brands as strategic industry resources, outbound sales friction dissolves. Corporate prospects actively engage with thoughtful executive commentary, converting cold commercial outreach into warm, inbound executive dialogues that shorten complex sales cycles.</p>

      <p>At <strong>Whiz Studio</strong>, widely celebrated as a <strong>top digital marketing agency</strong>, we implement proven methodologies to accelerate executive authority and corporate acquisition. Our specialists architect end-to-end executive positioning systems powered by <strong>data-driven growth</strong> models, empowering founders to dominate high-value <strong>B2B lead generation</strong> and turn digital reputation into lasting enterprise value.</p>
    `
  },

  "creative-fatigue-mitigation": {
    title: "Creative Fatigue & Ad Burnout: Protecting Your Campaign Return on Ad Spend",
    category: "Paid Acquisition Media",
    date: "Performance Engineering • 4 Min Read",
    excerpt: "A structured methodology for creative testing cadences, preventing audience ad blindness, and maintaining stable acquisition costs over multi-month campaigns.",
    content: `
      <h3>The Inevitable Trajectory of Ad Performance Decay</h3>
      <p>Even the most lucrative digital campaigns eventually face the reality of creative fatigue. In paid digital environments, when target audiences are repeatedly exposed to identical creative hooks, visual assets, and promotional messaging, audience responsiveness predictably diminishes. Click-through rates decline, cost-per-impression rises, and conversion metrics deteriorate. For organizations investing heavily in paid channels, unmitigated ad fatigue directly threatens profitability and bottom-line stability.</p>
      
      <p>Many marketing teams respond reactively by abruptly pausing ad sets or dramatically slashing budgets, disrupting the algorithmic learning phases of their ad accounts. Sustainable media buying requires a proactive, systematic iteration framework that anticipates audience burnout and continuously refreshes top-of-funnel creative assets without destabilizing core campaigns or inflating customer acquisition costs.</p>

      <h3>The Modular Creative Testing Framework</h3>
      <p>Maintaining multi-month campaign longevity requires treating creative production as an ongoing scientific process rather than a sporadic design task. A resilient <strong>marketing strategy</strong> deploys a continuous creative pipeline:</p>
      <ul>
        <li><strong>Dynamic Hook Iteration:</strong> Systematically isolate and test the initial 3 seconds of video content and primary headlines while preserving winning core arguments.</li>
        <li><strong>Multi-Format Asset Diversity:</strong> Deploy an agile mix of high-production motion reels, authentic user-generated content, static graphics, and carousel breakdowns to capture distinct buyer preferences.</li>
        <li><strong>Angle and Pain-Point Rotation:</strong> Rotate between logical ROI demonstrations, emotional customer pain points, risk-reversal guarantees, and authoritative social proof.</li>
        <li><strong>Holistic Profile Support:</strong> Reinforce paid traffic with robust <strong>Social Media Optimization (SMO)</strong> to ensure that curious ad viewers land on a credible, conversion-ready profile.</li>
      </ul>

      <h3>Engineering Enduring Ad Performance and ROAS</h3>
      <p>When businesses couple structured creative testing with advanced <strong>Facebook Ads management</strong>, campaigns transcend ephemeral viral spikes. This rigorous approach stabilizes cost-per-lead metrics across multiple quarters, establishing consistent pipeline predictable enough to support high-velocity e-commerce sales and long-cycle <strong>B2B lead generation</strong>.</p>

      <p>At <strong>Whiz Studio</strong>, recognized as a <strong>top digital marketing agency</strong>, we implement comprehensive, <strong>data-driven growth</strong> methodologies to solve creative stagnation and protect campaign efficiency. Through predictive creative matrices, continuous asset iteration, and enterprise-grade <strong>Facebook Ads management</strong>, we ensure our clients maintain peak performance, sustainable ROAS, and unstoppable market momentum.</p>
    `
  }
};

// =============================================================================
// 3. REVIEWS & TESTIMONIAL SYSTEM (DISCORD MODERATION PIPELINE)
// =============================================================================

let selectedStarRating = 5;
let approvedReviews = [];
let isDemoReviewsActive = false;

const DEMO_APPROVED_REVIEWS = [
  {
    name: "Tanvir Ahmed",
    rating: 5,
    text: "Whiz Studio completely overhauled our Meta ad campaigns. Our cost per qualified lead dropped by 42% in under four weeks. Their weekly reporting is exceptionally clear and transparent.",
    date: "March 2026"
  },
  {
    name: "Farhana Chowdhury",
    rating: 5,
    text: "The Social Media Optimization service completely transformed our Instagram profile from a disorganized page into a genuine conversion channel. Highly professional team in Dhaka!",
    date: "February 2026"
  },
  {
    name: "Shahriar Kabir",
    rating: 5,
    text: "Positioned our corporate leadership profile on LinkedIn. We secured two high-value enterprise consulting partnerships within 60 days of implementing their positioning architecture.",
    date: "January 2026"
  }
];

function initStarRating() {
  const container = document.getElementById('starRatingContainer');
  const label = document.getElementById('starRatingLabel');
  if (!container) return;

  const buttons = container.querySelectorAll('.star-btn');
  const ratingLabels = {
    1: "1 Star - Unsatisfactory",
    2: "2 Stars - Needs Improvement",
    3: "3 Stars - Satisfactory",
    4: "4 Stars - Very Good",
    5: "5 Stars - Outstanding"
  };

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      selectedStarRating = parseInt(btn.getAttribute('data-rating'), 10);
      updateStarUI(selectedStarRating);
    });

    btn.addEventListener('mouseenter', () => {
      const hoverRating = parseInt(btn.getAttribute('data-rating'), 10);
      highlightStars(hoverRating);
      if (label) label.textContent = ratingLabels[hoverRating];
    });
  });

  container.addEventListener('mouseleave', () => {
    updateStarUI(selectedStarRating);
  });

  function updateStarUI(rating) {
    highlightStars(rating);
    if (label) label.textContent = ratingLabels[rating];
  }

  function highlightStars(rating) {
    buttons.forEach(btn => {
      const btnRating = parseInt(btn.getAttribute('data-rating'), 10);
      if (btnRating <= rating) {
        btn.classList.add('text-amber-400');
        btn.classList.remove('text-slate-300');
      } else {
        btn.classList.remove('text-amber-400');
        btn.classList.add('text-slate-300');
      }
    });
  }

  updateStarUI(selectedStarRating);
}

async function handleReviewSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById('reviewName');
  const emailInput = document.getElementById('reviewEmail');
  const textInput = document.getElementById('reviewText');
  const submitBtn = document.getElementById('reviewSubmitBtn');
  const statusMsg = document.getElementById('reviewStatusMsg');

  if (!nameInput || !emailInput || !textInput) return;

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const text = textInput.value.trim();
  const rating = selectedStarRating;

  if (!name || !email || !text) {
    showToast("Please complete all required fields.", "error");
    return;
  }

  const originalBtnContent = submitBtn ? submitBtn.innerHTML : `<span>Submit for Moderation</span>`;

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="flex items-center space-x-2"><i class="fa-solid fa-spinner fa-spin text-xs"></i><span>Sending...</span></span>`;
  }

  const reviewPayload = {
    embeds: [
      {
        title: "⭐ New Whiz Studio Testimonial Submission",
        color: 0xF59E0B,
        fields: [
          { name: "Client / Company", value: name, inline: true },
          { name: "Client Email", value: email, inline: true },
          { name: "Rating", value: "★".repeat(rating) + ` (${rating}/5 Stars)`, inline: true },
          { name: "Review Feedback", value: text, inline: false },
          { name: "Submission Timestamp", value: new Date().toISOString(), inline: false }
        ],
        footer: {
          text: "Whiz Studio Review Pipeline • whizstudio.art"
        }
      }
    ]
  };

  try {
    const apiRes = await fetch(`${API_BASE}/api/submit-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: name,
        reviewText: text,
        name,
        email,
        text,
        rating
      })
    });

    const resJson = await apiRes.json().catch(() => ({}));

    // Strictly enforce 200 OK or 204 No Content
    if ((apiRes.status !== 200 && apiRes.status !== 204) || !resJson.success) {
      throw new Error(resJson.error || `Server responded with status ${apiRes.status}`);
    }

    // Reset form fields & Notify Client ONLY upon verified success
    nameInput.value = "";
    emailInput.value = "";
    textInput.value = "";
    selectedStarRating = 5;
    initStarRating();

    if (statusMsg) {
      statusMsg.className = "p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-semibold block";
      statusMsg.innerHTML = `
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-circle-check text-brand-whiz text-sm"></i>
          <span>Thank you, ${escapeHtml(name)}! Your review has been securely transmitted to #review-moderation on Discord.</span>
        </div>
      `;
    }

    showToast("Review submitted to Discord moderation queue!", "success");

    if (submitBtn) {
      submitBtn.innerHTML = `<span class="flex items-center space-x-2"><i class="fa-solid fa-check text-xs"></i><span>Sent Successfully!</span></span>`;
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
      }, 3000);
    }
  } catch (err) {
    console.error("Critical Review Submission Error:", err);
    showToast(`Submission Failed: ${err.message || "Network Error"}`, "error");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
    }
    if (statusMsg) {
      statusMsg.className = "p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 text-xs font-semibold block";
      statusMsg.innerHTML = `
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-triangle-exclamation text-rose-600 text-sm"></i>
          <span>Submission failed: ${escapeHtml(err.message || "Could not connect to Discord API. Please try again.")}</span>
        </div>
      `;
    }
  }
}

function renderReviewsList(reviews) {
  const emptyState = document.getElementById('reviewsEmptyState');
  const container = document.getElementById('approvedReviewsContainer');
  if (!container || !emptyState) return;

  container.innerHTML = "";

  if (!reviews || reviews.length === 0) {
    emptyState.classList.remove('hidden');
    container.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  container.classList.remove('hidden');

  reviews.forEach(review => {
    const card = document.createElement('div');
    const displayName = review.clientName || review.name || 'Verified Client';
    const displayText = review.reviewText || review.text || '';
    card.className = "bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-2xl p-6 transition-all hover:border-emerald-400";
    card.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="font-bold text-slate-900 text-sm">${escapeHtml(displayName)}</div>
          <div class="text-[11px] text-slate-600 font-medium">${escapeHtml(review.date || 'Verified Client')}</div>
        </div>
        <div class="text-amber-400 text-sm tracking-wide">
          ${'★'.repeat(review.rating || 5)}${'☆'.repeat(Math.max(0, 5 - (review.rating || 5)))}
        </div>
      </div>
      <p class="text-slate-700 text-xs sm:text-sm leading-relaxed font-normal">"${escapeHtml(displayText)}"</p>
      <div class="mt-3 pt-2.5 border-t border-white/30 flex items-center space-x-1.5 text-[11px] text-emerald-800 font-semibold">
        <i class="fa-solid fa-shield-check text-brand-whiz"></i>
        <span>Verified Whiz Studio Client Engagement</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function toggleDemoReviews() {
  const btn = document.getElementById('toggleDemoReviewsBtn');
  if (isDemoReviewsActive) {
    approvedReviews = [];
    isDemoReviewsActive = false;
    if (btn) btn.innerHTML = `<span>Preview Approved Reviews (Demo)</span>`;
  } else {
    approvedReviews = [...DEMO_APPROVED_REVIEWS];
    isDemoReviewsActive = true;
    if (btn) btn.innerHTML = `<span>Reset to Moderation State</span>`;
  }
  renderReviewsList(approvedReviews);
}

// Live Database Review Synchronization Engine
async function syncApprovedReviewsFromDiscord() {
  if (isDemoReviewsActive) return;
  try {
    const res = await fetch(`${API_BASE}/api/reviews`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.reviews)) {
        approvedReviews = [...data.reviews];
        renderReviewsList(approvedReviews);
      }
    }
  } catch (err) {
    console.warn("Live reviews sync notice:", err);
  }
}

// =============================================================================
// 4. CUSTOM LIQUID GLASS DROPDOWN COMPONENT
// =============================================================================

function initCustomDropdown() {
  const dropdownWrapper = document.getElementById('customServiceDropdown');
  const triggerBtn = document.getElementById('dropdownTriggerBtn');
  const menuList = document.getElementById('dropdownMenuList');
  const chevron = document.getElementById('dropdownChevron');
  const labelText = document.getElementById('selectedServiceText');
  const hiddenInput = document.getElementById('contactService');

  if (!dropdownWrapper || !triggerBtn || !menuList || !hiddenInput) return;

  const items = menuList.querySelectorAll('.dropdown-item');

  // Toggle Menu
  triggerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isClosed = menuList.classList.contains('hidden');
    if (isClosed) {
      openDropdown();
    } else {
      closeDropdown();
    }
  });

  // Select Item
  items.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = item.getAttribute('data-value');
      const text = item.querySelector('span')?.textContent || val;

      hiddenInput.value = val;
      labelText.textContent = text;
      labelText.classList.remove('text-slate-500');
      labelText.classList.add('text-slate-900', 'font-bold');

      // Update active styling
      items.forEach(i => {
        i.classList.remove('bg-emerald-500/20', 'text-emerald-950', 'font-bold');
        const check = i.querySelector('.check-icon');
        if (check) check.classList.add('hidden');
      });

      item.classList.add('bg-emerald-500/20', 'text-emerald-950', 'font-bold');
      const activeCheck = item.querySelector('.check-icon');
      if (activeCheck) activeCheck.classList.remove('hidden');

      closeDropdown();
    });
  });

  // Close on Outside Click
  document.addEventListener('click', (e) => {
    if (!dropdownWrapper.contains(e.target)) {
      closeDropdown();
    }
  });

  // Close on Escape Key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  function openDropdown() {
    menuList.classList.remove('hidden');
    triggerBtn.setAttribute('aria-expanded', 'true');
    if (chevron) chevron.style.transform = 'rotate(180deg)';
    if (window.gsap) {
      gsap.fromTo(menuList, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" });
    }
  }

  function closeDropdown() {
    if (!menuList.classList.contains('hidden')) {
      menuList.classList.add('hidden');
      triggerBtn.setAttribute('aria-expanded', 'false');
      if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
  }
}

// =============================================================================
// 5. CONTACT / LEAD FORM DISPATCH
// =============================================================================

async function handleContactSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById('contactName');
  const emailInput = document.getElementById('contactEmail');
  const phoneInput = document.getElementById('contactPhone');
  const hiddenService = document.getElementById('contactService');
  const detailsInput = document.getElementById('contactDetails');
  const submitBtn = document.getElementById('contactSubmitBtn');
  const alertBox = document.getElementById('contactFormAlert');
  const dropdownTrigger = document.getElementById('dropdownTriggerBtn');
  const selectedLabel = document.getElementById('selectedServiceText');

  if (!nameInput || !emailInput || !phoneInput || !hiddenService || !detailsInput) return;

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const service = hiddenService.value.trim();
  const details = detailsInput.value.trim();

  if (!service) {
    showToast("Please select a required service.", "error");
    if (dropdownTrigger) {
      dropdownTrigger.classList.add('border-rose-400', 'ring-2', 'ring-rose-300');
      setTimeout(() => dropdownTrigger.classList.remove('border-rose-400', 'ring-2', 'ring-rose-300'), 3000);
      dropdownTrigger.focus();
    }
    return;
  }

  if (!name || !email || !phone || !details) {
    showToast("Please fill in all inquiry fields.", "error");
    return;
  }

  const originalBtnContent = submitBtn ? submitBtn.innerHTML : `<span>Transmit Inquiry to Whiz Studio</span>`;

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="flex items-center space-x-2"><i class="fa-solid fa-spinner fa-spin text-xs"></i><span>Sending...</span></span>`;
  }

  const contactPayload = {
    embeds: [
      {
        title: "📬 New Strategic Inquiry: Whiz Studio",
        color: 0x00A86B,
        fields: [
          { name: "Client / Company", value: name, inline: true },
          { name: "Email Address", value: email, inline: true },
          { name: "Phone / WhatsApp", value: phone, inline: true },
          { name: "Target Capability", value: service, inline: true },
          { name: "Current Situation & Project Scope", value: details, inline: false },
          { name: "Inquiry Time", value: new Date().toISOString(), inline: false }
        ],
        footer: {
          text: "Whiz Studio Lead Dispatch • whizstudio.art"
        }
      }
    ]
  };

  try {
    const apiRes = await fetch(`${API_BASE}/api/submit-contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, service, details })
    });

    const resJson = await apiRes.json().catch(() => ({}));

    // Strictly enforce 200 OK or 204 No Content
    if ((apiRes.status !== 200 && apiRes.status !== 204) || !resJson.success) {
      throw new Error(resJson.error || `Server responded with status ${apiRes.status}`);
    }

    // Reset form and dropdown ONLY on verified success
    nameInput.value = "";
    emailInput.value = "";
    phoneInput.value = "";
    hiddenService.value = "";
    detailsInput.value = "";

    if (selectedLabel) {
      selectedLabel.textContent = "Select a Service Category";
      selectedLabel.classList.add('text-slate-500');
      selectedLabel.classList.remove('text-slate-900', 'font-bold');
    }

    const dropdownItems = document.querySelectorAll('#dropdownMenuList .dropdown-item');
    dropdownItems.forEach(i => {
      i.classList.remove('bg-emerald-500/20', 'text-emerald-950', 'font-bold');
      const check = i.querySelector('.check-icon');
      if (check) check.classList.add('hidden');
    });

    if (alertBox) {
      alertBox.className = "p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-semibold block";
      alertBox.innerHTML = `
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-circle-check text-brand-whiz text-base"></i>
          <div>
            <div class="font-bold">Inquiry Transmitted to Discord Ledger!</div>
            <div class="font-normal mt-0.5">Thank you, ${escapeHtml(name)}. Your inquiry is now recorded in our #contact-inquiries channel.</div>
          </div>
        </div>
      `;
    }

    showToast("Inquiry successfully delivered to Discord!", "success");

    if (submitBtn) {
      submitBtn.innerHTML = `<span class="flex items-center space-x-2"><i class="fa-solid fa-check text-xs"></i><span>Sent Successfully!</span></span>`;
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
      }, 3000);
    }
  } catch (err) {
    console.error("Critical Contact Submission Error:", err);
    showToast(`Transmission Failed: ${err.message || "Network Error"}`, "error");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
    }
    if (alertBox) {
      alertBox.className = "p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 text-xs font-semibold block";
      alertBox.innerHTML = `
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-triangle-exclamation text-rose-600 text-base"></i>
          <div>
            <div class="font-bold">Delivery Failed</div>
            <div class="font-normal mt-0.5">${escapeHtml(err.message || "Could not connect to Discord API. Please check your network or try again.")}</div>
          </div>
        </div>
      `;
    }
  }
}

// =============================================================================
// 6. MODAL SYSTEMS (SERVICES & SEO ARTICLES)
// =============================================================================

function openServiceModal(serviceKey) {
  const service = SERVICES_DATA[serviceKey];
  if (!service) return;

  const modal = document.getElementById('serviceNecessityModal');
  const title = document.getElementById('serviceModalTitle');
  const headline = document.getElementById('serviceModalHeadline');
  const badge = document.getElementById('serviceModalBadge');
  const whyNeed = document.getElementById('serviceModalWhy');
  const whoNeeds = document.getElementById('serviceModalWho');
  const ctaBtn = document.getElementById('serviceModalCta');

  if (title) title.textContent = service.title;
  if (headline) headline.textContent = service.necessityHeadline;
  if (badge) badge.textContent = service.badge;
  if (whyNeed) whyNeed.innerHTML = `<p>${service.whyNeed.replace(/\n\n/g, '</p><p class="mt-2.5">')}</p>`;
  if (whoNeeds) {
    const listItems = service.whoNeeds.split('\n').filter(line => line.trim().length > 0);
    whoNeeds.innerHTML = `<ul class="space-y-1.5">${listItems.map(item => `<li class="flex items-start"><span class="text-brand-whiz font-bold mr-2">✓</span><span>${item.replace('• ', '')}</span></li>`).join('')}</ul>`;
  }

  if (ctaBtn) {
    ctaBtn.onclick = () => {
      closeServiceModal();
      selectServiceAndScroll(service.title);
    };
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  if (window.gsap) {
    gsap.fromTo(
      "#serviceModalContent",
      { opacity: 0, scale: 0.95, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "power2.out" }
    );
  }
}

function closeServiceModal() {
  const modal = document.getElementById('serviceNecessityModal');
  if (!modal) return;

  if (window.gsap) {
    gsap.to("#serviceModalContent", {
      opacity: 0,
      scale: 0.96,
      y: 15,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    });
  } else {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function openArticleModal(articleKey) {
  const article = ARTICLES_DATA[articleKey];
  if (!article) return;

  const modal = document.getElementById('articleReaderModal');
  const title = document.getElementById('articleModalTitle');
  const meta = document.getElementById('articleModalMeta');
  const body = document.getElementById('articleModalBody');

  if (title) title.textContent = article.title;
  if (meta) meta.textContent = `${article.category} • ${article.date}`;
  if (body) body.innerHTML = article.content;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  if (window.gsap) {
    gsap.fromTo(
      "#articleModalContent",
      { opacity: 0, scale: 0.95, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "power2.out" }
    );
  }
}

function closeArticleModal() {
  const modal = document.getElementById('articleReaderModal');
  if (!modal) return;

  if (window.gsap) {
    gsap.to("#articleModalContent", {
      opacity: 0,
      scale: 0.96,
      y: 15,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    });
  } else {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// Function to select service in custom dropdown and smooth scroll
function selectServiceAndScroll(serviceName) {
  const hiddenInput = document.getElementById('contactService');
  const selectedText = document.getElementById('selectedServiceText');
  const items = document.querySelectorAll('#dropdownMenuList .dropdown-item');

  if (hiddenInput && selectedText) {
    let matched = false;
    items.forEach(item => {
      const val = item.getAttribute('data-value') || '';
      const text = item.querySelector('span')?.textContent || val;
      const check = item.querySelector('.check-icon');

      if (val.toLowerCase().includes(serviceName.toLowerCase()) || 
          serviceName.toLowerCase().includes(val.toLowerCase()) ||
          text.toLowerCase().includes(serviceName.toLowerCase())) {
        hiddenInput.value = val;
        selectedText.textContent = text;
        selectedText.classList.remove('text-slate-500');
        selectedText.classList.add('text-slate-900', 'font-bold');

        item.classList.add('bg-emerald-500/20', 'text-emerald-950', 'font-bold');
        if (check) check.classList.remove('hidden');
        matched = true;
      } else {
        item.classList.remove('bg-emerald-500/20', 'text-emerald-950', 'font-bold');
        if (check) check.classList.add('hidden');
      }
    });

    if (!matched) {
      hiddenInput.value = serviceName;
      selectedText.textContent = serviceName;
      selectedText.classList.remove('text-slate-500');
      selectedText.classList.add('text-slate-900', 'font-bold');
    }
  }

  const contactSection = document.getElementById('contact');
  if (contactSection) {
    const header = document.querySelector('header');
    const headerOffset = (header ? header.offsetHeight : 80) + 16;
    const elementPosition = contactSection.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: Math.max(0, offsetPosition),
      behavior: 'smooth'
    });

    setTimeout(() => {
      const nameInput = document.getElementById('contactName');
      if (nameInput) nameInput.focus();
    }, 500);
  }
}

// =============================================================================
// 7. ROBUST GSAP ANIMATIONS & SCROLLTRIGGER ENGINE
// =============================================================================

function initGsapAnimations() {
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    // 1. Hero Smooth Staggered Entrance
    gsap.from(".hero-title", { y: 40, opacity: 0, duration: 0.8, delay: 0.15, ease: "power3.out" });
    gsap.from(".hero-description", { y: 30, opacity: 0, duration: 0.8, delay: 0.35, ease: "power3.out" });
    gsap.from(".hero-actions", { y: 25, opacity: 0, duration: 0.8, delay: 0.5, ease: "power3.out" });
    gsap.from(".hero-visual", { scale: 0.96, opacity: 0, duration: 0.8, delay: 0.4, ease: "power3.out" });
    gsap.from(".hero-pills > *", { y: 20, opacity: 0, duration: 0.6, stagger: 0.1, delay: 0.6, ease: "power3.out" });

    // 2. Exact Standard GSAP ScrollTrigger Animations for Viewport Elements
    gsap.utils.toArray('.gsap-header').forEach(element => {
      gsap.from(element, {
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          toggleActions: "play none none none"
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      });
    });

    gsap.utils.toArray('.service-card').forEach(element => {
      gsap.from(element, {
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          toggleActions: "play none none none"
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      });
    });

    gsap.utils.toArray('.pricing-card').forEach(element => {
      gsap.from(element, {
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          toggleActions: "play none none none"
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      });
    });

    gsap.utils.toArray('.about-stat-card').forEach(element => {
      gsap.from(element, {
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          toggleActions: "play none none none"
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      });
    });

    gsap.utils.toArray('.article-card').forEach(element => {
      gsap.from(element, {
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          toggleActions: "play none none none"
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      });
    });

    // About Us Stats Numerical Counter Trigger
    ScrollTrigger.create({
      trigger: "#about-stats",
      start: "top 85%",
      once: true,
      onEnter: () => {
        animateStatsCounter();
      }
    });

    // Ambient Glowing Blob Floating Motion
    gsap.to(".blob-1", {
      x: 50,
      y: 70,
      duration: 12,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
    gsap.to(".blob-2", {
      x: -60,
      y: -50,
      duration: 14,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }
}

function animateStatsCounter() {
  const stat1 = document.getElementById('stat-experience');
  const stat2 = document.getElementById('stat-projects');
  const stat3 = document.getElementById('stat-success');

  if (stat1) animateValue(stat1, 0, 2, 1000, "+ Years Experience");
  if (stat2) animateValue(stat2, 0, 30, 1400, "+ Projects");
  if (stat3) animateValue(stat3, 0, 95, 1600, "%+ Success Rate");
}

function animateValue(obj, start, end, duration, suffix = "") {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const easeProgress = easeOutQuad(progress);
    const currentVal = Math.floor(easeProgress * (end - start) + start);
    obj.innerHTML = `${currentVal}${suffix}`;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      obj.innerHTML = `${end}${suffix}`;
    }
  };
  window.requestAnimationFrame(step);
}

function easeOutQuad(x) {
  return 1 - (1 - x) * (1 - x);
}

// =============================================================================
// 8. FAQ ACCORDION LOGIC
// =============================================================================

function initFaqAccordion() {
  const faqButtons = document.querySelectorAll('.faq-toggle-btn');
  faqButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const content = document.getElementById(targetId);
      const icon = button.querySelector('.faq-icon');
      const isExpanded = button.getAttribute('aria-expanded') === 'true';

      // Close all other FAQs
      faqButtons.forEach(otherBtn => {
        if (otherBtn !== button) {
          otherBtn.setAttribute('aria-expanded', 'false');
          const otherTarget = document.getElementById(otherBtn.getAttribute('data-target'));
          if (otherTarget) {
            otherTarget.classList.add('hidden');
          }
          const otherIcon = otherBtn.querySelector('.faq-icon');
          if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
        }
      });

      // Toggle current
      if (isExpanded) {
        button.setAttribute('aria-expanded', 'false');
        if (content) content.classList.add('hidden');
        if (icon) icon.style.transform = 'rotate(0deg)';
      } else {
        button.setAttribute('aria-expanded', 'true');
        if (content) {
          content.classList.remove('hidden');
          if (window.gsap) {
            gsap.fromTo(content, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 });
          }
        }
        if (icon) icon.style.transform = 'rotate(180deg)';
      }
    });
  });
}

// =============================================================================
// 9. TOAST NOTIFICATION UTILITY
// =============================================================================

function showToast(message, type = "info") {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const typeStyles = {
    success: 'bg-emerald-900/90 text-white border-emerald-400',
    error: 'bg-rose-900/90 text-white border-rose-400',
    info: 'bg-slate-900/90 text-white border-emerald-500'
  };

  toast.className = `p-4 rounded-xl backdrop-blur-xl border shadow-xl text-sm flex items-center space-x-3 transition-all duration-300 transform translate-y-4 opacity-0 ${typeStyles[type] || typeStyles.info}`;
  toast.innerHTML = `
    <span class="text-base">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <div class="flex-1 font-medium">${escapeHtml(message)}</div>
    <button class="text-white/60 hover:text-white ml-2 text-xs" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  if (window.gsap) {
    gsap.to(toast, { y: 0, opacity: 1, duration: 0.3 });
  } else {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  }

  setTimeout(() => {
    if (toast.parentElement) {
      if (window.gsap) {
        gsap.to(toast, {
          opacity: 0,
          y: -10,
          duration: 0.3,
          onComplete: () => toast.remove()
        });
      } else {
        toast.remove();
      }
    }
  }, 5000);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// =============================================================================
// 10. NAVBAR SCROLL & MOBILE MENU
// =============================================================================

function initNavigation() {
  const nav = document.getElementById('mainNav');
  const header = document.querySelector('header');
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');
  const allNavLinks = document.querySelectorAll('nav a.nav-link, #mobileMenu a.nav-link');

  // Navbar glass background scroll reactivity
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      nav.classList.add('shadow-md', 'bg-white/90');
      nav.classList.remove('bg-white/70');
    } else {
      nav.classList.remove('shadow-md', 'bg-white/90');
      nav.classList.add('bg-white/70');
    }
  }, { passive: true });

  // Mobile menu toggle & animations
  if (mobileToggle && mobileMenu) {
    const toggleIcon = mobileToggle.querySelector('i');
    
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isClosed = mobileMenu.classList.contains('hidden');
      if (isClosed) {
        mobileMenu.classList.remove('hidden');
        mobileToggle.setAttribute('aria-expanded', 'true');
        if (toggleIcon) {
          toggleIcon.classList.remove('fa-bars');
          toggleIcon.classList.add('fa-xmark');
        }
        if (window.gsap) {
          gsap.fromTo(mobileMenu, { opacity: 0, y: -12, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'power2.out' });
        }
      } else {
        mobileMenu.classList.add('hidden');
        mobileToggle.setAttribute('aria-expanded', 'false');
        if (toggleIcon) {
          toggleIcon.classList.remove('fa-xmark');
          toggleIcon.classList.add('fa-bars');
        }
      }
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        mobileToggle.setAttribute('aria-expanded', 'false');
        if (toggleIcon) {
          toggleIcon.classList.remove('fa-xmark');
          toggleIcon.classList.add('fa-bars');
        }
      });
    });

    // Close on click outside header
    document.addEventListener('click', (e) => {
      if (!mobileMenu.classList.contains('hidden') && !header.contains(e.target)) {
        mobileMenu.classList.add('hidden');
        mobileToggle.setAttribute('aria-expanded', 'false');
        if (toggleIcon) {
          toggleIcon.classList.remove('fa-xmark');
          toggleIcon.classList.add('fa-bars');
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // ACTIVE STATE INDICATOR & SCROLL SPY
  // ---------------------------------------------------------------------------
  const sectionIds = ['home', 'about', 'services', 'pricing', 'articles', 'testimonials', 'faq', 'contact'];
  const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  let currentActiveId = null;
  function setActiveNavLink(activeId) {
    if (!activeId || activeId === currentActiveId) return;
    currentActiveId = activeId;
    allNavLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${activeId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Set default initial active state based on URL hash if present
  const initialHashId = window.location.hash ? window.location.hash.substring(1) : null;
  if (initialHashId && sectionIds.includes(initialHashId)) {
    setActiveNavLink(initialHashId);
  } else {
    setActiveNavLink('home');
  }

  // Intersection Observer for fluid scroll-spy tracking
  if ('IntersectionObserver' in window && sections.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -55% 0px',
      threshold: [0, 0.2, 0.5]
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveNavLink(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach(section => sectionObserver.observe(section));
  }

  // Precise scroll position fallback (handles top of page, bottom bounce, and fast scroll)
  let scrollThrottleTimeout = null;
  window.addEventListener('scroll', () => {
    if (scrollThrottleTimeout) return;
    scrollThrottleTimeout = setTimeout(() => {
      scrollThrottleTimeout = null;

      const scrollPosition = window.scrollY + 140;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Top of page edge case
      if (window.scrollY < 120) {
        setActiveNavLink('home');
        return;
      }

      // Bottom of page edge case
      if (window.scrollY + windowHeight >= documentHeight - 60) {
        setActiveNavLink('contact');
        return;
      }

      // Find current section by vertical offset
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.offsetTop <= scrollPosition) {
          setActiveNavLink(section.id);
          break;
        }
      }
    }, 50);
  }, { passive: true });

  // ---------------------------------------------------------------------------
  // SMOOTH SCROLLING WITH OFFSET CALCULATION
  // ---------------------------------------------------------------------------
  allNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetHref = link.getAttribute('href');
      if (targetHref && targetHref.startsWith('#')) {
        const targetId = targetHref.substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          e.preventDefault();
          const headerOffset = (header ? header.offsetHeight : 80) + 16;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
          });

          setActiveNavLink(targetId);

          if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
          }
        }
      }
    });
  });

  // Handle direct hash navigation with sticky header offset on page load and hashchange
  function scrollToHashTarget() {
    if (window.location.hash) {
      const targetId = window.location.hash.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        setTimeout(() => {
          const headerOffset = (header ? header.offsetHeight : 80) + 16;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
          });

          setActiveNavLink(targetId);
        }, 120);
      }
    }
  }

  // Execute scroll on page load and on hash change
  if (window.location.hash) {
    if (document.readyState === 'complete') {
      scrollToHashTarget();
    } else {
      window.addEventListener('load', scrollToHashTarget);
    }
  }
  window.addEventListener('hashchange', scrollToHashTarget);
}

// =============================================================================
// 11. GLOBAL INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  initNavigation();
  initCustomDropdown();
  initStarRating();
  initFaqAccordion();
  initGsapAnimations();

  renderReviewsList(approvedReviews);
  syncApprovedReviewsFromDiscord();

  const reviewForm = document.getElementById('testimonialForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', handleReviewSubmit);
  }

  const contactForm = document.getElementById('agencyContactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }

  const demoReviewBtn = document.getElementById('toggleDemoReviewsBtn');
  if (demoReviewBtn) {
    demoReviewBtn.addEventListener('click', toggleDemoReviews);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeServiceModal();
      closeArticleModal();
    }
  });
});
