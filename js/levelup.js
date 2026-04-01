// ============ VAMPIRE SURVIVORS STYLE LEVEL-UP SYSTEM ============
// With Evolution mechanic at max weapon level

const LEVEL_UP_POOL = [
  // Weapons (base weapons only, excluding pistol = starting weapon)
  { id: 'new_shotgun', type: 'weapon', weaponId: 'shotgun', name: 'Shotgun', icon: '', desc: 'Close-range scatter', rarity: 'common', weight: 10 },
  { id: 'new_smg', type: 'weapon', weaponId: 'smg', name: 'SMG', icon: '', desc: 'Rapid-fire spray', rarity: 'common', weight: 8 },
  { id: 'new_crossbow', type: 'weapon', weaponId: 'crossbow', name: 'Rail Spiker', icon: '', desc: 'Heavy piercing spikes', rarity: 'rare', weight: 8 },
  { id: 'new_katana', type: 'weapon', weaponId: 'redcandle', name: 'Mono Katana', icon: '', desc: 'Fast arc blade', rarity: 'rare', weight: 7 },
  { id: 'new_flamethrower', type: 'weapon', weaponId: 'flamethrower', name: 'Flamethrower', icon: '', desc: 'Short-range fire cone', rarity: 'rare', weight: 7 },
  { id: 'new_firewall', type: 'weapon', weaponId: 'firewallLauncher', name: 'Firewall Launcher', icon: '', desc: 'Burning denial zones', rarity: 'rare', weight: 7 },
  { id: 'new_grenade', type: 'weapon', weaponId: 'grenadeLauncher', name: 'Grenade Launcher', icon: '', desc: 'Arcing splash burst', rarity: 'epic', weight: 6 },
  { id: 'new_axe', type: 'weapon', weaponId: 'axe', name: 'Throwing Axe', icon: '', desc: 'Spinning axe', rarity: 'epic', weight: 6 },
];

const LEVEL_UP_AUTO_RARITY_SCORE = {
  legendary: 60,
  epic: 34,
  rare: 18,
  common: 8
};

const LEVEL_UP_AUTO_SKILL_SCORE = {
  attack_speed: 18,
  damage: 17,
  knockback: 14,
  crit: 13,
  max_hp: 12,
  speed: 11,
  armor: 9,
  dodge: 8
};

function generateLevelUpChoices(P, WEAPONS, count) {
  count = count || 3;
  const choices = [];
  const pool = [];
  const statChoices = typeof buildPlayerLevelUpChoices === 'function' ? buildPlayerLevelUpChoices() : [];

  for (const item of LEVEL_UP_POOL) {
    // Skip weapons player already has
    if (item.type === 'weapon' && P.weapons.find(w => w.id === item.weaponId)) continue;
    // Skip new weapons if at max
    if (item.type === 'weapon' && P.weapons.length >= P.maxWeapons) continue;

    // Use the dynamically generated pixel art icon for weapons
    let poolItem = item;
    if (item.type === 'weapon' && typeof WEAPONS !== 'undefined' && WEAPONS[item.weaponId]) {
      if (WEAPONS[item.weaponId].hidden) continue;
      poolItem = { ...item, icon: WEAPONS[item.weaponId].icon };
    }

    // Add with weight
    for (let i = 0; i < item.weight; i++) pool.push(poolItem);
  }

  for (const item of statChoices) {
    for (let i = 0; i < item.weight; i++) pool.push(item);
  }

  // Add weapon level ups for owned weapons
  for (const w of P.weapons) {
    const def = WEAPONS[w.id];
    if (!def) continue;
    if (def.hidden) continue;

    if (w.level < 8) {
      const upgradeDesc = typeof getWeaponUpgradeSummary === 'function'
        ? getWeaponUpgradeSummary(w.id, w.level, w.level + 1)
        : '+20% damage';
      const upgrade = {
        id: `upgrade_${w.id}`,
        type: 'weaponUpgrade',
        weaponId: w.id,
        name: `${def.name} Lv${w.level + 1}`,
        icon: def.icon,
        desc: upgradeDesc,
        rarity: w.level >= 5 ? 'epic' : w.level >= 3 ? 'rare' : 'common',
        weight: 8,
      };
      for (let i = 0; i < upgrade.weight; i++) pool.push(upgrade);
    }

    // Evolution: weapon at max level + has evolution path + not already evolved
    if (w.level >= 8 && def.evolvesTo && !w.evolved) {
      const evoDef = WEAPONS[def.evolvesTo];
      if (evoDef) {
        const evo = {
          id: `evolve_${w.id}`,
          type: 'evolution',
          weaponId: w.id,
          evoId: def.evolvesTo,
          name: `⬆ ${evoDef.name}`,
          icon: evoDef.icon,
          desc: evoDef.desc,
          rarity: 'legendary',
          weight: 20, // High weight — evolution should appear frequently when available
        };
        for (let i = 0; i < evo.weight; i++) pool.push(evo);
      }
    }
  }

  // Weighted random selection without duplicates
  const used = new Set();
  while (choices.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const item = pool[idx];
    if (!used.has(item.id)) {
      used.add(item.id);
      choices.push(item);
    }
    // Remove all instances of this item from pool
    for (let i = pool.length - 1; i >= 0; i--) {
      if (pool[i].id === item.id) pool.splice(i, 1);
    }
  }

  return choices;
}

