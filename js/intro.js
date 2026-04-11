// ============ CINEMATIC STORY SEQUENCE ============
// Narrative transitions based on the Game Design Document

let isPlayingIntro = false;

const NARRATIVE_TEXTS = {
  prologue: "In 2008, a genesis block was mined. It was a promise of fairness, a way out of the corrupt financial system. But humans do what they do best: they took this utopia and turned it into a digital cesspool. Web3 became a grimy megalopolis, a giant casino ruled by greed, false promises, and white-collar scammers. The original creators fled, replaced by parasites draining the life of millions. Amidst this rot, one man walks alone. His name is Jeff. He is neither a hero nor a savior. Tonight, he descends into the bowels of the machine. The time for the purge has come.",

  stages: [
    // Stage 1
    "The heavy doors of Sector Zero open with a metallic screech. Before him lie the ruins of the first mass frauds: the ICOs of 2017. Once, financial revolutions were sold here for millions of dollars on simple false promises. Today, it is nothing but a massive industrial scrapyard drowning in toxic rain. Hordes of ruined investors, turned into empty, rabid shells, wander among the carcasses of abandoned servers. Atop this dump, the echo of an old scammer still rings out: Carlos screams his slogans to anyone who will listen. The cleanup begins here.",
    // Stage 2
    "The smell of the toxic jungle mixes with cold cigar smoke. The Yacht Club isn't what it used to be. They thought owning a picture of an ape would grant them immortality, while the network's foundations rotted beneath their feet. The solid gold primates parade among their digital vines, convinced they are the elite. Their 'Smart Contracts' are gilded cages. One man steps forward to show them what their art is really worth when set on fire.",
    // Stage 3
    "The higher you climb in the strata of this city, the louder the lies become. In these penthouses, truth is measured in follower counts. Logan and his clique sold their own audience to fund holographic boxing rings. Influencers turned into dime-store kings, hatching poisoned eggs for their blind disciples. Their scam was a closed zoo. But the predator they hadn't planned for just kicked down the door.",
    // Stage 4
    "A siren wails in the void of the server room. The Algorithm is collapsing. Do Kwon thought he could code gravity, convinced his arrogance would be enough to keep his empire afloat. Now, everything is being sucked into his Death Spiral. The money of millions of lives evaporates into nothingness because of a corrupted equation. He hides in the shadows of his own code. The hunt has begun, and the system will be forced to shut down.",
    // Stage 5
    "The realm of the absurd opens before him. Digital blood flows on the neon carpets of the Supercycle. It's a casino where dogs and frogs decide the fate of men. Murad floats above this madness, preaching the gospel of the absolute void. They replaced finance with a meme, a cruel joke that only makes them laugh. Someone is going to have to wipe the smile off the network's face.",
    // Stage 6
    "A sumptuous palace, carved in pure gold. But when you scratch the surface, there's nothing. The absolute void. Ruja, the Phantom Queen, pulled off the greatest magic trick in this world: disappearing with billions without ever delivering a single line of code. Her promoters continue to dance in the holographic corridors. She thinks she can escape the sentence by making herself invisible. But the red blade will find her heart, even in the darkness.",
    // Stage 7
    "The biting cold penetrates the mercenary's armor. 'Unbank yourself,' Mashinsky said. His promise turned into an absolute zero vault, freezing the life savings of millions. His victims became ice golems, imprisoned in his lies. The ice machine thinks it can slow down justice. But the heat of the steel burns at a thousand degrees. The ice pack will melt under his blows.",
    // Stage 8
    "It smells like burnt paper and paranoia. The offices are full of fake evidence and court orders. Craig hides behind a mountain of lies, wearing the crown of a king he never was. The usurper wants to rewrite history with threats, appropriating the genius of others with a grotesque cardboard mask. The plagiarism tribunal is in session. The blade will be the judge's gavel, and the sentence will be irrevocable.",
    // Stage 9
    "Beneath the fine sand of the Bahamas lay a labyrinth of corruption. The child prodigy, SBF, played the god of altruism while siphoning the vaults out the back door. The tropical complex is nothing but a rotten matrix, fueled by amphetamines and delusions of grandeur. He whimpers behind his holographic shield, swearing he didn't know. But the purge knows no pity. Someone is about to close all his backdoors.",
    // Stage 10
    "The orbital elevator stops. The summit of the centralized citadel. A cosmic storm rages around the yellow and black logo. CZ, the Emperor of Volume, awaits his visitor. He controls everything. If he cuts the flow, reality stops. He is the absolute centralization that the genesis block swore to destroy. This is the final exam. The ultimate bulwark before we can rebuild. The horde is endless, but so is the determination of the man stepping forward. He is going to unplug the master of the world."
  ],

  epilogue: "Silence. Finally. The four-armed colossus has collapsed, and with it, the storm has dissipated. The centralized logo is nothing more than a puddle of molten metal. The black blood of the scammers has been washed away by the rain. The network is silent. Purified. The man sheathes his weapon. In the center of the platform, he places the original core, the pure essence of the code. The ground trembles. Before him, rising toward the stars, a new sanctuary takes shape. Built on transparency, mathematical truth, and fairness. No kings, no gurus. Only code. The era of the scammers is over. Welcome to the House of Finance."
};

