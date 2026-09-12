(() => {
  'use strict';

  const key = 'cartoonmax-ad-consent-v1';
  const client = document.querySelector('meta[name="google-adsense-account"]')?.content;
  const allowedHost = location.hostname === 'cartoon-max.netlify.app';
  const settings = document.getElementById('adPrivacySettings');
  let loaded = false;
  let panel;
  let previousFocus;

  if (!allowedHost || !/^ca-pub-\d{16}$/.test(client || '')) return;

  function childProfile() {
    try {
      return typeof prof !== 'function' || prof()?.kid !== false;
    } catch {
      return true;
    }
  }

  function preference() {
    try {
      const stored = JSON.parse(localStorage.getItem(key));
      if (stored?.version !== 1 || !['allow', 'deny'].includes(stored.choice)) return null;
      if (!Number.isFinite(stored.time) || Date.now() - stored.time > 180 * 86400000) return null;
      return stored.choice;
    } catch {
      return null;
    }
  }

  function loadAds() {
    if (loaded || childProfile()) return;
    loaded = true;
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.requestNonPersonalizedAds = 1;
    const script = document.createElement('script');
    script.id = 'cartoonmax-adsense';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + client;
    document.head.appendChild(script);
  }

  function closePanel() {
    if (panel) panel.hidden = true;
    if (previousFocus?.isConnected) previousFocus.focus();
  }

  function choose(choice) {
    try {
      localStorage.setItem(key, JSON.stringify({ version: 1, choice, time: Date.now() }));
    } catch {
      if (choice === 'deny' && loaded) {
        window.adsbygoogle.pauseAdRequests = 1;
        location.reload();
        return;
      }
    }
    closePanel();
    if (choice === 'allow') loadAds();
    else if (loaded) {
      window.adsbygoogle.pauseAdRequests = 1;
      location.reload();
    }
  }

  function showPanel(focus = false) {
    if (childProfile()) return;
    if (!panel) {
      panel = document.createElement('section');
      panel.className = 'ad-consent';
      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-labelledby', 'adConsentTitle');
      panel.innerHTML = '<div><h2 id="adConsentTitle">Reklam tercihin</h2><p>İzin verirsen Google AdSense çerez ve benzeri teknolojiler kullanabilir; IP adresi ve tarayıcı bilgisi gibi teknik verileri işleyebilir. Sitemiz kişiselleştirilmemiş reklam ister. Reddedersen siteyi reklamsız kullanabilirsin. <a href="privacy.html">Gizlilik ve çerezler</a></p></div><div class="ad-consent-actions"><button type="button" data-ad-choice="deny">Reddet</button><button type="button" data-ad-choice="allow">İzin ver</button></div>';
      panel.querySelectorAll('[data-ad-choice]').forEach(button => {
        button.addEventListener('click', () => choose(button.dataset.adChoice));
      });
      document.body.appendChild(panel);
    }
    panel.hidden = false;
    if (focus) {
      previousFocus = document.activeElement;
      panel.querySelector('button').focus();
    }
  }

  function syncProfile() {
    const child = childProfile();
    if (settings) settings.hidden = child;
    if (child) {
      closePanel();
      if (loaded) {
        window.adsbygoogle.pauseAdRequests = 1;
        location.reload();
      }
      return;
    }
    const choice = preference();
    if (choice === 'allow') {
      closePanel();
      loadAds();
    } else if (choice === 'deny') {
      closePanel();
      if (loaded) {
        window.adsbygoogle.pauseAdRequests = 1;
        location.reload();
      }
    } else if (loaded) {
      window.adsbygoogle.pauseAdRequests = 1;
      location.reload();
    } else showPanel();
  }

  if (settings) settings.addEventListener('click', () => showPanel(true));
  window.addEventListener('cartoonmax:profile-change', syncProfile);
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) syncProfile();
    if (event.key === 'cartoonmax3') {
      try {
        const incoming = JSON.parse(event.newValue);
        const next = incoming?.profiles?.[incoming.profile];
        if (next?.kid !== prof()?.kid) location.reload();
      } catch {
        if (loaded) {
          window.adsbygoogle.pauseAdRequests = 1;
          location.reload();
        }
      }
    }
  });
  syncProfile();
})();
