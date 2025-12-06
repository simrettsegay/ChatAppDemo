import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { PrismaClient } from '@prisma/client';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService(new PrismaClient());
  }

login = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await this.authService.login(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(401).json({ message: error.message });
    }
  };

  getCurrentUser = async (req: Request, res: Response) => {
    try {
      // @ts-ignore - req.user is set by the auth middleware
      const user = req.user;
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: 'Server error' });
    }
  };
}
