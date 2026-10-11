// ===========================================================
// CHAKRAVYUHA: ASTRA SYSTEM
// Celestial weapons invoked through Prana (Spiritual Focus):
// Agneyastra (Fire), Varunastra (Water), Vayuastra (Wind),
// and the legendary Broken Chariot Wheel Fury.
// ===========================================================

import { sound } from './audio.js';

export const ASTRA_CONFIG = {
  agneya: {
    id: 'agneya',
    name: 'Agneyastra',
    deity: 'Agni',
    cost: 35,
    cooldown: 4.5,
    color: '#d1481f',
    icon: '🔥',
    desc: 'Spreads a wave of sacred celestial flame that incinerates infantry and wood.',
  },
  varuna: {
    id: 'varuna',
    name: 'Varunastra',
    deity: 'Varuna',
    cost: 40,
    cooldown: 5.5,
    color: '#4a90e2',
    icon: '🌊',
    desc: 'Unleashes a sweeping tidal wave that pushes back enemies and deflects all arrows.',
  },
  vayu: {
    id: 'vayu',
    name: 'Vayuastra',
    deity: 'Vayu',
    cost: 30,
    cooldown: 4.0,
    color: '#8be9fd',
    icon: '🌪️',
    desc: 'Summons a vortex that drags scattered enemies together and stuns them.',
  },
  wheel: {
    id: 'wheel',
    name: 'Wheel of Fury',
    deity: 'Ratha',
    cost: 60,
    cooldown: 7.5,
    color: '#f0d799',
    icon: '☸️',
    desc: 'Wield the severed war chariot wheel. Grants invincibility and a crushing 360° sweep.',
  }
};

export class AstraManager {
  constructor() {
    this.cooldowns = {
      agneya: 0,
      varuna: 0,
      vayu: 0,
      wheel: 0,
    };
    this.activeEffects = []; // Visual particle waves, whirlwinds, wheel sweeps
  }

