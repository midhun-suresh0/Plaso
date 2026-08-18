# Plaso

**Hyperlocal Social Commerce Platform**

Plaso is a mobile application that combines hyperlocal social networking, location-based discovery, local business listings, a marketplace, community interaction, reviews, and personalized recommendations.

> **Current Phase: Phase 1 — Project Foundation**

---

## Technology Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Mobile     | React Native + Expo + TypeScript    |
| Backend    | Node.js + Express.js + TypeScript   |
| Database   | MongoDB (data) + Neo4j (graph)      |
| Location   | Maps API (planned)                  |

---

## Architecture Overview

```
Mobile App (React Native + Expo)
        │
        ▼  REST API (HTTP/JSON)
Backend API (Node.js + Express)
        │
    ┌───┴───┐
    ▼       ▼
 MongoDB   Neo4j
```

---

## Project Structure

```
plaso/
├── client/                  # React Native + Expo mobile app
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── screens/         # Screen components
│   │   ├── navigation/      # Navigation configuration
│   │   ├── services/        # API client and services
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # React context providers
│   │   ├── types/           # TypeScript type definitions
│   │   ├── constants/       # Theme, config, constants
│   │   ├── utils/           # Utility functions
│   │   └── assets/          # Images, fonts, etc.
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
│
├── server/                  # Node.js + Express backend
│   ├── src/
│   │   ├── config/          # Environment configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/       # Express middleware
│   │   ├── models/          # Database models (Phase 2+)
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic (Phase 2+)
│   │   ├── database/        # Database connections
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   ├── app.ts           # Express application
│   │   └── server.ts        # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                    # Project documentation
│   ├── architecture/
│   ├── api/
│   └── database/
│
├── .env.example             # Environment variable template
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** (local or Atlas)
- **Neo4j** (local or AuraDB)
- **Expo CLI** (installed globally or via npx)
- **Android Studio** or **Xcode** (for mobile emulators) or **Expo Go** app on device

---

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd plaso
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Install backend dependencies
```bash
cd server
npm install
```

### 4. Install frontend dependencies
```bash
cd client
npm install
```

---

## Environment Variables

| Variable         | Description                  | Example                              |
|------------------|------------------------------|--------------------------------------|
| `PORT`           | Backend server port          | `5000`                               |
| `NODE_ENV`       | Environment mode             | `development`                        |
| `MONGODB_URI`    | MongoDB connection string    | `mongodb://localhost:27017/plaso`     |
| `NEO4J_URI`      | Neo4j connection URI         | `bolt://localhost:7687`              |
| `NEO4J_USERNAME` | Neo4j username               | `neo4j`                              |
| `NEO4J_PASSWORD` | Neo4j password               | *(your password)*                    |
| `MAPS_API_KEY`   | Maps/location API key        | *(your key)*                         |

---

## Running the Application

### Start the Backend
```bash
cd server
npm run dev
```
The API will be available at `http://localhost:5000`.

### Start the Frontend
```bash
cd client
npx expo start
```
Scan the QR code with Expo Go, or press `a` for Android / `i` for iOS emulator.

---

## Health Check

```bash
curl http://localhost:5000/api/health
```

**Response:**
```json
{
  "success": true,
  "message": "Plaso API is running"
}
```

---

## Database Setup

### MongoDB
1. Install [MongoDB Community Edition](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Set `MONGODB_URI` in your `.env` file

### Neo4j
1. Install [Neo4j Desktop](https://neo4j.com/download/) or use [Neo4j AuraDB](https://neo4j.com/cloud/aura/)
2. Set `NEO4J_URI`, `NEO4J_USERNAME`, and `NEO4J_PASSWORD` in your `.env` file

### Verify Connections
When the server starts, successful connections show:
```
[OK] MongoDB: Connected
[OK] Neo4j: Connected
[OK] API: Running on port 5000
```

---

## Development Phase

**Phase 1 — Project Foundation** ✅ (Current)

- Project structure and architecture
- Backend API with health check
- Database connections (MongoDB + Neo4j)
- Frontend foundation (React Native + Expo)
- Environment configuration
- Error handling
- API service layer

**Phase 2+** (Planned)

- Authentication & authorization
- User profiles
- Business listings
- Marketplace
- Social feed & communities
- Chat & notifications
- Search & recommendations
- Location-based features
