#!/usr/bin/env node

/**
 * Test Runner Script
 * Orchestrates all test suites and provides a unified testing interface
 */

const { spawn } = require('child_process');
const path = require('path');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const TENANT_ID = process.env.TENANT_ID || 'Bouchees';

const testSuites = [
  {
    name: 'Payment Intent Tests',
    file: 'test-payment-intent.js',
    description: 'Tests the new server-side price computation and items-based payment intent creation'
  },
  {
    name: 'Middleware Chain Tests',
    file: 'test-middleware-chains.js',
    description: 'Tests public/protected route middleware chains and tenant security'
  },
  {
    name: 'Tenant Security Tests',
    file: 'test-tenant-security.js',
    description: 'Tests tenant isolation, data leakage prevention, and security boundaries'
  },
  {
    name: 'Integration Tests',
    file: 'test-integration.js',
    description: 'End-to-end integration tests covering the complete flow'
  }
];

function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Running ${testFile}...`);
    console.log('=' .repeat(60));
    
    const child = spawn('node', [testFile], {
      stdio: 'inherit',
      env: {
        ...process.env,
        API_BASE_URL,
        TENANT_ID
      }
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${testFile} completed successfully`);
        resolve({ success: true, code });
      } else {
        console.log(`\n❌ ${testFile} failed with exit code ${code}`);
        resolve({ success: false, code });
      }
    });

    child.on('error', (error) => {
      console.log(`\n💥 ${testFile} failed with error: ${error.message}`);
      reject(error);
    });
  });
}

async function runAllTests() {
  console.log('🧪 Starting Comprehensive Test Suite');
  console.log('=' .repeat(60));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Tenant ID: ${TENANT_ID}`);
  console.log(`Test Suites: ${testSuites.length}`);
  
  const results = [];
  
  for (const suite of testSuites) {
    console.log(`\n📋 ${suite.name}`);
    console.log(`   ${suite.description}`);
    
    try {
      const result = await runTest(suite.file);
      results.push({
        name: suite.name,
        file: suite.file,
        success: result.success,
        code: result.code
      });
    } catch (error) {
      console.log(`💥 ${suite.name} crashed: ${error.message}`);
      results.push({
        name: suite.name,
        file: suite.file,
        success: false,
        code: -1,
        error: error.message
      });
    }
  }

  // Print summary
  console.log('\n📊 Test Results Summary');
  console.log('=' .repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const code = result.code !== undefined ? ` (exit code: ${result.code})` : '';
    const error = result.error ? ` - ${result.error}` : '';
    console.log(`${status} ${result.name}${code}${error}`);
  });
  
  console.log('\n📈 Overall Results:');
  console.log(`   Total: ${results.length}`);
  console.log(`   Passed: ${successful}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! The system is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above for details.');
    process.exit(1);
  }
}

async function runSpecificTest(testName) {
  const suite = testSuites.find(s => 
    s.name.toLowerCase().includes(testName.toLowerCase()) ||
    s.file.toLowerCase().includes(testName.toLowerCase())
  );
  
  if (!suite) {
    console.log(`❌ Test suite "${testName}" not found.`);
    console.log('Available test suites:');
    testSuites.forEach(s => console.log(`   - ${s.name} (${s.file})`));
    process.exit(1);
  }
  
  console.log(`🎯 Running specific test: ${suite.name}`);
  console.log(`   ${suite.description}`);
  
  try {
    const result = await runTest(suite.file);
    if (result.success) {
      console.log('\n🎉 Test completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Test failed.');
      process.exit(1);
    }
  } catch (error) {
    console.log(`\n💥 Test crashed: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log('🧪 Test Runner for Multi-Tenant Cafe Website');
  console.log('');
  console.log('Usage:');
  console.log('  node test-runner.js                    # Run all tests');
  console.log('  node test-runner.js <test-name>        # Run specific test');
  console.log('  node test-runner.js --help             # Show this help');
  console.log('');
  console.log('Available test suites:');
  testSuites.forEach(suite => {
    console.log(`  ${suite.file.padEnd(25)} - ${suite.name}`);
  });
  console.log('');
  console.log('Environment Variables:');
  console.log('  API_BASE_URL    - Backend API URL (default: http://localhost:4000)');
  console.log('  TENANT_ID       - Tenant ID for testing (default: Bouchees)');
  console.log('  AUTH_TOKEN      - Authentication token for protected routes');
  console.log('');
  console.log('Examples:');
  console.log('  node test-runner.js payment            # Run payment tests');
  console.log('  node test-runner.js middleware         # Run middleware tests');
  console.log('  node test-runner.js security           # Run security tests');
  console.log('  node test-runner.js integration        # Run integration tests');
  console.log('');
  console.log('  API_BASE_URL=http://staging.example.com node test-runner.js');
  console.log('  TENANT_ID=TestTenant node test-runner.js payment');
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

if (args.length === 0) {
  // Run all tests
  runAllTests().catch(error => {
    console.error('💥 Test runner failed:', error.message);
    process.exit(1);
  });
} else {
  // Run specific test
  const testName = args[0];
  runSpecificTest(testName).catch(error => {
    console.error('💥 Test runner failed:', error.message);
    process.exit(1);
  });
}
