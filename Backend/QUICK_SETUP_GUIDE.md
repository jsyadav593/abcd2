# 🚀 Quick Implementation Guide

## ⚡ 5-Minute Setup

Ye guide mein sirf essential changes hain. Follow karte jao:

---

## Step 1️⃣: Add Models to Database

Already created files:
- ✅ `src/models/permission.model.js`
- ✅ `src/models/role.model.js`
- ✅ `src/middlewares/permission.middleware.js`
- ✅ `src/seed/permission.seed.js`

---

## Step 2️⃣: Update User Model

**File:** `src/models/user.model.js`

Add these fields to userSchema:

```javascript
// Add roleId field (replace the old "role" field logic)
roleId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Role',
  required: true
},

// Keep existing department but also add departmentId
departmentId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Department'
},

// Update branchId if needed (already exists as array)
branchId: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School', // or 'Branch'
  },
]
```

**Note:** Can keep the existing `role` field for backward compatibility, but primarily use `roleId` system.

---

## Step 3️⃣: Initialize Permissions & Roles

**File:** `src/app.js` or `src/server.js`

Add this on app startup:

```javascript
import { seedPermissionsAndRoles } from './seed/permission.seed.js';

// In your main startup function
async function startServer() {
  try {
    // ... existing code ...

    // Run this ONCE to initialize permissions and roles
    await seedPermissionsAndRoles();
    
    console.log('✅ Permission system initialized');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
}

startServer();
```

---

## Step 4️⃣: Protect Routes with Permissions

**File:** `src/routes/user.route.js` (Example)

```javascript
import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorize, hasRole, requireAllPermissions } from '../middlewares/permission.middleware.js';
import {
  createUser,
  listUsers,
  updateUser,
  deleteUser,
  disableUser
} from '../controllers/user.controller.js';

const router = Router();

// Only users with USER_CREATE permission
router.post(
  '/users',
  verifyJWT,
  authorize('USER_CREATE'),
  createUser
);

// View users (most roles have this)
router.get(
  '/users',
  verifyJWT,
  authorize('USER_READ'),
  listUsers
);

// Update user
router.patch(
  '/users/:userId',
  verifyJWT,
  authorize('USER_UPDATE'),
  updateUser
);

// Delete user (only Enterprise & Super Admin)
router.delete(
  '/users/:userId',
  verifyJWT,
  hasRole('ROLE_ENTERPRISE_ADMIN', 'ROLE_SUPER_ADMIN'),
  deleteUser
);

// Disable user
router.post(
  '/users/:userId/disable',
  verifyJWT,
  authorize('USER_DISABLE'),
  disableUser
);

export default router;
```

---

## Step 5️⃣: Update Controllers

**File:** `src/controllers/user.controller.js` (Example)

### Before (Old):
```javascript
export const createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  res.json(user);
});
```

### After (With Permission Checks):
```javascript
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, roleId, organizationId } = req.body;

  // Permission already checked by middleware
  // But add hierarchy check
  const targetRole = await Role.findById(roleId);
  const userRole = await Role.findById(req.user.roleId);

  if (targetRole.level > userRole.level) {
    throw new ApiError(403, 'Cannot create user with higher role level');
  }

  const user = await User.create({
    name,
    email,
    roleId,
    organizationId,
    createdBy: req.user._id
  });

  return res
    .status(201)
    .json(new ApiResponse(201, user, 'User created'));
});
```

---

## Step 6️⃣: Test It!

### Test 1: Create Roles
```bash
# POST http://localhost:5000/api/auth/test-permissions

# This should create 5 default roles:
# - ROLE_ENTERPRISE_ADMIN
# - ROLE_SUPER_ADMIN
# - ROLE_ADMIN
# - ROLE_BRANCH_ADMIN
# - ROLE_USER
```

### Test 2: Create Test Users

```javascript
// Create Enterprise Admin
const adminRole = await Role.findOne({ code: 'ROLE_ENTERPRISE_ADMIN' });
const admin = await User.create({
  name: 'Admin',
  email: 'admin@test.com',
  roleId: adminRole._id,
  organizationId: orgId
});

// Create Regular User
const userRole = await Role.findOne({ code: 'ROLE_USER' });
const user = await User.create({
  name: 'John',
  email: 'john@test.com',
  roleId: userRole._id,
  organizationId: orgId
});
```

### Test 3: Check Permissions

```bash
# Login as admin (has USER_CREATE)
POST /api/auth/login
{email: "admin@test.com", password: "..."}

# Try to create user
POST /api/users
{name: "New User", email: "new@test.com", roleId: "..."}
# ✅ Result: 201 Created

# Login as regular user (no USER_CREATE)
POST /api/auth/login
{email: "john@test.com", password: "..."}

# Try to create user
POST /api/users
{name: "Another User", email: "another@test.com"}
# ❌ Result: 403 Forbidden - "You don't have permission"
```

---

## 📊 Quick Reference: What Permission/Role For What?

