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
  const totalDuration = Number(segmentedPlayer.dataset.duration);
  let trackUrl = '';
  let loadingPromise = null;
  let seeking = false;

  const formatTime = (seconds) => {
    const safe = Math.max(0, Math.min(totalDuration, Number(seconds) || 0));
    const minutes = Math.floor(safe / 60);
    return `${String(minutes).padStart(2, '0')}:${String(Math.floor(safe % 60)).padStart(2, '0')}`;
  };

  const paintProgress = (seconds) => {
    const percent = Math.min(100, Math.max(0, seconds / totalDuration * 100));
    progress.style.setProperty('--progress', `${percent}%`);
    currentTime.textContent = formatTime(seconds);
    if (!seeking) progress.value = String(seconds);
  };

  const ensureTrack = () => {
    if (trackUrl) return Promise.resolve();

    if (!loadingPromise) {
      toggle.disabled = true;
      state.textContent = 'LOADING';

      loadingPromise = Promise.all(sources.map(async (source) => {
        const response = await fetch(source);
        if (!response.ok) throw new Error(`Audio chunk failed: ${response.status}`);
        return response.arrayBuffer();
      }))
        .then((chunks) => {
          trackUrl = URL.createObjectURL(new Blob(chunks, { type: 'audio/mpeg' }));
          audio.src = trackUrl;
          audio.load();
          return new Promise((resolve, reject) => {
            audio.addEventListener('canplay', resolve, { once: true });
            audio.addEventListener('error', reject, { once: true });
          });
        })
        .then(() => {
          toggle.disabled = false;
          state.textContent = 'PLAY';
        })
        .catch((error) => {
          console.error(error);
          toggle.disabled = false;
          state.textContent = 'ERROR';
          showToast('The recording could not be loaded. Please try again.');
          loadingPromise = null;
          throw error;
        });
    }

    return loadingPromise;
  };

  toggle.addEventListener('click', async () => {
    try {
      await ensureTrack();
      if (audio.paused) {
        if (audio.currentTime >= totalDuration - .1) audio.currentTime = 0;
        await audio.play();
      } else {
        audio.pause();
      }
    } catch {
      // The visible player state and toast already report the loading error.
    }
  });

  audio.addEventListener('play', () => {
    playerUI.classList.add('is-playing');
    state.textContent = 'PLAYING';
    toggle.setAttribute('aria-label', 'Pause Ordo Draconis');
  });

  audio.addEventListener('pause', () => {
    playerUI.classList.remove('is-playing');
    if (state.textContent !== 'ERROR') state.textContent = 'PLAY';
    toggle.setAttribute('aria-label', 'Play Ordo Draconis');
  });

  audio.addEventListener('timeupdate', () => {
    if (!seeking) paintProgress(audio.currentTime);
  });

  audio.addEventListener('ended', () => {
    paintProgress(totalDuration);
    state.textContent = 'REPLAY';
  });

  progress.addEventListener('input', () => {
    seeking = true;
    paintProgress(Number(progress.value));
  });

  progress.addEventListener('change', async () => {
    try {
      await ensureTrack();
      audio.currentTime = Number(progress.value);
      seeking = false;
      paintProgress(audio.currentTime);
    } catch {
      seeking = false;
    }
  });

  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value);
    volume.style.setProperty('--progress', `${Number(volume.value) * 100}%`);
  });

  window.addEventListener('beforeunload', () => {
    if (trackUrl) URL.revokeObjectURL(trackUrl);
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
