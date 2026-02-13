# Login/Logout System with Device Session Tracking

## Overview

This guide documents the complete login/logout implementation that tracks user sessions across multiple devices. The key feature is **multi-device aware state management**: `isLoggedIn` is only set to `false` when the user has logged out from **ALL devices**.

---

## Database Schema

### UserLogin Model

```javascript
{
  user: ObjectId,  // Reference to User
  username: String,  // Unique, lowercase
  password: String,  // Hashed with bcryptjs
  isLoggedIn: Boolean,  // true if ANY device has active session
  lastLogin: Date,
  loggedInDevices: [
    {
      deviceId: String,  // UUID or browser fingerprint
      ipAddress: String,
      userAgent: String,
      loginCount: Number,  // Tracks how many times this device logged in
      refreshToken: String,  // Stored for this device
      loginHistory: [
        {
          loginAt: Date,
          logoutAt: Date,  // null = active session, present = logged out
        }
      ]
    }
  ]
}
```

### Login State Logic

```
isLoggedIn = loggedInDevices.some(device =>
  device.loginHistory.some(session => !session.logoutAt)
)
```

A user is considered logged in if **ANY** device has **ANY** session without `logoutAt` timestamp.

---

## API Endpoints

### 1. POST `/api/auth/login`

**Purpose**: Authenticate user and create device session

**Request Body**:
```json
{
  "username": "john_doe",
  "password": "securePassword123",
  "deviceInfo": {
    "id": "device-uuid-here",
    "name": "Chrome on Windows",
    "type": "browser"
  }
}
```

**Response** (Success):
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    },
    "device": {
      "deviceId": "device-uuid",
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

**Response** (Error):
- `401 "Invalid username or password"` - Wrong credentials
- `401 "Your account is not eligible for login"` - canLogin = false
- `401 "Your account has been blocked"` - User is blocked

**Flow**:
1. Validate username and password presence
2. Find UserLogin by username (case-insensitive)
3. Check if user exists, canLogin is true, and not blocked
4. (TODO) Verify password with bcryptjs comparison
5. Check if device already exists:
   - If yes: increment loginCount, add new loginHistory entry
   - If no: add new device to loggedInDevices
6. Set `isLoggedIn = true`
7. Generate access + refresh tokens
8. Log audit trail: USER_LOGIN
9. Return tokens and device info

---

### 2. POST `/api/auth/logout`

**Purpose**: Logout from a specific device

**Request Body**:
```json
{
  "deviceId": "device-uuid",
  "userId": "user-id"
}
```

**Response** (Success):
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "loggedOutDeviceId": "device-uuid",
    "isLoggedIn": true,
    "message": "Logged out from device",
    "activeDevices": [
      {
        "deviceId": "other-device-uuid",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "loginCount": 2,
        "lastActive": "2024-01-15T10:30:00Z"
      }
    ]
  },
  "message": "Logout successful"
}
```

**If user logged out from ALL devices**:
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "loggedOutDeviceId": "device-uuid",
    "isLoggedIn": false,  // NOW FALSE - All devices logged out
    "message": "Logged out from all devices",
    "activeDevices": []
  },
  "message": "Logout successful"
}
```

**Response** (Error):
- `404 "User login record not found"` - User has no UserLogin

**Flow**:
1. Find UserLogin by userId
2. Find device by deviceId
3. Mark device's last login session with `logoutAt = new Date()`
4. Check if ANY device still has active sessions (session without logoutAt)
5. If no active sessions remain:
   - Set `isLoggedIn = false`
   - Clear message to "Logged out from all devices"
6. Clear refresh token for the device
7. Log audit trail: USER_LOGOUT
8. Return remaining active devices

---

### 3. GET `/api/auth/sessions/:userId`

**Purpose**: Get all devices user is currently logged into

**Response**:
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "isLoggedIn": true,
    "activeSessions": 2,
    "devices": [
      {
        "deviceId": "device-1",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0 Chrome/91.0...",
        "loginCount": 3,
        "lastActive": "2024-01-15T14:22:00Z"
      },
      {
        "deviceId": "device-2",
        "ipAddress": "203.0.113.5",
        "userAgent": "Mozilla/5.0 Safari/537.36...",
        "loginCount": 1,
        "lastActive": "2024-01-15T10:15:00Z"
      }
    ]
  },
  "message": "Active sessions retrieved"
}
```

---

### 4. POST `/api/auth/logout-all/:userId`

**Purpose**: Force logout from ALL devices (used for password reset, security concerns)

**Response**:
```json
{
  "statusCode": 200,
  "success": true,
  "data": {
    "loggedOutDevices": [
      {
        "deviceId": "device-1",
        "logoutCount": 1
      },
      {
        "deviceId": "device-2",
        "logoutCount": 1
      }
    ],
    "isLoggedIn": false
  },
  "message": "Logged out from all devices"
}
```

---

## Frontend Integration

### Using Frontend API Functions

```javascript
import {
  loginUserViaPassword,
  logoutUserFromDevice,
  getActiveSessions,
  logoutFromAllDevices,
} from '@/services/userApi.js';

