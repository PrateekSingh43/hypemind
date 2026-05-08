import { Router } from "express";
import { authMiddleware } from "../middlewares/middleware.auth";
import { workspaceMemberMiddleware } from "../middlewares/middleware.workspaceMember";
import { searchController, searchSuggestionsController } from "./search.controller";

const router: Router = Router();

// GET /workspaces/:workspaceId/search?q=<query>&limit=<limit>
router.get(
	"/:workspaceId/search",
	authMiddleware,
	workspaceMemberMiddleware,
	searchController,
);

// GET /workspaces/:workspaceId/search/suggestions
router.get(
	"/:workspaceId/search/suggestions",
	authMiddleware,
	workspaceMemberMiddleware,
	searchSuggestionsController,
);

export default router;
