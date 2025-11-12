import express from "express";
import { getDocumentsByProfile } from "../controllers/documentsController.js";

const router = express.Router();

router.get("/profile/:profileId", getDocumentsByProfile);

export default router;
