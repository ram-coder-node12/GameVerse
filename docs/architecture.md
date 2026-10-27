# GameVerse — System Architecture

## 1. High-Level Architecture Overview

GameVerse is a full-stack, real-time multiplayer gaming platform engineered with a strict **server-authoritative** model. The platform is decoupled into a React Single Page Application (SPA), a Node.js/Express backend, Socket.IO real-time event pipeline, and a MongoDB persistent document store.

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│     React 18 + Vite + React Router + Context + Axios        │
└──────────────┬──────────────────────────────┬───────────────┘
               │ HTTP REST                    │ WebSockets (Socket.IO)
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Backend Layer                         │
│               Node.js + Express Server                      │
│                                                             │
│  ┌───────────────────────┐     ┌─────────────────────────┐  │
│  │   REST Controllers    │     │   Socket.IO Gateway     │  │
│  │  - Auth & JWT         │     │  - Live Auth Handshake  │  │
│  │  - User & Profile     │     │  - Matchmaking Service  │  │
│  │  - Games & History    │     │  - Active Room Manager  │  │
│  │  - Friends & Duels    │     │  - Reconnect Resiliency │  │
│  │  - Admin Management   │     │  - Friend Challenge Bus │  │
│  └───────────┬───────────┘     └────────────┬────────────┘  │
│              │                              │               │
│              ▼                              ▼               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Server-Authoritative Game Engines             │  │
│  │     - GameEngine (Abstract Base)                      │  │
│  │     - TicTacToeEngine (3x3 validation & win detect)   │  │
│  │     - ConnectFourEngine (7x6 gravity & 4-in-a-row)    │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          Rating & Statistics Service (ELO)            │  │
│  │     - Win (+25), Loss (-20), Draw (+5), Streaks       │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ Mongoose ODM
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Persistence Layer                       │
│             MongoDB Atlas / Local / In-Memory               │
│    Collections: Users, Games, FriendRequests, Notifications │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Server-Authoritative Principle

In peer-to-peer or naive client-authoritative games, clients dictate the outcome of moves or declare victories. In GameVerse:

1. **Zero Client Trust:** The client only sends pure input (e.g., "play position 4" or "drop disk in column 3").
2. **Backend Validation:** The authoritative engine checks:
   - Does the player belong to this room?
   - Is it currently this player's turn?
   - Is the move within grid boundaries?
   - Is the target cell or column empty/valid?
   - Has the game already terminated?
3. **State Mutation:** Only the backend updates the canonical board state.
4. **Broadcast:** The new game state is broadcast simultaneously to both players.
5. **Outcome Determination:** Win, draw, or forfeit detection is calculated on the server and immediately committed to MongoDB.

---

## 3. Real-Time Matchmaking Pipeline

```
Player A                  Server (MatchmakingService)                Player B
   │                                   │                                │
   │─── emit('join_queue', 'TTT') ────>│                                │
   │<── emit('queue_status', searching)│                                │
   │                                   │                                │
   │                                   │<── emit('join_queue', 'TTT') ──│
   │                                   │                                │
   │                            [Match Detected]                        │
   │                        [Instantiate Room & Engine]                 │
   │                                   │                                │
   │<── emit('match_found', room_123) ─┤── emit('match_found', room_123)─>│
   │                                   │                                │
   │─── emit('join_game', room_123) ──>│<── emit('join_game', room_123)─│
   │                                   │                                │
   │<── emit('game_state', canonical) ─┤── emit('game_state', canonical)─>│
```

- **FIFO Queue:** Players are matched first-come, first-served within the same game mode queue.
- **Queue Isolation:** Tic-Tac-Toe queues are strictly segregated from Connect Four queues.
- **Duplicate Prevention:** If a player refreshes or clicks queue twice, previous entries are automatically purged.
- **Graceful Abandonment:** Disconnecting while in queue automatically removes the player.

---

## 4. Disconnect & Reconnection Protocol

When unexpected network drops happen in real-time gaming:

1. Socket disconnect event detects whether the socket belonged to an active game room.
2. The remaining opponent receives a `player_disconnected` event with a **30-second countdown**.
3. A 30-second server timer is started for the room.
4. **If the player reconnects** within 30 seconds:
   - Sockets rejoin `game_${roomId}`.
   - Timer is cancelled.
   - `player_reconnected` and latest `game_state` are emitted to all room participants.
5. **If the countdown expires**:
   - The game is marked as `ABANDONED`.
   - The remaining connected player is awarded a forfeit win.
   - ELO ratings are updated and persisted to MongoDB.

---

## 5. Security Architecture

- **Password Hashing:** Passwords hashed with `bcryptjs` (salt rounds = 10). Never stored or returned in plaintext.
- **Authentication:** Dual-mode JWT (HTTP-only secure SameSite cookies + Authorization Bearer header support).
- **RBAC:** Multi-level roles (`PLAYER` and `ADMIN`) enforced via Express middleware.
- **Sanitized Logging:** Custom logging utility automatically masks passwords, tokens, and authorization headers from logs.
- **CORS & Headers:** Configured for cross-origin credentials with strict origin verification.