const STAGE_INTRO_THEMES = [
  { slug: 'sector-zero', motif: 'rain', stageLabel: 'STAGE 01', title: 'SECTOR ZERO', subtitle: 'ICO SCRAPYARD / TOXIC RAIN' },
  { slug: 'yacht-club', motif: 'canopy', stageLabel: 'STAGE 02', title: 'YACHT CLUB', subtitle: 'GILDED JUNGLE / BURNED STATUS' },
  { slug: 'penthouse-zoo', motif: 'penthouses', stageLabel: 'STAGE 03', title: 'PENTHOUSE ZOO', subtitle: 'INFLUENCER SPIRES / HOLLOW FAME' },
  { slug: 'death-spiral', motif: 'spiral', stageLabel: 'STAGE 04', title: 'DEATH SPIRAL', subtitle: 'SERVER VOID / COLLAPSING ALGORITHM' },
  { slug: 'supercycle', motif: 'casino', stageLabel: 'STAGE 05', title: 'SUPERCYCLE', subtitle: 'MEME CASINO / NEON DELIRIUM' },
  { slug: 'phantom-palace', motif: 'palace', stageLabel: 'STAGE 06', title: 'PHANTOM PALACE', subtitle: 'GOLDEN HALLS / VANISHING QUEEN' },
  { slug: 'absolute-zero', motif: 'frost', stageLabel: 'STAGE 07', title: 'ABSOLUTE ZERO', subtitle: 'FROZEN VAULT / BANKRUPT ICE' },
  { slug: 'tribunal', motif: 'tribunal', stageLabel: 'STAGE 08', title: 'PLAGIARISM TRIBUNAL', subtitle: 'BURNT FILES / PAPER PARANOIA' },
  { slug: 'bahamas-matrix', motif: 'lagoon', stageLabel: 'STAGE 09', title: 'BAHAMAS MATRIX', subtitle: 'TROPICAL ROT / CORRUPTED VAULTS' },
  { slug: 'citadel', motif: 'orbital', stageLabel: 'STAGE 10', title: 'CENTRALIZED CITADEL', subtitle: 'ORBITAL STORM / FINAL EXAM' }
];

const GLITCH_CHARS = '░▒▓█▌▐│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬';

function _randomGlitchChar() {
  return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
}

function _narrativeTypewriter(container, text, bps, onDone) {
  const el = document.createElement('div');
  el.className = 'narrative-text';
  container.appendChild(el);

  const chars = text.split('');
  const interval = 1000 / bps; // bytes per second
  let idx = 0;

  const timer = setInterval(() => {
    if (idx >= chars.length) {
      clearInterval(timer);
      el.textContent = text;
      el.classList.add('narrative-done');
      if (onDone) onDone();
      return;
    }

    // Show glitch chars ahead of the real reveal
    let display = text.substring(0, idx + 1);
    const remaining = Math.min(2, chars.length - idx - 1);
    for (let g = 0; g < remaining; g++) {
      display += _randomGlitchChar();
    }
    el.textContent = display;

    // Random glitch sound effect occasionally
    if (Math.random() < 0.05) {
      playSound('introGlitch');
    }

    idx++;
  }, interval);

  return {
    finishNow: () => {
      clearInterval(timer);
      el.textContent = text;
      el.classList.add('narrative-done');
      if (onDone) onDone();
    }
  };
}

let _introSkipHandler = null;
let _currentTypewriter = null;
let _isTyping = false;

function _stopNarrative() {
  const introEl = document.getElementById('stage-intro');
  introEl.classList.add('h');
  introEl.innerHTML = '';
  isPlayingIntro = false;
  if (_introSkipHandler) {
    document.removeEventListener('keydown', _introSkipHandler);
    _introSkipHandler = null;
  }
}

