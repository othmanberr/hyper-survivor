// ============ SOUND SYSTEM (Web Audio API) ============
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let assetMusicPlayer = null;
let assetMusicSource = null;
let assetMusicSrc = '';
let musicDuckSnapshot = null;

function initAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => { });
    return;
  }
  audioCtx = new AudioCtx();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.5;
  masterGain.connect(audioCtx.destination);

  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0.3;
  musicGain.connect(masterGain);

  sfxGain = audioCtx.createGain();
  sfxGain.gain.value = 0.6;
  sfxGain.connect(masterGain);

  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => { });
  if (typeof loadSettings === 'function') loadSettings();
}

function ensureAssetMusicPlayer() {
  if (!audioCtx || !musicGain) return null;
  if (!assetMusicPlayer) {
    assetMusicPlayer = new Audio();
    assetMusicPlayer.preload = 'auto';
    assetMusicPlayer.crossOrigin = 'anonymous';
    assetMusicPlayer.playsInline = true;
    assetMusicPlayer.loop = true;
    assetMusicPlayer.volume = 1;
    assetMusicSource = audioCtx.createMediaElementSource(assetMusicPlayer);
    assetMusicSource.connect(musicGain);
  }
  return assetMusicPlayer;
}

function setMusicGainLevel(target, fadeMs = 0) {
  if (!audioCtx || !musicGain) return;
  const next = Math.max(0, Math.min(1, Number(target)));
  const now = audioCtx.currentTime;
  const gain = musicGain.gain;
  try {
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(Math.max(0.0001, gain.value || 0.0001), now);
    if (fadeMs > 0) {
      gain.linearRampToValueAtTime(Math.max(0.0001, next), now + fadeMs / 1000);
    } else {
      gain.setValueAtTime(Math.max(0.0001, next), now);
    }
  } catch (e) {
    gain.value = next;
  }
}

function duckMusic(target = 0.18, fadeMs = 140) {
  if (!audioCtx || !musicGain) return;
  if (musicDuckSnapshot === null) musicDuckSnapshot = Math.max(0.0001, musicGain.gain.value || 0.0001);
  setMusicGainLevel(Math.min(musicDuckSnapshot, target), fadeMs);
}

function restoreMusicGain(fadeMs = 220) {
  if (!audioCtx || !musicGain) return;
  const target = musicDuckSnapshot === null ? Math.max(0.0001, musicGain.gain.value || 0.3) : musicDuckSnapshot;
  musicDuckSnapshot = null;
  setMusicGainLevel(target, fadeMs);
}

function clearMusicDuckState() {
  musicDuckSnapshot = null;
}

function stopProceduralMusic() {
  musicPlaying = false;
  if (v1MiniLoopTimer) { clearInterval(v1MiniLoopTimer); v1MiniLoopTimer = null; }
  if (musicScheduler) { clearInterval(musicScheduler); musicScheduler = null; }
  musicNodes.forEach(node => {
    try {
      if (node.stop) node.stop();
      if (node.disconnect) node.disconnect();
    } catch (e) { /* already stopped */ }
  });
  musicNodes = [];
  musicBeat = 0;
}

async function playMusicAsset(src, opts) {
  initAudio();
  const player = ensureAssetMusicPlayer();
  if (!player || !src) return false;
  const options = opts || {};
  const encodedSrc = encodeURI(src);
  const sameSrc = assetMusicSrc === encodedSrc;

  stopProceduralMusic();

  if (!sameSrc) {
    player.pause();
    player.src = encodedSrc;
    assetMusicSrc = encodedSrc;
    if (options.resetTime !== false) player.currentTime = 0;
  } else if (!player.paused) {
    player.loop = options.loop !== false;
    if (typeof options.volume === 'number') player.volume = Math.max(0, Math.min(1, options.volume));
    return true;
  }

  player.loop = options.loop !== false;
  if (typeof options.volume === 'number') player.volume = Math.max(0, Math.min(1, options.volume));
  else player.volume = 1;

  if (audioCtx && audioCtx.state === 'suspended') {
    try { await audioCtx.resume(); } catch (e) { }
  }

  try {
    await player.play();
    return true;
  } catch (e) {
    return false;
  }
}

function stopMusicAsset(resetTime = true) {
  if (!assetMusicPlayer) return;
  try {
    assetMusicPlayer.pause();
    if (resetTime) assetMusicPlayer.currentTime = 0;
  } catch (e) { }
}

function hasActiveAssetMusic() {
  return !!(assetMusicPlayer && !assetMusicPlayer.paused && assetMusicSrc);
}

function getActiveAssetMusicSrc() {
  return assetMusicSrc || '';
}

