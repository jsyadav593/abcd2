# Permission System - Testing Guide

## ✅ Setup Complete!

Your permission system is now ready. Here's how to test it:

---

## 🚀 Step 1: Start the Server

```bash
npm run dev
```

You should see:
```
🌱 Initializing permission system...
✅ Permission system initialized
Server is running at port : 4000
```

---

## 📊 Step 2: Test API Endpoints

Use **Postman**, **Insomnia**, or **curl** to test these endpoints:

### 2.1 Check System Status
```
GET http://localhost:4000/api/test/system
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "system": "INITIALIZED ✅",
    "stats": {
      "totalPermissions": 20,
      "totalRoles": 5,
      "permissionsByModule": {
        "Users": 6,
        "Assets": 6,
        "Reports": 3,
        "Organization": 2,
        "Department": 2,
        "Settings": 1,
        "Audit": 1
      }
    }
  }
}
```

---

### 2.2 Get All Roles
```
GET http://localhost:4000/api/test/roles
```

**Response shows:**
- All 5 pre-defined roles
- Role code, name, level, scope
- Permission count for each

---

### 2.3 Get Specific Role Details
```
GET http://localhost:4000/api/test/roles/ROLE_ENTERPRISE_ADMIN
```

**Response shows:**
```json
{
  "success": true,
  "data": {
    "name": "Enterprise Admin",
    "code": "ROLE_ENTERPRISE_ADMIN",
    "level": 5,
    "permissions": [
      "USER_CREATE",
      "USER_DELETE",
      "ASSET_ASSIGN",
      ...
    ]
  }
}
```

**Other roles to test:**
- `ROLE_SUPER_ADMIN` (Level 4)
- `ROLE_ADMIN` (Level 3)
- `ROLE_BRANCH_ADMIN` (Level 2)
- `ROLE_USER` (Level 1)

---

### 2.4 Get All Permissions
```
GET http://localhost:4000/api/test/permissions
```

**Response shows:**
- 20+ permissions
- Grouped by module (Users, Assets, Reports, etc.)

---

### 2.5 Create a Test User with Role

```
POST http://localhost:4000/api/test/users
Content-Type: application/json

{
  "name": "Test Admin",
  "email": "admin@test.com",
  "roleCode": "ROLE_ENTERPRISE_ADMIN",
  "organizationId": "YOUR_ORG_ID_HERE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "123...",
      "name": "Test Admin",
      "email": "admin@test.com",
      "role": "Enterprise Admin",
      "roleCode": "ROLE_ENTERPRISE_ADMIN",
      "roleLevel": 5,
      "permissions": ["USER_CREATE", "USER_DELETE", ...]
    }
  }
}
```

---

### 2.6 List All Users with Roles
```
GET http://localhost:4000/api/test/users
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "123...",
      "name": "Test Admin",
      "email": "admin@test.com",
      "role": "Enterprise Admin (Level 5)",
      "roleCode": "ROLE_ENTERPRISE_ADMIN",
      "isActive": true
    }
  ]
}
```

---

### 2.7 Check User Permissions

```
GET http://localhost:4000/api/test/users/USER_ID_HERE
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "123...",
    "userName": "Test Admin",
    "roleCode": "ROLE_ENTERPRISE_ADMIN",
    "roleName": "Enterprise Admin",
    "roleLevel": 5,
    "totalPermissions": 20,
    "permissions": ["USER_CREATE", "USER_DELETE", ...]
  }
}
```

**Check specific permission:**
```
GET http://localhost:4000/api/test/users/USER_ID_HERE?permissionCode=USER_CREATE
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "123...",
    "userName": "Test Admin",
    "roleCode": "ROLE_ENTERPRISE_ADMIN",
    "hasPermission": true,
    "checkFor": "USER_CREATE"
  }
}
```

---

## 🧪 Step 3: Test Permission Middleware

Now test that the permission middleware actually blocks/allows access:

### 3.1 Create a Protected Route (Example)

Add this to `src/routes/test.route.js`:

```javascript
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorize, hasRole } from '../middlewares/permission.middleware.js';

/**
 * PROTECTED: Only users with USER_CREATE permission
 */
router.post(
  '/protected/create-user',
  verifyJWT,
  authorize('USER_CREATE'),
  asyncHandler(async (req, res) => {
    res.json({ message: 'You have USER_CREATE permission! ✅' });
  })
);

/**
 * PROTECTED: Only Enterprise Admin
 */
router.post(
  '/protected/admin-only',
  verifyJWT,
  hasRole('ROLE_ENTERPRISE_ADMIN'),
  asyncHandler(async (req, res) => {
    res.json({ message: 'Only Enterprise Admin can access! ✅' });
  })
);

export default router;
```

### 3.2 Test Protected Routes

**Test 1: Without Token (Should fail 401)**
```bash
POST http://localhost:4000/api/test/protected/create-user
```
Response: `401 Unauthorized`

