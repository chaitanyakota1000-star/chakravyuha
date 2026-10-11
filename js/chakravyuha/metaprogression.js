// ===========================================================
// CHAKRAVYUHA: METAPROGRESSION (VEERA SWARGA)
// Persistent player boons, Karmic Embers, and soul upgrades.
// Stored in localStorage.
// ===========================================================

const STORAGE_KEY = 'chakravyuha_save_v1';

const DEFAULT_STATE = {
  punya: 0,           // Karmic Embers
  totalPunyaEarned: 0,
  highestRing: 1,
  totalKills: 0,
  runsCount: 0,
  upgrades: {
    wombMemory: 0,     // Max HP
    arjunaGuidance: 0, // Bow damage
    krishnaVision: 0,  // Prana capacity & regen
    wheelMastery: 0,   // Chariot wheel power
    windStride: 0,     // Speed & dodge
  }
};

export const UPGRADE_DEFINITIONS = {
  wombMemory: {
    name: "Subhadra's Womb Memory",
    desc: "Recover lost memories of Arjuna's teachings. Increases Max Vitality.",
    maxRank: 5,
    costs: [50, 120, 250, 500, 1000],
    effectText: (rank) => `+${rank * 25} Max HP (Base: 100)`,
    getBonus: (rank) => rank * 25,
  },
  arjunaGuidance: {
    name: "Gandiva's Lineage",
    desc: "Channel the archery mastery of Arjuna. Increases arrow damage.",
    maxRank: 5,
    costs: [60, 140, 300, 600, 1200],
    effectText: (rank) => `+${rank * 6} Arrow Damage (Base: 22)`,
    getBonus: (rank) => rank * 6,
  },
  krishnaVision: {
    name: "Krishna's Cosmic Grace",
    desc: "Expand spiritual breath (Prana) to invoke celestial Astras frequently.",
    maxRank: 5,
    costs: [50, 130, 280, 550, 1100],
    effectText: (rank) => `+${rank * 20}% Max Prana & Regen`,
    getBonus: (rank) => rank * 0.20,
  },
  wheelMastery: {
    name: "Broken Wheel Fury",
    desc: "Unleash devastating strikes with the severed war chariot wheel.",
    maxRank: 5,
    costs: [75, 160, 350, 700, 1400],
    effectText: (rank) => `+${rank * 30}% Wheel Smash Area & Damage`,
    getBonus: (rank) => rank * 0.30,
  },
  windStride: {
    name: "Vayu's Swiftness",
    desc: "Dart between spinning phalanxes with swifter movement and evasion.",
    maxRank: 5,
    costs: [40, 100, 220, 450, 900],
    effectText: (rank) => `+${rank * 8}% Movement Speed & -${rank * 10}% Dash CD`,
    getBonus: (rank) => rank,
  }
};

class Metaprogression {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE, upgrades: { ...DEFAULT_STATE.upgrades } };
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STATE,
        ...parsed,
        upgrades: { ...DEFAULT_STATE.upgrades, ...(parsed.upgrades || {}) }
      };
    } catch (e) {
      console.warn('Failed to load save state', e);
      return { ...DEFAULT_STATE, upgrades: { ...DEFAULT_STATE.upgrades } };
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to persist save state', e);
    }
  }

  addPunya(amount) {
    this.data.punya += amount;
    this.data.totalPunyaEarned += amount;
    this.save();
  }

  recordRun(ringReached, kills) {
    this.data.runsCount += 1;
    this.data.totalKills += kills;
    if (ringReached > this.data.highestRing) {
      this.data.highestRing = ringReached;
    }
    this.save();
  }

  canBuy(upgradeKey) {
    const def = UPGRADE_DEFINITIONS[upgradeKey];
    if (!def) return false;
    const currentRank = this.data.upgrades[upgradeKey] || 0;
    if (currentRank >= def.maxRank) return false;
    const cost = def.costs[currentRank];
    return this.data.punya >= cost;
  }

  buy(upgradeKey) {
    const def = UPGRADE_DEFINITIONS[upgradeKey];
    if (!this.canBuy(upgradeKey)) return false;
    const currentRank = this.data.upgrades[upgradeKey] || 0;
    const cost = def.costs[currentRank];
    this.data.punya -= cost;
    this.data.upgrades[upgradeKey] = currentRank + 1;
    this.save();
    return true;
  }

  getEffectiveStats() {
    const u = this.data.upgrades;
    const hpBonus = UPGRADE_DEFINITIONS.wombMemory.getBonus(u.wombMemory || 0);
    const bowBonus = UPGRADE_DEFINITIONS.arjunaGuidance.getBonus(u.arjunaGuidance || 0);
    const pranaMult = 1 + UPGRADE_DEFINITIONS.krishnaVision.getBonus(u.krishnaVision || 0);
    const wheelMult = 1 + UPGRADE_DEFINITIONS.wheelMastery.getBonus(u.wheelMastery || 0);
    const speedRank = u.windStride || 0;

    return {
      maxHp: 100 + hpBonus,
      arrowDamage: 22 + bowBonus,
      maxPrana: 100 * pranaMult,
      pranaRegenRate: 12 * pranaMult, // per second
      wheelMultiplier: wheelMult,
      moveSpeed: 230 * (1 + speedRank * 0.08),
      dodgeCooldown: Math.max(0.4, 0.9 - speedRank * 0.08),
    };
  }
}

export const progression = new Metaprogression();
