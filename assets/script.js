// Cloud Music — interactions du site (vanilla JS, aucune dépendance)

(function(){
  var SUPPORTED = Object.keys(window.CM_LANGS || { fr: 1, en: 1 });
  var STORAGE_KEY = "cm_lang";

  function detectLang(){
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) {}
    var candidates = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || "en"];
    for (var i = 0; i < candidates.length; i++){
      var code = (candidates[i] || "").slice(0, 2).toLowerCase();
      if (SUPPORTED.indexOf(code) !== -1) return code;
    }
    return "en";
  }

  function applyTranslations(lang){
    var dict = window.CM_I18N[lang] || window.CM_I18N.en;
    document.querySelectorAll("[data-i18n]").forEach(function(el){
      var key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });
    document.querySelectorAll("[data-track-label-key]").forEach(function(el){
      var key = el.getAttribute("data-track-label-key");
      if (dict[key] !== undefined) el.setAttribute("data-track-label", dict[key]);
    });
    document.documentElement.lang = lang;
    document.documentElement.dir = (window.CM_RTL || []).indexOf(lang) !== -1 ? "rtl" : "ltr";
    document.querySelectorAll(".lang-select").forEach(function(sel){ sel.value = lang; });
  }

  function applySlogan(lang){
    var pool = (window.CM_SLOGANS && window.CM_SLOGANS[lang]) || window.CM_SLOGANS.en;
    var pick = pool[Math.floor(Math.random() * pool.length)];
    var el = document.getElementById("hero-title");
    if (el) el.innerHTML = pick;
  }

  function setLanguage(lang, opts){
    opts = opts || {};
    if (SUPPORTED.indexOf(lang) === -1) lang = "en";
    applyTranslations(lang);
    if (!opts.keepSlogan) applySlogan(lang);
    renderTrack(lang, currentTrackIndex);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch(e) {}
    window.CM_CURRENT_LANG = lang;
  }

  /* ---------------- Lecteur de démonstration interactif ---------------- */
  var currentTrackIndex = 0;
  var isPlaying = false;
  var progressPct = 24;
  var progressTimer = null;

  var COVERS = [
    { from: "#a640f2", to: "#3a1a5c", shape: "moon" },
    { from: "#b852ff", to: "#231029", shape: "bars" },
    { from: "#7a2fd6", to: "#160a20", shape: "wave" },
    { from: "#c76bff", to: "#1c0e2e", shape: "grid" }
  ];

  function coverSVG(idx){
    var c = COVERS[idx % COVERS.length];
    var defs = '<defs><linearGradient id="cg' + idx + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + c.from + '"/><stop offset="1" stop-color="' + c.to + '"/></linearGradient></defs>';
    var bg = '<rect width="100" height="100" fill="url(#cg' + idx + ')"/>';
    var shape = "";
    if (c.shape === "moon"){
      shape = '<circle cx="68" cy="30" r="20" fill="rgba(255,255,255,0.14)"/><circle cx="60" cy="26" r="20" fill="' + c.to + '"/>';
    } else if (c.shape === "bars"){
      shape = '<g fill="rgba(255,255,255,0.18)">' +
        '<rect x="20" y="55" width="8" height="30"/><rect x="34" y="35" width="8" height="50"/>' +
        '<rect x="48" y="45" width="8" height="40"/><rect x="62" y="20" width="8" height="65"/>' +
        '<rect x="76" y="40" width="8" height="45"/></g>';
    } else if (c.shape === "wave"){
      shape = '<path d="M0 60 Q 20 40 40 60 T 80 60 T 120 60" stroke="rgba(255,255,255,0.22)" stroke-width="6" fill="none"/>' +
              '<path d="M0 75 Q 20 55 40 75 T 80 75 T 120 75" stroke="rgba(255,255,255,0.12)" stroke-width="6" fill="none"/>';
    } else {
      shape = '<g stroke="rgba(255,255,255,0.16)" stroke-width="2">' +
        '<line x1="0" y1="25" x2="100" y2="25"/><line x1="0" y1="50" x2="100" y2="50"/><line x1="0" y1="75" x2="100" y2="75"/>' +
        '<line x1="25" y1="0" x2="25" y2="100"/><line x1="50" y1="0" x2="50" y2="100"/><line x1="75" y1="0" x2="75" y2="100"/></g>';
    }
    return '<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' + defs + bg + shape + '</svg>';
  }

  function buildCovers(){
    var wrap = document.getElementById("player-art");
    if (!wrap) return;
    wrap.innerHTML = "";
    COVERS.forEach(function(_, idx){
      var div = document.createElement("div");
      div.className = "cover" + (idx === 0 ? " is-active" : "");
      div.dataset.idx = idx;
      div.innerHTML = coverSVG(idx);
      wrap.appendChild(div);
    });
  }

  function renderTrack(lang, idx){
    var list = (window.CM_TRACKS && window.CM_TRACKS[lang]) || window.CM_TRACKS.en;
    var track = list[idx % list.length];
    var titleEl = document.getElementById("player-title");
    var metaEl = document.getElementById("player-meta");
    var dict = window.CM_I18N[lang] || window.CM_I18N.en;
    if (titleEl) titleEl.textContent = track.title;
    if (metaEl) metaEl.textContent = dict["player.from"] + " " + track.source + " · " + track.format;
    document.querySelectorAll("#player-art .cover").forEach(function(c){
      c.classList.toggle("is-active", Number(c.dataset.idx) === idx % COVERS.length);
    });
  }

  function setPlaying(playing){
    isPlaying = playing;
    var card = document.getElementById("player-card");
    var mainIcon = document.getElementById("player-main-icon");
    if (card) card.classList.toggle("is-playing", playing);
    if (mainIcon){
      mainIcon.innerHTML = playing
        ? '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>'
        : '<path d="M8 5v14l11-7z"/>';
    }
    clearInterval(progressTimer);
    if (playing){
      progressTimer = setInterval(function(){
        progressPct += 0.6;
        if (progressPct >= 100){
          progressPct = 0;
          nextTrack();
        }
        updateProgressUI();
      }, 180);
    }
  }

  function updateProgressUI(){
    var bar = document.getElementById("player-progress");
    if (bar) bar.style.width = progressPct + "%";
    var elapsed = document.getElementById("player-elapsed");
    if (elapsed){
      var total = 240; // 4:00 démo
      var secs = Math.floor((progressPct / 100) * total);
      var m = Math.floor(secs / 60), s = secs % 60;
      elapsed.textContent = m + ":" + (s < 10 ? "0" : "") + s;
    }
  }

  function nextTrack(){
    currentTrackIndex = (currentTrackIndex + 1) % 4;
    progressPct = 0;
    renderTrack(window.CM_CURRENT_LANG || "en", currentTrackIndex);
    updateProgressUI();
  }
  function prevTrack(){
    currentTrackIndex = (currentTrackIndex + 3) % 4;
    progressPct = 0;
    renderTrack(window.CM_CURRENT_LANG || "en", currentTrackIndex);
    updateProgressUI();
  }

  function initPlayer(){
    buildCovers();
    updateProgressUI();
    var playBtn = document.getElementById("player-play");
    var nextBtn = document.getElementById("player-next");
    var prevBtn = document.getElementById("player-prev");
    var barBg = document.getElementById("player-bar-bg");
    if (playBtn) playBtn.addEventListener("click", function(){ setPlaying(!isPlaying); });
    if (nextBtn) nextBtn.addEventListener("click", function(){ nextTrack(); });
    if (prevBtn) prevBtn.addEventListener("click", function(){ prevTrack(); });
    if (barBg) barBg.addEventListener("click", function(e){
      var rect = barBg.getBoundingClientRect();
      progressPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      updateProgressUI();
    });
  }

  /* ---------------- Sélecteur de langue ---------------- */
  function buildLangSelects(){
    document.querySelectorAll(".lang-select").forEach(function(sel){
      sel.innerHTML = "";
      SUPPORTED.forEach(function(code){
        var opt = document.createElement("option");
        opt.value = code;
        opt.textContent = window.CM_LANGS[code];
        sel.appendChild(opt);
      });
      sel.addEventListener("change", function(){ setLanguage(sel.value); });
    });
  }

  /* ---------------- Barre de progression / scrubber ---------------- */
  function initScrubber(){
    var fill = document.querySelector('.scrubber__fill');
    var label = document.querySelector('.scrubber__label');
    var sections = document.querySelectorAll('[data-track-label]');

    function onScroll(){
      if (!fill) return;
      var doc = document.documentElement;
      var scrollTop = doc.scrollTop || document.body.scrollTop;
      var scrollHeight = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
      var pct = scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0;
      fill.style.width = pct.toFixed(1) + '%';

      if (label){
        label.classList.add('is-visible');
        var current = null;
        sections.forEach(function(sec){
          var rect = sec.getBoundingClientRect();
          if (rect.top <= 120) current = sec;
        });
        if (current) label.textContent = current.getAttribute('data-track-label');
      }
    }
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- Apparition au scroll ---------------- */
  function initReveal(){
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting){
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      revealEls.forEach(function(el){ io.observe(el); });
    } else {
      revealEls.forEach(function(el){ el.classList.add('is-visible'); });
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    buildLangSelects();
    initPlayer();
    initScrubber();
    initReveal();
    setLanguage(detectLang());
  });
})();
