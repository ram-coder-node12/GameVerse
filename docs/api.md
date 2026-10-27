# GameVerse — REST API Documentation

Base URL: `http://localhost:8084/api` (Local) or your deployed backend URL.

All protected endpoints require either:
1. Cookie: `token=<jwt>`
2. Header: `Authorization: Bearer <jwt>`

---

## 1. System Health

### `GET /health`
Returns the operational health of the GameVerse server.
- **Access:** Public
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "GameVerse server is healthy",
  "timestamp": "2026-10-27T05:40:52.465Z",
  "env": "development"
}
```

---

## 2. Authentication

### `POST /api/auth/register`
Creates a new player account and issues a JWT token.
- **Access:** Public
- **Body:**
```json
{
  "username": "PlayerOne",
  "email": "player@gameverse.io",
  "password": "password123",
  "role": "PLAYER"
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Account created successfully.",
  "token": "eyJhbGciOiJIUzI1Ni...",
  "user": {
    "id": "6ae039c005d44ced0a14fce2",
    "username": "PlayerOne",
    "email": "player@gameverse.io",
    "role": "PLAYER",
    "rating": 1000,
    "avatar": "https://api.dicebear.com/..."
  }
}
```

### `POST /api/auth/login`
Authenticates with username or email + password.
- **Access:** Public
- **Body:**
```json
{
  "identifier": "PlayerOne",
  "password": "password123"
}
```
- **Response `200 OK`:** Returns `token` and `user` object.

### `POST /api/auth/logout`
Clears HTTP-only authentication cookie.
- **Access:** Public
- **Response `200 OK`:** `{ "success": true, "message": "Logged out successfully." }`

### `GET /api/auth/me`
Retrieves currently authenticated session.
- **Access:** Private
- **Response `200 OK`:** `{ "success": true, "user": { ... } }`

---

## 3. Users & Leaderboard

### `GET /api/users/:id`
Retrieves player profile by user ID.
- **Access:** Public / Private

### `GET /api/users/search?q=query`
Searches registered active players by username.
- **Access:** Private

### `PATCH /api/users/profile`
Updates user avatar URL.
- **Access:** Private
- **Body:** `{ "avatar": "https://..." }`

### `GET /api/users/leaderboard?page=1&limit=10&search=`
Fetches ranked players sorted by rating descending.
- **Access:** Public
- **Response `200 OK`:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "username": "Alpha_4644",
      "rating": 1025,
      "gamesPlayed": 1,
      "wins": 1,
      "winRate": 100,
      "currentStreak": 1
    }
  ],
  "pagination": { "page": 1, "limit": 10, "totalPlayers": 1, "totalPages": 1 }
}
```

---

## 4. Match History

### `GET /api/games/history?page=1&limit=10&gameType=&result=`
Retrieves paginated match history for logged-in user.
- **Access:** Private
- **Filters:** `gameType` (`TIC_TAC_TOE`, `CONNECT_FOUR`), `result` (`WIN`, `LOSS`, `DRAW`)
- **Response `200 OK`:**
```json
{
  "success": true,
  "games": [
    {
      "id": "6ae039...",
      "gameType": "TIC_TAC_TOE",
      "status": "COMPLETED",
      "outcome": "WIN",
      "ratingChange": 25,
      "ratingAfter": 1025,
      "opponent": { "username": "Beta_4803", "rating": 1000 },
      "duration": 48
    }
  ]
}
```

---

## 5. Friend System

### `GET /api/friends`
Returns friends list and pending sent/received requests.
- **Access:** Private

### `POST /api/friends/request`
Sends a friend request by `recipientId`.
- **Access:** Private
- **Body:** `{ "recipientId": "<userId>" }`

### `POST /api/friends/:id/accept`
Accepts a received friend request.
- **Access:** Private

### `POST /api/friends/:id/reject`
Rejects a friend request.
- **Access:** Private

### `DELETE /api/friends/:id`
Removes a friend.
- **Access:** Private

---

## 6. Notifications

### `GET /api/notifications`
Gets the latest 30 notifications and unread counter.
- **Access:** Private

### `PATCH /api/notifications/:id/read`
Marks a single notification as read.
- **Access:** Private

### `PATCH /api/notifications/read-all`
Marks all user notifications as read.
- **Access:** Private

---

## 7. Admin Console

### `GET /api/admin/stats`
System aggregate statistics.
- **Access:** Private (`ADMIN` role only)
- **Response `200 OK`:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 24,
    "activeUsers": 24,
    "totalGames": 48,
    "gamesToday": 12,
    "mostPopularGame": "TIC_TAC_TOE",
    "averageGameDuration": 54
  }
}
```

### `GET /api/admin/users?page=1&limit=15&search=&role=`
Paginated list of all users.
- **Access:** Private (`ADMIN` role only)

### `PATCH /api/admin/users/:id/toggle-status`
Enables or disables a player's account.
- **Access:** Private (`ADMIN` role only)