// Synth sound effect generator
function playSound(type) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  if (type === 'shoot') {
    // Realistic gunshot: Noise burst + quick low thump
    const bufSize = audioCtx.sampleRate * 0.15; // 150ms
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);

    const noiseSrc = audioCtx.createBufferSource();
    noiseSrc.buffer = buf;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noiseSrc.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(sfxGain);
    noiseSrc.start(now);

    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.05);
    oscGain.gain.setValueAtTime(0.6, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(oscGain);
    oscGain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  if (type === 'pistol_shot') {
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.06);
    oscGain.gain.setValueAtTime(0.45, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(oscGain);
    oscGain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);

    const bufSize = audioCtx.sampleRate * 0.08;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 3);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    src.start(now);
  }

  if (type === 'smg_burst') {
    for (let i = 0; i < 2; i++) {
      const t0 = now + i * 0.018;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, t0);
      osc.frequency.exponentialRampToValueAtTime(90, t0 + 0.04);
      g.gain.setValueAtTime(0.18, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.04);
      osc.connect(g);
      g.connect(sfxGain);
      osc.start(t0);
      osc.stop(t0 + 0.04);
    }
  }

  if (type === 'crossbow_twang') {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(720, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  if (type === 'shotgun') {
    const now = audioCtx.currentTime;

    // 1. Sharp metallic crack
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    oscGain.gain.setValueAtTime(0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(oscGain);
    oscGain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);

    // 2. High frequency snap (noise)
    const bufSize = audioCtx.sampleRate * 0.2;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
    }
    const noiseSrc = audioCtx.createBufferSource();
    noiseSrc.buffer = buf;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 800;

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(1.0, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    noiseSrc.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(sfxGain);
    noiseSrc.start(now);
  }

  if (type === 'fire_burst') {
    const bufSize = audioCtx.sampleRate * 0.16;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.38, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    src.connect(filter);
    filter.connect(g);
    g.connect(sfxGain);
    src.start(now);
  }

  if (type === 'laser') {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.12);
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.12);
  }

  if (type === 'plasma_fire') {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.16);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.16);

    const osc2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(220, now);
    osc2.frequency.exponentialRampToValueAtTime(90, now + 0.16);
    g2.gain.setValueAtTime(0.1, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc2.connect(g2); g2.connect(sfxGain);
    osc2.start(now); osc2.stop(now + 0.16);
  }

  if (type === 'railgun_charge') {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.12);
  }

  if (type === 'rocket') {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.3);

    // Explosion noise
    const bufSize = audioCtx.sampleRate * 0.2;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize) ** 2;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const g2 = audioCtx.createGain();
    g2.gain.setValueAtTime(0.3, now + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    src.connect(g2); g2.connect(sfxGain);
    src.start(now + 0.05);
  }

  if (type === 'axe_throw') {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.09);
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.09);
  }

  if (type === 'electric_throw') {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.08);
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.08);
  }

  if (type === 'katana') {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2000, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.06);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.06);
  }

  if (type === 'hit') {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.1);
  }

  if (type === 'playerHit') {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.2);
  }

  if (type === 'pickup') {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.08);
  }

  if (type === 'pickupGold') {
    for (let i = 0; i < 2; i++) {
      const t0 = now + i * 0.035;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(i === 0 ? 900 : 1280, t0);
      osc.frequency.exponentialRampToValueAtTime(i === 0 ? 1220 : 1680, t0 + 0.09);
      g.gain.setValueAtTime(0.07, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
      osc.connect(g); g.connect(sfxGain);
      osc.start(t0); osc.stop(t0 + 0.1);
    }
  }

  if (type === 'pickupXp') {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.12);
    g.gain.setValueAtTime(0.07, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.12);

    const osc2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(620, now + 0.03);
    osc2.frequency.exponentialRampToValueAtTime(1280, now + 0.11);
    g2.gain.setValueAtTime(0.05, now + 0.03);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc2.connect(g2); g2.connect(sfxGain);
    osc2.start(now + 0.03); osc2.stop(now + 0.12);
  }

  if (type === 'pickupHeart') {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.08);
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.1);

    const osc2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(680, now + 0.035);
    osc2.frequency.exponentialRampToValueAtTime(940, now + 0.12);
    g2.gain.setValueAtTime(0.05, now + 0.035);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc2.connect(g2); g2.connect(sfxGain);
    osc2.start(now + 0.035); osc2.stop(now + 0.12);
  }

  if (type === 'levelup') {
    for (let i = 0; i < 4; i++) {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      const freq = [523, 659, 784, 1047][i];
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      g.gain.setValueAtTime(0.12, now + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
      osc.connect(g); g.connect(sfxGain);
      osc.start(now + i * 0.08); osc.stop(now + i * 0.08 + 0.2);
    }
  }

  if (type === 'waveClear') {
    const notes = [392, 523, 659];
    for (let i = 0; i < notes.length; i++) {
      const t0 = now + i * 0.07;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(notes[i], t0);
      osc.frequency.exponentialRampToValueAtTime(notes[i] * 1.06, t0 + 0.16);
      g.gain.setValueAtTime(0.11, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      osc.connect(g); g.connect(sfxGain);
      osc.start(t0); osc.stop(t0 + 0.18);
    }

    const bass = audioCtx.createOscillator();
    const bassGain = audioCtx.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(130, now);
    bass.frequency.exponentialRampToValueAtTime(82, now + 0.2);
    bassGain.gain.setValueAtTime(0.08, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    bass.connect(bassGain); bassGain.connect(sfxGain);
    bass.start(now); bass.stop(now + 0.22);
  }

  if (type === 'waveStart') {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.11);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.14);

    const osc2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(520, now + 0.02);
    osc2.frequency.exponentialRampToValueAtTime(980, now + 0.12);
    g2.gain.setValueAtTime(0.08, now + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc2.connect(g2); g2.connect(sfxGain);
    osc2.start(now + 0.02); osc2.stop(now + 0.16);
  }

  if (type === 'enemyDeath') {
    const bufSize = audioCtx.sampleRate * 0.15;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize) ** 3;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    const flt = audioCtx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(2000, now);
    flt.frequency.exponentialRampToValueAtTime(200, now + 0.15);
    src.connect(flt); flt.connect(g); g.connect(sfxGain);
    src.start(now);
  }

  if (type === 'enemyDeathElite') {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.18);

    const osc2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(620, now);
    osc2.frequency.exponentialRampToValueAtTime(240, now + 0.14);
    g2.gain.setValueAtTime(0.08, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc2.connect(g2); g2.connect(sfxGain);
    osc2.start(now); osc2.stop(now + 0.16);
  }

  if (type === 'bossDeath') {
    // Big explosion
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const n = audioCtx.currentTime;
        const bufSize = audioCtx.sampleRate * 0.4;
        const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let j = 0; j < bufSize; j++) data[j] = (Math.random() * 2 - 1) * (1 - j / bufSize) ** 2;
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.3, n);
        g.gain.exponentialRampToValueAtTime(0.001, n + 0.4);
        src.connect(g); g.connect(sfxGain);
        src.start(n);
      }, i * 150);
    }
  }

  if (type === 'bossCharge') {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.22);
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.24);

    const osc2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(320, now);
    osc2.frequency.exponentialRampToValueAtTime(120, now + 0.18);
    g2.gain.setValueAtTime(0.08, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc2.connect(g2); g2.connect(sfxGain);
    osc2.start(now); osc2.stop(now + 0.18);
  }

  if (type === 'bossRing') {
    for (let i = 0; i < 3; i++) {
      const t0 = now + i * 0.045;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(460 + i * 120, t0);
      osc.frequency.exponentialRampToValueAtTime(180 + i * 40, t0 + 0.18);
      g.gain.setValueAtTime(0.11, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      osc.connect(g); g.connect(sfxGain);
      osc.start(t0); osc.stop(t0 + 0.18);
    }
  }

  if (type === 'bossGlitch') {
    const bufSize = audioCtx.sampleRate * 0.12;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.8);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const flt = audioCtx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.value = 1600;
    flt.Q.value = 3.5;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    src.connect(flt); flt.connect(g); g.connect(sfxGain);
    src.start(now);

    const osc = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(260, now);
    osc.detune.setValueAtTime(900, now);
    osc.detune.linearRampToValueAtTime(-700, now + 0.1);
    g2.gain.setValueAtTime(0.08, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(g2); g2.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.1);
  }

  if (type === 'bossShield') {
    [440, 660, 990].forEach((freq, i) => {
      const t0 = now + i * 0.03;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t0);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.72, t0 + 0.22);
      g.gain.setValueAtTime(0.08, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.24);
      osc.connect(g); g.connect(sfxGain);
      osc.start(t0); osc.stop(t0 + 0.24);
    });
  }

  if (type === 'bossSlam') {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.32);
    g.gain.setValueAtTime(0.28, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.32);

    const bufSize = audioCtx.sampleRate * 0.14;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2.5);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const g2 = audioCtx.createGain();
    g2.gain.setValueAtTime(0.16, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    const flt = audioCtx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.value = 260;
    src.connect(flt); flt.connect(g2); g2.connect(sfxGain);
    src.start(now);
  }

  if (type === 'critical') {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1500, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.05);
  }

  // ---- INTRO CINEMATIC SOUNDS ----

  if (type === 'introGlitch') {
    // Noise burst + detuned sawtooth = industrial glitch
    const bufSize = audioCtx.sampleRate * 0.1;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize) ** 1.5;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const flt = audioCtx.createBiquadFilter();
    flt.type = 'bandpass'; flt.frequency.value = 3000; flt.Q.value = 2;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    src.connect(flt); flt.connect(g); g.connect(sfxGain);
    src.start(now);

    // Detuned oscillator layer
    const osc = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
    osc.detune.setValueAtTime(1200, now);
    osc.detune.linearRampToValueAtTime(-600, now + 0.08);
    g2.gain.setValueAtTime(0.12, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g2); g2.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.1);
  }

  if (type === 'introHit') {
    // Deep sub-bass hit
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const flt = audioCtx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(50, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.4);
    flt.type = 'lowpass'; flt.frequency.value = 120;
    g.gain.setValueAtTime(0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(flt); flt.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.4);

    // Click transient
    const osc2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(800, now);
    osc2.frequency.exponentialRampToValueAtTime(100, now + 0.02);
    g2.gain.setValueAtTime(0.15, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc2.connect(g2); g2.connect(sfxGain);
    osc2.start(now); osc2.stop(now + 0.03);
  }

  if (type === 'missionSpawn') {
    // Ascending alert tone — two quick notes
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(660, now + 0.12);
    osc.frequency.setValueAtTime(880, now + 0.24);
    g.gain.setValueAtTime(0.15, now);
    g.gain.setValueAtTime(0.12, now + 0.12);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.4);
  }

  if (type === 'missionComplete') {
    // Triumphant chord — major arpeggio
    [523, 659, 784].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, now + i * 0.08);
      g.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(g); g.connect(sfxGain);
      osc.start(now + i * 0.08); osc.stop(now + 0.5);
    });
  }

  // ---- DEGEN FX SOUNDS ----
  if (type === 'airhorn') {
    // Classic meme airhorn — brassy sine sweep
    for (let i = 0; i < 3; i++) {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'square';
      const t0 = now + i * 0.15;
      osc.frequency.setValueAtTime(800, t0);
      osc.frequency.linearRampToValueAtTime(1200, t0 + 0.05);
      osc.frequency.linearRampToValueAtTime(900, t0 + 0.12);
      g.gain.setValueAtTime(0.08, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.14);
      osc.connect(g); g.connect(sfxGain);
      osc.start(t0); osc.stop(t0 + 0.14);
    }
  }

  if (type === 'bassDrop') {
    // Deep sub-bass impact
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.5);
    g.gain.setValueAtTime(0.4, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.5);
    // Click top
    const osc2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(150, now);
    osc2.frequency.exponentialRampToValueAtTime(30, now + 0.08);
    g2.gain.setValueAtTime(0.2, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc2.connect(g2); g2.connect(sfxGain);
    osc2.start(now); osc2.stop(now + 0.1);
  }

  if (type === 'bruh') {
    // Low vocal-ish burst
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const flt = audioCtx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(85, now + 0.25);
    flt.type = 'bandpass'; flt.frequency.value = 400; flt.Q.value = 5;
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(flt); flt.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 0.3);
  }

  if (type === 'jeffPanic') {
    // Descending alarm / panic sound
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.6);
    osc.frequency.setValueAtTime(900, now + 0.6);
    osc.frequency.exponentialRampToValueAtTime(150, now + 1.0);
    g.gain.setValueAtTime(0.12, now);
    g.gain.setValueAtTime(0.1, now + 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    osc.connect(g); g.connect(sfxGain);
    osc.start(now); osc.stop(now + 1.0);
  }
}

