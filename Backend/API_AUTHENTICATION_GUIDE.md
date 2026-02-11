# Authentication API Documentation

Complete guide for login/logout session management with access and refresh tokens stored in cookies.

## Overview

The authentication system uses:
- **Access Token**: 15 minutes expiry, stored in httpOnly cookie
- **Refresh Token**: 7 days expiry, stored in httpOnly cookie
- **Device Tracking**: Multiple device login with device-specific logout
- **Account Security**: Failed login attempt tracking with progressive locking
- **Professional Level Classification**: 5 levels based on user role
- **Industry-based Access Control**: Different access based on organization industry

---

## Authentication Endpoints

### 1. Register User with Login Credentials
**POST** `/api/auth/register`

Register login credentials for an existing user.

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "username": "john.doe",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "statusCode": 201,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "user": "507f1f77bcf86cd799439011",
    "username": "john.doe",
    "isLoggedIn": false
  },
  "message": "User registered successfully",
  "success": true
}
```

---

### 2. Login User
**POST** `/api/auth/login`

Authenticate user and set cookies with tokens.

**Request Body:**
```json
{
  "username": "john.doe",
  "password": "SecurePassword123",
  "deviceId": "device-uuid-123",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0... (Windows NT 10.0; Win64; x64)"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "USR001",
      "name": "John Doe",
      "email": "john@example.com",
      "designation": "Engineer",
      "department": "IT",
      "role": "admin",
      "organizationId": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Tech Company",
        "industry": "IT"
      }
    },
    "deviceId": "device-uuid-123"
  },
  "message": "User logged in successfully",
  "success": true
}
```

**Cookies Set:**
```
Set-Cookie: accessToken=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=900000
Set-Cookie: refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800000
```

---

### 3. Refresh Access Token
**POST** `/api/auth/refresh-token`

Get a new access token using refresh token.

**Request:**
```json
{
  "refreshToken": "optional-if-in-cookies"
}
```

OR use cookies (automatic in browsers).

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Token refreshed",
  "success": true
}
```

---

### 4. Logout User
**POST** `/api/auth/logout`

Logout from one or all devices and clear cookies.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body (Optional):**
```json
{
  "deviceId": "device-uuid-123"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "User logged out successfully",
  "success": true
}
```

**Cookies Cleared:**
```
Set-Cookie: accessToken=; Max-Age=0
Set-Cookie: refreshToken=; Max-Age=0
```

---

### 5. Change Password
**POST** `/api/auth/change-password`

User changes their own password.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "oldPassword": "CurrentPassword123",
  "newPassword": "NewPassword456",
  "confirmPassword": "NewPassword456"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Password changed successfully",
  "success": true
}
```

---

### 6. Get Login History
**GET** `/api/auth/login-history/:userId`

Retrieve user's login/logout history.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `deviceId` (optional) - Filter by specific device
- `page` - Pagination (default: 1)
- `limit` - Results per page (default: 10)

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "loginHistory": [
      {
        "deviceId": "device-uuid-123",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "loginAt": "2024-02-08T10:30:00Z",
        "logoutAt": "2024-02-08T11:30:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "pages": 3
    }
  },
  "success": true
}
```

---

### 7. Get Active Devices
**GET** `/api/auth/active-devices/:userId`

List all devices user is logged in on.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "deviceId": "device-uuid-123",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "loginCount": 5,
      "lastLoginAt": "2024-02-08T10:30:00Z",
      "isActive": true
    }
  ],
  "message": "Active devices fetched successfully",
  "success": true
}
```

---

### 8. Logout from Specific Device
**POST** `/api/auth/logout-device/:userId`

Logout from a specific device only.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "deviceId": "device-uuid-123"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Logged out from device",
  "success": true
}
```

---

### 9. Get Login Attempts and Lock Status
**GET** `/api/auth/login-attempts/:userId`

Check failed login attempts and account lock status.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "failedLoginAttempts": 2,
    "lockLevel": 0,
    "lockUntil": null,
    "isPermanentlyLocked": false
  },
  "message": "Login attempts fetched",
  "success": true
}
```

---

### 10. Reset Password (Admin)
**POST** `/api/auth/reset-password`

Admin resets user password.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "newPassword": "NewPassword456"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Password reset successfully",
  "success": true
}
```

---

### 11. Unlock User Account (Admin)
**POST** `/api/auth/unlock-account`

