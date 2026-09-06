const header = document.querySelector('.site-header');
const btn = document.querySelector('.menu-button');
const nav = document.querySelector('.nav-links');

const syncHeader = () => {
  if (header) header.classList.toggle('scrolled', window.scrollY > 8);
};

syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

if (btn && nav) {
  const closeMenu = () => {
    nav.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });

  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('open')) return;
    if (!nav.contains(event.target) && !btn.contains(event.target)) closeMenu();
  });
}

for (const el of document.querySelectorAll('[data-year]')) {
  el.textContent = new Date().getFullYear();
}
