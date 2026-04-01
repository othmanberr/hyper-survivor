// ============ PLAYER SKILLS ============
// Player-wide passive stats. These never belong to a single weapon.

const PLAYER_SKILL_ORDER = ['max_hp', 'speed', 'armor', 'crit', 'attack_speed', 'damage', 'knockback', 'dodge'];

function roundPlayerSkillScore(value) {
  return Math.max(0, Math.round(value || 0));
}

function formatPlayerSkillScoreValue(value) {
  return `${roundPlayerSkillScore(value)}`;
}

function escapePlayerSkillHTML(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PLAYER_SKILLS = {
  max_hp: {
    id: 'max_hp',
    name: 'Max HP',
    short: 'HP',
    icon: ICO.hp,
    levelRarity: 'common',
    levelWeight: 10,
    levelDesc: '+25 Max HP',
    shopName: 'HP+',
    shopDesc: '+20 Max HP & Heal',
    shopCost: 200,
    getValue: (player) => player.maxHp || 0,
    getScore: (player) => player.maxHp || 100,
    format: (value) => `${Math.round(value)} HP`,
    applyLevel(player) {
      player.maxHp += 25;
      player.hp = Math.min(player.maxHp, player.hp + 25);
    },
    applyShop(player) {
      player.maxHp += 20;
      player.hp = Math.min(player.maxHp, player.hp + 20);
    }
  },
  speed: {
    id: 'speed',
    name: 'Speed',
    short: 'SPD',
    icon: ICO.speed,
    levelRarity: 'common',
    levelWeight: 12,
    levelDesc: '+20 move speed',
    shopName: 'SPEED+',
    shopDesc: '+10 move speed',
    shopCost: 120,
    getValue: (player) => player.spd || 0,
    getScore: (player) => (player.spd || 200) / 2,
    format: (value) => `${Math.round(value)} MOVE`,
    applyLevel(player) { player.spd += 20; },
    applyShop(player) { player.spd += 10; }
  },
  armor: {
    id: 'armor',
    name: 'Armor',
    short: 'ARM',
    icon: ICO.armor,
    levelRarity: 'common',
    levelWeight: 10,
    levelDesc: '+3 armor',
    shopName: 'ARMOR+',
    shopDesc: '+1 damage reduction',
    shopCost: 150,
    getValue: (player) => player.armor || 0,
    getScore: (player) => 100 + (player.armor || 0) * 10,
    format: (value) => `${Math.round(value)} ARM`,
    applyLevel(player) { player.armor += 3; },
    applyShop(player) { player.armor += 1; }
  },
  crit: {
    id: 'crit',
    name: 'Crit',
    short: 'CRIT',
    icon: ICO.crit,
    levelRarity: 'rare',
    levelWeight: 8,
    levelDesc: '+8% crit chance',
    shopName: 'CRIT+',
    shopDesc: '+2% crit chance',
    shopCost: 180,
    getValue: (player) => player.crit || 0,
    getScore: (player) => 100 + Math.max(0, (player.crit || 5) - 5) * 4,
    format: (value) => `${Math.round(value)}%`,
    applyLevel(player) { player.crit = Math.min(100, (player.crit || 0) + 8); },
    applyShop(player) { player.crit = Math.min(100, (player.crit || 0) + 2); }
  },
  attack_speed: {
    id: 'attack_speed',
    name: 'Attack Speed',
    short: 'ATK SPD',
    icon: ICO.atkspd,
    levelRarity: 'epic',
    levelWeight: 4,
    levelDesc: '-10% cooldown',
    shopName: 'ATK SPD+',
    shopDesc: '+5% fire rate',
    shopCost: 250,
    getValue: (player) => 100 / Math.max(0.0001, player.cdMult || 1),
    getScore: (player) => 100 / Math.max(0.0001, player.cdMult || 1),
    format: (value) => `${Math.round(value)}% RATE`,
    applyLevel(player) { player.cdMult = Math.max(0.35, (player.cdMult || 1) * 0.9); },
    applyShop(player) { player.cdMult = Math.max(0.35, (player.cdMult || 1) * 0.95); }
  },
  damage: {
    id: 'damage',
    name: 'Damage',
    short: 'DMG',
    icon: ICO.power,
    levelRarity: 'rare',
    levelWeight: 7,
    levelDesc: '+15% damage',
    shopName: 'DMG+',
    shopDesc: '+8% damage',
    shopCost: 220,
    getValue: (player) => (player.dmgMult || 1) * 100,
    getScore: (player) => (player.dmgMult || 1) * 100,
    format: (value) => `${Math.round(value)}% DMG`,
    applyLevel(player) { player.dmgMult = (player.dmgMult || 1) + 0.15; },
    applyShop(player) { player.dmgMult = (player.dmgMult || 1) + 0.08; }
  },
  knockback: {
    id: 'knockback',
    name: 'Knockback',
    short: 'KB',
    icon: ICO.knockback,
    levelRarity: 'rare',
    levelWeight: 6,
    levelDesc: '+15% knockback force',
    shopName: 'KB+',
    shopDesc: '+8% knockback force',
    shopCost: 190,
    getValue: (player) => (player.kbMult || 1) * 100,
    getScore: (player) => (player.kbMult || 1) * 100,
    format: (value) => `${Math.round(value)}% KB`,
    applyLevel(player) { player.kbMult = Math.min(3, (player.kbMult || 1) * 1.15); },
    applyShop(player) { player.kbMult = Math.min(3, (player.kbMult || 1) * 1.08); }
  },
  dodge: {
    id: 'dodge',
    name: 'Dodge',
    short: 'DODGE',
    icon: ICO.dodge,
    levelRarity: 'rare',
    levelWeight: 6,
    levelDesc: '+6% dodge chance',
    shopName: 'DODGE+',
    shopDesc: '+4% dodge chance',
    shopCost: 240,
    getValue: (player) => player.dodge || 0,
    getScore: (player) => 100 + (player.dodge || 0) * 2,
    format: (value) => `${Math.round(value)}%`,
    applyLevel(player) { player.dodge = Math.min(60, (player.dodge || 0) + 6); },
    applyShop(player) { player.dodge = Math.min(60, (player.dodge || 0) + 4); }
  }
};

function getPlayerSkill(skillId) {
  return PLAYER_SKILLS[skillId] || null;
}

function getAllPlayerSkills() {
  return PLAYER_SKILL_ORDER.map((skillId) => PLAYER_SKILLS[skillId]).filter(Boolean);
}

function getPlayerSkillValue(skillId, player) {
  const skill = getPlayerSkill(skillId);
  const target = player || P;
  if (!skill || !target) return 0;
  return skill.getValue(target);
}

function getPlayerSkillScore(skillId, player) {
  const skill = getPlayerSkill(skillId);
  const target = player || P;
  if (!skill || !target) return 0;
  if (typeof skill.getScore === 'function') return skill.getScore(target);
  return skill.getValue(target);
}

function formatPlayerSkillValue(skillId, player) {
  const skill = getPlayerSkill(skillId);
  if (!skill) return '';
  return skill.format(getPlayerSkillValue(skillId, player || P));
}

function formatPlayerSkillScore(skillId, player) {
  return formatPlayerSkillScoreValue(getPlayerSkillScore(skillId, player || P));
}

function clonePlayerSkillState(player) {
  return {
    maxHp: player.maxHp,
    hp: player.hp,
    spd: player.spd,
    armor: player.armor,
    crit: player.crit,
    cdMult: player.cdMult,
    dmgMult: player.dmgMult,
    kbMult: player.kbMult,
    dodge: player.dodge
  };
}

function applyPlayerSkillUpgrade(player, skillId, source) {
  const skill = getPlayerSkill(skillId);
  if (!skill || !player) return;
  if (source === 'shop') skill.applyShop(player);
  else skill.applyLevel(player);
}

function getPlayerSkillPreview(skillId, player, source) {
  const skill = getPlayerSkill(skillId);
  const target = player || P;
  if (!skill || !target) return { before: '', after: '' };
  const preview = clonePlayerSkillState(target);
  applyPlayerSkillUpgrade(preview, skillId, source || 'shop');
  return {
    before: formatPlayerSkillScoreValue(skill.getScore ? skill.getScore(target) : skill.getValue(target)),
    after: formatPlayerSkillScoreValue(skill.getScore ? skill.getScore(preview) : skill.getValue(preview)),
    beforeDetail: skill.format(skill.getValue(target)),
    afterDetail: skill.format(skill.getValue(preview))
  };
}

function buildPlayerLevelUpChoices() {
  return getAllPlayerSkills().map((skill) => ({
    id: `skill_${skill.id}`,
    type: 'stat',
    skillId: skill.id,
    name: skill.name,
    icon: skill.icon,
    desc: skill.levelDesc,
    rarity: skill.levelRarity,
    weight: skill.levelWeight
  }));
}

function buildShopStatUpgrades() {
  return getAllPlayerSkills().map((skill) => ({
    id: `shop_${skill.id}`,
    skillId: skill.id,
    name: skill.shopName,
    label: skill.short,
    icon: skill.icon,
    desc: skill.shopDesc,
    cost: skill.shopCost,
    apply: () => applyPlayerSkillUpgrade(P, skill.id, 'shop')
  }));
}

function getPlayerSkillCards(player) {
  const target = player || P;
  return getAllPlayerSkills().map((skill) => ({
    id: skill.id,
    name: skill.name,
    icon: skill.icon,
    label: skill.short,
    value: formatPlayerSkillScoreValue(skill.getScore ? skill.getScore(target) : skill.getValue(target)),
    detail: skill.format(skill.getValue(target))
  }));
}

function getPlayerSkillCardsHTML(player) {
  return getPlayerSkillCards(player).map((card) => `
    <div class="ps-stat" title="${escapePlayerSkillHTML(card.name)}: ${escapePlayerSkillHTML(card.detail)}">
      <span class="ps-icon">${card.icon}</span>
      <span class="ps-val">${escapePlayerSkillHTML(card.value)}</span>
      <span class="ps-label">${escapePlayerSkillHTML(card.label)}</span>
      <span class="ps-detail">${escapePlayerSkillHTML(card.detail)}</span>
    </div>
  `).join('');
}

const UPGRADES = buildShopStatUpgrades();

window.PLAYER_SKILL_ORDER = PLAYER_SKILL_ORDER;
window.PLAYER_SKILLS = PLAYER_SKILLS;
window.getPlayerSkill = getPlayerSkill;
window.getAllPlayerSkills = getAllPlayerSkills;
window.getPlayerSkillValue = getPlayerSkillValue;
window.getPlayerSkillScore = getPlayerSkillScore;
window.formatPlayerSkillValue = formatPlayerSkillValue;
window.formatPlayerSkillScore = formatPlayerSkillScore;
window.applyPlayerSkillUpgrade = applyPlayerSkillUpgrade;
window.getPlayerSkillPreview = getPlayerSkillPreview;
window.buildPlayerLevelUpChoices = buildPlayerLevelUpChoices;
window.getPlayerSkillCards = getPlayerSkillCards;
window.getPlayerSkillCardsHTML = getPlayerSkillCardsHTML;
window.UPGRADES = UPGRADES;
