import type { ErrorRequestHandler } from "express";
import { appError } from "../errors/appError";

export const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
	res.err = err instanceof Error ? err : new Error("Unknown error");

	if (err instanceof appError) {
		return res.status(err.statusCode).json({ message: err.message });
	}

	return res.status(500).json({ message: "Internal server error" });
};
