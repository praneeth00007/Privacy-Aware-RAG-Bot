import NodeCache from 'node-cache';

export interface DocumentMetadata {
  id: string;
  title: string;
  content: string;
  department: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  requiredRole?: string; // Minimum role required
  tags: string[];
  created: Date;
  updated: Date;
}

export interface Document extends DocumentMetadata {
  embedding?: number[]; // Vector embedding for semantic search
}

/**
 * Document Store
 * Manages document storage with metadata
 */
export class DocumentStore {
  private documents: Map<string, Document> = new Map();
  private cache: NodeCache;
  private searchIndex: Map<string, string[]> = new Map(); // word -> docIds

  constructor() {
    this.cache = new NodeCache({ stdTTL: 600 }); // 10 min TTL
  }

  /**
   * Add a document to the store
   */
  addDocument(doc: Document): void {
    this.documents.set(doc.id, doc);
    this.cache.flushAll(); // Invalidate cache
    this.indexDocument(doc);
  }

  /**
   * Get document by ID
   */
  getDocument(id: string): Document | undefined {
    return this.documents.get(id);
  }

  /**
   * Get all documents
   */
  getAllDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  /**
   * Search documents by keyword
   */
  searchByKeyword(query: string): Document[] {
    const cacheKey = `search:${query}`;
    const cached = this.cache.get<Document[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const results: Document[] = [];
    const keywords = query.toLowerCase().split(/\s+/);

    for (const doc of this.documents.values()) {
      const text = `${doc.title} ${doc.content} ${doc.tags.join(' ')}`.toLowerCase();
      const matches = keywords.filter(kw => text.includes(kw)).length;

      if (matches > 0) {
        results.push({
          ...doc,
        });
      }
    }

    // Sort by relevance (more keyword matches first)
    results.sort((a, b) => {
      const aMatches = keywords.filter(kw =>
        `${a.title} ${a.content}`.toLowerCase().includes(kw)
      ).length;
      const bMatches = keywords.filter(kw =>
        `${b.title} ${b.content}`.toLowerCase().includes(kw)
      ).length;
      return bMatches - aMatches;
    });

    this.cache.set(cacheKey, results);
    return results;
  }

  /**
   * Get documents by department
   */
  getDocumentsByDepartment(department: string): Document[] {
    return Array.from(this.documents.values()).filter(
      doc => doc.department === department
    );
  }

  /**
   * Get documents by classification
   */
  getDocumentsByClassification(classification: string): Document[] {
    return Array.from(this.documents.values()).filter(
      doc => doc.classification === classification
    );
  }

  /**
   * Get documents requiring specific role
   */
  getDocumentsRequiringRole(role: string): Document[] {
    return Array.from(this.documents.values()).filter(
      doc => doc.requiredRole === role
    );
  }

  /**
   * Update document
   */
  updateDocument(doc: Document): void {
    doc.updated = new Date();
    this.documents.set(doc.id, doc);
    this.cache.flushAll();
    this.indexDocument(doc);
  }

  /**
   * Delete document
   */
  deleteDocument(id: string): boolean {
    const deleted = this.documents.delete(id);
    if (deleted) {
      this.cache.flushAll();
    }
    return deleted;
  }

  /**
   * Build search index for keyword
   */
  private indexDocument(doc: Document): void {
    const words = `${doc.title} ${doc.content} ${doc.tags.join(' ')}`
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2);

    for (const word of words) {
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, []);
      }
      const docs = this.searchIndex.get(word)!;
      if (!docs.includes(doc.id)) {
        docs.push(doc.id);
      }
    }
  }

  /**
   * Clear all documents
   */
  clear(): void {
    this.documents.clear();
    this.searchIndex.clear();
    this.cache.flushAll();
  }
}

export default DocumentStore;
