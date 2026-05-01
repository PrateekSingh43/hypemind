import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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
app.use(express.json({ limit: "10kb" })); // Prevent large JSON payloads

// 2.5 Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again later." }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 80, // Limit each IP to 20 requests per windowMs for auth routes
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many authentication attempts, please try again later." }
});

app.use(globalLimiter);
app.use("/api/v1/auth", authLimiter);

// 3. Routes
app.use(route)




// 5. Global error handler (must be last)
app.use(globalErrorHandler);

export default app;
