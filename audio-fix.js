(() => {
  const objectUrls = new Map();
  const loading = new Map();

  const getDriveId = (panel) => {
    const raw = panel?.dataset?.src || '';
    const match = raw.match(/[?&]id=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  };

  const setState = (panel, text) => {
    const state = panel.querySelector('.player-state');
    if (state) state.textContent = text;
  };

  const ensureTrack = async (panel) => {
    const audio = panel.querySelector('audio');
    if (!audio) throw new Error('Missing audio element');
    if (objectUrls.has(panel)) return;
    if (loading.has(panel)) return loading.get(panel);

    const id = getDriveId(panel);
    if (!id) throw new Error('Missing Drive file id');

    const toggle = panel.querySelector('.player-toggle');
    if (toggle) toggle.disabled = true;
    setState(panel, 'LOADING');

    const promise = (async () => {
      const source = `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}`;
      const response = await fetch(source, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) throw new Error(`Audio request failed: ${response.status}`);
      const buffer = await response.arrayBuffer();
      if (!buffer.byteLength) throw new Error('Empty audio response');

      const url = URL.createObjectURL(new Blob([buffer], { type: 'audio/mpeg' }));
      objectUrls.set(panel, url);
      audio.src = url;
      audio.load();

      await new Promise((resolve, reject) => {
        const ready = () => { cleanup(); resolve(); };
        const failed = () => { cleanup(); reject(new Error('Browser could not decode audio')); };
        const cleanup = () => {
          audio.removeEventListener('canplay', ready);
          audio.removeEventListener('error', failed);
        };
        audio.addEventListener('canplay', ready, { once: true });
        audio.addEventListener('error', failed, { once: true });
      });

      setState(panel, 'PLAY');
    })().finally(() => {
      loading.delete(panel);
      if (toggle) toggle.disabled = false;
    });

    loading.set(panel, promise);
    return promise;
  };

  document.addEventListener('click', async (event) => {
    const toggle = event.target.closest('[data-cloned-audio] .player-toggle');
    if (!toggle) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const panel = toggle.closest('[data-cloned-audio]');
    const audio = panel?.querySelector('audio');
    if (!panel || !audio) return;

    try {
      if (!objectUrls.has(panel)) await ensureTrack(panel);
      if (audio.paused) {
        if (audio.duration && audio.currentTime >= audio.duration - .1) audio.currentTime = 0;
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      console.error('Additional score playback failed:', error);
      setState(panel, 'ERROR');
      const toast = document.querySelector('.toast');
      if (toast) {
        toast.textContent = 'The recording could not be loaded.';
        toast.classList.add('visible');
        window.setTimeout(() => toast.classList.remove('visible'), 3200);
      }
    }
  }, true);

  window.addEventListener('beforeunload', () => {
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.clear();
  });
})();
