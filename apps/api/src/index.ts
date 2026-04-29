//C:\Users\prate\Hypemind\apps\api\src\index.ts



import { port } from './config/env';
import { logger } from './utils/logger';
import app from './app';





app.listen(port, () => {
	logger.info({ port }, "api server listening")
})

