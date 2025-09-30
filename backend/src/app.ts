import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { router as apiRouter } from './routes/index.js';

const app = express();

app.set('trust proxy', true);

// Security & misc middlewares
app.use(helmet());
app.use(compression());

// CORS
const allowedOrigins = env.allowedOrigins;
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Logging (dev only)
if (env.nodeEnv !== 'production') {
  app.use(morgan('dev'));
}

// Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/v1', apiRouter);

// 404 and error handler
app.use(notFound);
app.use(errorHandler);

export default app;


