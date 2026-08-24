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

/* Published score library: multiple players while preserving the original Ordo Draconis player. */
(() => {
  if (document.querySelector('[data-multi-score-mounted]')) return;

  const tracklist = document.querySelector('.tracklist');
  const scoreHeading = tracklist?.previousElementSibling;
  const originalModernPlayer = document.querySelector('[data-segmented-player]');
  if (!tracklist || !originalModernPlayer) return;

  const tracks = [
    {
      no: '01', code: 'BS — 001', title: 'Filius Draconis', note: 'Bloodline', duration: 319, time: '05:19',
      src: 'https://drive.google.com/uc?export=download&id=1Wvj8ZJsORZ2OcWr3jMnBqhtiYsYHfyog',
      description: 'An orchestral invocation of bloodline, oath, inheritance, and the name carried by the Son of the Dragon.'
    },
    {
      no: '02', code: 'BS — 002', title: 'The Sultan’s House', note: 'Captivity', duration: 196, time: '03:16',
      src: 'https://drive.google.com/uc?export=download&id=1s7M9PkvHb2HKdGjGfKPB4tQYNw2i-o-G',
      description: 'The eastern court as captivity and education: magnificence, surveillance, distance, and obedience.'
    },
    {
      no: '03', code: 'BS — 003', title: 'The Ottoman Host', note: 'War', duration: 147, time: '02:27',
      src: 'https://drive.google.com/uc?export=download&id=1nvhwQJvfQbKWZjazdUuyWOLSrvlLAxhu',
      description: 'An imperial army in motion: mass, discipline, percussion and the approach of war.'
    },
    {
      no: '04', code: 'BS — 004', title: 'Sanctus Lumen', note: 'Faith', duration: 137, time: '02:17',
      src: 'https://drive.google.com/uc?export=download&id=10sMkyPGNCPNBgqAec54LlvjILlDsTf94',
      description: 'Sacred light against political darkness: prayer, doubt and the fragile promise of redemption.'
    },
    {
      no: '05', code: 'BS — 005', title: 'Letter to Father', note: 'Memory', duration: 339, time: '05:39',
      src: 'https://drive.google.com/uc?export=download&id=17yQtYW0WyShZbzlZhW-BvPr9grjx4GKa',
      description: 'Memory written toward a dead father: inheritance, accusation, longing and unfinished duty.'
    },
    {
      no: '06', code: 'BS — 006', title: 'The Tragedy', note: 'Loss', duration: 308, time: '05:08',
      src: 'https://drive.google.com/uc?export=download&id=1MthdN8uTqTw0JcV4tHkw7fgFRvoO0sKK',
      description: 'The cost beneath the legend: grief, irreversible choices and the silence after violence.'
    },
    {
      no: '07', code: 'BS — 007', title: 'After the War', note: 'Aftermath', duration: 371, time: '06:11',
      src: 'https://drive.google.com/uc?export=download&id=1RxTaoQJwZpGafGHbva7qjt7eoGadzoEY',
      description: 'What remains when armies leave: exhausted earth, memory and the beginning of the second war — the story.'
    }
  ];

  const formatTime = (seconds) => {
    const safe = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  tracklist.setAttribute('aria-label', 'Vlad Book Score track list');
  tracklist.innerHTML = tracks.map((track) => `
    <li>
      <span class="track-number">${track.no}</span>
      <span class="track-name">${track.title}</span>
      <span class="track-note">${track.note} · ${track.time}</span>
    </li>`).join('') + `
    <li class="track-coming">
      <span class="track-number">08</span>
      <span class="track-name">A Name Without a Body</span>
      <span class="track-note">Afterlife · Coming</span>
    </li>`;

  const scoreStatus = scoreHeading?.querySelector('.collection-status');
  if (scoreStatus) {
    scoreStatus.textContent = 'Now playing';
    scoreStatus.classList.add('collection-status-live');
  }

  const grid = document.createElement('div');
  grid.className = 'score-player-grid';
  grid.dataset.multiScoreMounted = 'true';
  grid.setAttribute('aria-label', 'Book Score music players');
  grid.innerHTML = tracks.map((track) => `
    <article class="score-track-player" data-simple-audio data-title="${track.title}" data-collection="Vlad Book Score" data-duration="${track.duration}">
      <div class="score-track-art" aria-hidden="true">
        <img src="assets/order-of-the-dragon-emblem.svg" alt="">
        <span>${track.code}</span>
      </div>
      <div class="score-track-copy">
        <p class="eyebrow">Book Score · Track ${track.no} · ${track.time}</p>
        <h4>${track.title}</h4>
        <p>${track.description}</p>
        <div class="audio-player simple-audio-player" aria-label="${track.title} music player">
          <audio preload="none" src="${track.src}"></audio>
          <button class="player-toggle simple-player-toggle" type="button" aria-label="Play ${track.title}">
            <span class="play-icon" aria-hidden="true">▶</span>
            <span class="pause-icon" aria-hidden="true">Ⅱ</span>
          </button>
          <div class="player-main">
            <div class="simple-wave" aria-hidden="true"></div>
            <div class="player-status">
              <span class="player-state">PLAY</span>
              <span class="player-time"><span data-current-time>00:00</span> / <span>${track.time}</span></span>
            </div>
            <input class="player-progress" type="range" min="0" max="${track.duration}" value="0" step="0.01" aria-label="${track.title} track progress">
          </div>
          <div class="player-volume">
            <label>VOL</label>
            <input type="range" min="0" max="1" value="0.82" step="0.01" aria-label="${track.title} volume">
          </div>
        </div>
      </div>
    </article>`).join('');
  tracklist.insertAdjacentElement('afterend', grid);

  const modern = document.createElement('div');
  modern.className = 'release-panel player-panel modern-track-panel';
  modern.setAttribute('data-simple-audio', '');
  modern.dataset.title = 'They Took You East';
  modern.dataset.collection = 'Vlad Score · Modern Reworks';
  modern.dataset.duration = '336';
  modern.innerHTML = `
    <div class="release-copy">
      <div class="track-identity modern-track-identity">
        <div class="track-cover-frame">
          <img class="track-cover-image" src="https://drive.google.com/thumbnail?id=1TmCamdSlqJMHVU21_2VEkagg3Vw296mR&sz=w1400" alt="They Took You East cover artwork">
        </div>
        <div>
          <p class="eyebrow">Modern Reworks · Second release · 05:36</p>
          <h3>They Took You East</h3>
          <p>A contemporary reworking of captivity and displacement: distance from home, an unfamiliar court, and a child carried east into the machinery of empire.</p>
        </div>
      </div>
    </div>
    <div class="audio-player simple-audio-player" aria-label="They Took You East music player">
      <audio preload="none" src="https://drive.google.com/uc?export=download&id=1yKbo8QnY9hUsChBykY-TjCDnlsxjwJ50"></audio>
      <button class="player-toggle simple-player-toggle" type="button" aria-label="Play They Took You East">
        <span class="play-icon" aria-hidden="true">▶</span>
        <span class="pause-icon" aria-hidden="true">Ⅱ</span>
      </button>
      <div class="player-main">
        <div class="simple-wave" aria-hidden="true"></div>
        <div class="player-status">
          <span class="player-state">PLAY</span>
          <span class="player-time"><span data-current-time>00:00</span> / <span>05:36</span></span>
        </div>
        <input class="player-progress" type="range" min="0" max="336" value="0" step="0.01" aria-label="They Took You East track progress">
      </div>
      <div class="player-volume">
        <label>VOL</label>
        <input type="range" min="0" max="1" value="0.82" step="0.01" aria-label="They Took You East volume">
      </div>
    </div>`;
  originalModernPlayer.insertAdjacentElement('afterend', modern);

  document.addEventListener('play', (event) => {
    const current = event.target;
    if (!(current instanceof HTMLMediaElement)) return;
    document.querySelectorAll('audio').forEach((audio) => {
      if (audio !== current && !audio.paused) audio.pause();
    });
  }, true);

  const panels = Array.from(document.querySelectorAll('[data-simple-audio]'));
  panels.forEach((panel) => {
    const audio = panel.querySelector('audio');
    const player = panel.querySelector('.audio-player');
    const toggle = panel.querySelector('.simple-player-toggle');
    const state = panel.querySelector('.player-state');
    const currentTime = panel.querySelector('[data-current-time]');
    const progress = panel.querySelector('.player-progress');
    const volume = panel.querySelector('.player-volume input');
    const title = panel.dataset.title || 'Vlad Score';
    const collection = panel.dataset.collection || 'Vlad Score';
    const expectedDuration = Number(panel.dataset.duration) || Number(progress?.max) || 0;
    let seeking = false;

    if (!audio || !player || !toggle || !state || !currentTime || !progress || !volume) return;

    audio.volume = Number(volume.value);
    volume.style.setProperty('--progress', `${Number(volume.value) * 100}%`);

    const effectiveDuration = () => Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : expectedDuration;
    const paintProgress = (seconds) => {
      const duration = effectiveDuration();
      const current = Math.max(0, Math.min(duration || seconds, Number(seconds) || 0));
      if (!seeking) progress.value = String(current);
      if (duration > 0) {
        progress.max = String(duration);
        const percent = Math.max(0, Math.min(100, current / duration * 100));
        progress.style.setProperty('--progress', `${percent}%`);
      }
      currentTime.textContent = formatTime(current);
    };

    const updateMediaSession = () => {
      if (!('mediaSession' in navigator)) return;
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title,
          artist: collection,
          album: 'Vlad, Son of the Dragon',
          artwork: [{ src: 'assets/vlad-book-cover.webp', sizes: '1024x1536', type: 'image/webp' }]
        });
      } catch { /* optional browser API */ }
    };

    toggle.addEventListener('click', async () => {
      try {
        if (audio.paused) await audio.play();
        else audio.pause();
      } catch (error) {
        console.error(`Could not play ${title}:`, error);
        state.textContent = 'ERROR';
      }
    });

    audio.addEventListener('loadstart', () => {
      if (audio.currentTime === 0) state.textContent = 'LOADING';
    });
    audio.addEventListener('canplay', () => {
      if (audio.paused && audio.currentTime < 1) state.textContent = 'PLAY';
    });
    audio.addEventListener('loadedmetadata', () => {
      const duration = effectiveDuration();
      if (duration > 0) progress.max = String(duration);
      paintProgress(audio.currentTime);
    });
    audio.addEventListener('play', () => {
      panel.classList.add('is-playing');
      player.classList.add('is-playing');
      state.textContent = 'PLAYING';
      toggle.setAttribute('aria-label', `Pause ${title}`);
      updateMediaSession();
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    });
    audio.addEventListener('pause', () => {
      panel.classList.remove('is-playing');
      player.classList.remove('is-playing');
      if (state.textContent !== 'ERROR') state.textContent = audio.currentTime > 4 ? 'RESUME' : 'PLAY';
      toggle.setAttribute('aria-label', `Play ${title}`);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    });
    audio.addEventListener('timeupdate', () => {
      if (!seeking) paintProgress(audio.currentTime);
    });
    audio.addEventListener('ended', () => {
      panel.classList.remove('is-playing');
      player.classList.remove('is-playing');
      paintProgress(effectiveDuration());
      state.textContent = 'REPLAY';
    });
    audio.addEventListener('error', () => {
      panel.classList.remove('is-playing');
      player.classList.remove('is-playing');
      state.textContent = 'ERROR';
    });
    progress.addEventListener('input', () => {
      seeking = true;
      const duration = effectiveDuration();
      const value = Number(progress.value);
      currentTime.textContent = formatTime(value);
      if (duration > 0) progress.style.setProperty('--progress', `${Math.max(0, Math.min(100, value / duration * 100))}%`);
    });
    progress.addEventListener('change', () => {
      const requested = Number(progress.value);
      if (Number.isFinite(requested)) {
        try { audio.currentTime = requested; } catch { /* remote host may delay seek support */ }
      }
      seeking = false;
      paintProgress(audio.currentTime);
    });
    volume.addEventListener('input', () => {
      audio.volume = Number(volume.value);
      volume.style.setProperty('--progress', `${Number(volume.value) * 100}%`);
    });

    paintProgress(0);
  });
})();