function _buildNarrativeBackdrop(introEl, theme) {
  if (!theme) return;

  introEl.classList.add('intro-theme-active', `intro-theme-${theme.slug}`);

  const backdrop = document.createElement('div');
  backdrop.className = `intro-backdrop intro-backdrop--${theme.motif}`;

  const haze = document.createElement('div');
  haze.className = 'intro-backdrop-haze';
  backdrop.appendChild(haze);

  const pattern = document.createElement('div');
  pattern.className = 'intro-backdrop-pattern';
  backdrop.appendChild(pattern);

  const sigil = document.createElement('div');
  sigil.className = 'intro-backdrop-sigil';
  backdrop.appendChild(sigil);

  const chips = document.createElement('div');
  chips.className = 'intro-chip-cloud';
  const chipCount = 12;
  for (let i = 0; i < chipCount; i++) {
    const chip = document.createElement('span');
    chip.className = 'intro-chip';
    chip.style.setProperty('--chip-x', `${8 + ((i * 17 + theme.slug.length * 11) % 84)}%`);
    chip.style.setProperty('--chip-y', `${10 + ((i * 23 + theme.stageLabel.length * 7) % 72)}%`);
    chip.style.setProperty('--chip-size', `${18 + ((i * 9 + theme.slug.length * 3) % 30)}px`);
    chip.style.setProperty('--chip-delay', `${(i % 6) * 0.35}s`);
    chip.style.setProperty('--chip-drift', `${10 + (i % 5) * 6}px`);
    chips.appendChild(chip);
  }
  backdrop.appendChild(chips);

  const vignette = document.createElement('div');
  vignette.className = 'intro-vignette';
  backdrop.appendChild(vignette);

  introEl.appendChild(backdrop);
}

function _buildNarrativeMeta(theme) {
  if (!theme) return null;
  const meta = document.createElement('div');
  meta.className = 'intro-stage-meta';
  meta.innerHTML = `
    <div class="intro-stage-kicker">${theme.stageLabel}</div>
    <div class="intro-stage-title">${theme.title}</div>
    <div class="intro-stage-sub">${theme.subtitle}</div>
  `;
  return meta;
}

function playNarrative(text, align, themeOrOnComplete, maybeOnComplete) {
  let theme = null;
  let onComplete = null;
  if (typeof themeOrOnComplete === 'function' || themeOrOnComplete === undefined) {
    onComplete = themeOrOnComplete || null;
  } else {
    theme = themeOrOnComplete;
    onComplete = maybeOnComplete || null;
  }

  isPlayingIntro = true;

  const introEl = document.getElementById('stage-intro');
  introEl.classList.remove('h');
  introEl.innerHTML = '';
  introEl.className = 'cinematic-narrative'; // reset classes

  _buildNarrativeBackdrop(introEl, theme);

  // Create scanlines
  const scanline = document.createElement('div');
  scanline.className = 'intro-scanline';
  introEl.appendChild(scanline);

  // Add container for text
  const textContainer = document.createElement('div');
  textContainer.className = 'narrative-container';
  if (align) textContainer.style.textAlign = align;

  const meta = _buildNarrativeMeta(theme);
  if (meta) textContainer.appendChild(meta);
  introEl.appendChild(textContainer);

  const skipHint = document.createElement('div');
  skipHint.className = 'intro-skip-hint';
  skipHint.textContent = 'PRESS SPACE TO CONTINUE';
  introEl.appendChild(skipHint);

  _isTyping = true;

  _introSkipHandler = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (_isTyping) {
        // Fast forward text
        if (_currentTypewriter) _currentTypewriter.finishNow();
      } else {
        // Close screen
        _stopNarrative();
        if (onComplete) onComplete();
      }
    }
  };
  document.addEventListener('keydown', _introSkipHandler);

  playSound('introHit');

  // Start typewriter shortly after black screen
  setTimeout(() => {
    _currentTypewriter = _narrativeTypewriter(textContainer, text, 40, () => {
      _isTyping = false;
      skipHint.classList.add('visible'); // Show "Press space" only after typing is done or skipped
    });
  }, 500);
}

function playStageIntro(stageIndex, onComplete) {
  if (window.__HS_QA_MODE) {
    if (typeof onComplete === 'function') onComplete();
    return;
  }
  // If no specific stage text, skip or use generic
  const text = NARRATIVE_TEXTS.stages[stageIndex] || `Proceeding to Area ${stageIndex + 1}...`;
  const theme = STAGE_INTRO_THEMES[stageIndex] || null;
  playNarrative(text, 'left', theme, onComplete);
}
