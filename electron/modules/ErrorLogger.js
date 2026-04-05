/**
 * ErrorLogger Module
 * 
 * Proporciona funciones centralizadas de logging de errores y advertencias
 * para el sistema de optimización de rendimiento de Electron.
 */

/**
 * Códigos de error del sistema
 * @enum {string}
 */
const ErrorCode = {
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

/**
 * Constantes de configuración de memoria
 */
const MemoryConstants = {
  // Umbral de memoria en MB (1.5GB)
  MEMORY_THRESHOLD_MB: 1536,
  
  // Intervalo de verificación de memoria en milisegundos (30 segundos)
  CHECK_INTERVAL_MS: 30000,
  
  // Límite máximo de heap de V8 en MB (2GB)
  MAX_OLD_SPACE_SIZE_MB: 2048,
  
  // Límite de procesos renderer simultáneos
  RENDERER_PROCESS_LIMIT: 3
}

/**
 * Estructura de log de error
 * @typedef {Object} ErrorLog
 * @property {ErrorCode} code - Código de error
 * @property {string} message - Mensaje descriptivo
 * @property {Date} timestamp - Marca de tiempo
 * @property {*} [context] - Contexto adicional opcional
 */

class ErrorLogger {
  /**
   * Registra un error con código y contexto
   * @param {ErrorCode} code - Código de error
   * @param {string} message - Mensaje descriptivo
   * @param {*} [context] - Contexto adicional opcional
   */
  static logError(code, message, context) {
    const error = {
      code,
      message,
      timestamp: new Date(),
      context
    }
    
    console.error(`[${error.code}] ${error.message}`, error.context || '')
  }
  
  /**
   * Registra una advertencia
   * @param {string} message - Mensaje de advertencia
   * @param {*} [context] - Contexto adicional opcional
   */
  static logWarning(message, context) {
    console.warn(`[WARNING] ${message}`, context || '')
  }
  
  /**
   * Registra información general
   * @param {string} message - Mensaje informativo
   * @param {*} [context] - Contexto adicional opcional
   */
  static logInfo(message, context) {
    console.log(`[INFO] ${message}`, context || '')
  }
}

module.exports = {
  ErrorLogger,
  ErrorCode,
  MemoryConstants
}