// Login
const response = await loginUserViaPassword(
  'john_doe',
  'password123',
  {
    id: generateDeviceId(),
    name: 'My Laptop' 
  }
);

const { tokens, device } = response.data;
localStorage.setItem('accessToken', tokens.accessToken);
localStorage.setItem('refreshToken', tokens.refreshToken);
localStorage.setItem('deviceId', device.deviceId);

// Logout from current device
const logoutResponse = await logoutUserFromDevice(
  localStorage.getItem('deviceId'),
  userId
);

if (!logoutResponse.data.isLoggedIn) {
  // User logged out from all devices - clear auth state
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('deviceId');
  redirect('/auth/login');
}

// View all active sessions
const sessions = await getActiveSessions(userId);
console.log(sessions.data.devices); // Show user where they're logged in

// Force logout all devices (e.g., after password reset)
await logoutFromAllDevices(userId);
```

---

## Multi-Device Scenario Example

**Scenario**: John logs in from laptop (Device A), then logs in from phone (Device B)

### Step 1: Login from Laptop
```
POST /api/auth/login
{
  "username": "john",
  "password": "...",
  "deviceInfo": { "id": "device-laptop", "name": "My Laptop" }
}
Response: isLoggedIn = true, totalDevices = 1
```

**DB State After Login**:
```javascript
userLogin = {
  isLoggedIn: true,
  loggedInDevices: [
    {
      deviceId: "device-laptop",
      ipAddress: "192.168.1.1",
      loginHistory: [
        { loginAt: "2024-01-15T10:00:00Z", logoutAt: null }  // Active
      ]
    }
  ]
}
```

### Step 2: Login from Phone
```
POST /api/auth/login
{
  "username": "john",
  "password": "...",
  "deviceInfo": { "id": "device-phone", "name": "My Phone" }
}
Response: isLoggedIn = true, totalDevices = 2
```

**DB State After Second Login**:
```javascript
userLogin = {
  isLoggedIn: true,  // Still true - laptop still active
  loggedInDevices: [
    {
      deviceId: "device-laptop",
      loginHistory: [
        { loginAt: "2024-01-15T10:00:00Z", logoutAt: null }  // Active
      ]
    },
    {
      deviceId: "device-phone",
      ipAddress: "203.0.113.5",
      loginHistory: [
        { loginAt: "2024-01-15T11:00:00Z", logoutAt: null }  // Active
      ]
    }
  ]
}
```

### Step 3: Logout from Phone
```
POST /api/auth/logout
{
  "deviceId": "device-phone",
  "userId": "john-id"
}
Response: isLoggedIn = true (laptop still active)
activeDevices = [{ deviceId: "device-laptop", ... }]
```

**DB State After Phone Logout**:
```javascript
userLogin = {
  isLoggedIn: true,  // Still true - laptop is active
  loggedInDevices: [
    {
      deviceId: "device-laptop",
      loginHistory: [
        { loginAt: "2024-01-15T10:00:00Z", logoutAt: null }  // Active
      ]
    },
    {
      deviceId: "device-phone",
      loginHistory: [
        { loginAt: "2024-01-15T11:00:00Z", logoutAt: "2024-01-15T12:00:00Z" }  // Inactive
      ]
    }
  ]
}
```

### Step 4: Logout from Laptop
```
POST /api/auth/logout
{
  "deviceId": "device-laptop",
  "userId": "john-id"
}
Response: isLoggedIn = false, activeDevices = []
```

**DB State After Laptop Logout**:
```javascript
userLogin = {
  isLoggedIn: false,  // NOW FALSE - All devices logged out
  loggedInDevices: [
    {
      deviceId: "device-laptop",
      loginHistory: [
        { loginAt: "2024-01-15T10:00:00Z", logoutAt: "2024-01-15T13:00:00Z" }  // Inactive
      ]
    },
    {
      deviceId: "device-phone",
      loginHistory: [
        { loginAt: "2024-01-15T11:00:00Z", logoutAt: "2024-01-15T12:00:00Z" }  // Inactive
      ]
    }
  ]
}
```

---

## Important Notes

### 1. Password Comparison is Disabled (TODO)

Currently, the loginUser endpoint does NOT validate the password:

```javascript
// TODO: Uncomment when you implement password comparison
// const isPasswordValid = await userLogin.comparePassword(password);
// if (!isPasswordValid) {
//   throw new apiError(401, "Invalid username or password");
// }
```

**To Enable**:
1. Ensure UserLogin model has `comparePassword()` method:
```javascript
userLoginSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
```

2. Uncomment the validation lines in loginUser()

3. Test login with correct and incorrect passwords

### 2. Device ID Generation

The frontend should generate unique device IDs:

```javascript
// Option 1: UUID (stateless)
import { v4 as uuidv4 } from 'uuid';
const deviceId = uuidv4();

