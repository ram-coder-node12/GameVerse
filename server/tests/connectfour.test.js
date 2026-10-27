// server/tests/connectfour.test.js
const ConnectFourEngine = require('../games/ConnectFourEngine');

describe('ConnectFourEngine Unit Tests', () => {
  const p1 = { id: 'player1_id', username: 'Alice' };
  const p2 = { id: 'player2_id', username: 'Bob' };

  let engine;

  beforeEach(() => {
    engine = new ConnectFourEngine([p1, p2]);
  });

  test('Initializes with 6x7 empty grid, red starting', () => {
    const state = engine.getState();
    expect(state.rows).toBe(6);
    expect(state.cols).toBe(7);
    expect(state.currentTurn).toBe(p1.id);
    expect(state.players[0].symbol).toBe('red');
    expect(state.players[1].symbol).toBe('yellow');
    expect(state.board.length).toBe(6);
    state.board.forEach((row) => {
      expect(row.length).toBe(7);
      expect(row.every((cell) => cell === null)).toBe(true);
    });
  });

  test('Applies gravity: drops piece to bottom row (row 5)', () => {
    const res = engine.makeMove(p1.id, 3);
    expect(res.success).toBe(true);
    expect(res.placedRow).toBe(5);
    expect(res.placedCol).toBe(3);
    expect(res.state.board[5][3]).toBe('red');
    expect(res.state.currentTurn).toBe(p2.id);
  });

  test('Stacks pieces on top of each other in the same column', () => {
    engine.makeMove(p1.id, 0); // row 5, col 0 (red)
    const res2 = engine.makeMove(p2.id, 0); // row 4, col 0 (yellow)
    expect(res2.placedRow).toBe(4);
    expect(res2.state.board[4][0]).toBe('yellow');

    const res3 = engine.makeMove(p1.id, 0); // row 3, col 0 (red)
    expect(res3.placedRow).toBe(3);
    expect(res3.state.board[3][0]).toBe('red');
  });

  test('Rejects moves when column is full (6 pieces max)', () => {
    // Fill col 2 with 6 alternating pieces
    for (let i = 0; i < 6; i++) {
      const pid = i % 2 === 0 ? p1.id : p2.id;
      const res = engine.makeMove(pid, 2);
      expect(res.success).toBe(true);
    }

    // Col 2 is now full
    const fullRes = engine.makeMove(p1.id, 2);
    expect(fullRes.success).toBe(false);
    expect(fullRes.error).toBe('Column 3 is already full.');
  });

  test('Rejects out-of-bounds column', () => {
    const res1 = engine.makeMove(p1.id, -1);
    expect(res1.success).toBe(false);

    const res2 = engine.makeMove(p1.id, 7);
    expect(res2.success).toBe(false);
  });

  test('Rejects moves out of turn order', () => {
    const res = engine.makeMove(p2.id, 3);
    expect(res.success).toBe(false);
    expect(res.error).toBe('Not your turn.');
  });

  test('Detects vertical 4-in-a-row win', () => {
    // P1 plays col 0, P2 plays col 1
    engine.makeMove(p1.id, 0); // P1 row 5
    engine.makeMove(p2.id, 1); // P2 row 5
    engine.makeMove(p1.id, 0); // P1 row 4
    engine.makeMove(p2.id, 1); // P2 row 4
    engine.makeMove(p1.id, 0); // P1 row 3
    engine.makeMove(p2.id, 1); // P2 row 3
    const res = engine.makeMove(p1.id, 0); // P1 row 2 -> 4-in-a-row vertically

    expect(res.success).toBe(true);
    expect(res.state.status).toBe('WIN');
    expect(res.state.winner.id).toBe(p1.id);
    expect(res.state.winningCells.length).toBe(4);
    expect(engine.isGameOver()).toBe(true);
  });

  test('Detects horizontal 4-in-a-row win', () => {
    // P1 plays col 0, 1, 2, 3 on bottom row (row 5)
    engine.makeMove(p1.id, 0); // P1 (0, 5)
    engine.makeMove(p2.id, 0); // P2 (0, 4)
    engine.makeMove(p1.id, 1); // P1 (1, 5)
    engine.makeMove(p2.id, 1); // P2 (1, 4)
    engine.makeMove(p1.id, 2); // P1 (2, 5)
    engine.makeMove(p2.id, 2); // P2 (2, 4)
    const res = engine.makeMove(p1.id, 3); // P1 (3, 5) -> horizontal win

    expect(res.success).toBe(true);
    expect(res.state.status).toBe('WIN');
    expect(res.state.winner.id).toBe(p1.id);
    expect(res.state.winningCells.length).toBe(4);
  });

  test('Detects diagonal down-right win', () => {
    // Build staircase so diagonal (2,0) to (5,3) or similar is formed
    // col 0: 1 piece (P1) -> (5,0)
    // col 1: 2 pieces (P2, P1) -> (4,1) P1
    // col 2: 3 pieces (P2, P2, P1) -> (3,2) P1
    // col 3: 4 pieces (P2, P2, P2, P1) -> (2,3) P1
    engine.makeMove(p1.id, 0); // (5,0) P1
    engine.makeMove(p2.id, 1); // (5,1) P2
    engine.makeMove(p1.id, 1); // (4,1) P1
    engine.makeMove(p2.id, 2); // (5,2) P2
    engine.makeMove(p1.id, 3); // (5,3) P1
    engine.makeMove(p2.id, 2); // (4,2) P2
    engine.makeMove(p1.id, 2); // (3,2) P1
    engine.makeMove(p2.id, 3); // (4,3) P2
    engine.makeMove(p1.id, 4); // (5,4) P1 - dummy
    engine.makeMove(p2.id, 3); // (3,3) P2
    const res = engine.makeMove(p1.id, 3); // (2,3) P1 -> completes diagonal!

    expect(res.success).toBe(true);
    expect(res.state.status).toBe('WIN');
    expect(res.state.winner.id).toBe(p1.id);
  });
});
