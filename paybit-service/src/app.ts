import express, { Express, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import connectDB from './db/connect';
import authRoutes from './routes/auth';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
            const requestId = meta.requestId ? ` [${meta.requestId}]` : '';
            return `${timestamp} ${level.toUpperCase()}${requestId}: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
            }`;
        })
    ),
    defaultMeta: { service: 'paybit-service' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.printf(({ level, message, timestamp, ...meta }) => {
                    const requestId = meta.requestId ? ` [${meta.requestId}]` : '';
                    return `${timestamp} ${level}${requestId}: ${message} ${
                        Object.keys(meta).length && !meta.service ? JSON.stringify(meta, null, 2) : ''
                    }`;
                })
            )
        }),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

const app: Express = express();
const port: number = parseInt(process.env.PORT || '8000', 10);

app.use((req: Request, res: Response, next: NextFunction) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
    res.setHeader('X-Request-ID', req.headers['x-request-id'] as string);
    next();
});

app.use(helmet());

app.use(morgan(':method :url :status :response-time ms - :res[content-length]', {
    stream: {
        write: (message: string) => logger.info(message.trim())
    }
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (_req: Request, res: Response) => {
    res.send('PayBit API is running');
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    const requestId = req.headers['x-request-id'] as string;
    logger.error('Unhandled error', {
        requestId,
        path: req.path,
        method: req.method,
        error: err.message,
        stack: err.stack
    });
    res.status(500).send('Something broke!');
});

const startServer = async () => {
    try {
        await connectDB();
        logger.info('Connected to database');
        app.listen(port, () => {
            logger.info(`Server running on http://localhost:${port}`);
        });
    } catch (error) {
        logger.error('Failed to start server', { error });
        process.exit(1);
    }
};

startServer();

export default app;
