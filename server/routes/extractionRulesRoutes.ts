import express from "express";
import { extractDocument } from "../controllers/extractionRulesController";

const router = express.Router();

router.post("/extract", extractDocument);

export default router;
