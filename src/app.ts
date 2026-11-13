import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/error.middleware';

const app: Application = express();

// Middlewares globales
app.use(cors({
  origin: '*', // Permitir cualquier frontend universitario en desarrollo
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Endpoint de salud
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'University E-Commerce API',
    timestamp: new Date().toISOString(),
  });
});

// Rutas de la API
app.use('/api', apiRoutes);

// Manejador 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Manejador centralizado de errores
app.use(errorHandler);

export default app;
