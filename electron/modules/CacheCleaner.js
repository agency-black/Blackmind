/**
 * CacheCleaner Module
 * 
 * Handles cache cleanup and memory liberation for Electron application.
 * Preserves cookies and session data while clearing other storage.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.6, 5.7, 9.4
 */

const { app, BrowserWindow } = require('electron');

class CacheCleaner {
  /**
   * Clears the application cache
   */
  static async clearAppCache() {
    try {
      await app.clearCache();
      console.log('[CacheCleaner] App cache cleared');
    } catch (error) {
      console.error('[CacheCleaner] Error clearing app cache:', error);
      throw error;
    }
  }

  /**
   * Clears cache for all browser windows
   */
  static async clearWindowCaches() {
    try {
      const windows = BrowserWindow.getAllWindows();
      
      for (const window of windows) {
        if (window.webContents && window.webContents.session) {
          await window.webContents.session.clearCache();
        }
      }
      
      console.log(`[CacheCleaner] Cleared cache for ${windows.length} window(s)`);
    } catch (error) {
      console.error('[CacheCleaner] Error clearing window caches:', error);
      throw error;
    }
  }

  /**
   * Clears storage data selectively, preserving cookies and localStorage
   */
  static async clearStorageData() {
    try {
      const windows = BrowserWindow.getAllWindows();
      
      const storageOptions = {
        storages: [
          'appcache',
          'filesystem',
          'indexdb',
          'shadercache',
          'websql',
          'serviceworkers',
          'cachestorage'
        ]
        // Explicitly NOT including 'cookies' and 'localstorage' to preserve session
      };
      
      for (const window of windows) {
        if (window.webContents && window.webContents.session) {
          await window.webContents.session.clearStorageData(storageOptions);
        }
      }
      
      console.log('[CacheCleaner] Storage data cleared (cookies and localStorage preserved)');
    } catch (error) {
      console.error('[CacheCleaner] Error clearing storage data:', error);
      throw error;
    }
  }

  /**
   * Logs the amount of memory freed after cleanup
   * @param {Object} before - Memory usage before cleanup
   * @param {Object} after - Memory usage after cleanup
   */
  static logMemoryFreed(before, after) {
    const heapFreed = before.heapUsed - after.heapUsed;
    const rssFreed = before.rss - after.rss;
    
    console.log('[CacheCleaner] Memory cleanup results:');
    console.log(`  Heap: ${before.heapUsed}MB → ${after.heapUsed}MB (freed: ${heapFreed}MB)`);
    console.log(`  RSS: ${before.rss}MB → ${after.rss}MB (freed: ${rssFreed}MB)`);
  }
}

module.exports = CacheCleaner;
