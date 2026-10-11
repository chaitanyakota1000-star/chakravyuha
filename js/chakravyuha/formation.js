// ===========================================================
// CHAKRAVYUHA: FORMATION SYSTEM
// Mathematical simulation of the 7 concentric rotating rings,
// gate breaches, rotating barriers, and mandala geometry.
// ===========================================================

export const RING_DATA = [
  {
    ring: 1,
    name: "Ring 1: Padmavyuha Periphery",
    subtitle: "Kuru Infantry & Skirmishers",
    radius: 920,
    innerRadius: 800,
    speed: 0.12, // radians per sec
    direction: 1, // clockwise
    bossName: "Durmarshana",
    bossTitle: "The Impetuous Kaurava",
    enemyBudget: 14,
    color: "#c9a55c",
  },
  {
    ring: 2,
    name: "Ring 2: Gaja-Sena",
    subtitle: "The Armored War Elephant Phalanx",
    radius: 800,
    innerRadius: 680,
    speed: 0.16,
    direction: -1, // counter-clockwise
    bossName: "Supratika's Wardens",
    bossTitle: "The Behemoth Drivers",
    enemyBudget: 18,
    color: "#d1481f",
  },
  {
    ring: 3,
    name: "Ring 3: The Scythed Chariots",
    subtitle: "Whirling Iron Wheels of Madra",
    radius: 680,
    innerRadius: 560,
    speed: 0.22,
    direction: 1,
    bossName: "King Shalya",
    bossTitle: "Master of Chariots & Javelins",
    enemyBudget: 22,
    color: "#f0d799",
  },
  {
    ring: 4,
    name: "Ring 4: The Gurukul Line",
    subtitle: "Ashwatthama's Immortal Fire",
    radius: 560,
    innerRadius: 440,
    speed: 0.18,
    direction: -1,
    bossName: "Ashwatthama",
    bossTitle: "The Jewel of Rudra",
    enemyBudget: 26,
    color: "#9c2b1f",
  },
  {
    ring: 5,
    name: "Ring 5: The Royal Kauravas",
    subtitle: "Lakshmana Kumara & Duhshasana",
    radius: 440,
    innerRadius: 320,
    speed: 0.24,
    direction: 1,
    bossName: "Lakshmana Kumara & Duhshasana",
    bossTitle: "Heirs of the Kuru Throne",
    enemyBudget: 30,
    color: "#e78365",
  },
  {
    ring: 6,
    name: "Ring 6: The Acharya's Gate",
    subtitle: "Guru Drona's Celestial Bastion",
    radius: 320,
    innerRadius: 200,
    speed: 0.20,
    direction: -1,
    bossName: "Guru Drona",
    bossTitle: "Supreme Preceptor of Dhanurvidya",
    enemyBudget: 35,
    color: "#f0d799",
  },
  {
    ring: 7,
    name: "Ring 7: The Inner Sanctum",
    subtitle: "The Final Stand of the 6 Maharathis",
    radius: 200,
    innerRadius: 0,
    speed: 0.30,
    direction: 1,
    bossName: "The 6 Maharathis",
    bossTitle: "Drona, Karna, Duryodhana, Kripa, Ashwatthama & Shakuni",
    enemyBudget: 40,
    color: "#ffffff",
  }
];

export class FormationManager {
  constructor(arenaCenterX = 0, arenaCenterY = 0) {
    this.cx = arenaCenterX;
    this.cy = arenaCenterY;
    this.currentRingIndex = 0; // 0 = Ring 1, 6 = Ring 7
    this.ringAngles = [0, 0.5, 1.2, 2.0, 2.8, 3.7, 4.5];
    this.gateAngles = [0.8, 2.4, 4.0, 5.6, 1.2, 3.1, 0.0];
    this.gateWidth = 0.55; // radians width of the opening
    this.breachedRings = [false, false, false, false, false, false, false];
    this.breachAnimationTimer = 0;
    this.lastBreachedRing = -1;
  }

