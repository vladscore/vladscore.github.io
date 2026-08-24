(() => {
  const tracklist = document.querySelector('.tracklist');
  const scoreHeading = tracklist?.previousElementSibling;
  const originalModern = document.querySelector('[data-segmented-player]');
  if (!scoreHeading || !originalModern) return;

  document.querySelector('[data-multi-score-mounted]')?.remove();
  document.querySelectorAll('[data-cloned-audio]').forEach((node) => node.remove());
  document.querySelector('[data-score-v3-book]')?.remove();
  document.querySelector('[data-score-v3-modern]')?.remove();
  tracklist.remove();

  const chunks = (slug, count) =>
    Array.from({length:count}, (_, i) => `assets/audio/${slug}-${String(i).padStart(2,'0')}.part`);

  const tracks = [
    {code:'BS — 001',title:'Filius Draconis',collection:'Book Score',time:'02:50',duration:170,slug:'filius-draconis',parts:10,fadeStart:160,endAt:170,art:'assets/vlad-book-cover.webp',description:'An orchestral invocation of bloodline, oath, inheritance, and the name carried by the Son of the Dragon.'},
    {code:'BS — 002',title:'The Sultan’s House',collection:'Book Score',time:'03:16',duration:196,slug:'sultans-house',parts:6,art:'https://drive.google.com/thumbnail?id=1GTcN3elWZJEiMLBEnIsPk3lAFKIMzEgI&sz=w1200',description:'The eastern court as captivity and education: magnificence, surveillance, distance, and obedience.'},
    {code:'BS — 003',title:'The Ottoman Host',collection:'Book Score',time:'02:27',duration:147,slug:'ottoman-host',parts:5,art:'https://drive.google.com/thumbnail?id=15NB8rNylYpAw7vtZTn_hRzwFQCxd_CrY&sz=w1200',description:'An imperial army in motion: mass, discipline, percussion and the approach of war.'},
    {code:'BS — 004',title:'Sanctus Lumen',collection:'Book Score',time:'02:17',duration:137,slug:'sanctus-lumen',parts:5,art:'https://drive.google.com/thumbnail?id=169_ljtj_jtE9BtUB9j4eSAp_S-pp6OMH&sz=w1200',description:'Sacred light against political darkness: prayer, doubt and the fragile promise of redemption.'},
    {code:'BS — 005',title:'Letter to Father',collection:'Book Score',time:'05:39',duration:339,slug:'letter-to-father',parts:11,art:'https://drive.google.com/thumbnail?id=1JgncLg7xEgWRRdb9HiLLwFSL7M6JVS5O&sz=w1200',description:'Memory written toward a dead father: inheritance, accusation, longing and unfinished duty.'},
    {code:'BS — 006',title:'The Tragedy',collection:'Book Score',time:'05:08',duration:308,slug:'the-tragedy',parts:9,art:'https://drive.google.com/thumbnail?id=15VjI4j5H31DkLTlPEDauWo-7ET04C_bg&sz=w1200',description:'The cost beneath the legend: grief, irreversible choices and the silence after violence.'},
    {code:'BS — 007',title:'After the War',collection:'Book Score',time:'06:11',duration:371,slug:'after-the-war',parts:12,art:'https://drive.google.com/thumbnail?id=1uvotTOHTAS9x0y5iMstt6zBSpUtyX_w6&sz=w1200',description:'What remains when armies leave: exhausted earth, memory and the beginning of the second war — the story.'}
  ].map(t => ({...t,sources:chunks(t.slug,t.parts)}));

  const modern = {
    code:'MR — 002',title:'They Took You East',collection:'Modern Reworks',time:'05:36',duration:336,
    art:'assets/covers/they-took-you-east.png',sources:chunks('they-took-you-east',10),
    description:'A contemporary reworking of captivity and displacement: distance from home, an unfamiliar court, and a child carried east into the machinery of empire.'
  };

  const css = document.createElement('style');
  css.textContent = `
    .score-v3-stack{display:grid;gap:1.35rem;margin-top:2rem}
    .score-v3-panel{margin-top:0!important}
    .score-v3-panel .track-identity{display:grid;grid-template-columns:minmax(12rem,19rem) minmax(0,1fr);gap:clamp(1.4rem,3vw,2.6rem);align-items:center}
    .score-v3-art{position:relative;aspect-ratio:4/3;overflow:hidden;border:1px solid rgba(239,229,210,.22);background:#0b0807;box-shadow:0 20px 50px rgba(0,0,0,.24)}
    .score-v3-art img{display:block;width:100%;height:100%;object-fit:cover}
    .score-v3-art::after{content:'';position:absolute;inset:0;box-shadow:inset 0 0 0 1px rgba(255,255,255,.025),inset 0 -55px 70px rgba(0,0,0,.16);pointer-events:none}
    .score-v3-audio::before{content:attr(data-track-code)!important}
    .score-v3-audio .listening-tools{grid-column:1/-1}
    .score-v3-panel.is-fading .player-state{color:var(--blood-bright)}
    .score-v3-panel.is-fading .player-state::after{content:' · FADE';letter-spacing:.12em}
    @media(max-width:820px){.score-v3-panel .track-identity{grid-template-columns:1fr}.score-v3-art{width:min(100%,32rem)}}
  `;
  document.head.appendChild(css);

  const status = scoreHeading.querySelector('.collection-status');
  if (status) { status.textContent = 'Now playing'; status.classList.add('collection-status-live'); }

  const markup = (t) => `
    <div class="release-panel player-panel score-v3-panel" data-score-v3-player>
      <div class="release-copy"><div class="track-identity">
        <div class="score-v3-art"><img src="${t.art}" alt="${t.title} historical illustration"></div>
        <div><p class="eyebrow">${t.collection} · ${t.code} · ${t.time}</p><h3>${t.title}</h3><p>${t.description}</p></div>
      </div></div>
      <div class="audio-player score-v3-audio" data-track-code="${t.code}" aria-label="${t.title} music player">
        <audio preload="none"></audio>
        <button class="player-toggle" type="button" aria-label="Play ${t.title}"><span class="play-icon" aria-hidden="true">▶</span><span class="pause-icon" aria-hidden="true">Ⅱ</span></button>
        <div class="player-main">
          <canvas class="audio-visualizer" aria-hidden="true"></canvas>
          <div class="player-status"><span class="player-state">PLAY</span><span class="player-time"><span data-current-time>00:00</span> / <span>${t.time}</span></span></div>
          <input class="player-progress" type="range" min="0" max="${t.duration}" value="0" step="0.01" aria-label="${t.title} track progress">
        </div>
        <div class="player-volume"><label>VOL</label><input type="range" min="0" max="1" value="0.82" step="0.01" aria-label="${t.title} volume"></div>
        <div class="listening-tools" aria-label="Listening comfort controls">
          <button class="listening-tool" type="button" data-reading-mode aria-pressed="false"><span class="tool-icon" aria-hidden="true">◐</span><span data-reading-label>Reading mode</span></button>
          <button class="listening-tool" type="button" data-loop aria-pressed="false"><span class="tool-icon" aria-hidden="true">↻</span><span data-loop-label>Loop off</span></button>
          <label class="listening-tool listening-timer"><span class="tool-icon" aria-hidden="true">⌛</span><span class="sr-only">Stop playback after</span>
            <select data-sleep-timer aria-label="Stop playback after"><option value="0">No timer</option><option value="15">Stop in 15 min</option><option value="30">Stop in 30 min</option><option value="45">Stop in 45 min</option><option value="60">Stop in 60 min</option></select>
          </label>
        </div>
      </div>
    </div>`;

  const bookStack = document.createElement('div');
  bookStack.className = 'score-v3-stack';
  bookStack.dataset.scoreV3Book = 'true';
  bookStack.innerHTML = tracks.map(markup).join('');
  scoreHeading.insertAdjacentElement('afterend', bookStack);

  const modernWrap = document.createElement('div');
  modernWrap.dataset.scoreV3Modern = 'true';
  modernWrap.innerHTML = markup(modern);
  originalModern.insertAdjacentElement('afterend', modernWrap);

  const library = [...tracks, modern];
  const players = [...document.querySelectorAll('[data-score-v3-player]')];

  const toast = (message) => {
    const el = document.querySelector('.toast');
    if (!el) return;
    el.textContent = message; el.classList.add('visible');
    clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('visible'), 3200);
  };

  const syncReading = () => {
    const on = document.body.classList.contains('reading-mode');
    document.querySelectorAll('[data-reading-mode]').forEach(b => b.setAttribute('aria-pressed',String(on)));
    document.querySelectorAll('[data-reading-label]').forEach(l => l.textContent = on ? 'Exit reading' : 'Reading mode');
  };
  new MutationObserver(syncReading).observe(document.body,{attributes:true,attributeFilter:['class']});
  syncReading();

  const pauseOthers = (current) => document.querySelectorAll('audio').forEach(a => { if (a !== current && !a.paused) a.pause(); });
  document.addEventListener('play', e => { if (e.target instanceof HTMLMediaElement) pauseOthers(e.target); }, true);

  const fmt = (sec,max) => {
    sec = Math.max(0,Math.min(max,Number(sec)||0));
    return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(Math.floor(sec%60)).padStart(2,'0')}`;
  };

  players.forEach((panel,index) => {
    const t = library[index], audio = panel.querySelector('audio'), ui = panel.querySelector('.audio-player'),
      toggle = panel.querySelector('.player-toggle'), state = panel.querySelector('.player-state'),
      progress = panel.querySelector('.player-progress'), clock = panel.querySelector('[data-current-time]'),
      volume = panel.querySelector('.player-volume input'), canvas = panel.querySelector('.audio-visualizer'),
      read = panel.querySelector('[data-reading-mode]'), loopBtn = panel.querySelector('[data-loop]'),
      loopLabel = panel.querySelector('[data-loop-label]'), timer = panel.querySelector('[data-sleep-timer]');
    let url='', loading=null, seeking=false, loop=false, frame=0, stopTimer=0, fadeTimer=0, forcedEnd=false;
    if (!audio || !ui || !toggle || !state || !progress || !clock || !volume) return;

    const paint = (s) => {
      const v = Math.max(0,Math.min(t.duration,Number(s)||0));
      clock.textContent = fmt(v,t.duration);
      progress.style.setProperty('--progress',`${v/t.duration*100}%`);
      if (!seeking) progress.value = String(v);
    };

    const sizeCanvas = () => {
      if (!canvas) return;
      const r = Math.min(devicePixelRatio||1,2), b = canvas.getBoundingClientRect();
      canvas.width = Math.max(1,Math.round(b.width*r)); canvas.height = Math.max(1,Math.round(b.height*r));
      canvas.getContext('2d')?.setTransform(r,0,0,r,0,0);
    };
    const draw = () => {
      if (!canvas) return;
      const c=canvas.getContext('2d'), w=canvas.clientWidth, h=canvas.clientHeight;
      if (!c || !w || !h) return;
      c.clearRect(0,0,w,h);
      const bars=Math.max(28,Math.min(64,Math.floor(w/7))), gap=2, bw=Math.max(1,(w-gap*(bars-1))/bars), now=audio.currentTime||0;
      for(let i=0;i<bars;i++){ const e=audio.paused?.10:.12+Math.abs(Math.sin(now*2.4+i*.57))*.62; const bh=Math.max(2,e*(h-5)); c.fillStyle=audio.paused?'rgba(239,229,210,.22)':`rgba(214,73,59,${.45+e*.45})`; c.fillRect(i*(bw+gap),(h-bh)/2,bw,bh); }
      if(!audio.paused) frame=requestAnimationFrame(draw);
    };

    const ensure = () => {
      if (url) return Promise.resolve();
      if (!loading) {
        toggle.disabled=true; state.textContent='LOADING';
        loading = Promise.all(t.sources.map(async src => { const r=await fetch(src,{cache:'force-cache'}); if(!r.ok) throw new Error(`${t.title}: ${r.status}`); return r.arrayBuffer(); }))
          .then(parts => { url=URL.createObjectURL(new Blob(parts,{type:'audio/mpeg'})); audio.src=url; audio.load(); return new Promise((ok,bad) => { if(audio.readyState>=3) ok(); else { audio.addEventListener('canplay',ok,{once:true}); audio.addEventListener('error',bad,{once:true}); } }); })
          .then(() => { state.textContent='PLAY'; toggle.disabled=false; })
          .catch(err => { console.error(err); state.textContent='ERROR'; toggle.disabled=false; loading=null; toast('The recording could not be loaded.'); throw err; });
      }
      return loading;
    };

    const endLogic = () => {
      if (!t.endAt || audio.currentTime < t.endAt) return false;
      panel.classList.remove('is-fading'); audio.volume=Number(volume.value);
      if(loop){ audio.currentTime=0; paint(0); audio.play().catch(()=>{}); }
      else { forcedEnd=true; audio.pause(); audio.currentTime=t.endAt; paint(t.endAt); state.textContent='REPLAY'; }
      return true;
    };

    toggle.addEventListener('click', async () => {
      try {
        await ensure();
        if(audio.paused){ forcedEnd=false; if(audio.currentTime>=t.duration-.1) audio.currentTime=0; pauseOthers(audio); await audio.play(); }
        else audio.pause();
      } catch { state.textContent='ERROR'; }
    });

    audio.addEventListener('play', () => { pauseOthers(audio); ui.classList.add('is-playing'); document.body.classList.add('is-listening'); state.textContent='PLAYING'; toggle.setAttribute('aria-label',`Pause ${t.title}`); cancelAnimationFrame(frame); frame=requestAnimationFrame(draw); });
    audio.addEventListener('pause', () => { ui.classList.remove('is-playing'); cancelAnimationFrame(frame); draw(); if(![...document.querySelectorAll('audio')].some(a=>!a.paused)) document.body.classList.remove('is-listening'); if(state.textContent!=='ERROR'&&!forcedEnd) state.textContent=audio.currentTime>8?'RESUME':'PLAY'; toggle.setAttribute('aria-label',`Play ${t.title}`); });

    audio.addEventListener('timeupdate', () => {
      if(endLogic()) return;
      if(t.fadeStart && audio.currentTime>=t.fadeStart && !fadeTimer){ panel.classList.add('is-fading'); const f=Math.max(0,1-(audio.currentTime-t.fadeStart)/(t.endAt-t.fadeStart)); audio.volume=Number(volume.value)*f; }
      else if(t.fadeStart && audio.currentTime<t.fadeStart && !fadeTimer){ panel.classList.remove('is-fading'); audio.volume=Number(volume.value); }
      if(!seeking) paint(audio.currentTime);
    });
    audio.addEventListener('ended', () => { if(loop){audio.currentTime=0;audio.play().catch(()=>{});}else{paint(t.duration);state.textContent='REPLAY';} });

    progress.addEventListener('input', () => { seeking=true; paint(Number(progress.value)); });
    progress.addEventListener('change', async () => { try{await ensure();audio.currentTime=Math.min(t.duration,Number(progress.value));}finally{seeking=false;paint(audio.currentTime);endLogic();} });
    volume.addEventListener('input', () => { volume.style.setProperty('--progress',`${Number(volume.value)*100}%`); if(!t.fadeStart||audio.currentTime<t.fadeStart) audio.volume=Number(volume.value); });
    volume.style.setProperty('--progress',`${Number(volume.value)*100}%`); audio.volume=Number(volume.value); paint(0); sizeCanvas(); draw();

    read?.addEventListener('click', () => { document.body.classList.toggle('reading-mode'); syncReading(); });
    loopBtn?.addEventListener('click', () => { loop=!loop; loopBtn.setAttribute('aria-pressed',String(loop)); if(loopLabel) loopLabel.textContent=loop?'Loop on':'Loop off'; toast(loop?`Loop enabled for ${t.title}.`:`Loop disabled for ${t.title}.`); });

    const clearTimer=()=>{clearTimeout(stopTimer);clearInterval(fadeTimer);stopTimer=0;fadeTimer=0;};
    const timerFade=()=>{const start=Date.now(),initial=audio.volume;fadeTimer=setInterval(()=>{const p=Math.min(1,(Date.now()-start)/8000);audio.volume=initial*(1-p);if(p>=1){clearInterval(fadeTimer);fadeTimer=0;audio.pause();audio.volume=Number(volume.value);timer.value='0';toast('The music faded out at the end of your reading timer.');}},200);};
    timer?.addEventListener('change',()=>{clearTimer();const m=Number(timer.value);if(!m){toast('Reading timer off.');return;}stopTimer=setTimeout(timerFade,Math.max(0,m*60000-8000));toast(`Music will fade out in ${m} minutes.`);});

    addEventListener('resize',()=>{sizeCanvas();if(audio.paused)draw();},{passive:true});
    addEventListener('beforeunload',()=>{clearTimer();cancelAnimationFrame(frame);if(url)URL.revokeObjectURL(url);},{once:true});
  });
})();