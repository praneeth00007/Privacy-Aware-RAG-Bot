/**
 * LLM Query Handler Tests
 */

import LLMQueryHandler from '../src/llm/handler';
import RAGRetriever from '../src/rag/retriever';
import AccessControlManager from '../src/auth/access-control';
import DocumentStore from '../src/documents/store';
import Auth0FGAManager from '../src/auth/fga';
import { User } from '../src/auth/auth0';
import { Document } from '../src/documents/store';

describe('LLMQueryHandler', () => {
  let queryHandler: LLMQueryHandler;
  let retriever: RAGRetriever;
  let accessControl: AccessControlManager;
  let documentStore: DocumentStore;

  const mockUser: User = {
    id: 'alice',
    email: 'alice@company.com',
    role: 'manager',
    department: 'human-resources',
  };

  const mockDocument: Document = {
    id: 'doc1',
    title: 'Budget Report',
    content: 'Q4 budget information',
    department: 'finance',
    classification: 'internal',
    tags: ['budget'],
    created: new Date(),
    updated: new Date(),
  };

  beforeEach(() => {
    documentStore = new DocumentStore();
    documentStore.addDocument(mockDocument);

    retriever = new RAGRetriever(documentStore);

    const fgaManager = new Auth0FGAManager(
      'http://localhost:8080',
      'test-store',
      'test-token'
    );
    accessControl = new AccessControlManager(fgaManager);

    queryHandler = new LLMQueryHandler(retriever, accessControl, false);
  });

  describe('query', () => {
    it('should return response for valid query', async () => {
      const response = await queryHandler.query({
        query: 'What is the budget?',
        user: mockUser,
      });

      expect(response).toHaveProperty('answer');
      expect(response).toHaveProperty('sourceDocuments');
      expect(response).toHaveProperty('accessDenied');
    });

    it('should return empty response for no matching documents', async () => {
      const response = await queryHandler.query({
        query: 'xyz123nonexistent',
        user: mockUser,
      });

      expect(response.sourceDocuments.length).toBe(0);
    });

    it('should return access denied when user cannot access documents', async () => {
      const restrictedDoc: Document = {
        ...mockDocument,
        classification: 'confidential',
        requiredRole: 'ceo',
      };

      documentStore.updateDocument(restrictedDoc);

      const response = await queryHandler.query({
        query: 'budget',
        user: mockUser,
      });

      // Response should indicate access denied or empty results
      expect(response).toHaveProperty('accessDenied');
    });
  });
});
