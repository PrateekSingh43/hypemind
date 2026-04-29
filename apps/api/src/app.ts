import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import route from "./routes"

import { globalErrorHandler } from "./middlewares/middleware.globalErrorHandler";
import { requestLogger } from "./utils/logger";

const app: Express = express();

// 1. CORS first — must handle preflight OPTIONS before anything else
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// 2. Security + parsers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(requestLogger);
app.use(cookieParser());
app.use(express.json());

// 3. Routes
app.use(route)




// 5. Global error handler (must be last)
app.use(globalErrorHandler);

export default app;
