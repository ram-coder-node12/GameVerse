// server/games/TicTacToeEngine.js
const GameEngine = require('./GameEngine');

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

class TicTacToeEngine extends GameEngine {
  /**
   * @param {Array} players - Array of two player objects [{ id, username }]
   */
  constructor(players = []) {
    super('TIC_TAC_TOE', players);
    this.board = Array(9).fill(null);
    this.winningLine = null;
    this.createGame(players);
  }

  createGame(players = this.players) {
    this.board = Array(9).fill(null);
    this.status = 'IN_PROGRESS';
    this.winner = null;
    this.isDraw = false;
    this.moves = [];
    this.moveCount = 0;
    this.winningLine = null;

    if (players && players.length === 2) {
      // Assign X to player 0, O to player 1
      this.players = [
        {
          id: players[0].id || players[0]._id.toString(),
          username: players[0].username,
          symbol: 'X'
        },
        {
          id: players[1].id || players[1]._id.toString(),
          username: players[1].username,
          symbol: 'O'
        }
      ];
      // X always starts
      this.currentTurn = this.players[0].id;
    }
  }

  getState() {
    return {
      gameType: this.gameType,
      board: [...this.board],
      players: this.players,
      currentTurn: this.currentTurn,
      status: this.status,
      winner: this.winner,
      isDraw: this.isDraw,
      winningLine: this.winningLine,
      moveCount: this.moveCount,
      moves: this.moves
    };
  }

  validateMove(playerId, position) {
    if (this.isGameOver()) {
      return { valid: false, reason: 'Game is already finished.' };
    }

    if (!this.players || this.players.length < 2) {
      return { valid: false, reason: 'Waiting for opponent to join.' };
    }

    if (this.currentTurn !== playerId.toString()) {
      return { valid: false, reason: 'Not your turn.' };
    }

    const pos = Number(position);
    if (!Number.isInteger(pos) || pos < 0 || pos > 8) {
      return { valid: false, reason: 'Invalid board position. Must be between 0 and 8.' };
    }

    if (this.board[pos] !== null) {
      return { valid: false, reason: 'Square is already occupied.' };
    }

    return { valid: true };
  }

  makeMove(playerId, position) {
    const validation = this.validateMove(playerId, position);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.reason,
        state: this.getState()
      };
    }

    const pos = Number(position);
    const player = this.players.find((p) => p.id === playerId.toString());
    const symbol = player.symbol;

    // Apply move to authoritative board
    this.board[pos] = symbol;
    this.moveCount += 1;
    this.moves.push({
      player: player.id,
      symbol,
      position: pos,
      moveNumber: this.moveCount,
      timestamp: new Date()
    });

    // Check for win
    const winResult = this.checkWinner();
    if (winResult) {
      this.status = 'WIN';
      this.winner = player;
      this.winningLine = winResult.line;
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
      state: this.getState()
    };
  }

  checkWinner() {
    for (const combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (
        this.board[a] &&
        this.board[a] === this.board[b] &&
        this.board[a] === this.board[c]
      ) {
        return {
          symbol: this.board[a],
          line: combo
        };
      }
    }
    return null;
  }

  checkDraw() {
    return this.board.every((cell) => cell !== null) && !this.checkWinner();
  }

  getLegalMoves() {
    if (this.isGameOver()) return [];
    const legal = [];
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === null) {
        legal.push(i);
      }
    }
    return legal;
  }
}

module.exports = TicTacToeEngine;
