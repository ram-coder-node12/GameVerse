# GameVerse — Real-Time Multiplayer Gaming Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://react.dev)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-v4.7+-black.svg)](https://socket.io)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%7C%20Mongoose-brightgreen.svg)](https://www.mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

GameVerse is a full-stack, production-grade real-time multiplayer browser gaming platform. Built with a **strict server-authoritative engine architecture**, GameVerse enables players worldwide to authenticate securely, enter matchmaking queues, compete in live tactical board games (Tic-Tac-Toe and Connect Four), challenge friends in real time, and climb an ELO-based competitive leaderboard.

---

## 1. Problem Statement

Most browser games fall into two undesirable extremes:
1. **Isolated single-player or fake multiplayer demos:** Opponents are simulated using timers or bots, offering no genuine peer interaction.
2. **Client-authoritative web games:** The browser determines board state, move legality, and victors, making them trivially exploitable via browser consoles, memory tampering, or malicious network payloads.

Developers often struggle to cleanly separate real-time transport pipelines (WebSockets) from pure mathematical game logic and persistent transactional databases.

---

## 2. Target Users

- **Competitive Online Gamers:** Players looking for fast, cheat-proof multiplayer battles in their browser without bloated downloads.
- **Friends & Rivals:** Friends wanting to challenge each other via direct duel invites with real-time push notifications.
- **Academic & Engineering Evaluators:** Software engineers evaluating full-stack MERN architecture, real-time concurrency, server-authoritative design patterns, and decoupled testability.

---

## 3. Solution

GameVerse solves these problems through an enterprise-grade architectural design:
- **Server-Authoritative Game Engine:** The client is never trusted. The backend validates player identity, turn order, grid boundaries, and piece physics.
- **Zero-Polling Real-Time Pipeline:** Socket.IO handles live matchmaking, state broadcasting, rematching, and reconnect resiliency.
- **Competitive Rating System:** Persistent ELO skill ratings (starting at 1000: Winner `+25`, Loser `-20`, Draw `+5`) with streaks and full match history.
- **Friend & Challenge Bus:** Real-time push notifications for duel invitations and friend requests.
- **Admin Console:** Role-based access control (`PLAYER` vs `ADMIN`) with system-wide analytics, match telemetry, and user management.

---

## 4. Core Features

- 🔐 **Secure Authentication:** JWT tokens, password hashing with bcrypt, HTTP-only secure cookies, and protected routes.
- ⚡ **Real-Time Matchmaking:** Automated FIFO queue pairing by game type with duplicate entry prevention and instant match creation.
- 🎮 **Two Authoritative Games:**
  - **Tic-Tac-Toe:** 3×3 classic arena, turn management, 8 winning line detections, draw detection.
  - **Connect Four:** 7×6 grid with gravity piece drop physics, horizontal, vertical, and diagonal 4-in-a-row detection.
- 📡 **Disconnect Resilience:** 30-second reconnection grace period before automated forfeit resolution.
- 🔄 **Rematch Protocol:** Mutual agreement rematching with automatic turn swapping.
- 🏆 **Global Leaderboard:** Ranked leaderboard sorted by ELO rating with podium badges, search, and pagination.
- 📜 **Match History:** Filterable by arena and outcome (victories, defeats, draws) with rating deltas and move counts.
- 🤝 **Friend System & Live Challenges:** Instant user search, request management, and real-time duel invitations.
- 🔔 **Persistent Notifications:** Stored alerts for friend requests, challenge results, and platform announcements.
- 🛡️ **Admin Dashboard:** System metrics, games played today, average duration, and user account management.

---

## 5. Technology Stack

### Frontend:
- **Core:** React 18, Vite, React Router DOM v6
- **Real-Time:** Socket.IO Client
- **HTTP Client:** Axios (configured with credentials and interceptors)
- **Icons & Styling:** Lucide React, Modern Dark Mode CSS Design System, Canvas Confetti

