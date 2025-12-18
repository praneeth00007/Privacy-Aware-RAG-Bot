import { User } from '../auth/auth0';
import AccessControlManager from '../auth/access-control';
import RAGRetriever from '../rag/retriever';
import { Document } from '../documents/store';

export interface QueryRequest {
  query: string;
  user: User;
}

export interface QueryResponse {
  answer: string;
  sourceDocuments: Array<{
    id: string;
    title: string;
    excerpt: string;
  }>;
  accessDenied?: boolean;
  denialReason?: string;
}

/**
 * LLM Query Handler
 * Processes user queries with RAG and access control
 */
export class LLMQueryHandler {
  private retriever: RAGRetriever;
  private accessControl: AccessControlManager;
  private useRealLLM: boolean = false;

  constructor(
    retriever: RAGRetriever,
    accessControl: AccessControlManager,
    useRealLLM: boolean = false
  ) {
    this.retriever = retriever;
    this.accessControl = accessControl;
    this.useRealLLM = useRealLLM;
  }

  /**
   * Process a query with access control
   */
  async query(request: QueryRequest): Promise<QueryResponse> {
    const { query, user } = request;

    console.log(`\n📝 Query from ${user.id} (${user.role}): "${query}"`);

    // Step 1: Retrieve relevant documents
    console.log(`🔍 Retrieving relevant documents...`);
    const retrievalResult = await this.retriever.retrieve(query);

    if (retrievalResult.totalRetrieved === 0) {
      return {
        answer: "I couldn't find any documents relevant to your query.",
        sourceDocuments: [],
      };
    }

    console.log(
      `Found ${retrievalResult.documents.length} potentially relevant documents`
    );

    // Step 2: Filter by access control
    console.log(`🔐 Checking access permissions...`);
    const accessibleDocs = await this.accessControl.filterAccessibleDocuments(
      user,
      retrievalResult.documents
    );

    // Check if all documents were filtered out
    if (accessibleDocs.length === 0) {
      const deniedDocs = retrievalResult.documents.map(d => d.title).join(', ');

      console.log(`❌ Access Denied: User cannot access the relevant documents`);
      console.log(`   Denied documents: ${deniedDocs}`);

      return {
        answer: `I found documents that might contain the answer, but you don't have permission to access them. Access denied.`,
        sourceDocuments: [],
        accessDenied: true,
        denialReason: `User '${user.id}' (${user.role}) cannot access the relevant documents`,
      };
    }

    console.log(`✅ Access granted to ${accessibleDocs.length} document(s)`);

    // Step 3: Generate answer using LLM
    console.log(`🤖 Generating answer from accessible documents...`);
    const answer = await this.generateAnswer(query, accessibleDocs);

    // Step 4: Format response
    const sourceDocuments = accessibleDocs.map(doc => ({
      id: doc.id,
      title: doc.title,
      excerpt: this.extractExcerpt(doc.content, query, 200),
    }));

    console.log(`✔️ Response ready\n`);

    return {
      answer,
      sourceDocuments,
    };
  }

  /**
   * Generate answer from documents
   */
  private async generateAnswer(query: string, accessibleDocs: Document[]): Promise<string> {
    if (this.useRealLLM) {
      return this.generateAnswerWithLLM(query, accessibleDocs);
    } else {
      return this.generateAnswerWithTemplate(query, accessibleDocs);
    }
  }

  /**
   * Generate answer using template (mock LLM)
   */
  private generateAnswerWithTemplate(
    query: string,
    documents: Document[]
  ): string {
    // Simple template-based answer generation
    const docTitles = documents.map(d => d.title).join(', ');
    const answer = `Based on the documents "${docTitles}", here is what I found:\n\n`;

    // Extract relevant sections
    let relevantSections = '';
    for (const doc of documents) {
      const lines = doc.content.split('\n');
      for (const line of lines) {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          relevantSections += `- ${line.trim()}\n`;
        }
      }
    }

    if (relevantSections) {
      return answer + relevantSections;
    }

    return (
      answer +
      `The documents contain relevant information, but I couldn't extract a specific answer. ` +
      `Please review the source documents for more details.`
    );
  }

  /**
   * Generate answer using real LLM (OpenAI)
   */
  private async generateAnswerWithLLM(_query: string, _documents: Document[]): Promise<string> {
    // This would integrate with OpenAI API
    // For now, return a template response

    // In production, call OpenAI API here
    console.log('(Using mock LLM response)');

    return `Based on the provided documents, I can provide the following information. [This would be the actual LLM response]`;
  }

  /**
   * Extract relevant excerpt from document
   */
  private extractExcerpt(content: string, query: string, maxLength: number = 200): string {
    const lines = content.split('\n');
    let excerpt = '';

    for (const line of lines) {
      if (line.toLowerCase().includes(query.toLowerCase())) {
        excerpt += line + ' ';
        if (excerpt.length >= maxLength) {
          break;
        }
      }
    }

    if (!excerpt) {
      excerpt = content.substring(0, maxLength);
    }

    return excerpt.substring(0, maxLength) + (excerpt.length >= maxLength ? '...' : '');
  }
}

export default LLMQueryHandler;
