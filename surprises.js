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

/* Additional releases — reuse the exact visual language of the original working player. */
(() => {
  if (document.querySelector('[data-multi-score-mounted]')) return;

  const tracklist = document.querySelector('.tracklist');
  const scoreHeading = tracklist?.previousElementSibling;
  const originalModernPlayer = document.querySelector('[data-segmented-player]');
  if (!tracklist || !originalModernPlayer) return;

  const directDriveAudio = (id) => `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`;

  const bookTracks = [
    { no:'01', code:'BS — 001', title:'Filius Draconis', note:'Bloodline', time:'05:19', duration:319, id:'1Wvj8ZJsORZ2OcWr3jMnBqhtiYsYHfyog', description:'An orchestral invocation of bloodline, oath, inheritance, and the name carried by the Son of the Dragon.' },
    { no:'02', code:'BS — 002', title:'The Sultan’s House', note:'Captivity', time:'03:16', duration:196, id:'1s7M9PkvHb2HKdGjGfKPB4tQYNw2i-o-G', description:'The eastern court as captivity and education: magnificence, surveillance, distance, and obedience.' },
    { no:'03', code:'BS — 003', title:'The Ottoman Host', note:'War', time:'02:27', duration:147, id:'1nvhwQJvfQbKWZjazdUuyWOLSrvlLAxhu', description:'An imperial army in motion: mass, discipline, percussion and the approach of war.' },
    { no:'04', code:'BS — 004', title:'Sanctus Lumen', note:'Faith', time:'02:17', duration:137, id:'10sMkyPGNCPNBgqAec54LlvjILlDsTf94', description:'Sacred light against political darkness: prayer, doubt and the fragile promise of redemption.' },
    { no:'05', code:'BS — 005', title:'Letter to Father', note:'Memory', time:'05:39', duration:339, id:'17yQtYW0WyShZbzlZhW-BvPr9grjx4GKa', description:'Memory written toward a dead father: inheritance, accusation, longing and unfinished duty.' },
    { no:'06', code:'BS — 006', title:'The Tragedy', note:'Loss', time:'05:08', duration:308, id:'1MthdN8uTqTw0JcV4tHkw7fgFRvoO0sKK', description:'The cost beneath the legend: grief, irreversible choices and the silence after violence.' },
    { no:'07', code:'BS — 007', title:'After the War', note:'Aftermath', time:'06:11', duration:371, id:'1RxTaoQJwZpGafGHbva7qjt7eoGadzoEY', description:'What remains when armies leave: exhausted earth, memory and the beginning of the second war — the story.' }
  ].map(track => ({ ...track, src: directDriveAudio(track.id), collection:'Book Score' }));

  const modernTrack = {
    no:'02', code:'MR — 002', title:'They Took You East', note:'Captivity reworked', time:'05:36', duration:336,
    src: directDriveAudio('1yKbo8QnY9hUsChBykY-TjCDnlsxjwJ50'), collection:'Modern Reworks',
    cover:'https://drive.google.com/thumbnail?id=1TmCamdSlqJMHVU21_2VEkagg3Vw296mR&sz=w1200',
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
    <li><span class="track-number">${track.no}</span><span class="track-name">${track.title}</span><span class="track-note">${track.note} · ${track.time}</span></li>
  `).join('') + `<li class="track-coming"><span class="track-number">08</span><span class="track-name">A Name Without a Body</span><span class="track-note">Afterlife · Coming</span></li>`;

  const scoreStatus = scoreHeading?.querySelector('.collection-status');
  if (scoreStatus) {
    scoreStatus.textContent = 'Now playing';
    scoreStatus.classList.add('collection-status-live');
  }

  const panelMarkup = (track, useCover = false) => `
    <div class="release-panel player-panel cloned-track-panel" data-cloned-audio data-title="${track.title}" data-duration="${track.duration}" data-src="${track.src}">
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
          <div class="player-status"><span class="player-state">PLAY</span><span class="player-time"><span data-current-time>00:00</span> / <span>${track.time}</span></span></div>
          <input class="player-progress" type="range" min="0" max="${track.duration}" value="0" step="0.01" aria-label="${track.title} track progress">
        </div>
        <div class="player-volume"><label>VOL</label><input type="range" min="0" max="1" value="0.82" step="0.01" aria-label="${track.title} volume"></div>
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

  document.addEventListener('play', (event) => {
    const current = event.target;
    if (!(current instanceof HTMLMediaElement)) return;
    document.querySelectorAll('audio').forEach((audio) => {
      if (audio !== current && !audio.paused) audio.pause();
    });
  }, true);

  const formatTime = (seconds, max) => {
    const safe = Math.max(0, Math.min(max, Number(seconds) || 0));
    const minutes = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return `${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  };

  document.querySelectorAll('[data-cloned-audio]').forEach((panel) => {
    const audio = panel.querySelector('audio');
    const playerUI = panel.querySelector('.audio-player');
    const toggle = panel.querySelector('.player-toggle');
    const state = panel.querySelector('.player-state');
    const progress = panel.querySelector('.player-progress');
    const currentTime = panel.querySelector('[data-current-time]');
    const volume = panel.querySelector('.player-volume input');
    const canvas = panel.querySelector('.audio-visualizer');
    const title = panel.dataset.title;
    const src = panel.dataset.src;
    const totalDuration = Number(panel.dataset.duration);
    let seeking = false;
    let sourceAssigned = false;
    let loadingTimer = 0;

    if (!audio || !toggle || !state || !progress || !currentTime || !volume) return;

    const drawStaticVisualizer = () => {
      if (!canvas) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(ratio,0,0,ratio,0,0);
      const w = rect.width, h = rect.height;
      ctx.clearRect(0,0,w,h);
      const bars = Math.max(28, Math.min(58, Math.floor(w / 7)));
      const gap = 2;
      const bw = Math.max(1,(w-gap*(bars-1))/bars);
      for (let i=0;i<bars;i+=1) {
        const energy = .16 + (Math.sin(i*.81)+1)*.09;
        const bh = Math.max(2,energy*(h-4));
        ctx.fillStyle = 'rgba(239,229,210,.24)';
        ctx.fillRect(i*(bw+gap),(h-bh)/2,bw,bh);
      }
    };

    const paint = (seconds) => {
      const current = Math.max(0, Math.min(totalDuration, Number(seconds)||0));
      progress.style.setProperty('--progress', `${(current/totalDuration)*100}%`);
      currentTime.textContent = formatTime(current,totalDuration);
      if (!seeking) progress.value = String(current);
    };

    const assignSource = () => {
      if (sourceAssigned) return;
      audio.src = src;
      audio.load();
      sourceAssigned = true;
    };

    const startLoadWatch = () => {
      window.clearTimeout(loadingTimer);
      loadingTimer = window.setTimeout(() => {
        if (audio.readyState < HTMLMediaElement.HAVE_CURRENT_DATA && audio.paused) {
          state.textContent = 'RETRY';
          toggle.disabled = false;
        }
      }, 12000);
    };

    toggle.addEventListener('click', async () => {
      if (!sourceAssigned) {
        state.textContent = 'LOADING';
        toggle.disabled = true;
        assignSource();
        startLoadWatch();
      }
      try {
        if (audio.paused) {
          await audio.play();
        } else {
          audio.pause();
        }
      } catch (error) {
        console.error(`Could not play ${title}:`, error);
        state.textContent = 'RETRY';
        toggle.disabled = false;
      }
    });

    audio.addEventListener('canplay', () => {
      window.clearTimeout(loadingTimer);
      toggle.disabled = false;
      if (audio.paused) state.textContent = audio.currentTime > 4 ? 'RESUME' : 'PLAY';
    });
    audio.addEventListener('loadedmetadata', () => {
      window.clearTimeout(loadingTimer);
      toggle.disabled = false;
      paint(audio.currentTime);
    });
    audio.addEventListener('play', () => {
      playerUI.classList.add('is-playing');
      document.body.classList.add('is-listening');
      state.textContent = 'PLAYING';
      toggle.disabled = false;
      toggle.setAttribute('aria-label', `Pause ${title}`);
    });
    audio.addEventListener('pause', () => {
      playerUI.classList.remove('is-playing');
      if (![...document.querySelectorAll('audio')].some(item => !item.paused)) document.body.classList.remove('is-listening');
      if (state.textContent !== 'RETRY') state.textContent = audio.currentTime > 4 ? 'RESUME' : 'PLAY';
      toggle.setAttribute('aria-label', `Play ${title}`);
    });
    audio.addEventListener('timeupdate', () => { if (!seeking) paint(audio.currentTime); });
    audio.addEventListener('ended', () => { paint(totalDuration); state.textContent = 'REPLAY'; });
    audio.addEventListener('error', () => {
      window.clearTimeout(loadingTimer);
      toggle.disabled = false;
      state.textContent = 'RETRY';
    });

    progress.addEventListener('input', () => { seeking = true; paint(Number(progress.value)); });
    progress.addEventListener('change', () => {
      assignSource();
      try { audio.currentTime = Number(progress.value); } catch { /* metadata may still be loading */ }
      seeking = false;
      paint(audio.currentTime);
    });
    volume.addEventListener('input', () => {
      audio.volume = Number(volume.value);
      volume.style.setProperty('--progress', `${Number(volume.value)*100}%`);
    });

    audio.volume = Number(volume.value);
    volume.style.setProperty('--progress', `${Number(volume.value)*100}%`);
    paint(0);
    drawStaticVisualizer();
    window.addEventListener('resize', drawStaticVisualizer, { passive:true });
  });
})();
