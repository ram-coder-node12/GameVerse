# GameVerse — Socket.IO Real-Time Event Architecture

## 1. Connection & Handshake Authentication

Sockets authenticate during handshake using the JWT token stored in `auth.token`, HTTP Authorization header, or cookie:

```javascript
const socket = io('http://localhost:8084', {
  auth: { token: localStorage.getItem('token') },
  withCredentials: true
});
```

---

## 2. Matchmaking Events

| Event Name | Direction | Payload | Description |
|------------|-----------|---------|-------------|
| `join_queue` | Client -> Server | `{ gameType: 'TIC_TAC_TOE', user: { id, username, rating, avatar } }` | Enters player into matchmaking queue. |
| `leave_queue` | Client -> Server | `{ gameType: 'TIC_TAC_TOE' }` | Cancels active search and removes player from queue. |
| `queue_status` | Server -> Client | `{ inQueue: true/false, gameType }` | Notifies client of current queue search status. |
| `match_found` | Server -> Client | `{ roomId, gameType, mySymbol, myTurn, opponent, state }` | Emitted when two players are matched into a room. |

---

## 3. In-Game & Authoritative Move Events

| Event Name | Direction | Payload | Description |
|------------|-----------|---------|-------------|
| `join_game` | Client -> Server | `{ roomId }` | Joins socket to game room `game_${roomId}`. |
| `player_move` | Client -> Server | `{ roomId, moveData }` | Submits move intent (e.g., cell index `0..8` or column `0..6`). |
| `move_rejected` | Server -> Client | `{ reason: 'Not your turn.' }` | Rejects invalid move with authoritative explanation. |
| `game_state` | Server -> Client | `{ state: { board, currentTurn, status, moves, ... } }` | Canonical board broadcast sent to all room participants. |
| `game_over` | Server -> Client | `{ result: 'WIN'/'DRAW'/'FORFEIT', winner, isDraw, ratings, duration, state }` | Game conclusion event with persisted rating updates. |

---

## 4. Disconnect & Reconnection Protocol

| Event Name | Direction | Payload | Description |
|------------|-----------|---------|-------------|
| `player_disconnected` | Server -> Client | `{ userId, username, reconnectWindowSeconds: 30 }` | Warns opponent that player temporarily dropped with 30s countdown. |
| `player_reconnected` | Server -> Client | `{ userId, username }` | Notifies opponent that dropped player rejoined within window. |

---

## 5. Rematch Protocol

| Event Name | Direction | Payload | Description |
|------------|-----------|---------|-------------|
| `rematch_request` | Client -> Server | `{ roomId }` | Player votes for a rematch. |
| `rematch_offered` | Server -> Client | `{ requestedBy }` | Informs opponent that a rematch has been requested. |
| `rematch_started` | Server -> Client | `{ state, players }` | Triggered when both players accept; swaps initial turn. |

---

## 6. Friend Challenges

| Event Name | Direction | Payload | Description |
|------------|-----------|---------|-------------|
| `challenge_friend` | Client -> Server | `{ friendId, gameType, challenger }` | Challenges an online friend to a direct duel. |
| `challenge_received` | Server -> Client | `{ challengeId, gameType, challenger }` | Pops challenge modal on friend's active screen. |
| `challenge_response` | Client -> Server | `{ challengeId, accepted: true/false }` | Friend accepts or declines challenge. |
| `challenge_accepted` | Server -> Client | `{ roomId, gameType, mySymbol, opponent }` | Automatically routes both players into the created duel room. |
| `challenge_declined` | Server -> Client | `{ message }` | Notifies challenger that invitation was declined. |
| `online_count` | Server -> Client | `{ count: number }` | Real-time broadcast of currently connected players. |
