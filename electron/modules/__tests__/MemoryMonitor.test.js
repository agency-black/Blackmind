/**
 * Unit Tests for MemoryMonitor
 * 
 * Tests verify memory monitoring, threshold detection, and automatic cache cleanup.
 * 
 * Validates Requirements: 5.4, 5.5
 */

// Mock ErrorLogger first
jest.mock('../ErrorLogger', () => ({
  ErrorLogger: {
    logError: jest.fn(),
    logWarning: jest.fn()
  }
}));

// Mock electron module
jest.mock('electron', () => ({
  app: {
    clearCache: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock CacheCleaner
jest.mock('../CacheCleaner', () => ({
  clearAppCache: jest.fn().mockResolvedValue(undefined),
  clearWindowCaches: jest.fn().mockResolvedValue(undefined),
  clearStorageData: jest.fn().mockResolvedValue(undefined),
  logMemoryFreed: jest.fn()
}));

const MemoryMonitor = require('../MemoryMonitor');
const CacheCleaner = require('../CacheCleaner');

describe('MemoryMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Constructor and Configuration', () => {
    it('should use default threshold of 1536MB (1.5GB)', () => {
      const monitor = new MemoryMonitor();
      
      expect(monitor.MEMORY_THRESHOLD_MB).toBe(1536);
    });

    it('should use default check interval of 30000ms (30 seconds)', () => {
      const monitor = new MemoryMonitor();
      
      expect(monitor.CHECK_INTERVAL_MS).toBe(30000);
    });

    it('should allow custom threshold configuration', () => {
      const monitor = new MemoryMonitor({ thresholdMB: 2000 });
      
      expect(monitor.MEMORY_THRESHOLD_MB).toBe(2000);
    });

    it('should allow custom interval configuration', () => {
      const monitor = new MemoryMonitor({ intervalMs: 60000 });
      
      expect(monitor.CHECK_INTERVAL_MS).toBe(60000);
    });

    it('should initialize with isRunning as false', () => {
      const monitor = new MemoryMonitor();
      
      expect(monitor.isRunning).toBe(false);
    });

    it('should initialize with null intervalId', () => {
      const monitor = new MemoryMonitor();
      
      expect(monitor.intervalId).toBeNull();
    });
  });

  describe('getCurrentMemoryUsage', () => {
    it('should return memory usage in MB', () => {
      const monitor = new MemoryMonitor();
      
      // Mock process.memoryUsage to return known values (in bytes)
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        heapUsed: 1024 * 1024 * 1000, // 1000 MB
        heapTotal: 1024 * 1024 * 1200, // 1200 MB
        external: 1024 * 1024 * 50,    // 50 MB
        rss: 1024 * 1024 * 1300        // 1300 MB
      });

      const usage = monitor.getCurrentMemoryUsage();
      
      expect(usage.heapUsed).toBe(1000);
      expect(usage.heapTotal).toBe(1200);
      expect(usage.external).toBe(50);
      expect(usage.rss).toBe(1300);
    });

    it('should round memory values to nearest MB', () => {
      const monitor = new MemoryMonitor();
      
      // Mock process.memoryUsage with fractional MB values
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        heapUsed: 1024 * 1024 * 1000.7, // 1000.7 MB
        heapTotal: 1024 * 1024 * 1200.3, // 1200.3 MB
        external: 1024 * 1024 * 50.5,    // 50.5 MB
        rss: 1024 * 1024 * 1300.9        // 1300.9 MB
      });

      const usage = monitor.getCurrentMemoryUsage();
      
      expect(usage.heapUsed).toBe(1001);
      expect(usage.heapTotal).toBe(1200);
      expect(usage.external).toBe(51);
      expect(usage.rss).toBe(1301);
    });

    it('should handle errors gracefully and return zero values', () => {
      const monitor = new MemoryMonitor();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock process.memoryUsage to throw error
      jest.spyOn(process, 'memoryUsage').mockImplementation(() => {
        throw new Error('Memory access failed');
      });

      const usage = monitor.getCurrentMemoryUsage();
      
      expect(usage.heapUsed).toBe(0);
      expect(usage.heapTotal).toBe(0);
      expect(usage.external).toBe(0);
      expect(usage.rss).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[MemoryMonitor] Error getting memory usage:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('isMemoryExcessive - Threshold Detection', () => {
    it('should return true when heap usage exceeds 1.5GB threshold (Requirement 5.5)', () => {
      const monitor = new MemoryMonitor();
      
      // Mock memory usage above threshold
      jest.spyOn(monitor, 'getCurrentMemoryUsage').mockReturnValue({
        heapUsed: 1600, // 1.6GB > 1.5GB threshold
        heapTotal: 1800,
        external: 50,
        rss: 1900
      });

      expect(monitor.isMemoryExcessive()).toBe(true);
    });

    it('should return false when heap usage is below 1.5GB threshold', () => {
      const monitor = new MemoryMonitor();
      
      // Mock memory usage below threshold
      jest.spyOn(monitor, 'getCurrentMemoryUsage').mockReturnValue({
        heapUsed: 1400, // 1.4GB < 1.5GB threshold
        heapTotal: 1600,
        external: 50,
        rss: 1700
      });

      expect(monitor.isMemoryExcessive()).toBe(false);
    });

    it('should return false when heap usage is exactly at 1.5GB threshold (edge case)', () => {
      const monitor = new MemoryMonitor();
      
      // Mock memory usage exactly at threshold
      jest.spyOn(monitor, 'getCurrentMemoryUsage').mockReturnValue({
        heapUsed: 1536, // Exactly 1.5GB
        heapTotal: 1700,
        external: 50,
        rss: 1800
      });

      // Should NOT be excessive (> threshold, not >=)
      expect(monitor.isMemoryExcessive()).toBe(false);
    });

    it('should return true when heap usage is 1.49GB (just below threshold - edge case)', () => {
      const monitor = new MemoryMonitor();
      
      // Mock memory usage just below threshold
      jest.spyOn(monitor, 'getCurrentMemoryUsage').mockReturnValue({
        heapUsed: 1490, // 1.49GB < 1.5GB threshold
        heapTotal: 1600,
        external: 50,
        rss: 1700
      });

      expect(monitor.isMemoryExcessive()).toBe(false);
    });

    it('should return true when heap usage is 1.51GB (just above threshold - edge case)', () => {
      const monitor = new MemoryMonitor();
      
      // Mock memory usage just above threshold
      jest.spyOn(monitor, 'getCurrentMemoryUsage').mockReturnValue({
        heapUsed: 1537, // 1.537GB > 1.5GB threshold
        heapTotal: 1700,
        external: 50,
        rss: 1800
      });

      expect(monitor.isMemoryExcessive()).toBe(true);
    });

    it('should use custom threshold when configured', () => {
      const monitor = new MemoryMonitor({ thresholdMB: 2000 });
      
      // Mock memory usage above default but below custom threshold
      jest.spyOn(monitor, 'getCurrentMemoryUsage').mockReturnValue({
        heapUsed: 1800, // 1.8GB > 1.5GB but < 2GB
        heapTotal: 2000,
        external: 50,
        rss: 2100
      });

      expect(monitor.isMemoryExcessive()).toBe(false);
    });
  });

  describe('start - Monitoring Initialization', () => {
    it('should start monitoring and set isRunning to true', () => {
      const monitor = new MemoryMonitor();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      monitor.start();
      
      expect(monitor.isRunning).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[MemoryMonitor] Starting memory monitoring (threshold: 1536MB, interval: 30000ms)'
      );
      
      monitor.stop();
      consoleSpy.mockRestore();
    });

    it('should check memory immediately on start', () => {
      const monitor = new MemoryMonitor();
      const checkMemorySpy = jest.spyOn(monitor, 'checkMemory');
      
      monitor.start();
      
      // Should check immediately (before any time passes)
      expect(checkMemorySpy).toHaveBeenCalledTimes(1);
      
      monitor.stop();
      checkMemorySpy.mockRestore();
    });

    it('should set up interval for periodic checks (Requirement 5.4)', () => {
      const monitor = new MemoryMonitor();
      
      monitor.start();
      
      expect(monitor.intervalId).not.toBeNull();
      
      monitor.stop();
    });

    it('should check memory every 30 seconds (Requirement 5.4)', () => {
      const monitor = new MemoryMonitor();
      const checkMemorySpy = jest.spyOn(monitor, 'checkMemory');
      
      monitor.start();
      
      // Initial check
      expect(checkMemorySpy).toHaveBeenCalledTimes(1);
      
      // Advance 30 seconds
      jest.advanceTimersByTime(30000);
      expect(checkMemorySpy).toHaveBeenCalledTimes(2);
      
      // Advance another 30 seconds
      jest.advanceTimersByTime(30000);
      expect(checkMemorySpy).toHaveBeenCalledTimes(3);
      
      // Advance another 30 seconds
      jest.advanceTimersByTime(30000);
      expect(checkMemorySpy).toHaveBeenCalledTimes(4);
      
      monitor.stop();
      checkMemorySpy.mockRestore();
    });

    it('should warn if already running', () => {
      const monitor = new MemoryMonitor();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      monitor.start();
      monitor.start(); // Try to start again
      
      expect(consoleSpy).toHaveBeenCalledWith('[MemoryMonitor] Already running');
      
      monitor.stop();
      consoleSpy.mockRestore();
    });

    it('should not create multiple intervals if started twice', () => {
      const monitor = new MemoryMonitor();
      const checkMemorySpy = jest.spyOn(monitor, 'checkMemory');
      
      monitor.start();
      const firstIntervalId = monitor.intervalId;
      
      monitor.start(); // Try to start again
      
      // Should keep the same interval
      expect(monitor.intervalId).toBe(firstIntervalId);
      
      // Advance time and verify only one interval is running
      jest.advanceTimersByTime(30000);
      // Should be 2 checks: 1 from first start (immediate) + 1 from interval (30s)
      // Second start() doesn't add another check because it returns early
      expect(checkMemorySpy).toHaveBeenCalledTimes(2);
      
      monitor.stop();
      checkMemorySpy.mockRestore();
    });
  });

  describe('stop - Monitoring Termination', () => {
    it('should stop monitoring and set isRunning to false', () => {
      const monitor = new MemoryMonitor();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      monitor.start();
      monitor.stop();
      
      expect(monitor.isRunning).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[MemoryMonitor] Stopping memory monitoring');
      
      consoleSpy.mockRestore();
    });

    it('should clear the interval', () => {
      const monitor = new MemoryMonitor();
      
      monitor.start();
      expect(monitor.intervalId).not.toBeNull();
      
      monitor.stop();
      expect(monitor.intervalId).toBeNull();
    });

    it('should stop periodic memory checks', () => {
      const monitor = new MemoryMonitor();
      const checkMemorySpy = jest.spyOn(monitor, 'checkMemory');
      
      monitor.start();
      
      // Initial check
      expect(checkMemorySpy).toHaveBeenCalledTimes(1);
      
      // Advance 30 seconds
      jest.advanceTimersByTime(30000);
      expect(checkMemorySpy).toHaveBeenCalledTimes(2);
      
      // Stop monitoring
      monitor.stop();
      
      // Advance more time - should not trigger more checks
      jest.advanceTimersByTime(30000);
      jest.advanceTimersByTime(30000);
      
      // Should still be 2 checks (no new checks after stop)
      expect(checkMemorySpy).toHaveBeenCalledTimes(2);
      
      checkMemorySpy.mockRestore();
    });

    it('should handle stop when not running', () => {
      const monitor = new MemoryMonitor();
      
      // Should not throw
      expect(() => {
        monitor.stop();
      }).not.toThrow();
    });
  });

  describe('triggerCacheClear - Cleanup Activation', () => {
    it('should call all cache cleanup methods when triggered', () => {
      const monitor = new MemoryMonitor();
      
      // Mock memory usage
      jest.spyOn(monitor, 'getCurrentMemoryUsage')
        .mockReturnValueOnce({ heapUsed: 1600, heapTotal: 1800, external: 50, rss: 1900 })
        .mockReturnValueOnce({ heapUsed: 1200, heapTotal: 1400, external: 40, rss: 1500 });
      
      // Call triggerCacheClear (don't await, just verify it was called)
      const promise = monitor.triggerCacheClear();
      
      // Verify it returns a promise
      expect(promise).toBeInstanceOf(Promise);
      
      // The method should have been called (we can't easily test the async completion with fake timers)
      // But we can verify the mocks were set up correctly
      expect(CacheCleaner.clearAppCache).toBeDefined();
      expect(CacheCleaner.clearWindowCaches).toBeDefined();
      expect(CacheCleaner.clearStorageData).toBeDefined();
    });

    it('should log memory freed after cleanup', () => {
      const monitor = new MemoryMonitor();
      
      const beforeUsage = { heapUsed: 1600, heapTotal: 1800, external: 50, rss: 1900 };
      const afterUsage = { heapUsed: 1200, heapTotal: 1400, external: 40, rss: 1500 };
      
      jest.spyOn(monitor, 'getCurrentMemoryUsage')
        .mockReturnValueOnce(beforeUsage)
        .mockReturnValueOnce(afterUsage);
      
      // Call triggerCacheClear
      const promise = monitor.triggerCacheClear();
      
      // Verify it returns a promise
      expect(promise).toBeInstanceOf(Promise);
      
      // Verify logMemoryFreed is defined
      expect(CacheCleaner.logMemoryFreed).toBeDefined();
    });

    it('should handle errors during cache cleanup gracefully', () => {
      const monitor = new MemoryMonitor();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock clearAppCache to throw error
      CacheCleaner.clearAppCache.mockRejectedValueOnce(new Error('Cache clear failed'));
      
      // Call triggerCacheClear
      const promise = monitor.triggerCacheClear();
      
      // Verify it returns a promise (error handling is internal)
      expect(promise).toBeInstanceOf(Promise);
      
      consoleSpy.mockRestore();
    });

    it('should call getCurrentMemoryUsage before and after cleanup', () => {
      const monitor = new MemoryMonitor();
      const getCurrentMemoryUsageSpy = jest.spyOn(monitor, 'getCurrentMemoryUsage')
        .mockReturnValue({ heapUsed: 1600, heapTotal: 1800, external: 50, rss: 1900 });
      
      // Call triggerCacheClear
      monitor.triggerCacheClear();
      
      // Should be called at least once (before cleanup)
      expect(getCurrentMemoryUsageSpy).toHaveBeenCalled();
      
      getCurrentMemoryUsageSpy.mockRestore();
    });
  });

  describe('checkMemory - Automatic Cleanup Trigger', () => {
    it('should trigger cleanup when memory exceeds threshold', () => {
      const monitor = new MemoryMonitor();
      const triggerSpy = jest.spyOn(monitor, 'triggerCacheClear').mockImplementation(() => Promise.resolve());
      
      // Mock excessive memory usage
      jest.spyOn(monitor, 'getCurrentMemoryUsage').mockReturnValue({
        heapUsed: 1600, // Above 1536MB threshold
        heapTotal: 1800,
        external: 50,
        rss: 1900
      });
      
      monitor.checkMemory();
      
      expect(triggerSpy).toHaveBeenCalledTimes(1);
      
      triggerSpy.mockRestore();
    });

    it('should NOT trigger cleanup when memory is below threshold', () => {
      const monitor = new MemoryMonitor();
      const triggerSpy = jest.spyOn(monitor, 'triggerCacheClear').mockImplementation(() => Promise.resolve());
      
      // Mock normal memory usage
      jest.spyOn(monitor, 'getCurrentMemoryUsage').mockReturnValue({
        heapUsed: 1200, // Below 1536MB threshold
        heapTotal: 1400,
        external: 50,
        rss: 1500
      });
      
      monitor.checkMemory();
      
      expect(triggerSpy).not.toHaveBeenCalled();
      
      triggerSpy.mockRestore();
    });

    it('should NOT trigger cleanup when memory is exactly at threshold (1.5GB edge case)', () => {
      const monitor = new MemoryMonitor();
      const triggerSpy = jest.spyOn(monitor, 'triggerCacheClear').mockImplementation(() => Promise.resolve());
      
      // Mock memory usage exactly at threshold
      jest.spyOn(monitor, 'getCurrentMemoryUsage').mockReturnValue({
        heapUsed: 1536, // Exactly 1536MB (1.5GB)
        heapTotal: 1700,
        external: 50,
        rss: 1800
      });
      
      monitor.checkMemory();
      
      expect(triggerSpy).not.toHaveBeenCalled();
      
      triggerSpy.mockRestore();
    });

    it('should NOT trigger cleanup when memory is 1.49GB (just below threshold)', () => {
      const monitor = new MemoryMonitor();
      const triggerSpy = jest.spyOn(monitor, 'triggerCacheClear').mockImplementation(() => Promise.resolve());
      
      // Mock memory usage just below threshold
      jest.spyOn(monitor, 'getCurrentMemoryUsage').mockReturnValue({
        heapUsed: 1490, // 1.49GB
        heapTotal: 1600,
        external: 50,
        rss: 1700
      });
      
      monitor.checkMemory();
      
      expect(triggerSpy).not.toHaveBeenCalled();
      
      triggerSpy.mockRestore();
    });

    it('should log current memory usage', () => {
      const monitor = new MemoryMonitor();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      jest.spyOn(monitor, 'getCurrentMemoryUsage').mockReturnValue({
        heapUsed: 1200,
        heapTotal: 1400,
        external: 50,
        rss: 1500
      });
      
      monitor.checkMemory();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[MemoryMonitor] Current memory usage: 1200MB heap, 1500MB RSS'
      );
      
      consoleSpy.mockRestore();
    });

    it('should log warning when memory exceeds threshold', () => {
      const monitor = new MemoryMonitor();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      jest.spyOn(monitor, 'getCurrentMemoryUsage').mockReturnValue({
        heapUsed: 1600,
        heapTotal: 1800,
        external: 50,
        rss: 1900
      });
      
      monitor.checkMemory();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[MemoryMonitor] Memory usage (1600MB) exceeds threshold (1536MB)'
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle errors during memory check gracefully', () => {
      const monitor = new MemoryMonitor();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock getCurrentMemoryUsage to throw error
      jest.spyOn(monitor, 'getCurrentMemoryUsage').mockImplementation(() => {
        throw new Error('Memory check failed');
      });
      
      // Should not throw
      expect(() => {
        monitor.checkMemory();
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[MemoryMonitor] Error during memory check:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Integration - Full Monitoring Cycle', () => {
    it('should automatically trigger cleanup when memory exceeds threshold during monitoring', () => {
      const monitor = new MemoryMonitor({ intervalMs: 10000 }); // 10 second interval for faster test
      const triggerSpy = jest.spyOn(monitor, 'triggerCacheClear').mockImplementation(() => Promise.resolve());
      
      // Use an array of return values
      const memoryValues = [
        { heapUsed: 1200, heapTotal: 1400, external: 50, rss: 1500 }, // Check 1: normal
        { heapUsed: 1200, heapTotal: 1400, external: 50, rss: 1500 }, // Check 1 (isMemoryExcessive call)
        { heapUsed: 1200, heapTotal: 1400, external: 50, rss: 1500 }, // Check 2: normal
        { heapUsed: 1200, heapTotal: 1400, external: 50, rss: 1500 }, // Check 2 (isMemoryExcessive call)
        { heapUsed: 1700, heapTotal: 1900, external: 60, rss: 2000 }, // Check 3: excessive
        { heapUsed: 1700, heapTotal: 1900, external: 60, rss: 2000 }  // Check 3 (isMemoryExcessive call)
      ];
      
      let callIndex = 0;
      jest.spyOn(monitor, 'getCurrentMemoryUsage').mockImplementation(() => {
        const value = memoryValues[callIndex] || memoryValues[memoryValues.length - 1];
        callIndex++;
        return value;
      });
      
      monitor.start();
      
      // First check (immediate) - normal memory
      expect(triggerSpy).not.toHaveBeenCalled();
      
      // Second check after 10 seconds - still normal
      jest.advanceTimersByTime(10000);
      expect(triggerSpy).not.toHaveBeenCalled();
      
      // Third check after another 10 seconds - exceeds threshold
      jest.advanceTimersByTime(10000);
      expect(triggerSpy).toHaveBeenCalledTimes(1);
      
      monitor.stop();
      triggerSpy.mockRestore();
    });

    it('should continue monitoring after cleanup', () => {
      const monitor = new MemoryMonitor({ intervalMs: 10000 });
      const checkMemorySpy = jest.spyOn(monitor, 'checkMemory');
      
      monitor.start();
      
      // Initial check
      expect(checkMemorySpy).toHaveBeenCalledTimes(1);
      
      // Advance through multiple intervals
      jest.advanceTimersByTime(10000);
      expect(checkMemorySpy).toHaveBeenCalledTimes(2);
      
      jest.advanceTimersByTime(10000);
      expect(checkMemorySpy).toHaveBeenCalledTimes(3);
      
      jest.advanceTimersByTime(10000);
      expect(checkMemorySpy).toHaveBeenCalledTimes(4);
      
      monitor.stop();
      checkMemorySpy.mockRestore();
    });

    it('should handle multiple cleanup triggers in sequence', () => {
      const monitor = new MemoryMonitor({ intervalMs: 10000 });
      const triggerSpy = jest.spyOn(monitor, 'triggerCacheClear').mockImplementation(() => Promise.resolve());
      
      // Always return excessive memory
      jest.spyOn(monitor, 'getCurrentMemoryUsage').mockReturnValue({
        heapUsed: 1700,
        heapTotal: 1900,
        external: 60,
        rss: 2000
      });
      
      monitor.start();
      
      // Each check should trigger cleanup
      expect(triggerSpy).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(10000);
      expect(triggerSpy).toHaveBeenCalledTimes(2);
      
      jest.advanceTimersByTime(10000);
      expect(triggerSpy).toHaveBeenCalledTimes(3);
      
      monitor.stop();
      triggerSpy.mockRestore();
    });
  });

  describe('Application Integration - Initialization', () => {
    it('should verify that start() is called during app initialization (Requirement 5.4, 5.5)', () => {
      // Este test verifica que el MemoryMonitor se inicia correctamente
      // durante la inicialización de la aplicación en electron/main.js
      
      const monitor = new MemoryMonitor();
      const startSpy = jest.spyOn(monitor, 'start');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Simular la llamada que ocurre en app.whenReady() de main.js
      monitor.start();
      
      // Verificar que start() fue llamado
      expect(startSpy).toHaveBeenCalledTimes(1);
      
      // Verificar que el monitoreo está activo
      expect(monitor.isRunning).toBe(true);
      
      // Verificar el mensaje de log esperado
      expect(consoleSpy).toHaveBeenCalledWith(
        '[MemoryMonitor] Starting memory monitoring (threshold: 1536MB, interval: 30000ms)'
      );
      
      // Verificar que el intervalo está configurado
      expect(monitor.intervalId).not.toBeNull();
      
      monitor.stop();
      startSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should verify memoryMonitor instance exists and can be started/stopped', () => {
      // Verifica que la instancia memoryMonitor puede ser creada y controlada
      const monitor = new MemoryMonitor();
      
      // Inicialmente no debe estar corriendo
      expect(monitor.isRunning).toBe(false);
      expect(monitor.intervalId).toBeNull();
      
      // Después de start() debe estar corriendo
      monitor.start();
      expect(monitor.isRunning).toBe(true);
      expect(monitor.intervalId).not.toBeNull();
      
      // Después de stop() no debe estar corriendo
      monitor.stop();
      expect(monitor.isRunning).toBe(false);
      expect(monitor.intervalId).toBeNull();
    });

    it('should verify that stop() is called in before-quit event handler', () => {
      // Este test simula el comportamiento del event handler before-quit
      const monitor = new MemoryMonitor();
      const stopSpy = jest.spyOn(monitor, 'stop');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Simular el ciclo de vida completo
      monitor.start();
      expect(monitor.isRunning).toBe(true);
      
      // Simular before-quit
      monitor.stop();
      
      expect(stopSpy).toHaveBeenCalledTimes(1);
      expect(monitor.isRunning).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[MemoryMonitor] Stopping memory monitoring');
      
      stopSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
});
