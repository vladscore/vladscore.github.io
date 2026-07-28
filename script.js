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
  const readingMode = segmentedPlayer.querySelector('[data-reading-mode]');
  const readingLabel = segmentedPlayer.querySelector('[data-reading-label]');
  const loopToggle = segmentedPlayer.querySelector('[data-loop]');
  const loopLabel = segmentedPlayer.querySelector('[data-loop-label]');
  const sleepTimer = segmentedPlayer.querySelector('[data-sleep-timer]');
  const sources = JSON.parse(segmentedPlayer.dataset.sources);
  const totalDuration = Number(segmentedPlayer.dataset.duration);
  let trackUrl = '';
  let loadingPromise = null;
  let seeking = false;
  let audioContext = null;
  let analyser = null;
  let frequencyData = null;
  let visualizerFrame = 0;
  let vocalConfidence = 0;
  let sleepStartTimer = 0;
  let sleepFadeTimer = 0;
  let sleepEndAt = 0;
  let resumeApplied = false;
  let lastSavedSecond = -1;

  const storage = {
    read(key, fallback = 0) {
      try {
        const value = Number(window.localStorage.getItem(key));
        return Number.isFinite(value) ? value : fallback;
      } catch {
        return fallback;
      }
    },
    write(key, value) {
      try {
        window.localStorage.setItem(key, String(value));
      } catch {
        // Playback remains functional when storage is unavailable.
      }
    }
  };
  const savedPosition = Math.min(totalDuration - 1, Math.max(0, storage.read('vlad-score-position', 0)));
  const savedVolume = Math.min(1, Math.max(0, storage.read('vlad-score-volume', Number(volume.value))));

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

    if (active && frequencyData?.length && audioContext) {
      const hzPerBin = audioContext.sampleRate / analyser.fftSize;
      const averageBand = (minimum, maximum) => {
        const start = Math.max(1, Math.floor(minimum / hzPerBin));
        const end = Math.min(frequencyData.length - 1, Math.ceil(maximum / hzPerBin));
        let sum = 0;
        for (let bin = start; bin <= end; bin += 1) sum += frequencyData[bin];
        return sum / Math.max(1, end - start + 1);
      };
      const low = averageBand(45, 180);
      const vocal = averageBand(180, 3400);
      const air = averageBand(3400, 7600);
      const likelyVocal = vocal > 42 && vocal > low * .82 && vocal > air * 1.16;
      vocalConfidence = Math.min(1, Math.max(0, vocalConfidence + (likelyVocal ? .055 : -.028)));
      segmentedPlayer.classList.toggle('vocal-active', vocalConfidence > .58);
      const energy = Math.min(1, (low * .3 + vocal * .55 + air * .15) / 150);
      document.documentElement.style.setProperty('--audio-glow-opacity', String(.025 + energy * .16));
      document.documentElement.style.setProperty('--audio-glow-scale', String(energy * .045));
    } else {
      vocalConfidence = Math.max(0, vocalConfidence - .08);
      segmentedPlayer.classList.remove('vocal-active');
      document.documentElement.style.setProperty('--audio-glow-opacity', '.025');
      document.documentElement.style.setProperty('--audio-glow-scale', '0');
    }

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
      analyser.fftSize = 512;
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
          if (!resumeApplied && savedPosition > 8 && savedPosition < totalDuration - 8) {
            audio.currentTime = savedPosition;
            paintProgress(savedPosition);
            state.textContent = 'RESUME';
          } else {
            state.textContent = 'PLAY';
          }
          resumeApplied = true;
          toggle.disabled = false;
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
    document.body.classList.add('is-listening');
    startVisualizer();
    state.textContent = 'PLAYING';
    toggle.setAttribute('aria-label', 'Pause Ordo Draconis');
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
  });

  audio.addEventListener('pause', () => {
    playerUI.classList.remove('is-playing');
    document.body.classList.remove('is-listening');
    segmentedPlayer.classList.remove('vocal-active');
    window.cancelAnimationFrame(visualizerFrame);
    renderVisualizer();
    if (state.textContent !== 'ERROR') state.textContent = audio.currentTime > 8 ? 'RESUME' : 'PLAY';
    toggle.setAttribute('aria-label', 'Play Ordo Draconis');
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
  });

  audio.addEventListener('timeupdate', () => {
    if (!seeking) paintProgress(audio.currentTime);
    const endingFadeSeconds = 8;
    const remaining = totalDuration - audio.currentTime;
    if (!audio.loop && !sleepEndAt && remaining >= 0 && remaining < endingFadeSeconds) {
      const fade = Math.sqrt(Math.max(0, remaining / endingFadeSeconds));
      audio.volume = Number(volume.value) * fade;
    } else if (!sleepFadeTimer && Math.abs(audio.volume - Number(volume.value)) > .01) {
      audio.volume = Number(volume.value);
    }
    const second = Math.floor(audio.currentTime);
    if (second !== lastSavedSecond && second % 4 === 0) {
      storage.write('vlad-score-position', audio.currentTime);
      lastSavedSecond = second;
    }
    if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && audio.currentTime < totalDuration) {
      try {
        navigator.mediaSession.setPositionState({
          duration: totalDuration,
          playbackRate: audio.playbackRate,
          position: Math.max(0, audio.currentTime)
        });
      } catch {
        // Position reporting is optional and browser-dependent.
      }
    }
  });

  audio.addEventListener('ended', () => {
    paintProgress(totalDuration);
    audio.volume = Number(volume.value);
    storage.write('vlad-score-position', 0);
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
    storage.write('vlad-score-volume', audio.volume);
    volume.style.setProperty('--progress', `${Number(volume.value) * 100}%`);
  });

  const setReadingMode = (enabled) => {
    document.body.classList.toggle('reading-mode', enabled);
    readingMode?.setAttribute('aria-pressed', String(enabled));
    if (readingLabel) readingLabel.textContent = enabled ? 'Exit reading' : 'Reading mode';
    if (enabled) segmentedPlayer.scrollTop = 0;
  };

  readingMode?.addEventListener('click', () => {
    setReadingMode(!document.body.classList.contains('reading-mode'));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('reading-mode')) {
      setReadingMode(false);
    }
  });

  loopToggle?.addEventListener('click', () => {
    audio.loop = !audio.loop;
    loopToggle.setAttribute('aria-pressed', String(audio.loop));
    if (loopLabel) loopLabel.textContent = audio.loop ? 'Loop on' : 'Loop off';
    showToast(audio.loop ? 'Loop enabled for uninterrupted reading.' : 'Loop disabled.');
  });

  const clearSleepTimer = () => {
    window.clearTimeout(sleepStartTimer);
    window.clearInterval(sleepFadeTimer);
    sleepStartTimer = 0;
    sleepFadeTimer = 0;
    sleepEndAt = 0;
  };

  const beginSleepFade = () => {
    const initialVolume = audio.volume;
    const startedAt = Date.now();
    const fadeDuration = 8000;
    sleepFadeTimer = window.setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / fadeDuration);
      audio.volume = initialVolume * (1 - progress);
      if (progress < 1) return;
      window.clearInterval(sleepFadeTimer);
      sleepFadeTimer = 0;
      audio.pause();
      audio.volume = Number(volume.value);
      if (sleepTimer) sleepTimer.value = '0';
      sleepEndAt = 0;
      showToast('The music faded out at the end of your reading timer.');
    }, 200);
  };

  sleepTimer?.addEventListener('change', () => {
    clearSleepTimer();
    const minutes = Number(sleepTimer.value);
    if (!minutes) {
      showToast('Reading timer off.');
      return;
    }
    sleepEndAt = Date.now() + minutes * 60 * 1000;
    sleepStartTimer = window.setTimeout(beginSleepFade, Math.max(0, minutes * 60 * 1000 - 8000));
    showToast(`Music will fade out in ${minutes} minutes.`);
  });

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Ordo Draconis — The Dragon’s Bloodline',
      artist: 'Vlad Score · Modern Reworks',
      album: 'Vlad, Son of the Dragon',
      artwork: [
        { src: 'assets/vlad-book-cover.webp', sizes: '1024x1536', type: 'image/webp' }
      ]
    });
    const mediaAction = (name, handler) => {
      try { navigator.mediaSession.setActionHandler(name, handler); } catch { /* unsupported action */ }
    };
    mediaAction('play', async () => { await ensureTrack(); await audio.play(); });
    mediaAction('pause', () => audio.pause());
    mediaAction('seekbackward', (details) => {
      audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10));
    });
    mediaAction('seekforward', (details) => {
      audio.currentTime = Math.min(totalDuration, audio.currentTime + (details.seekOffset || 10));
    });
    mediaAction('seekto', (details) => {
      if (typeof details.seekTime === 'number') audio.currentTime = Math.min(totalDuration, Math.max(0, details.seekTime));
    });
  }

  window.addEventListener('beforeunload', () => {
    storage.write('vlad-score-position', audio.currentTime);
    clearSleepTimer();
    window.cancelAnimationFrame(visualizerFrame);
    if (audioContext) audioContext.close();
    if (trackUrl) URL.revokeObjectURL(trackUrl);
  });

  window.addEventListener('resize', () => {
    sizeVisualizer();
    if (audio.paused) renderVisualizer();
  }, { passive: true });

  audio.volume = savedVolume;
  volume.value = String(savedVolume);
  volume.style.setProperty('--progress', `${savedVolume * 100}%`);
  paintProgress(savedPosition > 8 ? savedPosition : 0);
  if (savedPosition > 8 && savedPosition < totalDuration - 8) state.textContent = 'RESUME';
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
      hero.style.setProperty('--copy-x', `${x * -2.6}px`);
      hero.style.setProperty('--copy-y', `${y * -1.6}px`);
      hero.style.setProperty('--depth-x', `${x * 5.6}px`);
      hero.style.setProperty('--depth-y', `${y * 3.5}px`);
    });
  });
  hero?.addEventListener('pointerleave', () => {
    hero.style.setProperty('--motion-x', '0px');
    hero.style.setProperty('--motion-y', '0px');
    hero.style.setProperty('--copy-x', '0px');
    hero.style.setProperty('--copy-y', '0px');
    hero.style.setProperty('--depth-x', '0px');
    hero.style.setProperty('--depth-y', '0px');
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
