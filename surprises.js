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

/*
 * Published score library.
 * All recordings are hosted on the same GitHub Pages origin and rebuilt from
 * local binary chunks exactly like the original Ordo Draconis player.
 */
(() => {
  if (document.querySelector('[data-multi-score-mounted]')) return;

  const tracklist = document.querySelector('.tracklist');
  const scoreHeading = tracklist?.previousElementSibling;
  const originalModernPlayer = document.querySelector('[data-segmented-player]');
  if (!tracklist || !originalModernPlayer) return;

  const chunkSources = (slug, count) =>
    Array.from({ length: count }, (_, index) =>
      `assets/audio/${slug}-${String(index).padStart(2, '0')}.part`
    );

  const bookTracks = [
    {
      no:'01', code:'BS — 001', title:'Filius Draconis', note:'Bloodline',
      time:'05:19', duration:319, slug:'filius-draconis', parts:10,
      description:'An orchestral invocation of bloodline, oath, inheritance, and the name carried by the Son of the Dragon.'
    },
    {
      no:'02', code:'BS — 002', title:'The Sultan’s House', note:'Captivity',
      time:'03:16', duration:196, slug:'sultans-house', parts:6,
      description:'The eastern court as captivity and education: magnificence, surveillance, distance, and obedience.'
    },
    {
      no:'03', code:'BS — 003', title:'The Ottoman Host', note:'War',
      time:'02:27', duration:147, slug:'ottoman-host', parts:5,
      description:'An imperial army in motion: mass, discipline, percussion and the approach of war.'
    },
    {
      no:'04', code:'BS — 004', title:'Sanctus Lumen', note:'Faith',
      time:'02:17', duration:137, slug:'sanctus-lumen', parts:5,
      description:'Sacred light against political darkness: prayer, doubt and the fragile promise of redemption.'
    },
    {
      no:'05', code:'BS — 005', title:'Letter to Father', note:'Memory',
      time:'05:39', duration:339, slug:'letter-to-father', parts:11,
      description:'Memory written toward a dead father: inheritance, accusation, longing and unfinished duty.'
    },
    {
      no:'06', code:'BS — 006', title:'The Tragedy', note:'Loss',
      time:'05:08', duration:308, slug:'the-tragedy', parts:9,
      description:'The cost beneath the legend: grief, irreversible choices and the silence after violence.'
    },
    {
      no:'07', code:'BS — 007', title:'After the War', note:'Aftermath',
      time:'06:11', duration:371, slug:'after-the-war', parts:12,
      description:'What remains when armies leave: exhausted earth, memory and the beginning of the second war — the story.'
    }
  ].map(track => ({
    ...track,
    collection:'Book Score',
    sources:chunkSources(track.slug, track.parts)
  }));

  const modernTrack = {
    no:'02', code:'MR — 002', title:'They Took You East', note:'Captivity reworked',
    time:'05:36', duration:336, collection:'Modern Reworks',
    sources:chunkSources('they-took-you-east', 10),
    cover:'assets/covers/they-took-you-east.png',
    description:'A contemporary reworking of captivity and displacement: distance from home, an unfamiliar court, and a child carried east into the machinery of empire.'
  };

  const style = document.createElement('style');
  style.textContent = `
    .score-release-stack{display:grid;gap:1.15rem;margin-top:2rem}
    .cloned-track-panel{margin-top:0!important}
    .cloned-track-panel .release-copy{min-width:0}
    .cloned-track-panel .track-identity{display:grid;grid-template-columns:minmax(8rem,11rem) minmax(0,1fr);gap:clamp(1.25rem,3vw,2.2rem);align-items:center}
    .cloned-track-art{position:relative;aspect-ratio:1;display:grid;place-items:center;overflow:hidden;border:1px solid rgba(239,229,210,.28);background:radial-gradient(circle at 50% 45%,rgba(189,51,45,.23),transparent 44%),#0c0807}
    .cloned-track-art img{width:67%;height:67%;object-fit:contain;opacity:.66;filter:grayscale(1) brightness(2.1)}
    .cloned-track-art.cover img{width:100%;height:100%;opacity:1;filter:none;object-fit:cover}
    .cloned-audio-player::before{content:attr(data-track-code)!important}
    .cloned-audio-player .audio-visualizer{pointer-events:none}
    .track-coming{opacity:.46}
    @media(max-width:760px){.cloned-track-panel .track-identity{grid-template-columns:1fr}.cloned-track-art{width:min(11rem,48vw)}}
  `;
  document.head.appendChild(style);

  tracklist.setAttribute('aria-label','Vlad Book Score track list');
  tracklist.innerHTML = bookTracks.map(track => `
    <li>
      <span class="track-number">${track.no}</span>
      <span class="track-name">${track.title}</span>
      <span class="track-note">${track.note} · ${track.time}</span>
    </li>
  `).join('') + `
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

  const panelMarkup = (track, useCover = false) => `
    <div class="release-panel player-panel cloned-track-panel"
         data-cloned-audio
         data-title="${track.title}"
         data-duration="${track.duration}">
      <div class="release-copy">
        <div class="track-identity">
          <div class="cloned-track-art${useCover ? ' cover' : ''}" aria-hidden="${useCover ? 'false' : 'true'}">
            <img src="${useCover ? track.cover : 'assets/order-of-the-dragon-emblem.svg'}" alt="${useCover ? track.title + ' cover artwork' : ''}">
          </div>
          <div>
            <p class="eyebrow">${track.collection} · ${track.code} · ${track.time}</p>
            <h3>${track.title}</h3>
            <p>${track.description}</p>
          </div>
        </div>
      </div>
      <div class="audio-player cloned-audio-player" data-track-code="${track.code}" aria-label="${track.title} music player">
        <audio preload="none"></audio>
        <button class="player-toggle" type="button" aria-label="Play ${track.title}">
          <span class="play-icon" aria-hidden="true">▶</span>
          <span class="pause-icon" aria-hidden="true">Ⅱ</span>
        </button>
        <div class="player-main">
          <canvas class="audio-visualizer" aria-hidden="true"></canvas>
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
    </div>`;

  const stack = document.createElement('div');
  stack.className = 'score-release-stack';
  stack.dataset.multiScoreMounted = 'true';
  stack.innerHTML = bookTracks.map(track => panelMarkup(track)).join('');
  tracklist.insertAdjacentElement('afterend', stack);

  const modernContainer = document.createElement('div');
  modernContainer.innerHTML = panelMarkup(modernTrack, true);
  originalModernPlayer.insertAdjacentElement('afterend', modernContainer.firstElementChild);

  const allTracks = [...bookTracks, modernTrack];
  const panels = Array.from(document.querySelectorAll('[data-cloned-audio]'));

  document.addEventListener('play', (event) => {
    const current = event.target;
    if (!(current instanceof HTMLMediaElement)) return;
    document.querySelectorAll('audio').forEach(audio => {
      if (audio !== current && !audio.paused) audio.pause();
    });
  }, true);

  const formatTime = (seconds, max) => {
    const safe = Math.max(0, Math.min(max, Number(seconds) || 0));
    const minutes = Math.floor(safe / 60);
    return `${String(minutes).padStart(2,'0')}:${String(Math.floor(safe % 60)).padStart(2,'0')}`;
  };

  panels.forEach((panel, panelIndex) => {
    const track = allTracks[panelIndex];
    const audio = panel.querySelector('audio');
    const playerUI = panel.querySelector('.audio-player');
    const toggle = panel.querySelector('.player-toggle');
    const state = panel.querySelector('.player-state');
    const progress = panel.querySelector('.player-progress');
    const currentTime = panel.querySelector('[data-current-time]');
    const volume = panel.querySelector('.player-volume input');
    const canvas = panel.querySelector('.audio-visualizer');
    const totalDuration = track.duration;
    let trackUrl = '';
    let loadingPromise = null;
    let seeking = false;

    if (!audio || !playerUI || !toggle || !state || !progress || !currentTime || !volume) return;

    const drawStaticVisualizer = () => {
      if (!canvas) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const width = rect.width;
      const height = rect.height;
      ctx.clearRect(0, 0, width, height);
      const bars = Math.max(28, Math.min(64, Math.floor(width / 7)));
      const gap = 2;
      const barWidth = Math.max(1, (width - gap * (bars - 1)) / bars);
      for (let index = 0; index < bars; index += 1) {
        const energy = .09 + Math.sin(index * .73) ** 2 * .08;
        const barHeight = Math.max(2, energy * (height - 5));
        ctx.fillStyle = 'rgba(239,229,210,.22)';
        ctx.fillRect(index * (barWidth + gap), (height - barHeight) / 2, barWidth, barHeight);
      }
    };

    const paint = seconds => {
      const current = Math.max(0, Math.min(totalDuration, Number(seconds) || 0));
      progress.style.setProperty('--progress', `${(current / totalDuration) * 100}%`);
      currentTime.textContent = formatTime(current, totalDuration);
      if (!seeking) progress.value = String(current);
    };

    const ensureTrack = () => {
      if (trackUrl) return Promise.resolve();
      if (!loadingPromise) {
        toggle.disabled = true;
        state.textContent = 'LOADING';
        loadingPromise = Promise.all(track.sources.map(async source => {
          const response = await fetch(source, { cache:'force-cache' });
          if (!response.ok) throw new Error(`${track.title}: audio chunk failed (${response.status})`);
          return response.arrayBuffer();
        }))
          .then(chunks => {
            trackUrl = URL.createObjectURL(new Blob(chunks, { type:'audio/mpeg' }));
            audio.src = trackUrl;
            audio.load();
            return new Promise((resolve, reject) => {
              if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
                resolve();
                return;
              }
              audio.addEventListener('canplay', resolve, { once:true });
              audio.addEventListener('error', reject, { once:true });
            });
          })
          .then(() => {
            state.textContent = 'PLAY';
            toggle.disabled = false;
          })
          .catch(error => {
            console.error(error);
            toggle.disabled = false;
            state.textContent = 'ERROR';
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
      } catch (error) {
        console.error(`Could not play ${track.title}:`, error);
        state.textContent = 'ERROR';
      }
    });

    audio.addEventListener('play', () => {
      playerUI.classList.add('is-playing');
      document.body.classList.add('is-listening');
      state.textContent = 'PLAYING';
      toggle.setAttribute('aria-label', `Pause ${track.title}`);
    });

    audio.addEventListener('pause', () => {
      playerUI.classList.remove('is-playing');
      if (![...document.querySelectorAll('audio')].some(item => !item.paused)) {
        document.body.classList.remove('is-listening');
      }
      if (state.textContent !== 'ERROR') {
        state.textContent = audio.currentTime > 4 ? 'RESUME' : 'PLAY';
      }
      toggle.setAttribute('aria-label', `Play ${track.title}`);
    });

    audio.addEventListener('timeupdate', () => {
      if (!seeking) paint(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      paint(totalDuration);
      state.textContent = 'REPLAY';
    });

    progress.addEventListener('input', () => {
      seeking = true;
      paint(Number(progress.value));
    });

    progress.addEventListener('change', async () => {
      try {
        await ensureTrack();
        audio.currentTime = Number(progress.value);
      } catch (error) {
        console.error(error);
      } finally {
        seeking = false;
        paint(audio.currentTime);
      }
    });

    volume.addEventListener('input', () => {
      audio.volume = Number(volume.value);
      volume.style.setProperty('--progress', `${Number(volume.value) * 100}%`);
    });

    audio.volume = Number(volume.value);
    volume.style.setProperty('--progress', `${Number(volume.value) * 100}%`);
    paint(0);
    drawStaticVisualizer();
    window.addEventListener('resize', drawStaticVisualizer, { passive:true });
  });
})();