  update(dt) {
    for (const key in this.cooldowns) {
      if (this.cooldowns[key] > 0) {
        this.cooldowns[key] = Math.max(0, this.cooldowns[key] - dt);
      }
    }

    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      effect.lifetime += dt;
      if (effect.lifetime >= effect.duration) {
        this.activeEffects.splice(i, 1);
      }
    }
  }

  canCast(astraId, currentPrana) {
    const config = ASTRA_CONFIG[astraId];
    if (!config) return false;
    return this.cooldowns[astraId] === 0 && currentPrana >= config.cost;
  }

  cast(astraId, player, targetPos, enemies, projectiles, particleSystem) {
    const config = ASTRA_CONFIG[astraId];
    if (!config || !this.canCast(astraId, player.prana)) return false;

    player.prana -= config.cost;
    this.cooldowns[astraId] = config.cooldown;

    if (astraId === 'agneya') {
      sound.playAgneya();
      this.castAgneyastra(player, enemies, particleSystem);
    } else if (astraId === 'varuna') {
      sound.playVaruna();
      this.castVarunastra(player, enemies, projectiles, particleSystem);
    } else if (astraId === 'vayu') {
      sound.playVayu();
      this.castVayuastra(player, targetPos, enemies, particleSystem);
    } else if (astraId === 'wheel') {
      sound.playWheelSmash();
      this.castWheelFury(player, enemies, particleSystem);
    }

    return true;
  }

  castAgneyastra(player, enemies, particles) {
    const radius = 240;
    const damage = 85;

    this.activeEffects.push({
      type: 'agneya',
      x: player.x,
      y: player.y,
      maxRadius: radius,
      duration: 0.65,
      lifetime: 0,
    });

    // Spawn flame particles
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 220;
      particles.emit({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.3 ? '#d1481f' : '#f0d799',
        size: 5 + Math.random() * 4,
        life: 0.5 + Math.random() * 0.3,
      });
    }

    // Hit enemies
    enemies.forEach((enemy) => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= radius) {
        enemy.takeDamage(damage, true);
        enemy.burnTimer = 2.5; // burning tick
      }
    });
  }

  castVarunastra(player, enemies, projectiles, particles) {
    const radius = 320;
    const damage = 60;

    this.activeEffects.push({
      type: 'varuna',
      x: player.x,
      y: player.y,
      maxRadius: radius,
      duration: 0.75,
      lifetime: 0,
    });

    // Water wave particles
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 180 + Math.random() * 200;
      particles.emit({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#4a90e2',
        size: 4 + Math.random() * 5,
        life: 0.6 + Math.random() * 0.3,
      });
    }

    // Push back enemies and clear enemy projectiles
    enemies.forEach((enemy) => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= radius && dist > 0) {
        enemy.takeDamage(damage, false);
        const pushX = (dx / dist) * 260;
        const pushY = (dy / dist) * 260;
        enemy.x += pushX;
        enemy.y += pushY;
        enemy.stunTimer = 1.0;
      }
    });

    // Destroy all enemy projectiles within range
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      if (p.isEnemy) {
        const dist = Math.hypot(p.x - player.x, p.y - player.y);
        if (dist <= radius) {
          projectiles.splice(i, 1);
        }
      }
    }
  }

  castVayuastra(player, targetPos, enemies, particles) {
    const vx = targetPos.x;
    const vy = targetPos.y;
    const pullRadius = 260;

    this.activeEffects.push({
      type: 'vayu',
      x: vx,
      y: vy,
      maxRadius: pullRadius,
      duration: 1.8,
      lifetime: 0,
    });

    // Vortex particles
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 150;
      particles.emit({
        x: vx + Math.cos(angle) * dist,
        y: vy + Math.sin(angle) * dist,
        vx: -Math.sin(angle) * 160,
        vy: Math.cos(angle) * 160,
        color: '#8be9fd',
        size: 3 + Math.random() * 3,
        life: 1.2,
      });
    }

    // Drag enemies into vortex center
    enemies.forEach((enemy) => {
      const dx = enemy.x - vx;
      const dy = enemy.y - vy;
      const dist = Math.hypot(dx, dy);
      if (dist <= pullRadius) {
        enemy.x = vx + (Math.random() - 0.5) * 40;
        enemy.y = vy + (Math.random() - 0.5) * 40;
        enemy.stunTimer = 1.8;
        enemy.takeDamage(35, false);
      }
    });
  }

  castWheelFury(player, enemies, particles) {
    const radius = 220;
    const damage = 180;

    // Abhimanyu enters invincible wheel-spin state
    player.wheelTimer = 2.4;
    player.invincibleTimer = 2.5;

    this.activeEffects.push({
      type: 'wheel',
      x: player.x,
      y: player.y,
      maxRadius: radius,
      duration: 2.4,
      lifetime: 0,
      playerRef: player,
    });

    // Wheel sparks
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 160 + Math.random() * 240;
      particles.emit({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#f0d799',
        size: 4 + Math.random() * 4,
        life: 0.6,
      });
    }

    // Deal massive crushing damage
    enemies.forEach((enemy) => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= radius) {
        enemy.takeDamage(damage, true);
        enemy.stunTimer = 1.2;
      }
    });
  }

  render(ctx, camera) {
    for (const effect of this.activeEffects) {
      const cx = (effect.playerRef ? effect.playerRef.x : effect.x) - camera.x;
      const cy = (effect.playerRef ? effect.playerRef.y : effect.y) - camera.y;
      const progress = effect.lifetime / effect.duration;

      ctx.save();
      if (effect.type === 'agneya') {
        const curRadius = effect.maxRadius * progress;
        const alpha = 1 - progress;
        ctx.beginPath();
        ctx.arc(cx, cy, curRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(209, 72, 31, ${alpha * 0.9})`;
        ctx.lineWidth = 14 * (1 - progress * 0.6);
        ctx.shadowColor = '#d1481f';
        ctx.shadowBlur = 20;
        ctx.stroke();
      } else if (effect.type === 'varuna') {
        const curRadius = effect.maxRadius * progress;
        const alpha = 1 - progress;
        ctx.beginPath();
        ctx.arc(cx, cy, curRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(74, 144, 226, ${alpha * 0.95})`;
        ctx.lineWidth = 18 * (1 - progress * 0.5);
        ctx.shadowColor = '#4a90e2';
        ctx.shadowBlur = 25;
        ctx.stroke();
      } else if (effect.type === 'vayu') {
        const rot = effect.lifetime * 14;
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.arc(0, 0, effect.maxRadius * 0.5, 0, Math.PI * 1.5);
        ctx.strokeStyle = `rgba(139, 233, 253, ${0.8 * (1 - progress * 0.4)})`;
        ctx.lineWidth = 8;
        ctx.stroke();
      } else if (effect.type === 'wheel') {
        const rot = effect.lifetime * 20;
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.arc(0, 0, effect.maxRadius * 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(240, 215, 153, 0.85)';
        ctx.lineWidth = 7;
        ctx.shadowColor = '#f0d799';
        ctx.shadowBlur = 20;
        ctx.stroke();

        // 8 spokes of the giant chariot wheel
        for (let s = 0; s < 8; s++) {
          const sa = (s * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(sa) * effect.maxRadius * 0.8, Math.sin(sa) * effect.maxRadius * 0.8);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
}
