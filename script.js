const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const toast = document.querySelector('.toast');
const notifyForm = document.querySelector('#notify-form');
const segmentedPlayer = document.querySelector('[data-segmented-player]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  const visualizer = segmentedPlayer.querySelector('.audio-visualizer');
  const sources = JSON.parse(segmentedPlayer.dataset.sources);
  const totalDuration = Number(segmentedPlayer.dataset.duration);
  let trackUrl = '';
  let loadingPromise = null;
  let seeking = false;
  let audioContext = null;
  let analyser = null;
  let frequencyData = null;
  let visualizerFrame = 0;

  const sizeVisualizer = () => {
    if (!visualizer) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const bounds = visualizer.getBoundingClientRect();
    visualizer.width = Math.max(1, Math.round(bounds.width * ratio));
    visualizer.height = Math.max(1, Math.round(bounds.height * ratio));
    const context = visualizer.getContext('2d');
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const renderVisualizer = () => {
    if (!visualizer) return;
    const context = visualizer.getContext('2d');
    const width = visualizer.clientWidth;
    const height = visualizer.clientHeight;
    if (!context || !width || !height) return;

    context.clearRect(0, 0, width, height);
    const barCount = Math.max(28, Math.min(64, Math.floor(width / 7)));
    const gap = 2;
    const barWidth = Math.max(1, (width - gap * (barCount - 1)) / barCount);
    const active = analyser && !audio.paused;

    if (active) analyser.getByteFrequencyData(frequencyData);

    for (let index = 0; index < barCount; index += 1) {
      const bin = Math.floor(index / barCount * (frequencyData?.length || barCount));
      const energy = active
        ? Math.pow((frequencyData[bin] || 0) / 255, .78)
        : .08 + Math.sin(index * .73) ** 2 * .08;
      const barHeight = Math.max(2, energy * (height - 5));
      const red = 189 + Math.round(38 * energy);
      const green = 51 + Math.round(22 * energy);
      const blue = 45 + Math.round(18 * energy);
      context.fillStyle = active
        ? `rgba(${red}, ${green}, ${blue}, ${.48 + energy * .52})`
        : 'rgba(239, 229, 210, .22)';
      context.fillRect(
        index * (barWidth + gap),
        (height - barHeight) / 2,
        barWidth,
        barHeight
      );
    }

    if (active) visualizerFrame = window.requestAnimationFrame(renderVisualizer);
  };

  const initAudioGraph = () => {
    if (audioContext || !window.AudioContext && !window.webkitAudioContext) return audioContext;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContextClass();
      const sourceNode = audioContext.createMediaElementSource(audio);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = .82;
      frequencyData = new Uint8Array(analyser.frequencyBinCount);
      sourceNode.connect(analyser);
      analyser.connect(audioContext.destination);
    } catch (error) {
      console.warn('Audio visualizer unavailable:', error);
      audioContext = null;
      analyser = null;
    }
    return audioContext;
  };

  const startVisualizer = () => {
    window.cancelAnimationFrame(visualizerFrame);
    visualizerFrame = window.requestAnimationFrame(renderVisualizer);
  };

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
      const graph = initAudioGraph();
      graph?.resume().catch(() => {});
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
    startVisualizer();
    state.textContent = 'PLAYING';
    toggle.setAttribute('aria-label', 'Pause Ordo Draconis');
  });

  audio.addEventListener('pause', () => {
    playerUI.classList.remove('is-playing');
    window.cancelAnimationFrame(visualizerFrame);
    renderVisualizer();
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
    window.cancelAnimationFrame(visualizerFrame);
    if (audioContext) audioContext.close();
    if (trackUrl) URL.revokeObjectURL(trackUrl);
  });

  window.addEventListener('resize', () => {
    sizeVisualizer();
    if (audio.paused) renderVisualizer();
  }, { passive: true });

  audio.volume = Number(volume.value);
  paintProgress(0);
  sizeVisualizer();
  renderVisualizer();
}

notifyForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = new FormData(notifyForm).get('email');
  if (!email) return;
  showToast('No address was stored. Mailing-list delivery will be activated with the first release.');
  notifyForm.reset();
});


if (!prefersReducedMotion) {
  document.body.classList.add('motion-enabled');

  const revealTargets = document.querySelectorAll(
    '.section-heading, .collection-heading, .tracklist li, .release-panel, .book-object, .novel-copy, .war-grid article, .release-section > *'
  );
  revealTargets.forEach((element) => element.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });

  revealTargets.forEach((element) => revealObserver.observe(element));

  const hero = document.querySelector('.hero');
  let pointerFrame = 0;
  hero?.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    window.cancelAnimationFrame(pointerFrame);
    pointerFrame = window.requestAnimationFrame(() => {
      const bounds = hero.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      hero.style.setProperty('--motion-x', `${x * 16}px`);
      hero.style.setProperty('--motion-y', `${y * 10}px`);
    });
  });
  hero?.addEventListener('pointerleave', () => {
    hero.style.setProperty('--motion-x', '0px');
    hero.style.setProperty('--motion-y', '0px');
  });

  let scrollFrame = 0;
  window.addEventListener('scroll', () => {
    if (!hero || scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      const progress = Math.min(1, window.scrollY / Math.max(1, hero.offsetHeight));
      hero.style.setProperty('--scroll-shift', `${progress * 28}px`);
      scrollFrame = 0;
    });
  }, { passive: true });
}
