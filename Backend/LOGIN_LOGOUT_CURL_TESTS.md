# Login/Logout - CURL Testing Guide

Quick commands to test login/logout endpoints using curl (no frontend needed).

## Prerequisites

- Backend running: `cd Backend && npm run dev`
- User exists in database with UserLogin record
- Replace placeholders: `{user-id}`, `{device-id}`, `YOUR_USERNAME`, `YOUR_PASSWORD`

---

## 1. Login Test

### Login from Device 1
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "password123",
    "deviceInfo": {
      "id": "device-laptop-001",
      "name": "My Laptop"
    }
  }'
```

**Expected Response**:
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "device": {
      "deviceId": "device-laptop-001",
      "loginCount": 1
    },
    "session": {
      "isLoggedIn": true,
      "totalDevices": 1
    }
  },
  "message": "Login successful"
}
```

**Save output** for next steps:
- Note the **user id** (e.g., 507f1f77bcf86cd799439011)
- Note the **accessToken** and **refreshToken**

---

## 2. Login from Another Device (Simulate Multi-Device)

### Login from Device 2 (same user, different device)
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "password123",
    "deviceInfo": {
      "id": "device-phone-001",
      "name": "My Phone"
    }
  }'
```

**Expected Response**: Same structure, but `totalDevices: 2` and `deviceId: device-phone-001`

Now user is logged in from 2 devices! ✅

---

## 3. Get Active Sessions

### List all devices user is logged into
```bash
curl http://localhost:4000/api/auth/sessions/507f1f77bcf86cd799439011
```

**Replace**: `507f1f77bcf86cd799439011` with actual user ID from login response

**Expected Response**:
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "isLoggedIn": true,
    "activeSessions": 2,
    "devices": [
      {
        "deviceId": "device-laptop-001",
        "ipAddress": "::1",
        "userAgent": "curl/7.68.0",
        "loginCount": 1,
        "lastActive": "2024-01-15T10:30:00.000Z"
      },
      {
        "deviceId": "device-phone-001",
        "ipAddress": "::1",
        "userAgent": "curl/7.68.0",
        "loginCount": 1,
        "lastActive": "2024-01-15T11:00:00.000Z"
      }
    ]
  },
  "message": "Active sessions retrieved"
}
```

Notice: Both devices are listed ✅

---

## 4. Logout from One Device

### Logout from phone device (keep laptop active)
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-phone-001",
    "userId": "507f1f77bcf86cd799439011"
  }'
```

**Replace**: 
- `device-phone-001` with actual deviceId
- `507f1f77bcf86cd799439011` with actual user ID

**Expected Response** (phone still active on other device):
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "loggedOutDeviceId": "device-phone-001",
    "isLoggedIn": true,
    "message": "Logged out from device",
    "activeDevices": [
      {
        "deviceId": "device-laptop-001",
        "ipAddress": "::1",
        "userAgent": "curl/7.68.0",
        "loginCount": 1,
        "lastActive": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "message": "Logout successful"
}
```

**Key observation**: `isLoggedIn` is still **true** because laptop is still active! ✅

### Verify with get sessions
```bash
curl http://localhost:4000/api/auth/sessions/507f1f77bcf86cd799439011
```

**Response**: Should now show only 1 device (laptop)

---

## 5. Logout from Last Device

### Logout from laptop device (last device)
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-laptop-001",
    "userId": "507f1f77bcf86cd799439011"
  }'
```

**Expected Response** (NOW ALL LOGGED OUT):
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "loggedOutDeviceId": "device-laptop-001",
    "isLoggedIn": false,
    "message": "Logged out from all devices",
    "activeDevices": []
  },
  "message": "Logout successful"
}
```

**Key observation**: `isLoggedIn` is NOW **false** and `activeDevices` is **empty**! ✅

This is the core feature: **isLoggedIn only becomes false when ALL devices are logged out**.

---

## 6. Logout From All Devices (At Once)

### Login from multiple devices again (for test)
```bash
# Device 1
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "password123", "deviceInfo": {"id": "device-1"}}'

# Device 2
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "password123", "deviceInfo": {"id": "device-2"}}'

# Device 3
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "password123", "deviceInfo": {"id": "device-3"}}'
```

### Now logout from all devices at once
```bash
curl -X POST http://localhost:4000/api/auth/logout-all/507f1f77bcf86cd799439011
```

**Expected Response**:
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "loggedOutDevices": [
      { "deviceId": "device-1", "logoutCount": 1 },
      { "deviceId": "device-2", "logoutCount": 1 },
      { "deviceId": "device-3", "logoutCount": 1 }
    ],
    "isLoggedIn": false
  },
  "message": "Logged out from all devices"
}
```

**Result**: All devices logged out, isLoggedIn = false ✅

---

## Full Test Scenario (Copy & Paste)

This script performs complete multi-device test:

```bash
#!/bin/bash

