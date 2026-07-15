(function(){
  "use strict";

  /* --- Inject CSS --- */
  var lk=document.createElement("link");
  lk.rel="stylesheet";lk.href="enhancements.css";
  document.head.appendChild(lk);

  var favs=JSON.parse(localStorage.getItem("rvl_favs")||"[]");
  var allAgents=[];
  var currentSort="default";
  var showFavsOnly=false;

  /* --- Load agent data --- */
  Promise.all([
    fetch("agents.json").then(function(r){return r.json()}).catch(function(){return []}),
    fetch("new-agents.json").then(function(r){return r.json()}).catch(function(){return []})
  ]).then(function(res){
    allAgents=res[0];
    var ids=new Set(allAgents.map(function(a){return a.id}));
    res[1].forEach(function(a){if(!ids.has(a.id)){allAgents.push(a);ids.add(a.id)}});
    /* inject new agents into page if possible */
    if(window.agents&&Array.isArray(window.agents)){
      var wids=new Set(window.agents.map(function(a){return a.id}));
      allAgents.forEach(function(a){if(!wids.has(a.id)){window.agents.push(a);wids.add(a.id)}});
      if(typeof window.renderCards==="function")window.renderCards();
    }
    /* --- Dynamic count update (fixes 800 display bug) --- */
    var totalStr=allAgents.length+"+";
    document.querySelectorAll(".hero-stat-num").forEach(function(el){el.textContent=totalStr});
    document.querySelectorAll("h1 span, .hero-title span, .hero span").forEach(function(el){
      if(/^\d{3,}\+?$/.test(el.textContent.trim()))el.textContent=totalStr;
    });
    if(document.title.match(/\d{3,}\+?/))document.title=document.title.replace(/\d{3,}\+?/,totalStr);
    /* Update results counter */
    var ri=document.querySelector(".results-info span, #resultsCount");
    if(ri&&/^\d{3,}/.test(ri.textContent.trim()))ri.textContent=totalStr;
    init();
  });

  function getLang(){return localStorage.getItem("rvl_lang")||document.documentElement.lang||"en"}

  function init(){
    setupDarkMode();
    setupControls();
    enhanceCards();
    var grid=document.getElementById("grid");
    if(grid){
      new MutationObserver(function(){
        setTimeout(function(){
          enhanceCards();
          if(currentSort!=="default")applySort();
          if(showFavsOnly)applyFavFilter();
        },50);
      }).observe(grid,{childList:true});
    }
  }

  /* === DARK MODE === */
  function setupDarkMode(){
    var theme=localStorage.getItem("rvl_theme")||"light";
    document.documentElement.setAttribute("data-theme",theme);
    var nav=document.querySelector("nav");
    if(!nav)return;
    var btn=document.createElement("button");
    btn.className="theme-toggle";
    btn.setAttribute("aria-label","Toggle theme");
    btn.innerHTML=theme==="dark"?"\u2600\uFE0F":"\uD83C\uDF19";
    btn.onclick=function(){
      var t=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";
      document.documentElement.setAttribute("data-theme",t);
      localStorage.setItem("rvl_theme",t);
      btn.innerHTML=t==="dark"?"\u2600\uFE0F":"\uD83C\uDF19";
    };
    var cta=nav.querySelector(".nav-cta");
    if(cta)cta.prepend(btn);else nav.appendChild(btn);
  }

  /* === SORT & FAVORITES CONTROLS === */
  function setupControls(){
    var info=document.querySelector(".results-info")||document.querySelector(".toolbar");
    if(!info)return;
    var div=document.createElement("div");div.className="sort-controls";
    var lang=getLang();
    var sel=document.createElement("select");sel.className="sort-select";sel.id="enhSort";
    var opts=lang==="ar"?
      [["default","\u0627\u0641\u062A\u0631\u0627\u0636\u064A"],["name-asc","\u0623-\u064A"],["name-desc","\u064A-\u0623"],["newest","\u0627\u0644\u0623\u062D\u062F\u062B"]]:
      [["default","Default"],["name-asc","A\u2192Z"],["name-desc","Z\u2192A"],["newest","Newest"]];
    opts.forEach(function(o){var op=document.createElement("option");op.value=o[0];op.textContent=o[1];sel.appendChild(op)});
    sel.onchange=function(){currentSort=sel.value;applySort()};
    var fb=document.createElement("button");fb.className="fav-filter";fb.id="enhFavFilter";
    fb.innerHTML=lang==="ar"?"\u2B50 \u0627\u0644\u0645\u0641\u0636\u0644\u0629":"\u2B50 Favorites";
    fb.onclick=function(){showFavsOnly=!showFavsOnly;fb.classList.toggle("active",showFavsOnly);applyFavFilter()};
    div.appendChild(sel);div.appendChild(fb);
    info.parentNode.insertBefore(div,info.nextSibling);
  }

  /* === ENHANCE CARDS === */
  function enhanceCards(){
    var grid=document.getElementById("grid");if(!grid)return;
    var lang=getLang();
    Array.from(grid.children).forEach(function(card,i){
      if(!card.getAttribute("data-agent-id")){
        var a=card.querySelector('a[href*="agent.html"]');
        if(a){var m=a.href.match(/[?&]id=([^&]+)/);if(m)card.setAttribute("data-agent-id",m[1])}
      }
      var id=card.getAttribute("data-agent-id");if(!id)return;
      card.style.position="relative";
      /* Favorite button */
      if(!card.querySelector(".fav-btn")){
        var isFav=favs.indexOf(id)>-1;
        var b=document.createElement("button");b.className="fav-btn"+(isFav?" active":"");
        b.innerHTML=isFav?"\u2605":"\u2606";
        b.onclick=function(e){e.preventDefault();e.stopPropagation();
          var x=favs.indexOf(id);if(x>-1)favs.splice(x,1);else favs.push(id);
          localStorage.setItem("rvl_favs",JSON.stringify(favs));
          b.classList.toggle("active");b.innerHTML=favs.indexOf(id)>-1?"\u2605":"\u2606";
        };
        card.appendChild(b);
      }
      /* New badge */
      if(!card.querySelector(".new-badge")){
        var ag=allAgents.find(function(a){return a.id===id});
        if(ag&&ag.added_date){
          var d=new Date(ag.added_date),cut=new Date(Date.now()-30*864e5);
          if(d>cut){var nb=document.createElement("span");nb.className="new-badge";
            nb.textContent=lang==="ar"?"\u062C\u062F\u064A\u062F":"NEW";card.appendChild(nb)}
        }
      }
      /* Fade-in */
      if(!card.classList.contains("fade-in")){card.style.animationDelay=Math.min(i*60,600)+"ms";card.classList.add("fade-in")}
    });
  }

  /* === SORT === */
  function applySort(){
    var grid=document.getElementById("grid");if(!grid||currentSort==="default")return;
    var lang=getLang();
    var cards=Array.from(grid.children).filter(function(c){return c.style.display!=="none"});
    cards.sort(function(a,b){
      var ai=a.getAttribute("data-agent-id")||"",bi=b.getAttribute("data-agent-id")||"";
      var aa=allAgents.find(function(x){return x.id===ai})||{};
      var bb=allAgents.find(function(x){return x.id===bi})||{};
      var an=lang==="ar"?(aa.name_ar||aa.name||""):(aa.name||"");
      var bn=lang==="ar"?(bb.name_ar||bb.name||""):(bb.name||"");
      if(currentSort==="name-asc")return an.localeCompare(bn);
      if(currentSort==="name-desc")return bn.localeCompare(an);
      if(currentSort==="newest")return new Date(bb.added_date||0)-new Date(aa.added_date||0);
      return 0;
    });
    cards.forEach(function(c){grid.appendChild(c)});
  }

  /* === FAVORITES FILTER === */
  function applyFavFilter(){
    var grid=document.getElementById("grid");if(!grid)return;
    Array.from(grid.children).forEach(function(c){
      var id=c.getAttribute("data-agent-id");
      if(showFavsOnly&&id&&favs.indexOf(id)<0)c.style.display="none";
      else if(c.style.display==="none"&&(!showFavsOnly||favs.indexOf(id)>-1))c.style.display="";
    });
  }
})();