const BOSS_STING_PROFILES = {
  murad: { root: 110, accent: 165, top: 330, tone: 'sawtooth' },
  carlos: { root: 146.83, accent: 220, top: 440, tone: 'square' },
  ape: { root: 82.41, accent: 123.47, top: 246.94, tone: 'triangle' },
  dokwon: { root: 138.59, accent: 207.65, top: 415.3, tone: 'sawtooth' },
  logan: { root: 155.56, accent: 233.08, top: 466.16, tone: 'square' },
  ruja: { root: 130.81, accent: 196, top: 392, tone: 'triangle' },
  caroline: { root: 123.47, accent: 185, top: 369.99, tone: 'sine' },
  kwon: { root: 92.5, accent: 138.59, top: 277.18, tone: 'sawtooth' },
  sam: { root: 98, accent: 147, top: 293.66, tone: 'triangle' },
  cz: { root: 73.42, accent: 110, top: 220, tone: 'square' },
  default: { root: 110, accent: 165, top: 330, tone: 'sawtooth' }
};

function playOpeningSting() {
  if (!audioCtx || !sfxGain) return;
  const now = audioCtx.currentTime;

  const rise = audioCtx.createOscillator();
  const riseGain = audioCtx.createGain();
  rise.type = 'sawtooth';
  rise.frequency.setValueAtTime(82.41, now);
  rise.frequency.exponentialRampToValueAtTime(329.63, now + 1.5);
  riseGain.gain.setValueAtTime(0.001, now);
  riseGain.gain.linearRampToValueAtTime(0.1, now + 0.7);
  riseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
  rise.connect(riseGain);
  riseGain.connect(sfxGain);
  rise.start(now);
  rise.stop(now + 1.55);

  const pulse = audioCtx.createOscillator();
  const pulseGain = audioCtx.createGain();
  pulse.type = 'triangle';
  pulse.frequency.setValueAtTime(164.81, now + 0.15);
  pulse.frequency.exponentialRampToValueAtTime(659.25, now + 1.0);
  pulseGain.gain.setValueAtTime(0.001, now + 0.1);
  pulseGain.gain.linearRampToValueAtTime(0.05, now + 0.45);
  pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
  pulse.connect(pulseGain);
  pulseGain.connect(sfxGain);
  pulse.start(now + 0.1);
  pulse.stop(now + 1.12);
}

