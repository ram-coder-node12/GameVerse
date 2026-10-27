# GameVerse — Production Deployment Guide

This guide details the step-by-step production deployment of GameVerse across **MongoDB Atlas**, **Render** (Backend API & Socket.IO), and **Vercel** (Frontend SPA).

```
                      ┌──────────────────┐
                      │      User        │
                      └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │ Vercel Frontend  │
                      │ React 18 + Vite  │
                      └────────┬─────────┘
                               │
                         REST + Socket.IO
                               │
                               ▼
                      ┌──────────────────┐
                      │ Render Backend   │
                      │ Node + Express   │
                      │ Socket.IO Server │
                      └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │ MongoDB Atlas    │
                      │ Persistent Store │
                      └──────────────────┘
```

---

## 1. Database Setup: MongoDB Atlas

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Shared Cluster**.
3. Under **Security -> Database Access**, create a database user:
   - Example username: `gameverse_admin`
   - Secure generated password.
4. Under **Security -> Network Access**, click **Add IP Address** and choose **Allow Access From Anywhere** (`0.0.0.0/0`).
5. Under **Deployment -> Database -> Connect -> Drivers**, copy the connection string:
   ```env
   MONGODB_URI=mongodb+srv://gameverse_admin:<password>@cluster0.mongodb.net/gameverse?retryWrites=true&w=majority
   ```

---

## 2. Backend Deployment: Render

1. Push your repository to **GitHub**.
2. Sign in to [Render](https://render.com) and click **New + -> Web Service**.
3. Connect your GitHub repository.
4. Configure settings:
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Configure Environment Variables in Render Dashboard:
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `8084` (or leave default assigned by Render) |
   | `MONGODB_URI` | `mongodb+srv://...` (your Atlas URI) |
   | `JWT_SECRET` | Strong 64-character random string |
   | `CLIENT_URL` | `https://your-gameverse-app.vercel.app` (your frontend URL) |
6. Click **Create Web Service**.
7. Note down your Render backend URL (e.g. `https://gameverse-backend.onrender.com`).
8. Verify deployment with the health check:
   ```bash
   curl https://gameverse-backend.onrender.com/health
   ```

---

## 3. Frontend Deployment: Vercel

1. Sign in to [Vercel](https://vercel.com) and click **Add New... -> Project**.
2. Import your GitHub repository.
3. Configure settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Configure Environment Variables in Vercel:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://gameverse-backend.onrender.com` |
   | `VITE_SOCKET_URL` | `https://gameverse-backend.onrender.com` |
5. Click **Deploy**.
6. The `client/vercel.json` file ensures that all React Router routes resolve to `index.html` without 404 errors:
   ```json
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

---

## 4. Cross-Domain Cookie & CORS Configuration

In cross-domain setups (e.g. Vercel on `*.vercel.app` and Render on `*.onrender.com`):
- `server/controllers/authController.js` sets cookies with:
  ```javascript
  {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  }
  ```
- `client/src/services/api.js` configures:
  ```javascript
  axios.create({
    withCredentials: true,
    headers: { Authorization: `Bearer ${token}` }
  });
  ```
- Sockets send the JWT token during the WebSocket handshake auth payload to ensure instantaneous connection even if third-party cookies are blocked by certain browser extensions.
