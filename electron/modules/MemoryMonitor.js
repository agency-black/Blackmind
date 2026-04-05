/**
 * MemoryMonitor Module
 * 
 * Monitors memory usage and triggers automatic cache cleanup when memory exceeds threshold.
 * Designed for Mac M1 with 8GB unified memory architecture.
 * 
 * Requirements: 5.4, 5.5
 */

const { app } = require('electron');
const CacheCleaner = require('./CacheCleaner');

class MemoryMonitor {
  constructor(config = {}) {
    this.intervalId = null;
    this.MEMORY_THRESHOLD_MB = config.thresholdMB || 1536; // 1.5GB default
    this.CHECK_INTERVAL_MS = config.intervalMs || 30000; // 30 seconds default
    this.isRunning = false;
  }

  /**
   * Starts periodic memory monitoring
   * Checks memory usage every CHECK_INTERVAL_MS milliseconds
   */
  start() {
    if (this.isRunning) {
      console.warn('[MemoryMonitor] Already running');
      return;
    }

    console.log(`[MemoryMonitor] Starting memory monitoring (threshold: ${this.MEMORY_THRESHOLD_MB}MB, interval: ${this.CHECK_INTERVAL_MS}ms)`);
    
    this.isRunning = true;
    
    // Check immediately on start
    this.checkMemory();
    
    // Then check periodically
    this.intervalId = setInterval(() => {
      this.checkMemory();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Stops memory monitoring
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('[MemoryMonitor] Stopping memory monitoring');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
  }

  /**
   * Gets current memory usage
   * @returns {Object} Memory usage in MB
   */
  getCurrentMemoryUsage() {
    try {
      const usage = process.memoryUsage();
      
      return {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024),
        rss: Math.round(usage.rss / 1024 / 1024)
      };
    } catch (error) {
      console.error('[MemoryMonitor] Error getting memory usage:', error);
      return {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0
      };
    }
  }

  /**
   * Checks if memory usage exceeds threshold
   * @returns {boolean} True if memory is excessive
   */
  isMemoryExcessive() {
    const usage = this.getCurrentMemoryUsage();
    return usage.heapUsed > this.MEMORY_THRESHOLD_MB;
  }

  /**
   * Performs memory check and triggers cleanup if needed
   * @private
   */
  checkMemory() {
    try {
      const usage = this.getCurrentMemoryUsage();
      
      console.log(`[MemoryMonitor] Current memory usage: ${usage.heapUsed}MB heap, ${usage.rss}MB RSS`);
      
      if (this.isMemoryExcessive()) {
        console.warn(`[MemoryMonitor] Memory usage (${usage.heapUsed}MB) exceeds threshold (${this.MEMORY_THRESHOLD_MB}MB)`);
        this.triggerCacheClear();
      }
    } catch (error) {
      console.error('[MemoryMonitor] Error during memory check:', error);
    }
  }

  /**
   * Triggers cache cleanup
   * @private
   */
  async triggerCacheClear() {
    try {
      console.log('[MemoryMonitor] Triggering cache cleanup...');
      
      const beforeUsage = this.getCurrentMemoryUsage();
      
      // Perform cache cleanup
      await CacheCleaner.clearAppCache();
      await CacheCleaner.clearWindowCaches();
      await CacheCleaner.clearStorageData();
      
      // Wait a moment for memory to be freed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const afterUsage = this.getCurrentMemoryUsage();
      
      CacheCleaner.logMemoryFreed(beforeUsage, afterUsage);
      
    } catch (error) {
      console.error('[MemoryMonitor] Error during cache cleanup:', error);
    }
  }
}

module.exports = MemoryMonitor;
