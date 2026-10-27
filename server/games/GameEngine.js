// server/games/GameEngine.js
/**
 * Abstract GameEngine base class.
 * All multiplayer games in GameVerse inherit from this base class
 * to ensure a standardized, server-authoritative interface.
 */
class GameEngine {
  constructor(gameType, players) {
    if (new.target === GameEngine) {
      throw new TypeError('Cannot construct GameEngine instances directly; extend it instead.');
    }
    this.gameType = gameType;
    this.players = players; // array of player objects [{ id, username, symbol, ... }]
    this.status = 'IN_PROGRESS'; // 'IN_PROGRESS' | 'WIN' | 'DRAW' | 'ABANDONED'
    this.winner = null; // player object or player id
    this.isDraw = false;
    this.moves = [];
    this.moveCount = 0;
    this.currentTurn = null; // player object or player id
  }

  /**
   * Initializes or resets the game board/state
   */
  createGame() {
    throw new Error("Method 'createGame()' must be implemented.");
  }

  /**
   * Returns complete serialized snapshot of current game state
   */
  getState() {
    throw new Error("Method 'getState()' must be implemented.");
  }

  /**
   * Validates if a move is legal for the given player
   * @param {Object} player
   * @param {Object} moveData
   * @returns {{ valid: boolean, reason?: string }}
   */
  validateMove(player, moveData) {
    throw new Error("Method 'validateMove()' must be implemented.");
  }

  /**
   * Executes the validated move and updates authoritative state
   * @param {Object} player
   * @param {Object} moveData
   * @returns {{ success: boolean, state: Object, error?: string }}
   */
  makeMove(player, moveData) {
    throw new Error("Method 'makeMove()' must be implemented.");
  }

  /**
   * Checks if the current state has a winning condition
   * @returns {Object|null} winner details or null
   */
  checkWinner() {
    throw new Error("Method 'checkWinner()' must be implemented.");
  }

  /**
   * Checks if the game has ended in a draw
   * @returns {boolean}
   */
  checkDraw() {
    throw new Error("Method 'checkDraw()' must be implemented.");
  }

  /**
   * Returns array of currently legal moves
   * @returns {Array}
   */
  getLegalMoves() {
    throw new Error("Method 'getLegalMoves()' must be implemented.");
  }

  /**
   * Returns whether game is completed
   * @returns {boolean}
   */
  isGameOver() {
    return this.status !== 'IN_PROGRESS';
  }
}

module.exports = GameEngine;
