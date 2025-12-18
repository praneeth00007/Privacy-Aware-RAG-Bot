import { Document } from './store';

/**
 * Sample documents for demonstration
 */
export const SAMPLE_DOCUMENTS: Document[] = [
  {
    id: 'doc_budget_q4_2024',
    title: 'Q4 2024 Salary Budget',
    content: `
      Q4 2024 Salary Budget Report
      
      This document contains sensitive salary information for all departments.
      Total budget allocation: $2.5M
      
      Department Allocations:
      - HR: $150K
      - Engineering: $800K
      - Sales: $600K
      - Marketing: $300K
      - Finance: $250K
      - Operations: $400K
      
      Individual salary ranges by level:
      - Manager: $120K - $150K
      - Senior Engineer: $140K - $180K
      - Engineer: $100K - $140K
      - Junior Engineer: $80K - $110K
    `,
    department: 'finance',
    classification: 'confidential',
    requiredRole: 'manager',
    tags: ['salary', 'budget', 'q4', 'confidential'],
    created: new Date('2024-10-01'),
    updated: new Date('2024-10-15'),
  },
  {
    id: 'doc_contract_nda',
    title: 'Master NDA Agreement - TechCorp Partnership',
    content: `
      MASTER NON-DISCLOSURE AGREEMENT
      
      This agreement is between our company and TechCorp Inc.
      Effective Date: January 1, 2024
      Expiration Date: December 31, 2026
      
      Key Terms:
      - Confidential Information is restricted to authorized personnel
      - Breach penalties: $500K per incident
      - Arbitration required for disputes
      - Non-compete clause: 2 years post-termination
      
      Authorized Personnel:
      - Executive leadership
      - Legal team
      - Deal managers
    `,
    department: 'legal',
    classification: 'restricted',
    requiredRole: 'legal_team',
    tags: ['contract', 'nda', 'partnership', 'legal'],
    created: new Date('2024-01-01'),
    updated: new Date('2024-09-20'),
  },
  {
    id: 'doc_employee_handbook',
    title: 'Company Employee Handbook 2024',
    content: `
      EMPLOYEE HANDBOOK 2024
      
      Welcome to our organization. This handbook provides guidelines for all employees.
      
      Core Values:
      - Integrity
      - Innovation
      - Collaboration
      - Excellence
      
      Key Policies:
      1. Work Hours: Standard 9-5, flexible arrangement available
      2. Remote Work: Up to 3 days/week approved by manager
      3. PTO: 20 days per year, plus 10 holidays
      4. Professional Development: $2K annual budget per employee
      5. Code of Conduct: Zero-tolerance for discrimination
      
      Benefits:
      - Health insurance (company pays 80%)
      - 401(k) matching up to 6%
      - Gym membership reimbursement ($50/month)
      - Parental leave: 16 weeks
    `,
    department: 'human-resources',
    classification: 'internal',
    tags: ['handbook', 'policy', 'benefits'],
    created: new Date('2024-01-15'),
    updated: new Date('2024-08-01'),
  },
  {
    id: 'doc_security_incident',
    title: 'Security Incident Report - Q3 2024',
    content: `
      CONFIDENTIAL SECURITY INCIDENT REPORT
      Q3 2024
      
      Summary of Incidents:
      
      1. SQL Injection Attempt (Aug 15)
         - Source: External IP address
         - Severity: Medium
         - Status: Blocked by WAF
         - Root cause: Outdated library
      
      2. Employee Credential Compromise (Sep 2)
         - Affected: 3 employee accounts
         - Severity: High
         - Status: Resolved
         - Action: Mandatory security training
      
      3. Data Exfiltration Attempt (Sep 18)
         - Source: Insider threat
         - Severity: Critical
         - Status: Under investigation
         - Employee: Under review
      
      Recommendations:
      - Update all dependencies
      - Enforce MFA company-wide
      - Implement DLP tools
    `,
    department: 'security',
    classification: 'restricted',
    requiredRole: 'security_officer',
    tags: ['security', 'incident', 'confidential'],
    created: new Date('2024-09-30'),
    updated: new Date('2024-10-05'),
  },
  {
    id: 'doc_product_roadmap',
    title: 'Product Roadmap 2025',
    content: `
      PRODUCT ROADMAP - 2025
      
      This document outlines our product strategy for 2025.
      
      Q1 2025 Goals:
      - Migrate to microservices architecture
      - Implement GraphQL API
      - Launch mobile app beta
      - Achieve 99.99% uptime SLA
      
      Q2 2025 Goals:
      - Launch ML-powered recommendations
      - Implement real-time notifications
      - Scale to 10M users
      - Expand to APAC market
      
      Q3 2025 Goals:
      - Enterprise features (SAML, SSO)
      - Advanced analytics dashboard
      - Integrate with competitors' data
      
      Q4 2025 Goals:
      - IPO preparation
      - Global expansion (EU compliance)
      - Strategic partnerships
      
      Budget: $5M
      Team Size: 45 engineers
    `,
    department: 'engineering',
    classification: 'internal',
    tags: ['roadmap', 'strategy', '2025'],
    created: new Date('2024-09-01'),
    updated: new Date('2024-10-10'),
  },
  {
    id: 'doc_vacation_policy',
    title: 'Vacation and Time Off Policy',
    content: `
      VACATION AND TIME OFF POLICY
      
      This policy applies to all employees.
      
      Annual Paid Time Off (PTO):
      - Year 1-2: 15 days
      - Year 3-5: 20 days
      - Year 6+: 25 days
      
      Holidays:
      - 10 company holidays per year
      - Additional floating holidays (2 days)
      
      Sick Leave:
      - Unlimited sick days (paid)
      - Requires manager notification
      
      Personal Days:
      - 2 days per year
      - Can carry over up to 5 days
      
      Request Process:
      1. Submit on HR portal 2 weeks in advance
      2. Get manager approval
      3. Add to team calendar
      
      Blackout Dates:
      - December 20 - January 2
      - July 1 - July 5
    `,
    department: 'human-resources',
    classification: 'public',
    tags: ['vacation', 'policy', 'time-off'],
    created: new Date('2024-01-10'),
    updated: new Date('2024-10-01'),
  },
];

/**
 * Create sample documents with proper metadata
 */
export function createSampleDocuments(): Document[] {
  return SAMPLE_DOCUMENTS.map(doc => ({
    ...doc,
    created: new Date(doc.created),
    updated: new Date(doc.updated),
  }));
}

/**
 * Get document by ID
 */
export function getSampleDocument(id: string): Document | undefined {
  return SAMPLE_DOCUMENTS.find(doc => doc.id === id);
}

/**
 * Filter documents by access level for a given role
 */
export function filterDocumentsByRole(role: string): Document[] {
  const roleHierarchy: { [key: string]: string[] } = {
    security_officer: ['security_officer', 'manager', 'employee'],
    legal_team: ['legal_team', 'manager', 'employee'],
    manager: ['manager', 'employee'],
    hr: ['manager', 'employee'],
    employee: ['employee'],
  };

  const accessibleRoles = roleHierarchy[role] || ['employee'];

  return SAMPLE_DOCUMENTS.filter(doc => {
    if (!doc.requiredRole) {
      // No role requirement = everyone can access
      return doc.classification !== 'restricted' && doc.classification !== 'confidential';
    }
    return accessibleRoles.includes(doc.requiredRole);
  });
}

export default SAMPLE_DOCUMENTS;
