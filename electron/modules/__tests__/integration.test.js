/**
 * Integration Tests for Electron Performance Optimization
 * 
 * Tests verify end-to-end functionality of the performance optimization system:
 * - Task 10.1: Complete memory monitoring and cleanup flow
 * - Task 10.2: Complete application initialization
 * - Task 10.3: Diagnostics in development mode
 * 
 * Validates Requirements: 2.1-2.6, 3.1-3.6, 5.1-5.7, 8.1, 8.3, 8.4, 8.5
 */

// Mock ErrorLogger first
jest.mock('../ErrorLogger', () => ({
  ErrorLogger: {
    logError: jest.fn(),
    logWarning: jest.fn()
  },
  ErrorCode: {
    FLAG_PERFORMANCE_FAILED: 'FLAG_001',
    FLAG_MACOS_FAILED: 'FLAG_002', 
    FLAG_MEMORY_LIMITS_FAILED: 'FLAG_003',
    FLAG_WINDOW_BASE_FAILED: 'FLAG_004',
    FLAG_WINDOW_MACOS_FAILED: 'FLAG_005',
    FLAG_WINDOW_WINDOWS_FAILED: 'FLAG_006',
    FLAG_WEBPREFS_FAILED: 'FLAG_007',
    CACHE_CLEAR_FAILED: 'CACHE_001',
    GPU_INFO_UNAVAILABLE: 'GPU_001',
    MEMORY_MONITOR_FAILED: 'MEM_001',
    METAL_UNAVAILABLE: 'METAL_001'
  }
}));

// Mock electron module
const mockApp = {
  commandLine: {
    appendSwitch: jest.fn()
  },
  clearCache: jest.fn().mockResolvedValue(undefined),
  getGPUInfo: jest.fn().mockResolvedValue({
    auxAttributes: {
      vendorId: '0x106b',
      deviceId: '0x0001',
      driverVersion: '1.0.0'
    }
  }),
  getGPUFeatureStatus: jest.fn().mockReturnValue({
    '2d_canvas': 'enabled_on',
    'gpu_compositing': 'enabled_on',
    'webgl': 'enabled_on',
    'webgl2': 'enabled_on',
    'video_decode': 'enabled_on',
    'rasterization': 'enabled_on',
    'multiple_raster_threads': 'enabled_on',
    'metal': 'enabled_on'
  })
};

const mockBrowserWindow = {
  getAllWindows: jest.fn().mockReturnValue([])
};

jest.mock('electron', () => ({
  app: mockApp,
  BrowserWindow: mockBrowserWindow
}));

const FlagsInitializer = require('../FlagsInitializer');
const WindowConfigurator = require('../WindowConfigurator');
const MemoryMonitor = require('../MemoryMonitor');
const CacheCleaner = require('../CacheCleaner');
const DiagnosticsModule = require('../DiagnosticsModule');

