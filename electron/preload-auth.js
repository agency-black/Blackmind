/**
 * Preload script mínimo y seguro para el Auth Popup
 * 
 * SECURITY: Este preload se usa en WebContentsView que carga contenido
 * remoto (OAuth/SSO). Solo expone APIs estrictamente necesarias para
 * la comunicación con el popup de autenticación.
 * 
 * Cumple con:
 * - OWASP Electron Security Guideline EL-01 (sandbox: true)
 * - CWE-269: Improper Privilege Management
 * - Principio de menor privilegio
 */

// Trasplante de Brave: Burlar detección de Google / Webdriver en la ventana de Auth
try {
  Object.defineProperty(navigator, 'webdriver', { get: () => false });
  Object.defineProperty(navigator, 'languages', { get: () => ['es-419', 'es', 'en-US', 'en'] });
} catch (e) {}

const { contextBridge, ipcRenderer } = require('electron');

// Solo exponer APIs mínimas para control del popup de autenticación
contextBridge.exposeInMainWorld('authPopupAPI', {
    /**
     * Cierra el popup de autenticación
     * @returns {Promise<boolean>}
     */
    close: () => ipcRenderer.invoke('auth-popup:close'),

    /**
     * Minimiza el popup de autenticación
     * @returns {Promise<boolean>}
     */
    minimize: () => ipcRenderer.invoke('auth-popup:minimize'),

    /**
     * Alterna el estado maximizado del popup
     * @returns {Promise<boolean>}
     */
    toggleMaximize: () => ipcRenderer.invoke('auth-popup:toggle-maximize'),

    /**
     * Suscribe a cambios de estado del popup (URL, título, favicon)
     * @param {Function} callback - Función llamada con el estado actualizado
     * @returns {Function} Función para cancelar la suscripción
     */
    onState: (callback) => {
        const listener = (_event, state) => callback(state);
        ipcRenderer.on('auth-popup:state', listener);
        return () => {
            ipcRenderer.removeListener('auth-popup:state', listener);
        };
    },

    /**
     * Suscribe al evento de completado de autenticación
     * @param {Function} callback - Función llamada con { sourceTabId, url }
     * @returns {Function} Función para cancelar la suscripción
     */
    onCompleted: (callback) => {
        const listener = (_event, payload) => callback(payload);
        ipcRenderer.on('auth-popup:completed', listener);
        return () => {
            ipcRenderer.removeListener('auth-popup:completed', listener);
        };
    }
});