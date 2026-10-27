// server/tests/tictactoe.test.js
const TicTacToeEngine = require('../games/TicTacToeEngine');

describe('TicTacToeEngine Unit Tests', () => {
  const p1 = { id: 'player1_id', username: 'Alice' };
  const p2 = { id: 'player2_id', username: 'Bob' };

  let engine;

  beforeEach(() => {
    engine = new TicTacToeEngine([p1, p2]);
  });

  test('Initializes with 9 empty cells and X starts', () => {
    const state = engine.getState();
    expect(state.board).toEqual(Array(9).fill(null));
    expect(state.currentTurn).toBe(p1.id);
    expect(state.status).toBe('IN_PROGRESS');
    expect(state.players[0].symbol).toBe('X');
    expect(state.players[1].symbol).toBe('O');
  });

  test('Accepts valid alternating moves and updates board', () => {
    // P1 moves to 0
    let res = engine.makeMove(p1.id, 0);
    expect(res.success).toBe(true);
    expect(res.state.board[0]).toBe('X');
    expect(res.state.currentTurn).toBe(p2.id);

    // P2 moves to 1
    res = engine.makeMove(p2.id, 1);
    expect(res.success).toBe(true);
    expect(res.state.board[1]).toBe('O');
    expect(res.state.currentTurn).toBe(p1.id);
  });

  test('Rejects move when not player\'s turn', () => {
    // P2 attempts to move first
    const res = engine.makeMove(p2.id, 0);
    expect(res.success).toBe(false);
    expect(res.error).toBe('Not your turn.');
    expect(engine.getState().board[0]).toBeNull();
  });

  test('Rejects move on already occupied square', () => {
    engine.makeMove(p1.id, 4); // Center
    const res = engine.makeMove(p2.id, 4); // Bob tries center
    expect(res.success).toBe(false);
    expect(res.error).toBe('Square is already occupied.');
  });

  test('Rejects out-of-bounds positions', () => {
    const res1 = engine.makeMove(p1.id, 9);
    expect(res1.success).toBe(false);
    const res2 = engine.makeMove(p1.id, -1);
    expect(res2.success).toBe(false);
  });

  test('Detects horizontal win (row 0: [0, 1, 2])', () => {
    engine.makeMove(p1.id, 0); // X
    engine.makeMove(p2.id, 3); // O
    engine.makeMove(p1.id, 1); // X
    engine.makeMove(p2.id, 4); // O
    const res = engine.makeMove(p1.id, 2); // X completes row

    expect(res.success).toBe(true);
    expect(res.state.status).toBe('WIN');
    expect(res.state.winner.id).toBe(p1.id);
    expect(res.state.winningLine).toEqual([0, 1, 2]);
    expect(engine.isGameOver()).toBe(true);
  });

  test('Detects vertical win (col 1: [1, 4, 7])', () => {
    engine.makeMove(p1.id, 1); // X
    engine.makeMove(p2.id, 0); // O
    engine.makeMove(p1.id, 4); // X
    engine.makeMove(p2.id, 2); // O
    const res = engine.makeMove(p1.id, 7); // X completes column

    expect(res.success).toBe(true);
    expect(res.state.status).toBe('WIN');
    expect(res.state.winner.id).toBe(p1.id);
    expect(res.state.winningLine).toEqual([1, 4, 7]);
  });

  test('Detects diagonal win ([0, 4, 8])', () => {
    engine.makeMove(p1.id, 0); // X
    engine.makeMove(p2.id, 1); // O
    engine.makeMove(p1.id, 4); // X
    engine.makeMove(p2.id, 2); // O
    const res = engine.makeMove(p1.id, 8); // X completes diagonal

    expect(res.success).toBe(true);
    expect(res.state.status).toBe('WIN');
    expect(res.state.winner.id).toBe(p1.id);
    expect(res.state.winningLine).toEqual([0, 4, 8]);
  });

  test('Detects draw game when board is full without winner', () => {
    // Fill board with draw sequence:
    // X O X
    // X O O
    // O X X
    const moves = [
      [p1.id, 0], [p2.id, 1], [p1.id, 2],
      [p2.id, 4], [p1.id, 3], [p2.id, 5],
      [p1.id, 7], [p2.id, 6], [p1.id, 8]
    ];

    let finalState;
    for (const [pid, pos] of moves) {
      const res = engine.makeMove(pid, pos);
      finalState = res.state;
    }

    expect(finalState.status).toBe('DRAW');
    expect(finalState.isDraw).toBe(true);
    expect(finalState.winner).toBeNull();
    expect(engine.isGameOver()).toBe(true);
  });

  test('Rejects moves after game has finished', () => {
    engine.makeMove(p1.id, 0);
    engine.makeMove(p2.id, 3);
    engine.makeMove(p1.id, 1);
    engine.makeMove(p2.id, 4);
    engine.makeMove(p1.id, 2); // P1 wins

    const res = engine.makeMove(p2.id, 5);
    expect(res.success).toBe(false);
    expect(res.error).toBe('Game is already finished.');
  });
});
