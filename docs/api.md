# Adaptive Hydration Tracker API

## Authentication

### POST /api/auth/register
Register a new user.

Request body:
- name
- email
- password
- age
- gender (`male` or `female`)
- weight
- activityLevel (`sedentary`, `moderate`, `active`, `athlete`)

### POST /api/auth/login
Login and receive JWT.

Request body:
- email
- password

## Users

### GET /api/users/me
Retrieve authenticated user profile.

Headers:
- Authorization: `Bearer <token>`

### PATCH /api/users/me
Update profile fields.

Request body:
- name
- age
- gender
- weight
- activityLevel

### POST /api/users/me/device-token
Save FCM device token for push notifications.

Request body:
- token

## Hydration

### POST /api/hydration/log
Log a water intake entry.

Request body:
- amount (ml)
- timestamp (optional)

### GET /api/hydration/stats/daily
Get daily intake statistics.

Query parameters:
- date (optional, ISO format)

### GET /api/hydration/stats/weekly
Get weekly intake statistics.

Query parameters:
- date (optional, ISO format)

### GET /api/hydration/reminders
Get adaptive reminder recommendations.

