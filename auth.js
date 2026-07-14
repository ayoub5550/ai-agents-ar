(function(){
  'use strict';

  // === CONFIG ===
  var FORMSPREE_URL = 'https://formspree.io/f/xnnqeqdo'; // Same as newsletter
  var STORAGE_KEY = 'av_member';
  var allAgents = [];

  // === INJECT CSS ===
  var lk = document.createElement('link');
  lk.rel = 'stylesheet'; lk.href = 'auth.css';
  document.head.appendChild(lk);

  // === GET MEMBER ===
  function getMember() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch(e) { return null; }
  }
  function saveMember(m) { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); }
  function removeMember() { localStorage.removeItem(STORAGE_KEY); }
  function getLang() { return localStorage.getItem('rvl_lang') || document.documentElement.lang || 'en'; }

  // === i18n ===
  var t = {
    en: {
      login: 'Login', register: 'Register', signIn: 'Sign In', signUp: 'Sign Up',
      email: 'Email', name: 'Your Name', password: 'Password',
      interests: 'Interests', selectInterests: 'Select your interests',
      newsletter: 'Send me weekly AI news & new tools',
      loginBtn: 'Sign In', registerBtn: 'Create Account',
      welcomeBack: 'Welcome back!', regSuccess: 'Account created!',
      regSuccessMsg: 'You will receive the latest AI news weekly.',
      loginSubtitle: 'Access your favorites and personalized experience',
      regSubtitle: 'Join 10K+ members for weekly AI updates',
      hi: 'Hi', member: 'MEMBER', profile: 'My Profile',
      favorites: 'My Favorites', logout: 'Logout',
      newsTitle: 'Latest AI News', newsSubtitle: 'Newest tools added to our directory',
      memberBar: '👋 Welcome back, {name}! You have {fav} favorites.',
      newTools: 'new tools', addedRecently: 'Added recently',
      wrongPassword: 'Wrong password', noAccount: 'No account with this email. Register first.',
      fillAll: 'Please fill all required fields'
    },
    ar: {
      login: 'دخول', register: 'تسجيل', signIn: 'تسجيل الدخول', signUp: 'إنشاء حساب',
      email: 'البريد الإلكتروني', name: 'اسمك', password: 'كلمة المرور',
      interests: 'اهتماماتك', selectInterests: 'اختر اهتماماتك',
      newsletter: 'أرسل لي أخبار AI والأدوات الجديدة أسبوعياً',
      loginBtn: 'دخول', registerBtn: 'إنشاء حساب',
      welcomeBack: 'مرحباً بعودتك!', regSuccess: 'تم إنشاء الحساب!',
      regSuccessMsg: 'ستصلك أحدث أخبار AI أسبوعياً على بريدك.',
      loginSubtitle: 'ادخل لتجربة مخصصة ومفضلاتك المحفوظة',
      regSubtitle: 'انضم لأكثر من 10 آلاف عضو لتحديثات AI الأسبوعية',
      hi: 'أهلاً', member: 'عضو', profile: 'ملفي الشخصي',
      favorites: 'مفضلاتي', logout: 'خروج',
      newsTitle: 'آخر أخبار AI', newsSubtitle: 'أحدث الأدوات المضافة لدليلنا',
      memberBar: '👋 مرحباً {name}! لديك {fav} أداة مفضلة.',
      newTools: 'أداة جديدة', addedRecently: 'أُضيفت مؤخراً',
      wrongPassword: 'كلمة المرور خاطئة', noAccount: 'لا يوجد حساب بهذا البريد. سجّل أولاً.',
      fillAll: 'يرجى ملء جميع الحقول المطلوبة'
    }
  };
  function T(key) { var l = getLang(); return (t[l] && t[l][key]) || t.en[key] || key; }

  // === BUILD AUTH MODAL ===
  function buildAuthModal() {
    var overlay = document.createElement('div');
    overlay.className = 'auth-overlay';
    overlay.id = 'authOverlay';
    overlay.innerHTML = '<div class="auth-modal" id="authModal">' +
      '<button class="auth-modal-close" onclick="document.getElementById(\'authOverlay\').classList.remove(\'open\')">&times;</button>' +
      '<h2 id="authTitle">' + T('signUp') + '</h2>' +
      '<p class="auth-subtitle" id="authSubtitle">' + T('regSubtitle') + '</p>' +
      '<div class="auth-tabs">' +
        '<button class="auth-tab" data-tab="login" id="tabLogin">' + T('login') + '</button>' +
        '<button class="auth-tab active" data-tab="register" id="tabRegister">' + T('register') + '</button>' +
      '</div>' +
      /* LOGIN FORM */
      '<form class="auth-form" id="loginForm">' +
        '<div class="auth-field"><label>' + T('email') + '</label><input type="email" id="loginEmail" required></div>' +
        '<div class="auth-field"><label>' + T('password') + '</label><input type="password" id="loginPass" required></div>' +
        '<button type="submit" class="auth-submit">' + T('loginBtn') + '</button>' +
        '<p id="loginError" style="color:#EF4444;font-size:0.85rem;margin-top:8px;display:none"></p>' +
      '</form>' +
      /* REGISTER FORM */
      '<form class="auth-form active" id="registerForm">' +
        '<div class="auth-field"><label>' + T('name') + '</label><input type="text" id="regName" required></div>' +
        '<div class="auth-field"><label>' + T('email') + '</label><input type="email" id="regEmail" required></div>' +
        '<div class="auth-field"><label>' + T('password') + '</label><input type="password" id="regPass" required minlength="4"></div>' +
        '<div class="auth-field"><label>' + T('interests') + '</label>' +
          '<select id="regInterest"><option value="">' + T('selectInterests') + '</option>' +
          '<option value="coding">Coding / برمجة</option>' +
          '<option value="creative">Creative / إبداع</option>' +
          '<option value="productivity">Productivity / إنتاجية</option>' +
          '<option value="marketing">Marketing / تسويق</option>' +
          '<option value="data">Data & Analytics / بيانات</option>' +
          '<option value="security">Security / أمن</option>' +
          '<option value="all">All / الكل</option></select></div>' +
        '<label class="auth-check"><input type="checkbox" id="regNewsletter" checked> ' + T('newsletter') + '</label>' +
        '<button type="submit" class="auth-submit">' + T('registerBtn') + '</button>' +
        '<p id="regError" style="color:#EF4444;font-size:0.85rem;margin-top:8px;display:none"></p>' +
      '</form>' +
      /* SUCCESS */
      '<div class="auth-success" id="authSuccess">' +
        '<div class="check-icon">✅</div>' +
        '<h3 id="successTitle"></h3>' +
        '<p id="successMsg"></p>' +
      '</div>' +
    '</div>';

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.classList.remove('open');
    });
    document.body.appendChild(overlay);

    // Tab switching
    overlay.querySelectorAll('.auth-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        var which = this.dataset.tab;
        overlay.querySelectorAll('.auth-tab').forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        document.getElementById('loginForm').classList.toggle('active', which === 'login');
        document.getElementById('registerForm').classList.toggle('active', which === 'register');
        document.getElementById('authSuccess').classList.remove('show');
        document.getElementById('authTitle').textContent = which === 'login' ? T('signIn') : T('signUp');
        document.getElementById('authSubtitle').textContent = which === 'login' ? T('loginSubtitle') : T('regSubtitle');
      });
    });

    // Register
    document.getElementById('registerForm').addEventListener('submit', function(e) {
      e.preventDefault();
      var name = document.getElementById('regName').value.trim();
      var email = document.getElementById('regEmail').value.trim();
      var pass = document.getElementById('regPass').value;
      var interest = document.getElementById('regInterest').value;
      var newsletter = document.getElementById('regNewsletter').checked;
      if (!name || !email || !pass) {
        showError('regError', T('fillAll')); return;
      }
      var member = { name: name, email: email, pass: btoa(pass), interest: interest, newsletter: newsletter, joined: new Date().toISOString() };
      saveMember(member);

      // Send to Formspree for newsletter
      if (newsletter) {
        fetch(FORMSPREE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ email: email, name: name, interest: interest, type: 'member_registration' })
        }).catch(function() {});
      }

      document.getElementById('registerForm').classList.remove('active');
      document.getElementById('authSuccess').classList.add('show');
      document.getElementById('successTitle').textContent = T('regSuccess');
      document.getElementById('successMsg').textContent = T('regSuccessMsg');
      setTimeout(function() {
        overlay.classList.remove('open');
        updateAuthUI();
      }, 2000);
    });

    // Login
    document.getElementById('loginForm').addEventListener('submit', function(e) {
      e.preventDefault();
      var email = document.getElementById('loginEmail').value.trim();
      var pass = document.getElementById('loginPass').value;
      var member = getMember();
      if (!member || member.email !== email) {
        showError('loginError', T('noAccount')); return;
      }
      if (member.pass !== btoa(pass)) {
        showError('loginError', T('wrongPassword')); return;
      }
      document.getElementById('loginForm').classList.remove('active');
      document.getElementById('authSuccess').classList.add('show');
      document.getElementById('successTitle').textContent = T('welcomeBack');
      document.getElementById('successMsg').textContent = T('hi') + ' ' + member.name + '! 🎉';
      setTimeout(function() {
        overlay.classList.remove('open');
        updateAuthUI();
      }, 1500);
    });
  }

  function showError(id, msg) {
    var el = document.getElementById(id);
    el.textContent = msg; el.style.display = 'block';
    setTimeout(function() { el.style.display = 'none'; }, 3000);
  }

  // === AUTH BUTTON ===
  function buildAuthButton() {
    var nav = document.querySelector('nav');
    if (!nav) return;
    var cta = nav.querySelector('.nav-cta');
    var btn = document.createElement('button');
    btn.className = 'auth-btn';
    btn.id = 'authBtn';
    btn.innerHTML = '<span class="auth-icon">👤</span> ' + T('register');
    btn.onclick = function() {
      var member = getMember();
      if (member) {
        toggleProfileMenu();
      } else {
        document.getElementById('authOverlay').classList.add('open');
      }
    };
    if (cta) cta.prepend(btn); else nav.appendChild(btn);

    // Profile dropdown
    var dd = document.createElement('div');
    dd.className = 'profile-menu';
    dd.id = 'profileMenu';
    dd.innerHTML =
      '<button class="profile-menu-item" onclick="window.avScrollToFavs()">⭐ ' + T('favorites') + '</button>' +
      '<button class="profile-menu-item" onclick="window.avScrollToNews()">📰 ' + T('newsTitle') + '</button>' +
      '<button class="profile-menu-item danger" onclick="window.avLogout()">🚪 ' + T('logout') + '</button>';
    btn.parentElement.style.position = 'relative';
    btn.parentElement.appendChild(dd);

    // Close dropdown on outside click
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#authBtn') && !e.target.closest('#profileMenu')) {
        document.getElementById('profileMenu').classList.remove('open');
      }
    });
  }

  function toggleProfileMenu() {
    document.getElementById('profileMenu').classList.toggle('open');
  }

  // === MEMBER BAR ===
  function buildMemberBar() {
    var bar = document.createElement('div');
    bar.className = 'member-bar';
    bar.id = 'memberBar';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  // === NEWS SECTION ===
  function buildNewsSection() {
    var footer = document.querySelector('footer') || document.querySelector('.newsletter-section');
    if (!footer) return;
    var section = document.createElement('section');
    section.className = 'news-section';
    section.id = 'newsSection';
    section.innerHTML = '<h2>' + T('newsTitle') + ' 📰</h2>' +
      '<p class="news-subtitle">' + T('newsSubtitle') + '</p>' +
      '<div class="news-grid" id="newsGrid"></div>';
    footer.parentNode.insertBefore(section, footer);
  }

  function populateNews() {
    var grid = document.getElementById('newsGrid');
    if (!grid || !allAgents.length) return;

    // Sort by added_date descending
    var sorted = allAgents.filter(function(a) { return a.added_date; })
      .sort(function(a, b) { return new Date(b.added_date) - new Date(a.added_date); })
      .slice(0, 6);

    var lang = getLang();
    grid.innerHTML = sorted.map(function(a) {
      var name = lang === 'ar' ? (a.name_ar || a.name) : a.name;
      var desc = lang === 'ar' ? (a.description || a.description_en) : (a.description_en || a.description);
      var cat = lang === 'ar' ? (a.category_ar || a.category) : a.category;
      if (desc && desc.length > 100) desc = desc.substring(0, 100) + '...';
      return '<div class="news-card">' +
        '<div class="news-date">' + (a.added_date || '') + ' • ' + T('addedRecently') + '</div>' +
        '<h3>' + name + '</h3>' +
        '<p>' + (desc || '') + '</p>' +
        '<span class="news-tag">' + (cat || '') + '</span>' +
      '</div>';
    }).join('');
  }

  // === UPDATE UI ===
  function updateAuthUI() {
    var member = getMember();
    var btn = document.getElementById('authBtn');
    var bar = document.getElementById('memberBar');
    if (!btn) return;

    if (member) {
      var firstName = member.name.split(' ')[0];
      btn.innerHTML = '<span class="auth-icon">👤</span> ' + firstName + ' <span class="member-badge">' + T('member') + '</span>';
      btn.classList.add('logged-in');
      if (bar) {
        var favs = JSON.parse(localStorage.getItem('rvl_favs') || '[]');
        bar.innerHTML = T('memberBar').replace('{name}', firstName).replace('{fav}', favs.length);
        bar.classList.add('show');
      }
    } else {
      btn.innerHTML = '<span class="auth-icon">👤</span> ' + T('register');
      btn.classList.remove('logged-in');
      if (bar) bar.classList.remove('show');
    }
  }

  // === GLOBAL FUNCTIONS ===
  window.avLogout = function() {
    removeMember();
    document.getElementById('profileMenu').classList.remove('open');
    updateAuthUI();
  };
  window.avScrollToFavs = function() {
    document.getElementById('profileMenu').classList.remove('open');
    var favBtn = document.getElementById('enhFavFilter');
    if (favBtn) { favBtn.click(); window.scrollTo({ top: 400, behavior: 'smooth' }); }
  };
  window.avScrollToNews = function() {
    document.getElementById('profileMenu').classList.remove('open');
    var news = document.getElementById('newsSection');
    if (news) news.scrollIntoView({ behavior: 'smooth' });
  };

  // === INIT ===
  function init() {
    buildAuthModal();
    buildAuthButton();
    buildMemberBar();
    buildNewsSection();
    updateAuthUI();

    // Load agents for news
    Promise.all([
      fetch('agents.json').then(function(r) { return r.json(); }).catch(function() { return []; }),
      fetch('new-agents.json').then(function(r) { return r.json(); }).catch(function() { return []; })
    ]).then(function(res) {
      allAgents = res[0];
      var ids = new Set(allAgents.map(function(a) { return a.id; }));
      res[1].forEach(function(a) { if (!ids.has(a.id)) { allAgents.push(a); ids.add(a.id); } });
      // Also try expansion files
      var files = [];
      for (var i = 1; i <= 8; i++) files.push('new-agents-expansion-' + i + '.json');
      Promise.all(files.map(function(f) {
        return fetch(f).then(function(r) { return r.ok ? r.json() : []; }).catch(function() { return []; });
      })).then(function(batches) {
        batches.forEach(function(b) {
          b.forEach(function(a) { if (!ids.has(a.id)) { allAgents.push(a); ids.add(a.id); } });
        });
        populateNews();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