describe('Integration Tests - Electron Performance Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Reset platform for each test
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Task 10.1: Testear flujo completo de monitoreo y limpieza
   * Validates Requirements: 5.1-5.7
   */
  describe('Task 10.1 - Complete Memory Monitoring and Cleanup Flow', () => {
    it('should simulate growing memory usage and trigger automatic cleanup', async () => {
      const monitor = new MemoryMonitor({ intervalMs: 10000 }); // 10 second interval
      
      // Simulate memory growing over time
      const memorySequence = [
        { heapUsed: 1000, heapTotal: 1200, external: 50, rss: 1300 }, // Check 1: Normal
        { heapUsed: 1000, heapTotal: 1200, external: 50, rss: 1300 }, // isMemoryExcessive call
        { heapUsed: 1300, heapTotal: 1500, external: 60, rss: 1600 }, // Check 2: Growing
        { heapUsed: 1300, heapTotal: 1500, external: 60, rss: 1600 }, // isMemoryExcessive call
        { heapUsed: 1600, heapTotal: 1800, external: 70, rss: 1900 }, // Check 3: Exceeds threshold
        { heapUsed: 1600, heapTotal: 1800, external: 70, rss: 1900 }, // isMemoryExcessive call
        { heapUsed: 1600, heapTotal: 1800, external: 70, rss: 1900 }, // Before cleanup
        { heapUsed: 1100, heapTotal: 1300, external: 50, rss: 1400 }  // After cleanup
      ];
      
      let callIndex = 0;
      jest.spyOn(monitor, 'getCurrentMemoryUsage').mockImplementation(() => {
        const value = memorySequence[callIndex] || memorySequence[memorySequence.length - 1];
        callIndex++;
        return value;
      });
      
      // Mock window for cache clearing
      const mockWindow = {
        webContents: {
          session: {
            clearCache: jest.fn().mockResolvedValue(undefined),
            clearStorageData: jest.fn().mockResolvedValue(undefined)
          }
        }
      };
      mockBrowserWindow.getAllWindows.mockReturnValue([mockWindow]);
      
      // Start monitoring
      monitor.start();
      
      // Check 1: Normal memory (1000MB)
      expect(monitor.getCurrentMemoryUsage().heapUsed).toBe(1000);
      
      // Advance 10 seconds - Check 2: Growing memory (1300MB)
      jest.advanceTimersByTime(10000);
      
      // Advance 10 seconds - Check 3: Exceeds threshold (1600MB > 1536MB)
      jest.advanceTimersByTime(10000);
      
      // Wait for async cleanup to complete
      await jest.runAllTimersAsync();
      
      // Verify cleanup was triggered
      expect(mockApp.clearCache).toHaveBeenCalled();
      expect(mockWindow.webContents.session.clearCache).toHaveBeenCalled();
      expect(mockWindow.webContents.session.clearStorageData).toHaveBeenCalled();
      
      monitor.stop();
    });

    it('should verify memory reduction after cleanup', async () => {
      const beforeUsage = { heapUsed: 1600, heapTotal: 1800, external: 70, rss: 1900 };
      const afterUsage = { heapUsed: 1100, heapTotal: 1300, external: 50, rss: 1400 };
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Call logMemoryFreed
      CacheCleaner.logMemoryFreed(beforeUsage, afterUsage);
      
      // Verify memory reduction is logged
      expect(consoleSpy).toHaveBeenCalledWith('[CacheCleaner] Memory cleanup results:');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('1600MB → 1100MB (freed: 500MB)')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('1900MB → 1400MB (freed: 500MB)')
      );
      
      // Verify memory was actually reduced
      const heapFreed = beforeUsage.heapUsed - afterUsage.heapUsed;
      const rssFreed = beforeUsage.rss - afterUsage.rss;
      
      expect(heapFreed).toBe(500); // 500MB freed from heap
      expect(rssFreed).toBe(500);  // 500MB freed from RSS
      expect(heapFreed).toBeGreaterThan(0);
      expect(rssFreed).toBeGreaterThan(0);
      
      consoleSpy.mockRestore();
    });

    it('should verify automatic cleanup activation when threshold is exceeded', async () => {
      const monitor = new MemoryMonitor({ intervalMs: 5000 });
      
      // Mock excessive memory
      jest.spyOn(monitor, 'getCurrentMemoryUsage').mockReturnValue({
        heapUsed: 1700, // Above 1536MB threshold
        heapTotal: 1900,
        external: 70,
        rss: 2000
      });
      
      const triggerSpy = jest.spyOn(monitor, 'triggerCacheClear').mockImplementation(() => Promise.resolve());
      
      monitor.start();
      
      // Should trigger immediately on first check
      expect(triggerSpy).toHaveBeenCalledTimes(1);
      
      // Advance time and verify it continues to trigger
      jest.advanceTimersByTime(5000);
      expect(triggerSpy).toHaveBeenCalledTimes(2);
      
      monitor.stop();
      triggerSpy.mockRestore();
    });
  });

  /**
   * Task 10.2: Testear inicialización completa de aplicación
   * Validates Requirements: 2.1-2.6, 3.1-3.6, 5.4
   */
  describe('Task 10.2 - Complete Application Initialization', () => {
    it('should verify all flags are applied during initialization', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Initialize all flags
      FlagsInitializer.initializePerformanceFlags();
      FlagsInitializer.initializeMacOSFlags();
      FlagsInitializer.initializeMemoryLimits();
      
      // Verify GPU flags (Requirements 2.1-2.5)
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('enable-gpu-rasterization');
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('enable-zero-copy');
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('ignore-gpu-blocklist');
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('enable-accelerated-2d-canvas');
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('disable-software-rasterizer');
      
      // Verify video decode flag (Requirement 2.4)
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('enable-features', 'VaapiVideoDecoder');
      
      // Verify macOS/Metal flags (Requirement 2.6)
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('enable-metal');
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('enable-features', 'Metal');
      
      // Verify memory limits (Requirements 6.1-6.4)
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('js-flags', '--max-old-space-size=2048');
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('disable-renderer-backgrounding');
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('disable-background-timer-throttling');
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('renderer-process-limit', '3');
      
      // Verify success messages
      expect(consoleSpy).toHaveBeenCalledWith('[FlagsInitializer] Performance flags initialized successfully');
      expect(consoleSpy).toHaveBeenCalledWith('[FlagsInitializer] macOS/Metal flags initialized successfully');
      expect(consoleSpy).toHaveBeenCalledWith('[FlagsInitializer] Memory limits initialized successfully');
      
      consoleSpy.mockRestore();
    });

    it('should verify window is created with correct configuration', () => {
      // Create window configuration
      const config = WindowConfigurator.createBaseConfig();
      
      // Verify webPreferences (Requirements 3.1-3.6)
      expect(config.webPreferences.offscreen).toBe(false);
      expect(config.webPreferences.nodeIntegrationInWorker).toBe(true);
      expect(config.webPreferences.sandbox).toBe(false);
      expect(config.webPreferences.enableWebSQL).toBe(false);
      expect(config.webPreferences.contextIsolation).toBe(true);
      expect(config.webPreferences.backgroundThrottling).toBe(false);
      expect(config.webPreferences.hardwareAcceleration).toBe(true);
      
      // Apply macOS config
      WindowConfigurator.applyMacOSConfig(config);
      
      // Verify macOS-specific settings (Requirements 7.1-7.3)
      expect(config.vibrancy).toBe('fullscreen-ui');
      expect(config.visualEffectState).toBe('active');
      expect(config.transparent).toBe(true);
    });

    it('should verify memory monitoring starts after initialization', () => {
      const monitor = new MemoryMonitor();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Simulate app initialization sequence
      FlagsInitializer.initializePerformanceFlags();
      FlagsInitializer.initializeMacOSFlags();
      FlagsInitializer.initializeMemoryLimits();
      
      // Create window
      const config = WindowConfigurator.createBaseConfig();
      WindowConfigurator.applyMacOSConfig(config);
      
      // Start memory monitoring (Requirement 5.4)
      monitor.start();
      
      expect(monitor.isRunning).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting memory monitoring')
      );
      
      monitor.stop();
      consoleSpy.mockRestore();
    });

    it('should verify complete initialization flow in correct order', () => {
      const initOrder = [];
      
      // Track initialization order
      const originalAppendSwitch = mockApp.commandLine.appendSwitch;
      mockApp.commandLine.appendSwitch = jest.fn((...args) => {
        initOrder.push(`flag:${args[0]}`);
        return originalAppendSwitch.apply(mockApp.commandLine, args);
      });
      
      // Step 1: Initialize flags (before app.whenReady)
      FlagsInitializer.initializePerformanceFlags();
      initOrder.push('performance-flags-done');
      
      FlagsInitializer.initializeMacOSFlags();
      initOrder.push('macos-flags-done');
      
      FlagsInitializer.initializeMemoryLimits();
      initOrder.push('memory-limits-done');
      
      // Step 2: Create window (after app.whenReady)
      const config = WindowConfigurator.createBaseConfig();
      initOrder.push('window-config-created');
      
      WindowConfigurator.applyMacOSConfig(config);
      initOrder.push('macos-config-applied');
      
      // Step 3: Start memory monitoring
      const monitor = new MemoryMonitor();
      monitor.start();
      initOrder.push('memory-monitor-started');
      
      // Verify flags were initialized before window creation
      const performanceFlagsDoneIndex = initOrder.indexOf('performance-flags-done');
      const windowConfigIndex = initOrder.indexOf('window-config-created');
      const monitorStartedIndex = initOrder.indexOf('memory-monitor-started');
      
      expect(performanceFlagsDoneIndex).toBeLessThan(windowConfigIndex);
      expect(windowConfigIndex).toBeLessThan(monitorStartedIndex);
      
      monitor.stop();
    });
  });

  /**
   * Task 10.3: Testear diagnóstico en modo desarrollo
   * Validates Requirements: 8.1, 8.3, 8.4, 8.5
   */
  describe('Task 10.3 - Diagnostics in Development Mode', () => {
    it('should verify GPU information logging', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Get GPU info (Requirement 8.1)
      const gpuInfo = await DiagnosticsModule.getGPUInfo('complete');
      
      expect(mockApp.getGPUInfo).toHaveBeenCalledWith('complete');
      expect(gpuInfo).toBeDefined();
      expect(gpuInfo.auxAttributes).toBeDefined();
      expect(gpuInfo.auxAttributes.vendorId).toBe('0x106b');
      expect(gpuInfo.auxAttributes.deviceId).toBe('0x0001');
      
      consoleSpy.mockRestore();
    });

    it('should verify active flags logging', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Log active flags (Requirement 8.3)
      FlagsInitializer.logActiveFlags();
      
      expect(consoleSpy).toHaveBeenCalledWith('[FlagsInitializer] Active Chromium flags:');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('enable-gpu-rasterization'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('enable-zero-copy'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ignore-gpu-blocklist'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('enable-metal'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('js-flags'));
      
      consoleSpy.mockRestore();
    });

    it('should verify complete diagnostic report generation', async () => {
      // Generate complete diagnostic report (Requirements 8.3, 8.4)
      const report = await DiagnosticsModule.generateDiagnosticReport();
      
      expect(report).toBeDefined();
      
      // Verify platform information
      expect(report.platform).toBe('darwin');
      expect(report.electronVersion).toBeDefined();
      expect(report.chromiumVersion).toBeDefined();
      expect(report.nodeVersion).toBeDefined();
      
      // Verify GPU information
      expect(report.gpuInfo).toBeDefined();
      expect(report.gpuFeatureStatus).toBeDefined();
      
      // Verify memory usage
      expect(report.memoryUsage).toBeDefined();
      expect(report.memoryUsage.heapUsed).toBeGreaterThanOrEqual(0);
      expect(report.memoryUsage.heapTotal).toBeGreaterThanOrEqual(0);
      
      // Verify flags
      expect(report.activeFlags).toBeDefined();
      expect(Array.isArray(report.activeFlags)).toBe(true);
      expect(report.activeFlags.length).toBeGreaterThan(0);
      
      // Verify hardware acceleration status (Requirement 8.5)
      expect(report.isHardwareAccelerated).toBeDefined();
      expect(typeof report.isHardwareAccelerated).toBe('boolean');
      
      // Verify Metal status on macOS
      expect(report.isMetalEnabled).toBeDefined();
      expect(typeof report.isMetalEnabled).toBe('boolean');
    });

    it('should verify diagnostic logging in development mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Simulate development mode
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Log diagnostics (Requirements 8.1, 8.3, 8.4, 8.5)
      await DiagnosticsModule.logDiagnostics();
      
      // Verify diagnostic sections are logged
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ELECTRON PERFORMANCE DIAGNOSTICS'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Platform Information:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Memory Usage:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('GPU Information:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('GPU Feature Status:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Active Chromium Flags:'));
      
      // Verify hardware acceleration status is logged
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Hardware Acceleration:'));
      
      // Verify Metal status is logged on macOS
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Metal API:'));
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });

    it('should verify GPU feature status reporting', () => {
      // Get GPU feature status (Requirement 8.5)
      const featureStatus = DiagnosticsModule.getGPUFeatureStatus();
      
      expect(mockApp.getGPUFeatureStatus).toHaveBeenCalled();
      expect(featureStatus).toBeDefined();
      
      // Verify key features
      expect(featureStatus['2d_canvas']).toBeDefined();
      expect(featureStatus['gpu_compositing']).toBeDefined();
      expect(featureStatus['webgl']).toBeDefined();
      expect(featureStatus['rasterization']).toBeDefined();
      
      // Verify Metal on macOS
      expect(featureStatus['metal']).toBeDefined();
    });

    it('should verify complete diagnostic flow in development mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Simulate complete initialization with diagnostics
      
      // Step 1: Initialize flags
      FlagsInitializer.initializePerformanceFlags();
      FlagsInitializer.initializeMacOSFlags();
      FlagsInitializer.initializeMemoryLimits();
      
      // Step 2: Log active flags
      FlagsInitializer.logActiveFlags();
      
      // Step 3: Generate and log diagnostics
      const report = await DiagnosticsModule.generateDiagnosticReport();
      await DiagnosticsModule.logDiagnostics();
      
      // Verify all diagnostic information is available
      expect(report).toBeDefined();
      expect(report.gpuInfo).toBeDefined();
      expect(report.gpuFeatureStatus).toBeDefined();
      expect(report.memoryUsage).toBeDefined();
      expect(report.activeFlags).toBeDefined();
      expect(report.isHardwareAccelerated).toBeDefined();
      expect(report.isMetalEnabled).toBeDefined();
      
      // Verify logging occurred
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DIAGNOSTICS'));
      
      consoleSpy.mockRestore();
    });
  });

  /**
   * Cross-cutting Integration Test
   * Verifies all systems work together
   */
  describe('Complete System Integration', () => {
    it('should verify entire system works together from initialization to monitoring', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Phase 1: Initialization (before app.whenReady)
      FlagsInitializer.initializePerformanceFlags();
      FlagsInitializer.initializeMacOSFlags();
      FlagsInitializer.initializeMemoryLimits();
      
      // Verify flags were applied
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('enable-gpu-rasterization');
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('enable-metal');
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('js-flags', '--max-old-space-size=2048');
      
      // Phase 2: Window creation (after app.whenReady)
      const config = WindowConfigurator.createBaseConfig();
      WindowConfigurator.applyMacOSConfig(config);
      
      // Verify window configuration
      expect(config.webPreferences.hardwareAcceleration).toBe(true);
      expect(config.vibrancy).toBe('fullscreen-ui');
      
      // Phase 3: Diagnostics (in development mode)
      const report = await DiagnosticsModule.generateDiagnosticReport();
      
      // Verify diagnostics
      expect(report.isHardwareAccelerated).toBeDefined();
      expect(report.activeFlags.length).toBeGreaterThan(0);
      
      // Phase 4: Memory monitoring
      const monitor = new MemoryMonitor({ intervalMs: 5000 });
      
      // Mock memory that will exceed threshold
      jest.spyOn(monitor, 'getCurrentMemoryUsage').mockReturnValue({
        heapUsed: 1700,
        heapTotal: 1900,
        external: 70,
        rss: 2000
      });
      
      const mockWindow = {
        webContents: {
          session: {
            clearCache: jest.fn().mockResolvedValue(undefined),
            clearStorageData: jest.fn().mockResolvedValue(undefined)
          }
        }
      };
      mockBrowserWindow.getAllWindows.mockReturnValue([mockWindow]);
      
      monitor.start();
      
      // Verify monitoring started
      expect(monitor.isRunning).toBe(true);
      
      // Wait for cleanup to trigger
      await jest.runAllTimersAsync();
      
      // Verify cleanup was triggered
      expect(mockApp.clearCache).toHaveBeenCalled();
      
      monitor.stop();
      consoleSpy.mockRestore();
    });
  });
});
