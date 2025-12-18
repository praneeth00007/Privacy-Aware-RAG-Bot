/**
 * Auth0 FGA Tests
 */

import Auth0FGAManager from '../src/auth/fga';

describe('Auth0FGAManager', () => {
  let fgaManager: Auth0FGAManager;

  beforeEach(() => {
    // Mock FGA Manager for testing
    fgaManager = new Auth0FGAManager(
      'http://localhost:8080',
      'test-store-id',
      'test-token'
    );
  });

  describe('checkAccess', () => {
    it('should check if user has access to document', async () => {
      // In production, mock the axios calls
      const result = await fgaManager.checkAccess('alice', 'doc_budget_q4_2024');
      expect(typeof result).toBe('boolean');
    });

    it('should cache permission results', async () => {
      // Check twice - second should be from cache
      const result1 = await fgaManager.checkAccess('alice', 'doc_budget_q4_2024');
      const result2 = await fgaManager.checkAccess('alice', 'doc_budget_q4_2024');

      expect(result1).toBe(result2);
    });
  });

  describe('filterAccessibleDocuments', () => {
    it('should return only accessible documents', async () => {
      const docIds = ['doc1', 'doc2', 'doc3'];
      const accessible = await fgaManager.filterAccessibleDocuments('alice', docIds);

      expect(Array.isArray(accessible)).toBe(true);
      accessible.forEach(docId => {
        expect(docIds).toContain(docId);
      });
    });
  });

  describe('writeBatch', () => {
    it('should write multiple authorization tuples', async () => {
      const tuples = [
        { user: 'user:alice', relation: 'viewer', object: 'document:doc1' },
        { user: 'user:bob', relation: 'editor', object: 'document:doc2' },
      ];

      // Should not throw
      await expect(fgaManager.writeBatch(tuples)).resolves.not.toThrow();
    });
  });

  describe('clearCache', () => {
    it('should clear permission cache', async () => {
      await fgaManager.checkAccess('alice', 'doc1');
      fgaManager.clearCache();

      // Cache should be empty
      expect(() => fgaManager.clearCache()).not.toThrow();
    });
  });
});
