import 'dotenv/config';
import { createServer } from 'http';
import app from './app.js';
import { connectToDatabase } from './db/mongoose.js';
import { env } from './config/env.js';
async function bootstrap() {
    await connectToDatabase();
    const server = createServer(app);
    server.listen(env.port, '0.0.0.0', () => {
        // eslint-disable-next-line no-console
        console.log(`API listening on http://0.0.0.0:${env.port}`);
    });
}
bootstrap().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map