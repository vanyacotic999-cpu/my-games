// ============================================
// ТРЕКЕР ВРЕМЕНИ НА САЙТЕ (с аккаунтами)
// ============================================

(function() {
  const KEYS = {
    totalTime: 'site_total_time',
    firstVisit: 'site_first_visit',
    visits: 'site_visits'
  };

  // Используем Accounts если он есть, иначе localStorage напрямую
  const store = {
    get: (key) => {
      if (window.Accounts) return Accounts.get(key);
      return localStorage.getItem(key);
    },
    set: (key, val) => {
      if (window.Accounts) Accounts.set(key, val);
      else localStorage.setItem(key, val);
    },
    remove: (key) => {
      if (window.Accounts) Accounts.removeKey(key);
      else localStorage.removeItem(key);
    }
  };

  // === ПРОВЕРКА НОВОЙ СЕССИИ ===
  let sessionId = sessionStorage.getItem('site_session_id');
  const isNewSession = !sessionId;

  if (isNewSession) {
    sessionId = Date.now().toString();
    sessionStorage.setItem('site_session_id', sessionId);

    const visits = +(store.get(KEYS.visits) || 0);
    store.set(KEYS.visits, visits + 1);

    if (!store.get(KEYS.firstVisit)) {
      store.set(KEYS.firstVisit, new Date().toISOString());
    }
  }

  // === СЧЁТЧИК СЕССИИ ===
  let sessionSeconds = +(sessionStorage.getItem('site_session_seconds')) || 0;

  function tick() {
    sessionSeconds++;
    sessionStorage.setItem('site_session_seconds', sessionSeconds);
    updateWidget();
  }

  setInterval(tick, 1000);

  // === СОХРАНЕНИЕ ===
  let lastSaved = 0;

  function saveTotalTime() {
    const delta = sessionSeconds - lastSaved;
    if (delta <= 0) return;
    const total = +(store.get(KEYS.totalTime) || 0);
    store.set(KEYS.totalTime, total + delta);
    lastSaved = sessionSeconds;
  }

  setInterval(saveTotalTime, 10000);
  window.addEventListener('beforeunload', saveTotalTime);
  window.addEventListener('pagehide', saveTotalTime);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) saveTotalTime();
  });

  // === ФОРМАТ ВРЕМЕНИ ===
  function formatTime(seconds) {
    if (seconds < 60) return seconds + ' сек';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return h + ' ч ' + m + ' мин';
    if (m > 0) return m + ' мин ' + s + ' сек';
    return s + ' сек';
  }

  function getTotalSeconds() {
    return +(store.get(KEYS.totalTime) || 0) + sessionSeconds;
  }

  function updateWidget() {
    const widget = document.getElementById('timeWidget');
    if (!widget) return;
    widget.innerHTML =
      '⏱ <span style="color:#a6e3a1">' + formatTime(sessionSeconds) + '</span>' +
      ' <span style="color:#555">•</span> ' +
      '<span style="color:#89b4fa">всего: ' + formatTime(getTotalSeconds()) + '</span>';
  }

  // === ЭКСПОРТ ===
  window.SiteTracker = {
    getSessionSeconds: () => sessionSeconds,
    getTotalSeconds: getTotalSeconds,
    getVisits: () => +(store.get(KEYS.visits) || 0),
    getFirstVisit: () => store.get(KEYS.firstVisit),
    formatTime: formatTime,
    reset: () => {
      store.remove(KEYS.totalTime);
      store.remove(KEYS.firstVisit);
      store.remove(KEYS.visits);
      sessionStorage.removeItem('site_session_seconds');
      sessionSeconds = 0;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateWidget);
  } else {
    updateWidget();
  }

  setInterval(updateWidget, 1000);
})();