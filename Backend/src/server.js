import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { app } from "./app.js";
import { seedPermissionsAndRoles } from "./seed/permission.seed.js";
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config({
  path: "./.env",
});

connectDB()
  .then(async () => {
    // Initialize permission and role system (run once)
    // try {
    //   console.log('🌱 Initializing permission system...');
    //   await seedPermissionsAndRoles();
    //   console.log('✅ Permission system initialized');
    // } catch (error) {
    //   console.error('⚠️ Permission seeding warning (may already exist):', error.message);
    //   // Don't stop server if seeding fails - permissions might already exist
    // }

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Server is running at port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed !!!", err);
  });

