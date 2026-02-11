# Permission System - Testing with curl Commands

## 🚀 Quick Test Commands

Copy-paste these commands in your terminal to test the permission system:

---

## 1️⃣ Check System Status

```bash
curl http://localhost:4000/api/test/system
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Permission system test successful ✅",
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
        "Audit": 1,
        "Settings": 1
      },
      "roles": [
        {
          "name": "Enterprise Admin",
          "code": "ROLE_ENTERPRISE_ADMIN",
          "level": 5,
          "scope": "SYSTEM",
          "permissionCount": 20
        },
        {
          "name": "Super Admin",
          "code": "ROLE_SUPER_ADMIN",
          "level": 4,
          "scope": "ORGANIZATION",
          "permissionCount": 18
        },
        {
          "name": "Admin",
          "code": "ROLE_ADMIN",
          "level": 3,
          "scope": "DEPARTMENT",
          "permissionCount": 13
        },
        {
          "name": "Branch Admin",
          "code": "ROLE_BRANCH_ADMIN",
          "level": 2,
          "scope": "BRANCH",
          "permissionCount": 5
        },
        {
          "name": "User",
          "code": "ROLE_USER",
          "level": 1,
          "scope": "BRANCH",
          "permissionCount": 2
        }
      ]
    }
  }
}
```

---

## 2️⃣ List All Roles

```bash
curl http://localhost:4000/api/test/roles
```

Shows all 5 roles with permission count

---

## 3️⃣ Get Enterprise Admin Role Details

```bash
curl http://localhost:4000/api/test/roles/ROLE_ENTERPRISE_ADMIN
```

**Try these too:**
```bash
curl http://localhost:4000/api/test/roles/ROLE_SUPER_ADMIN
curl http://localhost:4000/api/test/roles/ROLE_ADMIN
curl http://localhost:4000/api/test/roles/ROLE_BRANCH_ADMIN
curl http://localhost:4000/api/test/roles/ROLE_USER
```

---

## 4️⃣ List All Permissions

```bash
curl http://localhost:4000/api/test/permissions
```

Shows 20+ permissions grouped by module

---

## 5️⃣ Create Enterprise Admin Test User

```bash
# First, get an organization ID from your database
# Example organizationId: "507f1f77bcf86cd799439011"

curl -X POST http://localhost:4000/api/test/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@test.com",
    "roleCode": "ROLE_ENTERPRISE_ADMIN",
    "organizationId": "507f1f77bcf86cd799439011"
  }'
```

**Response will include user ID - save it for next steps**

---

## 6️⃣ Create Regular User Test User

```bash
curl -X POST http://localhost:4000/api/test/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Regular User",
    "email": "user@test.com",
    "roleCode": "ROLE_USER",
    "organizationId": "507f1f77bcf86cd799439011"
  }'
```

---

## 7️⃣ List All Users

```bash
curl http://localhost:4000/api/test/users
```

Shows users with their assigned roles

---

## 8️⃣ Check Admin User Permissions

```bash
# Replace ADMIN_USER_ID with actual user ID from step 5
curl "http://localhost:4000/api/test/users/ADMIN_USER_ID"
```

**Expected: Should show ~20 permissions for enterprise admin**

---

## 9️⃣ Check Regular User Permissions

```bash
# Replace USER_ID with actual user ID from step 6
curl "http://localhost:4000/api/test/users/USER_ID"
```

**Expected: Should show ~2 permissions for regular user**

---

## 🔟 Check Specific Permission

```bash
# Check if admin user has USER_CREATE permission
curl "http://localhost:4000/api/test/users/ADMIN_USER_ID?permissionCode=USER_CREATE"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "userId": "...",
    "userName": "Admin User",
    "roleCode": "ROLE_ENTERPRISE_ADMIN",
    "roleName": "Enterprise Admin",
    "roleLevel": 5,
    "hasPermission": true,
    "checkFor": "USER_CREATE"
  }
}
```

---

## 1️⃣1️⃣ Check Regular User Permission (Should Fail)

```bash
# Check if regular user has USER_CREATE permission (should be false)
curl "http://localhost:4000/api/test/users/USER_ID?permissionCode=USER_CREATE"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "hasPermission": false,
    "checkFor": "USER_CREATE"
  }
}
```

---

## 1️⃣2️⃣ Clean Up Test Users

```bash
curl -X POST http://localhost:4000/api/test/reset
```

Deletes all users with email ending in `@test.com`

---

## 📊 Complete Test Sequence (Copy-Paste All)

