const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const toast = document.querySelector('.toast');
const notifyForm = document.querySelector('#notify-form');
const segmentedPlayer = document.querySelector('[data-segmented-player]');

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

if (segmentedPlayer) {
  const audio = segmentedPlayer.querySelector('audio');
  const playerUI = segmentedPlayer.querySelector('.audio-player');
  const toggle = segmentedPlayer.querySelector('.player-toggle');
  const state = segmentedPlayer.querySelector('.player-state');
  const progress = segmentedPlayer.querySelector('.player-progress');
  const currentTime = segmentedPlayer.querySelector('[data-current-time]');
  const volume = segmentedPlayer.querySelector('#score-volume');
  const sources = JSON.parse(segmentedPlayer.dataset.sources);
  const segmentDurations = [42, 42, 42, 42, 42, 42, 29.784];
  const offsets = segmentDurations.map((_, index) =>
    segmentDurations.slice(0, index).reduce((sum, duration) => sum + duration, 0)
  );
  const totalDuration = Number(segmentedPlayer.dataset.duration);
  let segmentIndex = 0;
  let seeking = false;

  const formatTime = (seconds) => {
    const safe = Math.max(0, Math.min(totalDuration, Number(seconds) || 0));
    const minutes = Math.floor(safe / 60);
    return `${String(minutes).padStart(2, '0')}:${String(Math.floor(safe % 60)).padStart(2, '0')}`;
  };

  const globalTime = () => offsets[segmentIndex] + (audio.currentTime || 0);

  const paintProgress = (seconds) => {
    const percent = Math.min(100, Math.max(0, seconds / totalDuration * 100));
    progress.style.setProperty('--progress', `${percent}%`);
    currentTime.textContent = formatTime(seconds);
    if (!seeking) progress.value = String(seconds);
  };

  const loadSegment = (index, localTime = 0, shouldPlay = false) => {
    segmentIndex = Math.max(0, Math.min(sources.length - 1, index));
    audio.src = sources[segmentIndex];
    audio.load();
    audio.addEventListener('loadedmetadata', () => {
      audio.currentTime = Math.min(localTime, Math.max(0, audio.duration - .05));
      if (shouldPlay) audio.play().catch(() => {
        playerUI.classList.remove('is-playing');
        state.textContent = 'PLAY';
      });
    }, { once: true });
  };

  toggle.addEventListener('click', () => {
    if (audio.paused) {
      if (globalTime() >= totalDuration - .1) loadSegment(0, 0, true);
      else audio.play();
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('play', () => {
    playerUI.classList.add('is-playing');
    state.textContent = 'PLAYING';
    toggle.setAttribute('aria-label', 'Pause Ordo Draconis');
  });

  audio.addEventListener('pause', () => {
    playerUI.classList.remove('is-playing');
    state.textContent = 'PLAY';
    toggle.setAttribute('aria-label', 'Play Ordo Draconis');
  });

  audio.addEventListener('timeupdate', () => {
    if (!seeking) paintProgress(globalTime());
  });

  audio.addEventListener('ended', () => {
    if (segmentIndex < sources.length - 1) {
      loadSegment(segmentIndex + 1, 0, true);
    } else {
      segmentIndex = sources.length - 1;
      paintProgress(totalDuration);
      state.textContent = 'REPLAY';
    }
  });

  progress.addEventListener('input', () => {
    seeking = true;
    paintProgress(Number(progress.value));
  });

  progress.addEventListener('change', () => {
    const target = Number(progress.value);
    const nextIndex = Math.min(
      segmentDurations.length - 1,
      offsets.findIndex((offset, index) => target < offset + segmentDurations[index])
    );
    const resolvedIndex = nextIndex < 0 ? segmentDurations.length - 1 : nextIndex;
    const wasPlaying = !audio.paused;
    loadSegment(resolvedIndex, target - offsets[resolvedIndex], wasPlaying);
    seeking = false;
    paintProgress(target);
  });

  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value);
    volume.style.setProperty('--progress', `${Number(volume.value) * 100}%`);
  });

  audio.volume = Number(volume.value);
  paintProgress(0);
}

notifyForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = new FormData(notifyForm).get('email');
  if (!email) return;
  showToast('No address was stored. Mailing-list delivery will be activated with the first release.');
  notifyForm.reset();
});
