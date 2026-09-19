const header = document.querySelector('.site-header');
const btn = document.querySelector('.menu-button');
const nav = document.querySelector('.nav-links');

document.documentElement.classList.add('js');

const syncHeader = () => {
  if (header) header.classList.toggle('scrolled', window.scrollY > 8);
};

syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

if (btn && nav) {
  const english = document.documentElement.lang === 'en';
  nav.id ||= 'site-navigation';
  btn.setAttribute('aria-controls', nav.id);
  const updateLabel = (open) => btn.setAttribute('aria-label',
    english ? (open ? 'Close menu' : 'Open menu') : (open ? 'Fermer le menu' : 'Ouvrir le menu'));
  const closeMenu = () => {
    nav.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    updateLabel(false);
  };

  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    updateLabel(open);
  });

  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      closeMenu();
      btn.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('open')) return;
    if (!nav.contains(event.target) && !btn.contains(event.target)) closeMenu();
  });

  window.matchMedia('(min-width: 821px)').addEventListener('change', closeMenu);
}

for (const el of document.querySelectorAll('[data-year]')) {
  el.textContent = new Date().getFullYear();
}
