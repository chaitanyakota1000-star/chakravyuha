// ===========================================================
// KURUKSHETRA — TURN-BASED STRATEGY GAME
// The player leads the Pandavas. A small deterministic opponent
// chooses attacks and advances its champions toward the player.
// Everything runs locally in the browser; there are no accounts,
// network calls, or external game services.
// ===========================================================

const SIZE = 6;
const DIRECTIONS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const STARTING_ARMIES = [
  { id: 'yudhishthira', name: 'Yudhishthira', boardName: 'Yudhi', mark: 'Y', side: 'pandava', row: 4, col: 1, hp: 4, power: 2, range: 1 },
  { id: 'bhima', name: 'Bhima', boardName: 'Bhima', mark: 'B', side: 'pandava', row: 4, col: 2, hp: 5, power: 3, range: 1 },
  { id: 'arjuna', name: 'Arjuna', boardName: 'Arjuna', mark: 'A', side: 'pandava', row: 4, col: 3, hp: 4, power: 3, range: 2 },
  { id: 'duryodhana', name: 'Duryodhana', boardName: 'Duryo', mark: 'D', side: 'kaurava', row: 1, col: 2, hp: 4, power: 2, range: 1 },
  { id: 'karna', name: 'Karna', boardName: 'Karna', mark: 'K', side: 'kaurava', row: 1, col: 3, hp: 3, power: 2, range: 2 },
  { id: 'bhishma', name: 'Bhishma', boardName: 'Bhish', mark: 'B', side: 'kaurava', row: 1, col: 4, hp: 4, power: 2, range: 1 },
];

