// ===========================================================
// KURUKSHETRA BATTLEFIELD — VISUALS & ANIMATIONS
// Smooth movement transitions, arrow projectiles, mace impacts,
// spark bursts, floating damage text, and screen shake.
// ===========================================================

import { battlefieldAudio } from './audio.js';

export class BattlefieldVisuals {
  constructor(boardElement, fxContainer) {
    this.board = boardElement;
    this.fx = fxContainer;
  }

  getCellRect(row, col) {
    const cell = this.board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return null;
    return cell.getBoundingClientRect();
  }

  getBoardRect() {
    return this.board.getBoundingClientRect();
  }

  /**
   * Smoothly animates a piece gliding from (fromRow, fromCol) to (toRow, toCol)
   */
  async animateMove(pieceElement, fromRow, fromCol, toRow, toCol) {
    battlefieldAudio.playMove();

    const fromRect = this.getCellRect(fromRow, fromCol);
    const toRect = this.getCellRect(toRow, toCol);

    if (!fromRect || !toRect || !pieceElement) return Promise.resolve();

    const deltaX = toRect.left - fromRect.left;
    const deltaY = toRect.top - fromRect.top;

    return new Promise((resolve) => {
      pieceElement.style.transition = 'transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1)';
      pieceElement.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.08)`;
      pieceElement.style.zIndex = '50';

      setTimeout(() => {
        pieceElement.style.transition = '';
        pieceElement.style.transform = '';
        pieceElement.style.zIndex = '';
        resolve();
      }, 330);
    });
  }

  /**
   * Triggers attack animation: windup -> projectile/strike -> impact -> damage number
   */
  async animateAttack(attacker, target, damage, isDefeated) {
    const fromRect = this.getCellRect(attacker.row, attacker.col);
    const toRect = this.getCellRect(target.row, target.col);
    const boardRect = this.getBoardRect();

    if (!fromRect || !toRect) return Promise.resolve();

    const startX = fromRect.left + fromRect.width / 2 - boardRect.left;
    const startY = fromRect.top + fromRect.height / 2 - boardRect.top;
    const endX = toRect.left + toRect.width / 2 - boardRect.left;
    const endY = toRect.top + toRect.height / 2 - boardRect.top;

    // 1. Wind-up Sound & Visual
    if (attacker.range >= 2) {
      battlefieldAudio.playArrow();
      await this.spawnArrowProjectile(startX, startY, endX, endY);
    } else if (attacker.id === 'bhima' || attacker.id === 'duryodhana') {
      battlefieldAudio.playMaceStrike();
      await this.spawnMaceShockwave(endX, endY);
    } else {
      battlefieldAudio.playSwordSlash();
      await this.spawnSwordSlash(endX, endY);
    }

    // 2. Impact, Shake & Audio
    battlefieldAudio.playHit();
    this.screenShake();
    this.spawnSparks(endX, endY, attacker.side === 'pandava' ? '#ffd700' : '#ff4444');
    this.spawnFloatingDamage(endX, endY, damage);

    // 3. Retreat fanfare if defeated
    if (isDefeated) {
      setTimeout(() => battlefieldAudio.playRetreat(), 200);
    }

    return new Promise(r => setTimeout(r, 450));
  }

  spawnArrowProjectile(x1, y1, x2, y2) {
    return new Promise((resolve) => {
      const arrow = document.createElement('div');
      arrow.className = 'bf-fx-arrow';

      const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
      const dist = Math.hypot(x2 - x1, y2 - y1);

      arrow.style.left = `${x1}px`;
      arrow.style.top = `${y1}px`;
      arrow.style.transform = `rotate(${angle}deg)`;

      this.fx.appendChild(arrow);

      arrow.animate([
        { transform: `rotate(${angle}deg) translate(0px, 0px)`, opacity: 1 },
        { transform: `rotate(${angle}deg) translate(${dist}px, 0px)`, opacity: 1 }
      ], {
        duration: 220,
        easing: 'ease-in'
      }).onfinish = () => {
        arrow.remove();
        resolve();
      };
    });
  }

  spawnMaceShockwave(x, y) {
    return new Promise((resolve) => {
      const ring = document.createElement('div');
      ring.className = 'bf-fx-mace';
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
      this.fx.appendChild(ring);

      setTimeout(() => {
        ring.remove();
        resolve();
      }, 300);
    });
  }

  spawnSwordSlash(x, y) {
    return new Promise((resolve) => {
      const slash = document.createElement('div');
      slash.className = 'bf-fx-slash';
      slash.style.left = `${x}px`;
      slash.style.top = `${y}px`;
      this.fx.appendChild(slash);

      setTimeout(() => {
        slash.remove();
        resolve();
      }, 260);
    });
  }

  spawnSparks(x, y, color) {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const spark = document.createElement('div');
      spark.className = 'bf-fx-spark';
      spark.style.backgroundColor = color;
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;

      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4);
      const velocity = 25 + Math.random() * 45;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;

      this.fx.appendChild(spark);

      spark.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${vx}px, ${vy}px) scale(0)`, opacity: 0 }
      ], {
        duration: 400 + Math.random() * 200,
        easing: 'cubic-bezier(0, .9, .57, 1)'
      }).onfinish = () => spark.remove();
    }
  }

  spawnFloatingDamage(x, y, amount) {
    const float = document.createElement('div');
    float.className = 'bf-fx-floating-damage';
    float.textContent = `-${amount} HP`;
    float.style.left = `${x}px`;
    float.style.top = `${y - 12}px`;

    this.fx.appendChild(float);

    float.animate([
      { transform: 'translate(-50%, 0) scale(0.8)', opacity: 0 },
      { transform: 'translate(-50%, -20px) scale(1.25)', opacity: 1, offset: 0.25 },
      { transform: 'translate(-50%, -48px) scale(1)', opacity: 0 }
    ], {
      duration: 1100,
      easing: 'ease-out'
    }).onfinish = () => float.remove();
  }

  screenShake() {
    this.board.classList.remove('bf-shake');
    void this.board.offsetWidth; // Force reflow
    this.board.classList.add('bf-shake');
    setTimeout(() => this.board.classList.remove('bf-shake'), 320);
  }
}