### Backend:
- **Runtime:** Node.js v20+
- **Framework:** Express
- **Real-Time Gateway:** Socket.IO v4.7
- **Authentication:** JSON Web Tokens (jsonwebtoken), bcryptjs, cookie-parser
- **Logging:** Custom sanitized logger with token/credential redaction

### Database:
- **Database:** MongoDB (MongoDB Atlas in production, local/in-memory fallback in development)
- **ODM:** Mongoose v8

### Testing:
- **Test Runner:** Jest, Supertest
- **Test Coverage:** Unit tests for game engines, matchmaking, and integration tests for Auth/REST APIs (32 passing automated tests)

### Deployment:
- **Frontend:** Vercel (SPA rewrites via `vercel.json`)
- **Backend:** Render (Unified Express + Socket.IO HTTP server)
- **Database:** MongoDB Atlas

---

## 6. System Architecture

```
                 ┌─────────────────────────────────┐
                 │       Vercel Frontend           │
                 │      React 18 + Vite SPA        │
                 └──────────────┬──────────────────┘
                                │
                      REST APIs │ WebSockets
                                ▼
                 ┌─────────────────────────────────┐
                 │       Render Backend            │
                 │    Express + Socket.IO          │
                 │  ┌───────────────────────────┐  │
                 │  │ Server-Authoritative      │  │
                 │  │ Game Engine Pipeline      │  │
                 │  └───────────┬───────────────┘  │
                 │  ┌───────────▼───────────────┐  │
                 │  │ Rating Service (ELO)      │  │
                 │  └───────────┬───────────────┘  │
                 └──────────────┼──────────────────┘
                                │ Mongoose ODM
                                ▼
                 ┌─────────────────────────────────┐
                 │       MongoDB Atlas             │
                 │   Users, Games, Notifications   │
                 └─────────────────────────────────┘
```

---

## 7. Folder Structure

```text
GameVerse/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── MatchmakingModal.jsx
│   │   │   └── ChallengeModal.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── games/
│   │   │   ├── tic-tac-toe/TicTacToeBoard.jsx
│   │   │   └── connect-four/ConnectFourBoard.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── GamePage.jsx
│   │   │   ├── LeaderboardPage.jsx
│   │   │   ├── HistoryPage.jsx
│   │   │   ├── FriendsPage.jsx
│   │   │   └── AdminPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── gameController.js
│   │   ├── friendController.js
│   │   ├── notificationController.js
│   │   └── adminController.js
│   ├── games/
│   │   ├── GameEngine.js
│   │   ├── TicTacToeEngine.js
│   │   └── ConnectFourEngine.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── adminMiddleware.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Game.js
│   │   ├── FriendRequest.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── gameRoutes.js
│   │   ├── friendRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── adminRoutes.js
│   ├── services/
│   │   ├── matchmakingService.js
│   │   └── ratingService.js
│   ├── sockets/
│   │   └── socketHandler.js
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── connectfour.test.js
│   │   ├── matchmaking.test.js
│   │   ├── tictactoe.test.js
│   │   └── e2e-simulation.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── seed.js
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   ├── socket-events.md
│   ├── game-engine.md
│   └── deployment.md
│
├── package.json
├── .gitignore
└── README.md
```

---

## 8. Database Schema Overview

| Collection | Key Fields | Purpose |
|------------|------------|---------|
| `users` | `username`, `email`, `passwordHash`, `role`, `rating`, `wins`, `losses`, `draws`, `streak` | Player profile, credentials, and ELO rating |
| `games` | `gameType`, `roomId`, `players`, `status`, `winner`, `moves`, `duration`, `gameState` | Authoritative match records and history |
| `friendrequests` | `sender`, `recipient`, `status` (`PENDING`/`ACCEPTED`/`REJECTED`) | Social friend management |
| `notifications` | `user`, `type`, `title`, `message`, `read`, `data` | Persistent player alerts |

---

## 9. Key REST API Endpoints

