/**
 * Access Control Tests
 */

import AccessControlManager from '../src/auth/access-control';
import Auth0FGAManager from '../src/auth/fga';
import { User } from '../src/auth/auth0';
import { Document } from '../src/documents/store';

describe('AccessControlManager', () => {
  let accessControl: AccessControlManager;
  let fgaManager: Auth0FGAManager;

  const mockUser: User = {
    id: 'alice',
    email: 'alice@company.com',
    role: 'manager',
    department: 'human-resources',
  };

  const mockDocument: Document = {
    id: 'doc_salary',
    title: 'Salary Information',
    content: 'Sensitive salary data',
    department: 'human-resources',
    classification: 'confidential',
    requiredRole: 'manager',
    tags: ['salary'],
    created: new Date(),
    updated: new Date(),
  };

  beforeEach(() => {
    fgaManager = new Auth0FGAManager(
      'http://localhost:8080',
      'test-store',
      'test-token'
    );
    accessControl = new AccessControlManager(fgaManager);
  });

  describe('canAccessDocument', () => {
    it('should allow manager to access manager-only documents', async () => {
      const result = await accessControl.canAccessDocument(mockUser, mockDocument);
      expect(result.allowed).toBe(true);
    });

    it('should deny employee access to restricted documents', async () => {
      const employeeUser: User = {
        id: 'bob',
        email: 'bob@company.com',
        role: 'employee',
        department: 'engineering',
      };

      const result = await accessControl.canAccessDocument(employeeUser, mockDocument);
      expect(result.allowed).toBe(false);
    });

    it('should deny cross-department access to restricted documents', async () => {
      const otherDeptUser: User = {
        id: 'charlie',
        email: 'charlie@company.com',
        role: 'manager',
        department: 'engineering',
      };

      const restrictedDoc: Document = {
        ...mockDocument,
        classification: 'restricted',
        department: 'human-resources',
      };

      const result = await accessControl.canAccessDocument(otherDeptUser, restrictedDoc);
      expect(result.allowed).toBe(false);
    });
  });

  describe('filterAccessibleDocuments', () => {
    it('should filter documents based on access control', async () => {
      const docs: Document[] = [
        mockDocument,
        {
          ...mockDocument,
          id: 'doc_public',
          classification: 'public' as const,
          requiredRole: undefined,
        },
      ];

      const filtered = await accessControl.filterAccessibleDocuments(mockUser, docs);
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('explainAccess', () => {
    it('should provide detailed access explanation', async () => {
      const explanation = await accessControl.explainAccess(mockUser, mockDocument);

      expect(explanation).toHaveProperty('allowed');
      expect(explanation).toHaveProperty('reasons');
      expect(Array.isArray(explanation.reasons)).toBe(true);
    });
  });
});
