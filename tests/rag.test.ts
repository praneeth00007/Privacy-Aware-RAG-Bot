/**
 * RAG Retriever Tests
 */

import RAGRetriever from '../src/rag/retriever';
import DocumentStore from '../src/documents/store';
import { Document } from '../src/documents/store';

describe('RAGRetriever', () => {
  let retriever: RAGRetriever;
  let documentStore: DocumentStore;

  const mockDoc1: Document = {
    id: 'doc1',
    title: 'Q4 Budget Report',
    content: 'Budget allocation for Q4 2024',
    department: 'finance',
    classification: 'confidential',
    tags: ['budget', 'q4', 'finance'],
    created: new Date(),
    updated: new Date(),
  };

  const mockDoc2: Document = {
    id: 'doc2',
    title: 'Engineering Team Guidelines',
    content: 'Guidelines for the engineering team',
    department: 'engineering',
    classification: 'internal',
    tags: ['engineering', 'guidelines'],
    created: new Date(),
    updated: new Date(),
  };

  beforeEach(() => {
    documentStore = new DocumentStore();
    documentStore.addDocument(mockDoc1);
    documentStore.addDocument(mockDoc2);
    retriever = new RAGRetriever(documentStore, 5);
  });

  describe('retrieve', () => {
    it('should retrieve documents by keyword', async () => {
      const result = await retriever.retrieve('budget');

      expect(result.documents.length).toBeGreaterThan(0);
      expect(result.scores.length).toBe(result.documents.length);
      expect(result.totalRetrieved).toBeGreaterThan(0);
    });

    it('should return empty results for non-matching query', async () => {
      const result = await retriever.retrieve('xyz123nonexistent');

      expect(result.documents.length).toBe(0);
      expect(result.totalRetrieved).toBe(0);
    });

    it('should respect top K parameter', async () => {
      retriever.setTopK(1);
      const result = await retriever.retrieve('budget');

      expect(result.documents.length).toBeLessThanOrEqual(1);
    });
  });

  describe('retrieveWithAccessControl', () => {
    it('should filter documents based on accessible IDs', async () => {
      const accessibleIds = ['doc1'];
      const result = await retriever.retrieveWithAccessControl('budget', accessibleIds);

      result.documents.forEach(doc => {
        expect(accessibleIds).toContain(doc.id);
      });
    });

    it('should return empty if no accessible documents match', async () => {
      const accessibleIds = ['doc999'];
      const result = await retriever.retrieveWithAccessControl('budget', accessibleIds);

      expect(result.documents.length).toBe(0);
    });
  });

  describe('scoring', () => {
    it('should score documents with keyword matching', async () => {
      const result = await retriever.retrieve('budget finance');

      if (result.documents.length > 1) {
        // Documents with more keyword matches should score higher
        expect(result.scores[0]).toBeGreaterThanOrEqual(result.scores[1]);
      }
    });
  });
});
