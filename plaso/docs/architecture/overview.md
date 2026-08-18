# Plaso — Architecture Overview

## High-Level Architecture

```
┌─────────────────────┐
│   Mobile App        │
│   (React Native +   │
│    Expo + TS)       │
└────────┬────────────┘
         │ REST API (HTTP/JSON)
         ▼
┌─────────────────────┐
│   Backend API       │
│   (Node.js +        │
│    Express + TS)    │
└────┬───────────┬────┘
     │           │
     ▼           ▼
┌─────────┐ ┌─────────┐
│ MongoDB │ │  Neo4j  │
│ (Data)  │ │ (Graph) │
└─────────┘ └─────────┘
```

## Component Responsibilities

### Mobile App (client/)
- User interface and interactions
- Navigation between screens
- API communication via service layer
- Local state management

### Backend API (server/)
- REST API endpoints
- Business logic and validation
- Database operations
- Error handling and logging

### MongoDB
- Primary application data storage
- Users, businesses, products, posts, communities, reviews, messages, notifications

### Neo4j
- Relationship and graph data
- Social connections, recommendations, trust networks
- User → User, User → Business, User → Community relationships

## Design Principles

1. **Separation of Concerns**: Frontend and backend are independent
2. **Modular Architecture**: Each feature is a self-contained module
3. **Centralized Configuration**: All env vars loaded from one place
4. **Consistent Error Handling**: Single error handler, consistent response format
5. **Graceful Degradation**: Server runs even if a database is unavailable
6. **Type Safety**: TypeScript strict mode throughout
