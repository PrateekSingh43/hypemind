import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import router from "./routes";
import { globalErrorHandler } from "./middlewares/middleware.globalErrorHandler";

const app: Express = express();

// 1. Global Middlewares (MUST BE BEFORE ROUTES)
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 2. Routes
app.use(router);

// 3. Health Check
app.get("/health", (_req, res) => res.json({ status: "ok" }));


app.use(globalErrorHandler);

export default app;