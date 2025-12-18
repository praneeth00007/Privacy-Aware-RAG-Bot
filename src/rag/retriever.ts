import { Document } from '../documents/store';
import DocumentStore from '../documents/store';

export interface RetrievalResult {
  documents: Document[];
  scores: number[];
  totalRetrieved: number;
}

/**
 * RAG Retriever
 * Retrieves relevant documents based on semantic similarity
 */
export class RAGRetriever {
  private documentStore: DocumentStore;
  private topK: number = 5; // Return top 5 documents

  constructor(documentStore: DocumentStore, topK: number = 5) {
    this.documentStore = documentStore;
    this.topK = topK;
  }

  /**
   * Retrieve documents relevant to a query
   */
  async retrieve(query: string): Promise<RetrievalResult> {
    // Search using keyword matching (in production, use semantic embeddings)
    const candidates = this.documentStore.searchByKeyword(query);

    // Score documents based on relevance
    const scored = candidates.map(doc => ({
      doc,
      score: this.scoreDocument(doc, query),
    }));

    // Sort by score and take top K
    const ranked = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, this.topK);

    return {
      documents: ranked.map(r => r.doc),
      scores: ranked.map(r => r.score),
      totalRetrieved: ranked.length,
    };
  }

  /**
   * Retrieve with access control
   * Only returns documents the user has access to
   */
  async retrieveWithAccessControl(
    query: string,
    accessibleDocIds: string[]
  ): Promise<RetrievalResult> {
    const result = await this.retrieve(query);

    // Filter to only accessible documents
    const filtered = result.documents.filter(doc =>
      accessibleDocIds.includes(doc.id)
    );

    const filteredIndices = result.documents
      .map((_, i) => (accessibleDocIds.includes(result.documents[i].id) ? i : -1))
      .filter(i => i !== -1);

    return {
      documents: filtered,
      scores: filteredIndices.map(i => result.scores[i]),
      totalRetrieved: filtered.length,
    };
  }

  /**
   * Score a document against a query
   */
  private scoreDocument(doc: Document, query: string): number {
    let score = 0;
    const keywords = query.toLowerCase().split(/\s+/);
    const docText = `${doc.title} ${doc.content} ${doc.tags.join(' ')}`.toLowerCase();

    // Title matches weighted higher
    const titleText = doc.title.toLowerCase();
    for (const keyword of keywords) {
      if (titleText.includes(keyword)) {
        score += 3;
      }
    }

    // Tag matches weighted higher
    for (const tag of doc.tags) {
      if (keywords.includes(tag)) {
        score += 2;
      }
    }

    // Content matches
    for (const keyword of keywords) {
      const matches = (docText.match(new RegExp(keyword, 'g')) || []).length;
      score += Math.min(matches, 5) * 0.5; // Cap at 5 matches per keyword
    }

    // Normalize score
    return Math.min(score / (keywords.length + 1), 10);
  }

  /**
   * Set top K parameter
   */
  setTopK(k: number): void {
    this.topK = k;
  }

  /**
   * Get top K parameter
   */
  getTopK(): number {
    return this.topK;
  }
}

export default RAGRetriever;
