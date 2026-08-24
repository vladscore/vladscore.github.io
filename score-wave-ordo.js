(() => {
  const players = [...document.querySelectorAll('[data-score-v3-player]')];
  if (!players.length) return;

  players.forEach((panel) => {
    const audio = panel.querySelector('audio');
    const oldCanvas = panel.querySelector('.audio-visualizer');
    if (!audio || !oldCanvas) return;

    const canvas = oldCanvas.cloneNode(false);
    oldCanvas.replaceWith(canvas);

    let audioContext = null;
    let analyser = null;
    let frequencyData = null;
    let visualizerFrame = 0;

    const sizeVisualizer = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const bounds = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(bounds.width * ratio));
      canvas.height = Math.max(1, Math.round(bounds.height * ratio));
      canvas.getContext('2d')?.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const renderVisualizer = () => {
      const context = canvas.getContext('2d');
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
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
      if (audioContext || (!window.AudioContext && !window.webkitAudioContext)) return audioContext;
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
        console.warn('Ordo-style visualizer unavailable:', error);
        audioContext = null;
        analyser = null;
        frequencyData = null;
      }
      return audioContext;
    };

    panel.querySelector('.player-toggle')?.addEventListener('click', () => {
      const graph = initAudioGraph();
      graph?.resume().catch(() => {});
    }, { capture:true });

    audio.addEventListener('play', () => {
      const graph = initAudioGraph();
      graph?.resume().catch(() => {});
      window.cancelAnimationFrame(visualizerFrame);
      visualizerFrame = window.requestAnimationFrame(renderVisualizer);
    });

    audio.addEventListener('pause', () => {
      window.cancelAnimationFrame(visualizerFrame);
      renderVisualizer();
    });

    window.addEventListener('resize', () => {
      sizeVisualizer();
      if (audio.paused) renderVisualizer();
    }, { passive:true });

    window.addEventListener('beforeunload', () => {
      window.cancelAnimationFrame(visualizerFrame);
      audioContext?.close();
    }, { once:true });

    sizeVisualizer();
    renderVisualizer();
  });
})();