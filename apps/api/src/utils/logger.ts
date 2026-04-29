import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

import pino from "pino";
import pinoHttp from "pino-http";

import { LOG_LEVEL, NODE_ENV } from "../config/env";

const getPathWithoutQuery = (url?: string) => {
	if (!url) {
		return undefined;
	}

	try {
		return new URL(url, "http://localhost").pathname;
	} catch {
		return url.split("?")[0];
	}
};

const getRequestId = (req: IncomingMessage, res: ServerResponse) => {
	const requestIdHeader = req.headers["x-request-id"];
	const requestId = Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader;
	const safeRequestId = requestId?.trim() || randomUUID();

	res.setHeader("x-request-id", safeRequestId);
	return safeRequestId;
};

export const logger = pino({
	level: LOG_LEVEL,
	timestamp: pino.stdTimeFunctions.isoTime,
	formatters: {
		bindings(bindings) {
			return {
				pid: bindings.pid,
				hostname: bindings.hostname,
				service: "api",
				env: NODE_ENV,
			};
		},
	},
	redact: {
		censor: "[REDACTED]",
		paths: [
			"req.headers.authorization",
			"req.headers.cookie",
			"req.headers['x-api-key']",
			"req.headers['x-csrf-token']",
			"res.headers['set-cookie']",
			"password",
			"passwordHash",
			"token",
			"rawToken",
			"accessToken",
			"refreshToken",
			"secret",
			"*.password",
			"*.passwordHash",
			"*.token",
			"*.rawToken",
			"*.raw",
			"*.accessToken",
			"*.refreshToken",
			"*.secret",
		],
	},
});

export const requestLogger = pinoHttp({
	logger,
	genReqId: getRequestId,
	wrapSerializers: false,
	autoLogging: {
		ignore: (req) => getPathWithoutQuery(req.url) === "/health",
	},
	serializers: {
		req(req: IncomingMessage) {
			return {
				id: req.id,
				method: req.method,
				path: getPathWithoutQuery(req.url),
			};
		},
		res(res: ServerResponse) {
			return {
				statusCode: res.statusCode,
			};
		},
		err: pino.stdSerializers.err,
	},
	customLogLevel(_req, res, err) {
		if (err || res.statusCode >= 500) {
			return "error";
		}

		if (res.statusCode >= 400) {
			return "warn";
		}

		return "info";
	},
	customSuccessMessage(req: IncomingMessage, res: ServerResponse, responseTime: number) {
		return `${req.method ?? "UNKNOWN"} ${getPathWithoutQuery(req.url) ?? "/"} ${res.statusCode} in ${responseTime}ms`;
	},
	customErrorMessage(req: IncomingMessage, res: ServerResponse, err: Error) {
		return `${req.method ?? "UNKNOWN"} ${getPathWithoutQuery(req.url) ?? "/"} ${res.statusCode} failed: ${err.message}`;
	},
});
