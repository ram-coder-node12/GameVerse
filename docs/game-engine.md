# GameVerse — Game Engine Architecture & Logic

## 1. Engine Abstraction Model

All multiplayer games in GameVerse derive from the abstract base class `GameEngine` (`server/games/GameEngine.js`). This architecture decouples pure game rules from Socket.IO events, Express routes, and database models, ensuring games are **independently testable** in pure Node/Jest environments.

```
       ┌────────────────────────┐
       │       GameEngine       │
       │     (Abstract Base)    │
       └───────────┬────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
┌──────────────────┐ ┌────────────────────┐
│ TicTacToeEngine  │ │ ConnectFourEngine  │
│  - 3x3 Board     │ │  - 6x7 Grid        │
│  - X/O Symbols   │ │  - Gravity Physics │
│  - 8 Win Combos  │ │  - 4-in-a-Row Win  │
└──────────────────┘ └────────────────────┘
```

---

## 2. Standardized Engine Interface

Every engine exposes the following lifecycle methods:

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `createGame(players)` | `players: Array` | `void` | Initializes/resets board state and assigns player symbols. |
| `getState()` | `none` | `Object` | Returns canonical immutable snapshot of game state. |
| `validateMove(playerId, moveData)` | `playerId, moveData` | `{ valid: boolean, reason?: string }` | Verifies turn order, boundary checks, and occupancy. |
| `makeMove(playerId, moveData)` | `playerId, moveData` | `{ success: boolean, state: Object, error?: string }` | Authoritatively mutates the board, evaluates win/draw, and switches turns. |
| `checkWinner()` | `none` | `{ symbol, line/cells } | null` | Evaluates board state for win conditions. |
| `checkDraw()` | `none` | `boolean` | Checks whether the board is exhausted with no winner. |
| `getLegalMoves()` | `none` | `Array` | Returns list of currently legal moves. |
| `isGameOver()` | `none` | `boolean` | Returns whether game status is completed or active. |

---

## 3. Tic-Tac-Toe Engine Implementation

### 3.1 Board Representation
- Flat 9-cell array: `Array(9).fill(null)`.
- Indices `0` through `8`:
```
 0 | 1 | 2 
---+---+---
 3 | 4 | 5 
---+---+---
 6 | 7 | 8 
```

### 3.2 Win Detection
Checked against 8 predefined combinations:
```javascript
const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]           // Diagonals
];
```

---

## 4. Connect Four Engine Implementation

### 4.1 Board Representation
- 6 rows by 7 columns 2D matrix:
  - Row 0: Top
  - Row 5: Bottom (Gravity floor)
  - Columns: 0 through 6

### 4.2 Gravity Simulation
When a player drops a piece into column `c`:
```javascript
let placedRow = -1;
for (let r = ROWS - 1; r >= 0; r--) {
  if (this.board[r][c] === null) {
    this.board[r][c] = symbol;
    placedRow = r;
    break;
  }
}
```
If `this.board[0][c] !== null`, the column is full and the engine rejects the move with `"Column is full"`.

### 4.3 4-in-a-Row Detection
The engine evaluates 4 directional vectors:
1. **Horizontal:** `board[r][c] === board[r][c+1] === board[r][c+2] === board[r][c+3]`
2. **Vertical:** `board[r][c] === board[r+1][c] === board[r+2][c] === board[r+3][c]`
3. **Diagonal Down-Right (\):** `board[r][c] === board[r+1][c+1] === board[r+2][c+2] === board[r+3][c+3]`
4. **Diagonal Up-Right (/):** `board[r][c] === board[r-1][c+1] === board[r-2][c+2] === board[r-3][c+3]`

The winning 4 cell coordinates are returned in `winningCells: [{row, col}, ...]` so the frontend highlights the winning disk combination.