**Test 2: With Token but No Permission (Should fail 403)**
```bash
# Login as User (Level 1) first
POST http://localhost:4000/api/auth/login
{
  "email": "user@test.com",
  "password": "..."
}

# Use the token
POST http://localhost:4000/api/test/protected/create-user
Headers: Authorization: Bearer TOKEN_HERE
```
Response: `403 Forbidden - You don't have permission`

**Test 3: With Token and Permission (Should succeed 200)**
```bash
# Login as Admin (Level 3+) first
POST http://localhost:4000/api/auth/login
{
  "email": "admin@test.com",
  "password": "..."
}

# Use the token
POST http://localhost:4000/api/test/protected/create-user
Headers: Authorization: Bearer TOKEN_HERE
```
Response: `200 OK - You have USER_CREATE permission!`

---

## 🔍 Step 4: Verify Database

Check MongoDB to see if roles and permissions were created:

```javascript
// In MongoDB shell or GUI
db.roles.find({})           // Should show 5 roles
db.permissions.find({})     // Should show 20+ permissions
db.users.findOne()          // Should have roleId field
```

---

## 📋 Complete Test Flow

Follow this exact sequence:

### Test Flow A: System Initialization ✅
1. ✅ Start server → Should initialize permissions
2. ✅ GET `/api/test/system` → Status should be "INITIALIZED"
3. ✅ GET `/api/test/roles` → Should list 5 roles
4. ✅ GET `/api/test/permissions` → Should list 20+ permissions

### Test Flow B: Create Test Users ✅
1. ✅ POST `/api/test/users` with `ROLE_ENTERPRISE_ADMIN`
2. ✅ POST `/api/test/users` with `ROLE_USER`
3. ✅ GET `/api/test/users` → Should list users

### Test Flow C: Check Permissions ✅
1. ✅ GET `/api/test/users/{adminId}` → Should show all permissions
2. ✅ GET `/api/test/users/{userId}` → Should show fewer permissions
3. ✅ GET `/api/test/users/{userId}?permissionCode=USER_CREATE` → Should return false

### Test Flow D: Middleware Protection ✅
1. ✅ Access protected route WITHOUT token → 401 error
2. ✅ Access protected route WITH token (no permission) → 403 error
3. ✅ Access protected route WITH token (has permission) → 200 success

---

## 🐛 Troubleshooting

### Issue: "No roles found"
**Cause:** Seed function didn't run
**Fix:** 
1. Check server console for "Permission system initialized"
2. If not found, manually run seed:
```bash
node -e "import {seedPermissionsAndRoles} from './src/seed/permission.seed.js'; seedPermissionsAndRoles();"
```

### Issue: "User has no role assigned"
**Cause:** Created user before adding roleId to model
**Fix:** Create new test user with roleCode:
```bash
POST /api/test/users
{
  "name": "New User",
  "email": "new@test.com",
  "roleCode": "ROLE_USER",
  "organizationId": "YOUR_ORG_ID"
}
```

### Issue: Permission middleware not working
**Cause:** Route doesn't have middleware properly set
**Fix:** Ensure route has both:
1. `verifyJWT` (Must come first!)
2. `authorize()` or `hasRole()` (Must come second)

### Issue: 403 Forbidden for authorized user
**Cause:** User's role isn't in database or roleId not set
**Fix:** 
1. Verify user has roleId: `GET /api/test/users/{userId}`
2. Verify role exists: `GET /api/test/roles/{roleCode}`
3. Recreate user if needed

---

## 📊 Permission System Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/test/system` | GET | Check if system initialized |
| `/api/test/roles` | GET | List all roles |
| `/api/test/roles/{code}` | GET | Get role details |
| `/api/test/permissions` | GET | List all permissions |
| `/api/test/users` | POST | Create test user |
| `/api/test/users` | GET | List all users |
| `/api/test/users/{id}` | GET | Check user permissions |
| `/api/test/reset` | POST | Delete test users |

---

## ✨ Success Indicators

You'll know everything is working when:

- ✅ Server logs "Permission system initialized"
- ✅ `/api/test/system` returns stats with 5 roles and 20+ permissions
- ✅ Can create users with different roles
- ✅ Different roles show different permission counts
- ✅ Protected routes return 403 for users without permission
- ✅ Protected routes return 200 for users with permission

---

## 🎯 Next Steps

Once testing is complete:

1. **Update your existing routes** with permission middleware:
   ```javascript
   router.post('/users', verifyJWT, authorize('USER_CREATE'), createUser);
   router.delete('/users/:id', verifyJWT, hasRole('ROLE_ENTERPRISE_ADMIN'), deleteUser);
   ```

2. **Update your controllers** to add scope-based logic (see `permission.example.controller.js`)

3. **Implement audit logging** (next phase - track who did what)

4. **Add 2-factor authentication** (later phase)

---

## 💡 Pro Tips

- Always test with `@test.com` emails - easy to reset with `/api/test/reset`
- Use Postman Collections to automate testing
- Keep test tokens handy for repeated testing
- Check database directly if API seems wrong
- Delete test users before production deployment

---

**You're all set! Start testing now! 🚀**
