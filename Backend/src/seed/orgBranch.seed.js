import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";
import connectDB from "../config/db.js";
import { Organization } from "../models/organization.model.js";
import { Branch } from "../models/branch.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Set DNS servers for MongoDB SRV resolution
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const seed = async () => {
  try {
    await connectDB();

    // Create org if not exists
    let org = await Organization.findOne({ code: "ABCD_CORP" });
    if (!org) {
      org = await Organization.create({
        name: "ABCD",
        code: "ABCD_CORP",
        address: "1 GGN",
        contactEmail: "info@abcd.test",
      });
      console.log("Created organization:", org.name);
    } else {
      console.log("Organization exists:", org.name);
    }

    // Create branches
    const branches = [
      { name: "ABCD North", code: "NORTH", address: "1 Main St", organizationId: org._id },
      { name: "ABCD West", code: "WEST", address: "99 West Ave", organizationId: org._id },
      { name: "ABCD EAST", code: "EAST", address: "67 EAST Ave", organizationId: org._id },
      { name: "ABCD SOUTH", code: "SOUTH", address: "7 SOUTH Ave", organizationId: org._id },
    ];

    for (const b of branches) {
      const exists = await Branch.findOne({ code: b.code, organizationId: org._id });
      if (!exists) {
        await Branch.create(b);
        console.log("Created branch:", b.name);
      } else {
        console.log("Branch exists:", exists.name);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seed();