// ===========================================================
// CHAKRAVYUHA: INTERACTIVE CANVAS GAMEPLAY DEMO
// 100% browser-native 60fps animated walkthrough.
// Eliminates video codec compatibility issues (mp4v vs h264).
// Plays instantly on Chrome, Edge, Safari, Firefox, and mobile.
// ===========================================================

export class DemoPlayer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    this.isPlaying = true;
    this.currentTime = 0;
    this.totalDuration = 12.0; // 12-second comprehensive walkthrough
    this.lastTimestamp = performance.now();

    // UI elements
    this.playBtn = document.getElementById('demo-play-btn');
    this.progressBar = document.getElementById('demo-progress-fill');
    this.timeLabel = document.getElementById('demo-time-label');
    this.stepTabs = document.querySelectorAll('.demo-step-tab');

    this.initControls();
    requestAnimationFrame((t) => this.loop(t));
  }

  initControls() {
    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => {
        this.isPlaying = !this.isPlaying;
        this.playBtn.textContent = this.isPlaying ? '⏸ Pause' : '▶ Play';
      });
    }

    const track = document.getElementById('demo-progress-track');
    if (track) {
      track.addEventListener('click', (e) => {
        const rect = track.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this.currentTime = pct * this.totalDuration;
      });
    }

    this.stepTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetTime = parseFloat(tab.dataset.time || '0');
        this.currentTime = targetTime;
        this.isPlaying = true;
        if (this.playBtn) this.playBtn.textContent = '⏸ Pause';
      });
    });
  }

  loop(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;

    if (this.isPlaying) {
      this.currentTime += dt;
      if (this.currentTime >= this.totalDuration) {
        this.currentTime = 0; // Seamless loop
      }
    }

    this.updateUI();
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  updateUI() {
    const pct = (this.currentTime / this.totalDuration) * 100;
    if (this.progressBar) {
      this.progressBar.style.width = `${pct}%`;
    }
    if (this.timeLabel) {
      const sec = Math.floor(this.currentTime);
      const frac = Math.floor((this.currentTime % 1) * 10);
      this.timeLabel.textContent = `00:${sec < 10 ? '0' : ''}${sec}.${frac} / 00:12.0`;
    }

    // Active Tab highlighting
    const currentStep = Math.floor(this.currentTime / 3.0); // 0, 1, 2, 3
    this.stepTabs.forEach((tab, idx) => {
      tab.classList.toggle('is-active', idx === currentStep);
    });
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const t = this.currentTime;
    const cx = w / 2;
    const cy = h / 2 + 10;

    // Background Void
    ctx.fillStyle = '#0a080e';
    ctx.fillRect(0, 0, w, h);

    // Subtle rotating golden Chakravyuha rings
    ctx.save();
    for (let r = 70; r < 360; r += 45) {
      const rot = t * 0.25 * ((r / 45) % 2 === 0 ? 1 : -1);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(201, 165, 92, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Spikes
      for (let s = 0; s < 12; s++) {
        const a = rot + (s * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (r - 5), cy + Math.sin(a) * (r - 5));
        ctx.lineTo(cx + Math.cos(a) * (r + 5), cy + Math.sin(a) * (r + 5));
        ctx.strokeStyle = 'rgba(201, 165, 92, 0.2)';
        ctx.stroke();
      }
    }
    ctx.restore();

    // Scene Router
    if (t < 3.0) {
      this.renderSceneMovement(ctx, cx, cy, t);
    } else if (t < 6.0) {
      this.renderSceneArchery(ctx, cx, cy, t - 3.0);
    } else if (t < 9.0) {
      this.renderSceneAstras(ctx, cx, cy, t - 6.0);
    } else {
      this.renderSceneWheel(ctx, cx, cy, t - 9.0);
    }
  }

  // Scene 1: Movement & Evasion (WASD + Right Click)
  renderSceneMovement(ctx, cx, cy, st) {
    const px = cx - 100 + Math.cos(st * 3.2) * 80;
    const py = cy + Math.sin(st * 3.2) * 45;
    const isDashing = (st > 1.2 && st < 1.75);

    this.drawSceneBadge(ctx, "STEP 01: MANEUVER & DODGE ROLL", "Use WASD to maneuver. Right-Click / Shift grants Invulnerability Frames (I-Frames).");

    // Key HUD Overlay (Top Right)
    this.drawKeyBadge(ctx, 30, 75, "W", st % 0.8 < 0.4);
    this.drawKeyBadge(ctx, 60, 75, "A", (st + 0.2) % 0.8 < 0.4);
    this.drawKeyBadge(ctx, 90, 75, "S", (st + 0.4) % 0.8 < 0.4);
    this.drawKeyBadge(ctx, 120, 75, "D", (st + 0.6) % 0.8 < 0.4);
    this.drawKeyBadge(ctx, 160, 75, "SHIFT: DODGE", isDashing);

    // Ghost Dash Trail
    if (isDashing) {
      ctx.beginPath();
      ctx.arc(px - 25, py, 16, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(240, 215, 153, 0.25)';
      ctx.fill();

      // Shield Aura
      ctx.beginPath();
      ctx.arc(px, py, 26, 0, Math.PI * 2);
      ctx.strokeStyle = '#8be9fd';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      this.drawFloatingTag(ctx, "I-FRAMES ACTIVE!", px, py - 35, '#8be9fd');
    }

    // Abhimanyu
    this.drawPlayer(ctx, px, py, isDashing);

    // Incoming Spear Danger Line (showing why dodging is crucial)
    ctx.strokeStyle = 'rgba(209, 72, 31, 0.45)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(cx + 120, cy);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Scene 2: Precision Archery (Mouse Aim + Left Click)
  renderSceneArchery(ctx, cx, cy, st) {
    const px = cx - 140;
    const py = cy + 10;

    this.drawSceneBadge(ctx, "STEP 02: PRECISION ARCHERY", "Aim with Mouse cursor. Left-Click fires Gandiva's golden piercing arrows.");
    this.drawKeyBadge(ctx, 30, 75, "MOUSE AIM", true);
    this.drawKeyBadge(ctx, 130, 75, "LEFT CLICK: FIRE", Math.floor(st * 4) % 2 === 0);

    // Enemies (Target dummies)
    const enemyY = [cy - 45, cy + 10, cy + 65];
    enemyY.forEach((ey, idx) => {
      const ex = cx + 130;
      ctx.beginPath();
      ctx.arc(ex, ey, 15, 0, Math.PI * 2);
      ctx.fillStyle = '#9c2b1f';
      ctx.fill();
      ctx.strokeStyle = '#e78365';
      ctx.lineWidth = 2;
      ctx.stroke();

      // HP bar above enemy
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(ex - 18, ey - 22, 36, 4);
      ctx.fillStyle = '#d1481f';
      ctx.fillRect(ex - 18, ey - 22, 22, 4);
    });

    // Arrow Flight
    const arrowProgress = (st * 3.5) % 1.0;
    const arrowX = px + 25 + arrowProgress * 245;
    const arrowY = cy + 10;

    ctx.save();
    ctx.strokeStyle = '#f0d799';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#c9a55c';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(arrowX - 22, arrowY);
    ctx.lineTo(arrowX, arrowY);
    ctx.stroke();
    ctx.restore();

    // Hit sparks & floating numbers
    if (arrowProgress > 0.85) {
      ctx.beginPath();
      ctx.arc(cx + 130, cy + 10, 20, 0, Math.PI * 2);
      ctx.strokeStyle = '#f0d799';
      ctx.lineWidth = 2;
      ctx.stroke();
      this.drawFloatingTag(ctx, "CRIT! 28", cx + 130, cy - 25, '#f0d799');
    }

    // Aim Line
    ctx.strokeStyle = 'rgba(240, 215, 153, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(cx + 130, cy + 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // Player with Bow
    this.drawPlayer(ctx, px, py, false, 0);
  }

  // Scene 3: Celestial Astras (Keys 1, 2, 3)
  renderSceneAstras(ctx, cx, cy, st) {
    const px = cx;
    const py = cy + 10;
    const isAgneya = st < 1.5;

    this.drawSceneBadge(ctx, "STEP 03: CELESTIAL ASTRAS", isAgneya ? "Key 1: Agneyastra burns shields and incinerates crowds." : "Key 2: Varunastra unleashes tidal knockback & deflects arrows.");
    this.drawKeyBadge(ctx, 30, 75, "1: AGNEYASTRA", isAgneya);
    this.drawKeyBadge(ctx, 145, 75, "2: VARUNASTRA", !isAgneya);

    // Surrounding enemy phalanx
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI) / 4;
      const dist = isAgneya ? 95 : (100 + (st - 1.5) * 60);
      const ex = px + Math.cos(ang) * dist;
      const ey = py + Math.sin(ang) * dist;

      ctx.beginPath();
      ctx.arc(ex, ey, 14, 0, Math.PI * 2);
      ctx.fillStyle = isAgneya ? '#d1481f' : '#4a90e2';
      ctx.fill();
    }

    // Expanding Astra Shockwave
    const waveRadius = (st % 1.5) * 110;
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, waveRadius, 0, Math.PI * 2);
    ctx.strokeStyle = isAgneya ? 'rgba(209, 72, 31, 0.85)' : 'rgba(74, 144, 226, 0.9)';
    ctx.lineWidth = 10 * (1 - (st % 1.5) / 1.5);
    ctx.shadowColor = isAgneya ? '#d1481f' : '#8be9fd';
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.restore();

    this.drawFloatingTag(ctx, isAgneya ? "🔥 SACRED FIRE STORM!" : "🌊 TIDAL BLAST PUSHBACK!", px, py - 65, isAgneya ? '#d1481f' : '#8be9fd');
    this.drawPlayer(ctx, px, py, false);
  }

  // Scene 4: Broken Chariot Wheel Fury (Key 4 / Space)
  renderSceneWheel(ctx, cx, cy, st) {
    const px = cx;
    const py = cy + 10;

    this.drawSceneBadge(ctx, "STEP 04: CHARIOT WHEEL FURY", "Key 4 / Spacebar: Wield the broken war wheel. Invulnerable 360° crushing sweep!");
    this.drawKeyBadge(ctx, 30, 75, "KEY 4 / SPACEBAR", true);
    this.drawKeyBadge(ctx, 170, 75, "INVULNERABLE", true);

    // Giant Spinning Wheel
    const wheelRot = st * 16;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(wheelRot);

    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.strokeStyle = '#f0d799';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#f0d799';
    ctx.shadowBlur = 20;
    ctx.stroke();

    for (let s = 0; s < 8; s++) {
      const sa = (s * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(sa) * 48, Math.sin(sa) * 48);
      ctx.stroke();
    }
    ctx.restore();

    // Defeated enemies sent flying
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI) / 3;
      const flyDist = 70 + st * 45;
      const ex = px + Math.cos(ang) * flyDist;
      const ey = py + Math.sin(ang) * flyDist;

      ctx.beginPath();
      ctx.arc(ex, ey, 13, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(156, 43, 31, 0.6)';
      ctx.fill();

      this.drawFloatingTag(ctx, "180!", ex, ey - 15, '#f0d799');
    }

    this.drawFloatingTag(ctx, "☸️ CRUSHING 360° SWEEP!", px, py - 70, '#f0d799');
    this.drawPlayer(ctx, px, py, false);
  }

  drawPlayer(ctx, x, y, isDashing = false, aimAngle = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Armor body
    ctx.fillStyle = isDashing ? '#f0d799' : '#c9a55c';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f0d799';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Helm
    ctx.fillStyle = '#f0d799';
    ctx.beginPath();
    ctx.arc(0, -4, 8, 0, Math.PI * 2);
    ctx.fill();

    // Bow
    ctx.rotate(aimAngle);
    ctx.beginPath();
    ctx.arc(14, 0, 14, -Math.PI / 3, Math.PI / 3);
    ctx.strokeStyle = '#f0d799';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }

  drawSceneBadge(ctx, title, desc) {
    ctx.save();
    // Top banner
    ctx.fillStyle = 'rgba(20, 18, 26, 0.85)';
    ctx.fillRect(0, 0, this.width, 60);
    ctx.strokeStyle = 'rgba(201, 165, 92, 0.35)';
    ctx.strokeRect(0, 0, this.width, 60);

    ctx.font = 'bold 15px Cinzel, serif';
    ctx.fillStyle = '#f0d799';
    ctx.fillText(title, 20, 26);

    ctx.font = '13px Cormorant Garamond, serif';
    ctx.fillStyle = '#ece4d3';
    ctx.fillText(desc, 20, 48);
    ctx.restore();
  }

  drawKeyBadge(ctx, x, y, text, isActive = false) {
    ctx.save();
    ctx.font = 'bold 11px Cinzel, serif';
    const textWidth = ctx.measureText(text).width;
    const padding = 8;
    const w = textWidth + padding * 2;
    const h = 22;

    ctx.fillStyle = isActive ? 'rgba(201, 165, 92, 0.3)' : 'rgba(20, 18, 26, 0.7)';
    ctx.strokeStyle = isActive ? '#f0d799' : 'rgba(201, 165, 92, 0.3)';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = isActive ? '#f0d799' : '#a89f8c';
    ctx.fillText(text, x + padding, y + 15);
    ctx.restore();
  }

  drawFloatingTag(ctx, text, x, y, color = '#f0d799') {
    ctx.save();
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.fillStyle = color;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
    ctx.restore();
  }
}
