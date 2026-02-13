# Password Reset System - Complete Implementation

## Overview
A real-world password reset system following security best practices with token-based validation, expiry, and audit logging.

## Architecture

### 1. Models
- **PasswordReset Model** (`passwordReset.model.js`)
  - Stores reset tokens (hashed in DB for security)
  - Tracks token expiry (1 hour default)
  - One-time use enforcement
  - IP address and user agent logging
  - Auto-cleanup via MongoDB TTL index

### 2. Controllers
- **Password Controller** (`password.controller.js`)
  - `requestPasswordReset()` - User requests reset via username
  - `verifyResetToken()` - Verify token validity (optional UI check)
  - `resetPassword()` - Complete password reset with new password
  - `adminResetPassword()` - Admin force-reset with temporary password
  - `getPasswordResetStatus()` - Check pending reset status

### 3. Routes
- **Password Routes** (`password.route.js`)
  - `POST /api/password/request-reset` - Request reset
  - `POST /api/password/verify-token` - Verify token
  - `POST /api/password/reset` - Reset password
  - `GET /api/password/status` - Check status
  - `POST /api/password/:userId/admin-reset` - Admin reset (requires auth when enabled)

## Security Features

### ✅ Implemented

1. **Token Hashing**
   - Tokens are hashed with SHA256 before DB storage
   - Only plaintext token shown to user once during creation
   
2. **One-Time Use**
   - Tokens marked as `isUsed` after password reset
   - Expired tokens auto-deleted via TTL index
   
3. **Expiry Management**
   - Default 1-hour expiration
   - Auto-cleanup via MongoDB TTL
   - Checks on every verification/reset attempt
   
4. **No Information Leakage**
   - Same response whether username exists or not
   - Prevents account enumeration attacks
   
5. **Audit Trail**
   - All reset requests logged to Audit collection
   - IP address and user agent tracked
   - Admin actions tracked with admin user ID
   
6. **Password Validation**
   - Minimum 8 characters required
   - Bcrypt hashing on update (via UserLogin pre-hook)
   - Passwords must match (confirmPassword validation)
   
7. **User Status Checks**
   - Verifies `canLogin` is true before allowing reset
   - Verifies user still exists
   - Prevents disabled users from resetting

## Flow Diagrams

### User-Initiated Password Reset (3 steps)

```
Step 1: Request Reset
User enters username → endpoint checks if user exists → generates token → returns token
POST /api/password/request-reset
Input: { username }
Output: { resetToken, expiresIn: "1 hour" }

Step 2: Verify Token (Optional)
User submits reset token → endpoint verifies validity → returns confirmation
POST /api/password/verify-token
Input: { resetToken }
Output: { valid: true, username, expiresAt }

Step 3: Reset Password
User submits token + new password → endpoint hashes password → saves to DB → marks token as used
POST /api/password/reset
Input: { resetToken, newPassword, confirmPassword }
Output: { username, message: "Password reset successfully" }
```

### Admin-Forced Reset (1 step)

```
Admin initiates reset for user → generates temporary password → returns to admin
POST /api/password/:userId/admin-reset
Output: { username, tempPassword, message: "Share with user securely" }
```

## Database Schema

### PasswordReset Collection

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),                    // User being reset
  userLogin: ObjectId (ref: UserLogin),          // Login credentials being reset
  token: String (hashed),                         // SHA256 hashed token (indexed)
  expiresAt: Date,                               // Expires in 1 hour (TTL index)
  isUsed: Boolean,                               // false = unused, true = consumed
  usedAt: Date,                                  // When token was used
  ipAddress: String,                             // IP of reset requester
  userAgent: String,                             // Browser info
  reason: String (enum),                         // "user_request" | "admin_forced_reset"
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Integration

### Available Functions (userApi.js)

```javascript
// Request password reset
const { data: resetData } = await requestPasswordReset(username);
// Returns: { resetToken, expiresIn }

// Verify token (optional)
const { data: verifyData } = await verifyResetToken(resetToken);
// Returns: { valid, username, expiresAt }

// Reset password
const { data: resetResult } = await resetPassword(resetToken, newPassword, confirmPassword);
// Returns: { username }

// Check status
const { data: status } = await getPasswordResetStatus(username);
// Returns: { hasPendingReset, expiresAt }
```