function playBossSting(bossKey, variant) {
  if (!audioCtx || !sfxGain) return;
  const profile = BOSS_STING_PROFILES[bossKey] || BOSS_STING_PROFILES.default;
  const now = audioCtx.currentTime;
  const isDeath = variant === 'death';
  const isTransition = variant === 'transition';
  const baseDur = isDeath ? 0.95 : isTransition ? 0.7 : 1.15;
  const swell = audioCtx.createOscillator();
  const swellGain = audioCtx.createGain();
  const accent = audioCtx.createOscillator();
  const accentGain = audioCtx.createGain();
  const sub = audioCtx.createOscillator();
  const subGain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  swell.type = profile.tone;
  accent.type = isDeath ? 'triangle' : 'square';
  sub.type = 'sine';
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(isDeath ? 900 : 1400, now);
  filter.frequency.exponentialRampToValueAtTime(isDeath ? 220 : 480, now + baseDur);
  filter.Q.value = isDeath ? 2.8 : 1.4;

  const startRoot = isDeath ? profile.top : isTransition ? profile.accent : profile.root;
  const endRoot = isDeath ? profile.root * 0.66 : isTransition ? profile.root * 0.92 : profile.top;
  swell.frequency.setValueAtTime(startRoot, now);
  swell.frequency.exponentialRampToValueAtTime(endRoot, now + baseDur);
  swellGain.gain.setValueAtTime(isDeath ? 0.09 : 0.001, now);
  if (!isDeath) swellGain.gain.linearRampToValueAtTime(isTransition ? 0.09 : 0.14, now + Math.min(0.22, baseDur * 0.35));
  swellGain.gain.exponentialRampToValueAtTime(0.001, now + baseDur);

  accent.frequency.setValueAtTime(isDeath ? profile.accent : profile.top, now + 0.03);
  accent.frequency.exponentialRampToValueAtTime(isDeath ? profile.root : profile.accent, now + Math.max(0.18, baseDur * 0.55));
  accentGain.gain.setValueAtTime(isTransition ? 0.04 : 0.07, now + 0.02);
  accentGain.gain.exponentialRampToValueAtTime(0.001, now + Math.max(0.22, baseDur * 0.62));

  sub.frequency.setValueAtTime(profile.root * (isDeath ? 0.5 : 0.75), now);
  sub.frequency.exponentialRampToValueAtTime(profile.root * (isDeath ? 0.32 : 0.5), now + baseDur);
  subGain.gain.setValueAtTime(isDeath ? 0.18 : 0.12, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + baseDur);

  swell.connect(filter);
  filter.connect(swellGain);
  swellGain.connect(sfxGain);
  accent.connect(accentGain);
  accentGain.connect(sfxGain);
  sub.connect(subGain);
  subGain.connect(sfxGain);

  swell.start(now);
  swell.stop(now + baseDur + 0.04);
  accent.start(now + 0.02);
  accent.stop(now + Math.max(0.26, baseDur * 0.64));
  sub.start(now);
  sub.stop(now + baseDur + 0.04);
}