  update(dt) {
    for (let i = 0; i < RING_DATA.length; i++) {
      const data = RING_DATA[i];
      this.ringAngles[i] += data.speed * data.direction * dt;
      this.gateAngles[i] += data.speed * data.direction * 0.75 * dt;
    }

    if (this.breachAnimationTimer > 0) {
      this.breachAnimationTimer -= dt;
    }
  }

  getCurrentRingData() {
    return RING_DATA[this.currentRingIndex] || RING_DATA[RING_DATA.length - 1];
  }

  breachCurrentRing() {
    if (this.currentRingIndex < RING_DATA.length - 1) {
      this.breachedRings[this.currentRingIndex] = true;
      this.lastBreachedRing = this.currentRingIndex + 1;
      this.currentRingIndex += 1;
      this.breachAnimationTimer = 2.5; // 2.5s golden glow fanfare
      return true;
    }
    return false; // Completed ring 7
  }

  render(ctx, camera) {
    ctx.save();

    // Draw the 7 concentric rings
    for (let i = 0; i < RING_DATA.length; i++) {
      const ring = RING_DATA[i];
      const isBreached = this.breachedRings[i];
      const isCurrent = (i === this.currentRingIndex);
      const angle = this.ringAngles[i];
      const gateAngle = this.gateAngles[i];

      // Screen coordinates of center
      const sx = this.cx - camera.x;
      const sy = this.cy - camera.y;

      // Draw the perimeter barrier
      ctx.beginPath();
      ctx.arc(sx, sy, ring.radius, 0, Math.PI * 2);
      ctx.strokeStyle = isBreached
        ? 'rgba(201, 165, 92, 0.15)'
        : isCurrent
          ? 'rgba(240, 215, 153, 0.75)'
          : 'rgba(236, 228, 211, 0.22)';
      ctx.lineWidth = isCurrent ? 3.5 : 2;
      ctx.setLineDash(isBreached ? [12, 16] : [6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw radial spokes / barricade spikes
      const numSpikes = 24 + i * 8;
      for (let s = 0; s < numSpikes; s++) {
        const spikeAngle = angle + (s * Math.PI * 2) / numSpikes;
        
        // Skip spikes inside the gate opening if breached or active
        const diffToGate = Math.abs(Math.atan2(Math.sin(spikeAngle - gateAngle), Math.cos(spikeAngle - gateAngle)));
        if (diffToGate < this.gateWidth) continue;

        const x1 = sx + Math.cos(spikeAngle) * (ring.radius - 12);
        const y1 = sy + Math.sin(spikeAngle) * (ring.radius - 12);
        const x2 = sx + Math.cos(spikeAngle) * (ring.radius + 12);
        const y2 = sy + Math.sin(spikeAngle) * (ring.radius + 12);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isCurrent ? 'rgba(209, 72, 31, 0.55)' : 'rgba(201, 165, 92, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw the Gate Indicator if current
      if (isCurrent && !isBreached) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(sx, sy, ring.radius, gateAngle - this.gateWidth, gateAngle + this.gateWidth);
        ctx.strokeStyle = 'rgba(240, 215, 153, 0.95)';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#f0d799';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.restore();
      }

      // Ambient ring label
      if (isCurrent) {
        ctx.save();
        ctx.font = '600 13px Cinzel, serif';
        ctx.fillStyle = 'rgba(240, 215, 153, 0.65)';
        ctx.textAlign = 'center';
        const labelAngle = angle;
        const lx = sx + Math.cos(labelAngle) * (ring.radius - 30);
        const ly = sy + Math.sin(labelAngle) * (ring.radius - 30);
        ctx.fillText(ring.name, lx, ly);
        ctx.restore();
      }
    }

    // Inner Sanctum center mandala
    const sx = this.cx - camera.x;
    const sy = this.cy - camera.y;

    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, sy, 70, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(201, 165, 92, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sacred center flame / altar
    const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.15;
    ctx.beginPath();
    ctx.arc(sx, sy, 18 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(209, 72, 31, 0.45)';
    ctx.shadowColor = '#d1481f';
    ctx.shadowBlur = 25;
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }
}
