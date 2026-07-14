(function(){
  'use strict';

  var PUB_ID = 'ca-pub-8708847484545349';

  // === 1. Add AdSense script to head if not present ===
  if (!document.querySelector('script[src*="adsbygoogle"]')) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + PUB_ID;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }

  // === 2. Create ad slot HTML ===
  function createAdSlot(format, slot) {
    var div = document.createElement('div');
    div.className = 'ad-container';
    div.style.cssText = 'text-align:center;margin:20px auto;max-width:100%;overflow:hidden;';
    
    var label = document.createElement('div');
    label.style.cssText = 'font-size:0.65rem;color:#999;text-align:center;margin-bottom:4px;';
    label.textContent = 'Advertisement';
    div.appendChild(label);
    
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', PUB_ID);
    ins.setAttribute('data-ad-format', format || 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    if (slot) ins.setAttribute('data-ad-slot', slot);
    div.appendChild(ins);
    
    return div;
  }

  // === 3. Push ad to load ===
  function pushAd() {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch(e) {}
  }

  // === 4. Insert ads in strategic positions ===
  function insertAds() {
    // Ad 1: After hero section
    var hero = document.querySelector('.hero');
    if (hero && hero.nextElementSibling) {
      var ad1 = createAdSlot('horizontal');
      hero.parentNode.insertBefore(ad1, hero.nextElementSibling);
      pushAd();
    }

    // Ad 2: Between tool cards (after every 8 cards)
    var grid = document.getElementById('grid');
    if (grid) {
      // Use MutationObserver to insert ads after cards render
      var observer = new MutationObserver(function(mutations, obs) {
        var cards = grid.children;
        if (cards.length > 8) {
          obs.disconnect();
          // Insert ad after 8th card
          var ad2 = createAdSlot('fluid');
          ad2.style.gridColumn = '1 / -1';
          if (cards[8]) {
            grid.insertBefore(ad2, cards[8]);
            pushAd();
          }
          // Insert ad after 16th card if exists
          if (cards.length > 17) {
            var ad3 = createAdSlot('fluid');
            ad3.style.gridColumn = '1 / -1';
            if (cards[17]) {
              grid.insertBefore(ad3, cards[17]);
              pushAd();
            }
          }
        }
      });
      observer.observe(grid, { childList: true });
    }

    // Ad 3: Before newsletter section
    var newsletter = document.querySelector('.newsletter-section') || document.querySelector('.nl-box');
    if (newsletter) {
      var ad4 = createAdSlot('horizontal');
      newsletter.parentNode.insertBefore(ad4, newsletter);
      pushAd();
    }

    // Ad 4: Before footer
    var footer = document.querySelector('footer');
    if (footer) {
      var ad5 = createAdSlot('horizontal');
      footer.parentNode.insertBefore(ad5, footer);
      pushAd();
    }
  }

  // === 5. Add footer links to policy pages ===
  function addFooterLinks() {
    var footer = document.querySelector('footer');
    if (!footer) return;
    
    // Check if links already exist
    if (footer.innerHTML.includes('privacy.html')) return;
    
    var links = document.createElement('div');
    links.style.cssText = 'margin-top:12px;font-size:0.8rem;';
    links.innerHTML = '<a href="privacy.html" style="color:#6C63FF;margin:0 8px;">Privacy Policy</a> | ' +
      '<a href="terms.html" style="color:#6C63FF;margin:0 8px;">Terms of Service</a> | ' +
      '<a href="about.html" style="color:#6C63FF;margin:0 8px;">About Us</a> | ' +
      '<a href="contact.html" style="color:#6C63FF;margin:0 8px;">Contact</a>';
    footer.appendChild(links);
  }

  // === INIT ===
  function init() {
    addFooterLinks();
    // Delay ad insertion slightly to let page render first
    setTimeout(insertAds, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
