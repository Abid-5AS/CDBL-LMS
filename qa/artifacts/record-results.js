/**
 * Quick result recorder for browser tests
 * Usage: node qa/artifacts/record-results.js
 */

const { addResult, generateSummary } = require('../../scripts/qa-browser-test');

// Record EMPLOYEE → /dashboard
addResult('EMPLOYEE', '/dashboard', ['Apply Leave', 'Leave Requests', 'Control Center']);

// Continue adding results here as tests are run...

generateSummary();