```bash
# 1. Check system
echo "=== CHECKING SYSTEM ===" && \
curl http://localhost:4000/api/test/system && \
echo -e "\n\n"

# 2. List roles
echo "=== LISTING ROLES ===" && \
curl http://localhost:4000/api/test/roles && \
echo -e "\n\n"

# 3. Get permissions
echo "=== LISTING PERMISSIONS ===" && \
curl http://localhost:4000/api/test/permissions && \
echo -e "\n\n"

# 4. Create admin user
echo "=== CREATING ADMIN USER ===" && \
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/test/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Admin",
    "email": "admin@test.com",
    "roleCode": "ROLE_ENTERPRISE_ADMIN",
    "organizationId": "507f1f77bcf86cd799439011"
  }') && \
echo "$ADMIN_RESPONSE" && \
ADMIN_ID=$(echo "$ADMIN_RESPONSE" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4) && \
echo "Admin ID: $ADMIN_ID" && \
echo -e "\n\n"

# 5. Create regular user
echo "=== CREATING REGULAR USER ===" && \
USER_RESPONSE=$(curl -s -X POST http://localhost:4000/api/test/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "user@test.com",
    "roleCode": "ROLE_USER",
    "organizationId": "507f1f77bcf86cd799439011"
  }') && \
echo "$USER_RESPONSE" && \
USER_ID=$(echo "$USER_RESPONSE" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4) && \
echo "User ID: $USER_ID" && \
echo -e "\n\n"

# 6. List all users
echo "=== LISTING ALL USERS ===" && \
curl http://localhost:4000/api/test/users && \
echo -e "\n\n"

# 7. Check admin permissions
echo "=== CHECKING ADMIN PERMISSIONS ===" && \
curl "http://localhost:4000/api/test/users/$ADMIN_ID" && \
echo -e "\n\n"

# 8. Check user permissions
echo "=== CHECKING USER PERMISSIONS ===" && \
curl "http://localhost:4000/api/test/users/$USER_ID" && \
echo -e "\n\n"

# 9. Check specific permission (admin should have it)
echo "=== ADMIN HAS USER_CREATE? ===" && \
curl "http://localhost:4000/api/test/users/$ADMIN_ID?permissionCode=USER_CREATE" && \
echo -e "\n\n"

# 10. Check specific permission (user should NOT have it)
echo "=== USER HAS USER_CREATE? ===" && \
curl "http://localhost:4000/api/test/users/$USER_ID?permissionCode=USER_CREATE" && \
echo -e "\n\n"

# 11. Clean up
echo "=== CLEANING UP TEST USERS ===" && \
curl -X POST http://localhost:4000/api/test/reset
```

---

## 🔍 Real-World Testing (With Authentication)

After you integrate authentication with permission system:

### Test 1: Login and Get Token

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "your_password"
  }'
```

**Save the token from response:**
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Test 2: Access Protected Route (With Permission)

```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "New User",
    "email": "newuser@test.com"
  }'
```

**Expected: 201 Created (because admin has USER_CREATE permission)**

### Test 3: Try to Delete User (Should Fail)

```bash
curl -X DELETE http://localhost:4000/api/users/SOME_USER_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected: 403 Forbidden (because USER_DELETE is only for enterprise admin)**

---

## 🐛 Debugging Tips

### See detailed error messages

```bash
curl -s -w "\nStatus: %{http_code}\n" http://localhost:4000/api/test/system
```

### Format JSON output nicely

```bash
curl http://localhost:4000/api/test/roles | jq '.'
```

(Requires `jq` tool: `npm install -g jq`)

### Check response headers

```bash
curl -i http://localhost:4000/api/test/system
```

### Save response to file

```bash
curl http://localhost:4000/api/test/permissions > permissions.json
```

---

## ✅ Success Checklist

- [ ] Step 1 returns `"system": "INITIALIZED ✅"`
- [ ] Step 2 lists 5 roles
- [ ] Step 4 returns 20+ permissions
- [ ] Step 5 creates admin user successfully
- [ ] Step 6 creates regular user successfully
- [ ] Step 8 shows admin with ~20 permissions
- [ ] Step 9 shows user with ~2 permissions
- [ ] Step 10 returns `"hasPermission": true`
- [ ] Step 11 returns `"hasPermission": false`

If all pass ✅ - Your permission system is working perfectly!

---

## 📝 For Saving: One Complete Test Command

Paste this into a file named `test-permissions.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:4000"
ORG_ID="507f1f77bcf86cd799439011"  # Replace with your org ID

echo "🧪 Testing Permission System"
echo "=============================="

# 1. System check
echo "1. Checking system status..."
curl -s "$BASE_URL/api/test/system" | jq '.data.system'

# 2. List roles
echo "2. Listing roles..."
curl -s "$BASE_URL/api/test/roles" | jq '.data | length'

# 3. Create users
echo "3. Creating test admin user..."
ADMIN=$(curl -s -X POST "$BASE_URL/api/test/users" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Admin\",\"email\":\"admin@test.com\",\"roleCode\":\"ROLE_ENTERPRISE_ADMIN\",\"organizationId\":\"$ORG_ID\"}" | jq '.data.user')
echo "$ADMIN" | jq '.name, .roleCode'

# 4. List users
echo "4. Listing all users..."
curl -s "$BASE_URL/api/test/users" | jq '.data | length'

echo ""
echo "✅ Test complete!"
```

Run with: `bash test-permissions.sh`

---

## 🎯 Next: Protect Your Actual Routes

Once testing is working, update your routes:

```javascript
import { authorize } from '../middlewares/permission.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

// Before
router.post('/users', createUser);

// After
router.post('/users', verifyJWT, authorize('USER_CREATE'), createUser);
```

Happy testing! 🚀
