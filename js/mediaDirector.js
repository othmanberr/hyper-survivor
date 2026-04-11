const MediaDirector = (() => {
  let openingLineTimers = [];
  const assetProbeCache = new Map();
  let narrativeRestoreTimer = null;

  function isQaMode() {
    return !!window.__HS_QA_MODE;
  }

  function clearOpeningLineTimers() {
    openingLineTimers.forEach((timer) => clearTimeout(timer));
    openingLineTimers = [];
  }

  function clearNarrativeRestoreTimer() {
    if (narrativeRestoreTimer) {
      clearTimeout(narrativeRestoreTimer);
      narrativeRestoreTimer = null;
    }
  }

  function getOverlayRefs() {
    return {
      overlay: document.getElementById('cinematic-overlay'),
      video: document.getElementById('cinematic-video'),
      kicker: document.getElementById('cinematic-kicker'),
      title: document.getElementById('cinematic-title'),
      subtitle: document.getElementById('cinematic-subtitle'),
      line: document.getElementById('cinematic-line'),
      skip: document.getElementById('cinematic-skip')
    };
  }

  async function assetExists(src) {
    if (!src) return false;
    if (typeof window.shouldProbeMediaAsset === 'function' && !window.shouldProbeMediaAsset(src)) {
      return false;
    }
    const key = encodeURI(src);
    if (assetProbeCache.has(key)) return assetProbeCache.get(key);

    const probe = (async () => {
      try {
        const head = await fetch(key, { method: 'HEAD', cache: 'no-store' });
        if (head.ok) return true;
      } catch (e) { }
      try {
        const get = await fetch(key, {
          method: 'GET',
          headers: { Range: 'bytes=0-0' },
          cache: 'no-store'
        });
        return get.ok;
      } catch (e) {
        return false;
      }
    })();

    assetProbeCache.set(key, probe);
    return probe;
  }

  async function resolveFirstAsset(candidates) {
    const list = typeof window.getAvailableMedia === 'function'
      ? window.getAvailableMedia(candidates, { kind: 'optional' })
      : (Array.isArray(candidates) ? candidates : []);
    for (const src of list) {
      if (await assetExists(src)) return src;
    }
    return null;
  }

  function getTransitionProfile(kind, bossKey, fallbackConfig) {
    if (typeof getNarrativeTransitionProfile === 'function') {
      return getNarrativeTransitionProfile(kind, bossKey) || {};
    }
    const baseMusicDuck = fallbackConfig && Number.isFinite(fallbackConfig.musicDuck) ? fallbackConfig.musicDuck : 0.16;
    return {
      musicDuck: baseMusicDuck,
      musicFadeMs: 220,
      overlayHoldMs: 260,
      restoreDelayMs: 180,
      lineStepMs: 1000,
      videoLeadMs: 140
    };
  }

  function resetOverlayVideo(refs) {
    if (!refs.video) return;
    try { refs.video.pause(); } catch (e) { }
    refs.video.removeAttribute('src');
    refs.video.load();
  }

  function setOverlayMeta(config) {
    const refs = getOverlayRefs();
    if (!refs.overlay) return;
    refs.overlay.style.setProperty('--cinematic-accent', config.accent || '#6effcf');
    refs.overlay.style.setProperty('--cinematic-secondary', config.secondary || '#ffd84d');
    if (refs.kicker) refs.kicker.textContent = config.kicker || '';
    if (refs.title) refs.title.textContent = config.title || '';
    if (refs.subtitle) refs.subtitle.textContent = config.subtitle || '';
    if (refs.line) refs.line.textContent = (config.lines && config.lines[0]) || config.line || '';
    if (refs.skip) refs.skip.textContent = config.skipText || 'PRESS SPACE TO SKIP';
  }

  function scheduleOpeningLines(config) {
    const refs = getOverlayRefs();
    if (!refs.line) return;
    clearOpeningLineTimers();
    const lines = Array.isArray(config.lines) ? config.lines : [];
    const cueTimes = Array.isArray(config.cueTimes) ? config.cueTimes : [];
    const lineStepMs = Math.max(450, config.lineStepMs || 1200);
    lines.forEach((line, idx) => {
      const delay = Math.max(0, cueTimes[idx] !== undefined ? cueTimes[idx] * 1000 : idx * lineStepMs);
      openingLineTimers.push(setTimeout(() => {
        if (refs.line) refs.line.textContent = line;
      }, delay));
    });
  }

  function showOverlayCard(config, onComplete) {
    const refs = getOverlayRefs();
    const done = typeof onComplete === 'function' ? onComplete : () => { };
    if (!refs.overlay || !refs.video) {
      done();
      return;
    }

    clearNarrativeRestoreTimer();
    const transition = getTransitionProfile(config.kind || 'opening', config.bossKey, config);
    const musicDuck = Number.isFinite(config.musicDuck) ? config.musicDuck : transition.musicDuck;
    const musicFadeMs = Number.isFinite(config.musicFadeMs) ? config.musicFadeMs : transition.musicFadeMs;
    const holdMs = Number.isFinite(config.overlayHoldMs) ? config.overlayHoldMs : transition.overlayHoldMs;
    const lineStepMs = Number.isFinite(config.lineStepMs) ? config.lineStepMs : transition.lineStepMs;
    const videoLeadMs = Number.isFinite(config.videoLeadMs) ? config.videoLeadMs : transition.videoLeadMs;
    if (typeof duckMusic === 'function' && musicDuck !== undefined && musicDuck !== null) {
      duckMusic(musicDuck, musicFadeMs);
    }

    let finished = false;
    let safetyTimeout = null;

    function finish() {
      if (finished) return;
      finished = true;
      clearOpeningLineTimers();
      clearNarrativeRestoreTimer();
      clearTimeout(safetyTimeout);
      document.removeEventListener('keydown', onKey);
      refs.overlay.removeEventListener('click', onClick);
      refs.video.removeEventListener('ended', finish);
      refs.video.removeEventListener('error', finish);
      resetOverlayVideo(refs);
      refs.overlay.classList.add('h');
      refs.overlay.classList.remove('cinematic-overlay-active');
      if (typeof restoreMusicGain === 'function') {
        restoreMusicGain(musicFadeMs);
      }
      done();
    }

    function onKey(e) {
      if (e.code === 'Space' || e.code === 'Escape' || e.code === 'Enter') {
        e.preventDefault();
        finish();
      }
    }

    function onClick() {
      finish();
    }

    refs.overlay.classList.remove('h');
    refs.overlay.classList.add('cinematic-overlay-active');
    setOverlayMeta(config);
    config.lineStepMs = lineStepMs;
    scheduleOpeningLines(config);

    setTimeout(() => {
      if (finished) return;
      document.addEventListener('keydown', onKey);
      refs.overlay.addEventListener('click', onClick);
    }, config.skipDelayMs || holdMs || 350);

    (async () => {
      const videoSrc = await resolveFirstAsset(config.videoCandidates || []);
      const musicSrc = await resolveFirstAsset(config.musicCandidates || []);

      if (musicSrc && typeof playMusicAsset === 'function') {
        await playMusicAsset(musicSrc, {
          loop: config.musicLoop !== false,
          resetTime: config.resetMusic !== false,
          volume: Number.isFinite(config.musicVolume) ? config.musicVolume : 1
        });
      } else if (config.playFallbackOpeningSting && typeof playOpeningSting === 'function') {
        playOpeningSting();
      } else if (config.playFallbackEndingSting && typeof playEndingSting === 'function') {
        playEndingSting(config.playFallbackEndingSting);
      }

      if (finished) return;

      if (videoSrc) {
        const startVideo = () => {
          if (finished) return;
          refs.video.src = encodeURI(videoSrc);
          refs.video.currentTime = 0;
          refs.video.playbackRate = config.playbackRate || 1;
          refs.video.addEventListener('ended', finish);
          refs.video.addEventListener('error', finish);
          safetyTimeout = setTimeout(finish, config.safetyMs || 12000);
          try {
            const playback = refs.video.play();
            if (playback && playback.catch) playback.catch(() => finish());
          } catch (e) {
            finish();
          }
        };
        if (videoLeadMs > 0) {
          setTimeout(startVideo, videoLeadMs);
        } else {
          startVideo();
        }
      } else {
        safetyTimeout = setTimeout(finish, config.safetyMs || 3500);
      }
    })();
  }

  function playOpeningSequence(opts) {
    const onComplete = opts && typeof opts.onComplete === 'function' ? opts.onComplete : () => { };
    if (isQaMode()) {
      onComplete();
      return;
    }
    if (opts && opts.alreadyPlayed) {
      onComplete();
      return;
    }

    const config = typeof getOpeningMedia === 'function' ? getOpeningMedia() : null;
    if (!config) {
      onComplete();
      return;
    }

    showOverlayCard({
      ...config,
      skipText: 'PRESS SPACE TO SKIP',
      musicLoop: true,
      musicVolume: 0.9,
      playFallbackOpeningSting: true,
      kind: 'opening'
    }, onComplete);
  }

  function showBossIdent(payload) {
    const introEl = document.getElementById('boss-intro');
    if (!introEl) return;

    const media = typeof getBossMediaProfile === 'function' ? getBossMediaProfile(payload.bossKey) : null;
    const palette = media && Array.isArray(media.palette) ? media.palette : [payload.accent || '#ffd84d', '#fff1b3', '#07090f'];
    introEl.style.setProperty('--boss-accent', palette[0]);
    introEl.style.setProperty('--boss-secondary', palette[1] || '#fff1b3');
    introEl.style.setProperty('--boss-deep', palette[2] || '#07090f');

    const chips = media && Array.isArray(media.chips) ? media.chips : [];
    const chipsMarkup = chips.length
      ? `<div class="boss-intro-chips">${chips.map((chip) => `<span class="boss-intro-chip">${chip}</span>`).join('')}</div>`
      : '';

    introEl.innerHTML = `
      <div class="boss-intro-shell">
        <div class="boss-intro-kicker">${(media && media.kicker) || 'THREAT SIGNAL'}</div>
        <div class="boss-intro-warning">WARNING</div>
        <div class="boss-intro-name">${payload.name}</div>
        <div class="boss-intro-sub">${payload.sub}</div>
        <div class="boss-intro-tagline">${payload.tagline}</div>
        <div class="boss-intro-line">${(media && media.entryLine) || ''}</div>
        <div class="boss-intro-stage">${payload.stageLabel}</div>
        <div class="boss-intro-domain">
          <span class="boss-intro-domain-label">DOMAIN</span>
          <span class="boss-intro-domain-value">${(media && media.domain) || payload.domain || 'MARKET DOMAIN'}</span>
        </div>
        <div class="boss-intro-threat" style="color:${payload.threatColor}">THREAT: ${payload.threatLevel} . HP ${payload.hp}</div>
        ${chipsMarkup}
      </div>
    `;

    const transition = getTransitionProfile('boss', payload.bossKey, media);
    if (typeof duckMusic === 'function') duckMusic(transition.musicDuck, transition.musicFadeMs);
    if (!isQaMode() && typeof playBossSting === 'function') playBossSting(payload.bossKey, 'intro');
  }

  function beginWave() {
    if (isQaMode()) return;
    (async () => {
      const profile = typeof getStageMediaProfile === 'function'
        ? getStageMediaProfile(G.stage, G.mode)
        : null;
      const musicSrc = await resolveFirstAsset(profile && profile.musicCandidates);
      if (musicSrc && typeof playMusicAsset === 'function') {
        const ok = await playMusicAsset(musicSrc, {
          loop: true,
          resetTime: false,
          volume: profile && Number.isFinite(profile.musicVolume) ? profile.musicVolume : 0.92
        });
        if (ok && typeof restoreMusicGain === 'function') {
          restoreMusicGain(profile && profile.musicFadeMs ? profile.musicFadeMs : 180);
          return;
        }
      }
      if (typeof startMusic === 'function') {
        startMusic();
        if (typeof restoreMusicGain === 'function') restoreMusicGain(profile && profile.musicFadeMs ? profile.musicFadeMs : 180);
      }
    })();
  }

  function enterBossCombat(bossKey) {
    if (isQaMode()) return;
    if (typeof playBossSting === 'function') playBossSting(bossKey, 'transition');
    (async () => {
      const media = typeof getBossMediaProfile === 'function' ? getBossMediaProfile(bossKey) : null;
      const bossLoop = await resolveFirstAsset(media && media.loopAudioCandidates);
      if (bossLoop && typeof playMusicAsset === 'function') {
        await playMusicAsset(bossLoop, {
          loop: true,
          resetTime: true,
          volume: media && Number.isFinite(media.musicVolume) ? media.musicVolume : 0.96
        });
        if (typeof restoreMusicGain === 'function') {
          restoreMusicGain(media && media.musicFadeMs ? media.musicFadeMs : 180);
        }
        return;
      }
      if (!hasActiveAssetMusic || !hasActiveAssetMusic()) {
        if (typeof startMusic === 'function') startMusic();
      }
      if (typeof restoreMusicGain === 'function') {
        restoreMusicGain(media && media.musicFadeMs ? media.musicFadeMs : 180);
      }
    })();
  }

  function handleBossDefeat(bossKey) {
    if (isQaMode()) return;
    const media = typeof getBossMediaProfile === 'function' ? getBossMediaProfile(bossKey) : null;
    if (media && Array.isArray(media.deathAudioCandidates) && media.deathAudioCandidates.length) {
      // Asset hook reserved for future drops; current build falls back to synth sting.
    }
    if (typeof playBossSting === 'function') playBossSting(bossKey, 'death');
    else if (typeof playSound === 'function') playSound('bossDeath');
  }

  function playEnding(kind) {
    if (isQaMode()) return;
    const config = typeof getEndingMediaProfile === 'function'
      ? getEndingMediaProfile(kind)
      : null;
    if (!config) {
      if (typeof playEndingSting === 'function') playEndingSting(kind);
      return;
    }

    showOverlayCard({
      ...config,
      skipText: 'PRESS SPACE TO CONTINUE',
      musicLoop: false,
      musicVolume: 1,
      playbackRate: 1,
      playFallbackEndingSting: kind,
      kind: 'ending'
    }, () => { });
  }

  function syncAudioSettings() {
    if (typeof loadSettings === 'function') loadSettings();
  }

  return {
    playOpeningSequence,
    showBossIdent,
    beginWave,
    enterBossCombat,
    handleBossDefeat,
    playEnding,
    syncAudioSettings
  };
})();

window.MediaDirector = MediaDirector;
