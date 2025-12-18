import * as dotenv from 'dotenv';
import Auth0Manager from './auth/auth0';
import Auth0FGAManager from './auth/fga';
import AccessControlManager from './auth/access-control';
import DocumentStore from './documents/store';
import RAGRetriever from './rag/retriever';
import LLMQueryHandler from './llm/handler';
import { createSampleDocuments } from './documents/sample-docs';

// Load environment variables
dotenv.config();

export class PrivacyAwareRAGBot {
  private fgaManager: Auth0FGAManager;
  private accessControl: AccessControlManager;
  private documentStore: DocumentStore;
  private retriever: RAGRetriever;
  private queryHandler: LLMQueryHandler;

  constructor() {
    // Initialize Auth0
    const auth0Domain = process.env.AUTH0_DOMAIN || 'demo.auth0.com';
    const auth0ClientId = process.env.AUTH0_CLIENT_ID || 'demo-client-id';
    const auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET || 'demo-client-secret';

    // Auth0Manager available if needed for token operations
    new Auth0Manager(auth0Domain, auth0ClientId, auth0ClientSecret);

    // Initialize FGA
    const fgaApiUrl = process.env.AUTH0_FGA_API_URL || 'http://localhost:8080';
    const fgaStoreId = process.env.AUTH0_FGA_STORE_ID || 'demo-store';
    const fgaApiToken = process.env.AUTH0_FGA_API_TOKEN || 'demo-token';

    this.fgaManager = new Auth0FGAManager(fgaApiUrl, fgaStoreId, fgaApiToken);

    // Initialize components
    this.accessControl = new AccessControlManager(this.fgaManager);
    this.documentStore = new DocumentStore();
    this.retriever = new RAGRetriever(this.documentStore);
    this.queryHandler = new LLMQueryHandler(this.retriever, this.accessControl);
  }

  /**
   * Initialize the system with sample data
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Privacy-Aware RAG Bot...\n');

    // Load sample documents
    console.log('📚 Loading sample documents...');
    const docs = createSampleDocuments();
    for (const doc of docs) {
      this.documentStore.addDocument(doc);
    }
    console.log(`✅ Loaded ${docs.length} documents\n`);

    // Setup FGA demo rules
    await this.accessControl.setupDemoRules();
  }

  /**
   * Query the RAG bot
   */
  async query(queryText: string, userId: string, role: string, department: string) {
    // Create user (in production, extract from token)
    const user = { id: userId, email: `${userId}@company.com`, role, department };

    const response = await this.queryHandler.query({ query: queryText, user });
    return response;
  }

  /**
   * Get access explanation for debugging
   */
  async explainAccess(userId: string, role: string, department: string, docId: string) {
    const user = { id: userId, email: `${userId}@company.com`, role, department };
    const doc = this.documentStore.getDocument(docId);

    if (!doc) {
      return { error: 'Document not found' };
    }

    return await this.accessControl.explainAccess(user, doc);
  }

  /**
   * Get document store for testing
   */
  getDocumentStore(): DocumentStore {
    return this.documentStore;
  }

  /**
   * Get access control manager for testing
   */
  getAccessControl(): AccessControlManager {
    return this.accessControl;
  }
}

export default PrivacyAwareRAGBot;