function playEndingSting(kind) {
  if (!audioCtx || !sfxGain) return;
  const now = audioCtx.currentTime;
  const victory = kind === 'victory';
  const oscA = audioCtx.createOscillator();
  const oscB = audioCtx.createOscillator();
  const gainA = audioCtx.createGain();
  const gainB = audioCtx.createGain();

  oscA.type = victory ? 'triangle' : 'sawtooth';
  oscB.type = victory ? 'sine' : 'square';
  oscA.frequency.setValueAtTime(victory ? 220 : 196, now);
  oscA.frequency.exponentialRampToValueAtTime(victory ? 659.25 : 82.41, now + 1.3);
  oscB.frequency.setValueAtTime(victory ? 329.63 : 146.83, now + 0.04);
  oscB.frequency.exponentialRampToValueAtTime(victory ? 880 : 55, now + 1.15);
  gainA.gain.setValueAtTime(0.001, now);
  gainA.gain.linearRampToValueAtTime(victory ? 0.12 : 0.09, now + 0.24);
  gainA.gain.exponentialRampToValueAtTime(0.001, now + 1.35);
  gainB.gain.setValueAtTime(victory ? 0.05 : 0.06, now + 0.04);
  gainB.gain.exponentialRampToValueAtTime(0.001, now + 1.05);
  oscA.connect(gainA);
  gainA.connect(sfxGain);
  oscB.connect(gainB);
  gainB.connect(sfxGain);
  oscA.start(now);
  oscA.stop(now + 1.38);
  oscB.start(now + 0.04);
  oscB.stop(now + 1.08);
}

