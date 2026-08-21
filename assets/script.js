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
  var shuffleOn = false;
  var repeatOn = false;
  var progressPct = 0;
  var progressTimer = null;

  var COVERS = [
    { from: "#a640f2", to: "#3a1259", shape: "moon" },   // piste 1 : toujours violet (marque)
    { from: "#ff9d4d", to: "#3a1a08", shape: "bars" },    // ambre
    { from: "#33d2a6", to: "#082e24", shape: "wave" },    // émeraude
    { from: "#ff5c8a", to: "#3a0d1c", shape: "grid" }     // rose
  ];

  function coverSVG(idx){
    var c = COVERS[idx % COVERS.length];
    var defs = '<defs><linearGradient id="cg' + idx + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + c.from + '"/><stop offset="1" stop-color="' + c.to + '"/></linearGradient></defs>';
    var bg = '<rect width="100" height="100" fill="url(#cg' + idx + ')"/>';
    var shape = "";
    if (c.shape === "moon"){
      shape = '<circle cx="68" cy="30" r="20" fill="rgba(255,255,255,0.16)"/><circle cx="60" cy="26" r="20" fill="' + c.to + '"/>';
    } else if (c.shape === "bars"){
      shape = '<g fill="rgba(255,255,255,0.22)">' +
        '<rect x="20" y="55" width="8" height="30"/><rect x="34" y="35" width="8" height="50"/>' +
        '<rect x="48" y="45" width="8" height="40"/><rect x="62" y="20" width="8" height="65"/>' +
        '<rect x="76" y="40" width="8" height="45"/></g>';
    } else if (c.shape === "wave"){
      shape = '<path d="M0 60 Q 20 40 40 60 T 80 60 T 120 60" stroke="rgba(255,255,255,0.28)" stroke-width="6" fill="none"/>' +
              '<path d="M0 75 Q 20 55 40 75 T 80 75 T 120 75" stroke="rgba(255,255,255,0.16)" stroke-width="6" fill="none"/>';
    } else {
      shape = '<g stroke="rgba(255,255,255,0.2)" stroke-width="2">' +
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
        progressPct += 100 / 240; // 240s de démo = 1 seconde réelle par seconde de piste
        if (progressPct >= 100){
          progressPct = 0;
          handleTrackEnd();
        }
        updateProgressUI();
      }, 1000);
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

  // Fin naturelle d'une piste : respecte répétition / lecture aléatoire
  function handleTrackEnd(){
    if (repeatOn){
      progressPct = 0; // rejoue la même piste
      return;
    }
    pickNext();
  }

  function pickNext(){
    if (shuffleOn){
      var next = currentTrackIndex;
      do { next = Math.floor(Math.random() * 4); } while (next === currentTrackIndex);
      currentTrackIndex = next;
    } else {
      currentTrackIndex = (currentTrackIndex + 1) % 4;
    }
    renderTrack(window.CM_CURRENT_LANG || "en", currentTrackIndex);
  }

  function nextTrack(){
    progressPct = 0;
    pickNext(); // le bouton "suivant" change toujours de piste, même en répétition
    updateProgressUI();
  }
  function prevTrack(){
    progressPct = 0;
    currentTrackIndex = (currentTrackIndex + 3) % 4;
    renderTrack(window.CM_CURRENT_LANG || "en", currentTrackIndex);
    updateProgressUI();
  }

  function initPlayer(){
    buildCovers();
    updateProgressUI();
    var playBtn = document.getElementById("player-play");
    var nextBtn = document.getElementById("player-next");
    var prevBtn = document.getElementById("player-prev");
    var shuffleBtn = document.getElementById("player-shuffle");
    var repeatBtn = document.getElementById("player-repeat");
    var barBg = document.getElementById("player-bar-bg");
    if (playBtn) playBtn.addEventListener("click", function(){ setPlaying(!isPlaying); });
    if (nextBtn) nextBtn.addEventListener("click", function(){ nextTrack(); });
    if (prevBtn) prevBtn.addEventListener("click", function(){ prevTrack(); });
    if (shuffleBtn) shuffleBtn.addEventListener("click", function(){
      shuffleOn = !shuffleOn;
      shuffleBtn.classList.toggle("is-on", shuffleOn);
      shuffleBtn.setAttribute("aria-pressed", shuffleOn ? "true" : "false");
    });
    if (repeatBtn) repeatBtn.addEventListener("click", function(){
      repeatOn = !repeatOn;
      repeatBtn.classList.toggle("is-on", repeatOn);
      repeatBtn.setAttribute("aria-pressed", repeatOn ? "true" : "false");
    });
    if (barBg) barBg.addEventListener("click", function(e){
      var rect = barBg.getBoundingClientRect();
      progressPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      updateProgressUI();
    });
    setPlaying(true); // lecture par défaut au chargement
  }

  /* ---------------- Sélecteur de langue ---------------- */
  function buildLangSelects(){
    document.querySelectorAll(".lang-select").forEach(function(sel){
      sel.innerHTML = "";
      SUPPORTED.forEach(function(code){
        var opt = document.createElement("option");
        opt.value = code;
        var flag = (window.CM_FLAGS && window.CM_FLAGS[code]) || "";
        opt.textContent = (flag ? flag + " " : "") + window.CM_LANGS[code];
        sel.appendChild(opt);
      });
      sel.addEventListener("change", function(){ setLanguage(sel.value); });
    });
  }

  /* ---------------- Onglets de navigation + barre de progression du site ---------------- */
  var navTabs = [];
  var navSections = [];
  var activeTabIndex = 0;

  function initNavTabs(){
    navTabs = Array.prototype.slice.call(document.querySelectorAll(".nav__tab"));
    if (!navTabs.length) return;
    navSections = navTabs.map(function(tab){
      var id = tab.getAttribute("data-section");
      return id === "top" ? document.body : document.getElementById(id);
    });
  }

  // La barre sous les onglets avance en continu et touche le milieu de chaque
  // onglet exactement au moment où la section correspondante commence à l'écran.
  // Si les onglets ne sont pas visibles (écran trop petit pour tous les afficher),
  // on bascule sur une simple progression du scroll (0 à 100% de la largeur disponible).
  function updateScrollProgress(){
    var indicator = document.getElementById("nav-indicator");
    var tabsWrap = document.getElementById("nav-tabs");
    var tabsRight = document.querySelector(".nav__tabs-right");
    if (!indicator || !tabsWrap) return;

    var wrapRect = tabsWrap.getBoundingClientRect();

    // Mesures de scroll robustes (fiables sur mobile, contrairement à document.documentElement seul)
    var scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    var docHeight = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight
    );
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    var maxScroll = Math.max(1, docHeight - viewportHeight);

    // Les onglets de catégories sont-ils réellement visibles et disponibles (page d'accueil, écran assez large) ?
    var tabsVisible = !!(tabsRight && navTabs.length >= 2 && tabsRight.offsetWidth > 0 && getComputedStyle(tabsRight).display !== "none");

    if (!tabsVisible){
      // Pas d'onglets de catégories sur cette page, ou écran trop étroit : simple barre de scroll (0 à 100%)
      var pct = Math.min(1, Math.max(0, scrollTop / maxScroll));
      indicator.style.width = (pct * wrapRect.width) + "px";
      indicator.style.transform = "translateX(0)";
      return;
    }

    // Centre horizontal (en px, relatif au conteneur d'onglets) de chaque onglet
    var centers = navTabs.map(function(tab){
      var r = tab.getBoundingClientRect();
      return (r.left - wrapRect.left + tabsWrap.scrollLeft) + r.width / 2;
    });

    // Position de départ (en scroll Y, absolue dans le document) de chaque section,
    // calculée via getBoundingClientRect — la même méthode que la détection d'onglet actif,
    // pour garantir que la barre et la couleur active pointent toujours sur la même section.
    var OFFSET = 140; // même seuil que la détection de section active
    var boundaries = navSections.map(function(sec){
      if (!sec) return null;
      if (sec === document.body) return 0;
      return scrollTop + sec.getBoundingClientRect().top;
    });

    var idx = 0;
    for (var i = 0; i < boundaries.length; i++){
      if (boundaries[i] !== null && (scrollTop + OFFSET) >= boundaries[i]) idx = i;
    }

    var isLast = idx === boundaries.length - 1;
    var startY = boundaries[idx] || 0;
    var endY = !isLast && boundaries[idx + 1] !== null ? boundaries[idx + 1] : maxScroll;
    var frac = endY > startY ? Math.min(1, Math.max(0, ((scrollTop + OFFSET) - startY) / (endY - startY))) : 1;

    var startX = centers[idx];
    // Sur le dernier segment, la barre va jusqu'au bord droit du conteneur d'onglets
    var endX = !isLast ? centers[idx + 1] : wrapRect.width;
    var width = startX + (endX - startX) * frac;

    indicator.style.width = Math.max(2, width) + "px";
    indicator.style.transform = "translateX(0)";
  }

  function updateActiveTab(){
    if (!navSections.length) return;
    var current = 0;
    for (var i = 0; i < navSections.length; i++){
      var sec = navSections[i];
      if (!sec) continue;
      var rect = sec.getBoundingClientRect();
      if (rect.top <= 140) current = i;
    }
    if (current !== activeTabIndex){
      navTabs[activeTabIndex] && navTabs[activeTabIndex].classList.remove("is-active");
      activeTabIndex = current;
      navTabs[activeTabIndex].classList.add("is-active");
    }
  }

  /* ---------------- Menu déroulant du site ---------------- */
  function initSiteMenu(){
    var trigger = document.getElementById("menu-trigger");
    var panel = document.getElementById("menu-panel");
    if (!trigger || !panel) return;
    function close(){
      panel.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    }
    trigger.addEventListener("click", function(e){
      e.stopPropagation();
      var open = panel.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function(e){
      if (!panel.contains(e.target) && e.target !== trigger) close();
    });
    document.addEventListener("keydown", function(e){
      if (e.key === "Escape") close();
    });

    // Accordéon "Accueil" : > devient v pour révéler les sous-catégories, et inversement
    var accueilGroup = document.getElementById("menu-accueil-group");
    var accueilToggle = document.getElementById("menu-accueil-toggle");
    if (accueilGroup && accueilToggle){
      accueilToggle.addEventListener("click", function(e){
        e.stopPropagation();
        var isOpen = accueilGroup.classList.toggle("is-open");
        accueilToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }
  }

  /* ---------------- Fenêtre modale : services compatibles ---------------- */
  var POPUP_DATA = {
    drives: {
      title: "Tous les drives compatibles",
      hasStorage: true,
      rows: [
        { name: "Google Drive", comment: "Offre généreuse sans limite de téléchargement, avec un débit moyen élevé.", storage: "15 Go" },
        { name: "MEGA", comment: "20 Go offerts avec chiffrement de bout en bout, pour une bande passante gratuite plus limitée.", storage: "20 Go" },
        { name: "OneDrive", comment: "Bien intégré à Windows et Office, mais l'offre gratuite reste la plus modeste du marché.", storage: "5 Go" },
        { name: "Dropbox", comment: "Synchronisation rapide et fiable, mais l'offre gratuite se limite à 2 Go.", storage: "2 Go" },
        { name: "Box", comment: "Fiable pour les documents professionnels, avec une limite de 250 Mo par fichier sur l'offre gratuite.", storage: "10 Go" },
        { name: "Yandex Disk", comment: "Simple et rapide à configurer, avec un espace gratuit extensible via les offres Yandex 360.", storage: "5 Go" }
      ]
    },
    links: {
      title: "Liens de partage compatibles",
      hasStorage: true,
      rows: [
        { name: "MEGA", comment: "Le seul service pris en charge pour l'instant, sans compte requis.", storage: "20 Go" }
      ]
    },
    nas: {
      title: "Serveurs NAS compatibles",
      hasStorage: false,
      rows: [
        { name: "Jellyfin", comment: "Entièrement gratuit et open-source, sans compte ni abonnement requis." },
        { name: "Emby", comment: "Interface soignée et apps natives sur presque toutes les plateformes." },
        { name: "Plex", comment: "Le plus populaire des trois, très simple à configurer." }
      ]
    },
    network: {
      title: "Protocoles réseau compatibles",
      hasStorage: false,
      rows: [
        { name: "WebDAV", comment: "Standard ouvert, largement supporté, avec authentification et chiffrement HTTPS." },
        { name: "FTP", comment: "Simple et universel, mais non chiffré par défaut." },
        { name: "NFS", comment: "Rapide en réseau local, très utilisé sous Linux." }
      ]
    }
  };

  function openModal(key){
    var data = POPUP_DATA[key];
    if (!data) return;
    var overlay = document.getElementById("modal-overlay");
    var titleEl = document.getElementById("modal-title");
    var body = document.getElementById("modal-body");
    if (!overlay || !body) return;
    titleEl.textContent = data.title;
    body.innerHTML = data.rows.map(function(r){
      var rowClass = data.hasStorage ? "modal-row" : "modal-row no-storage";
      var storageHtml = data.hasStorage ? '<div class="modal-storage">' + r.storage + '</div>' : "";
      return (
        '<div class="' + rowClass + '">' +
          '<div class="modal-service">' +
            '<div class="modal-service-name">' + r.name + '</div>' +
          '</div>' +
          '<div class="modal-rating">' +
            '<div class="modal-comment">' + r.comment + '</div>' +
          '</div>' +
          storageHtml +
        '</div>'
      );
    }).join("");
    overlay.classList.add("is-open");
  }

  function closeModal(){
    var overlay = document.getElementById("modal-overlay");
    if (overlay) overlay.classList.remove("is-open");
  }

  function initModals(){
    document.querySelectorAll("[data-modal]").forEach(function(btn){
      btn.addEventListener("click", function(){ openModal(btn.getAttribute("data-modal")); });
    });
    var overlay = document.getElementById("modal-overlay");
    var closeBtn = document.getElementById("modal-close");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (overlay) overlay.addEventListener("click", function(e){
      if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", function(e){
      if (e.key === "Escape") closeModal();
    });
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
    initNavTabs();
    initSiteMenu();
    initModals();
    initReveal();
    setLanguage(detectLang());
    navTabs[0] && navTabs[0].classList.add("is-active");
    document.addEventListener('scroll', function(){
      updateScrollProgress();
      updateActiveTab();
    }, { passive: true });
    window.addEventListener('resize', updateScrollProgress);
    window.addEventListener('load', updateScrollProgress);
    updateScrollProgress();
    updateActiveTab();
  });
})();
