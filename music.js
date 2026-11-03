(() => {
  "use strict";

  const player = document.querySelector("#musicPlayer");
  const toggle = document.querySelector("#musicToggle");
  const status = document.querySelector("#musicStatus");
  const trackLabel = document.querySelector("#musicTrackLabel");
  const puzzleAudio = document.querySelector("#puzzleMusic");
  const mainAudio = document.querySelector("#mainMusic");

  if (!player || !toggle || !status || !trackLabel || !puzzleAudio || !mainAudio) return;

  const targetVolume = 0.36;
  const tracks = {
    puzzle: {
      audio: puzzleAudio,
      label: "Reconstruyendo el recuerdo"
    },
    main: {
      audio: mainAudio,
      label: "Nuestra canción"
    }
  };

  let activeKey = "puzzle";
  let activeAudio = puzzleAudio;
  let wantsPlayback = true;
  let gestureArmed = false;
  let fadeFrame = 0;
  let playAttempt = 0;

  puzzleAudio.volume = targetVolume;
  mainAudio.volume = targetVolume;

  const updatePlayer = (state) => {
    const isPlaying = state === "playing";
    const isWaiting = state === "waiting";
    player.dataset.state = state;
    player.dataset.track = activeKey;
    toggle.setAttribute("aria-pressed", String(isPlaying));
    toggle.setAttribute("aria-label", isPlaying ? "Pausar música" : "Reproducir música");
    status.textContent = isPlaying
      ? "Música · sonando"
      : isWaiting
        ? "Música · toca para escuchar"
        : "Música · en pausa";
    trackLabel.textContent = tracks[activeKey].label;
  };

  const disarmGestureStart = () => {
    if (!gestureArmed) return;
    gestureArmed = false;
    document.removeEventListener("pointerdown", startFromGesture, true);
    document.removeEventListener("keydown", startFromGesture, true);
  };

  const armGestureStart = () => {
    if (gestureArmed || !wantsPlayback) return;
    gestureArmed = true;
    document.addEventListener("pointerdown", startFromGesture, true);
    document.addEventListener("keydown", startFromGesture, true);
  };

  const playActiveTrack = async () => {
    if (!wantsPlayback) return false;
    const attempt = ++playAttempt;

    try {
      await activeAudio.play();
      if (attempt !== playAttempt) return false;
      disarmGestureStart();
      updatePlayer("playing");
      return true;
    } catch {
      if (attempt !== playAttempt) return false;
      updatePlayer("waiting");
      armGestureStart();
      return false;
    }
  };

  function startFromGesture(event) {
    if (event.target instanceof Element && event.target.closest("#musicToggle")) return;
    playActiveTrack();
  }

  const stopFade = () => {
    if (!fadeFrame) return;
    cancelAnimationFrame(fadeFrame);
    fadeFrame = 0;
  };

  const switchToMainTrack = async () => {
    if (activeKey === "main") return;

    stopFade();
    const previousAudio = activeAudio;
    activeKey = "main";
    activeAudio = mainAudio;
    activeAudio.currentTime = 0;
    activeAudio.volume = 0;
    updatePlayer(wantsPlayback ? "waiting" : "paused");

    if (!wantsPlayback) {
      previousAudio.pause();
      previousAudio.currentTime = 0;
      activeAudio.volume = targetVolume;
      return;
    }

    const started = await playActiveTrack();
    if (!started) {
      previousAudio.pause();
      previousAudio.currentTime = 0;
      activeAudio.volume = targetVolume;
      return;
    }

    const fadeDuration = 900;
    const previousVolume = previousAudio.volume;
    const startTime = performance.now();

    const crossfade = (time) => {
      const progress = Math.min(1, (time - startTime) / fadeDuration);
      previousAudio.volume = Math.max(0, previousVolume * (1 - progress));
      activeAudio.volume = targetVolume * progress;

      if (progress < 1 && wantsPlayback) {
        fadeFrame = requestAnimationFrame(crossfade);
        return;
      }

      fadeFrame = 0;
      previousAudio.pause();
      previousAudio.currentTime = 0;
      previousAudio.volume = targetVolume;
      activeAudio.volume = targetVolume;
    };

    fadeFrame = requestAnimationFrame(crossfade);
  };

  const pauseMusic = () => {
    wantsPlayback = false;
    playAttempt += 1;
    stopFade();
    disarmGestureStart();
    puzzleAudio.pause();
    mainAudio.pause();
    updatePlayer("paused");
  };

  const resumeMusic = () => {
    wantsPlayback = true;
    activeAudio.volume = targetVolume;
    playActiveTrack();
  };

  const resetToPuzzleTrack = () => {
    stopFade();
    playAttempt += 1;
    mainAudio.pause();
    mainAudio.currentTime = 0;
    puzzleAudio.pause();
    puzzleAudio.currentTime = 0;
    puzzleAudio.volume = targetVolume;
    activeKey = "puzzle";
    activeAudio = puzzleAudio;
    wantsPlayback = true;
    updatePlayer("waiting");
    playActiveTrack();
  };

  toggle.addEventListener("click", () => {
    if (!activeAudio.paused) pauseMusic();
    else resumeMusic();
  });

  document.addEventListener("puzzle:completed", switchToMainTrack);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) resetToPuzzleTrack();
  });

  resetToPuzzleTrack();
})();
