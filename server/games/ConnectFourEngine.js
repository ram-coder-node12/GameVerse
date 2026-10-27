// server/games/ConnectFourEngine.js
const GameEngine = require('./GameEngine');

const ROWS = 6;
const COLS = 7;

class ConnectFourEngine extends GameEngine {
  /**
   * @param {Array} players - Array of two player objects [{ id, username }]
   */
  constructor(players = []) {
    super('CONNECT_FOUR', players);
    this.rows = ROWS;
    this.cols = COLS;
    this.board = Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(null));
    this.winningCells = null;
    this.createGame(players);
  }

  createGame(players = this.players) {
    this.board = Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(null));
    this.status = 'IN_PROGRESS';
    this.winner = null;
    this.isDraw = false;
    this.moves = [];
    this.moveCount = 0;
    this.winningCells = null;

    if (players && players.length === 2) {
      // Assign red to player 0, yellow to player 1
      this.players = [
        {
          id: players[0].id || players[0]._id.toString(),
          username: players[0].username,
          symbol: 'red'
        },
        {
          id: players[1].id || players[1]._id.toString(),
          username: players[1].username,
          symbol: 'yellow'
        }
      ];
      // Red starts
      this.currentTurn = this.players[0].id;
    }
  }

  getState() {
    return {
      gameType: this.gameType,
      rows: this.rows,
      cols: this.cols,
      board: this.board.map((row) => [...row]),
      players: this.players,
      currentTurn: this.currentTurn,
      status: this.status,
      winner: this.winner,
      isDraw: this.isDraw,
      winningCells: this.winningCells,
      moveCount: this.moveCount,
      moves: this.moves
    };
  }

  validateMove(playerId, column) {
    if (this.isGameOver()) {
      return { valid: false, reason: 'Game is already finished.' };
    }

    if (!this.players || this.players.length < 2) {
      return { valid: false, reason: 'Waiting for opponent to join.' };
    }

    if (this.currentTurn !== playerId.toString()) {
      return { valid: false, reason: 'Not your turn.' };
    }

    const col = Number(column);
    if (!Number.isInteger(col) || col < 0 || col >= COLS) {
      return { valid: false, reason: `Invalid column. Must be between 0 and ${COLS - 1}.` };
    }

    // Check if column is already full (top cell row 0 is occupied)
    if (this.board[0][col] !== null) {
      return { valid: false, reason: `Column ${col + 1} is already full.` };
    }

    return { valid: true };
  }

  makeMove(playerId, column) {
    const validation = this.validateMove(playerId, column);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.reason,
        state: this.getState()
      };
    }

    const col = Number(column);
    const player = this.players.find((p) => p.id === playerId.toString());
    const symbol = player.symbol;

    // Apply gravity: drop piece to lowest available row (from bottom row 5 up to 0)
    let placedRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r][col] === null) {
        this.board[r][col] = symbol;
        placedRow = r;
        break;
      }
    }

    this.moveCount += 1;
    this.moves.push({
      player: player.id,
      symbol,
      row: placedRow,
      col,
      moveNumber: this.moveCount,
      timestamp: new Date()
    });

    // Check for win
    const winResult = this.checkWinner();
    if (winResult) {
      this.status = 'WIN';
      this.winner = player;
      this.winningCells = winResult.cells;
      this.currentTurn = null;
    } else if (this.checkDraw()) {
      // Check for draw
      this.status = 'DRAW';
      this.isDraw = true;
      this.winner = null;
      this.currentTurn = null;
    } else {
      // Switch turn
      const otherPlayer = this.players.find((p) => p.id !== playerId.toString());
      this.currentTurn = otherPlayer.id;
    }

    return {
      success: true,
      placedRow,
      placedCol: col,
      state: this.getState()
    };
  }

  checkWinner() {
    const board = this.board;

    // 1. Horizontal check
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const val = board[r][c];
        if (
          val &&
          val === board[r][c + 1] &&
          val === board[r][c + 2] &&
          val === board[r][c + 3]
        ) {
          return {
            symbol: val,
            cells: [
              { row: r, col: c },
              { row: r, col: c + 1 },
              { row: r, col: c + 2 },
              { row: r, col: c + 3 }
            ]
          };
        }
      }
    }

    // 2. Vertical check
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r <= ROWS - 4; r++) {
        const val = board[r][c];
        if (
          val &&
          val === board[r + 1][c] &&
          val === board[r + 2][c] &&
          val === board[r + 3][c]
        ) {
          return {
            symbol: val,
            cells: [
              { row: r, col: c },
              { row: r + 1, col: c },
              { row: r + 2, col: c },
              { row: r + 3, col: c }
            ]
          };
        }
      }
    }

    // 3. Diagonal down-right (\)
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const val = board[r][c];
        if (
          val &&
          val === board[r + 1][c + 1] &&
          val === board[r + 2][c + 2] &&
          val === board[r + 3][c + 3]
        ) {
          return {
            symbol: val,
            cells: [
              { row: r, col: c },
              { row: r + 1, col: c + 1 },
              { row: r + 2, col: c + 2 },
              { row: r + 3, col: c + 3 }
            ]
          };
        }
      }
    }

    // 4. Diagonal up-right (/)
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        const val = board[r][c];
        if (
          val &&
          val === board[r - 1][c + 1] &&
          val === board[r - 2][c + 2] &&
          val === board[r - 3][c + 3]
        ) {
          return {
            symbol: val,
            cells: [
              { row: r, col: c },
              { row: r - 1, col: c + 1 },
              { row: r - 2, col: c + 2 },
              { row: r - 3, col: c + 3 }
            ]
          };
        }
      }
    }

    return null;
  }

  checkDraw() {
    // If all top cells in every column are occupied and there is no winner
    const allFilled = this.board[0].every((cell) => cell !== null);
    return allFilled && !this.checkWinner();
  }

  getLegalMoves() {
    if (this.isGameOver()) return [];
    const legalCols = [];
    for (let c = 0; c < COLS; c++) {
      if (this.board[0][c] === null) {
        legalCols.push(c);
      }
    }
    return legalCols;
  }
}

module.exports = ConnectFourEngine;
