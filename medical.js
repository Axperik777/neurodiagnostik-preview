document.documentElement.classList.add('js');

const body = document.body;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const header = document.querySelector('.site-header');

window.dataLayer = window.dataLayer || [];

const META_PIXEL_ID = '1198298872491119';
const CONSENT_STORAGE_KEY = 'neurodiagnostik:marketing-consent:v1';
const ATTRIBUTION_STORAGE_KEY = 'neurodiagnostik:attribution:v1';
const ATTRIBUTION_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];

function readStorage(key) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key, value) {
  try { window.localStorage.setItem(key, value); } catch { /* Storage can be blocked. */ }
}

function captureAttribution() {
  const parameters = new URLSearchParams(window.location.search);
  const current = Object.fromEntries(ATTRIBUTION_KEYS
    .filter((key) => parameters.has(key))
    .map((key) => [key, parameters.get(key)]));

  let previous = {};
  try { previous = JSON.parse(readStorage(ATTRIBUTION_STORAGE_KEY) || '{}'); } catch { previous = {}; }
  const attribution = { ...previous, ...current };

  if (Object.keys(current).length) writeStorage(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
  return attribution;
}

const attribution = captureAttribution();
window.NDAttribution = { ...attribution };

function loadMetaPixel() {
  if (window.__ndMetaPixelInitialized) return;

  if (!window.fbq) {
    const fbq = function () {
      fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
    };
    window.fbq = fbq;
    window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  window.fbq('consent', 'grant');
  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
  window.__ndMetaPixelInitialized = true;
  window.dataLayer.push({ event: 'meta_pixel_ready', page_path: window.location.pathname });
}

function trackMeta(eventName, parameters = {}) {
  if (!window.__ndMetaPixelInitialized || typeof window.fbq !== 'function') return;
  window.fbq('track', eventName, parameters);
}

function setMarketingConsent(value) {
  writeStorage(CONSENT_STORAGE_KEY, value);
  window.dataLayer.push({ event: 'marketing_consent_update', consent: value });
  if (value === 'granted') loadMetaPixel();
  if (value === 'denied' && typeof window.fbq === 'function') window.fbq('consent', 'revoke');
}

function showConsentBanner() {
  document.querySelector('.cookie-consent')?.remove();

  const banner = document.createElement('section');
  banner.className = 'cookie-consent';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-modal', 'false');
  banner.setAttribute('aria-labelledby', 'cookie-consent-title');
  banner.innerHTML = `
    <div class="cookie-consent-copy">
      <strong id="cookie-consent-title">Настройки конфиденциальности</strong>
      <p>С вашего согласия мы используем Meta Pixel для измерения рекламы и переходов к способам связи. Медицинские сведения, имя и телефон в Meta не передаются. <a href="terms.html#privacy">Подробнее</a></p>
    </div>
    <div class="cookie-consent-actions">
      <button class="cookie-button cookie-button-secondary" type="button" data-cookie-deny>Только необходимые</button>
      <button class="cookie-button cookie-button-primary" type="button" data-cookie-accept>Разрешить аналитику</button>
    </div>`;

  banner.querySelector('[data-cookie-deny]').addEventListener('click', () => {
    setMarketingConsent('denied');
    banner.remove();
  });
  banner.querySelector('[data-cookie-accept]').addEventListener('click', () => {
    setMarketingConsent('granted');
    banner.remove();
  });
  document.body.appendChild(banner);
}

const storedConsent = readStorage(CONSENT_STORAGE_KEY);
if (storedConsent === 'granted') loadMetaPixel();
if (!storedConsent) showConsentBanner();

document.querySelectorAll('[data-cookie-settings]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    showConsentBanner();
  });
});

window.NDTracking = {
  getAttribution: () => ({ ...window.NDAttribution }),
  trackLead: (parameters = {}) => trackMeta('Lead', parameters)
};

function track(event, data = {}) {
  window.dataLayer.push({ event, page_path: window.location.pathname, ...data });
}

function closeMenu() {
  body.classList.remove('menu-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  mobileMenu?.setAttribute('aria-hidden', 'true');
}

menuButton?.addEventListener('click', () => {
  const willOpen = !body.classList.contains('menu-open');
  body.classList.toggle('menu-open', willOpen);
  menuButton.setAttribute('aria-expanded', String(willOpen));
  mobileMenu?.setAttribute('aria-hidden', String(!willOpen));
});

mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });

function updateHeader() {
  header?.classList.toggle('is-scrolled', window.scrollY > 48);
}

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const heroVisual = document.querySelector('.hero-visual');

if (!reduceMotion && heroVisual && window.matchMedia('(pointer: fine)').matches) {
  let motionFrame = 0;

  heroVisual.addEventListener('pointermove', (event) => {
    const bounds = heroVisual.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 8;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 8;

    cancelAnimationFrame(motionFrame);
    motionFrame = requestAnimationFrame(() => {
      heroVisual.style.setProperty('--photo-x', `${x.toFixed(2)}px`);
      heroVisual.style.setProperty('--photo-y', `${y.toFixed(2)}px`);
    });
  });

  heroVisual.addEventListener('pointerleave', () => {
    cancelAnimationFrame(motionFrame);
    motionFrame = requestAnimationFrame(() => {
      heroVisual.style.setProperty('--photo-x', '0px');
      heroVisual.style.setProperty('--photo-y', '0px');
    });
  });
}

const revealGroups = document.querySelectorAll('.reveal-group');

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealGroups.forEach((group) => group.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' });

  revealGroups.forEach((group) => observer.observe(group));
}

document.querySelectorAll('[data-cta-location]').forEach((link) => {
  link.addEventListener('click', () => track('information_navigation', {
    location: link.dataset.ctaLocation,
    destination: link.getAttribute('href')
  }));
});

document.querySelectorAll('a[href^="tel:"], a[href*="wa.me/"]').forEach((link) => {
  link.addEventListener('click', () => {
    const channel = link.href.startsWith('tel:') ? 'phone' : 'whatsapp';
    track('contact_click', { channel });
    trackMeta('Contact', {
      content_name: channel,
      content_category: 'website_contact'
    });
  });
});

document.querySelectorAll('.accordion details').forEach((details) => {
  details.addEventListener('toggle', () => {
    if (!details.open) return;
    track('faq_open', { question: details.querySelector('summary')?.innerText.replace('+', '').trim() });
  });
});

let trackedHalf = false;
window.addEventListener('scroll', () => {
  if (trackedHalf) return;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollable > 0 && window.scrollY / scrollable >= 0.5) {
    trackedHalf = true;
    track('scroll_depth', { percent: 50 });
  }
}, { passive: true });
