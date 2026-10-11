// ===========================================================
// KURUKSHETRA BATTLEFIELD — CORE GAME ENGINE
// Pure rules, state management, 8x8 grid mathematics,
// and action validation decoupled from the visual layer.
// ===========================================================

export const GRID_SIZE = 8;

// 8 Directions: Orthogonal + Diagonal
export const DIRECTIONS_8 = [
  [-1, -1], [-1, 0], [-1, 1],
  [ 0, -1],          [ 0, 1],
  [ 1, -1], [ 1, 0], [ 1, 1]
];

export const INITIAL_CHAMPIONS = [
  // --- PANDAVAS (Player) ---
  {
    id: 'yudhishthira',
    name: 'Yudhishthira',
    title: 'Dharmaraja',
    role: 'Balanced Leader',
    side: 'pandava',
    maxHp: 8,
    hp: 8,
    power: 2,
    range: 1, // Range 1 (8 directions)
    row: 6,
    col: 2,
    portrait: 'assets/img/yudhishthira_portrait.jpg',
    color: '#38b6ff'
  },
  {
    id: 'bhima',
    name: 'Bhima',
    title: 'Vrikodara',
    role: 'Heavy Melee Crusher',
    side: 'pandava',
    maxHp: 10,
    hp: 10,
    power: 3,
    range: 1, // Range 1 (8 directions)
    row: 6,
    col: 4,
    portrait: 'assets/img/bhima_portrait.jpg',
    color: '#ff9f1c'
  },
  {
    id: 'arjuna',
    name: 'Arjuna',
    title: 'Gandivadhari',
    role: 'Long-Range Specialist',
    side: 'pandava',
    maxHp: 7,
    hp: 7,
    power: 3,
    range: 2, // Range 2 (8 directions)
    row: 7,
    col: 3,
    portrait: 'assets/img/arjuna_portrait.jpg',
    color: '#2ec4b6'
  },

  // --- KAURAVAS (Computer AI) ---
  {
    id: 'duryodhana',
    name: 'Duryodhana',
    title: 'Suyodhana',
    role: 'Fierce Mace Titan',
    side: 'kaurava',
    maxHp: 10,
    hp: 10,
    power: 3,
    range: 1, // Range 1 (8 directions)
    row: 1,
    col: 3,
    portrait: 'assets/img/duryodhana_portrait.jpg',
    color: '#e71d36'
  },
  {
    id: 'karna',
    name: 'Karna',
    title: 'Radheya',
    role: 'Solar Marksman',
    side: 'kaurava',
    maxHp: 8,
    hp: 8,
    power: 3,
    range: 2, // Range 2 (8 directions)
    row: 0,
    col: 4,
    portrait: 'assets/img/karna_portrait.jpg',
    color: '#ff5400'
  },
  {
    id: 'bhishma',
    name: 'Bhishma',
    title: 'Pitamaha',
    role: 'Invulnerable Veteran',
    side: 'kaurava',
    maxHp: 9,
    hp: 9,
    power: 2,
    range: 1, // Range 1 (8 directions)
    row: 1,
    col: 5,
    portrait: 'assets/img/bhishma_portrait.jpg',
    color: '#c77dff'
  }
];