function applyLevelUpChoice(choice, P, WEAPONS) {
  if (choice.type === 'weapon') {
    P.weapons.push({ id: choice.weaponId, level: 1, cd: 0 });
  } else if (choice.type === 'weaponUpgrade') {
    const w = P.weapons.find(w => w.id === choice.weaponId);
    if (w) w.level++;
  } else if (choice.type === 'evolution') {
    const w = P.weapons.find(w => w.id === choice.weaponId);
    if (w) {
      w.id = choice.evoId;
      w.evolved = true;
      w.level = 1; // Reset level for evolved weapon
      w.cd = 0;
      // VFX
      playSound('levelup');
      triggerSlowmo(0.15, 0.5);
      triggerShake(10, 0.3);
      fxEvolution(P.x, P.y);
      showEvolutionBanner(WEAPONS[choice.evoId].name);
    }
  } else if (choice.type === 'stat' && choice.skillId && typeof applyPlayerSkillUpgrade === 'function') {
    applyPlayerSkillUpgrade(P, choice.skillId, 'levelup');
  } else if (choice.type === 'stat' && choice.apply) {
    choice.apply(P);
  }
}

function autoPickLevelUpChoice(choices, player) {
  if (!choices || !choices.length) return null;
  const target = player || P;
  let best = choices[0];
  let bestScore = -Infinity;

  for (const choice of choices) {
    let score = LEVEL_UP_AUTO_RARITY_SCORE[choice.rarity] || 0;

    if (choice.type === 'evolution') {
      score += 1000;
    } else if (choice.type === 'weapon') {
      score += 260;
      if (target.weapons.length < Math.min(3, target.maxWeapons)) score += 60;
      score -= target.weapons.length * 6;
    } else if (choice.type === 'weaponUpgrade') {
      score += 210;
      const owned = target.weapons.find((w) => w.id === choice.weaponId);
      if (owned) score += owned.level * 7;
    } else if (choice.type === 'stat') {
      score += 120;
      if (choice.skillId) score += LEVEL_UP_AUTO_SKILL_SCORE[choice.skillId] || 0;
    }

    score += (choice.weight || 0) * 0.15;
    score += Math.random() * 0.05;

    if (score > bestScore) {
      bestScore = score;
      best = choice;
    }
  }

  return best;
}

function showAutoLevelUpBanner(choice) {
  if (!choice || choice.type === 'evolution') return;
  const el = document.getElementById('milestone-banner');
  if (!el) return;
  const label = choice.name || 'Upgrade';
  el.classList.remove('h');
  el.innerHTML = `
    <div class="milestone-text">LEVEL UP</div>
    <div style="font-family:'JetBrains Mono';font-size:14px;color:#7ce8ff;letter-spacing:2px;margin-top:6px;animation:milestonePop 1.2s cubic-bezier(0.34,1.56,0.64,1) 0.12s forwards;opacity:0">${label}</div>
  `;
  setTimeout(() => el.classList.add('h'), 1200);
}

function showEvolutionBanner(weaponName) {
  const el = document.getElementById('milestone-banner');
  el.classList.remove('h');
  el.innerHTML = `
    <div class="milestone-text" style="background:linear-gradient(135deg,#ffd700,#ff8800);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 20px rgba(255,200,0,0.6))">EVOLVED!</div>
    <div style="font-family:'JetBrains Mono';font-size:14px;color:#ffd700;letter-spacing:3px;margin-top:6px;animation:milestonePop 1.2s cubic-bezier(0.34,1.56,0.64,1) 0.2s forwards;opacity:0">${weaponName}</div>
  `;
  setTimeout(() => el.classList.add('h'), 2500);
}

function showLevelUpUI(choices, onSelect) {
  const modal = document.getElementById('levelup-modal');
  modal.classList.remove('h');
  modal.innerHTML = `
    <div class="levelup-title">LEVEL UP!</div>
    <div class="levelup-sub">Choose an upgrade <span style="opacity:0.4;font-size:10px">[1/2/3]</span></div>
    <div class="levelup-choices" id="levelup-choices"></div>
  `;

  const container = document.getElementById('levelup-choices');
  const selectChoice = (choice) => {
    modal.classList.add('h');
    // Remove keyboard listener
    document.removeEventListener('keydown', _levelUpKeyHandler);
    onSelect(choice);
  };

  for (let i = 0; i < choices.length; i++) {
    const choice = choices[i];
    const card = document.createElement('div');
    const isEvo = choice.type === 'evolution';
    card.className = 'levelup-card';
    if (isEvo) card.style.cssText = 'border-color:#ffd700;box-shadow:0 0 20px rgba(255,200,0,0.3);';
    card.innerHTML = `
      <div class="card-key">${i + 1}</div>
      <div class="card-icon">${choice.icon}</div>
      <div class="card-name">${choice.name}</div>
      <div class="card-desc">${choice.desc}</div>
      <div class="card-rarity rarity-${choice.rarity}">${choice.rarity.toUpperCase()}</div>
    `;
    card.onclick = () => selectChoice(choice);
    container.appendChild(card);
  }

  // UX 7: Keyboard support — press 1, 2, or 3 to select
  function _levelUpKeyHandler(e) {
    const num = parseInt(e.key);
    if (num >= 1 && num <= choices.length) {
      e.preventDefault();
      selectChoice(choices[num - 1]);
    }
  }
  document.addEventListener('keydown', _levelUpKeyHandler);
}

function hideLevelUpUI() {
  document.getElementById('levelup-modal').classList.add('h');
}
