import { z, type ZodType } from "@repo/validation"
import { type Request, type Response, type NextFunction } from "express"

export const validateSchema = <T>(schmea: ZodType<T>) => (req: Request, res: Response, next: NextFunction) => {

	const result = schmea.safeParse(req.body);

	if (!result.success) {
		return res.status(422).json({ error: z.treeifyError(result.error) });

	}

	res.locals.validated = result.data as T;
	next();

}