Unlock permanently locked accounts.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "failedLoginAttempts": 0,
    "lockLevel": 0,
    "isPermanentlyLocked": false
  },
  "message": "User account unlocked",
  "success": true
}
```

---

## User Data & Access Control Endpoints

### 1. Get Current User
**GET** `/api/auth-data/me`

Get currently authenticated user information.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "username": "john.doe",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "USR001",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "organizationId": {
        "name": "Tech Company",
        "industry": "IT"
      }
    },
    "isLoggedIn": true,
    "lastLogin": "2024-02-08T10:30:00Z"
  },
  "success": true
}
```

---

### 2. Get User Profile (with Industry & Professional Level)
**GET** `/api/auth-data/profile`

Complete user profile with professional level and industry classification.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "basicInfo": {
      "userId": "USR001",
      "name": "John Doe",
      "email": "john@example.com",
      "designation": "Senior Engineer",
      "department": "IT"
    },
    "roleInfo": {
      "role": "admin",
      "professionalLevel": {
        "level": "MANAGEMENT",
        "levelCode": "L3",
        "hierarchy": 3,
        "description": "Administrator - Department/Team management"
      },
      "permissions": ["users.read", "users.write", "reports.read"]
    },
    "organizationInfo": {
      "organizationId": "507f1f77bcf86cd799439013",
      "organizationName": "Tech Company",
      "organizationType": "Enterprise",
      "industry": "IT",
      "industryCategory": "INFORMATION_TECHNOLOGY"
    },
    "branchInfo": [...],
    "reportingInfo": {
      "reportingToId": "507f1f77bcf86cd799439014",
      "reportingToName": "Manager Name",
      "reportingToDesignation": "Department Manager"
    },
    "accountStatus": {
      "isActive": true,
      "isBlocked": false,
      "canLogin": true,
      "isLoggedIn": true,
      "lastLogin": "2024-02-08T10:30:00Z"
    },
    "timestamps": {
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-02-08T10:30:00Z"
    }
  },
  "message": "User profile fetched successfully",
  "success": true
}
```

---

### 3. Get User Access Level
**GET** `/api/auth-data/access-level`

Get user's access modules and data access level.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "userId": "USR001",
    "role": "admin",
    "professionalLevel": "MANAGEMENT",
    "industryCategory": "INFORMATION_TECHNOLOGY",
    "permissions": ["users.read", "users.write", "reports.read"],
    "accessModules": {
      "PROFILE": true,
      "DASHBOARD": true,
      "REPORTS": true,
      "ANALYTICS": true,
      "EXPORT": true,
      "USER_MANAGEMENT": true,
      "AUDIT_LOG": false,
      "API_ACCESS": false
    },
    "dataAccessLevel": {
      "level": "ORGANIZATION_ACCESS",
      "canViewAllUsers": true,
      "canViewAllData": true,
      "canExportData": true,
      "canModifySystemSettings": false
    }
  },
  "message": "User access level fetched successfully",
  "success": true
}
```

---

### 4. Get Users by Professional Level
**GET** `/api/auth-data/users/level`

Filter users by professional level.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `level` - "executive", "management", "staff" (required)
- `organizationId` - Filter by organization (optional)
- `page` - Pagination (default: 1)
- `limit` - Results per page (default: 10)

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "userId": "USR001",
        "name": "John Doe",
        "designation": "Senior Engineer",
        "role": "admin",
        "organizationId": {
          "name": "Tech Company",
          "industry": "IT"
        }
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "pages": 2
    }
  },
  "message": "Users fetched by professional level",
  "success": true
}
```

---

### 5. Get Users by Industry
**GET** `/api/auth-data/users/industry`

Filter users by industry.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `industry` - Industry name (e.g., "IT", "Finance", "Healthcare") (required)
- `page` - Pagination (default: 1)
- `limit` - Results per page (default: 10)

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "userId": "USR001",
        "name": "John Doe",
        "email": "john@example.com",
        "organizationId": {
          "name": "Tech Company",
          "industry": "IT"
        }
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  },
  "message": "Users fetched by industry",
  "success": true
}
```

---

## Professional Levels

### Level Hierarchy

| Level | Code | Roles | Description |
|-------|------|-------|-------------|
| Executive | L5, L4 | enterprise_admin, super_admin | Highest authority (system-wide or enterprise-wide) |
| Management | L3 | admin | Department/Team management and oversight |
| Staff | L1 | user | Regular staff member with limited access |

---

## Industry Categories

### Supported Industries