// Option 2: Device fingerprint (requires library)
import FingerprintJS from '@fingerprintjs/fingerprintjs';
const fp = await FingerprintJS.load();
const result = await fp.get();
const deviceId = result.visitorId;

// Option 3: Simple browser ID (localStorage)
let deviceId = localStorage.getItem('deviceId');
if (!deviceId) {
  deviceId = uuidv4();
  localStorage.setItem('deviceId', deviceId);
}
```

### 3. Audit Logging

login/logout actions are logged to Audit collection:
- Action: USER_LOGIN, USER_LOGOUT
- Includes: userId, deviceId, IP address, user agent, timestamp
- Use for security analysis and compliance

### 4. Rate Limiting

Authentication endpoints have stricter rate limiting:
- General endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Rate limit applies per IP address

### 5. Token Management

Each device gets its own `refreshToken`:
- Stored in `loggedInDevices[deviceIndex].refreshToken`
- Can be used to refresh access token
- Cleared when device logs out

---

## Testing with curl

### Test Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "password123",
    "deviceInfo": {
      "id": "device-1",
      "name": "Laptop"
    }
  }'
```

### Test Logout
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-1",
    "userId": "user-id-here"
  }'
```

### Test Get Sessions
```bash
curl http://localhost:4000/api/auth/sessions/user-id-here
```

### Test Logout All
```bash
curl -X POST http://localhost:4000/api/auth/logout-all/user-id-here
```

---

## Integration Checklist

- [ ] Enable password comparison in loginUser() (uncomment lines at ~70)
- [ ] Create frontend Login page component
  - [ ] Username and password inputs
  - [ ] Device name input (optional)
  - [ ] Call loginUserViaPassword() on submit
  - [ ] Store tokens and deviceId in localStorage
  - [ ] Redirect to dashboard on success
- [ ] Update frontend App.jsx with protected routes
  - [ ] Check if token exists
  - [ ] Verify token validity
  - [ ] Redirect to login if not authenticated
- [ ] Create Active Sessions page
  - [ ] Call getActiveSessions() on mount
  - [ ] Display list of devices
  - [ ] Add "Logout from this device" button
  - [ ] Add "Logout from all devices" button
- [ ] Add Logout route handler
  - [ ] Clear localStorage tokens
  - [ ] Call logoutUserFromDevice() with current deviceId
  - [ ] Redirect to login
- [ ] Test multi-device scenarios
  - [ ] Login from different browsers/devices
  - [ ] Verify isLoggedIn state changes
  - [ ] Verify activeDevices list updates
- [ ] Add password reset integration
  - [ ] Call logoutFromAllDevices() after password reset
  - [ ] Force re-authentication on new password

---

## Security Considerations

1. **Store Tokens Securely**: Use httpOnly cookies or sessionStorage instead of localStorage if possible
2. **Token Expiry**: Set short expiry (15 min) on access tokens
3. **Refresh Token Rotation**: Rotate refresh tokens on each use
4. **Device Fingerprinting**: Consider stronger device identification
5. **IP Validation**: Store and validate IP address during logout
6. **Login Notifications**: Send email/SMS on login from new device
7. **Clear Sessions on Password Change**: Logout from all devices after password reset
8. **Rate Limiting**: Already implemented (5 attempts per 15 min)

---

## Troubleshooting

**Q: isLoggedIn stays true after logout from one device**
A: This is the intended behavior! isLoggedIn should only be false when user is logged out from ALL devices. Check activeDevices array to see remaining logged-in devices.

**Q: Device not found when logging out**
A: Ensure deviceId matches exactly (case-sensitive). Check browser console to verify deviceId being sent.

**Q: "Invalid username or password" error on correct password**
A: Password comparison is disabled (TODO). Uncomment validation in loginUser() function after implementing comparePassword() method.

**Q: Multiple login attempts creating duplicate devices**
A: Ensure frontend generates consistent deviceId (e.g., store in localStorage). If deviceId changes, a new device entry is created.

---

## Related Guides

- [Password Reset Guide](./PASSWORD_RESET_GUIDE.md)
- [User Management Guide](./USER_MANAGEMENT_GUIDE.md)
- [API Authentication Guide](./API_AUTHENTICATION_GUIDE.md)
