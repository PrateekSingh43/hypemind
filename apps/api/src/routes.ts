// C:\Users\prate\Hypemind\apps\api\src\routes.ts

import { Router } from "express";
import authRouter from "./auth/auth.route";

import collectionRouter from "./collections/collection.route";

const router: Router = Router();

router.use("/api/v1/auth", authRouter);

// Collections endpoints
router.use("/api/v1/collections", collectionRouter);

export default router;
