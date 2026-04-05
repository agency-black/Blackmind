const { app } = require('electron');
const { ErrorLogger, ErrorCode } = require('./ErrorLogger');

/**
 * DiagnosticsModule - Módulo para diagnóstico de rendimiento y GPU
 * 
 * Proporciona funciones para obtener información de GPU, estado de características,
 * y generar reportes completos de diagnóstico del sistema.
 * 
 * Requisitos: 8.1, 8.3, 8.4, 8.5
 */
class DiagnosticsModule {
  /**
   * Obtiene información detallada de la GPU
   * Usa app.getGPUInfo() para obtener información completa de la GPU
   * 
   * @param {string} infoType - Tipo de información: 'basic' o 'complete'
   * @returns {Promise<Object>} Información de GPU
   * 
   * Requisito: 8.1
   */
  static async getGPUInfo(infoType = 'basic') {
    try {
      const gpuInfo = await app.getGPUInfo(infoType);
      return gpuInfo;
    } catch (error) {
      ErrorLogger.logError(
        ErrorCode.GPU_INFO_UNAVAILABLE,
        'Failed to get GPU information',
        { error: error.message }
      );
      return null;
    }
  }

  /**
   * Obtiene el estado de las características de GPU
   * Usa app.getGPUFeatureStatus() para verificar qué características están habilitadas
   * 
   * @returns {Object} Estado de características de GPU
   * 
   * Requisito: 8.5
   */
  static getGPUFeatureStatus() {
    try {
      const featureStatus = app.getGPUFeatureStatus();
      return featureStatus;
    } catch (error) {
      ErrorLogger.logError(
        ErrorCode.GPU_INFO_UNAVAILABLE,
        'Failed to get GPU feature status',
        { error: error.message }
      );
      return null;
    }
  }

