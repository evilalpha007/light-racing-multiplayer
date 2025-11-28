import * as jwt from 'jsonwebtoken';
import config from '../config/env';

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
}

export class JWTService {
  static generateToken(payload: JWTPayload): string {
    const options: jwt.SignOptions = {
      expiresIn: config.jwtExpiresIn as any,
    };
    return jwt.sign(payload, config.jwtSecret, options);
  }

  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  static decodeToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }
}
