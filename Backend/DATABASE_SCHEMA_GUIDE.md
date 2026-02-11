# Database Schema Changes - Visual Guide
## Asset Management ERP

---

## 📊 **Current Architecture**

```
┌─────────────────────────────────────────┐
│         ORGANIZATION (Company)          │
│─────────────────────────────────────────│
│ • name, code, address                   │
│ • contactEmail, contactPhone            │
│ • isActive, createdBy                   │
└──────────────────┬──────────────────────┘
                   │ 1:Many
                   ▼
┌─────────────────────────────────────────┐
│      SCHOOL/BRANCH (Location)           │
│─────────────────────────────────────────│
│ • name, code, address                   │
│ • organizationId                        │
│ • isActive, createdBy                   │
└──────────────────┬──────────────────────┘
                   │ 1:Many
                   ▼
┌─────────────────────────────────────────┐
│            USER (Employee)              │
│─────────────────────────────────────────│
│ • userId, name, email                   │
│ • designation, department (STRING)      │
│ • role (enum)                           │
│ • permissions (String array)            │
│ • reportingTo, branchId                 │
│ • isActive, isBlocked, canLogin         │
│ • createdBy                             │
└──────────────┬──────────────────────┬──┘
               │                      │
               ▼ 1:1                  ▼ 1:Many
┌──────────────────────────┐   ┌────────────────┐
│  USERLOGIN (Auth)        │   │  AuditLog      │
│──────────────────────────│   │(NEW - NEEDED)  │
│ • username, password     │   └────────────────┘
│ • refreshToken           │
│ • failedLoginAttempts    │
│ • loggedInDevices        │
│ • lastLogin, isLoggedIn  │
└──────────────────────────┘
```

---

## 📊 **Proposed Enhanced Architecture**

```
┌────────────────────────────────────────────────┐
│   ORGANIZATION (Enhanced)                      │
│────────────────────────────────────────────────│
│ • name, code, address                          │
│ • type: 'Corporation', 'NonProfit'    [NEW]   │
│ • industry: 'Manufacturing', 'Retail' [NEW]   │
│ • maxUsers, assetLimit                [NEW]   │
│ • features: [String]                  [NEW]   │
│ • contactEmail, contactPhone                   │
│ • isActive, createdBy, timestamps              │
└──────────────────┬─────────────────────────────┘
                   │ 1:Many
        ┌──────────┼──────────┐
        ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────────────┐
    │BRANCH  │ │DEPT    │ │ROLE            │
    │(Loc)   │ │(NEW)   │ │(NEW - GRANULAR)│
    └────────┘ └────────┘ └────────────────┘
        │          │            │
        │          │            │ 1:Many has
        │          ▼            ▼
        │      ┌─────────────────────────┐
        │      │ PERMISSIONS (NEW)       │
        │      │─────────────────────────│
        │      │ • resource: 'assets'    │
        │      │ • action: 'create'      │
        │      │ • conditions: {...}     │
        │      └─────────────────────────┘
        │
        └──────────────┬──────────────────┐
                       ▼                  ▼
         ┌──────────────────────┐  ┌────────────────┐
         │      USER (v2)       │  │ DEPARTMENT     │
         │──────────────────────│  │ (NEW)          │
         │ • userId, name       │  │────────────────│
         │ • email              │  │ • name, code   │
         │ • designation        │  │ • manager      │
         │ • departmentId [NEW] │  │ • costCenter   │
         │ • roleId [NEW]       │  │ • org, branch  │
         │ • roles: [] [NEW]    │  │ • isActive     │
         │ • reportingTo        │  └────────────────┘
         │ • branchId           │
         │ • permissions [OLD]  │
         │ • isActive, isBlocked│
         │ • canLogin, createdBy│
         └──────────────────────┘
                     │
        ┌────────────┼────────────┤
        ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────────┐
    │USERLOGIN │ │SESSIONLOG│ │IP WHITELIST  │
    │(Auth)    │ │(NEW)     │ │(NEW)         │
    │v2        │ │          │ │              │
    └──────────┘ └──────────┘ └──────────────┘
        │
        └──────────────────┬─────────────────┐
                           ▼                 ▼
                    ┌────────────┐  ┌──────────────┐
                    │AUDITLOG    │  │APIKEY        │
                    │(NEW)       │  │(NEW)         │
                    │            │  │              │
                    └────────────┘  └──────────────┘
```

