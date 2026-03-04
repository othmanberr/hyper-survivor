// ============ SOUND SYSTEM (Web Audio API) ============
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;

function initAudio() {
  if (audioCtx) return;
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

// ============ KAVINSKY-STYLE DARK SYNTHWAVE ENGINE ============
let musicPlaying = false;
let musicNodes = [];
let musicScheduler = null;
let musicBeat = 0;

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

function startMusic() {
  if (!audioCtx || musicPlaying) return;
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
  musicPlaying = false;
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


