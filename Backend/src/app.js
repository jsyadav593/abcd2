import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

// CORS Configuration
app.use(
  cors({
    // origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

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
  res.status(404).json({ message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error("Error:", {
    statusCode,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export { app };