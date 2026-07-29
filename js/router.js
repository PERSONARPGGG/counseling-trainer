const routes = {
  'dashboard': null, 'session': null, 'analysis': null, 'settings': null
};
let currentRoute = '';
let historyStack = [];
const MAX_HISTORY = 20;

export function registerRoute(name, renderFn) {
  routes[name] = renderFn;
}

export function navigateTo(route, params = {}) {
  const hash = '#' + route + (params.id ? '?id=' + encodeURIComponent(params.id) : '');
  if (historyStack.length >= MAX_HISTORY) historyStack.shift();
  historyStack.push({ route: currentRoute, hash: window.location.hash });
  window.location.hash = hash;
}

export function navigateBack() {
  if (historyStack.length) {
    const prev = historyStack.pop();
    window.location.hash = prev.hash;
  }
}

export function getParams() {
  const p = {};
  const idx = window.location.hash.indexOf('?');
  if (idx > -1) {
    const qs = window.location.hash.slice(idx + 1);
    qs.split('&').forEach(pair => {
      const [k, v] = pair.split('=');
      if (k) p[k] = decodeURIComponent(v || '');
    });
  }
  return p;
}

export function initRouter(container, onRouteChange) {
  function handleHash() {
    let hash = window.location.hash.replace('#', '') || 'dashboard';
    hash = hash.split('?')[0];
    if (!routes[hash]) { hash = 'dashboard'; window.location.hash = '#dashboard'; }
    if (currentRoute === hash) return;
    currentRoute = hash;
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.route === hash);
    });
    container.innerHTML = '';
    if (routes[hash]) routes[hash](container);
    if (onRouteChange) onRouteChange(hash);
  }
  window.addEventListener('hashchange', handleHash);
  handleHash();
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.route));
  });
}