export function initKurukshetraGame() {
  const root = document.querySelector('[data-arena]');
  if (!root) return;

  const board = root.querySelector('[data-board]');
  const roundLabel = root.querySelector('[data-round]');
  const turnLabel = root.querySelector('[data-turn]');
  const instruction = root.querySelector('[data-instruction]');
  const roster = root.querySelector('[data-roster]');
  const log = root.querySelector('[data-log]');
  const endTurnButton = root.querySelector('[data-end-turn]');
  const cells = [];
  let state;
  let aiTimer = 0;

  for (let row = 0; row < SIZE; row += 1) {
    const rowElement = document.createElement('div');
    rowElement.className = 'arena__row';
    rowElement.setAttribute('role', 'row');
    const rowCells = [];

    for (let col = 0; col < SIZE; col += 1) {
      const cell = document.createElement('button');
      cell.className = 'arena__cell';
      cell.type = 'button';
      cell.setAttribute('role', 'gridcell');
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      rowElement.append(cell);
      rowCells.push(cell);
    }

    board.append(rowElement);
    cells.push(rowCells);
  }

  function newBattle() {
    window.clearTimeout(aiTimer);
    state = {
      units: STARTING_ARMIES.map((unit) => ({ ...unit, maxHp: unit.hp, moved: false, attacked: false })),
      round: 1,
      side: 'pandava',
      selectedId: null,
      gameOver: false,
      thinking: false,
    };
    log.textContent = 'The armies await your command.';
    setInstruction('Select a Pandava to see available actions.');
    render();
  }

  function alive(side) {
    return state.units.filter((unit) => unit.side === side && unit.hp > 0);
  }

  function unitAt(row, col) {
    return state.units.find((unit) => unit.hp > 0 && unit.row === row && unit.col === col);
  }

  function distance(a, b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
  }

  function inRange(attacker, target) {
    const deltaRow = Math.abs(attacker.row - target.row);
    const deltaCol = Math.abs(attacker.col - target.col);
    const chebyshev = Math.max(deltaRow, deltaCol);
    if (attacker.range === 1) {
      // Melee champions strike in all 8 adjacent directions (orthogonal and diagonal)
      return chebyshev === 1;
    }
    // Ranged champions (Arjuna, Karna) strike up to 2 squares in any direction
    return chebyshev > 0 && chebyshev <= attacker.range;
  }

  function canAct(unit) {
    return unit && unit.hp > 0 && (!unit.moved || !unit.attacked) && !state.gameOver && !state.thinking && state.side === unit.side;
  }

  function availableMoves(unit) {
    return DIRECTIONS
      .map(([dr, dc]) => [unit.row + dr, unit.col + dc])
      .filter(([row, col]) => row >= 0 && row < SIZE && col >= 0 && col < SIZE && !unitAt(row, col));
  }

  function availableTargets(unit) {
    return alive(unit.side === 'pandava' ? 'kaurava' : 'pandava')
      .filter((target) => inRange(unit, target));
  }

  function sideHasActions(side) {
    return alive(side).some((unit) => !unit.moved || !unit.attacked);
  }

  function setInstruction(message) {
    instruction.textContent = message;
  }

  function render() {
    const selected = state.units.find((unit) => unit.id === state.selectedId);
    const moves = selected && canAct(selected) && !selected.moved ? availableMoves(selected) : [];
    const targets = selected && canAct(selected) && !selected.attacked ? availableTargets(selected) : [];
    const movesSet = new Set(moves.map(([row, col]) => `${row},${col}`));
    const targetsSet = new Set(targets.map((unit) => `${unit.row},${unit.col}`));

    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        const cell = cells[row][col];
        const unit = unitAt(row, col);
        const key = `${row},${col}`;
        cell.replaceChildren();
        cell.className = 'arena__cell';
        if (unit) {
          const piece = document.createElement('span');
          piece.className = `arena__piece arena__piece--${unit.side}`;
          piece.setAttribute('aria-hidden', 'true');
          const mark = document.createElement('span');
          mark.className = 'arena__piece-mark';
          mark.textContent = unit.mark;
          const name = document.createElement('span');
          name.className = 'arena__piece-name';
          name.textContent = unit.boardName;
          piece.append(mark, name);
          cell.append(piece);
          cell.setAttribute('aria-label', `${unit.name}, ${unit.side === 'pandava' ? 'Pandavas' : 'Kauravas'}, ${unit.hp} of ${unit.maxHp} vitality. Row ${row + 1}, column ${col + 1}.`);
          if (unit.id === state.selectedId) cell.classList.add('arena__cell--selected');
          if (targetsSet.has(key)) cell.classList.add('arena__cell--attack');
        } else {
          cell.setAttribute('aria-label', `Empty square, row ${row + 1}, column ${col + 1}${movesSet.has(key) ? ', move here' : ''}.`);
          if (movesSet.has(key)) cell.classList.add('arena__cell--move');
        }
        cell.tabIndex = row === 0 && col === 0 ? 0 : -1;
      }
    }

    roundLabel.textContent = `Round ${state.round}`;
    turnLabel.textContent = state.gameOver
      ? (alive('pandava').length ? 'Pandavas · Victory' : 'Kauravas · Victory')
      : state.side === 'pandava' ? 'Pandavas · Your turn' : 'Kauravas · Computer turn';
    turnLabel.classList.toggle('arena__turn--enemy', state.side === 'kaurava' || (state.gameOver && !alive('pandava').length));
    endTurnButton.disabled = state.side !== 'pandava' || state.gameOver || state.thinking;
    renderRoster();
  }

  function renderRoster() {
    roster.replaceChildren();
    for (const [side, label] of [['pandava', 'Pandavas'], ['kaurava', 'Kauravas · Computer']]) {
      const group = document.createElement('div');
      group.className = 'arena__roster-side';
      const title = document.createElement('span');
      title.className = `arena__roster-title arena__roster-title--${side}`;
      title.textContent = label;
      group.append(title);
      state.units.filter((unit) => unit.side === side).forEach((unit) => {
        const row = document.createElement('span');
        row.className = `arena__health${unit.hp <= 0 ? ' arena__health--retreated' : ''}`;
        row.innerHTML = `<span>${unit.name}</span><span>${unit.hp > 0 ? `${unit.hp}/${unit.maxHp}` : 'Retreated'}</span>`;
        group.append(row);
      });
      roster.append(group);
    }
  }

  function announceAction(message, { advance = true } = {}) {
    const actor = state.units.find((unit) => unit.id === message.unitId);
    actor[message.action] = true;
    state.selectedId = (state.side === 'pandava' && canAct(actor)) ? actor.id : null;
    log.textContent = message.text;
    const pandavasAlive = alive('pandava').length;
    const kauravasAlive = alive('kaurava').length;
    if (kauravasAlive === 0 || pandavasAlive === 0) {
      state.gameOver = true;
      state.side = kauravasAlive === 0 ? 'pandava' : 'kaurava';
      setInstruction(kauravasAlive === 0 ? 'Victory! The Pandavas hold the field.' : 'The Kauravas hold the field. Begin another battle?');
      render();
      return;
    }

    render();
    if (advance && !sideHasActions(state.side)) finishSide();
    else if (state.side === 'pandava' && message.action === 'moved' && !actor.attacked) {
      const targets = availableTargets(actor);
      setInstruction(targets.length
        ? `${actor.name} moved. Select a red-highlighted rival to attack for ${actor.power} damage, or choose another champion.`
        : `${actor.name} moved. No rival is in range yet; choose another champion or finish your turn.`);
    } else if (state.side === 'pandava' && message.action === 'attacked' && !actor.moved) {
      setInstruction(`${actor.name} attacked! You may still move them to a highlighted square, or select another champion.`);
    } else setInstruction(state.side === 'pandava' ? 'Choose another Pandava, or finish your turn.' : 'The Kaurava commanders are taking their turn.');
  }

  function attack(attacker, target, advance = true) {
    target.hp = Math.max(0, target.hp - attacker.power);
    const retreat = target.hp === 0 ? `${target.name} retreats from the field.` : `${target.name} has ${target.hp} vitality remaining.`;
    announceAction({ unitId: attacker.id, action: 'attacked', text: `${attacker.name} deals ${attacker.power} damage to ${target.name}. ${retreat}` }, { advance });
  }

  function move(unit, row, col, advance = true) {
    unit.row = row;
    unit.col = col;
    announceAction({ unitId: unit.id, action: 'moved', text: `${unit.name} advances across the field.` }, { advance });
  }

  function handleCellClick(event) {
    const cell = event.target.closest('.arena__cell');
    if (!cell || !board.contains(cell) || state.side !== 'pandava' || state.thinking || state.gameOver) return;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const occupant = unitAt(row, col);
    const selected = state.units.find((unit) => unit.id === state.selectedId);

    if (occupant?.side === 'pandava') {
      if (canAct(occupant)) {
        state.selectedId = occupant.id;
        const targets = !occupant.attacked ? availableTargets(occupant).length : 0;
        const moves = !occupant.moved ? availableMoves(occupant).length : 0;
        const attackHint = occupant.attacked ? 'already attacked' : targets ? `${targets} rival${targets === 1 ? '' : 's'} in range; strike for ${occupant.power} damage` : 'no rivals in range';
        const moveHint = occupant.moved ? 'already moved' : moves ? 'choose a highlighted square to advance' : 'no open square to move to';
        setInstruction(`${occupant.name}: ${attackHint}; ${moveHint}. You can move and attack once each round.`);
        render();
      } else {
        setInstruction(`${occupant.name} has already acted this round.`);
      }
      return;
    }

    if (occupant?.side === 'kaurava') {
      if (selected && !selected.attacked && availableTargets(selected).includes(occupant)) {
        attack(selected, occupant);
        return;
      }

      // Step-and-strike: if selected hasn't moved and can step adjacent and attack
      if (selected && !selected.moved && !selected.attacked) {
        const moves = availableMoves(selected);
        const stepAndStrike = moves.find(([mRow, mCol]) => {
          const virtual = { ...selected, row: mRow, col: mCol };
          return inRange(virtual, occupant);
        });
        if (stepAndStrike) {
          move(selected, stepAndStrike[0], stepAndStrike[1], false);
          attack(selected, occupant, true);
          return;
        }
      }

      // If no valid attack from selected, check if any other active Pandava can attack this rival directly
      const capablePandava = alive('pandava').find((p) => canAct(p) && !p.attacked && availableTargets(p).includes(occupant));
      if (capablePandava) {
        state.selectedId = capablePandava.id;
        attack(capablePandava, occupant);
        return;
      }

      setInstruction('That rival is out of reach. Move closer or select another champion.');
      return;
    }

    if (!selected || !canAct(selected)) {
      setInstruction('Select a Pandava to see available actions.');
      return;
    }

    if (!occupant && !selected.moved && availableMoves(selected).some(([moveRow, moveCol]) => moveRow === row && moveCol === col)) {
      move(selected, row, col);
      return;
    }

    setInstruction('You may move once and attack once. Choose a highlighted square or rival.');
  }

  function nextSide() {
    state.selectedId = null;
    state.units.forEach((unit) => { unit.moved = false; unit.attacked = false; });
    if (state.side === 'pandava') {
      state.side = 'kaurava';
      state.thinking = true;
      setInstruction('The Kaurava commanders consider their next move.');
      render();
      runComputerTurn();
    } else {
      state.side = 'pandava';
      state.round += 1;
      setInstruction('Your turn. Select a Pandava to command.');
      render();
    }
  }

  function finishSide() {
    if (state.gameOver) return;
    nextSide();
  }

  function chooseComputerAction(unit) {
    const targets = unit.attacked ? [] : availableTargets(unit);
    if (targets.length) {
      targets.sort((a, b) => (a.hp - Math.min(unit.power, a.hp)) - (b.hp - Math.min(unit.power, b.hp)) || a.hp - b.hp);
      return { type: 'attack', target: targets[0] };
    }

    if (unit.moved) return { type: 'passAttack' };

    const opponents = alive('pandava');
    const moves = availableMoves(unit);
    let best = null;
    for (const [row, col] of moves) {
      const candidate = { row, col };
      const closest = Math.min(...opponents.map((opponent) => distance(candidate, opponent)));
      const isInArjunaRange = opponents.some((opponent) => opponent.id === 'arjuna' && distance(candidate, opponent) <= 1);
      const score = closest + (isInArjunaRange ? 0.7 : 0) + (Math.abs(col - 2.5) * 0.035);
      if (!best || score < best.score) best = { type: 'move', row, col, score };
    }
    return best || { type: 'passMove' };
  }

  function runComputerTurn() {
    const act = () => {
      if (state.gameOver) return;
      const unit = state.units.find((candidate) => candidate.side === 'kaurava' && candidate.hp > 0 && (!candidate.moved || !candidate.attacked));
      if (!unit) {
        state.thinking = false;
        nextSide();
        return;
      }
      const action = chooseComputerAction(unit);
      if (action?.type === 'attack') attack(unit, action.target, false);
      else if (action?.type === 'move') move(unit, action.row, action.col, false);
      else {
        unit[action?.type === 'passMove' ? 'moved' : 'attacked'] = true;
        log.textContent = `${unit.name} holds position.`;
        render();
      }
      if (!state.gameOver) {
        if (!sideHasActions('kaurava')) {
          state.thinking = false;
          nextSide();
          return;
        }
        state.thinking = true;
        render();
        aiTimer = window.setTimeout(act, 420);
      }
    };
    aiTimer = window.setTimeout(act, 520);
  }

  board.addEventListener('click', handleCellClick);
  board.addEventListener('keydown', (event) => {
    const cell = event.target.closest('.arena__cell');
    if (!cell) return;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const delta = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[event.key];
    if (!delta) return;
    event.preventDefault();
    const nextRow = Math.max(0, Math.min(SIZE - 1, row + delta[0]));
    const nextCol = Math.max(0, Math.min(SIZE - 1, col + delta[1]));
    cells[nextRow][nextCol].focus();
  });
  endTurnButton.addEventListener('click', finishSide);
  root.querySelector('[data-restart]').addEventListener('click', newBattle);
  newBattle();
}
