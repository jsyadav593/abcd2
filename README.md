# ABCD2 - Asset and Channel Deployment System

A modern, production-ready full-stack application for managing users, assets, and deployments.

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js >= 16.0.0
- MongoDB Atlas account
- Git

### **Backend Setup**

1. **Clone and navigate**
   ```bash
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secrets
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   Server runs on: `http://localhost:4000`

### **Frontend Setup**

1. **Navigate to frontend**
   ```bash
   cd Frentend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # .env should have: VITE_API_URL=http://localhost:4000/api
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   App runs on: `http://localhost:5173`

---

## 📋 **Architecture**

### **Backend**
```
Backend/
├── src/
│   ├── app.js                 # Express app with middleware
│   ├── server.js              # Entry point with env validation
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── env.js             # Environment validation & config
│   ├── controllers/           # Business logic
│   ├── middlewares/           # Express middleware
│   │   ├── auth.middleware.js
│   │   ├── permission.middleware.js
│   │   └── validation.middleware.js
│   ├── models/                # MongoDB schemas
│   │   ├── user.model.js
│   │   └── audit.model.js
│   ├── routes/                # API routes
│   ├── validators/            # Joi validation schemas
│   └── utils/
│       ├── logger.js          # Winston logging
│       ├── apiError.js
│       └── asyncHandler.js
└── package.json
```

### **Frontend**
```
Frontend/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── components/
│   │   ├── ErrorBoundary/     # Error boundary with UI
│   │   ├── UI/                # Reusable components
│   │   ├── Forms/
│   │   ├── Header/
│   │   ├── Layout/
│   │   └── Sidebar/
│   ├── pages/                 # Page components
│   │   └── Users/
│   ├── services/
│   │   └── userApi.js         # API communication
│   └── utils/
└── package.json
```

---

## 🔐 **Security Features Implemented**

- ✅ **Helmet.js** - Secure HTTP headers
- ✅ **Rate Limiting** - Express rate limit (100 req/15min, 5 on auth)
- ✅ **Input Validation** - Joi schema validation
- ✅ **NoSQL Injection Prevention** - mongo-sanitize
- ✅ **XSS Protection** - xss library on request body
- ✅ **CORS** - Configured to trusted origins only
- ✅ **Environment Validation** - Strict env var checking
- ✅ **Audit Logging** - Track all user actions
- ✅ **Compression** - GZip response compression

---

## 📊 **Database**

### **Models**
- **User** - User accounts with roles and permissions
- **UserLogin** - Login credentials and session tracking
- **Organization** - Multi-tenant organization support
- **Audit** - Complete audit trail of all actions
- **Permission** - Granular permission system
- **Role** - Role-based access control

### **Indexes**
```javascript
// User model indexes for performance
- userId, organizationId (unique)
- email
- organizationId
- role
- isActive
- isBlocked
- createdAt
```

---

## 🔌 **API Endpoints**

### **User Management**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (paginated) |
| POST | `/api/users` | Create new user |
| GET | `/api/users/:id` | Get user by ID |
| PATCH | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Soft delete user |
| PATCH | `/api/users/:id/toggle-login` | Enable/disable login |
| PATCH | `/api/users/:id/block-unblock` | Block/unblock user |

---

## 🧪 **Testing Endpoints**

### **Create User**
```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "EMP001",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "organizationId": "67a42a7a1e6aa5e7d4b8e1c5"
  }'
```

### **Get All Users**
```bash
curl http://localhost:4000/api/users?page=1&limit=10
```

### **Disable User (2 API calls)**
```bash
# Step 1: Deactivate
curl -X PATCH http://localhost:4000/api/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'

# Step 2: Revoke login
curl -X PATCH http://localhost:4000/api/users/USER_ID/toggle-login \
  -H "Content-Type: application/json" \
  -d '{"canLogin": false}'
```

---

## 📝 **Environment Variables**

### **Backend (.env)**
```
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb+srv://...
ACCESS_TOKEN_SECRET=your-secret
REFRESH_TOKEN_SECRET=your-secret
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
PAGE_LIMIT=10
LOG_LEVEL=info
```

### **Frontend (.env)**
```
VITE_API_URL=http://localhost:4000/api
VITE_APP_NAME=ABCD2
VITE_ENVIRONMENT=development
```

---

## 📚 **Error Handling**

### **Frontend**
- **Error Boundary** - Catches React errors with user-friendly UI
- **Error Notifications** - Toast-like error messages
- **Form Validation** - Real-time validation feedback
- **API Error Handling** - Proper error messages from backend

### **Backend**
- **Global Error Handler** - Centralized error management
- **Validation Errors** - 400 with detailed field info
- **Audit Logging** - All errors logged with context
- **Request Logging** - HTTP request/response logging via Winston

---

## 🗄️ **Logging**

### **Winston Logger**
Logs stored in `Backend/logs/`:
- `error.log` - Error level logs
- `combined.log` - All logs

### **Request Logging**
- Method, path, status code
- Response time
- User ID (when authenticated)
- IP address

---

## 🚀 **Deployment**

### **Backend (Node/Express)**
```bash
# Production build
NODE_ENV=production npm start
```

### **Frontend (Vite)**
```bash
# Build
npm run build

# Output in dist/ folder
# Deploy to Vercel, Netlify, or CDN
```

---

## 📊 **Performance Optimizations**

- ✅ Database indexes on frequently queried fields
- ✅ Response compression with gzip
- ✅ Pagination (max 100 records per page)
- ✅ Lean queries (exclude unnecessary fields)
- ✅ React.lazy for code splitting
- ✅ CSS variables for efficient styling
- ✅ Proper API response caching ready

---

## 🔍 **Best Practices Implemented**

1. **Separation of Concerns** - Controllers, services, routes
2. **Error Handling** - Consistent error responses
3. **Input Validation** - Joi schemas
4. **Async/Await** - Modern async handling
5. **Environment Config** - 12-factor app principles
6. **Logging** - Structured logging with context
7. **Security** - CORS, rate limiting, validation
8. **Code Organization** - Clear folder structure
9. **API Design** - RESTful conventions
10. **Frontend State** - React hooks best practices

---

## 🛠️ **Development Tools**

### **Backend**
- Express.js 5.2.1
- Mongoose 9.1.6
- Winston 3.19.0
- Joi 18.0.2
- Helmet 8.1.0
- Nodemon (dev)

### **Frontend**
- React 19.2.0
- React Router 7.13.0
- Vite 7.3.1
- ESLint 9.39.1

---

## 📄 **License**

ISC

## ✉️ **Author**

Jitender Yadav

---

## 🎯 **Next Steps**

1. ✅ Security hardening (Done)
2. ✅ Validation system (Done)
3. ✅ Logging setup (Done)
4. ✅ Error boundaries (Done)
5. ⏳ Unit tests
6. ⏳ Integration tests
7. ⏳ E2E tests with Cypress
8. ⏳ API documentation with Swagger
9. ⏳ Performance monitoring
10. ⏳ CI/CD pipeline with GitHub Actions

---

**Last Updated:** February 11, 2026
