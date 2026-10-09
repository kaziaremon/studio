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
      <h3>The Structural Shift in Social Media Distribution</h3>
      <p>For over a decade, businesses operated under the illusion that publishing quality content regularly was sufficient to build an enterprise. In 2026, algorithmic distribution mechanics on Meta platforms (Facebook & Instagram) have fundamentally evolved. Organic feeds prioritize private peer-to-peer conversations, highly personalized creator content, and paid commercial placements.</p>
      
      <p>Independent platform analysis consistently shows that organic brand posts reach between 1.5% and 3.2% of existing page followers. If an organization has 10,000 followers, fewer than 300 will ever see an announcement post without paid amplification. For an enterprise relying on consistent monthly sales, this mathematical ceiling represents an existential risk.</p>

      <h3>The False Dichotomy: Organic vs. Paid</h3>
      <p>The most common strategic error made by marketing directors is treating organic content and paid campaigns as competing philosophies. In high-performing digital engines, they operate in direct synergy:</p>
      <ul>
        <li><strong>Organic Content:</strong> Serves as the conversion environment. It provides real-time social proof, operational updates, and brand depth when prospects conduct due diligence.</li>
        <li><strong>Paid Advertising:</strong> Serves as the distribution engine. It guarantees daily impressions in front of verified buyer personas outside your current sphere of awareness.</li>
      </ul>

      <h3>The Sustainable Strategic Blueprint</h3>
      <p>To establish durable market leadership, brands must treat their social presence as a dual-engine machine. Invest in profile hygiene and organic credibility to maximize conversion rates, while deploying controlled, rigorously tested paid campaigns to fuel top-of-funnel customer acquisition with absolute financial predictability.</p>
    `
  },

  "smo-ad-efficiency": {
    title: "Social Media Optimization (SMO): The Overlooked Foundation of Paid Ad Efficiency",
    category: "Platform Infrastructure",
    date: "Optimization Analysis • 6 Min Read",
    excerpt: "How conversion rate leaks across bios, highlights, and profile architecture artificially inflate customer acquisition costs across all campaigns.",
    content: `
      <h3>The Leaky Bucket Syndrome in Modern Advertising</h3>
      <p>When ad campaign performance degrades, marketing teams instinctively blame ad creative, copywriting, or platform targeting algorithms. However, in our audits across dozens of commercial ad accounts, the primary bottleneck frequently lies elsewhere: the destination profile itself.</p>
      
      <p>Modern consumers rarely click directly through an ad to immediately submit a credit card or contract request on the first touchpoint. Over 45% of users click the brand profile handle to examine recent activity, pinned credentials, customer feedback, and response responsiveness.</p>

      <h3>The Pillars of High-Converting SMO</h3>
      <p>Social Media Optimization (SMO) is the systematic tuning of social profiles to maximize visitor-to-lead conversion rates:</p>
      <ul>
        <li><strong>Value-First Bio Architecture:</strong> Clarify precisely who you serve, the core outcome you provide, and a frictionless next step in under three lines of text.</li>
        <li><strong>Curated Social Proof Highlights:</strong> Organize client reviews, real project demonstrations, and operational transparency into structured, permanent story archives.</li>
        <li><strong>Frictionless Inbound Gateways:</strong> Eliminate broken links and multi-step forms in favor of single-click WhatsApp channels or calendar booking links.</li>
      </ul>

      <h3>The Compounding ROI of Profile Hygiene</h3>
      <p>By optimizing the organic profile environment, every single dollar invested in paid media achieves greater return. Converting 4% of profile visitors instead of 2% effectively halves customer acquisition costs without altering ad spend budgets.</p>
    `
  },

  "linkedin-executive-presence": {
    title: "LinkedIn Optimization for Founders: Turning Profiles into Enterprise Magnets",
    category: "B2B Positioning",
    date: "Executive Strategy • 5 Min Read",
    excerpt: "Why enterprise decision-makers evaluate the executive behind the contract, and how to structure personal profiles to drive inbound procurement conversations.",
    content: `
      <h3>The Reality of High-Ticket B2B Buying Behavior</h3>
      <p>Enterprise decisions and five-figure service agreements are never awarded based on anonymous digital marketing alone. When corporate executives evaluate an agency or consultancy, the first due diligence step is inspecting the LinkedIn profile of the founder or lead partner.</p>
      
      <p>A personal profile that resembles a passive online curriculum vitae signals an employee seeking a role rather than an authority leading an industry practice. To capture enterprise demand, your profile must function as an institutional landing page.</p>

      <h3>Key Elements of an Authoritative LinkedIn Profile</h3>
      <ul>
        <li><strong>Outcome-Oriented Headline:</strong> Replace ambiguous job titles with a direct thesis: who you assist, the precise commercial outcome you produce, and proof of capability.</li>
        <li><strong>Client-Facing Featured Section:</strong> Anchor verified case studies, media appearances, white papers, and direct consultation booking links right below your headline.</li>
        <li><strong>Narrative 'About' Architecture:</strong> Outline your industry philosophy, the specific failure modes you resolve for clients, and clear instructions for initiating discovery discussions.</li>
      </ul>

      <h3>Transforming Passive Connections into Inbound Opportunities</h3>
      <p>An optimized LinkedIn profile converts outbound network interactions into high-trust inbound inquiries, allowing founders to engage qualified corporate buyers without aggressive cold pitching.</p>
    `
  },

  "creative-fatigue-mitigation": {
    title: "Creative Fatigue & Ad Burnout: Protecting Your Campaign Return on Ad Spend",
    category: "Paid Acquisition Media",
    date: "Performance Engineering • 4 Min Read",
    excerpt: "A structured methodology for creative testing cadences, preventing audience ad blindness, and maintaining stable acquisition costs over multi-month campaigns.",
    content: `
      <h3>The Natural Lifecycle of Ad Performance</h3>
      <p>Even the highest-performing advertising creative experiences diminishing returns over time. As frequency increases and your target audience is repeatedly exposed to identical visual hooks, click-through rates decline while acquisition costs climb. This phenomenon is known as creative fatigue.</p>

      <h3>The Structured Testing Matrix</h3>
      <p>At Whiz Studio, we prevent campaign decay by running a continuous creative iteration pipeline:</p>
      <ul>
        <li><strong>Hook Variation:</strong> Testing the first 3 seconds of video content and headline variations while keeping core messaging constant.</li>
        <li><strong>Format Diversity:</strong> Balancing single-image static graphics, vertical Reels, carousel breakdowns, and text-based quote graphics across the ad set.</li>
        <li><strong>Angle Rotation:</strong> Systematically addressing different customer pain points, risk reversals, and social proof elements across distinct creative batches.</li>
      </ul>

      <h3>Sustainable Campaign Longevity</h3>
      <p>By introducing fresh creative assets into testing ad sets weekly, winning campaigns can maintain stable cost-per-acquisition metrics over quarters rather than burning out within weeks.</p>
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
    mobileToggle.addEventListener('click', () => {
      const isClosed = mobileMenu.classList.contains('hidden');
      if (isClosed) {
        mobileMenu.classList.remove('hidden');
        if (window.gsap) {
          gsap.fromTo(mobileMenu, { opacity: 0, y: -15 }, { opacity: 1, y: 0, duration: 0.25 });
        }
      } else {
        mobileMenu.classList.add('hidden');
      }
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
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

  // Set default initial active state
  setActiveNavLink('home');

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
