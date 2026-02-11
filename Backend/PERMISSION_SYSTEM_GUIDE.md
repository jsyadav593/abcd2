# 🔐 Permission & Role Management System

## Overview

Ye system define karta hai **kaunsi permissions har role ko hain** aur **kya kya user kar sakta hai**.

---

## 📊 Architecture

```
User 
  ↓
  └─→ Role (ek role assign)
      ↓
      └─→ Permissions (role mein ye permissions hain)
          ├─ USER_CREATE
          ├─ USER_READ
          ├─ ASSET_ASSIGN
          └─ ... etc
```

---

## 🏗️ Models

### 1. **Permission Model** (`permission.model.js`)
Ek specific action ko represent karta hai:

```javascript
{
  name: 'Create User',           // User-friendly name
  code: 'USER_CREATE',           // Unique code (used in checks)
  module: 'Users',               // Feature module
  action: 'CREATE',              // CREATE, READ, UPDATE, DELETE, ASSIGN, etc
  description: 'Can create new users',
  category: 'CREATE',            // VIEW, CREATE, MODIFY, DELETE, ADMIN
  isActive: true
}
```

### 2. **Role Model** (`role.model.js`)
Ek set of permissions ko group karta hai:

```javascript
{
  name: 'Enterprise Admin',
  code: 'ROLE_ENTERPRISE_ADMIN',
  level: 5,                      // Hierarchy: 1 (lowest) to 5 (highest)
  permissions: [                 // Permission codes ki array
    'USER_CREATE',
    'USER_READ',
    'ASSET_DELETE',
    // ...
  ],
  scope: 'SYSTEM',               // SYSTEM / ORGANIZATION / DEPARTMENT / BRANCH
  isSystemRole: true,            // System roles cannot be modified
  createdBy: userId
}
```

### 3. **Updated User Model**
User ko role assign karna:

```javascript
{
  name: 'John',
  email: 'john@example.com',
  roleId: ObjectId,              // ← Link to Role
  organizationId: ObjectId,
  departmentId: ObjectId,
  branchId: ObjectId
}
```

---

## 5️⃣ Pre-defined Roles

### Level 5: **Enterprise Admin** 
`ROLE_ENTERPRISE_ADMIN`
- ✅ Full system access
- ✅ Can manage everything
- ✅ Can manage OTHER admins

**Permissions:**
```
USER: CREATE, READ, UPDATE, DELETE, DISABLE, PERMISSIONS
ASSET: CREATE, READ, UPDATE, DELETE, ASSIGN, EXPORT
REPORT: VIEW, GENERATE, EXPORT
ORG: MANAGE, READ
DEPT: CREATE, MANAGE
AUDIT: VIEW
SETTINGS: MANAGE
```

---

### Level 4: **Super Admin**
`ROLE_SUPER_ADMIN`
- ✅ Manage users & assets in organization
- ✅ Cannot delete users
- ✅ Cannot manage settings

**Permissions:**
```
USER: CREATE, READ, UPDATE, DISABLE, PERMISSIONS
ASSET: CREATE, READ, UPDATE, ASSIGN, EXPORT
REPORT: VIEW, GENERATE, EXPORT
ORG: READ
DEPT: CREATE, MANAGE
AUDIT: VIEW
```

---

### Level 3: **Admin**
`ROLE_ADMIN`
- ✅ Manage users & assets in their department
- ✅ Cannot create other admins
- ✅ Limited to department scope

**Permissions:**
```
USER: CREATE, READ, UPDATE, DISABLE
ASSET: CREATE, READ, UPDATE, ASSIGN
REPORT: VIEW, GENERATE
ORG: READ
DEPT: MANAGE
AUDIT: VIEW
```

---

### Level 2: **Branch Admin**
`ROLE_BRANCH_ADMIN`
- ✅ View & assign assets in their branch
- ✅ Cannot create users
- ✅ Read-only for most things

**Permissions:**
```
USER: READ
ASSET: READ, ASSIGN
REPORT: VIEW
ORG: READ
```

---

### Level 1: **User**
`ROLE_USER`
- ✅ View assigned assets
- ✅ View reports
- ✅ Very limited access

**Permissions:**
```
ASSET: READ
REPORT: VIEW
```

---

## 🛣️ Routes Protection

