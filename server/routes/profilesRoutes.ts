import express from "express";
import multer from "multer";
import {
  createProfile,
  getProfileById,
  getProfiles,
  deleteProfileCascade,
} from "../controllers/profilesController";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.array("documents"), createProfile);

router.get("/", getProfiles);

router.get("/:id", getProfileById);

router.delete("/:id/cascade", deleteProfileCascade);

export default router;
