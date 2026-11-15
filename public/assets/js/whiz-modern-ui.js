/**
 * WHIZ STUDIO - 2026 LIQUID GLASS MODERNIZATION ENGINE
 * High-performance UI micro-interactions, spring physics, and telemetry animations
 */
(function () {
  'use strict';

  // =========================================================================
  // 1. ANIMATED KPI COUNTERS (Spring Easing count-up from 0 to Target)
  // =========================================================================
  function easeOutCubic(t) {
    return --t * t * t + 1;
  }

  function animateCounter(el, targetVal, prefix = '', suffix = '', duration = 850) {
    if (!el || el.__counterAnimating) return;
    el.__counterAnimating = true;

    const isDecimal = String(targetVal).includes('.');
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentVal = easeOutCubic(progress) * targetVal;

      const formattedVal = isDecimal
        ? currentVal.toFixed(2)
        : Math.round(currentVal).toLocaleString();

      el.textContent = `${prefix}${formattedVal}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = `${prefix}${isDecimal ? targetVal.toFixed(2) : targetVal.toLocaleString()}${suffix}`;
        el.__counterAnimating = false;
      }
    }

    requestAnimationFrame(update);
  }

  function triggerKpiCountUps(root = document) {
    // Select KPI elements that have numeric values
    const kpiElements = root.querySelectorAll('[id$="Count"], [id$="Total"], [id$="Balance"], [id$="Stat"], [data-kpi-counter]');
    kpiElements.forEach(el => {
      // Don't re-animate if hidden
      if (el.offsetParent === null) return;

      const text = el.textContent.trim();
      // Match Currency ($X,XXX.XX) or raw numbers
      const currMatch = text.match(/^\$?([\d,]+(\.\d+)?)$/);
      if (currMatch) {
        const rawNum = parseFloat(currMatch[1].replace(/,/g, ''));
        if (!isNaN(rawNum) && rawNum > 0) {
          const prefix = text.startsWith('$') ? '$' : '';
          animateCounter(el, rawNum, prefix);
        }
      }
    });
  }

  // =========================================================================
  // 2. FLUID SLIDING TAB PILL INDICATOR
  // =========================================================================
  function initSlidingTabPill() {
    const navContainers = document.querySelectorAll('nav, aside nav, [data-dock-nav]');
    navContainers.forEach(nav => {
      if (nav.__hasSlidingPill) return;
      nav.__hasSlidingPill = true;

      // Create pill element
      const pill = document.createElement('div');
      pill.className = 'tab-sliding-pill';
      pill.style.opacity = '0';
      nav.style.position = 'relative';
      nav.prepend(pill);

      function updatePillPosition() {
        const activeBtn = nav.querySelector('[data-dash-tab].bg-\\[\\#087F70\\], [data-dash-tab].bg-emerald-50, [data-dash-tab].dock-active, [data-client-tab].bg-\\[\\#F7FAF9\\], [data-client-tab].text-\\[\\#202D2A\\], [data-client-tab].border-\\[\\#087F70\\], [data-client-tab].active');
        if (activeBtn && activeBtn.offsetParent !== null) {
          const navRect = nav.getBoundingClientRect();
          const btnRect = activeBtn.getBoundingClientRect();

          const top = btnRect.top - navRect.top + nav.scrollTop;
          const left = btnRect.left - navRect.left + nav.scrollLeft;
          const width = btnRect.width;
          const height = btnRect.height;

          pill.style.transform = `translate3d(${left}px, ${top}px, 0)`;
          pill.style.width = `${width}px`;
          pill.style.height = `${height}px`;
          pill.style.opacity = '1';
        } else {
          pill.style.opacity = '0';
        }
      }

      // Update on click and on resize
      nav.addEventListener('click', () => {
        setTimeout(updatePillPosition, 50);
      });
      window.addEventListener('resize', updatePillPosition);
      setTimeout(updatePillPosition, 250);
    });
  }

  // =========================================================================
  // 3. LIVE PULSE STATUS BADGES
  // =========================================================================
  function enhanceStatusBadges(root = document) {
    const badges = root.querySelectorAll('span.rounded-full, span.rounded-md, [class*="bg-emerald"], [class*="bg-amber"], [class*="bg-slate"]');
    badges.forEach(badge => {
      if (badge.__hasPulseDot || badge.closest('button') || badge.querySelector('.status-pulse-dot')) return;
      const text = badge.textContent.toLowerCase().trim();

      let pulseType = null;
      if (text.includes('active') || text.includes('paid') || text.includes('resolved') || text.includes('delivered') || text.includes('completed')) {
        pulseType = 'pulse-emerald';
      } else if (text.includes('pending') || text.includes('progress') || text.includes('inquiry') || text.includes('review')) {
        pulseType = 'pulse-amber';
      } else if (text.includes('suspended') || text.includes('draft') || text.includes('closed') || text.includes('void')) {
        pulseType = 'pulse-slate';
      }

      if (pulseType) {
        badge.__hasPulseDot = true;
        const dot = document.createElement('span');
        dot.className = `status-pulse-dot ${pulseType}`;
        badge.prepend(dot);
      }
    });
  }

  // =========================================================================
  // 4. QUICK SEARCH & INSTANT IN-VIEW FILTER (`Ctrl+K` / `Cmd+K`)
  // =========================================================================
  function initQuickSearch() {
    const searchInputs = document.querySelectorAll('.quick-filter-input, #globalDashboardSearch');
    searchInputs.forEach(input => {
      if (input.__hasSearchInit) return;
      input.__hasSearchInit = true;

      input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const activeView = document.querySelector('div[id^="view_"]:not(.hidden), div[id^="tab-"]:not(.hidden), div[id^="tabContent"]:not(.hidden)');
        if (!activeView) return;

        // Filter table rows and card items in the current active view
        const items = activeView.querySelectorAll('tbody tr, .glass-card, .whiz-dashboard-card, div[data-searchable]');
        items.forEach(item => {
          if (!query) {
            item.style.display = '';
            return;
          }
          const text = item.textContent.toLowerCase();
          item.style.display = text.includes(query) ? '' : 'none';
        });
      });
    });

    // Global keyboard shortcut: Ctrl+K or Cmd+K
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const activeSearch = document.querySelector('.quick-filter-input, #globalDashboardSearch');
        if (activeSearch) {
          activeSearch.focus();
          activeSearch.select();
        }
      }
    });
  }

  // =========================================================================
  // 5. INITIALIZE ON DOM & TAB SWITCHES
  // =========================================================================
  function initAll() {
    initSlidingTabPill();
    triggerKpiCountUps();
    enhanceStatusBadges();
    initQuickSearch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Re-run animations on tab switch
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-dash-tab], [data-client-tab]')) {
      setTimeout(() => {
        triggerKpiCountUps();
        enhanceStatusBadges();
      }, 150);
    }
  });

  // Expose to window for manual triggering after fetch
  window.WhizModernUI = {
    refresh: () => {
      triggerKpiCountUps();
      enhanceStatusBadges();
    }
  };
})();