# Configuration
USER_ID="507f1f77bcf86cd799439011"  # Replace with actual user ID
API_URL="http://localhost:4000/api/auth"

echo "=== Test 1: Login from Device 1 ==="
LOGIN1=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "password123",
    "deviceInfo": {"id": "device-1", "name": "Device 1"}
  }')
echo "$LOGIN1" | jq '.'
echo ""

echo "=== Test 2: Login from Device 2 ==="
curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "password123",
    "deviceInfo": {"id": "device-2", "name": "Device 2"}
  }' | jq '.'
echo ""

echo "=== Test 3: Get Active Sessions (should show 2 devices) ==="
curl -s "$API_URL/sessions/$USER_ID" | jq '.data'
echo ""

echo "=== Test 4: Logout from Device 1 (Device 2 still active) ==="
curl -s -X POST "$API_URL/logout" \
  -H "Content-Type: application/json" \
  -d "{\"deviceId\": \"device-1\", \"userId\": \"$USER_ID\"}" | jq '.data'
echo ""

echo "=== Test 5: Get Active Sessions (should show Device 2 only) ==="
curl -s "$API_URL/sessions/$USER_ID" | jq '.data'
echo ""

echo "=== Test 6: Logout from Device 2 (all logged out) ==="
curl -s -X POST "$API_URL/logout" \
  -H "Content-Type: application/json" \
  -d "{\"deviceId\": \"device-2\", \"userId\": \"$USER_ID\"}" | jq '.data'
echo ""

echo "=== Test Complete ==="
echo "isLoggedIn should be false and activeDevices should be empty"
```

Save as `test-login.sh` and run:
```bash
chmod +x test-login.sh
./test-login.sh
```

---

## Testing Error Cases

### Invalid username
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "invalid_user", "password": "password123"}'
```

**Expected**: 401 "Invalid username or password"

### Missing deviceId in logout
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"userId": "507f1f77bcf86cd799439011"}'
```

**Expected**: 400 "Device ID is required"

### Non-existent user
```bash
curl http://localhost:4000/api/auth/sessions/607f1f77bcf86cd799439099
```

**Expected**: Empty sessions or 404 depending on implementation

---

## Quick Command Reference

| Action | Command |
|--------|---------|
| Login | `curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{...}'` |
| Sessions | `curl http://localhost:4000/api/auth/sessions/{userId}` |
| Logout | `curl -X POST http://localhost:4000/api/auth/logout -H "Content-Type: application/json" -d '{...}'` |
| Logout All | `curl -X POST http://localhost:4000/api/auth/logout-all/{userId}` |

---

## Debugging Tips

### Check database directly
```bash
# Connect to MongoDB
mongosh

# Select database (replace 'your-db')
use your-db

# Find user and check loggedInDevices
db.userlogs.findOne({ user: ObjectId("507f1f77bcf86cd799439011") })

# Check loggedInDevices array
db.userlogs.findOne(
  { user: ObjectId("507f1f77bcf86cd799439011") },
  { loggedInDevices: 1 }
)
```

### Check backend logs
```bash
# Terminal where npm run dev is running
# Should print login/logout events with:
# - User ID
# - Device ID
# - IP Address
# - Action (USER_LOGIN, USER_LOGOUT)
```

### Check response headers
```bash
curl -v -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "password123"}'
```

The `-v` flag shows request/response headers and full response body.

---

## Next: Frontend Integration

Once backend is tested and working, integrate with:
1. [Login.jsx](../Frentend/src/pages/Login.jsx) - Login form component
2. [ActiveSessions.jsx](../Frentend/src/pages/ActiveSessions.jsx) - View sessions component
3. [userApi.js](../Frentend/src/services/userApi.js) - API service functions

See [LOGIN_LOGOUT_IMPLEMENTATION.md](./LOGIN_LOGOUT_IMPLEMENTATION.md) for frontend setup steps.

---

## Expected Behavior Summary

✅ **Login** → Creates device session, sets isLoggedIn = true
✅ **Logout from Device 1** → If Device 2 exists, isLoggedIn stays true
✅ **Logout from Device 2** → No active sessions, isLoggedIn = false
✅ **Logout All** → All devices logged out, isLoggedIn = false, activeDevices = []
✅ **Re-login same device** → Increments loginCount, keeps same deviceId

This is the **correct behavior** for multi-device session management! 🎉
