// ===========================================================
// KURUKSHETRA BATTLEFIELD — TACTICAL KAURAVA AI
// Multi-factor heuristic scoring system evaluating lethal kills,
// damage output, threat minimization, and battlefield positioning.
// ===========================================================

export class KauravaAI {
  constructor(engine) {
    this.engine = engine;
  }

  /**
   * Plans decisions for all active Kaurava commanders.
   * Returns an array of planned action objects to be executed asynchronously:
   * [{ championId, move: {row, col}|null, attack: targetId|null, score }]
   */
  planTurn() {
    const kauravas = this.engine.getAliveChampions('kaurava');
    const plans = [];

    // Prioritize units by lethal capability or low HP first
    const sortedKauravas = [...kauravas].sort((a, b) => b.power - a.power);

    for (const champ of sortedKauravas) {
      const bestPlan = this.evaluateChampionPlan(champ);
      if (bestPlan) {
        plans.push(bestPlan);
      }
    }

    return plans;
  }

  evaluateChampionPlan(champ) {
    const pandavas = this.engine.getAliveChampions('pandava');
    if (pandavas.length === 0) return null;

    // Legal move candidates: staying in current cell OR moving to valid cell
    const validMoves = this.engine.getValidMoves(champ);
    const candidatePositions = [
      { row: champ.row, col: champ.col, isCurrent: true },
      ...validMoves.map(m => ({ row: m.row, col: m.col, isCurrent: false }))
    ];

    let bestOption = null;
    let highestScore = -Infinity;

    for (const pos of candidatePositions) {
      // Temporarily test attacks from this position
      const attackTargets = pandavas.filter(p => {
        const dist = this.engine.getChebyshevDistance(pos.row, pos.col, p.row, p.col);
        return dist > 0 && dist <= champ.range;
      });

      if (attackTargets.length > 0) {
        // Evaluate attacking each reachable target
        for (const target of attackTargets) {
          const score = this.scoreAction(champ, pos, target, pandavas);
          if (score > highestScore) {
            highestScore = score;
            bestOption = {
              championId: champ.id,
              move: pos.isCurrent ? null : { row: pos.row, col: pos.col },
              attack: target.id,
              score
            };
          }
        }
      } else {
        // No attack possible from this position: evaluate positional advance
        const score = this.scoreMoveOnly(champ, pos, pandavas);
        if (score > highestScore) {
          highestScore = score;
          bestOption = {
            championId: champ.id,
            move: pos.isCurrent ? null : { row: pos.row, col: pos.col },
            attack: null,
            score
          };
        }
      }
    }

    return bestOption;
  }

  scoreAction(champ, pos, target, pandavas) {
    let score = 0;

    // 1. Lethal Strike Priority (Maximum Weight)
    if (target.hp <= champ.power) {
      score += 200; // Eliminating a Pandava is top objective
    }

    // 2. Damage Value & Target Importance
    score += champ.power * 25;

    // Focus Arjuna (high damage archer) or low HP targets
    if (target.id === 'arjuna') {
      score += 35;
    }
    score += (target.maxHp - target.hp) * 5; // Focus already wounded enemies

    // 3. Optimal Range Preference
    const distToTarget = this.engine.getChebyshevDistance(pos.row, pos.col, target.row, target.col);
    if (champ.range === 2 && distToTarget === 2) {
      score += 20; // Karna prefers maximum standoff range
    }

    // 4. Counter-Threat Assessment
    let incomingThreat = 0;
    for (const p of pandavas) {
      if (p.id === target.id && target.hp <= champ.power) continue; // Will be eliminated
      const distFromP = this.engine.getChebyshevDistance(pos.row, pos.col, p.row, p.col);
      if (distFromP <= p.range) {
        incomingThreat += p.power * 10;
      }
    }
    score -= incomingThreat;

    // 5. Staying alive if low on health
    if (champ.hp <= 3 && incomingThreat > 0) {
      score -= 40;
    }

    return score;
  }

  scoreMoveOnly(champ, pos, pandavas) {
    let score = 0;

    // Find nearest Pandava target
    let minDistance = Infinity;
    let closestPandava = null;

    for (const p of pandavas) {
      const dist = this.engine.getChebyshevDistance(pos.row, pos.col, p.row, p.col);
      if (dist < minDistance) {
        minDistance = dist;
        closestPandava = p;
      }
    }

    // Reward moving closer to optimal engagement distance
    const currentDist = this.engine.getChebyshevDistance(champ.row, champ.col, closestPandava.row, closestPandava.col);
    const progress = currentDist - minDistance;
    score += progress * 18;

    // Penalize walking into dangerous enemy fire zones without attacking
    let incomingThreat = 0;
    for (const p of pandavas) {
      const distFromP = this.engine.getChebyshevDistance(pos.row, pos.col, p.row, p.col);
      if (distFromP <= p.range) {
        incomingThreat += p.power * 15;
      }
    }
    score -= incomingThreat;

    return score;
  }
}
