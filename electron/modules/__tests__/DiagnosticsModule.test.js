/**
 * Unit Tests for DiagnosticsModule
 * 
 * Tests verify GPU information retrieval, feature status checking,
 * diagnostic report generation, and logging functionality.
 * 
 * Validates Requirements: 8.1, 8.3, 8.4, 8.5
 */

// Mock ErrorLogger first
jest.mock('../ErrorLogger', () => ({
  ErrorLogger: {
    logError: jest.fn(),
    logWarning: jest.fn()
  },
  ErrorCode: {
    GPU_INFO_UNAVAILABLE: 'GPU_001'
  }
}));

// Mock electron module
jest.mock('electron', () => ({
  app: {
    getGPUInfo: jest.fn(),
    getGPUFeatureStatus: jest.fn()
  }
}));

const DiagnosticsModule = require('../DiagnosticsModule');
const { ErrorLogger, ErrorCode } = require('../ErrorLogger');
const { app: mockApp } = require('electron');

describe('DiagnosticsModule', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockApp.getGPUInfo.mockClear();
    mockApp.getGPUFeatureStatus.mockClear();
    ErrorLogger.logError.mockClear();
    ErrorLogger.logWarning.mockClear();
  });

  describe('getGPUInfo', () => {
    it('should retrieve basic GPU information successfully', async () => {
      // Requirement 8.1: Obtener información de GPU
      const mockGPUInfo = {
        auxAttributes: {
          vendorId: '0x1002',
          deviceId: '0x67df',
          vendorString: 'AMD',
          deviceString: 'Radeon',
          driverVersion: '1.0.0'
        }
      };

      mockApp.getGPUInfo.mockResolvedValue(mockGPUInfo);

      const result = await DiagnosticsModule.getGPUInfo('basic');

      expect(mockApp.getGPUInfo).toHaveBeenCalledWith('basic');
      expect(result).toEqual(mockGPUInfo);
    });

    it('should retrieve complete GPU information successfully', async () => {
      // Requirement 8.1: Obtener información completa de GPU
      const mockGPUInfo = {
        auxAttributes: {
          vendorId: '0x1002',
          deviceId: '0x67df',
          vendorString: 'AMD',
          deviceString: 'Radeon Pro',
          driverVersion: '2.1.0',
          gpuMemorySize: 8192
        },
        gpuDevice: [
          { active: true, vendorId: 4098, deviceId: 26591 }
        ]
      };

      mockApp.getGPUInfo.mockResolvedValue(mockGPUInfo);

      const result = await DiagnosticsModule.getGPUInfo('complete');

      expect(mockApp.getGPUInfo).toHaveBeenCalledWith('complete');
      expect(result).toEqual(mockGPUInfo);
    });

    it('should default to basic info type when not specified', async () => {
      const mockGPUInfo = { auxAttributes: {} };
      mockApp.getGPUInfo.mockResolvedValue(mockGPUInfo);

      await DiagnosticsModule.getGPUInfo();

      expect(mockApp.getGPUInfo).toHaveBeenCalledWith('basic');
    });

    it('should handle errors gracefully and return null', async () => {
      // Requirement 9.4: Manejo de errores sin interrumpir
      mockApp.getGPUInfo.mockRejectedValue(new Error('GPU not available'));

      const result = await DiagnosticsModule.getGPUInfo('basic');

      expect(result).toBeNull();
      expect(ErrorLogger.logError).toHaveBeenCalledWith(
        ErrorCode.GPU_INFO_UNAVAILABLE,
        'Failed to get GPU information',
        expect.objectContaining({
          error: 'GPU not available'
        })
      );
    });

    it('should handle GPU blocklist errors', async () => {
      mockApp.getGPUInfo.mockRejectedValue(new Error('GPU is blocked'));

      const result = await DiagnosticsModule.getGPUInfo('complete');

      expect(result).toBeNull();
      expect(ErrorLogger.logError).toHaveBeenCalled();
    });
  });

  describe('getGPUFeatureStatus', () => {
    it('should retrieve GPU feature status successfully', () => {
      // Requirement 8.5: Obtener estado de características de GPU
      const mockFeatureStatus = {
        '2d_canvas': 'enabled_on',
        'gpu_compositing': 'enabled_on',
        'webgl': 'enabled_on',
        'webgl2': 'enabled_on',
        'video_decode': 'enabled_on',
        'rasterization': 'enabled_on',
        'multiple_raster_threads': 'enabled_on'
      };

      mockApp.getGPUFeatureStatus.mockReturnValue(mockFeatureStatus);

      const result = DiagnosticsModule.getGPUFeatureStatus();

      expect(mockApp.getGPUFeatureStatus).toHaveBeenCalled();
      expect(result).toEqual(mockFeatureStatus);
    });

    it('should include metal status on macOS', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      const mockFeatureStatus = {
        '2d_canvas': 'enabled_on',
        'gpu_compositing': 'enabled_on',
        'metal': 'enabled_on'
      };

      mockApp.getGPUFeatureStatus.mockReturnValue(mockFeatureStatus);

      const result = DiagnosticsModule.getGPUFeatureStatus();

      expect(result.metal).toBe('enabled_on');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should handle disabled features', () => {
      const mockFeatureStatus = {
        '2d_canvas': 'disabled_software',
        'gpu_compositing': 'disabled_off',
        'webgl': 'unavailable_off'
      };

      mockApp.getGPUFeatureStatus.mockReturnValue(mockFeatureStatus);

      const result = DiagnosticsModule.getGPUFeatureStatus();

      expect(result['2d_canvas']).toBe('disabled_software');
      expect(result.gpu_compositing).toBe('disabled_off');
      expect(result.webgl).toBe('unavailable_off');
    });

    it('should handle errors gracefully and return null', () => {
      // Requirement 9.4: Manejo de errores
      mockApp.getGPUFeatureStatus.mockImplementation(() => {
        throw new Error('Feature status unavailable');
      });

      const result = DiagnosticsModule.getGPUFeatureStatus();

      expect(result).toBeNull();
      expect(ErrorLogger.logError).toHaveBeenCalledWith(
        ErrorCode.GPU_INFO_UNAVAILABLE,
        'Failed to get GPU feature status',
        expect.objectContaining({
          error: 'Feature status unavailable'
        })
      );
    });
  });

  describe('generateDiagnosticReport', () => {
    beforeEach(() => {
      // Setup default mocks for report generation
      mockApp.getGPUInfo.mockResolvedValue({
        auxAttributes: {
          vendorId: '0x1002',
          deviceId: '0x67df',
          vendorString: 'AMD',
          deviceString: 'Radeon',
          driverVersion: '1.0.0'
        }
      });

      mockApp.getGPUFeatureStatus.mockReturnValue({
        '2d_canvas': 'enabled_on',
        'gpu_compositing': 'enabled_on',
        'rasterization': 'enabled_on'
      });
    });

    it('should generate complete diagnostic report', async () => {
      // Requirements 8.3, 8.4: Generar reporte completo
      const report = await DiagnosticsModule.generateDiagnosticReport();

      expect(report).toBeDefined();
      expect(report).toHaveProperty('platform');
      expect(report).toHaveProperty('arch');
      expect(report).toHaveProperty('electronVersion');
      expect(report).toHaveProperty('chromiumVersion');
      expect(report).toHaveProperty('nodeVersion');
      expect(report).toHaveProperty('v8Version');
      expect(report).toHaveProperty('gpuInfo');
      expect(report).toHaveProperty('gpuFeatureStatus');
      expect(report).toHaveProperty('memoryUsage');
      expect(report).toHaveProperty('activeFlags');
      expect(report).toHaveProperty('isHardwareAccelerated');
      expect(report).toHaveProperty('isMetalEnabled');
    });

    it('should include platform information', async () => {
      const report = await DiagnosticsModule.generateDiagnosticReport();

      expect(report.platform).toBe(process.platform);
      expect(report.arch).toBe(process.arch);
    });

    it('should include version information', async () => {
      const report = await DiagnosticsModule.generateDiagnosticReport();

      expect(report.electronVersion).toBe(process.versions.electron);
      expect(report.chromiumVersion).toBe(process.versions.chrome);
      expect(report.nodeVersion).toBe(process.versions.node);
      expect(report.v8Version).toBe(process.versions.v8);
    });

    it('should include GPU information', async () => {
      const report = await DiagnosticsModule.generateDiagnosticReport();

      expect(report.gpuInfo).toBeDefined();
      expect(report.gpuInfo.auxAttributes).toBeDefined();
      expect(mockApp.getGPUInfo).toHaveBeenCalledWith('complete');
    });

    it('should include GPU feature status', async () => {
      const report = await DiagnosticsModule.generateDiagnosticReport();

      expect(report.gpuFeatureStatus).toBeDefined();
      expect(report.gpuFeatureStatus['2d_canvas']).toBe('enabled_on');
      expect(mockApp.getGPUFeatureStatus).toHaveBeenCalled();
    });

    it('should include memory usage in MB', async () => {
      // Requirement 8.2: Registrar uso de memoria
      const report = await DiagnosticsModule.generateDiagnosticReport();

      expect(report.memoryUsage).toBeDefined();
      expect(report.memoryUsage).toHaveProperty('heapUsed');
      expect(report.memoryUsage).toHaveProperty('heapTotal');
      expect(report.memoryUsage).toHaveProperty('external');
      expect(report.memoryUsage).toHaveProperty('rss');

      // Values should be in MB (reasonable range)
      expect(report.memoryUsage.heapUsed).toBeGreaterThan(0);
      expect(report.memoryUsage.heapUsed).toBeLessThan(10000);
    });

    it('should include active flags list', async () => {
      // Requirement 8.3: Registrar flags activos
      const report = await DiagnosticsModule.generateDiagnosticReport();

      expect(report.activeFlags).toBeDefined();
      expect(Array.isArray(report.activeFlags)).toBe(true);
      expect(report.activeFlags).toContain('enable-gpu-rasterization');
      expect(report.activeFlags).toContain('enable-zero-copy');
      expect(report.activeFlags).toContain('js-flags=--max-old-space-size=2048');
    });

    it('should include Metal flag on macOS', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      const report = await DiagnosticsModule.generateDiagnosticReport();

      expect(report.activeFlags).toContain('enable-metal');
      expect(report.activeFlags).toContain('enable-features=Metal');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should NOT include Metal flag on non-macOS', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      const report = await DiagnosticsModule.generateDiagnosticReport();

      expect(report.activeFlags).not.toContain('enable-metal');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should detect hardware acceleration status', async () => {
      const report = await DiagnosticsModule.generateDiagnosticReport();

      expect(typeof report.isHardwareAccelerated).toBe('boolean');
      expect(report.isHardwareAccelerated).toBe(true);
    });

    it('should detect Metal enabled on macOS', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      mockApp.getGPUFeatureStatus.mockReturnValue({
        '2d_canvas': 'enabled_on',
        'metal': 'enabled_on'
      });

      const report = await DiagnosticsModule.generateDiagnosticReport();

      expect(report.isMetalEnabled).toBe(true);

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should return false for Metal on non-macOS', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });

      const report = await DiagnosticsModule.generateDiagnosticReport();

      expect(report.isMetalEnabled).toBe(false);

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should handle GPU info errors gracefully', async () => {
      mockApp.getGPUInfo.mockRejectedValue(new Error('GPU error'));

      const report = await DiagnosticsModule.generateDiagnosticReport();

      // Report should still be generated with null gpuInfo
      expect(report).toBeDefined();
      expect(report.gpuInfo).toBeNull();
      expect(ErrorLogger.logError).toHaveBeenCalledWith(
        ErrorCode.GPU_INFO_UNAVAILABLE,
        'Failed to get GPU information',
        expect.objectContaining({
          error: 'GPU error'
        })
      );
    });

    it('should handle feature status errors gracefully', async () => {
      mockApp.getGPUFeatureStatus.mockImplementation(() => {
        throw new Error('Feature status error');
      });

      const report = await DiagnosticsModule.generateDiagnosticReport();

      // Report should still be generated with null gpuFeatureStatus
      expect(report).toBeDefined();
      expect(report.gpuFeatureStatus).toBeNull();
      expect(ErrorLogger.logError).toHaveBeenCalledWith(
        ErrorCode.GPU_INFO_UNAVAILABLE,
        'Failed to get GPU feature status',
        expect.objectContaining({
          error: 'Feature status error'
        })
      );
    });
  });

  describe('logDiagnostics', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockApp.getGPUInfo.mockResolvedValue({
        auxAttributes: {
          vendorId: '0x1002',
          deviceId: '0x67df',
          vendorString: 'AMD',
          deviceString: 'Radeon',
          driverVersion: '1.0.0'
        }
      });

      mockApp.getGPUFeatureStatus.mockReturnValue({
        '2d_canvas': 'enabled_on',
        'gpu_compositing': 'enabled_on',
        'webgl': 'enabled_on',
        'webgl2': 'enabled_on',
        'video_decode': 'enabled_on',
        'rasterization': 'enabled_on',
        'multiple_raster_threads': 'enabled_on'
      });
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log diagnostic header', async () => {
      // Requirements 8.1, 8.3, 8.4, 8.5: Logging de diagnóstico
      await DiagnosticsModule.logDiagnostics();

      expect(consoleSpy).toHaveBeenCalledWith('\n========================================');
      expect(consoleSpy).toHaveBeenCalledWith('  ELECTRON PERFORMANCE DIAGNOSTICS');
      expect(consoleSpy).toHaveBeenCalledWith('========================================\n');
    });

    it('should log platform information', async () => {
      await DiagnosticsModule.logDiagnostics();

      expect(consoleSpy).toHaveBeenCalledWith('Platform Information:');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`OS: ${process.platform}`)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Electron:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Chromium:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Node.js:')
      );
    });

    it('should log memory usage', async () => {
      await DiagnosticsModule.logDiagnostics();

      expect(consoleSpy).toHaveBeenCalledWith('Memory Usage:');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Heap Used:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Heap Total:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('External:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('RSS:')
      );
    });

    it('should log GPU information', async () => {
      await DiagnosticsModule.logDiagnostics();

      expect(consoleSpy).toHaveBeenCalledWith('GPU Information:');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Vendor:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Device:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Driver:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Hardware Acceleration:')
      );
    });

    it('should log GPU feature status', async () => {
      await DiagnosticsModule.logDiagnostics();

      expect(consoleSpy).toHaveBeenCalledWith('GPU Feature Status:');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('2d_canvas')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('gpu_compositing')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('webgl')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('rasterization')
      );
    });

    it('should show checkmark for enabled features', async () => {
      await DiagnosticsModule.logDiagnostics();

      const enabledFeatureCalls = consoleSpy.mock.calls.filter(call =>
        call[0] && call[0].includes('✓') && call[0].includes('enabled')
      );

      expect(enabledFeatureCalls.length).toBeGreaterThan(0);
    });

    it('should show X mark for disabled features', async () => {
      mockApp.getGPUFeatureStatus.mockReturnValue({
        '2d_canvas': 'disabled_software',
        'gpu_compositing': 'disabled_off'
      });

      await DiagnosticsModule.logDiagnostics();

      const disabledFeatureCalls = consoleSpy.mock.calls.filter(call =>
        call[0] && call[0].includes('✗')
      );

      expect(disabledFeatureCalls.length).toBeGreaterThan(0);
    });

    it('should log Metal status on macOS', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      mockApp.getGPUFeatureStatus.mockReturnValue({
        '2d_canvas': 'enabled_on',
        'metal': 'enabled_on'
      });

      await DiagnosticsModule.logDiagnostics();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Metal API:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('metal')
      );

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should NOT log Metal status on non-macOS', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      await DiagnosticsModule.logDiagnostics();

      const metalCalls = consoleSpy.mock.calls.filter(call =>
        call[0] && call[0].includes('Metal API:')
      );

      expect(metalCalls.length).toBe(0);

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should log active Chromium flags', async () => {
      await DiagnosticsModule.logDiagnostics();

      expect(consoleSpy).toHaveBeenCalledWith('Active Chromium Flags:');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('enable-gpu-rasterization')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('enable-zero-copy')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('js-flags=--max-old-space-size=2048')
      );
    });

    it('should handle report generation errors gracefully', async () => {
      // Mock a failure in getGPUInfo which is called by generateDiagnosticReport
      mockApp.getGPUInfo.mockImplementation(() => {
        throw new Error('Report error');
      });

      await DiagnosticsModule.logDiagnostics();

      // Should log the error from getGPUInfo
      expect(ErrorLogger.logError).toHaveBeenCalledWith(
        ErrorCode.GPU_INFO_UNAVAILABLE,
        'Failed to get GPU information',
        expect.objectContaining({
          error: 'Report error'
        })
      );
    });

    it('should handle logging errors gracefully', async () => {
      consoleSpy.mockImplementation(() => {
        throw new Error('Console error');
      });

      await DiagnosticsModule.logDiagnostics();

      expect(ErrorLogger.logError).toHaveBeenCalledWith(
        ErrorCode.GPU_INFO_UNAVAILABLE,
        'Failed to log diagnostics',
        expect.objectContaining({
          error: 'Console error'
        })
      );
    });
  });

  describe('Private helper methods', () => {
    describe('_isHardwareAccelerated', () => {
      it('should return true when gpu_compositing is enabled', async () => {
        mockApp.getGPUFeatureStatus.mockReturnValue({
          'gpu_compositing': 'enabled_on',
          'rasterization': 'disabled',
          '2d_canvas': 'disabled'
        });

        mockApp.getGPUInfo.mockResolvedValue({});

        const report = await DiagnosticsModule.generateDiagnosticReport();

        expect(report.isHardwareAccelerated).toBe(true);
      });

      it('should return true when rasterization is enabled', async () => {
        mockApp.getGPUFeatureStatus.mockReturnValue({
          'gpu_compositing': 'disabled',
          'rasterization': 'enabled_on',
          '2d_canvas': 'disabled'
        });

        mockApp.getGPUInfo.mockResolvedValue({});

        const report = await DiagnosticsModule.generateDiagnosticReport();

        expect(report.isHardwareAccelerated).toBe(true);
      });

      it('should return true when 2d_canvas is enabled', async () => {
        mockApp.getGPUFeatureStatus.mockReturnValue({
          'gpu_compositing': 'disabled',
          'rasterization': 'disabled',
          '2d_canvas': 'enabled_on'
        });

        mockApp.getGPUInfo.mockResolvedValue({});

        const report = await DiagnosticsModule.generateDiagnosticReport();

        expect(report.isHardwareAccelerated).toBe(true);
      });

      it('should return false when all key features are disabled', async () => {
        mockApp.getGPUFeatureStatus.mockReturnValue({
          'gpu_compositing': 'disabled_off',
          'rasterization': 'disabled_software',
          '2d_canvas': 'unavailable_off'
        });

        mockApp.getGPUInfo.mockResolvedValue({});

        const report = await DiagnosticsModule.generateDiagnosticReport();

        expect(report.isHardwareAccelerated).toBe(false);
      });

      it('should return false when feature status is null', async () => {
        mockApp.getGPUFeatureStatus.mockReturnValue(null);
        mockApp.getGPUInfo.mockResolvedValue({});

        const report = await DiagnosticsModule.generateDiagnosticReport();

        expect(report.isHardwareAccelerated).toBe(false);
      });
    });

    describe('_isMetalEnabled', () => {
      it('should return true when Metal is enabled on macOS', async () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', { value: 'darwin' });

        mockApp.getGPUFeatureStatus.mockReturnValue({
          'metal': 'enabled_on'
        });

        mockApp.getGPUInfo.mockResolvedValue({});

        const report = await DiagnosticsModule.generateDiagnosticReport();

        expect(report.isMetalEnabled).toBe(true);

        Object.defineProperty(process, 'platform', { value: originalPlatform });
      });

      it('should return false when Metal is disabled on macOS', async () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', { value: 'darwin' });

        mockApp.getGPUFeatureStatus.mockReturnValue({
          'metal': 'disabled_off'
        });

        mockApp.getGPUInfo.mockResolvedValue({});

        const report = await DiagnosticsModule.generateDiagnosticReport();

        expect(report.isMetalEnabled).toBe(false);

        Object.defineProperty(process, 'platform', { value: originalPlatform });
      });

      it('should return false on non-macOS platforms', async () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', { value: 'win32' });

        mockApp.getGPUFeatureStatus.mockReturnValue({
          'metal': 'enabled_on'
        });

        mockApp.getGPUInfo.mockResolvedValue({});

        const report = await DiagnosticsModule.generateDiagnosticReport();

        expect(report.isMetalEnabled).toBe(false);

        Object.defineProperty(process, 'platform', { value: originalPlatform });
      });

      it('should return false when feature status is null', async () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', { value: 'darwin' });

        mockApp.getGPUFeatureStatus.mockReturnValue(null);
        mockApp.getGPUInfo.mockResolvedValue({});

        const report = await DiagnosticsModule.generateDiagnosticReport();

        expect(report.isMetalEnabled).toBe(false);

        Object.defineProperty(process, 'platform', { value: originalPlatform });
      });
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle multiple consecutive diagnostic calls', async () => {
      mockApp.getGPUInfo.mockResolvedValue({});
      mockApp.getGPUFeatureStatus.mockReturnValue({});

      await DiagnosticsModule.generateDiagnosticReport();
      await DiagnosticsModule.generateDiagnosticReport();
      const report = await DiagnosticsModule.generateDiagnosticReport();

      expect(report).toBeDefined();
      expect(mockApp.getGPUInfo).toHaveBeenCalledTimes(3);
    });

    it('should handle missing GPU attributes gracefully', async () => {
      mockApp.getGPUInfo.mockResolvedValue({
        auxAttributes: null
      });

      mockApp.getGPUFeatureStatus.mockReturnValue({});

      const report = await DiagnosticsModule.generateDiagnosticReport();

      expect(report).toBeDefined();
      expect(report.gpuInfo.auxAttributes).toBeNull();
    });

    it('should handle empty feature status', async () => {
      mockApp.getGPUInfo.mockResolvedValue({});
      mockApp.getGPUFeatureStatus.mockReturnValue({});

      const report = await DiagnosticsModule.generateDiagnosticReport();

      expect(report).toBeDefined();
      expect(report.isHardwareAccelerated).toBe(false);
    });

    it('should work correctly in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockApp.getGPUInfo.mockResolvedValue({});
      mockApp.getGPUFeatureStatus.mockReturnValue({});

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await DiagnosticsModule.logDiagnostics();

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle all methods in sequence without errors', async () => {
      mockApp.getGPUInfo.mockResolvedValue({});
      mockApp.getGPUFeatureStatus.mockReturnValue({});

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await expect(async () => {
        await DiagnosticsModule.getGPUInfo('basic');
        DiagnosticsModule.getGPUFeatureStatus();
        await DiagnosticsModule.generateDiagnosticReport();
        await DiagnosticsModule.logDiagnostics();
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});