| Category | Code | Access Level | Data Retention |
|----------|------|--------------|-----------------|
| Information Technology | IT | HIGH | 90 days |
| Finance & Banking | FIN | CRITICAL | 365 days |
| Healthcare & Medical | HC | CRITICAL | 365 days |
| Education | EDU | HIGH | 90 days |
| Manufacturing | MFG | MEDIUM | 60 days |
| Retail | RET | MEDIUM | 30 days |
| E-Commerce | ECOM | HIGH | 60 days |
| Government | GOV | CRITICAL | 365 days |
| Defense & Security | DEF | CRITICAL | 365 days |
| Legal | LEG | CRITICAL | 365 days |
| Consulting | CON | HIGH | 90 days |
| Engineering | ENG | MEDIUM | 90 days |

---

## Cookie Management

### Access Token Cookie
- **Name**: `accessToken`
- **Expiry**: 15 minutes
- **HttpOnly**: Yes (not accessible via JavaScript)
- **Secure**: Yes (HTTPS only)
- **SameSite**: Strict (prevents CSRF attacks)

### Refresh Token Cookie
- **Name**: `refreshToken`
- **Expiry**: 7 days
- **HttpOnly**: Yes
- **Secure**: Yes
- **SameSite**: Strict

---

## Account Security Features

### Failed Login Attempts
- **Attempt 1-4**: No lock
- **Attempt 5**: Lock for 60 seconds (Level 1)
- **Attempt 6**: Lock for 180 seconds (Level 2)
- **Attempt 7**: Lock for 300 seconds (Level 3)
- **Attempt 8+**: Permanent lock (requires admin unlock)

---

## Testing with cURL

### 1. Register User
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "username": "john.doe",
    "password": "SecurePassword123"
  }'
```

### 2. Login User
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john.doe",
    "password": "SecurePassword123",
    "deviceId": "device-uuid-123",
    "ipAddress": "192.168.1.1",
    "userAgent": "curl/7.68.0"
  }' \
  -c cookies.txt
```

### 3. Access Protected Route with Cookies
```bash
curl -X GET http://localhost:4000/api/auth-data/profile \
  -b cookies.txt
```

### 4. Refresh Token
```bash
curl -X POST http://localhost:4000/api/auth/refresh-token \
  -b cookies.txt
```

### 5. Logout
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "deviceId": "device-uuid-123"
  }'
```

---

## JavaScript/Fetch Example

### Login and Store Tokens
```javascript
const response = await fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Include cookies
  body: JSON.stringify({
    username: 'john.doe',
    password: 'SecurePassword123',
    deviceId: 'device-uuid-123',
    ipAddress: '192.168.1.1',
    userAgent: navigator.userAgent
  })
});

const data = await response.json();
console.log('Login successful', data);
```

### Access Protected Route
```javascript
const response = await fetch('http://localhost:4000/api/auth-data/profile', {
  method: 'GET',
  credentials: 'include' // Automatically send cookies
});

const profile = await response.json();
console.log('User profile', profile);
```

### Refresh Token
```javascript
const response = await fetch('http://localhost:4000/api/auth/refresh-token', {
  method: 'POST',
  credentials: 'include'
});

const refresh = await response.json();
console.log('Token refreshed', refresh);
```

### Logout
```javascript
const response = await fetch('http://localhost:4000/api/auth/logout', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ deviceId: 'device-uuid-123' })
});

const result = await response.json();
console.log('Logged out', result);
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Username and password are required",
  "success": false
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid username or password",
  "success": false
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "User is not allowed to login",
  "success": false
}
```

### 423 Locked
```json
{
  "statusCode": 423,
  "message": "Account is locked. Try again in 60 seconds",
  "success": false
}
```

---

## Security Best Practices

1. **HTTPS Only**: Always use HTTPS in production
2. **Secure Cookies**: HttpOnly, Secure, SameSite attributes set automatically
3. **CORS Configuration**: Update `CORS_ORIGIN` in .env for production
4. **Token Expiry**: Access tokens expire after 15 minutes
5. **Account Locking**: Automatic progressive locking after 5 failed attempts
6. **Device Tracking**: Each login tracked with device info and IP address
7. **Password Security**: Passwords hashed with bcrypt, never stored in plain text

---

## Environment Variables Required

```env
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb+srv://...
ACCESS_TOKEN_SECRET=<your-secret>
REFRESH_TOKEN_SECRET=<your-secret>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
CORS_ORIGIN=http://localhost:3000
```

---

## Summary

Your authentication system now includes:
✅ Login/Logout with session management
✅ Access & Refresh tokens in secure httpOnly cookies
✅ Device tracking and multi-device management
✅ Account security with progressive locking
✅ Professional level classification (Executive, Management, Staff)
✅ Industry-based access control
✅ Comprehensive user profile with role-based data
✅ Password management and reset functionality
✅ Login history and audit trail
