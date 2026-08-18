# Plaso — API Endpoints

## Base URL

```
http://localhost:5000/api
```

## Available Endpoints

### Health Check

| Method | Endpoint       | Description                  |
|--------|----------------|------------------------------|
| GET    | `/api/health`  | Check if the API is running  |

**Response:**
```json
{
  "success": true,
  "message": "Plaso API is running"
}
```

## Planned Endpoints (Phase 2+)

| Prefix                   | Module           |
|--------------------------|------------------|
| `/api/auth`              | Authentication   |
| `/api/users`             | User management  |
| `/api/businesses`        | Business profiles|
| `/api/products`          | Product catalog  |
| `/api/posts`             | Social posts     |
| `/api/communities`       | Communities      |
| `/api/reviews`           | Reviews & ratings|
| `/api/chat`              | Messaging        |
| `/api/notifications`     | Notifications    |
| `/api/search`            | Search           |
| `/api/recommendations`   | Recommendations  |
| `/api/location`          | Location services|

## Response Format

All API responses follow this structure:

### Success
```json
{
  "success": true,
  "message": "Description of result",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Description of error"
}
```
