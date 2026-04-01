// ============ SHOP ============
let shopWeapons = [];


function generateFullShop() {
  // Show ALL base weapons (not just unowned)
  shopWeapons = Object.entries(WEAPONS)
    .filter(([id, w]) => !w.isEvolution && !w.hidden && w.cost > 0)
    .map(([id, w]) => ({ id, ...w }));
}

function getUpgradeCost(level) { return 50 + level * 30; }
function getSellValue(w) { const def = WEAPONS[w.id]; return Math.floor((def ? def.cost : 50) * 0.5); }

// Weapon stat display for shop
function _weaponStatsHTML(def, level, nextLevel) {
  const cur = typeof getWeaponRuntimeStats === 'function' ? getWeaponRuntimeStats(def.id, level || 1) : def;
  const nxt = nextLevel && typeof getWeaponRuntimeStats === 'function' ? getWeaponRuntimeStats(def.id, nextLevel) : null;
  const dmg = Math.round((cur && cur.dmg) || def.dmg || 0);
  const rate = (1 / Math.max(0.0001, (cur && cur.cd) || def.cd || 1)).toFixed(1);
  let html = '';

  // DMG — with upgrade delta if nextLevel provided
  if (nxt) {
    const nxtDmg = Math.round(nxt.dmg || 0);
    html += `<span class="ws ws-dmg">⚔${dmg}→<b>${nxtDmg}</b></span>`;
  } else {
    html += `<span class="ws ws-dmg">⚔${dmg}</span>`;
  }

  // Rate (coups/sec)
  if (nxt) {
    const nxtRate = (1 / Math.max(0.0001, nxt.cd || 1)).toFixed(1);
    html += `<span class="ws ws-rate">⚡${rate}→<b>${nxtRate}</b>/s</span>`;
  } else {
    html += `<span class="ws ws-rate">⚡${rate}/s</span>`;
  }

  // Range/portee selon le type
  if (cur.area) html += `<span class="ws ws-range">◎${Math.round(cur.area)}</span>`;
  else if (cur.orbitRadius) html += `<span class="ws ws-range">⟳${Math.round(cur.orbitRadius)}</span>`;
  else if (cur.spd) html += `<span class="ws ws-range">◎${Math.round(cur.spd)}</span>`;

  // Stats speciales
  if (cur.pierce && cur.pierce > 1) html += `<span class="ws ws-special">↣${cur.pierce}</span>`;
  if (cur.cnt && cur.cnt > 1) html += `<span class="ws ws-special">×${cur.cnt}</span>`;
  if (cur.bounces) html += `<span class="ws ws-special">↺${cur.bounces}</span>`;
  if (cur.explodeArea) html += `<span class="ws ws-special">✹${Math.round(cur.explodeArea)}</span>`;
  if (cur.type === 'homing') html += `<span class="ws ws-special">HOMING</span>`;
  if (cur.type === 'puddle') html += `<span class="ws ws-special">ZONE</span>`;
  if (cur.burnDmg) html += `<span class="ws ws-special">BURN ${Math.round(cur.burnDmg)}/s</span>`;

  return html;
}

function makeShopRow(icon, name, desc, costText, isMaxed, isSold, cantAfford, statsHTML) {
  const cls = ['shop-row-item'];
  if (isSold) cls.push('sold');
  if (cantAfford && !isSold) cls.push('cant-afford');
  const div = document.createElement('div');
  div.className = cls.join(' ');
  const statsRow = statsHTML ? `<div class="sri-stats">${statsHTML}</div>` : '';
  div.innerHTML = `<div class="sri-icon">${icon}</div><div class="sri-info"><div class="sri-name">${name}</div><div class="sri-desc">${desc}</div>${statsRow}</div><div class="sri-cost${isMaxed ? ' maxed' : ''}">${costText}</div>`;
  return div;
}

