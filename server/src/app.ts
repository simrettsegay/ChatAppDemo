import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import config from './config/config';
import { PrismaClient } from '@prisma/client';
import { errorHandler, notFound } from './middleware/errorHandler';
import { initializeSocket } from './sockets';

class App {
  public app: Application;
  public server: http.Server;
  public io: Server;
  public prisma: PrismaClient;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    // Socket.IO server configuration
    this.io = new Server(this.server, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          config.clientUrl
        ].filter(Boolean),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
        credentials: true
      },
      path: '/socket.io',  // This should match the client's path
      // Additional Socket.IO options
      maxHttpBufferSize: 1e8, // 100MB
      pingTimeout: 60000, // 60 seconds
      pingInterval: 25000, // 25 seconds
      cookie: false,
      transports: ['websocket', 'polling']
    });
    this.prisma = new PrismaClient();

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeSockets();
  }

  private initializeMiddlewares() {
    // Enable CORS for all routes
    this.app.use((req, res, next) => {
      const allowedOrigins = [
        config.clientUrl,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173'
      ];

      const origin = req.headers.origin;
      
      // In development, allow all localhost origins
      if (config.nodeEnv === 'development' && origin && origin.includes('localhost')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } 
      // In production, only allow the configured client URL
      else if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      
      next();
    });

    // Body parsers
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  private initializeRoutes() {
    // Add this route first
    this.app.get('/api/config', (req, res) => {
      res.json({
        clientUrl: config.clientUrl,
        nodeEnv: config.nodeEnv,
        corsConfig: {
          origin: config.clientUrl,
          methods: ['GET', 'POST'],
          credentials: true
        }
      });
    });

    // API routes
    this.app.use('/api/auth', require('./routes/auth.routes').default);
    this.app.use('/api/conversations', require('./routes/conversation.routes').default);
    this.app.use('/api/conversations', require('./routes/message.routes').default);
    
    // 404 handler
    this.app.use(notFound);
  }

  private initializeErrorHandling() {
    this.app.use(errorHandler);
  }

  private initializeSockets() {
    this.io.on('connection', (socket) => {
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
    
    initializeSocket(this.io, this.prisma);
  }

  public listen() {
    this.server.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });
  }

  public async close() {
    await this.prisma.$disconnect();
    this.server.close();
  }
}

export default App;
