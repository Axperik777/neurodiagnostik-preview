document.documentElement.classList.add('js');

const body = document.body;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const header = document.querySelector('.site-header');

window.dataLayer = window.dataLayer || [];

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
