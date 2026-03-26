/**
 * Tic-Tac-Toe — DOM mode
 */

import { createSignal } from 'solid-js';
import type {
  GameControllerDeps,
  GameController,
  SetupGame,
} from '~/game/mygame-contract';

type Cell = 'X' | 'O' | null;
type Board = Cell[];

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6],         // diags
];

function checkWinner(board: Board): Cell {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function isDraw(board: Board): boolean {
  return board.every(c => c !== null);
}

export const setupGame: SetupGame = (deps: GameControllerDeps): GameController => {
  const [ariaText, setAriaText] = createSignal('Tic-Tac-Toe');
  let wrapper: HTMLDivElement | null = null;

  // Game state
  let board: Board = Array(9).fill(null);
  let turn: 'X' | 'O' = 'X';
  let gameOver = false;
  let cells: HTMLButtonElement[] = [];
  let statusEl: HTMLDivElement | null = null;
  let moveCount = 0;
  const startTime = Date.now();

  const analytics = deps.analytics as {
    capture?: (event: string, props?: Record<string, unknown>) => void;
    core?: { capture: (event: string, props?: Record<string, unknown>) => void };
  };

  const capture = (event: string, props?: Record<string, unknown>) => {
    if (analytics?.core?.capture) analytics.core.capture(event, props);
    else if (analytics?.capture) analytics.capture(event, props);
  };

  function updateUI() {
    cells.forEach((cell, i) => {
      cell.textContent = board[i] ?? '';
      cell.style.color = board[i] === 'X' ? '#4a8c1c' : '#c44536';
      cell.disabled = gameOver || board[i] !== null;
    });

    const winner = checkWinner(board);
    if (winner) {
      gameOver = true;
      if (statusEl) statusEl.textContent = `${winner} wins!`;
      setAriaText(`${winner} wins!`);
      capture('level_complete', {
        level_id: 'tictactoe',
        time_to_complete: parseFloat(((Date.now() - startTime) / 1000).toFixed(2)),
        score: winner === 'X' ? 1 : 0,
      });
    } else if (isDraw(board)) {
      gameOver = true;
      if (statusEl) statusEl.textContent = "It's a draw!";
      setAriaText("It's a draw!");
      capture('level_complete', {
        level_id: 'tictactoe',
        time_to_complete: parseFloat(((Date.now() - startTime) / 1000).toFixed(2)),
        score: 0,
      });
    } else {
      if (statusEl) statusEl.textContent = `${turn}'s turn`;
      setAriaText(`${turn}'s turn`);
    }
  }

  function handleClick(i: number) {
    if (gameOver || board[i]) return;
    board[i] = turn;
    moveCount++;
    turn = turn === 'X' ? 'O' : 'X';
    updateUI();
  }

  function reset() {
    board = Array(9).fill(null);
    turn = 'X';
    gameOver = false;
    moveCount = 0;
    updateUI();
    capture('level_restart', { level_id: 'tictactoe', restart_count: 1 });
  }

  return {
    gameMode: 'dom',

    init(container: HTMLDivElement) {
      setAriaText("X's turn");
      capture('level_start', { level_id: 'tictactoe' });

      wrapper = document.createElement('div');
      wrapper.style.cssText =
        'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:16px;font-family:system-ui,sans-serif;';

      // Status
      statusEl = document.createElement('div');
      statusEl.textContent = "X's turn";
      statusEl.style.cssText = 'font-size:1.5rem;font-weight:700;color:#fff;';

      // Grid
      const grid = document.createElement('div');
      grid.style.cssText =
        'display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:240px;height:240px;';

      cells = [];
      for (let i = 0; i < 9; i++) {
        const btn = document.createElement('button');
        btn.style.cssText =
          'width:100%;height:100%;border:none;border-radius:8px;background:#222;' +
          'font-size:2.5rem;font-weight:900;cursor:pointer;transition:background 0.15s;' +
          'font-family:system-ui,sans-serif;';
        btn.onmouseenter = () => { if (!btn.disabled) btn.style.background = '#333'; };
        btn.onmouseleave = () => { btn.style.background = '#222'; };
        btn.addEventListener('click', () => handleClick(i));
        cells.push(btn);
        grid.append(btn);
      }

      // Reset button
      const resetBtn = document.createElement('button');
      resetBtn.textContent = 'New Game';
      resetBtn.style.cssText =
        'font-size:1rem;font-weight:600;padding:10px 32px;border:none;border-radius:8px;' +
        'background:#4a8c1c;color:#fff;cursor:pointer;margin-top:8px;transition:transform 0.1s;';
      resetBtn.onmouseenter = () => { resetBtn.style.transform = 'scale(1.05)'; };
      resetBtn.onmouseleave = () => { resetBtn.style.transform = 'scale(1)'; };
      resetBtn.addEventListener('click', reset);

      wrapper.append(statusEl, grid, resetBtn);
      container.append(wrapper);
    },

    destroy() {
      wrapper?.remove();
      wrapper = null;
      cells = [];
      statusEl = null;
    },

    ariaText,
  };
};