### User Management
| Action | Permission | Who Can Do |
|--------|-----------|-----------|
| Create User | `USER_CREATE` | Enterprise Admin, Super Admin, Admin |
| View Users | `USER_READ` | All (but scope varies) |
| Edit User | `USER_UPDATE` | Enterprise Admin, Super Admin, Admin |
| Delete User | `USER_DELETE` | Enterprise Admin only |
| Disable User | `USER_DISABLE` | Enterprise Admin, Super Admin, Admin |

### Asset Management
| Action | Permission | Who Can Do |
|--------|-----------|-----------|
| Create Asset | `ASSET_CREATE` | Enterprise Admin, Super Admin, Admin |
| View Assets | `ASSET_READ` | All |
| Edit Asset | `ASSET_UPDATE` | Enterprise Admin, Super Admin, Admin |
| Delete Asset | `ASSET_DELETE` | Enterprise Admin only |
| Assign Asset | `ASSET_ASSIGN` | Enterprise Admin, Super Admin, Admin, Branch Admin |

### Reports
| Action | Permission | Who Can Do |
|--------|-----------|-----------|
| View Reports | `REPORT_VIEW` | All |
| Generate Reports | `REPORT_GENERATE` | Enterprise Admin, Super Admin, Admin |

### Settings
| Action | Permission | Who Can Do |
|--------|-----------|-----------|
| Manage Settings | `SETTINGS_MANAGE` | Enterprise Admin only |

---

## 🔍 How to Check If Something Is Working

### Check 1: Are permissions in database?
```javascript
// In MongoDB or via API
db.permissions.find({})
// Should show 20+ permissions
```

### Check 2: Are roles created?
```javascript
db.roles.find({})
// Should show 5 default roles
```

### Check 3: Does 403 error appear?
```bash
# Try to access protected route WITHOUT permission
# Should get: "You don't have permission to perform this action"
```

---

## ❌ Common Issues & Fixes

### Issue 1: "No role assigned to user"
**Cause:** User doesn't have `roleId` field set
**Fix:** Make sure user has `roleId` when created:
```javascript
const user = await User.create({
  ...data,
  roleId: userRole._id  // ← Important!
});
```

### Issue 2: "Cannot find module permission.middleware"
**Cause:** File not created properly
**Fix:** Verify file exists at:
```
src/middlewares/permission.middleware.js
```

### Issue 3: Permission middleware not working
**Cause:** `verify JWT` middleware not setting `req.user`
**Fix:** Make sure you call `verifyJWT` BEFORE permission middleware:
```javascript
router.post('/users', 
  verifyJWT,              // ← First
  authorize('USER_CREATE') // ← Then
)
```

### Issue 4: All users getting access
**Cause:** Middleware not actually checking
**Fix:** Make sure you're using ONE of:
- `authorize('PERMISSION_CODE')`
- `hasRole('ROLE_CODE')`
- `requireAllPermissions('PERM1', 'PERM2')`

---

## 🎯 Implementation Checklist

- [ ] Created `permission.model.js`
- [ ] Created `role.model.js`
- [ ] Created `permission.middleware.js`
- [ ] Created `permission.seed.js`
- [ ] Added `roleId` to User model
- [ ] Updated `app.js` to call `seedPermissionsAndRoles()`
- [ ] Updated `user.route.js` with permission checks
- [ ] Updated `user.controller.js` with scope logic
- [ ] Tested creating user with admin role ✅
- [ ] Tested creating user with regular user role (should fail) ✅
- [ ] Tested listing users (scope-aware) ✅
- [ ] Tested asset assignment (scope-aware) ✅

---

## 🚨 Important Reminders

1. **Always call `verifyJWT` FIRST** - So `req.user` is available
2. **Order matters** - `verifyJWT` → `authorize` → controller
3. **Scope enforcement** - Check that users can only manage within their scope
4. **Hierarchy protection** - Lower level user cannot create higher level role
5. **Log everything** - For audit trail (next phase)

---

## 📞 Need More Details?

- Full guide: [PERMISSION_SYSTEM_GUIDE.md](PERMISSION_SYSTEM_GUIDE.md)
- Example controller: [src/controllers/permission.example.controller.js](src/controllers/permission.example.controller.js)
- Example routes: [src/routes/permission.example.routes.js](src/routes/permission.example.routes.js)
- View seed data: [src/seed/permission.seed.js](src/seed/permission.seed.js)

---

## ✅ Done!

Agar ye steps follow kar lo, toh permission system fully functional ho jayegi!

नीचे एक example दिया है कि real world में कैसे काम करेगा:

```
User1 (Enterprise Admin) → Logs in → Gets token
  ├─ POST /api/users → ✅ 201 (हिम्मत कर सकता है)
  ├─ DELETE /api/users/123 → ✅ 200 (हिम्मत कर सकता है)
  └─ POST /api/settings → ✅ 200 (हिम्मत कर सकता है)

User2 (Regular User) → Logs in → Gets token
  ├─ POST /api/users → ❌ 403 (हिम्मत नहीं)
  ├─ DELETE /api/users/123 → ❌ 403 (हिम्मत नहीं)
  └─ GET /api/users → ✅ 200 (सिर्फ अपने आप को देख सकता है)
```

Bas यही तो है! 🎉
