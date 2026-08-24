(() => {
  const world = document.querySelector('[data-living-world]');
  if (!world || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const reading = () => document.body.classList.contains('reading-mode');
  const whisper = world.querySelector('[data-threshold-whisper]');
  const raven = world.querySelector('.raven-shadow');
  const embers = world.querySelector('.ember-field');
  const dragon = world.querySelector('.dragon-pulse');
  const artwork = document.querySelector('.artwork-switch');
  const wordmark = document.querySelector('.wordmark');
  const lines = [
    'Someone has altered the number.',
    'The witness remembers a different face.',
    'Ink reaches the city before the rider.',
    'Not every letter bears the hand that signed it.',
    'The monster is printed one sheet at a time.'
  ];
  const shown = new Set();
  let markClicks = 0;
  let markTimer = 0;

  const wake = (element, duration) => {
    if (!element || reading()) return;
    element.classList.add('is-awake');
    window.setTimeout(() => element.classList.remove('is-awake'), duration);
  };

  const speak = (index) => {
    if (!whisper || shown.has(index) || reading()) return;
    shown.add(index);
    whisper.textContent = lines[index % lines.length];
    wake(whisper, 4200);
  };

  artwork?.addEventListener('click', () => {
    const revealed = artwork.getAttribute('aria-pressed') !== 'true';
    artwork.setAttribute('aria-pressed', String(revealed));
    wake(embers, 5200);
    if (revealed) speak(4);
  });

  wordmark?.addEventListener('click', (event) => {
    if (event.target.closest('.dragon-mark')) {
      markClicks += 1;
      window.clearTimeout(markTimer);
      markTimer = window.setTimeout(() => { markClicks = 0; }, 1800);
      if (markClicks >= 3) {
        event.preventDefault();
        markClicks = 0;
        wake(dragon, 3800);
        speak(3);
      }
    }
  });

  let scrollFrame = 0;
  window.addEventListener('scroll', () => {
    if (scrollFrame || reading()) return;
    scrollFrame = requestAnimationFrame(() => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const depth = window.scrollY / max;
      [0.18,0.39,0.61,0.82].forEach((point,index) => {
        if (Math.abs(depth - point) < .018) speak(index);
      });
      scrollFrame = 0;
    });
  }, { passive:true });

  window.setTimeout(() => {
    if (!reading()) raven?.classList.add('crossing');
  }, 2600);
  window.setTimeout(() => wake(embers, 4500), 7200);
  window.setInterval(() => {
    if (reading() || document.hidden || !raven) return;
    raven.classList.remove('crossing');
    void raven.offsetWidth;
    raven.classList.add('crossing');
  }, 28000);
})();

import('./score-library-v3.js?v=1')
  .then(() => import('./score-wave-ordo.js?v=1'))
  .catch((error) => {
    console.error('Score library could not be loaded:', error);
  });