import 'dotenv/config';
import './types/express.js'; // Import type extensions
import { createServer } from 'http';
import app from './app.js';
import { connectToDatabase } from './db/mongoose.js';
import { env } from './config/env.js';
async function bootstrap() {
    await connectToDatabase();
    const server = createServer(app);
    server.listen(env.port, () => {
        // eslint-disable-next-line no-console
        console.log(`API listening on http://localhost:${env.port}`);
    });
}
bootstrap().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map