  /**
   * Genera un reporte completo de diagnóstico del sistema
   * Incluye información de plataforma, versiones, GPU, memoria y flags activos
   * 
   * @returns {Promise<Object>} Reporte de diagnóstico completo
   * 
   * Requisitos: 8.3, 8.4
   */
  static async generateDiagnosticReport() {
    try {
      const gpuInfo = await this.getGPUInfo('complete');
      const gpuFeatureStatus = this.getGPUFeatureStatus();
      const memoryUsage = process.memoryUsage();

      // Convertir bytes a MB para mejor legibilidad
      const memoryUsageMB = {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024)
      };

      const report = {
        platform: process.platform,
        arch: process.arch,
        electronVersion: process.versions.electron,
        chromiumVersion: process.versions.chrome,
        nodeVersion: process.versions.node,
        v8Version: process.versions.v8,
        gpuInfo,
        gpuFeatureStatus,
        memoryUsage: memoryUsageMB,
        activeFlags: this._getActiveFlags(),
        isHardwareAccelerated: this._isHardwareAccelerated(gpuFeatureStatus),
        isMetalEnabled: this._isMetalEnabled(gpuFeatureStatus)
      };

      return report;
    } catch (error) {
      ErrorLogger.logError(
        ErrorCode.GPU_INFO_UNAVAILABLE,
        'Failed to generate diagnostic report',
        { error: error.message }
      );
      return null;
    }
  }

  /**
   * Registra información de diagnóstico en consola
   * Muestra un resumen formateado del estado del sistema
   * 
   * Requisitos: 8.1, 8.3, 8.4, 8.5
   */
  static async logDiagnostics() {
    try {
      console.log('\n========================================');
      console.log('  ELECTRON PERFORMANCE DIAGNOSTICS');
      console.log('========================================\n');

      const report = await this.generateDiagnosticReport();

      if (!report) {
        ErrorLogger.logWarning('Could not generate diagnostic report');
        return;
      }

      // Información de plataforma
      console.log('Platform Information:');
      console.log(`  OS: ${report.platform} (${report.arch})`);
      console.log(`  Electron: ${report.electronVersion}`);
      console.log(`  Chromium: ${report.chromiumVersion}`);
      console.log(`  Node.js: ${report.nodeVersion}`);
      console.log(`  V8: ${report.v8Version}\n`);

      // Información de memoria
      console.log('Memory Usage:');
      console.log(`  Heap Used: ${report.memoryUsage.heapUsed} MB`);
      console.log(`  Heap Total: ${report.memoryUsage.heapTotal} MB`);
      console.log(`  External: ${report.memoryUsage.external} MB`);
      console.log(`  RSS: ${report.memoryUsage.rss} MB\n`);

      // Información de GPU
      if (report.gpuInfo) {
        console.log('GPU Information:');
        if (report.gpuInfo.auxAttributes) {
          console.log(`  Vendor: ${report.gpuInfo.auxAttributes.vendorId || 'Unknown'}`);
          console.log(`  Device: ${report.gpuInfo.auxAttributes.deviceId || 'Unknown'}`);
          console.log(`  Driver: ${report.gpuInfo.auxAttributes.driverVersion || 'Unknown'}`);
        }
        console.log(`  Hardware Acceleration: ${report.isHardwareAccelerated ? 'ENABLED' : 'DISABLED'}`);
        if (process.platform === 'darwin') {
          console.log(`  Metal API: ${report.isMetalEnabled ? 'ENABLED' : 'DISABLED'}`);
        }
        console.log('');
      }

      // Estado de características de GPU
      if (report.gpuFeatureStatus) {
        console.log('GPU Feature Status:');
        const features = [
          '2d_canvas',
          'gpu_compositing',
          'webgl',
          'webgl2',
          'video_decode',
          'rasterization',
          'multiple_raster_threads'
        ];

        if (process.platform === 'darwin') {
          features.push('metal');
        }

        features.forEach(feature => {
          const status = report.gpuFeatureStatus[feature];
          if (status) {
            const statusIcon = status.includes('enabled') ? '✓' : '✗';
            console.log(`  ${statusIcon} ${feature}: ${status}`);
          }
        });
        console.log('');
      }

      // Flags activos
      console.log('Active Chromium Flags:');
      report.activeFlags.forEach(flag => {
        console.log(`  - ${flag}`);
      });

      console.log('\n========================================\n');
    } catch (error) {
      ErrorLogger.logError(
        ErrorCode.GPU_INFO_UNAVAILABLE,
        'Failed to log diagnostics',
        { error: error.message }
      );
    }
  }

  /**
   * Obtiene la lista de flags activos
   * @private
   * @returns {string[]} Lista de flags activos
   */
  static _getActiveFlags() {
    const flags = [
      'enable-gpu-rasterization',
      'enable-zero-copy',
      'ignore-gpu-blocklist',
      'enable-accelerated-2d-canvas',
      'disable-software-rasterizer',
      'enable-features=VaapiVideoDecoder',
      'js-flags=--max-old-space-size=2048',
      'disable-renderer-backgrounding',
      'disable-background-timer-throttling',
      'renderer-process-limit=3'
    ];

    if (process.platform === 'darwin') {
      flags.push('enable-metal');
      flags.push('enable-features=Metal');
    }

    return flags;
  }

  /**
   * Verifica si la aceleración por hardware está activa
   * @private
   * @param {Object} featureStatus - Estado de características de GPU
   * @returns {boolean} True si la aceleración está activa
   */
  static _isHardwareAccelerated(featureStatus) {
    if (!featureStatus) return false;

    // Verificar características clave de aceleración
    const keyFeatures = ['gpu_compositing', 'rasterization', '2d_canvas'];
    
    return keyFeatures.some(feature => {
      const status = featureStatus[feature];
      return status && status.includes('enabled');
    });
  }

  /**
   * Verifica si Metal está habilitado (solo macOS)
   * @private
   * @param {Object} featureStatus - Estado de características de GPU
   * @returns {boolean} True si Metal está habilitado
   */
  static _isMetalEnabled(featureStatus) {
    if (process.platform !== 'darwin') return false;
    if (!featureStatus) return false;

    const metalStatus = featureStatus.metal;
    return metalStatus && metalStatus.includes('enabled');
  }
}

module.exports = DiagnosticsModule;
