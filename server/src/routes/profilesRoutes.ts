import express from "express";
import multer from "multer";
import {
  createProfile,
  getProfileById,
  getProfiles,
  deleteProfileCascade,
  reconcileDocuments,
} from "../controllers/profilesController";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.array("documents"), createProfile);

router.get("/", getProfiles);

router.get("/:id", getProfileById);

router.delete("/:id/cascade", deleteProfileCascade);

router.post("/reconcile", reconcileDocuments);

export default router;
