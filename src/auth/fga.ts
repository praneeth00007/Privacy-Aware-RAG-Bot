import axios, { AxiosInstance } from 'axios';
import * as NodeCache from 'node-cache';

export interface AuthorizationCheck {
  user: string;
  relation: string;
  object: string;
}

export interface CheckResponse {
  allowed: boolean;
}

export interface TupleKey {
  user: string;
  relation: string;
  object: string;
}

/**
 * Auth0 FGA (Fine-Grained Authorization) Manager
 * Handles authorization checks for document access
 */
export class Auth0FGAManager {
  private httpClient: AxiosInstance;
  private permissionCache: NodeCache;

  constructor(apiUrl: string, storeId: string, apiToken: string) {
    this.httpClient = axios.create({
      baseURL: `${apiUrl}/stores/${storeId}`,
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    this.permissionCache = new NodeCache({ stdTTL: 300 }); // 5 min TTL
  }

  /**
   * Check if a user has access to a document
   */
  async checkAccess(userId: string, documentId: string, relation = 'viewer'): Promise<boolean> {
    const cacheKey = `${userId}:${documentId}:${relation}`;
    const cached = this.permissionCache.get<boolean>(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    try {
      const response = await this.httpClient.post<CheckResponse>('/check', {
        tuple_key: {
          user: `user:${userId}`,
          relation: relation,
          object: `document:${documentId}`,
        },
      });

      const allowed = response.data.allowed;
      this.permissionCache.set(cacheKey, allowed);

      return allowed;
    } catch (error) {
      console.error(`FGA check failed for ${userId} on ${documentId}:`, error);
      // Fail securely - deny access on error
      return false;
    }
  }

  /**
   * Check multiple documents and return only accessible ones
   */
  async filterAccessibleDocuments(
    userId: string,
    documentIds: string[],
    relation = 'viewer'
  ): Promise<string[]> {
    const accessChecks = documentIds.map(docId =>
      this.checkAccess(userId, docId, relation)
    );

    const results = await Promise.all(accessChecks);
    return documentIds.filter((_, index) => results[index]);
  }

  /**
   * Write authorization tuple (admin operation)
   */
  async writeAuthorizationTuple(tuple: TupleKey): Promise<void> {
    try {
      await this.httpClient.post('/write', {
        writes: [
          {
            tuple_key: {
              user: tuple.user,
              relation: tuple.relation,
              object: tuple.object,
            },
          },
        ],
      });
    } catch (error) {
      console.error('Failed to write authorization tuple:', error);
      throw error;
    }
  }

  /**
   * Write multiple authorization tuples in batch
   */
  async writeBatch(tuples: TupleKey[]): Promise<void> {
    try {
      await this.httpClient.post('/write', {
        writes: tuples.map(tuple => ({
          tuple_key: {
            user: tuple.user,
            relation: tuple.relation,
            object: tuple.object,
          },
        })),
      });
    } catch (error) {
      console.error('Failed to write batch authorization tuples:', error);
      throw error;
    }
  }

  /**
   * Delete authorization tuple
   */
  async deleteAuthorizationTuple(tuple: TupleKey): Promise<void> {
    try {
      await this.httpClient.post('/write', {
        deletes: [
          {
            tuple_key: {
              user: tuple.user,
              relation: tuple.relation,
              object: tuple.object,
            },
          },
        ],
      });
    } catch (error) {
      console.error('Failed to delete authorization tuple:', error);
      throw error;
    }
  }

  /**
   * Get all accessible documents for a user
   */
  async getAccessibleDocuments(userId: string, relation = 'viewer'): Promise<string[]> {
    try {
      const response = await this.httpClient.post<{ objects: string[] }>('/list-objects', {
        user: `user:${userId}`,
        relation: relation,
        type: 'document',
      });

      return response.data.objects.map((obj: string) => obj.replace('document:', ''));
    } catch (error) {
      console.error(`Failed to list accessible documents for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Clear permission cache for testing
   */
  clearCache(): void {
    this.permissionCache.flushAll();
  }
}

export default Auth0FGAManager;
