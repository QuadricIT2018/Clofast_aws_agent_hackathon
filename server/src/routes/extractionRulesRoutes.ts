import express from "express";
import { extractDocumentData } from "../controllers/extractionRulesController.js";

const router = express.Router();

router.post("/extract", extractDocumentData);

export default router;
