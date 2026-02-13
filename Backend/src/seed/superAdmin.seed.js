import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { User } from "../models/user.model.js";
import { UserLogin } from "../models/userLogin.model.js";
import { hashPassword } from "../utils/password.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Set DNS servers for MongoDB SRV resolution
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const seedSuperAdmin = async () => {
  try {
    await connectDB();

    const username = "eadmin";
    const plainPassword = "asdf1234";

    // Check if UserLogin exists
    const existingLogin = await UserLogin.findOne({ username });
    if (existingLogin) {
      console.log("❗ Enterprise Admin login already exists");
      process.exit(0);
    }

    // Create or find User record for enterprise admin
    let adminUser = await User.findOne({ userId: "SUPER_ADMIN_001" });

    if (!adminUser) {
      adminUser = await User.create({
        userId: "SUPER_ADMIN_001",
        name: "Enterprise Admin",
        email: "admin@system.com",
        role: "enterprise_admin",
        canLogin: true,
        isActive: true,
        organizationId: new mongoose.Types.ObjectId(), // Add default org if needed
      });
      console.log("✅ Enterprise Admin user created");
    }

    // Create UserLogin record
    const hashedPassword = await hashPassword(plainPassword);
    await UserLogin.create({
      user: adminUser._id,
      username,
      password: hashedPassword,
    });

    console.log("✅ Enterprise Admin seeded successfully");
    console.log("📝 Login Credentials:");
    console.log("   Username:", username);
    console.log("   Password:", plainPassword);
    console.log("⚠️  Change password on first login!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

seedSuperAdmin();