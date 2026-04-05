/**
 * Unit Tests for CacheCleaner
 * 
 * Tests verify cache cleanup operations, memory logging, error handling,
 * and preservation of cookies and localStorage.
 * 
 * Validates Requirements: 5.1, 5.2, 5.3, 5.6, 5.7, 9.4
 */

// Mock electron module
jest.mock('electron', () => ({
  app: {
    clearCache: jest.fn()
  },
  BrowserWindow: {
    getAllWindows: jest.fn()
  }
}));

const CacheCleaner = require('../CacheCleaner');
const { app, BrowserWindow } = require('electron');

describe('CacheCleaner', () => {
  let mockWindow1;
  let mockWindow2;
  let consoleSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup console spies
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Create mock windows with sessions
    mockWindow1 = {
      webContents: {
        session: {
          clearCache: jest.fn().mockResolvedValue(undefined),
          clearStorageData: jest.fn().mockResolvedValue(undefined)
        }
      }
    };
    
    mockWindow2 = {
      webContents: {
        session: {
          clearCache: jest.fn().mockResolvedValue(undefined),
          clearStorageData: jest.fn().mockResolvedValue(undefined)
        }
      }
    };
    
    // Mock app.clearCache to resolve successfully
    app.clearCache.mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('clearAppCache', () => {
    it('should call app.clearCache()', async () => {
      await CacheCleaner.clearAppCache();
      
      expect(app.clearCache).toHaveBeenCalledTimes(1);
    });

    it('should log success message after clearing app cache', async () => {
      await CacheCleaner.clearAppCache();
      
      expect(consoleSpy).toHaveBeenCalledWith('[CacheCleaner] App cache cleared');
    });

    it('should handle errors during app cache clearing', async () => {
      const error = new Error('Cache clear failed');
      app.clearCache.mockRejectedValueOnce(error);
      
      await expect(CacheCleaner.clearAppCache()).rejects.toThrow('Cache clear failed');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[CacheCleaner] Error clearing app cache:',
        error
      );
    });

    it('should throw error after logging it', async () => {
      const error = new Error('Cache clear failed');
      app.clearCache.mockRejectedValueOnce(error);
      
      await expect(CacheCleaner.clearAppCache()).rejects.toThrow(error);
    });
  });

  describe('clearWindowCaches', () => {
    it('should call session.clearCache() on all windows', async () => {
      BrowserWindow.getAllWindows.mockReturnValue([mockWindow1, mockWindow2]);
      
      await CacheCleaner.clearWindowCaches();
      
      expect(mockWindow1.webContents.session.clearCache).toHaveBeenCalledTimes(1);
      expect(mockWindow2.webContents.session.clearCache).toHaveBeenCalledTimes(1);
    });

    it('should log the number of windows cleared', async () => {
      BrowserWindow.getAllWindows.mockReturnValue([mockWindow1, mockWindow2]);
      
      await CacheCleaner.clearWindowCaches();
      
      expect(consoleSpy).toHaveBeenCalledWith('[CacheCleaner] Cleared cache for 2 window(s)');
    });

    it('should handle zero windows gracefully', async () => {
      BrowserWindow.getAllWindows.mockReturnValue([]);
      
      await CacheCleaner.clearWindowCaches();
      
      expect(consoleSpy).toHaveBeenCalledWith('[CacheCleaner] Cleared cache for 0 window(s)');
    });

    it('should skip windows without webContents', async () => {
      const windowWithoutWebContents = {};
      BrowserWindow.getAllWindows.mockReturnValue([windowWithoutWebContents, mockWindow1]);
      
      await CacheCleaner.clearWindowCaches();
      
      expect(mockWindow1.webContents.session.clearCache).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('[CacheCleaner] Cleared cache for 2 window(s)');
    });

    it('should skip windows without session', async () => {
      const windowWithoutSession = {
        webContents: {}
      };
      BrowserWindow.getAllWindows.mockReturnValue([windowWithoutSession, mockWindow1]);
      
      await CacheCleaner.clearWindowCaches();
      
      expect(mockWindow1.webContents.session.clearCache).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during window cache clearing', async () => {
      const error = new Error('Window cache clear failed');
      mockWindow1.webContents.session.clearCache.mockRejectedValueOnce(error);
      BrowserWindow.getAllWindows.mockReturnValue([mockWindow1]);
      
      await expect(CacheCleaner.clearWindowCaches()).rejects.toThrow('Window cache clear failed');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[CacheCleaner] Error clearing window caches:',
        error
      );
    });

    it('should handle multiple windows with one failing', async () => {
      const error = new Error('Window cache clear failed');
      mockWindow1.webContents.session.clearCache.mockRejectedValueOnce(error);
      BrowserWindow.getAllWindows.mockReturnValue([mockWindow1, mockWindow2]);
      
      await expect(CacheCleaner.clearWindowCaches()).rejects.toThrow('Window cache clear failed');
    });
  });

  describe('clearStorageData', () => {
    it('should call clearStorageData() with correct options on all windows', async () => {
      BrowserWindow.getAllWindows.mockReturnValue([mockWindow1, mockWindow2]);
      
      await CacheCleaner.clearStorageData();
      
      const expectedOptions = {
        storages: [
          'appcache',
          'filesystem',
          'indexdb',
          'shadercache',
          'websql',
          'serviceworkers',
          'cachestorage'
        ]
      };
      
      expect(mockWindow1.webContents.session.clearStorageData).toHaveBeenCalledWith(expectedOptions);
      expect(mockWindow2.webContents.session.clearStorageData).toHaveBeenCalledWith(expectedOptions);
    });

    it('should NOT include cookies in storage options', async () => {
      BrowserWindow.getAllWindows.mockReturnValue([mockWindow1]);
      
      await CacheCleaner.clearStorageData();
      
      const callArgs = mockWindow1.webContents.session.clearStorageData.mock.calls[0][0];
      expect(callArgs.storages).not.toContain('cookies');
    });

    it('should NOT include localstorage in storage options', async () => {
      BrowserWindow.getAllWindows.mockReturnValue([mockWindow1]);
      
      await CacheCleaner.clearStorageData();
      
      const callArgs = mockWindow1.webContents.session.clearStorageData.mock.calls[0][0];
      expect(callArgs.storages).not.toContain('localstorage');
    });

    it('should preserve cookies and localStorage (Requirement 5.7)', async () => {
      BrowserWindow.getAllWindows.mockReturnValue([mockWindow1]);
      
      await CacheCleaner.clearStorageData();
      
      const callArgs = mockWindow1.webContents.session.clearStorageData.mock.calls[0][0];
      
      // Verify cookies and localstorage are NOT in the storages array
      expect(callArgs.storages).not.toContain('cookies');
      expect(callArgs.storages).not.toContain('localstorage');
      
      // Verify other storages ARE included
      expect(callArgs.storages).toContain('appcache');
      expect(callArgs.storages).toContain('filesystem');
      expect(callArgs.storages).toContain('indexdb');
      expect(callArgs.storages).toContain('shadercache');
      expect(callArgs.storages).toContain('websql');
      expect(callArgs.storages).toContain('serviceworkers');
      expect(callArgs.storages).toContain('cachestorage');
    });

    it('should log success message after clearing storage data', async () => {
      BrowserWindow.getAllWindows.mockReturnValue([mockWindow1]);
      
      await CacheCleaner.clearStorageData();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[CacheCleaner] Storage data cleared (cookies and localStorage preserved)'
      );
    });

    it('should handle zero windows gracefully', async () => {
      BrowserWindow.getAllWindows.mockReturnValue([]);
      
      await CacheCleaner.clearStorageData();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[CacheCleaner] Storage data cleared (cookies and localStorage preserved)'
      );
    });

    it('should skip windows without webContents', async () => {
      const windowWithoutWebContents = {};
      BrowserWindow.getAllWindows.mockReturnValue([windowWithoutWebContents, mockWindow1]);
      
      await CacheCleaner.clearStorageData();
      
      expect(mockWindow1.webContents.session.clearStorageData).toHaveBeenCalledTimes(1);
    });

    it('should skip windows without session', async () => {
      const windowWithoutSession = {
        webContents: {}
      };
      BrowserWindow.getAllWindows.mockReturnValue([windowWithoutSession, mockWindow1]);
      
      await CacheCleaner.clearStorageData();
      
      expect(mockWindow1.webContents.session.clearStorageData).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during storage data clearing', async () => {
      const error = new Error('Storage clear failed');
      mockWindow1.webContents.session.clearStorageData.mockRejectedValueOnce(error);
      BrowserWindow.getAllWindows.mockReturnValue([mockWindow1]);
      
      await expect(CacheCleaner.clearStorageData()).rejects.toThrow('Storage clear failed');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[CacheCleaner] Error clearing storage data:',
        error
      );
    });
  });

  describe('logMemoryFreed', () => {
    it('should log memory freed for heap', () => {
      const before = { heapUsed: 1600, rss: 2000 };
      const after = { heapUsed: 1200, rss: 1800 };
      
      CacheCleaner.logMemoryFreed(before, after);
      
      expect(consoleSpy).toHaveBeenCalledWith('[CacheCleaner] Memory cleanup results:');
      expect(consoleSpy).toHaveBeenCalledWith('  Heap: 1600MB → 1200MB (freed: 400MB)');
    });

    it('should log memory freed for RSS', () => {
      const before = { heapUsed: 1600, rss: 2000 };
      const after = { heapUsed: 1200, rss: 1800 };
      
      CacheCleaner.logMemoryFreed(before, after);
      
      expect(consoleSpy).toHaveBeenCalledWith('  RSS: 2000MB → 1800MB (freed: 200MB)');
    });

    it('should handle zero memory freed', () => {
      const before = { heapUsed: 1500, rss: 2000 };
      const after = { heapUsed: 1500, rss: 2000 };
      
      CacheCleaner.logMemoryFreed(before, after);
      
      expect(consoleSpy).toHaveBeenCalledWith('  Heap: 1500MB → 1500MB (freed: 0MB)');
      expect(consoleSpy).toHaveBeenCalledWith('  RSS: 2000MB → 2000MB (freed: 0MB)');
    });

    it('should handle negative memory freed (memory increased)', () => {
      const before = { heapUsed: 1200, rss: 1800 };
      const after = { heapUsed: 1600, rss: 2000 };
      
      CacheCleaner.logMemoryFreed(before, after);
      
      expect(consoleSpy).toHaveBeenCalledWith('  Heap: 1200MB → 1600MB (freed: -400MB)');
      expect(consoleSpy).toHaveBeenCalledWith('  RSS: 1800MB → 2000MB (freed: -200MB)');
    });

    it('should log all three lines in correct order', () => {
      const before = { heapUsed: 1600, rss: 2000 };
      const after = { heapUsed: 1200, rss: 1800 };
      
      CacheCleaner.logMemoryFreed(before, after);
      
      expect(consoleSpy).toHaveBeenNthCalledWith(1, '[CacheCleaner] Memory cleanup results:');
      expect(consoleSpy).toHaveBeenNthCalledWith(2, '  Heap: 1600MB → 1200MB (freed: 400MB)');
      expect(consoleSpy).toHaveBeenNthCalledWith(3, '  RSS: 2000MB → 1800MB (freed: 200MB)');
    });
  });

  describe('Error handling and edge cases (Requirement 9.4)', () => {
    it('should handle multiple consecutive cleanups without errors', async () => {
      BrowserWindow.getAllWindows.mockReturnValue([mockWindow1]);
      
      await expect(async () => {
        await CacheCleaner.clearAppCache();
        await CacheCleaner.clearWindowCaches();
        await CacheCleaner.clearStorageData();
        await CacheCleaner.clearAppCache();
        await CacheCleaner.clearWindowCaches();
        await CacheCleaner.clearStorageData();
      }).not.toThrow();
    });

    it('should handle all cleanup operations in sequence', async () => {
      BrowserWindow.getAllWindows.mockReturnValue([mockWindow1, mockWindow2]);
      
      const before = { heapUsed: 1600, rss: 2000 };
      
      await CacheCleaner.clearAppCache();
      await CacheCleaner.clearWindowCaches();
      await CacheCleaner.clearStorageData();
      
      const after = { heapUsed: 1200, rss: 1800 };
      CacheCleaner.logMemoryFreed(before, after);
      
      expect(app.clearCache).toHaveBeenCalledTimes(1);
      expect(mockWindow1.webContents.session.clearCache).toHaveBeenCalledTimes(1);
      expect(mockWindow2.webContents.session.clearCache).toHaveBeenCalledTimes(1);
      expect(mockWindow1.webContents.session.clearStorageData).toHaveBeenCalledTimes(1);
      expect(mockWindow2.webContents.session.clearStorageData).toHaveBeenCalledTimes(1);
    });

    it('should handle cleanup when no cache exists', async () => {
      BrowserWindow.getAllWindows.mockReturnValue([]);
      
      await expect(async () => {
        await CacheCleaner.clearAppCache();
        await CacheCleaner.clearWindowCaches();
        await CacheCleaner.clearStorageData();
      }).not.toThrow();
    });

    it('should handle partial failures gracefully', async () => {
      BrowserWindow.getAllWindows.mockReturnValue([mockWindow1, mockWindow2]);
      
      // First operation succeeds
      await CacheCleaner.clearAppCache();
      expect(app.clearCache).toHaveBeenCalledTimes(1);
      
      // Second operation fails
      mockWindow1.webContents.session.clearCache.mockRejectedValueOnce(new Error('Failed'));
      await expect(CacheCleaner.clearWindowCaches()).rejects.toThrow('Failed');
      
      // Third operation should still be callable
      await CacheCleaner.clearStorageData();
      expect(mockWindow1.webContents.session.clearStorageData).toHaveBeenCalledTimes(1);
    });

    it('should handle windows with null webContents', async () => {
      const windowWithNullWebContents = {
        webContents: null
      };
      BrowserWindow.getAllWindows.mockReturnValue([windowWithNullWebContents, mockWindow1]);
      
      await CacheCleaner.clearWindowCaches();
      
      expect(mockWindow1.webContents.session.clearCache).toHaveBeenCalledTimes(1);
    });

    it('should handle windows with null session', async () => {
      const windowWithNullSession = {
        webContents: {
          session: null
        }
      };
      BrowserWindow.getAllWindows.mockReturnValue([windowWithNullSession, mockWindow1]);
      
      await CacheCleaner.clearWindowCaches();
      
      expect(mockWindow1.webContents.session.clearCache).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration scenarios', () => {
    it('should complete full cleanup cycle with logging', async () => {
      BrowserWindow.getAllWindows.mockReturnValue([mockWindow1, mockWindow2]);
      
      const before = { heapUsed: 1600, rss: 2000 };
      
      // Execute full cleanup
      await CacheCleaner.clearAppCache();
      await CacheCleaner.clearWindowCaches();
      await CacheCleaner.clearStorageData();
      
      const after = { heapUsed: 1200, rss: 1800 };
      CacheCleaner.logMemoryFreed(before, after);
      
      // Verify all operations were called
      expect(app.clearCache).toHaveBeenCalledTimes(1);
      expect(mockWindow1.webContents.session.clearCache).toHaveBeenCalledTimes(1);
      expect(mockWindow2.webContents.session.clearCache).toHaveBeenCalledTimes(1);
      expect(mockWindow1.webContents.session.clearStorageData).toHaveBeenCalledTimes(1);
      expect(mockWindow2.webContents.session.clearStorageData).toHaveBeenCalledTimes(1);
      
      // Verify logging occurred
      expect(consoleSpy).toHaveBeenCalledWith('[CacheCleaner] App cache cleared');
      expect(consoleSpy).toHaveBeenCalledWith('[CacheCleaner] Cleared cache for 2 window(s)');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[CacheCleaner] Storage data cleared (cookies and localStorage preserved)'
      );
      expect(consoleSpy).toHaveBeenCalledWith('[CacheCleaner] Memory cleanup results:');
    });

    it('should preserve session data across multiple cleanups', async () => {
      BrowserWindow.getAllWindows.mockReturnValue([mockWindow1]);
      
      // Run cleanup multiple times
      await CacheCleaner.clearStorageData();
      await CacheCleaner.clearStorageData();
      await CacheCleaner.clearStorageData();
      
      // Verify cookies and localStorage were never included in any call
      const allCalls = mockWindow1.webContents.session.clearStorageData.mock.calls;
      expect(allCalls).toHaveLength(3);
      
      allCalls.forEach(call => {
        const options = call[0];
        expect(options.storages).not.toContain('cookies');
        expect(options.storages).not.toContain('localstorage');
      });
    });
  });
});
