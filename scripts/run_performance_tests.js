#!/usr/bin/env node

/**
 * Performance Test Runner
 * 
 * Quick script to run automated performance tests.
 * Usage: node scripts/run_performance_tests.js [duration_seconds]
 */

const { spawn } = require('child_process');
const path = require('path');

const durationSeconds = parseInt(process.argv[2]) || 600; // Default 10 minutes

console.log(`
╔════════════════════════════════════════════════════════════╗
║         Electron Performance Test Runner                  ║
╚════════════════════════════════════════════════════════════╝

Test Duration: ${durationSeconds} seconds (${Math.round(durationSeconds / 60)} minutes)
Snapshot Interval: 5 seconds

Instructions:
1. The application will launch automatically
2. Performance metrics will be collected every 5 seconds
3. Interact with the app normally during the test:
   - Open and close the Dock panel
   - Create and switch between tabs
   - Scroll through content
   - Use search functionality
4. Results will be saved automatically when complete

Starting test in 3 seconds...
`);

setTimeout(() => {
  console.log('Launching application with performance monitoring...\n');
  
  // Set environment variable to enable performance testing
  const env = { ...process.env, PERFORMANCE_TEST: 'true', PERFORMANCE_TEST_DURATION: durationSeconds.toString() };
  
  // Launch the app
  const appProcess = spawn('npm', ['start'], {
    env,
    stdio: 'inherit',
    shell: true
  });

  appProcess.on('error', (error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });

  appProcess.on('exit', (code) => {
    console.log(`\nApplication exited with code ${code}`);
    console.log('Check the performance-reports directory for results.');
    process.exit(code);
  });

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\nStopping test...');
    appProcess.kill('SIGINT');
  });
}, 3000);
