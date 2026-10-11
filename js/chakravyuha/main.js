// ===========================================================
// CHAKRAVYUHA: THE LABYRINTH OF KINGS
// Main Game Engine Loop, State Manager, Input, Collision,
// Rendering, and UI Bridge.
// ===========================================================

import { sound } from './audio.js';
import { progression, UPGRADE_DEFINITIONS } from './metaprogression.js';
import { FormationManager, RING_DATA } from './formation.js';
import { AstraManager, ASTRA_CONFIG } from './astras.js';
import { Player, Enemy, ParticleSystem, FloatingText } from './entities.js';
import { DemoPlayer } from './demoPlayer.js';

export class ChakravyuhaGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'RING_CLEARED' | 'VEERA_SWARGA' | 'VICTORY'
    this.lastTime = performance.now();

    // Systems
    this.particles = new ParticleSystem();
    this.formation = new FormationManager(0, 0);
    this.astras = new AstraManager();

    // Entities
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.floatingTexts = [];

    // Camera
    this.camera = { x: 0, y: 0, shakeTimer: 0, shakeIntensity: 0 };

    // Inputs
    this.input = {
      up: false, down: false, left: false, right: false,
      dash: false, fire: false,
      mouseX: 0, mouseY: 0,
      targetWorldX: 0, targetWorldY: 0,
    };

    // Progression / Run Stats
    this.currentRing = 1;
    this.enemiesRemainingInWave = 0;
    this.waveSpawnTimer = 0;
    this.bossSpawned = false;
    this.runKills = 0;
    this.runPunyaGained = 0;

    this.initEvents();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.key === 'w' || e.key === 'ArrowUp') this.input.up = true;
      if (e.key === 's' || e.key === 'ArrowDown') this.input.down = true;
      if (e.key === 'a' || e.key === 'ArrowLeft') this.input.left = true;
      if (e.key === 'd' || e.key === 'ArrowRight') this.input.right = true;
      if (e.key === 'Shift') this.input.dash = true;
      if (e.key === ' ') {
        e.preventDefault();
        this.castAstra('wheel');
      }
      if (e.key === '1') this.castAstra('agneya');
      if (e.key === '2') this.castAstra('varuna');
      if (e.key === '3') this.castAstra('vayu');
      if (e.key === '4') this.castAstra('wheel');
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'w' || e.key === 'ArrowUp') this.input.up = false;
      if (e.key === 's' || e.key === 'ArrowDown') this.input.down = false;
      if (e.key === 'a' || e.key === 'ArrowLeft') this.input.left = false;
      if (e.key === 'd' || e.key === 'ArrowRight') this.input.right = false;
      if (e.key === 'Shift') this.input.dash = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.input.mouseX = e.clientX;
      this.input.mouseY = e.clientY;
      this.input.targetWorldX = this.camera.x + e.clientX;
      this.input.targetWorldY = this.camera.y + e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      sound.ensureContext();
      if (e.button === 0) {
        this.input.fire = true;
      } else if (e.button === 2) {
        e.preventDefault();
        this.input.dash = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.input.fire = false;
      if (e.button === 2) this.input.dash = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Mobile Virtual Controls setup
    this.setupTouchControls();
  }

  setupTouchControls() {
    const touchMove = document.getElementById('touch-stick');
    const btnFire = document.getElementById('touch-fire');
    const btnDash = document.getElementById('touch-dash');
    const btnWheel = document.getElementById('touch-wheel');

    if (!touchMove) return;

    let touchId = null;
    let startX = 0, startY = 0;

    touchMove.addEventListener('touchstart', (e) => {
      sound.ensureContext();
      const t = e.changedTouches[0];
      touchId = t.identifier;
      startX = t.clientX;
      startY = t.clientY;
    }, { passive: false });

    touchMove.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchId) {
          const dx = t.clientX - startX;
          const dy = t.clientY - startY;
          this.input.left = dx < -20;
          this.input.right = dx > 20;
          this.input.up = dy < -20;
          this.input.down = dy > 20;
        }
      }
    }, { passive: false });

    const endTouch = () => {
      touchId = null;
      this.input.left = false;
      this.input.right = false;
      this.input.up = false;
      this.input.down = false;
    };
    touchMove.addEventListener('touchend', endTouch);
    touchMove.addEventListener('touchcancel', endTouch);

    if (btnFire) {
      btnFire.addEventListener('touchstart', (e) => { e.preventDefault(); this.input.fire = true; });
      btnFire.addEventListener('touchend', (e) => { e.preventDefault(); this.input.fire = false; });
    }
    if (btnDash) {
      btnDash.addEventListener('touchstart', (e) => { e.preventDefault(); this.input.dash = true; });
      btnDash.addEventListener('touchend', (e) => { e.preventDefault(); this.input.dash = false; });
    }
    if (btnWheel) {
      btnWheel.addEventListener('touchstart', (e) => { e.preventDefault(); this.castAstra('wheel'); });
    }
  }

  startNewRun() {
    sound.playConch();
    const stats = progression.getEffectiveStats();

    // Abhimanyu enters Ring 1 (radius 920, start near periphery)
    const startRadius = 880;
    const startAngle = 0.8; // aligned with Ring 1 entrance
    this.player = new Player(Math.cos(startAngle) * startRadius, Math.sin(startAngle) * startRadius, stats);

    this.enemies = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.formation = new FormationManager(0, 0);

    this.currentRing = 1;
    this.bossSpawned = false;
    this.runKills = 0;
    this.runPunyaGained = 0;
    this.startRingWave(1);

    this.state = 'PLAYING';
    this.updateHUD();
  }

  startRingWave(ringNumber) {
    this.currentRing = ringNumber;
    this.bossSpawned = false;
    const ringData = RING_DATA[ringNumber - 1];
    this.enemiesRemainingInWave = ringData.enemyBudget;
    this.waveSpawnTimer = 0.5;

    this.floatingTexts.push(new FloatingText(`ENTERING ${ringData.name.toUpperCase()}`, this.player.x, this.player.y - 60, '#f0d799', 24));
    this.updateHUD();
  }

  spawnEnemy(ringNumber) {
    const ringData = RING_DATA[ringNumber - 1];
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = ringData.innerRadius + Math.random() * (ringData.radius - ringData.innerRadius);
    const x = Math.cos(spawnAngle) * spawnDist;
    const y = Math.sin(spawnAngle) * spawnDist;

    let type = 'spearman';
    if (ringNumber === 1) {
      type = Math.random() > 0.4 ? 'spearman' : 'archer';
    } else if (ringNumber === 2) {
      type = Math.random() > 0.55 ? 'elephant' : 'spearman';
    } else if (ringNumber === 3) {
      type = Math.random() > 0.5 ? 'chariot' : 'archer';
    } else {
      const roll = Math.random();
      if (roll < 0.3) type = 'spearman';
      else if (roll < 0.6) type = 'archer';
      else if (roll < 0.8) type = 'chariot';
      else type = 'elephant';
    }

    this.enemies.push(new Enemy(x, y, type, ringNumber));
  }

  spawnBoss(ringNumber) {
    this.bossSpawned = true;
    const ringData = RING_DATA[ringNumber - 1];
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = ringData.innerRadius + 40;
    const x = Math.cos(spawnAngle) * spawnDist;
    const y = Math.sin(spawnAngle) * spawnDist;

    const boss = new Enemy(x, y, 'boss', ringNumber);
    this.enemies.push(boss);

    this.addCameraShake(0.6, 12);
    sound.playConch();
    this.floatingTexts.push(new FloatingText(`⚠️ ${ringData.bossName.toUpperCase()} ENTERS!`, x, y - 40, '#d1481f', 26));
  }

  castAstra(astraId) {
    if (this.state !== 'PLAYING' || !this.player) return;
    const target = { x: this.input.targetWorldX, y: this.input.targetWorldY };
    const success = this.astras.cast(astraId, this.player, target, this.enemies, this.projectiles, this.particles);
    if (success) {
      this.addCameraShake(0.3, 8);
      this.updateHUD();
    }
  }

  addCameraShake(duration, intensity) {
    this.camera.shakeTimer = duration;
    this.camera.shakeIntensity = intensity;
  }

  loop(currentTime) {
    const dt = Math.min(0.08, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    if (this.state === 'PLAYING') {
      this.update(dt);
    }
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // Update Aim Angle
    const dx = this.input.targetWorldX - this.player.x;
    const dy = this.input.targetWorldY - this.player.y;
    this.player.aimAngle = Math.atan2(dy, dx);

    // Update Player
    this.player.update(dt, this.input, this.projectiles, this.floatingTexts);

    // Keep Player inside or near the current ring bounds
    const distFromCenter = Math.hypot(this.player.x, this.player.y);
    const ringData = RING_DATA[this.currentRing - 1];
    if (distFromCenter > ringData.radius + 60) {
      // Soft boundary pushback
      const ang = Math.atan2(this.player.y, this.player.x);
      this.player.x = Math.cos(ang) * (ringData.radius + 60);
      this.player.y = Math.sin(ang) * (ringData.radius + 60);
    }

    // Check Player Death
    if (this.player.hp <= 0) {
      this.triggerGameOver();
      return;
    }

    // Update Systems
    this.formation.update(dt);
    this.astras.update(dt);
    this.particles.update(dt);

    // Spawning Logic
    if (this.enemiesRemainingInWave > 0) {
      this.waveSpawnTimer -= dt;
      if (this.waveSpawnTimer <= 0) {
        this.spawnEnemy(this.currentRing);
        this.enemiesRemainingInWave -= 1;
        this.waveSpawnTimer = 1.2;
      }
    } else if (!this.bossSpawned && this.enemies.length === 0) {
      this.spawnBoss(this.currentRing);
    }

    // Update Projectiles & Collisions
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(dt);

      if (proj.isEnemy) {
        // Check collision with player
        const pDist = Math.hypot(proj.x - this.player.x, proj.y - this.player.y);
        if (pDist < proj.radius + this.player.radius) {
          this.player.takeDamage(proj.damage, this.floatingTexts);
          this.projectiles.splice(i, 1);
          continue;
        }
      } else {
        // Check collision with enemies
        for (let e = this.enemies.length - 1; e >= 0; e--) {
          const enemy = this.enemies[e];
          if (proj.hitEntities.has(enemy)) continue;

          const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
          if (dist < proj.radius + enemy.radius) {
            proj.hitEntities.add(enemy);
            sound.playHit();
            const dead = enemy.takeDamage(proj.damage, false, this.floatingTexts);

            // Particle sparks
            for (let k = 0; k < 6; k++) {
              this.particles.emit({
                x: proj.x, y: proj.y,
                vx: (Math.random() - 0.5) * 160, vy: (Math.random() - 0.5) * 160,
                color: '#f0d799', size: 3, life: 0.35,
              });
            }

            if (dead) {
              this.onEnemyKilled(enemy, e);
            }

            proj.hitsLeft -= 1;
            if (proj.hitsLeft <= 0) {
              this.projectiles.splice(i, 1);
              break;
            }
          }
        }
      }

      if (proj.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, this.player, this.projectiles, this.floatingTexts);
      if (enemy.hp <= 0) {
        this.onEnemyKilled(enemy, i);
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      this.floatingTexts[i].update(dt);
      if (this.floatingTexts[i].life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update Camera
    const targetCamX = this.player.x - this.canvas.width / 2;
    const targetCamY = this.player.y - this.canvas.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.12;
    this.camera.y += (targetCamY - this.camera.y) * 0.12;

    if (this.camera.shakeTimer > 0) {
      this.camera.shakeTimer -= dt;
      const ox = (Math.random() - 0.5) * this.camera.shakeIntensity;
      const oy = (Math.random() - 0.5) * this.camera.shakeIntensity;
      this.camera.x += ox;
      this.camera.y += oy;
    }

    this.updateHUD();
  }

  onEnemyKilled(enemy, index) {
    this.enemies.splice(index, 1);
    this.runKills += 1;
    this.runPunyaGained += enemy.punyaReward;
    progression.addPunya(enemy.punyaReward);

    this.floatingTexts.push(new FloatingText(`+${enemy.punyaReward} Punya`, enemy.x, enemy.y - 30, '#f0d799', 16));

    // Blood / ember burst
    for (let i = 0; i < 18; i++) {
      this.particles.emit({
        x: enemy.x, y: enemy.y,
        vx: (Math.random() - 0.5) * 220, vy: (Math.random() - 0.5) * 220,
        color: Math.random() > 0.5 ? '#d1481f' : '#c9a55c',
        size: 3 + Math.random() * 3, life: 0.5,
      });
    }

    // If Boss died, ring is breached!
    if (enemy.type === 'boss') {
      this.onRingBreached();
    }
  }

  onRingBreached() {
    sound.playRingBreach();
    this.addCameraShake(0.8, 16);

    const hasNext = this.formation.breachCurrentRing();
    if (hasNext) {
      this.floatingTexts.push(new FloatingText(`⚡ RING ${this.currentRing} BREACHED! ⚡`, this.player.x, this.player.y - 80, '#f0d799', 28));
      this.startRingWave(this.currentRing + 1);
    } else {
      // Completed Ring 7: VICTORY!
      this.triggerVictory();
    }
  }

  triggerGameOver() {
    this.state = 'VEERA_SWARGA';
    sound.playGameOver();
    progression.recordRun(this.currentRing, this.runKills);

    const modal = document.getElementById('veera-swarga-modal');
    if (modal) {
      modal.classList.add('is-active');
      this.renderUpgradeStore();
    }
  }

  triggerVictory() {
    this.state = 'VICTORY';
    sound.playConch();
    progression.recordRun(7, this.runKills);

    const victoryModal = document.getElementById('victory-modal');
    if (victoryModal) {
      victoryModal.classList.add('is-active');
    }
  }

  renderUpgradeStore() {
    const list = document.getElementById('upgrade-list');
    const balanceEl = document.getElementById('punya-balance');
    if (balanceEl) balanceEl.textContent = progression.data.punya;
    if (!list) return;

    list.innerHTML = '';
    for (const key in UPGRADE_DEFINITIONS) {
      const def = UPGRADE_DEFINITIONS[key];
      const rank = progression.data.upgrades[key] || 0;
      const isMax = rank >= def.maxRank;
      const cost = isMax ? 'MAX' : def.costs[rank];
      const canAfford = !isMax && progression.canBuy(key);

      const card = document.createElement('div');
      card.className = `upgrade-card ${canAfford ? 'can-buy' : ''} ${isMax ? 'is-max' : ''}`;
      card.innerHTML = `
        <div class="upgrade-info">
          <h3>${def.name}</h3>
          <p class="upgrade-desc">${def.desc}</p>
          <span class="upgrade-effect">${def.effectText(rank + 1)}</span>
        </div>
        <div class="upgrade-action">
          <span class="upgrade-rank">Rank ${rank}/${def.maxRank}</span>
          <button type="button" class="upgrade-btn" ${!canAfford ? 'disabled' : ''} data-upgrade="${key}">
            ${isMax ? 'MASTERED' : `Bless (${cost} 🔥)`}
          </button>
        </div>
      `;

      card.querySelector('.upgrade-btn')?.addEventListener('click', () => {
        if (progression.buy(key)) {
          sound.playBowShot();
          this.renderUpgradeStore();
        }
      });

      list.appendChild(card);
    }
  }

  updateHUD() {
    if (!this.player) return;

    const hpBar = document.getElementById('hud-hp-bar');
    const hpText = document.getElementById('hud-hp-text');
    const pranaBar = document.getElementById('hud-prana-bar');
    const pranaText = document.getElementById('hud-prana-text');
    const ringLabel = document.getElementById('hud-ring-label');
    const ringName = document.getElementById('hud-ring-name');

    if (hpBar) hpBar.style.width = `${Math.max(0, (this.player.hp / this.player.maxHp) * 100)}%`;
    if (hpText) hpText.textContent = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
    if (pranaBar) pranaBar.style.width = `${Math.max(0, (this.player.prana / this.player.maxPrana) * 100)}%`;
    if (pranaText) pranaText.textContent = `${Math.ceil(this.player.prana)} / ${this.player.maxPrana}`;

    if (ringLabel) ringLabel.textContent = `TIER ${this.currentRing} OF 7`;
    if (ringName) ringName.textContent = RING_DATA[this.currentRing - 1]?.subtitle || '';

    // Astra Cooldown Slot Overlays
    for (const key of ['agneya', 'varuna', 'vayu', 'wheel']) {
      const slot = document.getElementById(`astra-slot-${key}`);
      if (slot) {
        const cd = this.astras.cooldowns[key];
        const maxCd = ASTRA_CONFIG[key].cooldown;
        const cdOverlay = slot.querySelector('.astra-cd-overlay');
        const cost = ASTRA_CONFIG[key].cost;

        if (cdOverlay) {
          cdOverlay.style.height = `${(cd / maxCd) * 100}%`;
        }
        slot.classList.toggle('is-ready', cd <= 0 && this.player.prana >= cost);
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Ambient background void
    this.ctx.fillStyle = '#07060a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state === 'MENU') {
      this.renderMenuBackground();
      return;
    }

    // Formation (7 Concentric Rings & Mandala)
    this.formation.render(this.ctx, this.camera);

    // Active Astra FX
    this.astras.render(this.ctx, this.camera);

    // Entities
    for (const enemy of this.enemies) {
      enemy.render(this.ctx, this.camera);
    }
    for (const proj of this.projectiles) {
      proj.render(this.ctx, this.camera);
    }

    if (this.player) {
      this.player.render(this.ctx, this.camera);
    }

    // Particles
    this.particles.render(this.ctx, this.camera);

    // Floating Damage / Text
    for (const ft of this.floatingTexts) {
      ft.render(this.ctx, this.camera);
    }
  }

  renderMenuBackground() {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const t = Date.now() * 0.0005;

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(t * 0.2);

    for (let r = 80; r < 600; r += 70) {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, r, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(201, 165, 92, 0.12)';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }
    this.ctx.restore();
  }
}

// Auto-boot on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('chakravyuha-canvas');
  if (!canvas) return;

  const game = new ChakravyuhaGame(canvas);

  // UI Event Bindings
  document.getElementById('start-game-btn')?.addEventListener('click', () => {
    document.getElementById('game-intro-modal')?.classList.remove('is-active');
    game.startNewRun();
  });

  document.getElementById('reincarnate-btn')?.addEventListener('click', () => {
    document.getElementById('veera-swarga-modal')?.classList.remove('is-active');
    game.startNewRun();
  });

  document.getElementById('victory-restart-btn')?.addEventListener('click', () => {
    document.getElementById('victory-modal')?.classList.remove('is-active');
    game.startNewRun();
  });

  document.getElementById('audio-toggle-btn')?.addEventListener('click', (e) => {
    const isMuted = sound.toggleMute();
    e.currentTarget.textContent = isMuted ? '🔇 Unmute' : '🔊 Audio';
  });

  // Astra click slots
  ['agneya', 'varuna', 'vayu', 'wheel'].forEach((key) => {
    document.getElementById(`astra-slot-${key}`)?.addEventListener('click', () => {
      game.castAstra(key);
    });
  });

  // Initialize Interactive Canvas Gameplay Demo
  const demoCanvas = document.getElementById('demo-player-canvas');
  if (demoCanvas) {
    new DemoPlayer(demoCanvas);
  }
});