### Methods to Protect Routes

#### **Method 1: Single Permission Check**
```javascript
router.get(
  '/users',
  verifyJWT,
  authorize('USER_READ'),  // User must have this permission
  controller
);
```

#### **Method 2: ANY Permission (OR logic)**
```javascript
router.post(
  '/users',
  verifyJWT,
  authorize('USER_CREATE', 'USER_PERMISSIONS'),  // Any ONE of these
  controller
);
```

#### **Method 3: ALL Permissions (AND logic)**
```javascript
router.patch(
  '/users/:id/disable',
  verifyJWT,
  requireAllPermissions('USER_UPDATE', 'USER_DISABLE'),  // Both required
  controller
);
```

#### **Method 4: Exact Role Check**
```javascript
router.delete(
  '/users/:id',
  verifyJWT,
  hasRole('ROLE_ENTERPRISE_ADMIN', 'ROLE_SUPER_ADMIN'),  // Only these roles
  controller
);
```

---

## 📝 Real-world Examples

### Example 1: User Creation
```javascript
// Only Enterprise Admin, Super Admin, Admin can create users
router.post(
  '/users',
  verifyJWT,
  authorize('USER_CREATE'),  // User must have USER_CREATE permission
  createUserController
);

// Direct role check
router.post(
  '/users',
  verifyJWT,
  hasRole('ROLE_ENTERPRISE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN'),
  createUserController
);
```

### Example 2: Asset Assignment (Scope-aware)
```javascript
router.post(
  '/assets/:assetId/assign',
  verifyJWT,
  authorize('ASSET_ASSIGN'),
  asyncHandler(async (req, res) => {
    const { assignToUserId } = req.body;
    
    // Enterprise admin: assign to anyone
    if (req.userRole.code === 'ROLE_ENTERPRISE_ADMIN') {
      await assignAsset(assetId, assignToUserId);
    }
    
    // Super admin: assign within organization
    else if (req.userRole.code === 'ROLE_SUPER_ADMIN') {
      const targetUser = await User.findById(assignToUserId);
      if (targetUser.organizationId !== req.user.organizationId) {
        throw new ApiError(403, 'Cannot assign to user outside your organization');
      }
      await assignAsset(assetId, assignToUserId);
    }
    
    // Admin: assign within department
    else if (req.userRole.code === 'ROLE_ADMIN') {
      const targetUser = await User.findById(assignToUserId);
      if (targetUser.departmentId !== req.user.departmentId) {
        throw new ApiError(403, 'Cannot assign to user outside your department');
      }
      await assignAsset(assetId, assignToUserId);
    }
    
    // Branch admin: assign within branch
    else if (req.userRole.code === 'ROLE_BRANCH_ADMIN') {
      const targetUser = await User.findById(assignToUserId);
      if (targetUser.branchId !== req.user.branchId) {
        throw new ApiError(403, 'Cannot assign outside your branch');
      }
      await assignAsset(assetId, assignToUserId);
    }
    
    res.json({ message: 'Asset assigned' });
  })
);
```

### Example 3: User Deletion
```javascript
// Only Enterprise Admin aur Super Admin kar sakte hain delete
router.delete(
  '/users/:userId',
  verifyJWT,
  hasRole('ROLE_ENTERPRISE_ADMIN', 'ROLE_SUPER_ADMIN'),
  deleteUserController
);
```

### Example 4: Reports
```javascript
// Everyone can VIEW reports
router.get(
  '/reports',
  verifyJWT,
  authorize('REPORT_VIEW'),
  listReportsController
);

// Only Admin and above can GENERATE
router.post(
  '/reports',
  verifyJWT,
  authorize('REPORT_GENERATE'),
  generateReportController
);
```

---

## 🚀 Implementation Steps

### Step 1: Run Seed (Initialize Permissions & Roles)
```javascript
// In your app.js or server.js initialization
import { seedPermissionsAndRoles } from './seed/permission.seed.js';

await seedPermissionsAndRoles();
```

### Step 2: Update User Model
```javascript
// In user.model.js
userSchema.add({
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  }
});
```

### Step 3: Update Routes
```javascript
// In routes
import { authorize, hasRole, requireAllPermissions } from '../middlewares/permission.middleware.js';

router.post('/users', verifyJWT, authorize('USER_CREATE'), createUser);
```