---

## 📋 **Detailed Schema Changes**

### **1. ORGANIZATION Model (Update)**
```javascript
{
  _id: ObjectId,
  name: String (required),
  code: String (unique, optional),
  address: String,
  
  // NEW FIELDS FOR ERP
  type: {
    type: String,
    enum: ['Corporation', 'NonProfit', 'Government', 'Startup', 'Retail'],
    default: 'Corporation'
  },
  industry: {
    type: String,
    enum: ['Manufacturing', 'IT', 'Finance', 'Healthcare', 'Retail', 'E-Commerce', 'Education'],
    default: 'General'
  },
  maxUsers: { type: Number, default: 100 }, // Subscription based
  assetLimit: { type: Number, default: 1000 },
  features: [String], // ['asset_management', 'reports', 'api_access']
  
  contactEmail: String,
  contactPhone: String,
  isActive: { type: Boolean, default: true },
  createdBy: ObjectId (ref: User),
  
  // Audit
  createdAt: Date,
  updatedAt: Date
}
```

---

### **2. DEPARTMENT Model (NEW)**
```javascript
{
  _id: ObjectId,
  name: String (required, unique within org), // 'IT', 'Finance', 'Operations'
  code: String, // 'DEPT-001'
  description: String,
  
  // References
  organizationId: ObjectId (ref: Organization, required),
  branchId: ObjectId (ref: Branch, optional), // Department specific to one branch or org-wide
  manager: ObjectId (ref: User), // Department head
  
  // Financial
  costCenter: String, // For asset tracking
  budget: Number, // Annual budget
  
  // Status
  isActive: { type: Boolean, default: true },
  
  // Audit
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

---

### **3. ROLE Model (NEW - Replaces hardcoded roles)**
```javascript
{
  _id: ObjectId,
  name: String (required), // 'Asset Manager', 'Finance Head', 'Department Head'
  code: String (unique), // 'ROLE_ASSET_MANAGER', 'ROLE_FINANCE_HEAD'
  description: String,
  
  // References
  organizationId: ObjectId (ref: Organization),
  
  // Permissions
  permissions: [
    {
      resource: String, // 'assets', 'reports', 'users', 'settings'
      action: String, // 'create', 'read', 'update', 'delete', 'export'
      conditions: {
        ownDepartmentOnly: Boolean,
        ownBranchOnly: Boolean,
        requireApproval: Boolean
      }
    }
  ],
  
  // Status
  isActive: { type: Boolean, default: true },
  
  // Audit
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

---

### **4. USER Model (Update)**
```javascript
{
  _id: ObjectId,
  userId: String (required, unique),
  name: String (required),
  
  // Contact & Profile
  email: String,
  phone: String,
  profilePicture: String,
  
  // Organization & Department
  organizationId: ObjectId (ref: Organization, required),
  branchId: [ObjectId] (ref: Branch),
  departmentId: ObjectId (ref: Department), // NEW - Single primary department
  
  // Role & Permissions (V2 - Enhanced)
  role: String (enum - backward compatibility),
  roleId: ObjectId (ref: Role), // NEW - Link to Role model
  roles: [ObjectId] (ref: Role), // NEW - Multiple roles support
  permissions: [String], // Keep for backward compatibility
  
  // Reporting Structure
  reportingTo: ObjectId (ref: User),
  
  // Profile Details
  designation: String,
  department: String,
  
  // Account Status
  canLogin: Boolean (default: false),
  isActive: Boolean (default: true),
  isBlocked: Boolean (default: false),
  
  // Audit
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

---

### **5. USERLOGIN Model (Update)**
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User, required, unique),
  username: String (required, unique, lowercase),
  password: String (required, select: false),
  
  // Tokens
  refreshToken: String (select: false),
  
  // Account Security
  failedLoginAttempts: Number (default: 0),
  lockLevel: Number (default: 0),
  lockUntil: Date,
  isPermanentlyLocked: Boolean (default: false),
  
  // Session Status
  isLoggedIn: Boolean (default: false),
  lastLogin: Date,
  lastActivityAt: Date, // NEW - For inactivity detection
  
  // Device Management
  loggedInDevices: [{
    deviceId: String,
    ipAddress: String,
    userAgent: String,
    loginCount: Number,
    refreshToken: String,
    loginHistory: [{
      loginAt: Date,
      logoutAt: Date,
      duration: Number // in minutes
    }]
  }],
  maxAllowedDevices: Number (default: 2),
  
  // Two-Factor Authentication (NEW)
  twoFactorEnabled: Boolean (default: false),
  twoFactorMethod: String (enum: ['SMS', 'EMAIL', 'AUTHENTICATOR']),
  twoFactorSecret: String (encrypted),
  twoFactorVerified: Boolean,
  twoFactorBackupCodes: [String],
  lastTwoFactorUsed: Date,
  
  // Password Reset (NEW)
  passwordResetToken: String (hashed),
  passwordResetExpires: Date,
  lastPasswordChange: Date,
  
  // Email Verification (NEW)
  emailVerified: Boolean (default: false),
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // API Keys (referenced, see APIKey model)
  
  // Audit
  createdAt: Date,
  updatedAt: Date
}
```

---

### **6. AUDITLOG Model (NEW - CRITICAL)**
```javascript
{
  _id: ObjectId,
  
  // WHO
  userId: ObjectId (ref: User, required),
  username: String,
  
  // WHAT
  action: String (enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 
                         'ASSET_ASSIGN', 'ASSET_TRANSFER', 'APPROVE', 'REJECT']),
  resourceType: String (enum: ['Asset', 'User', 'Organization', 'Department', 'Report', 'Setting']),
  resourceId: ObjectId,
  
  // Changes
  oldValue: Object, // Previous data (for UPDATE/DELETE)
  newValue: Object, // New data (for CREATE/UPDATE)
  changes: [{
    field: String,
    oldValue: any,
    newValue: any
  }],
  
  // WHERE & WHY
  ipAddress: String,
  userAgent: String,
  comments: String, // Optional notes
  
  // WHEN
  timestamp: Date (default: Date.now, indexed),
  
  // Status
  status: String (enum: ['SUCCESS', 'FAILED']),
  error: String, // If failed
  
  // Immutable once created
  createdAt: Date (no updatedAt - It's immutable!)
}
```

---

### **7. SESSIONLOG Model (NEW - Better tracking)**
```javascript
{
  _id: ObjectId,
  
  // References
  userId: ObjectId (ref: User),
  userLoginId: ObjectId (ref: UserLogin),
  
  // Device Info
  deviceId: String,
  ipAddress: String,
  userAgent: String,
  loginLocation: {
    city: String,
    country: String,
    coordinates: { lat: Number, lng: Number }
  },
  
  // Session Times
  startTime: Date,
  endTime: Date,
  duration: Number, // in minutes
  
  // Activity Tracking
  actions: [{
    timestamp: Date,
    action: String, // GET /api/users, POST /api/assets
    endpoint: String,
    method: String,
    statusCode: Number,
    responseTime: Number // in ms
  }],
  
  // Logout Info
  logoutReason: String (enum: ['manual', 'timeout', 'admin', 'security', 'token_expired']),
  
  // Status
  status: String (enum: ['ACTIVE', 'INACTIVE', 'TIMEOUT', 'REVOKED']),
  
  // Audit
  createdAt: Date,
  updatedAt: Date
}
```

---

### **8. APIKEY Model (NEW - Third-party integration)**
```javascript
{
  _id: ObjectId,
  
  // Ownership
  userId: ObjectId (ref: User),
  organizationId: ObjectId (ref: Organization),
  
  // Key Details (both hashed)
  key: String (required, unique, hashed), // Public key
  secret: String (required, hashed), // Secret key
  
  // Metadata
  name: String, // 'Mobile App', 'Third Party Service'
  description: String,
  
  // Permissions
  scopes: [String], // ['assets:read', 'assets:write', 'reports:read']
  allowedEndpoints: [String], // Specific endpoint access
  
  // Rate Limiting
  rateLimit: Number, // Requests per hour
  dailyLimit: Number,
  
  // Usage Tracking
  lastUsedAt: Date,
  requestCount: Number (default: 0),
  
  // Expiration
  expiresAt: Date (optional - if null, never expires),
  isActive: Boolean (default: true),
  
  // Security
  ipWhitelist: [String], // Only allow requests from these IPs
  
  // Audit
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

---

### **9. IP WHITELIST Model (NEW)**
```javascript
{
  _id: ObjectId,
  
  // Scope
  userId: ObjectId (ref: User), // Personal whitelist
  organizationId: ObjectId (ref: Organization), // Organization-wide
  
  // IP Management
  ipAddress: String (required),
  ipRange: String, // '192.168.1.0/24'
  type: String (enum: ['WHITELIST', 'BLACKLIST']),
  
  // Details
  description: String, // 'Office WiFi', 'Home'
  name: String,
  
  // Expiration
  expiresAt: Date, // Auto-remove after this
  
  // Status
  isActive: Boolean (default: true),
  
  // Audit
  addedBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

---

### **10. USERPREFERENCES Model (NEW - Nice-to-have)**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, unique),
  
  // UI Settings
  theme: String (enum: ['light', 'dark'], default: 'light'),
  language: String (enum: ['en', 'hi', 'ja'], default: 'en'),
  timezone: String (default: 'Asia/Kolkata'),
  dateFormat: String (default: 'DD-MM-YYYY'),
  
  // Notification Preferences
  notifications: {
    emailNotifications: Boolean (default: true),
    pushNotifications: Boolean (default: true),
    loginAlerts: Boolean (default: true),
    reportEmails: Boolean (default: false),
    assetNotifications: Boolean (default: true)
  },
  
  // Dashboard
  defaultDashboard: String,
  widgets: [String], // Enabled widgets
  
  // Custom Settings
  customSettings: Object, // Flexible for future
  
  // Audit
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔗 **Relationships Summary**

| Model | Relation | Target | Type |
|-------|----------|--------|------|
| Department | belongsTo | Organization | Many:One |
| Department | belongsTo | Branch | Many:One (optional) |
| Department | hasMany | Users | One:Many |
| Role | belongsTo | Organization | Many:One |
| Role | hasMany | Permissions | One:Many (embedded) |
| User | belongsTo | Role | Many:One |
| User | hasMany | Roles | Many:Many |
| User | belongsTo | Department | Many:One |
| UserLogin | hasMany | SessionLog | One:Many |
| AuditLog | belongsTo | User | Many:One |
| APIKey | belongsTo | User | Many:One |
| IPWhitelist | belongsTo | User OR Organization | Many:One |
| UserPreferences | hasOne | User | One:One |

---

## 📈 **Data Flow for Asset Management ERP**

```
LOGIN REQUEST
    ↓
[protect middleware] ← Check Redis cache/token
    ↓
[VERIFY 2FA] ← If enabled
    ↓
[CHECK IP WHITELIST] ← NEW Security layer
    ↓
[LOG SESSION] ← Create SessionLog entry
    ↓
[UPDATE LASTACTIVITY] ← Track activity
    ↓
GRANT ACCESS
    ↓
[AUDITLOG] ← Log all subsequent actions
    ↓
ASSET OPERATION (Create/Update/Delete)
    ↓
[PERMISSION CHECK] ← Check Role.Permissions
    ↓
[DEPARTMENT CHECK] ← If restricted to own dept
    ↓
OPERATION ALLOWED/DENIED
    ↓
[AUDITLOG] ← Record what was done
    ↓
[NOTIFICATION] ← Email/SMS if needed
```

---

## ✅ **Implementation Checklist**

- [ ] Create all 10 new/updated models
- [ ] Add model relationships and population
- [ ] Create Audit Log middleware
- [ ] Create Session Log middleware
- [ ] Implement 2FA logic
- [ ] Implement IP Whitelist checking
- [ ] Add permission checking middleware
- [ ] Create corresponding controllers
- [ ] Create corresponding routes
- [ ] Add email/SMS service for notifications
- [ ] Add caching layer (Redis for sessions)
- [ ] Comprehensive testing
- [ ] Documentation
- [ ] Security audit

---

## 🚀 **Quick Start Commands (Future)**

```bash
# Once models are created
npm install nodemailer twilio redis # Add services

# Create indexes for performance
db.auditlogs.createIndex({ timestamp: 1 })
db.auditlogs.createIndex({ userId: 1 })
db.sessionlogs.createIndex({ userId: 1, startTime: -1 })
db.users.createIndex({ email: 1 })
```

---

**Ye sab kuch ERP standard ke according hai. Asset management, HR, Finance hamesha inhi features chahte hain!**