// ============ KAVINSKY-STYLE DARK SYNTHWAVE ENGINE ============
let musicPlaying = false;
let musicNodes = [];
let musicScheduler = null;
let musicBeat = 0;
let v1MiniLoopTimer = null;
const USE_V1_MINI_LOOP = true;

// Tempo — slower, moodier, like Nightcall
const MUSIC_BPM = 100;
const BEAT_DUR = 60 / MUSIC_BPM;

// Dark Am progression — Nightcall-style
const BASS_NOTES = [
  55, 55, 55, 55, 55, 55, 55, 55,       // Am (A1)
  41.2, 41.2, 41.2, 41.2, 41.2, 41.2, 41.2, 41.2,  // Em (E1)
  43.65, 43.65, 43.65, 43.65, 43.65, 43.65, 43.65, 43.65, // F (F1) 
  36.71, 36.71, 36.71, 36.71, 36.71, 36.71, 36.71, 36.71  // Dm (D1)
];

// Arpeggio — high dreamy notes
const ARP_NOTES = [
  880, 660, 523, 440, 523, 660, 880, 1047,
  659, 523, 392, 330, 392, 523, 659, 784,
  698, 523, 440, 349, 440, 523, 698, 880,
  587, 440, 349, 293, 349, 440, 587, 698
];

// Pad chords — lush detuned saw
const PAD_CHORDS = [
  [220, 261.63, 329.63, 440],   // Am
  [164.81, 246.94, 329.63, 493.88],  // Em
  [174.61, 220, 261.63, 349.23],  // F
  [146.83, 220, 293.66, 440],   // Dm
];

function startV1MiniLoop() {
  if (!audioCtx || musicPlaying || !musicGain) return;
  musicPlaying = true;
  let step = 0;
  const pattern = [146.83, 174.61, 196.0, 174.61];

  const tick = () => {
    if (!audioCtx || !musicPlaying || !musicGain) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const oscHarmonic = audioCtx.createOscillator();
    const toneGain = audioCtx.createGain();
    const toneFilter = audioCtx.createBiquadFilter();
    const base = pattern[step % pattern.length];

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(base, now);
    oscHarmonic.type = 'sine';
    oscHarmonic.frequency.setValueAtTime(base * 2, now);
    toneFilter.type = 'lowpass';
    toneFilter.frequency.setValueAtTime(900, now);
    toneFilter.Q.value = 0.9;

    toneGain.gain.setValueAtTime(0.0001, now);
    toneGain.gain.exponentialRampToValueAtTime(0.022, now + 0.12);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc.connect(toneFilter);
    oscHarmonic.connect(toneFilter);
    toneFilter.connect(toneGain);
    toneGain.connect(musicGain);

    osc.start(now);
    oscHarmonic.start(now + 0.01);
    osc.stop(now + 0.9);
    oscHarmonic.stop(now + 0.78);
    musicNodes.push(osc, oscHarmonic, toneGain, toneFilter);
    step++;
  };

  tick();
  v1MiniLoopTimer = setInterval(tick, 780);
}

