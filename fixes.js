(function(){
  'use strict';

  // === 1. ADD REAL COUNTS TO CATEGORY FILTER BUTTONS ===
  function updateCategoryCounts() {
    var agents = window.agents;
    if (!agents || !agents.length) return;

    // Count per category
    var catCounts = {};
    agents.forEach(function(a) {
      var cat = a.category || 'other';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    // Count per pricing type
    var priceCounts = { all: agents.length };
    agents.forEach(function(a) {
      var pt = a.pricing_type || '';
      if (pt === 'free') priceCounts['free'] = (priceCounts['free'] || 0) + 1;
      else if (pt === 'freemium') priceCounts['freemium'] = (priceCounts['freemium'] || 0) + 1;
      else if (pt === 'paid') priceCounts['paid'] = (priceCounts['paid'] || 0) + 1;
      else if (pt === 'enterprise') priceCounts['enterprise'] = (priceCounts['enterprise'] || 0) + 1;
      if (a.open_source) priceCounts['open_source'] = (priceCounts['open_source'] || 0) + 1;
      if (a.has_free_trial) priceCounts['free_trial'] = (priceCounts['free_trial'] || 0) + 1;
    });

    // Update category buttons
    document.querySelectorAll('#catFilters .filter-btn').forEach(function(btn) {
      var cat = btn.dataset.cat;
      if (!cat) return;
      var count = cat === 'all' ? agents.length : (catCounts[cat] || 0);
      // Remove old count badge if exists
      var oldBadge = btn.querySelector('.cat-count');
      if (oldBadge) oldBadge.remove();
      // Add count badge
      var badge = document.createElement('span');
      badge.className = 'cat-count';
      badge.textContent = count;
      btn.appendChild(badge);
    });

    // Update price buttons
    document.querySelectorAll('#priceFilters .price-btn').forEach(function(btn) {
      var price = btn.dataset.price;
      if (!price) return;
      var count = price === 'all' ? agents.length : (priceCounts[price] || 0);
      var oldBadge = btn.querySelector('.cat-count');
      if (oldBadge) oldBadge.remove();
      var badge = document.createElement('span');
      badge.className = 'cat-count';
      badge.textContent = count;
      btn.appendChild(badge);
    });

    // Update the results counter text to show real total
    var resultsInfo = document.querySelector('.results-info span, .results-info');
    if (resultsInfo) {
      var grid = document.getElementById('grid');
      if (grid) {
        var visible = Array.from(grid.children).filter(function(c) {
          return c.style.display !== 'none';
        }).length;
        var lang = localStorage.getItem('rvl_lang') || document.documentElement.lang || 'en';
        if (lang === 'ar') {
          resultsInfo.textContent = '\u0639\u0631\u0636 ' + visible + ' \u0623\u062f\u0627\u0629 \u0645\u0646 ' + agents.length;
        } else {
          resultsInfo.textContent = 'Showing ' + visible + ' of ' + agents.length + ' tools';
        }
      }
    }
  }

  // Re-run counts when cards re-render
  var _origRC = window.renderCards;
  if (typeof _origRC === 'function') {
    window.renderCards = function() {
      _origRC.apply(this, arguments);
      setTimeout(updateCategoryCounts, 100);
    };
  }

  // === 2. FIX DARK MODE PERFORMANCE ===
  // The issue: backdrop-filter: blur() on nav causes lag during theme transitions
  // Fix: disable blur during transition, re-enable after
  function fixDarkModePerformance() {
    var root = document.documentElement;
    var nav = document.querySelector('nav');
    
    // Override theme toggle to add transition optimization
    var allToggles = document.querySelectorAll('.theme-toggle, [aria-label="Toggle theme"]');
    allToggles.forEach(function(btn) {
      var origClick = btn.onclick;
      btn.onclick = function(e) {
        // Disable expensive effects during transition
        root.style.setProperty('--nav-blur', 'none');
        if (nav) nav.style.backdropFilter = 'none';
        if (nav) nav.style.webkitBackdropFilter = 'none';
        root.classList.add('theme-transitioning');
        
        // Run original toggle
        if (origClick) origClick.call(this, e);
        
        // Re-enable after transition
        requestAnimationFrame(function() {
          setTimeout(function() {
            root.classList.remove('theme-transitioning');
            if (nav) nav.style.backdropFilter = '';
            if (nav) nav.style.webkitBackdropFilter = '';
            root.style.removeProperty('--nav-blur');
          }, 350);
        });
      };
    });
  }

  // === 3. OBSERVE GRID CHANGES TO UPDATE COUNTER ===
  function observeGrid() {
    var grid = document.getElementById('grid');
    if (!grid) return;
    var observer = new MutationObserver(function() {
      setTimeout(function() {
        var agents = window.agents;
        if (!agents) return;
        var visible = Array.from(grid.children).filter(function(c) {
          return c.style.display !== 'none';
        }).length;
        var lang = localStorage.getItem('rvl_lang') || document.documentElement.lang || 'en';
        var info = document.querySelector('.results-info span') || document.querySelector('.results-info');
        if (info) {
          if (lang === 'ar') {
            info.textContent = '\u0639\u0631\u0636 ' + visible + ' \u0623\u062f\u0627\u0629 \u0645\u0646 ' + agents.length;
          } else {
            info.textContent = 'Showing ' + visible + ' of ' + agents.length + ' tools';
          }
        }
      }, 150);
    });
    observer.observe(grid, { childList: true, subtree: false });
  }

  // === INIT ===
  function init() {
    // Wait for agents to load
    var checkAgents = setInterval(function() {
      if (window.agents && window.agents.length > 0) {
        clearInterval(checkAgents);
        updateCategoryCounts();
        fixDarkModePerformance();
        observeGrid();
      }
    }, 500);
    // Timeout after 15s
    setTimeout(function() { clearInterval(checkAgents); }, 15000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