### UI Flow Recommendation

```
1. Login Page (Future)
   ├─ "Forgot Password?" link
   └─ Opens Reset Modal

2. Enter Username Modal
   ├─ User enters username
   ├─ Calls requestPasswordReset()
   ├─ Shows reset token (copy to clipboard)
   └─ Move to next step

3. Verify & Reset Password Modal
   ├─ User pastes reset token
   ├─ User enters new password
   ├─ Calls resetPassword()
   ├─ Shows success message
   └─ Redirect to login
```

## Environment Variables

```env
PASSWORD_LENGTH=8              # Length of auto-generated admin reset passwords
ACCESS_TOKEN_EXPIRY=15m        # JWT expiry (when login is enabled)
REFRESH_TOKEN_EXPIRY=10d       # Refresh token expiry
```

## Real-World Enhancements (Roadmap)

- [ ] Email notifications for reset requests
- [ ] SMS notifications for temporary passwords
- [ ] Rate limiting on reset requests (e.g., max 5 per hour)
- [ ] CAPTCHA for reset requests
- [ ] Login IP history display
- [ ] Security questions as secondary verification
- [ ] WebAuthn / Biometric support
- [ ] Passwordless authentication with magic links

## Testing Scenarios

### Scenario 1: Happy Path
```
1. POST /api/password/request-reset { username: "john.doe" }
   → Returns resetToken (e.g., "a1b2c3d4...")
   
2. POST /api/password/verify-token { resetToken: "a1b2c3d4..." }
   → Returns { valid: true, username: "john.doe" }
   
3. POST /api/password/reset 
   { resetToken: "a1b2c3d4...", newPassword: "NewPass123!", confirmPassword: "NewPass123!" }
   → Returns { username: "john.doe" }
   
4. User can now login with new password
```

### Scenario 2: Invalid/Expired Token
```
1. Token expired (> 1 hour)
   → 400 "Reset token has expired. Request a new one."

2. Token already used
   → 400 "Invalid or expired reset token"
   
3. Non-existent token
   → 400 "Invalid or expired reset token"
```

### Scenario 3: Mismatched Passwords
```
1. newPassword "NewPass123!" !== confirmPassword "NewPass456!"
   → 400 "Passwords do not match"
```

## Security Considerations

- ✅ Never expose why reset failed (prevents account enumeration)
- ✅ Tokens are hashed before storage
- ✅ Single-use tokens
- ✅ Auto-expiry via TTL
- ✅ IP address logging for suspicious activity
- ✅ Bcrypt hashing for passwords (10 rounds)
- ✅ Audit trail for compliance
- ⚠️ TODO: Email/SMS delivery channel (implement when needed)
- ⚠️ TODO: Rate limiting (e.g., max 5 requests/hour per username)
- ⚠️ TODO: Login with auth when ready

## Enable Authentication

When login is fully implemented:

1. Uncomment `protect` middleware in password routes:
```javascript
router.post("/:userId/admin-reset", protect, adminResetPassword);
```

2. Add rate limiting middleware:
```javascript
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // max 5 reset requests per hour
  skipSuccessfulRequests: false,
});

router.post("/request-reset", resetLimiter, ...)
```

## Monitoring & Logging

Check logs for suspicious activity:
```javascript
// Track failed attempts in logs
logger.warn("Password reset attempt for non-existent username", { username, ipAddress });

// Track successful resets
logger.info("Password reset completed", { userId, ipAddress });

// Check audit trail
db.audits.find({ action: "PASSWORD_RESET_REQUESTED" })
```

## Links
- Frontend API: `Frentend/src/services/userApi.js` (requestPasswordReset, resetPassword, etc.)
- Backend Model: `Backend/src/models/passwordReset.model.js`
- Backend Controller: `Backend/src/controllers/password.controller.js`
- Backend Routes: `Backend/src/routes/password.route.js`
