import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { BadRequestError } from "../errors/httpErrors";
import { searchItemsService, searchSuggestionsService } from "./search.service";

/**
 * GET /:workspaceId/search?q=<query>&limit=<limit>
 * Returns matching items for the given query.
 */
export const searchController = asyncHandler(
	async (req: Request, res: Response) => {
		const { workspaceId } = req.params;
		const query = typeof req.query.q === "string" ? req.query.q : "";
		const limit = Math.min(
			Math.max(Number(req.query.limit) || 10, 1),
			25,
		);

		if (!workspaceId) {
			throw new BadRequestError("Workspace ID is required");
		}

		if (!query.trim()) {
			throw new BadRequestError("Search query is required");
		}

		const results = await searchItemsService(workspaceId, query, limit);

		res.status(200).json({
			success: true,
			data: results,
			meta: { query, count: results.length },
		});
	},
);

/**
 * GET /:workspaceId/search/suggestions
 * Returns suggested items for the search modal's initial state.
 */
export const searchSuggestionsController = asyncHandler(
	async (req: Request, res: Response) => {
		const { workspaceId } = req.params;

		if (!workspaceId) {
			throw new BadRequestError("Workspace ID is required");
		}

		const suggestions = await searchSuggestionsService(workspaceId);

		res.status(200).json({
			success: true,
			data: suggestions,
		});
	},
);