### Step 4: Test
```javascript
// Create user with Enterprise Admin role
const adminRole = await Role.findOne({ code: 'ROLE_ENTERPRISE_ADMIN' });
const admin = await User.create({
  name: 'Admin',
  email: 'admin@example.com',
  roleId: adminRole._id
});
```

---

## 📚 Utility Functions

### Check Permission Programmatically
```javascript
import { hasPermission } from '../middlewares/permission.middleware.js';

// Inside controller
const canDeleteUser = await hasPermission(req.user._id, req.user.roleId, 'USER_DELETE');

if (!canDeleteUser) {
  throw new ApiError(403, 'You cannot delete users');
}
```

### Get Role Permissions
```javascript
import { getRolePermissions } from '../middlewares/permission.middleware.js';

const permissions = await getRolePermissions(roleId);
console.log(permissions);  // ['USER_CREATE', 'USER_READ', ...]
```

---

## 🔄 Permission Checking Flow

```
Request Aaya
    ↓
verifyJWT Middleware (Is user logged in?)
    ↓
authorize Middleware (Does user have required permission?)
    ↓
1. Get user's roleId from database
    ↓
2. Fetch Role with roleId
    ↓
3. Check if required permission is in role.permissions
    ↓
NO → 403 Forbidden
    ↓
YES → req.userRole set, next() call
    ↓
Controller Logic
```

---

## 🗃️ Database Schema Changes Needed

### Add to User Model
```javascript
userSchema.add({
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
    index: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  }
});
```

---

## 📊 Permission-to-Role Matrix

| Permission | Enterprise Admin | Super Admin | Admin | Branch Admin | User |
|-----------|---------|---------|--------|----------|------|
| USER_CREATE | ✅ | ✅ | ✅ | ❌ | ❌ |
| USER_READ | ✅ | ✅ | ✅ | ✅ | ❌ |
| USER_UPDATE | ✅ | ✅ | ✅ | ❌ | ❌ |
| USER_DELETE | ✅ | ❌ | ❌ | ❌ | ❌ |
| USER_DISABLE | ✅ | ✅ | ✅ | ❌ | ❌ |
| ASSET_CREATE | ✅ | ✅ | ✅ | ❌ | ❌ |
| ASSET_READ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ASSET_UPDATE | ✅ | ✅ | ✅ | ❌ | ❌ |
| ASSET_DELETE | ✅ | ❌ | ❌ | ❌ | ❌ |
| ASSET_ASSIGN | ✅ | ✅ | ✅ | ✅ | ❌ |
| REPORT_VIEW | ✅ | ✅ | ✅ | ✅ | ✅ |
| REPORT_GENERATE | ✅ | ✅ | ✅ | ❌ | ❌ |
| SETTINGS_MANAGE | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## ⚠️ Important Notes

1. **System Roles Cannot Be Modified** - Enterprise Admin etc are locked
2. **Hierarchy Matters** - Lower level (1) user cannot create higher level (5) role
3. **Scope Enforcement** - Admin can only manage within their scope (department/branch)
4. **Audit Everything** - Log jo bhi permission-based action hua
5. **Cache Consideration** - For performance, cache user's permissions in session

---

## 🧪 Testing

```javascript
// Test: Can Enterprise Admin create user?
const admin = await User.findOne({ roleId: enterpriseAdminRole._id });
const canCreate = await hasPermission(admin._id, admin.roleId, 'USER_CREATE');
console.log(canCreate);  // true

// Test: Can Regular User delete user?
const user = await User.findOne({ roleId: userRole._id });
const canDelete = await hasPermission(user._id, user.roleId, 'USER_DELETE');
console.log(canDelete);  // false

// Test: Route Protection
// POST /api/users with regular user token → 403 Forbidden
// POST /api/users with admin token → 201 Created
```

---

## 📞 Support

Questions? Check:
1. [permission.model.js](../models/permission.model.js) - Permission schema
2. [role.model.js](../models/role.model.js) - Role schema
3. [permission.middleware.js](../middlewares/permission.middleware.js) - Permission checks
4. [permission.seed.js](../seed/permission.seed.js) - Predefined roles
5. [permission.example.routes.js](../routes/permission.example.routes.js) - Route examples
