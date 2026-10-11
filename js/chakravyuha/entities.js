// ===========================================================
// CHAKRAVYUHA: ENTITIES
// Player (Abhimanyu), Enemies (Spearmen, Archers, Elephants,
// Chariots, Bosses), Projectiles, and Particle Systems.
// ===========================================================

import { sound } from './audio.js';

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(config) {
    this.particles.push({
      x: config.x,
      y: config.y,
      vx: config.vx || 0,
      vy: config.vy || 0,
      color: config.color || '#f0d799',
      size: config.size || 3,
      alpha: 1,
      life: config.life || 0.6,
      maxLife: config.life || 0.6,
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx, camera) {
    for (const p of this.particles) {
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

export class FloatingText {
  constructor(text, x, y, color = '#f0d799', size = 15) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.life = 0.85;
    this.maxLife = 0.85;
    this.vy = -45;
  }

  update(dt) {
    this.y += this.vy * dt;
    this.life -= dt;
  }

  render(ctx, camera) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${this.size}px Cinzel, serif`;
    ctx.fillStyle = this.color;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(this.text, this.x - camera.x, this.y - camera.y);
    ctx.restore();
  }
}

export class Projectile {
  constructor(x, y, vx, vy, isEnemy = false, damage = 22, piercing = 1) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.isEnemy = isEnemy;
    this.damage = damage;
    this.piercing = piercing;
    this.hitsLeft = piercing;
    this.hitEntities = new Set();
    this.radius = isEnemy ? 4 : 5;
    this.life = 2.2;
    this.rotation = Math.atan2(vy, vx);
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.rotation);

    if (this.isEnemy) {
      // Dark red iron arrow
      ctx.strokeStyle = '#d1481f';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();

      ctx.fillStyle = '#9c2b1f';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(3, -3);
      ctx.lineTo(3, 3);
      ctx.closePath();
      ctx.fill();
    } else {
      // Golden celestial arrow of Abhimanyu
      ctx.strokeStyle = '#f0d799';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#c9a55c';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(4, -4);
      ctx.lineTo(4, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

export class Player {
  constructor(x, y, stats) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.stats = stats;
    this.hp = stats.maxHp;
    this.maxHp = stats.maxHp;
    this.prana = stats.maxPrana;
    this.maxPrana = stats.maxPrana;
    this.radius = 18;
    this.aimAngle = 0;

    // Movement & Combat states
    this.moveSpeed = stats.moveSpeed;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.bowCooldown = 0;
    this.invincibleTimer = 0;
    this.wheelTimer = 0;

    this.kills = 0;
  }

  update(dt, input, projectiles, floatingTexts) {
    // Regenerate Prana over time
    if (this.prana < this.maxPrana) {
      this.prana = Math.min(this.maxPrana, this.prana + this.stats.pranaRegenRate * dt);
    }

    // Cooldown timers
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.bowCooldown > 0) this.bowCooldown -= dt;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    if (this.wheelTimer > 0) this.wheelTimer -= dt;

    // Handle Dash / Dodge Roll
    if (this.isDashing) {
      this.dashTimer -= dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.vx = 0;
        this.vy = 0;
      }
    } else {
      // Normal movement
      let dx = 0;
      let dy = 0;
      if (input.up) dy -= 1;
      if (input.down) dy += 1;
      if (input.left) dx -= 1;
      if (input.right) dx += 1;

      const mag = Math.hypot(dx, dy);
      if (mag > 0) {
        const speed = this.moveSpeed * (this.wheelTimer > 0 ? 1.25 : 1);
        this.x += (dx / mag) * speed * dt;
        this.y += (dy / mag) * speed * dt;
      }

      // Trigger Dash
      if (input.dash && this.dashCooldown <= 0) {
        this.isDashing = true;
        this.dashTimer = 0.22;
        this.dashCooldown = this.stats.dodgeCooldown;
        this.invincibleTimer = 0.25;
        sound.playDodge();

        const dashMag = mag > 0 ? mag : 1;
        const dDirX = mag > 0 ? dx / dashMag : Math.cos(this.aimAngle);
        const dDirY = mag > 0 ? dy / dashMag : Math.sin(this.aimAngle);
        this.vx = dDirX * 520;
        this.vy = dDirY * 520;
      }
    }

    // Fire Bow
    if (input.fire && this.bowCooldown <= 0 && this.wheelTimer <= 0) {
      this.shootArrow(projectiles);
    }
  }

  shootArrow(projectiles) {
    this.bowCooldown = 0.28;
    sound.playBowShot();

    const speed = 720;
    const vx = Math.cos(this.aimAngle) * speed;
    const vy = Math.sin(this.aimAngle) * speed;

    const offsetDist = 20;
    const spawnX = this.x + Math.cos(this.aimAngle) * offsetDist;
    const spawnY = this.y + Math.sin(this.aimAngle) * offsetDist;

    projectiles.push(new Projectile(spawnX, spawnY, vx, vy, false, this.stats.arrowDamage, 2));
  }

  takeDamage(amount, floatingTexts) {
    if (this.invincibleTimer > 0 || this.wheelTimer > 0) return false;

    this.hp = Math.max(0, this.hp - amount);
    this.invincibleTimer = 0.45; // I-frames
    sound.playHit();

    floatingTexts.push(new FloatingText(`-${amount}`, this.x, this.y - 20, '#d1481f', 18));
    return true;
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    // Flashing during I-frames
    if (this.invincibleTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (Warrior's Golden Armor & Royal Cuirass)
    ctx.fillStyle = '#c9a55c';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f0d799';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Golden Helm / Crown of the Son of Arjuna
    ctx.fillStyle = '#f0d799';
    ctx.beginPath();
    ctx.arc(0, -4, 9, 0, Math.PI * 2);
    ctx.fill();

    // Aim Pointer / Bow
    ctx.rotate(this.aimAngle);

    if (this.wheelTimer > 0) {
      // Renders the giant chariot wheel
      ctx.save();
      ctx.rotate(Date.now() * 0.015);
      ctx.strokeStyle = '#f0d799';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#f0d799';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * 36, Math.sin(ang) * 36);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // Golden recurve bow
      ctx.beginPath();
      ctx.arc(16, 0, 18, -Math.PI / 3, Math.PI / 3);
      ctx.strokeStyle = '#f0d799';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Bowstring
      ctx.beginPath();
      ctx.moveTo(16 + Math.cos(-Math.PI / 3) * 18, Math.sin(-Math.PI / 3) * 18);
      ctx.lineTo(8, 0);
      ctx.lineTo(16 + Math.cos(Math.PI / 3) * 18, Math.sin(Math.PI / 3) * 18);
      ctx.strokeStyle = 'rgba(236, 228, 211, 0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }
}

export class Enemy {
  constructor(x, y, type = 'spearman', ringNumber = 1) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.ringNumber = ringNumber;
    this.burnTimer = 0;
    this.stunTimer = 0;
    this.attackCooldown = 1.0;

    // Type attributes
    if (type === 'spearman') {
      this.hp = 35 + ringNumber * 10;
      this.maxHp = this.hp;
      this.speed = 130 + ringNumber * 8;
      this.damage = 14 + ringNumber * 2;
      this.radius = 16;
      this.punyaReward = 6;
      this.color = '#e78365';
    } else if (type === 'archer') {
      this.hp = 25 + ringNumber * 8;
      this.maxHp = this.hp;
      this.speed = 100 + ringNumber * 5;
      this.damage = 12 + ringNumber * 2;
      this.radius = 14;
      this.punyaReward = 8;
      this.color = '#d1481f';
    } else if (type === 'elephant') {
      this.hp = 180 + ringNumber * 40;
      this.maxHp = this.hp;
      this.speed = 75;
      this.damage = 32;
      this.radius = 32;
      this.punyaReward = 30;
      this.color = '#645b73';
    } else if (type === 'chariot') {
      this.hp = 100 + ringNumber * 20;
      this.maxHp = this.hp;
      this.speed = 185;
      this.damage = 24;
      this.radius = 24;
      this.punyaReward = 20;
      this.color = '#9c2b1f';
    } else if (type === 'boss') {
      this.hp = 450 + ringNumber * 120;
      this.maxHp = this.hp;
      this.speed = 115;
      this.damage = 35;
      this.radius = 26;
      this.punyaReward = 120;
      this.color = '#f0d799';
    }
  }

  update(dt, player, projectiles, floatingTexts) {
    // Handle Stun
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      return;
    }

    // Handle Fire Burn
    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      if (Math.random() < 0.25) {
        this.takeDamage(6, false, floatingTexts);
      }
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 0) return;

    const dirX = dx / dist;
    const dirY = dy / dist;

    // Movement AI
    if (this.type === 'archer') {
      // Keep distance around 280px
      if (dist < 220) {
        this.x -= dirX * this.speed * dt;
        this.y -= dirY * this.speed * dt;
      } else if (dist > 340) {
        this.x += dirX * this.speed * dt;
        this.y += dirY * this.speed * dt;
      }

      // Fire arrow
      if (this.attackCooldown <= 0 && dist < 450) {
        this.attackCooldown = 2.0;
        const arrowSpeed = 420;
        projectiles.push(new Projectile(this.x, this.y, dirX * arrowSpeed, dirY * arrowSpeed, true, this.damage));
      }
    } else if (this.type === 'elephant') {
      // Slow forward stomp
      this.x += dirX * this.speed * dt;
      this.y += dirY * this.speed * dt;

      // Heavy stomp attack
      if (dist < this.radius + player.radius + 15 && this.attackCooldown <= 0) {
        player.takeDamage(this.damage, floatingTexts);
        this.attackCooldown = 1.4;
      }
    } else {
      // Spearmen, Chariots, Bosses: Chase player
      this.x += dirX * this.speed * dt;
      this.y += dirY * this.speed * dt;

      if (dist < this.radius + player.radius + 10 && this.attackCooldown <= 0) {
        player.takeDamage(this.damage, floatingTexts);
        this.attackCooldown = 1.0;
      }
    }
  }

  takeDamage(amount, isCrit = false, floatingTexts = null) {
    this.hp = Math.max(0, this.hp - amount);
    if (floatingTexts) {
      const col = isCrit ? '#f0d799' : '#ece4d3';
      const text = isCrit ? `CRIT! ${amount}` : `${amount}`;
      floatingTexts.push(new FloatingText(text, this.x, this.y - 18, col, isCrit ? 18 : 14));
    }
    return this.hp <= 0;
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);

    // Burning effect
    if (this.burnTimer > 0) {
      ctx.shadowColor = '#d1481f';
      ctx.shadowBlur = 10;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, this.radius * 0.8, this.radius, this.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.type === 'boss' ? '#f0d799' : 'rgba(236, 228, 211, 0.4)';
    ctx.lineWidth = this.type === 'boss' ? 3 : 1.5;
    ctx.stroke();

    // Boss Crown / Emblem
    if (this.type === 'boss') {
      ctx.fillStyle = '#f0d799';
      ctx.beginPath();
      ctx.arc(0, -6, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Health bar above enemy
    if (this.hp < this.maxHp) {
      const barW = this.radius * 2.2;
      const barH = 4;
      const hpPct = this.hp / this.maxHp;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-barW / 2, -this.radius - 12, barW, barH);

      ctx.fillStyle = this.type === 'boss' ? '#f0d799' : '#d1481f';
      ctx.fillRect(-barW / 2, -this.radius - 12, barW * hpPct, barH);
    }

    ctx.restore();
  }
}
