import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import profileRoutes from "./routes/profilesRoutes.js";
import userRouter from "./routes/usersRoutes.js";
import documentRoutes from "./routes/documentsRoutes.js";
import extractionRoutes from "./routes/extractionRulesRoutes.js";
import matchingRules from "./routes/matchingRulesRoutes.js";

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
app.use("/api/users", userRouter);
app.use("/api/profiles", profileRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/extraction", extractionRoutes);
app.use("/api/matching-rules", matchingRules);

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
