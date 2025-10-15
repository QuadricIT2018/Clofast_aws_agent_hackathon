import express from "express";
import { getDocumentsByProfile } from "../controllers/documentsController";

const router = express.Router();

router.get("/profile/:profileId", getDocumentsByProfile);

export default router;
