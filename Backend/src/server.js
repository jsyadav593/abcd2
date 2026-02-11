import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { app } from "./app.js";
import { validateEnv, getEnvConfig } from "./config/env.js";
import logger from "./utils/logger.js";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Validate environment variables before starting
try {
  validateEnv();
} catch (error) {
  console.error("❌ Configuration Error:", error.message);
  process.exit(1);
}

const envConfig = getEnvConfig();

connectDB()
  .then(async () => {
    const PORT = envConfig.port;
    
    app.listen(PORT, () => {
      logger.info(`🚀 Server started successfully`, {
        port: PORT,
        environment: envConfig.nodeEnv,
        database: "Connected",
      });
      
      console.log(`
        ╔════════════════════════════════════════╗
        ║     ABCD2 Backend Server Running       ║
        ╠════════════════════════════════════════╣
        ║ Environment: ${envConfig.nodeEnv.padEnd(25)} ║
        ║ Port: ${PORT.toString().padEnd(31)} ║
        ║ API: http://localhost:${PORT}/api       ║
        ╚════════════════════════════════════════╝
      `);
    });
  })
  .catch((err) => {
    logger.error("❌ Failed to start server", {
      error: err.message,
      stack: err.stack,
    });
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", { reason, promise });
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", { error: error.message, stack: error.stack });
  process.exit(1);
});

