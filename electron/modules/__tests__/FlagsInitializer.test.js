/**
 * Unit Tests for FlagsInitializer
 * 
 * Tests verify that Chromium flags are correctly applied for hardware acceleration,
 * memory limits, and platform-specific optimizations.
 * 
 * Validates Requirements: 2.1-2.6, 4.2, 6.1-6.4, 9.5
 */

// Mock ErrorLogger first
jest.mock('../ErrorLogger', () => ({
  ErrorLogger: {
    logError: jest.fn(),
    logWarning: jest.fn()
  }
}));

// Mock electron module with inline mock
jest.mock('electron', () => ({
  app: {
    commandLine: {
      appendSwitch: jest.fn()
    }
  }
}));

const FlagsInitializer = require('../FlagsInitializer');
const { ErrorLogger } = require('../ErrorLogger');
const { app: mockApp } = require('electron');

describe('FlagsInitializer', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockApp.commandLine.appendSwitch.mockClear();
    ErrorLogger.logError.mockClear();
    ErrorLogger.logWarning.mockClear();
  });

  describe('initializePerformanceFlags', () => {
    it('should apply enable-gpu-rasterization flag', () => {
      FlagsInitializer.initializePerformanceFlags();
      
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('enable-gpu-rasterization');
    });

    it('should apply enable-zero-copy flag', () => {
      FlagsInitializer.initializePerformanceFlags();
      
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('enable-zero-copy');
    });

    it('should apply ignore-gpu-blocklist flag', () => {
      FlagsInitializer.initializePerformanceFlags();
      
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('ignore-gpu-blocklist');
    });

    it('should apply enable-accelerated-2d-canvas flag', () => {
      FlagsInitializer.initializePerformanceFlags();
      
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('enable-accelerated-2d-canvas');
    });

    it('should apply disable-software-rasterizer flag', () => {
      FlagsInitializer.initializePerformanceFlags();
      
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('disable-software-rasterizer');
    });

    it('should apply VaapiVideoDecoder feature flag', () => {
      FlagsInitializer.initializePerformanceFlags();
      
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('enable-features', 'VaapiVideoDecoder');
    });

    it('should apply all GPU flags in a single call', () => {
      FlagsInitializer.initializePerformanceFlags();
      
      // Should have 6 calls total (5 individual flags + 1 feature flag)
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledTimes(6);
    });

    it('should NOT apply V-Sync related flags', () => {
      FlagsInitializer.initializePerformanceFlags();
      
      // Verify V-Sync flags are NOT applied (Requirement 4.2)
      expect(mockApp.commandLine.appendSwitch).not.toHaveBeenCalledWith('disable-frame-rate-limit');
      expect(mockApp.commandLine.appendSwitch).not.toHaveBeenCalledWith('disable-gpu-vsync');
    });

    it('should handle errors gracefully and log them', () => {
      // Mock appendSwitch to throw an error
      mockApp.commandLine.appendSwitch.mockImplementationOnce(() => {
        throw new Error('Invalid flag');
      });

      // Should not throw
      expect(() => {
        FlagsInitializer.initializePerformanceFlags();
      }).not.toThrow();

      // Should log the error
      expect(ErrorLogger.logError).toHaveBeenCalledWith(
        'FLAG_001',
        'Failed to initialize performance flags',
        expect.objectContaining({
          error: 'Invalid flag'
        })
      );
    });

    it('should log success message when flags are applied', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      FlagsInitializer.initializePerformanceFlags();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[FlagsInitializer] Performance flags initialized successfully'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('initializeMacOSFlags', () => {
    const originalPlatform = process.platform;

    afterEach(() => {
      // Restore original platform
      Object.defineProperty(process, 'platform', {
        value: originalPlatform
      });
    });

    it('should apply enable-metal flag on macOS', () => {
      // Mock macOS platform
      Object.defineProperty(process, 'platform', {
        value: 'darwin'
      });

      FlagsInitializer.initializeMacOSFlags();
      
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('enable-metal');
    });

    it('should apply Metal feature flag on macOS', () => {
      // Mock macOS platform
      Object.defineProperty(process, 'platform', {
        value: 'darwin'
      });

      FlagsInitializer.initializeMacOSFlags();
      
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('enable-features', 'Metal');
    });

    it('should NOT apply macOS flags on Windows', () => {
      // Mock Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });

      FlagsInitializer.initializeMacOSFlags();
      
      expect(mockApp.commandLine.appendSwitch).not.toHaveBeenCalled();
    });

    it('should NOT apply macOS flags on Linux', () => {
      // Mock Linux platform
      Object.defineProperty(process, 'platform', {
        value: 'linux'
      });

      FlagsInitializer.initializeMacOSFlags();
      
      expect(mockApp.commandLine.appendSwitch).not.toHaveBeenCalled();
    });

    it('should log skip message on non-macOS platforms', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Mock Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });

      FlagsInitializer.initializeMacOSFlags();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[FlagsInitializer] Skipping macOS flags (not on macOS)'
      );
      
      consoleSpy.mockRestore();
    });

    it('should log success message on macOS', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Mock macOS platform
      Object.defineProperty(process, 'platform', {
        value: 'darwin'
      });

      FlagsInitializer.initializeMacOSFlags();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[FlagsInitializer] macOS/Metal flags initialized successfully'
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully on macOS', () => {
      // Mock macOS platform
      Object.defineProperty(process, 'platform', {
        value: 'darwin'
      });

      // Mock appendSwitch to throw an error
      mockApp.commandLine.appendSwitch.mockImplementationOnce(() => {
        throw new Error('Metal not supported');
      });

      // Should not throw
      expect(() => {
        FlagsInitializer.initializeMacOSFlags();
      }).not.toThrow();

      // Should log the error with METAL_001 code
      expect(ErrorLogger.logError).toHaveBeenCalledWith(
        'FLAG_002',
        'Failed to initialize macOS flags',
        expect.objectContaining({
          error: 'Metal not supported'
        })
      );
    });
  });

  describe('initializeMemoryLimits', () => {
    it('should set V8 heap limit to 2048MB', () => {
      FlagsInitializer.initializeMemoryLimits();
      
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith(
        'js-flags',
        '--max-old-space-size=2048'
      );
    });

    it('should disable renderer backgrounding', () => {
      FlagsInitializer.initializeMemoryLimits();
      
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('disable-renderer-backgrounding');
    });

    it('should disable background timer throttling', () => {
      FlagsInitializer.initializeMemoryLimits();
      
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('disable-background-timer-throttling');
    });

    it('should limit renderer processes to 3', () => {
      FlagsInitializer.initializeMemoryLimits();
      
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('renderer-process-limit', '3');
    });

    it('should apply all memory limit flags', () => {
      FlagsInitializer.initializeMemoryLimits();
      
      // Should have 4 calls total
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledTimes(4);
    });

    it('should handle errors gracefully and log them', () => {
      // Mock appendSwitch to throw an error
      mockApp.commandLine.appendSwitch.mockImplementationOnce(() => {
        throw new Error('Invalid memory limit');
      });

      // Should not throw
      expect(() => {
        FlagsInitializer.initializeMemoryLimits();
      }).not.toThrow();

      // Should log the error
      expect(ErrorLogger.logError).toHaveBeenCalledWith(
        'FLAG_003',
        'Failed to initialize memory limits',
        expect.objectContaining({
          error: 'Invalid memory limit'
        })
      );
    });

    it('should log success message when limits are applied', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      FlagsInitializer.initializeMemoryLimits();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[FlagsInitializer] Memory limits initialized successfully'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('logActiveFlags', () => {
    it('should log all standard flags', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      FlagsInitializer.logActiveFlags();
      
      expect(consoleSpy).toHaveBeenCalledWith('[FlagsInitializer] Active Chromium flags:');
      expect(consoleSpy).toHaveBeenCalledWith('  - enable-gpu-rasterization');
      expect(consoleSpy).toHaveBeenCalledWith('  - enable-zero-copy');
      expect(consoleSpy).toHaveBeenCalledWith('  - ignore-gpu-blocklist');
      expect(consoleSpy).toHaveBeenCalledWith('  - enable-accelerated-2d-canvas');
      expect(consoleSpy).toHaveBeenCalledWith('  - disable-software-rasterizer');
      expect(consoleSpy).toHaveBeenCalledWith('  - enable-features');
      expect(consoleSpy).toHaveBeenCalledWith('  - js-flags');
      expect(consoleSpy).toHaveBeenCalledWith('  - disable-renderer-backgrounding');
      expect(consoleSpy).toHaveBeenCalledWith('  - disable-background-timer-throttling');
      expect(consoleSpy).toHaveBeenCalledWith('  - renderer-process-limit');
      
      consoleSpy.mockRestore();
    });

    it('should include enable-metal flag on macOS', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const originalPlatform = process.platform;
      
      // Mock macOS platform
      Object.defineProperty(process, 'platform', {
        value: 'darwin'
      });

      FlagsInitializer.logActiveFlags();
      
      expect(consoleSpy).toHaveBeenCalledWith('  - enable-metal');
      
      // Restore
      Object.defineProperty(process, 'platform', {
        value: originalPlatform
      });
      consoleSpy.mockRestore();
    });

    it('should NOT include enable-metal flag on non-macOS', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const originalPlatform = process.platform;
      
      // Mock Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });

      FlagsInitializer.logActiveFlags();
      
      expect(consoleSpy).not.toHaveBeenCalledWith('  - enable-metal');
      
      // Restore
      Object.defineProperty(process, 'platform', {
        value: originalPlatform
      });
      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Logging failed');
      });

      // Should not throw
      expect(() => {
        FlagsInitializer.logActiveFlags();
      }).not.toThrow();

      // Should log warning
      expect(ErrorLogger.logWarning).toHaveBeenCalledWith(
        'Failed to log active flags',
        expect.objectContaining({
          error: 'Logging failed'
        })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle multiple consecutive initializations without errors', () => {
      expect(() => {
        FlagsInitializer.initializePerformanceFlags();
        FlagsInitializer.initializePerformanceFlags();
        FlagsInitializer.initializeMemoryLimits();
        FlagsInitializer.initializeMemoryLimits();
      }).not.toThrow();
    });

    it('should handle all initializations in sequence', () => {
      expect(() => {
        FlagsInitializer.initializePerformanceFlags();
        FlagsInitializer.initializeMacOSFlags();
        FlagsInitializer.initializeMemoryLimits();
        FlagsInitializer.logActiveFlags();
      }).not.toThrow();
    });

    it('should not apply any invalid or deprecated flags', () => {
      FlagsInitializer.initializePerformanceFlags();
      FlagsInitializer.initializeMemoryLimits();
      
      // Verify no deprecated or invalid flags are applied
      const allCalls = mockApp.commandLine.appendSwitch.mock.calls;
      const invalidFlags = [
        'disable-frame-rate-limit',
        'disable-gpu-vsync',
        'force-gpu-mem-available-mb',
        'enable-unsafe-webgpu'
      ];
      
      allCalls.forEach(call => {
        expect(invalidFlags).not.toContain(call[0]);
      });
    });
  });
});
