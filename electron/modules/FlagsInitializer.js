const { app } = require('electron');
const { ErrorLogger, ErrorCode } = require('./ErrorLogger');

/**
 * FlagsInitializer - Módulo para inicializar flags de Chromium para aceleración por hardware
 * 
 * Este módulo configura flags de Chromium antes de que la aplicación se inicialice
 * para optimizar el rendimiento en Mac M1 con memoria unificada.
 * 
 * IMPORTANTE: Debe llamarse ANTES de app.whenReady()
 */
class FlagsInitializer {
  /**
   * Inicializa todos los flags de aceleración por hardware
   * Configura flags de GPU para rasterización, zero-copy, y canvas 2D acelerado
   * 
   * Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  static initializePerformanceFlags() {
    try {
      // Enable GPU rasterization - Rasterización por GPU
      app.commandLine.appendSwitch('enable-gpu-rasterization');
      
      // Enable zero-copy - Optimización de transferencia de memoria
      app.commandLine.appendSwitch('enable-zero-copy');
      
      // Ignore GPU blocklist - Ignorar lista de bloqueo de GPU
      app.commandLine.appendSwitch('ignore-gpu-blocklist');
      
      // Enable accelerated 2D canvas - Canvas 2D acelerado
      app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
      
      // Disable software rasterizer - Forzar uso de GPU
      app.commandLine.appendSwitch('disable-software-rasterizer');
      
      // Consolidar features de aceleración
      const features = ['VaapiVideoDecoder'];
      if (process.platform === 'darwin') {
        features.push('Metal');
      }
      app.commandLine.appendSwitch('enable-features', features.join(','));
      
      console.log('[FlagsInitializer] Performance flags initialized successfully');
    } catch (error) {
      ErrorLogger.logError(
        ErrorCode.FLAG_PERFORMANCE_FAILED,
        'Failed to initialize performance flags',
        { error: error.message }
      );
    }
  }

  /**
   * Configura flags específicos para macOS/Metal
   * Solo se deben aplicar en plataforma macOS
   * 
   * Requisitos: 2.6, 7.4
   */
  static initializeMacOSFlags() {
    if (process.platform !== 'darwin') {
      console.log('[FlagsInitializer] Skipping macOS flags (not on macOS)');
      return;
    }

    try {
      // Enable Metal API - Usar Metal API de Apple
      app.commandLine.appendSwitch('enable-metal');
      
      console.log('[FlagsInitializer] macOS/Metal flags initialized successfully');
    } catch (error) {
      ErrorLogger.logError(
        ErrorCode.FLAG_MACOS_FAILED,
        'Failed to initialize macOS flags',
        { error: error.message }
      );
    }
  }

  /**
   * Configura límites de memoria y procesos
   * Limita el heap de V8 a 2GB y el número de procesos renderer a 3
   * 
   * Requisitos: 6.1, 6.2, 6.3, 6.4
   */
  static initializeMemoryLimits() {
    try {
      // Limit V8 heap to 2GB - Límite de heap de V8 a 2GB
      app.commandLine.appendSwitch('js-flags', '--max-old-space-size=2048');
      
      // Disable renderer backgrounding - Evitar throttling de renderers en background
      app.commandLine.appendSwitch('disable-renderer-backgrounding');
      
      // Disable background timer throttling - Mantener timers activos
      app.commandLine.appendSwitch('disable-background-timer-throttling');
      
      // Limit renderer processes to 3 - Limitar procesos renderer simultáneos a 3
      app.commandLine.appendSwitch('renderer-process-limit', '3');
      
      console.log('[FlagsInitializer] Memory limits initialized successfully');
    } catch (error) {
      ErrorLogger.logError(
        ErrorCode.FLAG_MEMORY_LIMITS_FAILED,
        'Failed to initialize memory limits',
        { error: error.message }
      );
    }
  }

  /**
   * Registra los flags activos para diagnóstico
   * Útil para verificar que las optimizaciones están aplicadas
   * 
   * Requisitos: 8.3
   */
  static logActiveFlags() {
    try {
      const flags = [
        'enable-gpu-rasterization',
        'enable-zero-copy',
        'ignore-gpu-blocklist',
        'enable-accelerated-2d-canvas',
        'disable-software-rasterizer',
        'enable-features',
        'js-flags',
        'disable-renderer-backgrounding',
        'disable-background-timer-throttling',
        'renderer-process-limit'
      ];

      if (process.platform === 'darwin') {
        flags.push('enable-metal');
      }

      console.log('[FlagsInitializer] Active Chromium flags:');
      flags.forEach(flag => {
        console.log(`  - ${flag}`);
      });
    } catch (error) {
      ErrorLogger.logWarning('Failed to log active flags', { error: error.message });
    }
  }
}

module.exports = FlagsInitializer;
