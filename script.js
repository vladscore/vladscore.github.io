const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const toast = document.querySelector('.toast');
const notifyForm = document.querySelector('#notify-form');

const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('visible'), 3200);
};

const syncHeader = () => {
  header.classList.toggle('scrolled', window.scrollY > 24);
};

syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

menuToggle?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('[data-coming-soon]').forEach((button) => {
  button.addEventListener('click', () => {
    showToast('The first recording is being prepared. Release details will appear here.');
  });
});

notifyForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = new FormData(notifyForm).get('email');
  if (!email) return;
  showToast('No address was stored. Mailing-list delivery will be activated with the first release.');
  notifyForm.reset();
});
