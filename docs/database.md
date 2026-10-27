# GameVerse — Database Design & Schema Documentation

## 1. Overview

GameVerse uses **MongoDB** with **Mongoose ODM**. The schema design optimizes for high-speed leaderboard aggregation, match history pagination, and real-time friend/notification queries.

---

## 2. Collections & Schemas

### 2.1 User Collection (`users`)

Stores player authentication credentials, profile metadata, competitive ratings, and statistics.

```javascript
{
  _id: ObjectId,
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  avatar: { type: String, default: 'https://api.dicebear.com/...' },
  role: { type: String, enum: ['PLAYER', 'ADMIN'], default: 'PLAYER', index: true },
  rating: { type: Number, default: 1000, min: 0, index: true },
  gamesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  friends: [{ type: ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true, index: true },
  createdAt: Date,
  updatedAt: Date
}
```

#### Virtuals:
- `winRate`: Dynamically computed as `(wins / gamesPlayed) * 100` with 1 decimal precision.

#### Indexes:
- `{ username: 1 }` (unique)
- `{ email: 1 }` (unique)
- `{ rating: -1, wins: -1, gamesPlayed: -1 }` (compound index for fast leaderboard ranking)

---

### 2.2 Game Collection (`games`)

Maintains canonical match records, authoritative moves, outcomes, and duration.

```javascript
{
  _id: ObjectId,
  gameType: { type: String, enum: ['TIC_TAC_TOE', 'CONNECT_FOUR'], required: true, index: true },
  roomId: { type: String, required: true, unique: true, index: true },
  players: [
    {
      user: { type: ObjectId, ref: 'User', required: true },
      symbol: { type: String, required: true }, // 'X'/'O' or 'red'/'yellow'
      ratingBefore: { type: Number, default: 1000 },
      ratingAfter: { type: Number, default: 1000 },
      ratingChange: { type: Number, default: 0 }
    }
  ],
  status: { type: String, enum: ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED'], default: 'WAITING', index: true },
  currentTurn: { type: ObjectId, ref: 'User' },
  gameState: { type: mongoose.Schema.Types.Mixed, required: true },
  winner: { type: ObjectId, ref: 'User', default: null, index: true },
  isDraw: { type: Boolean, default: false },
  result: { type: String, enum: ['IN_PROGRESS', 'WIN', 'DRAW', 'ABANDONED'], default: 'IN_PROGRESS', index: true },
  moves: [
    {
      player: { type: ObjectId, ref: 'User' },
      moveData: mongoose.Schema.Types.Mixed,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  duration: { type: Number, default: 0 }, // in seconds
  createdAt: Date,
  updatedAt: Date
}
```

#### Indexes:
- `{ 'players.user': 1, createdAt: -1 }` (compound index for instant player match history)
- `{ gameType: 1, createdAt: -1 }` (filtered history by game type)

---

### 2.3 FriendRequest Collection (`friendrequests`)

Tracks pending, accepted, or rejected friendship requests between users.

```javascript
{
  _id: ObjectId,
  sender: { type: ObjectId, ref: 'User', required: true, index: true },
  recipient: { type: ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING', index: true },
  createdAt: Date,
  updatedAt: Date
}
```

#### Indexes:
- `{ sender: 1, recipient: 1 }` (compound index preventing duplicate requests)

---

### 2.4 Notification Collection (`notifications`)

Persistent in-app notification alerts for challenges, friend requests, and match outcomes.

```javascript
{
  _id: ObjectId,
  user: { type: ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: [
      'FRIEND_REQUEST',
      'FRIEND_ACCEPTED',
      'GAME_CHALLENGE',
      'CHALLENGE_ACCEPTED',
      'CHALLENGE_REJECTED',
      'GAME_RESULT',
      'SYSTEM'
    ],
    default: 'SYSTEM'
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false, index: true },
  createdAt: Date,
  updatedAt: Date
}
```

#### Indexes:
- `{ user: 1, createdAt: -1 }` (fetch latest unread notifications fast)

---

## 3. Database Connection Resilience

The database layer in `server/config/db.js` implements a zero-configuration fallback:
1. **Production / Atlas:** Connects via `MONGODB_URI` environment variable.
2. **Local / Testing:** If `MONGODB_URI` is blank or unset, automatically spawns an in-memory MongoDB instance with full Mongoose feature parity.
