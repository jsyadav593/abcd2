import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
 
    console.error("MongoDB connection failed", error);
    process.exit(1);
  }
};

export default connectDB;


// import mongoose from "mongoose";

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       serverSelectionTimeoutMS: 5000,
//       socketTimeoutMS: 45000,
//     });

//     console.log(`✅ MongoDB connected: ${conn.connection.host}`);
//     return conn;
//   } catch (error) {
//     console.error("❌ MongoDB connection failed:", error.message);
//     // Retry connection after 5 seconds
//     setTimeout(connectDB, 5000);
//   }
// };

// export default connectDB;