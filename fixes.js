(function(){
  'use strict';

  // === 1. FIX CATEGORY COUNTS — replace hardcoded totals with real per-category numbers ===
  function updateCategoryCounts() {
    var agents = window.agents;
    if (!agents || !agents.length) return;

    // Count agents per category
    var catCounts = {};
    agents.forEach(function(a) {
      var cat = a.category || 'other';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    // Count agents per pricing type
    var priceCounts = {};
    var openSourceCount = 0;
    var freeTrialCount = 0;
    agents.forEach(function(a) {
      var pt = a.pricing_type || '';
      priceCounts[pt] = (priceCounts[pt] || 0) + 1;
      if (a.open_source) openSourceCount++;
      if (a.has_free_trial) freeTrialCount++;
    });

    // Update CATEGORY filter buttons — target the existing .filter-count spans
    var catButtons = document.querySelectorAll('#catFilters .filter-btn');
    catButtons.forEach(function(btn) {
      var cat = btn.getAttribute('data-cat');
      if (!cat) return;

      // Calculate correct count
      var count;
      if (cat === 'all') {
        count = agents.length;
      } else {
        count = catCounts[cat] || 0;
      }

      // Find the existing .filter-count span and update it
      var existingSpan = btn.querySelector('.filter-count');
      if (existingSpan) {
        existingSpan.textContent = count;
      } else {
        // Create one if it doesn't exist
        var span = document.createElement('span');
        span.className = 'filter-count';
        span.textContent = count;
        btn.appendChild(span);
      }

      // Remove any duplicate .cat-count badges from previous fixes
      var oldBadge = btn.querySelector('.cat-count');
      if (oldBadge) oldBadge.remove();
    });

    // Update PRICE filter buttons
    var priceButtons = document.querySelectorAll('#priceFilters .price-btn');
    priceButtons.forEach(function(btn) {
      var price = btn.getAttribute('data-price');
      if (!price) return;

      var count;
      if (price === 'all') {
        count = agents.length;
      } else if (price === 'free') {
        count = priceCounts['free'] || 0;
      } else if (price === 'freemium') {
        count = priceCounts['freemium'] || 0;
      } else if (price === 'paid') {
        count = priceCounts['paid'] || 0;
      } else if (price === 'open-source' || price === 'open_source') {
        count = openSourceCount;
      } else if (price === 'free-trial' || price === 'free_trial') {
        count = freeTrialCount;
      } else if (price === 'enterprise') {
        count = priceCounts['enterprise'] || 0;
      } else {
        count = priceCounts[price] || 0;
      }

      // Find existing count span or create one
      var existingSpan = btn.querySelector('.filter-count') || btn.querySelector('.price-count');
      if (existingSpan) {
        existingSpan.textContent = count;
      } else {
        var span = document.createElement('span');
        span.className = 'filter-count';
        span.textContent = count;
        btn.appendChild(span);
      }

      // Remove any duplicate badges
      var oldBadge = btn.querySelector('.cat-count');
      if (oldBadge) oldBadge.remove();
    });

    console.log('[Fixes] Category counts updated. Total agents: ' + agents.length);
  }

  // === 2. Update results counter with proper "X of Y" format ===
  function updateResultsCounter() {
    var agents = window.agents;
    if (!agents) return;
    var grid = document.getElementById('grid');
    if (!grid) return;

    var visible = grid.children.length;
    var lang = localStorage.getItem('rvl_lang') || document.documentElement.lang || 'en';
    var info = document.querySelector('.results-info');
    if (!info) return;

    // Find the span inside or use the element itself
    var target = info.querySelector('span') || info;
    if (lang === 'ar') {
      target.innerHTML = '\u0639\u0631\u0636 <strong>' + visible + '</strong> \u0645\u0646 <strong>' + agents.length + '</strong> \u0623\u062f\u0627\u0629';
    } else {
      target.innerHTML = 'Showing <strong>' + visible + '</strong> of <strong>' + agents.length + '</strong> tools';
    }
  }

  // === 3. FIX DARK MODE PERFORMANCE ===
  function fixDarkModePerformance() {
    var nav = document.querySelector('nav');
    var allToggles = document.querySelectorAll('.theme-toggle, [aria-label="Toggle theme"]');
    allToggles.forEach(function(btn) {
      btn.addEventListener('click', function() {
        // Temporarily disable blur during transition for performance
        if (nav) {
          nav.style.backdropFilter = 'none';
          nav.style.webkitBackdropFilter = 'none';
        }
        document.documentElement.classList.add('theme-transitioning');
        // Re-enable after transition completes
        setTimeout(function() {
          document.documentElement.classList.remove('theme-transitioning');
          if (nav) {
            nav.style.backdropFilter = '';
            nav.style.webkitBackdropFilter = '';
          }
        }, 400);
      });
    });
  }

  // === 4. Watch for grid changes and re-update counter ===
  function observeGrid() {
    var grid = document.getElementById('grid');
    if (!grid) return;
    var observer = new MutationObserver(function() {
      setTimeout(updateResultsCounter, 100);
    });
    observer.observe(grid, { childList: true });
  }

  // === 5. Hook into renderCards to refresh counts after filtering ===
  function hookRenderCards() {
    if (typeof window.renderCards === 'function') {
      var original = window.renderCards;
      window.renderCards = function() {
        original.apply(this, arguments);
        setTimeout(function() {
          updateResultsCounter();
        }, 50);
      };
    }
  }

  // === 6. Re-update on language change ===
  function hookLanguageToggle() {
    var langBtn = document.getElementById('langToggle');
    if (langBtn) {
      langBtn.addEventListener('click', function() {
        setTimeout(function() {
          updateCategoryCounts();
          updateResultsCounter();
        }, 300);
      });
    }
  }

  // === INIT ===
  function init() {
    fixDarkModePerformance();

    // Poll until agents are loaded
    var attempts = 0;
    var checkAgents = setInterval(function() {
      attempts++;
      if (window.agents && window.agents.length > 0) {
        clearInterval(checkAgents);
        updateCategoryCounts();
        updateResultsCounter();
        observeGrid();
        hookRenderCards();
        hookLanguageToggle();
      }
      if (attempts > 30) clearInterval(checkAgents); // 15s timeout
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
