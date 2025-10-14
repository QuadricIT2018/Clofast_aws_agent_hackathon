import express from "express";
import multer from "multer";
import { createProfile } from "../controllers/profilesController";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.array("documents"), createProfile);

export default router;
