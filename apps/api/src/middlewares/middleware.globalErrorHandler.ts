//C:\Users\prate\Hypemind\apps\api\src\middlewares\middleware.globalErrorHandler.ts
import { ErrorRequestHandler } from "express";
import { appError } from "../errors/appError";




export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {


	if (err instanceof appError) {
		return res.status(err.statusCode).json({ status: "error", success: false, message: err.message })

	}
	else{
		return res.status(500).json({tatus: "error", success: false, message:"Internal server error"})
	}


	
	
}