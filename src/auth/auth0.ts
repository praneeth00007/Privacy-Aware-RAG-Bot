import axios, { AxiosInstance } from 'axios';
import jwt, { JwtPayload } from 'jsonwebtoken';
import * as NodeCache from 'node-cache';

export interface User {
  id: string;
  email: string;
  role: string;
  department: string;
  permissions?: string[];
}

export interface AuthToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Auth0 Authentication Manager
 * Handles user authentication and JWT token validation
 */
export class Auth0Manager {
  private domain: string;
  private clientId: string;
  private clientSecret: string;
  private httpClient: AxiosInstance;
  private tokenCache: NodeCache;

  constructor(
    domain: string,
    clientId: string,
    clientSecret: string
  ) {
    this.domain = domain;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.httpClient = axios.create({
      baseURL: `https://${domain}`,
      timeout: 10000,
    });
    this.tokenCache = new NodeCache({ stdTTL: 3600 }); // 1 hour TTL
  }

  /**
   * Get machine-to-machine token for FGA API calls
   */
  async getM2MToken(): Promise<string> {
    const cacheKey = 'm2m_token';
    const cachedToken = this.tokenCache.get<string>(cacheKey);
    
    if (cachedToken) {
      return cachedToken;
    }

    try {
      const response = await this.httpClient.post<AuthToken>('/oauth/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        audience: `https://${this.domain}/api/v2/`,
        grant_type: 'client_credentials',
      });

      const token = response.data.access_token;
      this.tokenCache.set(cacheKey, token, response.data.expires_in - 60);
      
      return token;
    } catch (error) {
      console.error('Failed to get M2M token:', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Validate and decode JWT token
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      // In production, verify token signature
      // For demo purposes, we'll do basic validation
      const decoded = jwt.decode(token, { complete: true });
      
      if (!decoded) {
        throw new Error('Invalid token format');
      }

      const payload = decoded.payload as JwtPayload;
      
      // Check token expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (error) {
      console.error('Token validation failed:', error);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Extract user information from token
   */
  async extractUser(token: string): Promise<User> {
    const payload = await this.validateToken(token);

    // Extract custom claims (configure in Auth0 Rules)
    const user: User = {
      id: payload.sub || payload['https://example.com/user_id'] || '',
      email: payload.email || '',
      role: payload['https://example.com/role'] || 'employee',
      department: payload['https://example.com/department'] || 'general',
      permissions: payload['https://example.com/permissions'] || [],
    };

    if (!user.id) {
      throw new Error('Missing user ID in token');
    }

    return user;
  }

  /**
   * Create a mock token for testing
   */
  createMockToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      'https://example.com/role': user.role,
      'https://example.com/department': user.department,
      'https://example.com/permissions': user.permissions || [],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };

    return jwt.sign(payload, 'mock-secret-key', { algorithm: 'HS256' });
  }
}

export default Auth0Manager;
