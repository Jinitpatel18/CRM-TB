import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('combined'));

// Root route — Render health checks
app.get('/', (_req, res) => {
    res.json({
        ok: true,
        service: 'CRM Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// Favicon — 204 no content
app.get('/favicon.ico', (_req, res) => res.status(204).end());
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;