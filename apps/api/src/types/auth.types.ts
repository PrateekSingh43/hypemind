// src/types/auth.types.ts
import { Request, Response } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string;
  };
}