- `GET  /health` — Operational server check
- `POST /api/auth/register` — Account registration
- `POST /api/auth/login` — Login & JWT issuance
- `POST /api/auth/logout` — Logout & cookie clearance
- `GET  /api/auth/me` — Current user profile
- `GET  /api/users/leaderboard` — Ranked leaderboard
- `GET  /api/games/history` — Filterable match history
- `GET  /api/friends` — Friend list & requests
- `POST /api/friends/request` — Send friend invitation
- `GET  /api/admin/stats` — Platform analytics (Admin only)
- `GET  /api/admin/users` — User management (Admin only)

---

## 10. Real-Time Socket Events

- Matchmaking: `join_queue`, `leave_queue`, `queue_status`, `match_found`
- Game Rooms: `join_game`, `player_move`, `move_rejected`, `game_state`, `game_over`
- Reconnection: `player_disconnected` (30s window), `player_reconnected`
- Rematches: `rematch_request`, `rematch_offered`, `rematch_started`
- Friend Duels: `challenge_friend`, `challenge_received`, `challenge_response`, `challenge_accepted`

---

## 11. Local Setup & Installation

### Prerequisites
- Node.js v18 or v20+
- Git

### 1. Clone the repository
```bash
git clone <repository-url>
cd GameVerse
```

### 2. Install all dependencies
```bash
# Install root, server, and client packages
npm run install:all
```

### 3. Environment Variables

**Backend (`server/.env`):**
```env
PORT=8084
MONGODB_URI=
JWT_SECRET=gameverse_super_secret_jwt_key_2026_change_in_production
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```
*(Note: If `MONGODB_URI` is left blank, an in-memory MongoDB automatically spins up!)*

**Frontend (`client/.env`):**
```env
VITE_API_URL=http://localhost:8084
VITE_SOCKET_URL=http://localhost:8084
```

### 4. Seed Demo Data (Optional)
```bash
npm run seed
```
Creates:
- `AdminBoss` (`admin@gameverse.io` / `admin123`)
- `PlayerAlpha` (`alpha@gameverse.io` / `pass123`)
- `PlayerBeta` (`beta@gameverse.io` / `pass123`)

### 5. Run Development Servers
Open two separate terminal windows:

Terminal 1 (Backend Server):
```bash
npm run server
```

Terminal 2 (Frontend Client):
```bash
npm run client
```

Navigate to `http://localhost:5173/` in your browser.

---

## 12. Automated Testing Suite

GameVerse includes a comprehensive automated test suite covering game engines, authentication, API routes, and real-time matchmaking.

```bash
# Run all server unit & integration tests
npm test
```

### Run Live Two-Player Multiplayer Simulation:
```bash
cd server
node tests/e2e-simulation.js
```
*Output: Spawns two distinct Socket.IO players, enters matchmaking, executes authoritative moves on Tic-Tac-Toe, declares the winner, verifies rating calculation (`+25`/`-20`), and checks database persistence.*

---

## 13. Production Deployment

See [`docs/deployment.md`](docs/deployment.md) for full cloud configuration on:
1. **MongoDB Atlas** (Database)
2. **Render** (Node + Express + Socket.IO)
3. **Vercel** (React 18 + Vite SPA)

---

## 14. Engineering Decisions

- **Why Server-Authoritative Logic?** Eliminates client-side cheating and invalid state drift. Pure game engines are decoupled as plain JavaScript classes for 100% independent unit testability without network dependencies.
- **Why Socket.IO over HTTP Long-Polling?** Full-duplex persistent connections offer sub-50ms turn delivery, instant matchmaking pairs, live online counts, and disconnect grace intervals.
- **Why In-Memory MongoDB Fallback?** Allows instant zero-configuration development and automated CI/CD testing out-of-the-box, while seamlessly connecting to MongoDB Atlas when `MONGODB_URI` is provided.
- **Why Dual Authentication Strategy?** Uses HTTP-only secure cookies alongside Authorization Bearer headers to guarantee authentication persistence across both strict same-origin domains and cross-domain third-party cookie restrictions.

---

## 15. License

Distributed under the MIT License. See `LICENSE` for details.