export class BattleEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.champions = INITIAL_CHAMPIONS.map(c => ({
      ...c,
      hp: c.maxHp,
      hasMoved: false,
      hasAttacked: false,
      isRetreated: false
    }));
    this.round = 1;
    this.turn = 'pandava'; // 'pandava' | 'kaurava'
    this.selectedChampionId = null;
    this.isGameOver = false;
    this.winner = null; // 'pandava' | 'kaurava' | null
    this.logs = ['The armies of Dharma and Adharma assemble on the sacred field of Kurukshetra.'];
  }

  getChampion(id) {
    return this.champions.find(c => c.id === id);
  }

  getChampionAt(row, col) {
    return this.champions.find(c => !c.isRetreated && c.row === row && c.col === col);
  }

  getAliveChampions(side) {
    return this.champions.filter(c => !c.isRetreated && (side ? c.side === side : true));
  }

  getChebyshevDistance(r1, c1, r2, c2) {
    return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2));
  }

  isInRange(attacker, targetRow, targetCol) {
    const dist = this.getChebyshevDistance(attacker.row, attacker.col, targetRow, targetCol);
    return dist > 0 && dist <= attacker.range;
  }

  getValidMoves(champion) {
    if (!champion || champion.isRetreated || champion.hasMoved) return [];
    const moves = [];

    for (const [dr, dc] of DIRECTIONS_8) {
      const nr = champion.row + dr;
      const nc = champion.col + dc;

      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
        if (!this.getChampionAt(nr, nc)) {
          moves.push({ row: nr, col: nc });
        }
      }
    }
    return moves;
  }

  getLegalMoves(champion) {
    return this.getValidMoves(champion);
  }

  getValidTargets(champion) {
    if (!champion || champion.isRetreated || champion.hasAttacked) return [];
    const opponentSide = champion.side === 'pandava' ? 'kaurava' : 'pandava';
    const opponents = this.getAliveChampions(opponentSide);

    return opponents.filter(opp => this.isInRange(champion, opp.row, opp.col));
  }

  getAttackTargets(champion) {
    return this.getValidTargets(champion);
  }

  canChampionAct(champion) {
    if (!champion || champion.isRetreated || champion.side !== this.turn) return false;
    return (!champion.hasMoved && this.getValidMoves(champion).length > 0) ||
           (!champion.hasAttacked && this.getValidTargets(champion).length > 0);
  }

  sideHasActionsLeft(side) {
    const team = this.getAliveChampions(side);
    return team.some(c => (!c.hasMoved && this.getValidMoves(c).length > 0) ||
                          (!c.hasAttacked && this.getValidTargets(c).length > 0));
  }

  moveChampion(championOrId, targetRow, targetCol) {
    const champ = typeof championOrId === 'object' && championOrId !== null
      ? championOrId
      : this.getChampion(championOrId);
    if (!champ || champ.isRetreated || champ.hasMoved) {
      return { success: false, reason: 'Invalid champion or already moved' };
    }

    const validMoves = this.getValidMoves(champ);
    const isValid = validMoves.some(m => m.row === targetRow && m.col === targetCol);
    if (!isValid) {
      return { success: false, reason: 'Destination not in legal movement range' };
    }

    const fromRow = champ.row;
    const fromCol = champ.col;
    champ.row = targetRow;
    champ.col = targetCol;
    champ.hasMoved = true;

    const logEntry = `${champ.name} moves to [${String.fromCharCode(65 + targetCol)}${8 - targetRow}].`;
    this.addLog(logEntry);

    return {
      success: true,
      champion: champ,
      from: { row: fromRow, col: fromCol },
      to: { row: targetRow, col: targetCol },
      log: logEntry
    };
  }

  attackTarget(attackerOrId, targetOrId) {
    const attacker = typeof attackerOrId === 'object' && attackerOrId !== null
      ? attackerOrId
      : this.getChampion(attackerOrId);
    const target = typeof targetOrId === 'object' && targetOrId !== null
      ? targetOrId
      : this.getChampion(targetOrId);

    if (!attacker || attacker.isRetreated || attacker.hasAttacked) {
      return { success: false, reason: 'Attacker cannot act' };
    }
    if (!target || target.isRetreated || target.side === attacker.side) {
      return { success: false, reason: 'Invalid target' };
    }
    if (!this.isInRange(attacker, target.row, target.col)) {
      return { success: false, reason: 'Target out of range' };
    }

    const damage = attacker.power;
    target.hp = Math.max(0, target.hp - damage);
    attacker.hasAttacked = true;

    let defeated = false;
    let logEntry = '';

    if (target.hp === 0) {
      target.isRetreated = true;
      defeated = true;
      logEntry = `${attacker.name} strikes ${target.name} for ${damage} damage! ${target.name} retreats from the field!`;
    } else {
      logEntry = `${attacker.name} strikes ${target.name} for ${damage} damage (${target.hp}/${target.maxHp} HP left).`;
    }

    this.addLog(logEntry);
    this.checkVictoryDefeat();

    return {
      success: true,
      attacker,
      target,
      damage,
      defeated,
      log: logEntry,
      isGameOver: this.isGameOver,
      winner: this.winner
    };
  }

  checkVictoryDefeat() {
    const pandavasAlive = this.getAliveChampions('pandava').length;
    const kauravasAlive = this.getAliveChampions('kaurava').length;

    if (kauravasAlive === 0) {
      this.isGameOver = true;
      this.winner = 'pandava';
      this.addLog('VICTORY! All Kaurava commanders have retreated. The Pandavas claim Kurukshetra!');
      return true;
    }
    if (pandavasAlive === 0) {
      this.isGameOver = true;
      this.winner = 'kaurava';
      this.addLog('DEFEAT! All Pandava champions have fallen. The Kauravas hold the battlefield.');
      return true;
    }
    return false;
  }

  finishTurn() {
    if (this.isGameOver) return;

    if (this.turn === 'pandava') {
      this.turn = 'kaurava';
      // Reset Kaurava actions
      this.champions.filter(c => c.side === 'kaurava').forEach(c => {
        c.hasMoved = false;
        c.hasAttacked = false;
      });
      this.selectedChampionId = null;
      this.addLog(`--- Kaurava Turn Begins (Round ${this.round}) ---`);
    } else {
      this.turn = 'pandava';
      this.round += 1;
      // Reset Pandava actions
      this.champions.filter(c => c.side === 'pandava').forEach(c => {
        c.hasMoved = false;
        c.hasAttacked = false;
      });
      this.selectedChampionId = null;
      this.addLog(`=== Round ${this.round}: Pandavas Command ===`);
    }
  }

  addLog(msg) {
    this.logs.unshift(msg);
    if (this.logs.length > 50) this.logs.pop();
  }
}