function renderShop() {
  document.getElementById('shop-gold-val').textContent = G.gold;

  // Inventory display with sell buttons
  const inv = document.getElementById('inv'); inv.innerHTML = '';
  P.weapons.forEach((w, idx) => {
    const slot = document.createElement('div');
    slot.className = 'inv-slot filled';
    const def = WEAPONS[w.id];
    if (def) {
      const sellVal = getSellValue(w);
      const canSell = P.weapons.length > 1;
      const lvlTag = typeof renderWeaponLevelTag === 'function' ? renderWeaponLevelTag(w.level, 'weapon-level-chip-compact') : `Lv${w.level}`;
      slot.innerHTML = `<div class="wep-icon">${def.icon}</div><div class="wep-lvl">${lvlTag}</div>${canSell ? `<div class="inv-sell" title="Sell for ${sellVal} gold">✕</div>` : ''}`;
      if (canSell) {
        slot.querySelector('.inv-sell').onclick = (e) => {
          e.stopPropagation();
          G.gold += sellVal;
          P.weapons.splice(idx, 1);
          playSound('pickup');
          renderShop();
        };
      }
    }
    inv.appendChild(slot);
  });
  for (let i = P.weapons.length; i < P.maxWeapons; i++) {
    const slot = document.createElement('div');
    slot.className = 'inv-slot';
    slot.innerHTML = '<div class="wep-icon" style="opacity:0.15">+</div>';
    inv.appendChild(slot);
  }

  // === PLAYER STATS RECAP ===
  const psBar = document.getElementById('player-stats-bar');
  if (psBar) {
    psBar.innerHTML = typeof getPlayerSkillCardsHTML === 'function' ? getPlayerSkillCardsHTML(P) : '';
  }

  // === BUY / UPGRADE WEAPONS ===
  const wepsEl = document.getElementById('shop-weps'); wepsEl.innerHTML = '';
  for (const sw of shopWeapons) {
    const owned = P.weapons.find(w => w.id === sw.id);
    const isMax = owned && owned.level >= 8;
    let cost, label, desc, stats;
    if (owned) {
      cost = getUpgradeCost(owned.level);
      label = isMax ? 'MAX ✓' : `${cost} ${ICO.gold}`;
      if (isMax) {
        desc = 'MAX LEVEL';
        stats = _weaponStatsHTML(sw, owned.level);
      } else {
        const summary = typeof getWeaponUpgradeSummary === 'function' ? getWeaponUpgradeSummary(sw.id, owned.level, owned.level + 1) : '+power';
        desc = `Upgrade → Lv${owned.level + 1} • ${summary}`;
        stats = _weaponStatsHTML(sw, owned.level, owned.level + 1);
      }
    } else {
      cost = sw.cost;
      label = `${cost} ${ICO.gold}`;
      desc = sw.desc;
      stats = _weaponStatsHTML(sw, 1);
    }
    const cantAfford = G.gold < cost;
    const nameText = owned
      ? `${sw.name} ${typeof renderWeaponLevelInline === 'function' ? renderWeaponLevelInline(owned.level) : `Lv${owned.level}`}`
      : sw.name;
    const item = makeShopRow(sw.icon, nameText, desc, label, isMax, isMax, cantAfford, stats);
    if (!isMax) {
      item.onclick = () => {
        if (G.gold < cost) return;
        if (owned) {
          // Upgrade existing
          G.gold -= cost;
          owned.level++;
          playSound('pickup');
        } else if (P.weapons.length < P.maxWeapons) {
          // Buy new
          G.gold -= cost;
          P.weapons.push({ id: sw.id, level: 1, cd: 0 });
          playSound('pickup');
        }
        renderShop();
      };
    }
    wepsEl.appendChild(item);
  }

  // === STAT UPGRADES ===
  const upEl = document.getElementById('shop-upgrades'); upEl.innerHTML = '';
  for (let ui = 0; ui < UPGRADES.length; ui++) {
    const up = UPGRADES[ui];
    const cantAfford = G.gold < up.cost;
    const preview = up.skillId && typeof getPlayerSkillPreview === 'function'
      ? getPlayerSkillPreview(up.skillId, P, 'shop')
      : null;
    const descText = preview
      ? `${up.desc} (${up.label}: ${preview.before}→${preview.after})`
      : up.desc;
    const item = makeShopRow(up.icon, up.name, descText, `${up.cost} ${ICO.gold}`, false, false, cantAfford);
    item.onclick = () => { if (G.gold >= up.cost) { G.gold -= up.cost; up.apply(); playSound('pickup'); renderShop(); } };
    upEl.appendChild(item);
  }


  // Persistent shop only.
  const btn = document.getElementById('btn-next-stage');
  btn.textContent = 'CLOSE SHOP [B]';
}

function showShopUI() {
  G.phase = 'shop';
  generateFullShop();
  renderShop();
  document.querySelectorAll('.mo').forEach(m => m.classList.add('h'));
  document.getElementById('shop').classList.remove('h');
  document.getElementById('boss-bar').classList.add('h');
  document.getElementById('boss-intro').classList.add('h');
}

function openPersistentShop() {
  if (G.phase !== 'wave' && G.phase !== 'boss' && G.phase !== 'bossIntro' && G.phase !== 'waveIntro') return;

  G.prevPhase = G.phase;
  G.shopMode = 'persistent';
  showShopUI();
}

function closePersistentShop() {
  document.getElementById('shop').classList.add('h');
  G.phase = G.prevPhase || 'wave';
  G.prevPhase = null;
  lastT = performance.now();
  requestAnimationFrame(loop);
}

window.shopWeapons = shopWeapons;
window.UPGRADES = UPGRADES;
window.getUpgradeCost = getUpgradeCost;
window.getSellValue = getSellValue;
window.makeShopRow = makeShopRow;
window._weaponStatsHTML = _weaponStatsHTML;
window.generateFullShop = generateFullShop;
window.renderShop = renderShop;
window.showShopUI = showShopUI;
window.openPersistentShop = openPersistentShop;
window.closePersistentShop = closePersistentShop;
