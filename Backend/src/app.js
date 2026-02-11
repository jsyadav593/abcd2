import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss";
import compression from "compression";
import logger, { createHttpLogger } from "./utils/logger.js";
import { getParsedCorsOrigin } from "./config/env.js";

const app = express();

// Security Middleware - HELMET
app.use(helmet());

// Compression Middleware - Compress responses
app.use(compression());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Stricter limit for auth endpoints
  message: "Too many login attempts, please try again later.",
  skipSuccessfulRequests: true, // Don't count successful requests
});

app.use("/api/", limiter);
app.use("/api/auth", authLimiter);

// CORS Configuration
const corsOrigin = getParsedCorsOrigin();
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body Parser Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Data Sanitization against NoSQL Query Injection
app.use(mongoSanitize());

// Data Sanitization against XSS
app.use((req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = xss(req.body[key]);
      }
    });
  }
  next();
});

// Static Files
app.use(express.static("public"));

// Cookie Parser
app.use(cookieParser());

// HTTP Request Logger
app.use(createHttpLogger());

// Health Check
app.get("/", (req, res) => {
  res.json({ message: "Backend is working!", status: "ok" });
});

app.get("/health", (req, res) => {
  res.json({ message: "Server is healthy" });
});

// Routes Import
import orgRouter from "./routes/organization.route.js";
import branchRouter from "./routes/branch.route.js";
import userRouter from "./routes/user.route.js";
import userLoginRouter from "./routes/userLogin.route.js";
import authRouter from "./routes/auth.route.js";
import testRouter from "./routes/test.route.js";

// Routes Declaration
app.use("/api/orgs", orgRouter);
app.use("/api/branches", branchRouter);
app.use("/api/users", userRouter);
app.use("/api/test", testRouter);

// Authentication Routes
app.use("/api/auth", userLoginRouter);
app.use("/api/auth-data", authRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    statusCode: 404,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error("API Error", {
    statusCode,
    message,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });

  res.status(statusCode).json({
    statusCode,
    success: false,
    message,
    errors: err.errors || [],
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export { app };