function startMusic() {
  stopMusicAsset();
  if (!audioCtx || musicPlaying) return;
  if (USE_V1_MINI_LOOP) {
    startV1MiniLoop();
    return;
  }
  musicPlaying = true;
  musicBeat = 0;

  // ---- DEEP PAD (2x detuned sawtooth per note, filtered) ----
  const padOscillators = [];
  const padGain = audioCtx.createGain();
  padGain.gain.value = 0.035;
  const padFilter = audioCtx.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.value = 350;
  padFilter.Q.value = 1.5;
  padGain.connect(padFilter);
  padFilter.connect(musicGain);

  PAD_CHORDS[0].forEach(freq => {
    // Layer 1
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.detune.value = (Math.random() - 0.5) * 20;
    osc.connect(padGain);
    osc.start();
    padOscillators.push(osc);
    musicNodes.push(osc);
    // Layer 2 (detuned for thickness)
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = freq;
    osc2.detune.value = -12 + (Math.random() - 0.5) * 8;
    osc2.connect(padGain);
    osc2.start();
    padOscillators.push(osc2);
    musicNodes.push(osc2);
  });
  musicNodes.push(padGain, padFilter);

  // ---- SUB DRONE (pure sine, very low) ----
  const droneOsc = audioCtx.createOscillator();
  droneOsc.type = 'sine';
  droneOsc.frequency.value = 55;
  const droneGain = audioCtx.createGain();
  droneGain.gain.value = 0.07;
  const droneFlt = audioCtx.createBiquadFilter();
  droneFlt.type = 'lowpass';
  droneFlt.frequency.value = 100;
  droneOsc.connect(droneGain);
  droneGain.connect(droneFlt);
  droneFlt.connect(musicGain);
  droneOsc.start();
  musicNodes.push(droneOsc, droneGain, droneFlt);

  // ---- Simple delay for arp (ping-pong feel) ----
  const delayNode = audioCtx.createDelay(1.0);
  delayNode.delayTime.value = BEAT_DUR * 0.75; // dotted 8th
  const delayFeedback = audioCtx.createGain();
  delayFeedback.gain.value = 0.3;
  const delayFilter = audioCtx.createBiquadFilter();
  delayFilter.type = 'lowpass';
  delayFilter.frequency.value = 2000;
  delayNode.connect(delayFeedback);
  delayFeedback.connect(delayFilter);
  delayFilter.connect(delayNode); // feedback loop
  delayFilter.connect(musicGain); // wet signal
  musicNodes.push(delayNode, delayFeedback, delayFilter);

  // ---- BEAT SCHEDULER ----
  const tickMs = (BEAT_DUR * 1000) / 2; // 8th notes

  musicScheduler = setInterval(() => {
    if (!audioCtx || !musicPlaying) return;
    const now = audioCtx.currentTime;
    const b = musicBeat;
    const bar = Math.floor(b / 8) % 4; // 4-bar loop

    // --- PAD FILTER SWEEP (slow open/close) ---
    const sweepPhase = (b % 64) / 64;
    const sweepFreq = 250 + Math.sin(sweepPhase * Math.PI * 2) * 400;
    padFilter.frequency.linearRampToValueAtTime(sweepFreq, now + BEAT_DUR);

    // --- PAD CHORD CHANGES (every bar) ---
    if (b % 8 === 0) {
      const chord = PAD_CHORDS[bar];
      padOscillators.forEach((osc, i) => {
        const freqIdx = Math.floor(i / 2) % chord.length;
        osc.frequency.linearRampToValueAtTime(chord[freqIdx], now + BEAT_DUR * 3);
      });
      // Drone follows root
      droneOsc.frequency.linearRampToValueAtTime(chord[0] / 4, now + BEAT_DUR * 2);
    }

    // --- PULSING BASS (Nightcall-style octave pulse) ---
    if (b % 2 === 0) {
      const bassIdx = Math.floor(b / 2) % BASS_NOTES.length;
      const bassFreq = BASS_NOTES[bassIdx];

      // Sub layer
      const bassOsc = audioCtx.createOscillator();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.value = bassFreq;

      const bassOsc2 = audioCtx.createOscillator();
      bassOsc2.type = 'square';
      bassOsc2.frequency.value = bassFreq * 2; // octave up

      const bassGain = audioCtx.createGain();
      bassGain.gain.setValueAtTime(0.14, now);
      bassGain.gain.exponentialRampToValueAtTime(0.04, now + BEAT_DUR * 0.4);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + BEAT_DUR * 0.9);

      const bassGain2 = audioCtx.createGain();
      bassGain2.gain.setValueAtTime(0.04, now);
      bassGain2.gain.exponentialRampToValueAtTime(0.001, now + BEAT_DUR * 0.6);

      const bassFlt = audioCtx.createBiquadFilter();
      bassFlt.type = 'lowpass';
      bassFlt.frequency.setValueAtTime(400, now);
      bassFlt.frequency.exponentialRampToValueAtTime(100, now + BEAT_DUR * 0.8);
      bassFlt.Q.value = 4;

      bassOsc.connect(bassFlt);
      bassOsc2.connect(bassGain2);
      bassFlt.connect(bassGain);
      bassGain.connect(musicGain);
      bassGain2.connect(musicGain);
      bassOsc.start(now); bassOsc.stop(now + BEAT_DUR);
      bassOsc2.start(now); bassOsc2.stop(now + BEAT_DUR * 0.7);
    }

    // --- ARPEGGIO (16th note, dreamy, through delay) ---
    const arpActive = (b % 32) >= 8; // silent first bar for breathing room
    if (arpActive && b % 1 === 0) {
      const arpFreq = ARP_NOTES[b % ARP_NOTES.length];
      const arpOsc = audioCtx.createOscillator();
      arpOsc.type = 'triangle';
      arpOsc.frequency.value = arpFreq;

      const arpG = audioCtx.createGain();
      const velocity = 0.025 + Math.sin(b * 0.4) * 0.01;
      arpG.gain.setValueAtTime(velocity, now);
      arpG.gain.exponentialRampToValueAtTime(0.001, now + BEAT_DUR * 0.4);

      arpOsc.connect(arpG);
      arpG.connect(musicGain); // dry signal
      arpG.connect(delayNode); // wet signal through delay
      arpOsc.start(now);
      arpOsc.stop(now + BEAT_DUR * 0.45);
    }

    // --- KICK (punchy 808-style, every beat) ---
    if (b % 4 === 0) {
      const kickOsc = audioCtx.createOscillator();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(150, now);
      kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
      const kickG = audioCtx.createGain();
      kickG.gain.setValueAtTime(0.28, now);
      kickG.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      kickOsc.connect(kickG);
      kickG.connect(musicGain);
      kickOsc.start(now);
      kickOsc.stop(now + 0.25);

      // Click transient
      const clickOsc = audioCtx.createOscillator();
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(1200, now);
      clickOsc.frequency.exponentialRampToValueAtTime(200, now + 0.01);
      const clickG = audioCtx.createGain();
      clickG.gain.setValueAtTime(0.08, now);
      clickG.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      clickOsc.connect(clickG);
      clickG.connect(musicGain);
      clickOsc.start(now);
      clickOsc.stop(now + 0.02);
    }

    // --- SNARE / CLAP (beat 2 & 4, gated reverb style) ---
    if (b % 8 === 4) {
      const snareBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.15, audioCtx.sampleRate);
      const snareData = snareBuf.getChannelData(0);
      for (let i = 0; i < snareData.length; i++) {
        snareData[i] = (Math.random() * 2 - 1) * (1 - i / snareData.length) ** 1.2;
        if (i < snareData.length * 0.05) snareData[i] *= 2.5; // sharp attack
      }
      const snareSrc = audioCtx.createBufferSource();
      snareSrc.buffer = snareBuf;
      const snareG = audioCtx.createGain();
      snareG.gain.setValueAtTime(0.14, now);
      snareG.gain.linearRampToValueAtTime(0.06, now + 0.05);
      snareG.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      const snareFlt = audioCtx.createBiquadFilter();
      snareFlt.type = 'bandpass';
      snareFlt.frequency.value = 3000;
      snareFlt.Q.value = 0.8;
      snareSrc.connect(snareFlt);
      snareFlt.connect(snareG);
      snareG.connect(musicGain);
      snareSrc.start(now);
    }

    // --- HI-HAT (8th notes, velocity variation) ---
    if (b % 2 === 1) {
      const hatLen = (b % 4 === 3) ? 0.06 : 0.03; // open on off-beats
      const hatBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * hatLen, audioCtx.sampleRate);
      const hatData = hatBuf.getChannelData(0);
      for (let i = 0; i < hatData.length; i++) hatData[i] = (Math.random() * 2 - 1) * (1 - i / hatData.length) ** 3;
      const hatSrc = audioCtx.createBufferSource();
      hatSrc.buffer = hatBuf;
      const hatG = audioCtx.createGain();
      const hatVol = (b % 4 === 3) ? 0.06 : 0.035;
      hatG.gain.setValueAtTime(hatVol, now);
      hatG.gain.exponentialRampToValueAtTime(0.001, now + hatLen);
      const hatFlt = audioCtx.createBiquadFilter();
      hatFlt.type = 'highpass';
      hatFlt.frequency.value = 8000;
      hatSrc.connect(hatFlt);
      hatFlt.connect(hatG);
      hatG.connect(musicGain);
      hatSrc.start(now);
    }

    // --- Atmospheric riser every 8 bars ---
    if (b % 64 === 62) {
      const riserOsc = audioCtx.createOscillator();
      riserOsc.type = 'sawtooth';
      riserOsc.frequency.setValueAtTime(110, now);
      riserOsc.frequency.exponentialRampToValueAtTime(1760, now + BEAT_DUR * 4);
      const riserG = audioCtx.createGain();
      riserG.gain.setValueAtTime(0, now);
      riserG.gain.linearRampToValueAtTime(0.04, now + BEAT_DUR * 3);
      riserG.gain.exponentialRampToValueAtTime(0.001, now + BEAT_DUR * 4);
      const riserFlt = audioCtx.createBiquadFilter();
      riserFlt.type = 'bandpass';
      riserFlt.frequency.setValueAtTime(300, now);
      riserFlt.frequency.exponentialRampToValueAtTime(5000, now + BEAT_DUR * 4);
      riserFlt.Q.value = 2;
      riserOsc.connect(riserFlt);
      riserFlt.connect(riserG);
      riserG.connect(musicGain);
      riserOsc.start(now);
      riserOsc.stop(now + BEAT_DUR * 4);
    }

    musicBeat++;
  }, tickMs);
}

function stopMusic() {
  stopProceduralMusic();
  stopMusicAsset();
  clearMusicDuckState();
}
