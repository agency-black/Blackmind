const path = require('path');
const { ErrorLogger, ErrorCode } = require('./ErrorLogger');

/**
 * WindowConfigurator - Módulo para configurar BrowserWindow con opciones optimizadas
 * 
 * Este módulo proporciona configuración optimizada de BrowserWindow para rendimiento
 * en Mac M1 con memoria unificada, incluyendo aceleración por hardware y efectos visuales.
 * 
 * Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.5, 7.1, 7.2, 7.3
 */
class WindowConfigurator {
  /**
   * Crea configuración base de ventana
   * Incluye dimensiones, frame, transparencia y webPreferences optimizadas
   * 
   * @returns {Object} Configuración base de BrowserWindow
   * Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.5
   */
  static createBaseConfig() {
    try {
      const config = {
        width: 1400,
        height: 700,
        minWidth: 1400,
        minHeight: 700,
        frame: false,
        transparent: true,
        backgroundColor: '#00000040',
        webPreferences: this.configureWebPreferences(),
        show: false
      };

      console.log('[WindowConfigurator] Base configuration created successfully');
      return config;
    } catch (error) {
      ErrorLogger.logError(
        ErrorCode.FLAG_WINDOW_BASE_FAILED,
        'Failed to create base window configuration',
        { error: error.message }
      );
      
      // Fallback a configuración mínima
      return {
        width: 1400,
        height: 700,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      };
    }
  }

  /**
   * Aplica configuración específica de macOS
   * Configura vibrancy, visualEffectState, titleBarStyle y trafficLightPosition
   * 
   * @param {Object} config - Configuración base de ventana a modificar
   * Requisitos: 7.1, 7.2, 7.3
   */
  static applyMacOSConfig(config) {
    if (process.platform !== 'darwin') {
      console.log('[WindowConfigurator] Skipping macOS configuration (not on macOS)');
      return;
    }

    try {
      // Vibrancy para efectos nativos de cristal (glassmorphism)
      // Requisito 7.1: vibrancy: 'under-window' para efecto glass oscuro/tintado negro
      config.vibrancy = 'under-window';
      
      // Mantener efectos visuales activos para renderizado optimizado
      // Requisito 7.2: visualEffectState: 'active' para renderizado optimizado
      config.visualEffectState = 'active';
      
      // Configuración de barra de título y traffic lights
      config.titleBarStyle = 'hidden';
      config.trafficLightPosition = { x: 15, y: 7 };

      console.log('[WindowConfigurator] macOS configuration applied successfully');
    } catch (error) {
      ErrorLogger.logError(
        ErrorCode.FLAG_WINDOW_MACOS_FAILED,
        'Failed to apply macOS configuration',
        { error: error.message }
      );
    }
  }

  /**
   * Configura webPreferences optimizadas para rendimiento
   * Incluye configuración de seguridad, aceleración por hardware y workers
   * 
   * @returns {Object} Objeto webPreferences optimizado
   * Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.5
   */
  static configureWebPreferences() {
    try {
      const webPreferences = {
        // Seguridad: Node.js no expuesto al renderer
        nodeIntegration: false,
        
        // Seguridad: Aislamiento de contexto
        // Requisito 3.5: contextIsolation como true para seguridad
        contextIsolation: true,
        
        // Preload script para exponer APIs de forma controlada
        preload: path.join(__dirname, '../preload.js'),
        
        // Requisito 3.3: sandbox como false para acceso a APIs locales
        sandbox: false,
        
        // Requisito 3.1: offscreen como false para renderizado on-screen
        offscreen: false,
        
        // Requisito 3.2: nodeIntegrationInWorker como false por seguridad
        // Deshabilitado para prevenir acceso a APIs de Node.js en Web Workers,
        // reduciendo la superficie de ataque (CWE-272: Least Privilege Violation).
        // Si un worker legítimo necesita funcionalidad de Node.js, usar utilityProcess.fork()
        // o comunicación IPC controlada a través del preload script.
        nodeIntegrationInWorker: false,
        
        // Requisito 3.4: enableWebSQL como false para reducir overhead
        enableWebSQL: false,
        
        // Requisito 3.6: backgroundThrottling como false para mantener rendimiento de animaciones
        backgroundThrottling: false,

        // Integración nativa de autocorrección / diccionario del sistema
        spellcheck: true,
        
        // Requisito 4.5: hardwareAcceleration como true explícitamente
        hardwareAcceleration: true,
        
        // Soporte para webviews (necesario para la aplicación)
        webviewTag: true
      };

      console.log('[WindowConfigurator] WebPreferences configured successfully');
      return webPreferences;
    } catch (error) {
      ErrorLogger.logError(
        ErrorCode.FLAG_WEBPREFS_FAILED,
        'Failed to configure webPreferences',
        { error: error.message }
      );
      
      // Fallback a configuración mínima segura
      return {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload.js')
      };
    }
  }

  /**
   * Aplica configuración específica de Windows
   * Configura backgroundMaterial para efectos Acrylic
   * 
   * @param {Object} config - Configuración base de ventana a modificar
   */
  static applyWindowsConfig(config) {
    if (process.platform !== 'win32') {
      console.log('[WindowConfigurator] Skipping Windows configuration (not on Windows)');
      return;
    }

    try {
      // Acrylic funciona en Windows 10 1803+ y Windows 11
      // Si falla, el backgroundColor transparente actuará como fallback
      config.backgroundMaterial = 'acrylic';

      console.log('[WindowConfigurator] Windows configuration applied successfully');
    } catch (error) {
      ErrorLogger.logError(
        ErrorCode.FLAG_WINDOW_WINDOWS_FAILED,
        'Failed to apply Windows configuration',
        { error: error.message }
      );
    }
  }

  /**
   * Crea configuración completa de ventana con optimizaciones específicas de plataforma
   * Combina configuración base con configuraciones específicas de macOS/Windows
   * 
   * @returns {Object} Configuración completa de BrowserWindow
   */
  static createOptimizedConfig() {
    try {
      const config = this.createBaseConfig();
      
      // Aplicar configuraciones específicas de plataforma
      this.applyMacOSConfig(config);
      this.applyWindowsConfig(config);

      console.log('[WindowConfigurator] Optimized configuration created successfully');
      return config;
    } catch (error) {
      ErrorLogger.logError(
        ErrorCode.FLAG_WINDOW_BASE_FAILED,
        'Failed to create optimized configuration',
        { error: error.message }
      );
      
      // Fallback a configuración base
      return this.createBaseConfig();
    }
  }
}

module.exports = WindowConfigurator;
