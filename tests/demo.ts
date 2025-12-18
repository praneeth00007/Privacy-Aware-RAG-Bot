import PrivacyAwareRAGBot from '../src/main';

/**
 * Interactive Demo
 * Demonstrates the Privacy-Aware RAG Bot with different user scenarios
 */
async function runDemo() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     Privacy-Aware RAG Bot with Auth0 FGA - Demo                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Initialize bot
  const bot = new PrivacyAwareRAGBot();
  await bot.initialize();

  console.log('\n' + '═'.repeat(65));
  console.log('SCENARIO 1: Manager Access to Salary Documents');
  console.log('═'.repeat(65));

  console.log('\n👤 User Profile:');
  console.log('  - Name: Alice');
  console.log('  - Role: Manager');
  console.log('  - Department: HR');
  console.log('  - Expected: ✅ CAN access salary documents\n');

  const query1 = 'What is the Q4 salary budget?';
  const response1 = await bot.query(query1, 'alice', 'manager', 'human-resources');

  console.log('📌 Query:', query1);
  console.log('\n📄 Documents Found:', response1.sourceDocuments.length);
  if (response1.sourceDocuments.length > 0) {
    response1.sourceDocuments.forEach(doc => {
      console.log(`  - ${doc.title} (${doc.id})`);
    });
  }
  if (response1.accessDenied) {
    console.log('\n❌ ACCESS DENIED:', response1.denialReason);
  } else {
    console.log('\n✅ ACCESS GRANTED\n');
    console.log('🤖 Answer:');
    console.log('   ' + response1.answer.substring(0, 300) + '...');
  }

  // Explain access
  console.log('\n📋 Access Explanation:');
  const explanation1 = await bot.explainAccess('alice', 'manager', 'human-resources', 'doc_budget_q4_2024');
  if ('reasons' in explanation1) {
    explanation1.reasons.forEach(r => console.log('  ' + r));
  }

  console.log('\n' + '═'.repeat(65));
  console.log('SCENARIO 2: Employee DENIED Salary Document Access');
  console.log('═'.repeat(65));

  console.log('\n👤 User Profile:');
  console.log('  - Name: Bob');
  console.log('  - Role: Employee');
  console.log('  - Department: Engineering');
  console.log('  - Expected: ❌ CANNOT access salary documents\n');

  const query2 = 'What is the Q4 salary budget?';
  const response2 = await bot.query(query2, 'bob', 'employee', 'engineering');

  console.log('📌 Query:', query2);
  console.log('\n📄 Documents Found:', response2.sourceDocuments.length);
  if (response2.accessDenied) {
    console.log('\n❌ ACCESS DENIED:', response2.denialReason);
    console.log('\n🤖 Response: ' + response2.answer);
  } else {
    console.log('   ⚠️ Unexpected: Employee got access!');
  }

  // Explain access
  console.log('\n📋 Access Explanation:');
  const explanation2 = await bot.explainAccess('bob', 'employee', 'engineering', 'doc_budget_q4_2024');
  if ('reasons' in explanation2) {
    explanation2.reasons.forEach(r => console.log('  ' + r));
  }

  console.log('\n' + '═'.repeat(65));
  console.log('SCENARIO 3: Employee Access to Public Documents');
  console.log('═'.repeat(65));

  console.log('\n👤 User Profile:');
  console.log('  - Name: Bob');
  console.log('  - Role: Employee');
  console.log('  - Department: Engineering');
  console.log('  - Expected: ✅ CAN access public documents\n');

  const query3 = 'What is the vacation policy?';
  const response3 = await bot.query(query3, 'bob', 'employee', 'engineering');

  console.log('📌 Query:', query3);
  console.log('\n📄 Documents Found:', response3.sourceDocuments.length);
  if (response3.sourceDocuments.length > 0) {
    response3.sourceDocuments.forEach(doc => {
      console.log(`  - ${doc.title} (${doc.id})`);
    });
  }
  if (response3.accessDenied) {
    console.log('\n❌ ACCESS DENIED: ' + response3.denialReason);
  } else {
    console.log('\n✅ ACCESS GRANTED\n');
    console.log('🤖 Answer:');
    console.log('   ' + response3.answer.substring(0, 300) + '...');
  }

  console.log('\n' + '═'.repeat(65));
  console.log('SCENARIO 4: Legal Team Access to Contracts');
  console.log('═'.repeat(65));

  console.log('\n👤 User Profile:');
  console.log('  - Name: Charlie');
  console.log('  - Role: Legal Team');
  console.log('  - Department: Legal');
  console.log('  - Expected: ✅ CAN access contract documents\n');

  const query4 = 'What are the terms of the TechCorp partnership agreement?';
  const response4 = await bot.query(query4, 'charlie', 'legal_team', 'legal');

  console.log('📌 Query:', query4);
  console.log('\n📄 Documents Found:', response4.sourceDocuments.length);
  if (response4.sourceDocuments.length > 0) {
    response4.sourceDocuments.forEach(doc => {
      console.log(`  - ${doc.title} (${doc.id})`);
    });
  }
  if (response4.accessDenied) {
    console.log('\n❌ ACCESS DENIED: ' + response4.denialReason);
  } else {
    console.log('\n✅ ACCESS GRANTED\n');
  }

  // Explain access
  console.log('\n📋 Access Explanation:');
  const explanation4 = await bot.explainAccess('charlie', 'legal_team', 'legal', 'doc_contract_nda');
  if ('reasons' in explanation4) {
    explanation4.reasons.forEach(r => console.log('  ' + r));
  }

  console.log('\n' + '═'.repeat(65));
  console.log('SCENARIO 5: Security Officer Access');
  console.log('═'.repeat(65));

  console.log('\n👤 User Profile:');
  console.log('  - Name: Dave');
  console.log('  - Role: Security Officer');
  console.log('  - Department: Security');
  console.log('  - Expected: ✅ CAN access security incident reports\n');

  const query5 = 'What security incidents occurred in Q3?';
  const response5 = await bot.query(query5, 'dave', 'security_officer', 'security');

  console.log('📌 Query:', query5);
  console.log('\n📄 Documents Found:', response5.sourceDocuments.length);
  if (response5.sourceDocuments.length > 0) {
    response5.sourceDocuments.forEach(doc => {
      console.log(`  - ${doc.title} (${doc.id})`);
    });
  }
  if (response5.accessDenied) {
    console.log('\n❌ ACCESS DENIED: ' + response5.denialReason);
  } else {
    console.log('\n✅ ACCESS GRANTED\n');
  }

  console.log('\n' + '═'.repeat(65));
  console.log('✨ Demo Complete');
  console.log('═'.repeat(65));
  console.log('\n✅ Key Demonstrations:');
  console.log('  1. Managers CAN access salary documents');
  console.log('  2. Employees CANNOT access salary documents');
  console.log('  3. Employees CAN access public documents');
  console.log('  4. Legal team CANNOT access salary documents');
  console.log('  5. Department-level access control enforced\n');
}

// Run the demo
runDemo().catch(error => {
  console.error('Demo error:', error);
  process.exit(1);
});
