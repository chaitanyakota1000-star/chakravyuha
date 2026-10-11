// ===========================================================
// KURUKSHETRA BATTLEFIELD — GAME CONTROLLER & UI
// Connects Engine, Tactical AI, Visuals, and Audio into
// a seamless 8x8 tactical browser battle experience.
// ===========================================================

import { BattleEngine, GRID_SIZE } from './engine.js';
import { KauravaAI } from './ai.js';
import { BattlefieldVisuals } from './visuals.js';
import { battlefieldAudio } from './audio.js';

export class KurukshetraBattlefield {
  constructor(rootContainer) {
    this.root = rootContainer;
    this.engine = new BattleEngine();
    this.ai = new KauravaAI(this.engine);
    this.isInputLocked = false;

    this.initDOM();
    this.visuals = new BattlefieldVisuals(this.boardEl, this.fxContainer);
    this.bindEvents();
    this.render();
  }

  initDOM() {
    this.root.innerHTML = `
      <div class="bf-wrapper">
        <!-- Top Controls & Status Bar -->
        <div class="bf-topbar">
          <div class="bf-phase-pill">
            <span class="bf-round-badge" id="bf-round-label">Round 1</span>
            <span class="bf-turn-status" id="bf-turn-label">Pandavas · Your Turn</span>
          </div>
          <div class="bf-top-actions">
            <button class="bf-btn-icon" id="bf-audio-toggle" title="Toggle Sound">🔊</button>
            <button class="bf-btn-secondary" id="bf-restart-btn">New Battle</button>
          </div>
        </div>

        <!-- Main Arena Grid & Roster Layout -->
        <div class="bf-arena-layout">
          <!-- Kaurava Roster (Top / Computer) -->
          <div class="bf-team-roster bf-team-roster--kaurava">
            <div class="bf-roster-header">
              <span class="bf-roster-flag bf-roster-flag--kaurava">🚩</span>
              <h3>Kaurava Commanders</h3>
            </div>
            <div class="bf-champion-cards" id="bf-kaurava-cards"></div>
          </div>

          <!-- 8x8 Tactical Grid -->
          <div class="bf-board-container">
            <!-- Coordinate Labels -->
            <div class="bf-coords-top">
              ${['A','B','C','D','E','F','G','H'].map(c => `<span>${c}</span>`).join('')}
            </div>
            <div class="bf-board-inner">
              <div class="bf-coords-left">
                ${[8,7,6,5,4,3,2,1].map(r => `<span>${r}</span>`).join('')}
              </div>
              <div class="bf-grid" id="bf-grid" role="grid" aria-label="8x8 Kurukshetra Tactical Field"></div>
              <div class="bf-fx-overlay" id="bf-fx-overlay"></div>
            </div>

            <!-- Legend & Instructions -->
            <div class="bf-board-footer">
              <div class="bf-legend">
                <span class="bf-legend-item"><i class="bf-legend-dot bf-legend-dot--move"></i> Move</span>
                <span class="bf-legend-item"><i class="bf-legend-dot bf-legend-dot--attack"></i> Attack</span>
                <span class="bf-legend-item"><i class="bf-legend-dot bf-legend-dot--selected"></i> Selected</span>
              </div>
              <button class="bf-btn-primary" id="bf-end-turn-btn">Finish Turn →</button>
            </div>
          </div>

          <!-- Pandava Roster (Bottom / Player) -->
          <div class="bf-team-roster bf-team-roster--pandava">
            <div class="bf-roster-header">
              <span class="bf-roster-flag bf-roster-flag--pandava">⚔️</span>
              <h3>Pandava Champions</h3>
            </div>
            <div class="bf-champion-cards" id="bf-pandava-cards"></div>
          </div>
        </div>

        <!-- Combat Log Banner -->
        <div class="bf-log-strip">
          <span class="bf-log-prompt" id="bf-instruction">Select a Pandava to command (Yudhishthira, Bhima, or Arjuna).</span>
          <p class="bf-log-latest" id="bf-log-latest">The battlefield awaits your command.</p>
        </div>

        <!-- Banner Announcement Overlay -->
        <div class="bf-banner-overlay" id="bf-banner-overlay">
          <div class="bf-banner-box">
            <h2 id="bf-banner-title">Pandavas' Command</h2>
            <p id="bf-banner-sub">Lead with Dharma</p>
          </div>
        </div>
      </div>
    `;

    this.boardEl = this.root.querySelector('#bf-grid');
    this.fxContainer = this.root.querySelector('#bf-fx-overlay');
    this.roundLabel = this.root.querySelector('#bf-round-label');
    this.turnLabel = this.root.querySelector('#bf-turn-label');
    this.endTurnBtn = this.root.querySelector('#bf-end-turn-btn');
    this.restartBtn = this.root.querySelector('#bf-restart-btn');
    this.audioBtn = this.root.querySelector('#bf-audio-toggle');
    this.instructionEl = this.root.querySelector('#bf-instruction');
    this.logLatestEl = this.root.querySelector('#bf-log-latest');
    this.pandavaCardsEl = this.root.querySelector('#bf-pandava-cards');
    this.kauravaCardsEl = this.root.querySelector('#bf-kaurava-cards');
    this.bannerOverlay = this.root.querySelector('#bf-banner-overlay');

    // Build 8x8 Grid Cells
    this.cells = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = `bf-cell ${((r + c) % 2 === 0) ? 'bf-cell--even' : 'bf-cell--odd'}`;
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);
        this.boardEl.appendChild(cell);
        row.push(cell);
      }
      this.cells.push(row);
    }
  }

  bindEvents() {
    this.boardEl.addEventListener('click', (e) => this.handleCellClick(e));
    this.endTurnBtn.addEventListener('click', () => this.handleEndTurn());
    this.restartBtn.addEventListener('click', () => this.restart());
    this.audioBtn.addEventListener('click', () => {
      const muted = battlefieldAudio.toggleMute();
      this.audioBtn.textContent = muted ? '🔇' : '🔊';
    });
  }

  restart() {
    this.engine.reset();
    this.isInputLocked = false;
    this.showBanner("Battle Reset", "Begin your march at Kurukshetra");
    this.render();
  }

  async handleCellClick(e) {
    if (this.isInputLocked || this.engine.isGameOver || this.engine.turn !== 'pandava') return;

    const cell = e.target.closest('.bf-cell');
    if (!cell) return;

    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const occupant = this.engine.getChampionAt(row, col);
    const selected = this.engine.getChampion(this.engine.selectedChampionId);

    // 1. Click on own Pandava champion -> Select
    if (occupant && occupant.side === 'pandava') {
      if (this.engine.canChampionAct(occupant)) {
        this.engine.selectedChampionId = occupant.id;
        battlefieldAudio.playSelect();
        this.updateInstructionForSelected(occupant);
        this.render();
      } else {
        this.setInstruction(`${occupant.name} has already moved and attacked this round.`);
      }
      return;
    }

    // 2. If a Pandava is selected: Check move or attack action
    if (selected && !selected.isRetreated) {
      // Check Move
      const validMoves = this.engine.getValidMoves(selected);
      const isMove = validMoves.some(m => m.row === row && m.col === col);

      if (isMove && !selected.hasMoved) {
        this.isInputLocked = true;
        const pieceEl = this.cells[selected.row][selected.col].querySelector('.bf-piece');

        await this.visuals.animateMove(pieceEl, selected.row, selected.col, row, col);
        this.engine.moveChampion(selected.id, row, col);

        this.isInputLocked = false;
        this.updateInstructionForSelected(selected);
        this.render();
        return;
      }

      // Check Attack
      if (occupant && occupant.side === 'kaurava') {
        const validTargets = this.engine.getValidTargets(selected);
        const isTarget = validTargets.some(t => t.id === occupant.id);

        if (isTarget && !selected.hasAttacked) {
          this.isInputLocked = true;
          const result = this.engine.attackTarget(selected.id, occupant.id);

          await this.visuals.animateAttack(selected, occupant, result.damage, result.defeated);

          this.isInputLocked = false;

          if (result.isGameOver) {
            this.handleGameOver();
            return;
          }

          this.updateInstructionForSelected(selected);
          this.render();
          return;
        }
      }
    }

    // Clicked empty neutral cell without move -> Deselect
    this.engine.selectedChampionId = null;
    this.setInstruction('Select a Pandava champion to command.');
    this.render();
  }

  updateInstructionForSelected(champ) {
    const moves = this.engine.getValidMoves(champ).length;
    const targets = this.engine.getValidTargets(champ).length;

    if (!champ.hasMoved && !champ.hasAttacked) {
      this.setInstruction(`${champ.name}: ${moves} legal moves (green), ${targets} targets in range (red). Attack: ${champ.power} DMG.`);
    } else if (champ.hasMoved && !champ.hasAttacked) {
      this.setInstruction(`${champ.name} has advanced! Select a red target to strike for ${champ.power} DMG, or select another champion.`);
    } else if (!champ.hasMoved && champ.hasAttacked) {
      this.setInstruction(`${champ.name} struck! You may still advance them to a green square.`);
    } else {
      this.setInstruction(`${champ.name} has finished both actions. Choose another champion or finish turn.`);
    }
  }

  async handleEndTurn() {
    if (this.isInputLocked || this.engine.isGameOver || this.engine.turn !== 'pandava') return;

    this.engine.finishTurn();
    this.render();
    await this.executeKauravaTurn();
  }

  async executeKauravaTurn() {
    this.isInputLocked = true;
    await this.showBanner("Kaurava Commanders' Turn", "The army of Duryodhana mobilizes");

    const plans = this.ai.planTurn();

    for (const plan of plans) {
      if (this.engine.isGameOver) break;

      const champ = this.engine.getChampion(plan.championId);
      if (!champ || champ.isRetreated) continue;

      // Highlight active enemy commander
      this.engine.selectedChampionId = champ.id;
      this.render();
      await this.sleep(450);

      // 1. Execute Move if planned
      if (plan.move) {
        const pieceEl = this.cells[champ.row][champ.col].querySelector('.bf-piece');
        await this.visuals.animateMove(pieceEl, champ.row, champ.col, plan.move.row, plan.move.col);
        this.engine.moveChampion(champ.id, plan.move.row, plan.move.col);
        this.render();
        await this.sleep(300);
      }

      // 2. Execute Attack if planned
      if (plan.attack) {
        const target = this.engine.getChampion(plan.attack);
        if (target && !target.isRetreated) {
          const result = this.engine.attackTarget(champ.id, target.id);
          await this.visuals.animateAttack(champ, target, result.damage, result.defeated);
          this.render();

          if (result.isGameOver) {
            this.handleGameOver();
            return;
          }
          await this.sleep(350);
        }
      }

      await this.sleep(250);
    }

    if (!this.engine.isGameOver) {
      this.engine.finishTurn();
      await this.showBanner(`Round ${this.engine.round}`, "Pandavas' Turn — Command the Field");
      this.isInputLocked = false;
      this.render();
    }
  }

  handleGameOver() {
    this.isInputLocked = false;
    const isPandavaVictory = this.engine.winner === 'pandava';

    if (isPandavaVictory) {
      battlefieldAudio.playVictory();
      this.showBanner("VICTORY FOR DHARMA!", "All Kaurava commanders have retreated! The Pandavas hold Kurukshetra.", 5000);
    } else {
      battlefieldAudio.playRetreat();
      this.showBanner("DEFEAT AT KURUKSHETRA", "The Pandavas have fallen. Duryodhana holds the field.", 5000);
    }
    this.render();
  }

  showBanner(title, subtitle, duration = 1800) {
    const titleEl = this.bannerOverlay.querySelector('#bf-banner-title');
    const subEl = this.bannerOverlay.querySelector('#bf-banner-sub');

    titleEl.textContent = title;
    subEl.textContent = subtitle;

    this.bannerOverlay.classList.add('is-active');

    return new Promise(resolve => {
      setTimeout(() => {
        this.bannerOverlay.classList.remove('is-active');
        resolve();
      }, duration);
    });
  }

  setInstruction(text) {
    this.instructionEl.textContent = text;
  }

  render() {
    const selected = this.engine.getChampion(this.engine.selectedChampionId);
    const validMoves = (selected && !selected.hasMoved && this.engine.turn === selected.side) ? this.engine.getValidMoves(selected) : [];
    const validTargets = (selected && !selected.hasAttacked && this.engine.turn === selected.side) ? this.engine.getValidTargets(selected) : [];

    const moveSet = new Set(validMoves.map(m => `${m.row},${m.col}`));
    const targetSet = new Set(validTargets.map(t => `${t.row},${t.col}`));

    // Render 8x8 Grid
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = this.cells[r][c];
        const occupant = this.engine.getChampionAt(r, c);
        const key = `${r},${c}`;

        cell.className = `bf-cell ${((r + c) % 2 === 0) ? 'bf-cell--even' : 'bf-cell--odd'}`;
        cell.replaceChildren();

        if (occupant) {
          const piece = document.createElement('div');
          piece.className = `bf-piece bf-piece--${occupant.side} ${occupant.id === this.engine.selectedChampionId ? 'is-selected' : ''}`;
          
          piece.innerHTML = `
            <div class="bf-piece-avatar" style="border-color: ${occupant.color};">
              <img src="${occupant.portrait}" alt="${occupant.name}" draggable="false" />
            </div>
            <div class="bf-piece-badge">${occupant.name.slice(0, 3)}</div>
            <div class="bf-piece-hp-track">
              <div class="bf-piece-hp-fill" style="width: ${(occupant.hp / occupant.maxHp) * 100}%;"></div>
            </div>
          `;
          cell.appendChild(piece);

          if (targetSet.has(key)) {
            cell.classList.add('bf-cell--attack-target');
          }
        } else if (moveSet.has(key)) {
          cell.classList.add('bf-cell--move-target');
        }
      }
    }

    // Status Badges
    this.roundLabel.textContent = `Round ${this.engine.round}`;
    this.turnLabel.textContent = this.engine.isGameOver
      ? (this.engine.winner === 'pandava' ? 'Pandavas · Victory' : 'Kauravas · Victory')
      : (this.engine.turn === 'pandava' ? 'Pandavas · Your Turn' : 'Kauravas · AI Turn');

    this.turnLabel.className = `bf-turn-status ${this.engine.turn === 'kaurava' ? 'bf-turn-status--enemy' : ''}`;
    this.endTurnBtn.disabled = this.isInputLocked || this.engine.turn !== 'pandava' || this.engine.isGameOver;

    this.logLatestEl.textContent = this.engine.logs[0] || '';

    // Render Team Roster Cards
    this.renderRosterCards(this.pandavaCardsEl, 'pandava');
    this.renderRosterCards(this.kauravaCardsEl, 'kaurava');
  }

  renderRosterCards(container, side) {
    container.innerHTML = '';
    const champions = this.engine.champions.filter(c => c.side === side);

    champions.forEach(champ => {
      const card = document.createElement('div');
      const isSelected = champ.id === this.engine.selectedChampionId;
      card.className = `bf-roster-card ${champ.isRetreated ? 'is-retreated' : ''} ${isSelected ? 'is-selected' : ''}`;

      card.innerHTML = `
        <div class="bf-card-visual">
          <img src="${champ.portrait}" alt="${champ.name}" draggable="false" />
        </div>
        <div class="bf-card-info">
          <div class="bf-card-head">
            <span class="bf-card-name">${champ.name}</span>
            <span class="bf-card-hp">${champ.isRetreated ? 'Retreated' : `${champ.hp}/${champ.maxHp}`}</span>
          </div>
          <div class="bf-card-track">
            <div class="bf-card-fill" style="width: ${champ.isRetreated ? 0 : (champ.hp / champ.maxHp) * 100}%; background: ${champ.color};"></div>
          </div>
          <div class="bf-card-actions">
            <span class="bf-badge ${champ.hasMoved ? 'is-done' : 'is-ready'}">${champ.hasMoved ? 'Moved ✓' : 'Move Ready'}</span>
            <span class="bf-badge ${champ.hasAttacked ? 'is-done' : 'is-ready'}">${champ.hasAttacked ? 'Attacked ✓' : 'Atk Ready'}</span>
            <span class="bf-stat-badge">⚡ ${champ.power} DMG · 🏹 Rng ${champ.range}</span>
          </div>
        </div>
      `;

      if (side === 'pandava' && !champ.isRetreated && !this.isInputLocked && this.engine.turn === 'pandava') {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
          this.engine.selectedChampionId = champ.id;
          battlefieldAudio.playSelect();
          this.updateInstructionForSelected(champ);
          this.render();
        });
      }

      container.appendChild(card);
    });
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}

export function initBattlefieldGame() {
  const container = document.querySelector('[data-arena]');
  if (!container) return null;
  return new KurukshetraBattlefield(container);
}
