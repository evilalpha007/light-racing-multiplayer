# 🏁 Pixel Racing - Multiplayer Game

A modern **multiplayer racing game** built with React, TypeScript, Node.js, and Socket.IO featuring real-time gameplay and JWT authentication.

## ✨ Features

### 🔐 Authentication
- JWT-based secure authentication
- **Single device per account** (auto-logout from other devices)
- Password hashing with bcrypt
- Session management with auto-expiration

### 🎮 Multiplayer
- Real-time WebSocket communication (Socket.IO)
- Room-based matchmaking (up to 4 players)
- Live position synchronization (50ms updates)
- Race countdown system (3-2-1-GO!)
- Player disconnect handling
- Host-controlled race start

### 🏎️ Game Features
- Pseudo-3D racing graphics
- Smooth 60 FPS gameplay
- Keyboard + Touch controls
- Lap timing system
- Player statistics tracking
- Race history

## 🛠️ Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** (fast build tool)
- **Socket.IO Client** (real-time communication)
- **Axios** (HTTP requests)
- **React Router** (navigation)

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **Socket.IO** (WebSocket server)
- **MongoDB** + **Mongoose** (database)
- **JWT** (authentication)
- **bcrypt** (password hashing)

## 📦 Installation

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally (or MongoDB Atlas account)

### 1. Clone & Setup

```bash
cd pixel-racing-multiplayer
```

### 2. Install Dependencies

#### Backend
```bash
cd server
npm install
```

#### Frontend
```bash
cd client
npm install
```

### 3. Configure Environment

#### Backend (.env)
```env
PORT=3000
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=
NODE_ENV=development
CORS_ORIGIN=
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

## 🚀 Running the Application

### Start MongoDB
```bash
# If using local MongoDB
mongod
```

### Start Backend Server
```bash
cd server
npm run dev
```
Server will start on `http://localhost:3000`

### Start Frontend
```bash
cd client
npm run dev
```
Frontend will start on `http://localhost:5173`

## 🎯 How to Play

1. **Register/Login**
   - Create an account or login
   - Only one device can be logged in at a time

2. **Create or Join Room**
   - Create a new race room
   - Or join an existing room from the lobby

3. **Wait for Players**
   - Wait for other players to join
   - Mark yourself as ready
   - Host can start the race when all players are ready

4. **Race!**
   - Use arrow keys or WASD to control
   - On mobile: tap left/right to steer, both sides to brake
   - Complete the lap as fast as possible

5. **View Results**
   - See final positions and lap times
   - Stats are saved to your profile

## 🎮 Controls

### Keyboard
- **Arrow Keys** or **WASD** - Steering and acceleration
- **Up/W** - Accelerate
- **Down/S** - Brake
- **Left/A** - Steer left
- **Right/D** - Steer right

### Touch (Mobile)
- **Tap left half** - Steer left
- **Tap right half** - Steer right
- **Tap both sides** - Brake
- **Otherwise** - Accelerate

## 📁 Project Structure

```
racing-multiplayer/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API & Socket services
│   │   ├── engine/         # Game engine (TODO)
│   │   └── types/          # TypeScript types
│   └── public/
│       └── images/         # Game assets
│
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # MongoDB models
│   │   ├── services/       # Business logic
│   │   ├── socket/         # WebSocket handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── config/         # Configuration
│   └── package.json
│
└── shared/                 # Shared TypeScript types
    └── types.ts
```

## 🔧 Development Status

### ✅ Completed (Backend - 100%)
- [x] JWT Authentication
- [x] Session Management (single device)
- [x] MongoDB Models (User, Session, Race)
- [x] Socket.IO Server
- [x] Room Management
- [x] Real-time Position Sync
- [x] Race Countdown
- [x] Player Disconnect Handling

### 🚧 In Progress (Frontend - 40%)
- [x] API Service
- [x] Socket Service
- [x] Project Setup
- [ ] Authentication UI (Login/Register)
- [ ] Game Engine (TypeScript conversion)
- [ ] Multiplayer Game Component
- [ ] Lobby System
- [ ] HUD Component

### ⏳ Planned
- [ ] Sound Effects
- [ ] Leaderboards
- [ ] Spectator Mode
- [ ] Custom Track Editor
- [ ] Mobile App (React Native)

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Make sure MongoDB is running
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in server/.env
```

### Port Already in Use
```bash
# Change PORT in server/.env
# Change VITE_API_URL in client/.env accordingly
```

### CORS Errors
```bash
# Make sure CORS_ORIGIN in server/.env matches your frontend URL
CORS_ORIGIN=http://localhost:5173
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Rooms
- `GET /api/rooms` - Get available rooms

### WebSocket Events

## 🤝 Contributing

This is a learning project. Feel free to fork and experiment!

## 📄 License

MIT License

## 🎉 Credits

Original game concept inspired by classic pseudo-3D racing games like Out Run.

---

**Made with ❤️ using React, TypeScript, and Socket.IO**
