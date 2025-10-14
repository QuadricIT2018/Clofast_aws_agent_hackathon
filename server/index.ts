import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import profileRoutes from "./routes/profilesRoutes";
// Existing routers
import userRouter from "./routes/usersRoutes";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URL || "mongodb://localhost:27017/hackathonDB";
const PORT = process.env.PORT || 5550;

const app = express();

// ----------------- Middleware -----------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------- Routes -----------------

// User Routes
app.use("/api/users", userRouter);
app.use("/api/profiles", profileRoutes);

app.use((req, res, next) => {
  console.log("❌ Unhandled route:", req.method, req.url);
  next();
});

// ----------------- MongoDB Connection -----------------
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  });
