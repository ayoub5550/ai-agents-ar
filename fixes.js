(function(){
  'use strict';

  // Inject CSS
  var lk = document.createElement('link');
  lk.rel = 'stylesheet'; lk.href = 'fixes.css';
  document.head.appendChild(lk);

  // === 1. ADD REAL COUNTS TO CATEGORY FILTERS ===
  function updateCategoryCounts() {
    var agents = window.agents;
    if (!agents || !agents.length) return;

    // Count per category
    var catCounts = {};
    var priceCounts = { all: agents.length };
    agents.forEach(function(a) {
      var cat = a.category || 'other';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
      var pt = a.pricing_type || '';
      priceCounts[pt] = (priceCounts[pt] || 0) + 1;
    });
    catCounts['all'] = agents.length;

    // Update category filter buttons
    document.querySelectorAll('#catFilters .filter-btn').forEach(function(btn) {
      var cat = btn.dataset.cat || '';
      var count = cat === 'all' || cat === '' ? agents.length : (catCounts[cat] || 0);
      if (!btn.querySelector('.cat-count')) {
        var span = document.createElement('span');
        span.className = 'cat-count';
        span.textContent = count;
        btn.appendChild(span);
      } else {
        btn.querySelector('.cat-count').textContent = count;
      }
    });

    // Update price filter buttons
    document.querySelectorAll('#priceFilters .price-btn').forEach(function(btn) {
      var price = btn.dataset.price || '';
      var count;
      if (price === 'all' || price === '') {
        count = agents.length;
      } else if (price === 'free') {
        count = (priceCounts['free'] || 0);
      } else if (price === 'freemium') {
        count = (priceCounts['freemium'] || 0);
      } else if (price === 'paid') {
        count = (priceCounts['paid'] || 0);
      } else if (price === 'open-source' || price === 'open_source') {
        count = agents.filter(function(a) { return a.open_source; }).length;
      } else if (price === 'free-trial' || price === 'free_trial') {
        count = agents.filter(function(a) { return a.has_free_trial; }).length;
      } else {
        count = priceCounts[price] || 0;
      }
      if (!btn.querySelector('.price-count')) {
        var span = document.createElement('span');
        span.className = 'price-count';
        span.textContent = count;
        btn.appendChild(span);
      } else {
        btn.querySelector('.price-count').textContent = count;
      }
    });

    // Update results counter text with total
    var resultsInfo = document.querySelector('.results-info span, [data-i18n="showing_tools"]');
    if (resultsInfo && resultsInfo.textContent.match(/\d+/)) {
      // The main script handles this, but we make sure total is available
    }
  }

  // === 2. FIX DARK MODE SMOOTHNESS ===
  function fixDarkMode() {
    // Find existing theme toggle and enhance it
    var existing = document.querySelector('.theme-toggle');
    if (existing) {
      // Add will-change for GPU acceleration
      document.documentElement.style.willChange = 'background-color, color';
      // After transition, remove will-change
      existing.addEventListener('click', function() {
        setTimeout(function() {
          document.documentElement.style.willChange = 'auto';
        }, 400);
      });
    }
  }

  // === 3. FIX MOBILE CARD COUNT DISPLAY ===
  function fixResultsCounter() {
    // Watch for renderCards and update the count display
    var grid = document.getElementById('grid');
    if (!grid) return;

    new MutationObserver(function() {
      var visible = Array.from(grid.children).filter(function(c) {
        return c.style.display !== 'none';
      }).length;
      var info = document.querySelector('.results-info');
      if (info) {
        var lang = localStorage.getItem('rvl_lang') || document.documentElement.lang || 'en';
        var total = window.agents ? window.agents.length : visible;
        if (lang === 'ar') {
          info.innerHTML = 'عرض <strong>' + visible + '</strong> من <strong>' + total + '</strong> أداة';
        } else {
          info.innerHTML = 'Showing <strong>' + visible + '</strong> of <strong>' + total + '</strong> tools';
        }
      }
    }).observe(grid, { childList: true, subtree: true });
  }

  // === INIT ===
  function init() {
    fixDarkMode();
    fixResultsCounter();

    // Wait for agents to load then add counts
    var checkAgents = setInterval(function() {
      if (window.agents && window.agents.length > 0) {
        clearInterval(checkAgents);
        updateCategoryCounts();
        // Re-update on language change
        var langBtn = document.getElementById('langToggle');
        if (langBtn) {
          langBtn.addEventListener('click', function() {
            setTimeout(updateCategoryCounts, 300);
          });
        }
      }
    }, 500);

    // Timeout after 10s
    setTimeout(function() { clearInterval(checkAgents); }, 10000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
