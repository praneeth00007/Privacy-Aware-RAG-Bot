import { User } from './auth0';
import Auth0FGAManager from './fga';
import { Document } from '../documents/store';

export interface AccessControlResult {
  allowed: boolean;
  reason?: string;
  deniedDocuments?: string[];
}

/**
 * Access Control Manager
 * Enforces document access based on user roles and FGA rules
 */
export class AccessControlManager {
  private fgaManager: Auth0FGAManager;
  private roleHierarchy: { [key: string]: string[] } = {
    admin: ['admin', 'manager', 'employee'],
    security_officer: ['security_officer', 'manager', 'employee'],
    legal_team: ['legal_team', 'manager', 'employee'],
    manager: ['manager', 'employee'],
    hr: ['manager', 'employee'],
    employee: ['employee'],
  };

  constructor(fgaManager: Auth0FGAManager) {
    this.fgaManager = fgaManager;
  }

  /**
   * Check if user can access a specific document
   */
  async canAccessDocument(
    user: User,
    document: Document,
    relation: string = 'viewer'
  ): Promise<AccessControlResult> {
    try {
      // First check role-based access
      const accessibleRoles = this.roleHierarchy[user.role] || ['employee'];

      // If document requires a specific role
      if (document.requiredRole && !accessibleRoles.includes(document.requiredRole)) {
        return {
          allowed: false,
          reason: `User role '${user.role}' does not have access to '${document.requiredRole}' documents`,
        };
      }

      // Check department-level access
      if (document.classification === 'restricted') {
        if (user.department !== document.department) {
          return {
            allowed: false,
            reason: `Document is restricted to ${document.department} department`,
          };
        }
      }

      // Perform FGA check (in production)
      try {
        const fgaAllowed = await this.fgaManager.checkAccess(user.id, document.id, relation);
        if (!fgaAllowed) {
          return {
            allowed: false,
            reason: `FGA check failed - user does not have '${relation}' access`,
          };
        }
      } catch (error) {
        // Log but don't fail - fall back to role-based checks
        console.warn('FGA check error, using fallback:', error);
      }

      // All checks passed
      return { allowed: true };
    } catch (error) {
      console.error('Access control check failed:', error);
      return {
        allowed: false,
        reason: 'Access control evaluation error',
      };
    }
  }

  /**
   * Filter documents to only those user can access
   */
  async filterAccessibleDocuments(
    user: User,
    documents: Document[],
    relation: string = 'viewer'
  ): Promise<Document[]> {
    const accessChecks = documents.map(doc =>
      this.canAccessDocument(user, doc, relation)
    );

    const results = await Promise.all(accessChecks);

    return documents.filter((_, index) => results[index].allowed);
  }

  /**
   * Get document access explanation (for debugging/logging)
   */
  async explainAccess(
    user: User,
    document: Document
  ): Promise<{ allowed: boolean; reasons: string[] }> {
    const reasons: string[] = [];
    let allowed = true;

    // Check role
    const accessibleRoles = this.roleHierarchy[user.role] || ['employee'];
    if (document.requiredRole && !accessibleRoles.includes(document.requiredRole)) {
      allowed = false;
      reasons.push(
        `❌ Role check: '${user.role}' cannot access '${document.requiredRole}' documents`
      );
    } else {
      reasons.push(`✅ Role check: '${user.role}' can access this document type`);
    }

    // Check classification
    if (document.classification === 'public') {
      reasons.push(`✅ Classification: Document is public`);
    } else if (document.classification === 'internal') {
      reasons.push(`✅ Classification: Document is internal (available to all employees)`);
    } else if (document.classification === 'confidential') {
      if (user.role === 'manager') {
        reasons.push(`✅ Classification: User is manager, can access confidential docs`);
      } else {
        allowed = false;
        reasons.push(`❌ Classification: Confidential - only managers can access`);
      }
    } else if (document.classification === 'restricted') {
      if (user.department === document.department) {
        reasons.push(
          `✅ Department: User is in ${user.department}, document is restricted to same department`
        );
      } else {
        allowed = false;
        reasons.push(
          `❌ Department: Document restricted to ${document.department}, user is in ${user.department}`
        );
      }
    }

    // Check FGA (if configured)
    try {
      const fgaAllowed = await this.fgaManager.checkAccess(user.id, document.id);
      if (fgaAllowed) {
        reasons.push(`✅ FGA check: Passed`);
      } else {
        allowed = false;
        reasons.push(`❌ FGA check: Failed`);
      }
    } catch (error) {
      reasons.push(`⚠️ FGA check: Skipped (not configured)`);
    }

    return { allowed, reasons };
  }

  /**
   * Setup demo access rules
   */
  async setupDemoRules(): Promise<void> {
    try {
      const tuples = [
        // Alice (manager) can view salary documents
        { user: 'user:alice', relation: 'viewer', object: 'document:doc_budget_q4_2024' },
        // Bob (employee) cannot view salary documents
        // (no tuple created)

        // Charlie (legal) can view contracts
        { user: 'user:charlie', relation: 'viewer', object: 'document:doc_contract_nda' },

        // Everyone can view handbook and vacation policy
        { user: 'user:alice', relation: 'viewer', object: 'document:doc_employee_handbook' },
        { user: 'user:bob', relation: 'viewer', object: 'document:doc_employee_handbook' },
        { user: 'user:charlie', relation: 'viewer', object: 'document:doc_employee_handbook' },

        { user: 'user:alice', relation: 'viewer', object: 'document:doc_vacation_policy' },
        { user: 'user:bob', relation: 'viewer', object: 'document:doc_vacation_policy' },
        { user: 'user:charlie', relation: 'viewer', object: 'document:doc_vacation_policy' },

        // Dave (security) can view security incidents
        {
          user: 'user:dave',
          relation: 'viewer',
          object: 'document:doc_security_incident',
        },
      ];

      await this.fgaManager.writeBatch(tuples);
      console.log('Demo FGA rules configured');
    } catch (error) {
      console.warn('Could not setup FGA rules (FGA may not be configured):', error);
    }
  }
}

export default AccessControlManager;
