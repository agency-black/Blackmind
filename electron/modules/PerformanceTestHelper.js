/**
 * PerformanceTestHelper.js
 * 
 * Helper module for manual performance testing.
 * Provides utilities to stress test animations, monitor resources,
 * and generate performance reports.
 */

const { app } = require('electron');
const os = require('os');
const fs = require('fs');
const path = require('path');

class PerformanceTestHelper {
  constructor() {
    this.testStartTime = null;
    this.memorySnapshots = [];
    this.cpuSnapshots = [];
    this.testDuration = 0;
  }

  /**
   * Start a performance test session
   * @param {string} testName - Name of the test being run
   */
  startTest(testName) {
    this.testStartTime = Date.now();
    this.testName = testName;
    this.memorySnapshots = [];
    this.cpuSnapshots = [];
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Performance Test Started: ${testName}`);
    console.log(`Start Time: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(60)}\n`);
  }

  /**
   * Take a snapshot of current system metrics
   */
  takeSnapshot() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const timestamp = Date.now() - this.testStartTime;

    const snapshot = {
      timestamp,
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      system: {
        totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
        freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
        loadAverage: os.loadavg(),
      }
    };

    this.memorySnapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Get current memory usage in MB
   */
  getCurrentMemoryMB() {
    const memoryUsage = process.memoryUsage();
    return Math.round(memoryUsage.heapUsed / 1024 / 1024);
  }

  /**
   * Check if memory is under threshold
   * @param {number} thresholdMB - Threshold in MB (default 1536 = 1.5GB)
   */
  isMemoryUnderThreshold(thresholdMB = 1536) {
    return this.getCurrentMemoryMB() < thresholdMB;
  }

  /**
   * End the test and generate report
   */
  endTest() {
    this.testDuration = Date.now() - this.testStartTime;
    const report = this.generateReport();
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Performance Test Completed: ${this.testName}`);
    console.log(`Duration: ${Math.round(this.testDuration / 1000)}s`);
    console.log(`${'='.repeat(60)}\n`);
    
    return report;
  }

  /**
   * Generate a detailed performance report
   */
  generateReport() {
    if (this.memorySnapshots.length === 0) {
      return { error: 'No snapshots taken during test' };
    }

    const memoryValues = this.memorySnapshots.map(s => s.memory.heapUsed);
    const rssValues = this.memorySnapshots.map(s => s.memory.rss);

    const report = {
      testName: this.testName,
      duration: Math.round(this.testDuration / 1000), // seconds
      snapshotCount: this.memorySnapshots.length,
      memory: {
        heap: {
          min: Math.min(...memoryValues),
          max: Math.max(...memoryValues),
          avg: Math.round(memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length),
          final: memoryValues[memoryValues.length - 1],
        },
        rss: {
          min: Math.min(...rssValues),
          max: Math.max(...rssValues),
          avg: Math.round(rssValues.reduce((a, b) => a + b, 0) / rssValues.length),
          final: rssValues[rssValues.length - 1],
        },
        underThreshold: memoryValues.every(v => v < 1536),
        peakUsage: Math.max(...memoryValues),
        thresholdBreaches: memoryValues.filter(v => v >= 1536).length,
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        electronVersion: process.versions.electron,
        totalMemory: Math.round(os.totalmem() / 1024 / 1024),
      },
      snapshots: this.memorySnapshots,
    };

    return report;
  }

  /**
   * Save report to file
   */
  saveReport(report, filename) {
    const reportsDir = path.join(app.getPath('userData'), 'performance-reports');
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filepath = path.join(reportsDir, filename || `report-${Date.now()}.json`);
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    
    console.log(`Report saved to: ${filepath}`);
    return filepath;
  }

  /**
   * Print a formatted report to console
   */
  printReport(report) {
    console.log('\n' + '='.repeat(60));
    console.log('PERFORMANCE TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Test: ${report.testName}`);
    console.log(`Duration: ${report.duration}s`);
    console.log(`Snapshots: ${report.snapshotCount}`);
    console.log('\nMemory Usage (Heap):');
    console.log(`  Min: ${report.memory.heap.min} MB`);
    console.log(`  Max: ${report.memory.heap.max} MB`);
    console.log(`  Avg: ${report.memory.heap.avg} MB`);
    console.log(`  Final: ${report.memory.heap.final} MB`);
    console.log('\nMemory Usage (RSS):');
    console.log(`  Min: ${report.memory.rss.min} MB`);
    console.log(`  Max: ${report.memory.rss.max} MB`);
    console.log(`  Avg: ${report.memory.rss.avg} MB`);
    console.log(`  Final: ${report.memory.rss.final} MB`);
    console.log('\nThreshold Analysis (1536 MB):');
    console.log(`  Under Threshold: ${report.memory.underThreshold ? 'YES ✓' : 'NO ✗'}`);
    console.log(`  Peak Usage: ${report.memory.peakUsage} MB`);
    console.log(`  Threshold Breaches: ${report.memory.thresholdBreaches}`);
    console.log('\nSystem Info:');
    console.log(`  Platform: ${report.system.platform}`);
    console.log(`  Architecture: ${report.system.arch}`);
    console.log(`  Node: ${report.system.nodeVersion}`);
    console.log(`  Electron: ${report.system.electronVersion}`);
    console.log(`  Total Memory: ${report.system.totalMemory} MB`);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Run an automated stress test
   * @param {number} durationSeconds - How long to run the test
   * @param {number} snapshotIntervalMs - How often to take snapshots
   */
  async runStressTest(durationSeconds = 600, snapshotIntervalMs = 5000) {
    this.startTest(`Stress Test - ${durationSeconds}s`);
    
    const snapshotInterval = setInterval(() => {
      const snapshot = this.takeSnapshot();
      console.log(`[${Math.round(snapshot.timestamp / 1000)}s] Heap: ${snapshot.memory.heapUsed} MB, RSS: ${snapshot.memory.rss} MB`);
    }, snapshotIntervalMs);

    return new Promise((resolve) => {
      setTimeout(() => {
        clearInterval(snapshotInterval);
        const report = this.endTest();
        this.printReport(report);
        resolve(report);
      }, durationSeconds * 1000);
    });
  }
}

module.exports = PerformanceTestHelper;
