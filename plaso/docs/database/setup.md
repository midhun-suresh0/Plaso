# Plaso — Database Setup

## MongoDB

### Installation
1. Install MongoDB Community Edition: https://www.mongodb.com/try/download/community
2. Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas

### Configuration
Set the connection URI in your `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/plaso
```

### Verify Connection
When the server starts, you should see:
```
[OK] MongoDB: Connected
```

If MongoDB is unavailable, you'll see:
```
[ERROR] MongoDB: Connection failed — <error details>
```

The server will continue running without MongoDB. Fix the connection and restart.

---

## Neo4j

### Installation
1. Install Neo4j Desktop: https://neo4j.com/download/
2. Or use Neo4j AuraDB (cloud): https://neo4j.com/cloud/aura/

### Configuration
Set the connection details in your `.env` file:
```
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password_here
```

### Verify Connection
When the server starts, you should see:
```
[OK] Neo4j: Connected
```

If Neo4j is unavailable, you'll see:
```
[ERROR] Neo4j: Connection failed — <error details>
```

The server will continue running without Neo4j. Fix the connection and restart.

---

## Startup Status

A successful startup with both databases looks like:
```
[INFO] Starting Plaso API...
[OK] MongoDB: Connected
[OK] Neo4j: Connected
[OK] API: Running on port 5000
[INFO] Environment: development
[INFO] Health check: http://localhost:5000/api/health
```
