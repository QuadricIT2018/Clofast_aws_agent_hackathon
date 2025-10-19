import express from "express";
import { getMatchingRulesByProfile } from "../controllers/matchingRulesController";

const router = express.Router();

// GET all matching rules for a given profile
router.get("/:profileId", getMatchingRulesByProfile);

export default router;
