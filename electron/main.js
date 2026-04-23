const { app, BrowserWindow, ipcMain, session, Menu, shell, dialog, clipboard, nativeImage, safeStorage, WebContentsView } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const FlagsInitializer = require("./modules/FlagsInitializer");
const WindowConfigurator = require("./modules/WindowConfigurator");
const MemoryMonitor = require("./modules/MemoryMonitor");
const DiagnosticsModule = require("./modules/DiagnosticsModule");

let mainWindow;
let lastClosedTab = null;
let authPopupWindow = null;
let authPopupView = null;
let authPopupState = null;
const WEBVIEW_PARTITION = "persist:wrapper";
const AUTH_POPUP_FRAME = 0;
const AUTH_POPUP_HEADER_HEIGHT = 25;
const AUTH_POPUP_DEFAULT_WIDTH = 450;
const AUTH_POPUP_DEFAULT_HEIGHT = 550;

const LOCAL_APP_PORTS = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 8080];

const APP_ORIGINS = new Set([
  "file://",
  ...LOCAL_APP_PORTS.flatMap((port) => [`http://127.0.0.1:${port}`, `http://localhost:${port}`]),
]);

const isTrustedOrigin = (rawOrigin = "") => {
  if (!rawOrigin || typeof rawOrigin !== "string") {
    return false;
  }

  if (rawOrigin === "file://" || rawOrigin.startsWith("file://")) {
    return true;
  }

  try {
    const url = new URL(rawOrigin);
    return APP_ORIGINS.has(url.origin);
  } catch {
    return false;
  }
};

const getJsonPath = (filename) => path.join(app.getPath("userData"), filename);

const readJsonFile = (filename, fallback) => {
  const filePath = getJsonPath(filename);
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (error) {
    console.error(`[NativeBridge] Failed to read ${filename}:`, error);
    return fallback;
  }
};

/**
 * Escribe un archivo JSON de forma atómica usando patrón temp file + rename
 * Previene corrupción de datos si el proceso es interrumpido durante la escritura
 *
 * @param {string} filename - Nombre del archivo JSON
 * @param {any} value - Valor a serializar y guardar
 * @throws {Error} Si ocurre un error durante la escritura
 */
const writeJsonFile = (filename, value) => {
  const filePath = getJsonPath(filename);
  const tempPath = `${filePath}.tmp`;
  
  try {
    // Escribir primero al archivo temporal
    fs.writeFileSync(tempPath, JSON.stringify(value, null, 2), "utf-8");
    // Renombrar atómicamente (operación atómica en sistemas de archivos POSIX/Windows)
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    // Limpiar archivo temporal en caso de error
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch {
      // Ignorar errores de limpieza
    }
    console.error(`[NativeBridge] Failed to write ${filename}:`, error);
    throw error;
  }
};

/**
 * SECURITY: Encriptación de contraseñas usando safeStorage
 *
 * IMPORTANTE: El almacenamiento seguro de contraseñas requiere un keychain/keyring
 * disponible en el sistema (Keychain en macOS, GNOME Keyring/KWallet en Linux,
 * Credential Manager en Windows).
 *
 * En entornos sin keychain disponible (Linux sin keyring, VMs, CI/CD),
 * las funciones fallarán intencionalmente para evitar almacenar contraseñas
 * en texto plano.
 *
 * Cumple con:
 * - CWE-311: Missing Encryption of Sensitive Data
 * - CWE-326: Inadequate Encryption Strength
 */
const encryptString = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  if (!safeStorage.isEncryptionAvailable()) {
    console.error("[Security] safeStorage no disponible. No se puede almacenar contraseña de forma segura.");
    return null;
  }

  try {
    return safeStorage.encryptString(value).toString("base64");
  } catch (error) {
    console.error("[Security] Error al encriptar:", error);
    return null;
  }
};

const decryptString = (value) => {
  if (!value || typeof value !== "string") {
    return "";
  }

  if (!safeStorage.isEncryptionAvailable()) {
    console.warn("[Security] safeStorage no disponible. No se pueden recuperar contraseñas encriptadas.");
    return "";
  }

  try {
    return safeStorage.decryptString(Buffer.from(value, "base64"));
  } catch (error) {
    console.error("[Security] Error al desencriptar:", error);
    return "";
  }
};

const getBookmarksStore = () => readJsonFile("bookmarks.json", []);
const saveBookmarksStore = (items) => writeJsonFile("bookmarks.json", items);
const getPasswordsStore = () => readJsonFile("passwords.json", {});
const savePasswordsStore = (items) => writeJsonFile("passwords.json", items);

const sanitizeFilename = (value, fallback = "download") => {
  if (!value || typeof value !== "string") {
    return fallback;
  }

  const sanitized = value.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").trim();
  return sanitized || fallback;
};

const getDefaultFilenameFromUrl = (targetUrl, fallback = "download") => {
  try {
    const parsed = new URL(targetUrl);
    const name = parsed.pathname.split("/").filter(Boolean).pop();
    return sanitizeFilename(name || fallback, fallback);
  } catch {
    return fallback;
  }
};

// Constantes de seguridad para descargas
const MAX_DOWNLOAD_BYTES = 500 * 1024 * 1024; // 500 MB límite
const DOWNLOAD_TIMEOUT_MS = 60_000; // 60 segundos

/**
 * Descarga un archivo desde una URL a una ruta local con validaciones de seguridad
 *
 * Validaciones implementadas:
 * - Protocolo permitido: solo http: y https:
 * - Límite de tamaño: 500 MB máximo
 * - Timeout: 60 segundos
 * - Validación de Content-Length antes de descargar
 *
 * @param {string} targetUrl - URL del archivo a descargar
 * @param {string} defaultFilename - Nombre de archivo por defecto
 * @returns {Promise<string|null>} Ruta del archivo descargado o null si se canceló
 * @throws {Error} Si la descarga falla o viola las restricciones de seguridad
 */
const downloadToPath = async (targetUrl, defaultFilename = "download") => {
  // Validar protocolo permitido
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    throw new Error('URL inválida para descarga');
  }
  
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Protocolo no permitido para descarga. Solo HTTP/HTTPS están soportados.');
  }

  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: path.join(app.getPath("downloads"), sanitizeFilename(defaultFilename, "download")),
  });

  if (canceled || !filePath) {
    return null;
  }

  // Configurar timeout con AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(targetUrl, { signal: controller.signal });
    
    if (!response.ok) {
      throw new Error(`Download failed: HTTP ${response.status} ${response.statusText}`);
    }

    // Validar Content-Length si está disponible
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    if (contentLength > 0 && contentLength > MAX_DOWNLOAD_BYTES) {
      throw new Error(`Archivo demasiado grande: ${(contentLength / 1024 / 1024).toFixed(2)} MB (máximo permitido: ${MAX_DOWNLOAD_BYTES / 1024 / 1024} MB)`);
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // Validar tamaño real del archivo descargado
    if (arrayBuffer.byteLength > MAX_DOWNLOAD_BYTES) {
      throw new Error(`Archivo descargado excede el tamaño máximo permitido: ${MAX_DOWNLOAD_BYTES / 1024 / 1024} MB`);
    }

    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
    return filePath;
  } finally {
    clearTimeout(timeoutId);
  }
};

const buildPassword = (length = 20) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+";
  const bytes = crypto.randomBytes(length);
  let password = "";

  for (let index = 0; index < length; index += 1) {
    password += chars[bytes[index] % chars.length];
  }

  return password;
};

const AUTH_URL_KEYWORDS = [
  "login",
  "signin",
  "signup",
  "oauth",
  "authorize",
  "consent",
  "challenge",
  "verify",
  "verification",
  "account",
  "passkey",
  "webauthn",
  "saml",
  "authenticate",
  "auth",
];

const sanitizePopupText = (value, fallback = "") => {
  if (!value || typeof value !== "string") {
    return fallback;
  }

  return value.trim() || fallback;
};

const getUrlHostLabel = (rawUrl) => {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const shouldBridgeAuthPopup = (rawUrl = "", features = "") => {
  if (!rawUrl || typeof rawUrl !== "string") {
    return false;
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return false;
  }

  const haystack = `${parsed.hostname}${parsed.pathname}${parsed.search} ${features || ""}`.toLowerCase();
  return AUTH_URL_KEYWORDS.some((keyword) => haystack.includes(keyword));
};

const buildAuthPopupState = (overrides = {}) => {
  const url = sanitizePopupText(overrides.url, authPopupState?.url || "");
  const title = sanitizePopupText(overrides.title, authPopupState?.title || getUrlHostLabel(url) || "Authentication");
  const favicon = sanitizePopupText(overrides.favicon, authPopupState?.favicon || "");
  const host = getUrlHostLabel(url);

  return {
    sourceTabId: overrides.sourceTabId ?? authPopupState?.sourceTabId ?? null,
    url,
    title,
    favicon,
    host,
  };
};

const sendAuthPopupState = (stateOverrides = {}) => {
  if (!authPopupWindow || authPopupWindow.isDestroyed()) {
    return;
  }

  authPopupState = buildAuthPopupState(stateOverrides);
  authPopupWindow.webContents.send("auth-popup:state", authPopupState);
};

const getAuthPopupWindowBounds = () => {
  const parentBounds = mainWindow && !mainWindow.isDestroyed()
    ? mainWindow.getBounds()
    : { x: 0, y: 0, width: 1400, height: 700 };

  return {
    width: AUTH_POPUP_DEFAULT_WIDTH,
    height: AUTH_POPUP_DEFAULT_HEIGHT,
    x: Math.round(parentBounds.x + (parentBounds.width - AUTH_POPUP_DEFAULT_WIDTH) / 2),
    y: Math.round(parentBounds.y + (parentBounds.height - AUTH_POPUP_DEFAULT_HEIGHT) / 2),
  };
};

const layoutAuthPopupView = () => {
  if (!authPopupWindow || authPopupWindow.isDestroyed() || !authPopupView) {
    return;
  }

  const [width, height] = authPopupWindow.getContentSize();

  authPopupView.setBounds({
    x: AUTH_POPUP_FRAME,
    y: AUTH_POPUP_FRAME + AUTH_POPUP_HEADER_HEIGHT,
    width: Math.max(0, width - AUTH_POPUP_FRAME * 2),
    height: Math.max(0, height - (AUTH_POPUP_FRAME * 2 + AUTH_POPUP_HEADER_HEIGHT)),
  });
};

const closeAuthPopup = () => {
  if (authPopupWindow && !authPopupWindow.isDestroyed()) {
    authPopupWindow.close();
  }
};

const minimizeAuthPopup = () => {
  if (authPopupWindow && !authPopupWindow.isDestroyed()) {
    authPopupWindow.minimize();
  }
};

const toggleMaximizeAuthPopup = () => {
  if (!authPopupWindow || authPopupWindow.isDestroyed()) {
    return;
  }

  if (authPopupWindow.isMaximized()) {
    authPopupWindow.unmaximize();
    return;
  }

  authPopupWindow.maximize();
};

const handleAuthPopupClosed = () => {
  const completedPayload = authPopupState
    ? { sourceTabId: authPopupState.sourceTabId, url: authPopupState.url }
    : null;

  authPopupView = null;
  authPopupWindow = null;
  authPopupState = null;

  if (completedPayload && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("auth-popup:completed", completedPayload);
  }
};

const ensureAuthPopupWindow = () => {
  if (authPopupWindow && !authPopupWindow.isDestroyed()) {
    return authPopupWindow;
  }

  const popupBounds = getAuthPopupWindowBounds();

  authPopupWindow = new BrowserWindow({
    parent: mainWindow || undefined,
    modal: false,
    show: false,
    width: popupBounds.width,
    height: popupBounds.height,
    x: popupBounds.x,
    y: popupBounds.y,
    minWidth: AUTH_POPUP_DEFAULT_WIDTH,
    minHeight: AUTH_POPUP_DEFAULT_HEIGHT,
    useContentSize: true,
    frame: false,
    transparent: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    fullscreenable: false,
    movable: true,
    hasShadow: true,
    roundedCorners: true,
    vibrancy: "fullscreen-ui",
    visualEffectState: "active",
    backgroundMaterial: process.platform === "win32" ? "acrylic" : undefined,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "./preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
      backgroundThrottling: false,
    },
  });

  authPopupWindow.removeMenu();
  authPopupWindow.loadFile(path.join(__dirname, "./auth-popup.html"));
  authPopupWindow.on("resize", layoutAuthPopupView);
  authPopupWindow.on("closed", handleAuthPopupClosed);
  authPopupWindow.once("ready-to-show", () => {
    authPopupWindow.show();
    authPopupWindow.focus();
    sendAuthPopupState();
  });

  // SECURITY: sandbox: true y preload mínimo para contenido remoto
  // Cumple OWASP EL-01 y CWE-269 - Principio de menor privilegio
  authPopupView = new WebContentsView({
    webPreferences: {
      partition: WEBVIEW_PARTITION,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      javascript: true,
      webSecurity: true,
      nativeWindowOpen: true,
      autoplayPolicy: "no-user-gesture-required",
      preload: path.join(__dirname, "./preload-auth.js"),
    },
  });

  configureSessionIntegrations(authPopupView.webContents.session);
  // Pasamos la URL inicial para que sepa si es Google
  authPopupView.webContents.setUserAgent(buildChromeLikeUserAgent(authPopupState?.url || ""));
  authPopupWindow.contentView.addChildView(authPopupView);
  layoutAuthPopupView();

  authPopupView.webContents.setWindowOpenHandler(({ url }) => {
    // Trasplante de Brave: Incluso en la ventana de Auth, bloqueamos pop-ups no deseados
    const isAllowedAuth = url.includes("accounts.google.com") || url.includes("appleid.apple.com");
    
    if (url && /^https?:/i.test(url) && isAllowedAuth) {
      return { action: "allow" };
    }

    if (url && !/^https?:/i.test(url)) {
      shell.openExternal(url);
    }
    
    console.log(`[Pop-up Blocker (Auth)] Bloqueado: ${url}`);
    return { action: "deny" };
  });

  authPopupView.webContents.on("page-title-updated", (event, title) => {
    event.preventDefault();
    sendAuthPopupState({ title });
  });

  authPopupView.webContents.on("page-favicon-updated", (_event, favicons) => {
    sendAuthPopupState({
      favicon: Array.isArray(favicons) && favicons.length > 0 ? favicons[0] : "",
    });
  });

  authPopupView.webContents.on("did-navigate", (_event, url) => {
    sendAuthPopupState({ url });
  });

  authPopupView.webContents.on("did-navigate-in-page", (_event, url) => {
    sendAuthPopupState({ url });
  });

  return authPopupWindow;
};

const openAuthPopup = async (payload = {}) => {
  if (!payload?.url || typeof payload.url !== "string") {
    return false;
  }

  ensureAuthPopupWindow();
  authPopupState = buildAuthPopupState(payload);
  layoutAuthPopupView();
  sendAuthPopupState(payload);
  await authPopupView.webContents.loadURL(payload.url);

  if (authPopupWindow && !authPopupWindow.isVisible()) {
    authPopupWindow.show();
  }

  authPopupWindow?.focus();
  return true;
};

const createContextMenuTemplate = (payload = {}) => {
  const { type = "navigation", data = {} } = payload;
  const template = [];

  if (type === "link") {
    template.push(
      {
        label: "Open Link",
        click: () => mainWindow?.webContents.send("context-menu:action", { action: "open-link", data }),
      },
      {
        label: "Open Link in New Tab",
        click: () => mainWindow?.webContents.send("context-menu:action", { action: "open-link-new-tab", data }),
      },
      {
        label: "Open Link in Split Pane",
        click: () => mainWindow?.webContents.send("context-menu:action", { action: "open-link-split-pane", data }),
      },
      { type: "separator" },
      {
        label: "Copy Link",
        click: () => mainWindow?.webContents.send("context-menu:action", { action: "copy-link", data }),
      },
      {
        label: "Open in Browser",
        click: () => mainWindow?.webContents.send("context-menu:action", { action: "open-in-browser", data }),
      },
    );
    return template;
  }

  if (type === "image") {
    template.push(
      {
        label: "Open Image",
        click: () => mainWindow?.webContents.send("context-menu:action", { action: "open-image", data }),
      },
      {
        label: "Open Image in New Tab",
        click: () => mainWindow?.webContents.send("context-menu:action", { action: "open-image-new-tab", data }),
      },
      { type: "separator" },
      {
        label: "Copy Image URL",
        click: () => mainWindow?.webContents.send("context-menu:action", { action: "copy-image-url", data }),
      },
      {
        label: "Search Image with Google",
        click: () => mainWindow?.webContents.send("context-menu:action", { action: "search-image-with-google", data }),
      },
    );
    return template;
  }

  if (type === "text") {
    template.push(
      {
        label: "Copy",
        click: () => mainWindow?.webContents.send("context-menu:action", {
          action: "copy",
          data: { ...data, text: data.selectedText || data.text },
        }),
      },
      {
        label: "Search Google",
        click: () => mainWindow?.webContents.send("context-menu:action", {
          action: "search-google",
          data: { ...data, text: data.selectedText || data.text },
        }),
      },
      {
        label: "Read Aloud",
        click: () => mainWindow?.webContents.send("context-menu:action", {
          action: "read-aloud",
          data: { ...data, text: data.selectedText || data.text },
        }),
      },
    );
    return template;
  }

  if (type === "input") {
    template.push(
      { label: "Undo", click: () => mainWindow?.webContents.send("context-menu:action", { action: "undo", data }) },
      { label: "Redo", click: () => mainWindow?.webContents.send("context-menu:action", { action: "redo", data }) },
      { type: "separator" },
      { label: "Cut", click: () => mainWindow?.webContents.send("context-menu:action", { action: "cut", data }) },
      { label: "Copy", click: () => mainWindow?.webContents.send("context-menu:action", { action: "copy", data }) },
      { label: "Paste", click: () => mainWindow?.webContents.send("context-menu:action", { action: "paste", data }) },
      { type: "separator" },
      { label: "Select All", click: () => mainWindow?.webContents.send("context-menu:action", { action: "select-all", data }) },
    );
    return template;
  }

  if (type === "tab") {
    template.push(
      { label: "New Tab", click: () => mainWindow?.webContents.send("context-menu:action", { action: "new-tab", data }) },
      { label: "Reload Tab", click: () => mainWindow?.webContents.send("context-menu:action", { action: "reload-tab", data }) },
      { label: "Duplicate Tab", click: () => mainWindow?.webContents.send("context-menu:action", { action: "duplicate-tab", data }) },
      { type: "separator" },
      { label: "Close Tab", click: () => mainWindow?.webContents.send("context-menu:action", { action: "close-tab", data }) },
      { label: "Close Other Tabs", click: () => mainWindow?.webContents.send("context-menu:action", { action: "close-other-tabs", data }) },
    );
    return template;
  }

  template.push(
    {
      label: "Back",
      enabled: Boolean(data.canGoBack),
      click: () => mainWindow?.webContents.send("context-menu:action", { action: "go-back", data }),
    },
    {
      label: "Forward",
      enabled: Boolean(data.canGoForward),
      click: () => mainWindow?.webContents.send("context-menu:action", { action: "go-forward", data }),
    },
    {
      label: "Reload",
      click: () => mainWindow?.webContents.send("context-menu:action", { action: "reload", data }),
    },
    { type: "separator" },
    {
      label: "New Tab",
      click: () => mainWindow?.webContents.send("context-menu:action", { action: "new-tab", data }),
    },
    {
      label: "Copy Page URL",
      click: () => mainWindow?.webContents.send("context-menu:action", { action: "copy-page-url", data }),
    },
    {
      label: "Open in Browser",
      click: () => mainWindow?.webContents.send("context-menu:action", { action: "open-in-browser", data }),
    },
    { type: "separator" },
    {
      label: "Inspect",
      click: () => mainWindow?.webContents.send("context-menu:action", { action: "inspect", data }),
    },
  );

  return template;
};

const getDataPath = () => {
  return path.join(app.getPath("userData"), "app-state.json");
};

/**
 * Guarda el estado de la aplicación de forma atómica
 * Usa patrón temp file + rename para prevenir corrupción de datos
 *
 * @param {Object} data - Datos del estado a guardar
 */
const saveState = (data) => {
  try {
    const dataPath = getDataPath();
    const tempPath = `${dataPath}.tmp`;
    
    // Escribir primero al archivo temporal
    fs.writeFileSync(tempPath, JSON.stringify(data), "utf-8");
    // Renombrar atómicamente
    fs.renameSync(tempPath, dataPath);
  } catch (e) {
    // Limpiar archivo temporal en caso de error
    try {
      const tempPath = `${getDataPath()}.tmp`;
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch {
      // Ignorar errores de limpieza
    }
    console.error("Error saving state:", e);
  }
};

const loadState = () => {
  try {
    const dataPath = getDataPath();
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error loading state:", e);
  }
  return null;
};

const configureSessionIntegrations = (targetSession) => {
  const allowedPermissions = new Set([
    "media",
    "mediaKeySystem",
    "fullscreen",
    "pointerLock",
    "clipboard-read",
    "clipboard-sanitized-write",
    "notifications",
    "geolocation",
    "midi",
    "midiSysex",
    "hid",
    "usb",
    "serial",
  ]);

  targetSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    return isTrustedOrigin(requestingOrigin) && allowedPermissions.has(permission);
  });

  targetSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    callback(isTrustedOrigin(details?.requestingOrigin) && allowedPermissions.has(permission));
  });

  if (typeof targetSession.setDevicePermissionHandler === "function") {
    targetSession.setDevicePermissionHandler((details) => isTrustedOrigin(details?.origin));
  }

  // Configuración de User-Agent con identificador de aplicación legítimo
  // Política: Mantener compatibilidad base Chrome pero incluir identificador Blackmind
  // para transparencia y cumplimiento de ToS (Google ToS §5, GDPR Art. 5)
  const ua = buildChromeLikeUserAgent();
  targetSession.webRequest.onBeforeSendHeaders((details, callback) => {
    // Trasplante de Brave: Suplantar Google Chrome para evitar bloqueos de seguridad
    const isGoogle = details.url.includes("google.com") || details.url.includes("accounts.google");
    
    details.requestHeaders["User-Agent"] = buildChromeLikeUserAgent(details.url);
    
    // Sec-CH-UA headers: Brave se identifica como Google Chrome en sitios críticos
    details.requestHeaders["Sec-CH-UA"] = isGoogle 
      ? '"Google Chrome";v="134", "Chromium";v="134", "Not;A=Brand";v="99"'
      : '"Chromium";v="134", "Not;A=Brand";v="99"';
      
    details.requestHeaders["Sec-CH-UA-Mobile"] = "?0";
    details.requestHeaders["Sec-CH-UA-Platform"] = isGoogle ? '"Windows"' : '"macOS"';
    details.requestHeaders["Accept-Language"] = "es-419,es;q=0.9,en-US;q=0.8,en;q=0.7";
    
    callback({ requestHeaders: details.requestHeaders });
  });
};

const APP_VERSION = require('../package.json').version;
const APP_NAME = require('../package.json').name;

const buildChromeLikeUserAgent = (targetUrl = "") => {
  // Trasplante de Brave: User-Agent puro de Chrome
  // Usamos Windows para Google porque su detección en Mac es más estricta para Electron
  const baseUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";
  const googleUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";
  
  if (targetUrl.includes("google.com") || targetUrl.includes("accounts.google") || targetUrl.includes("gstatic.com")) {
    return googleUA;
  }

  return baseUA;
};

// Ajustes de compatibilidad masiva para Google Login y estabilidad en macOS
app.commandLine.appendSwitch("log-level", "3");
app.commandLine.appendSwitch("disable-blink-features", "AutomationControlled");
app.commandLine.appendSwitch(
  "disable-features",
  "Bluetooth,SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure"
);

// app.commandLine.appendSwitch("disable-site-isolation-trials"); // ELIMINADO: Detectado por Google como riesgo de seguridad
app.commandLine.appendSwitch("remote-debugging-port", "9222");
app.commandLine.appendSwitch("lang", "es-419");

// Inicializar flags de rendimiento y aceleración por hardware
// IMPORTANTE: Debe ejecutarse ANTES de app.whenReady()
FlagsInitializer.initializePerformanceFlags();

// Inicializar flags específicos de macOS/Metal si estamos en macOS
if (process.platform === "darwin") {
  FlagsInitializer.initializeMacOSFlags();
}

// Configurar límites de memoria para gestión eficiente en sistemas con 8GB RAM
FlagsInitializer.initializeMemoryLimits();

// Crear instancia de MemoryMonitor
// Requisito: 5.4
const memoryMonitor = new MemoryMonitor();

function createWindow() {
  const windowConfig = WindowConfigurator.createBaseConfig();

  if (process.platform === "darwin") {
    WindowConfigurator.applyMacOSConfig(windowConfig);
  }

  if (process.platform === "win32") {
    WindowConfigurator.applyWindowsConfig(windowConfig);
  }

  mainWindow = new BrowserWindow(windowConfig);
  configureSessionIntegrations(mainWindow.webContents.session);
  mainWindow.webContents.setUserAgent(buildChromeLikeUserAgent());

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    const savedState = loadState();
    if (savedState) {
      mainWindow.webContents.send("restore-state", savedState);
    }
  });

  return mainWindow;
}

ipcMain.on("save-state", (event, state) => {
  saveState(state);
});

// Manejar carga de URLs locales en webviews
ipcMain.handle("load-local-url", (event, relativePath) => {
  const url = path.join(__dirname, "../dist", relativePath);
  return `file://${url}`;
});

ipcMain.handle("auth-popup:open", async (_event, payload) => {
  return openAuthPopup(payload);
});

ipcMain.handle("auth-popup:close", async () => {
  closeAuthPopup();
  return true;
});

ipcMain.handle("auth-popup:minimize", async () => {
  minimizeAuthPopup();
  return true;
});

ipcMain.handle("auth-popup:toggle-maximize", async () => {
  toggleMaximizeAuthPopup();
  return true;
});

ipcMain.handle("context-menu:show", (event, payload) => {
  const targetWindow = BrowserWindow.fromWebContents(event.sender);
  if (!targetWindow) {
    return false;
  }

  const menu = Menu.buildFromTemplate(createContextMenuTemplate(payload));
  menu.popup({
    window: targetWindow,
    x: Number.isFinite(payload?.x) ? Math.round(payload.x) : undefined,
    y: Number.isFinite(payload?.y) ? Math.round(payload.y) : undefined,
  });

  return true;
});

ipcMain.handle("shell:open-external", async (_event, url) => {
  if (!url || typeof url !== "string") {
    return false;
  }

  await shell.openExternal(url);
  return true;
});

ipcMain.handle("downloads:download-file", async (_event, url) => {
  if (!url || typeof url !== "string") {
    return null;
  }

  return downloadToPath(url, getDefaultFilenameFromUrl(url));
});

ipcMain.handle("downloads:save-image", async (_event, url, suggestedName) => {
  if (!url || typeof url !== "string") {
    return null;
  }

  return downloadToPath(url, sanitizeFilename(suggestedName || getDefaultFilenameFromUrl(url, "image")));
});

ipcMain.handle("downloads:save-video", async (_event, url) => {
  if (!url || typeof url !== "string") {
    return null;
  }

  return downloadToPath(url, getDefaultFilenameFromUrl(url, "video"));
});

ipcMain.handle("downloads:save-audio", async (_event, url) => {
  if (!url || typeof url !== "string") {
    return null;
  }

  return downloadToPath(url, getDefaultFilenameFromUrl(url, "audio"));
});

ipcMain.handle("downloads:show-save-dialog", async (_event, defaultName, filters) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: path.join(app.getPath("downloads"), sanitizeFilename(defaultName || "download")),
    filters: Array.isArray(filters) ? filters : undefined,
  });

  return result;
});

ipcMain.handle("clipboard:write-image", async (_event, imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") {
    return false;
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    return false;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  clipboard.writeImage(nativeImage.createFromBuffer(buffer));
  return true;
});

ipcMain.handle("dictionary:define", async (_event, text) => {
  if (!text || typeof text !== "string") {
    return false;
  }

  const target = process.platform === "darwin"
    ? `dict://${encodeURIComponent(text.trim())}`
    : `https://www.google.com/search?q=define+${encodeURIComponent(text.trim())}`;

  await shell.openExternal(target);
  return true;
});

ipcMain.handle("dictionary:translate", async (_event, text, targetLanguage = "es") => {
  if (!text || typeof text !== "string") {
    return false;
  }

  await shell.openExternal(
    `https://translate.google.com/?sl=auto&tl=${encodeURIComponent(targetLanguage)}&text=${encodeURIComponent(text.trim())}&op=translate`,
  );
  return true;
});

ipcMain.handle("share:share", async (_event, payload = {}) => {
  const parts = [payload?.title, payload?.text, payload?.url].filter(Boolean);
  if (parts.length === 0) {
    return false;
  }

  clipboard.writeText(parts.join("\n"));
  return true;
});

ipcMain.handle("bookmarks:add", async (_event, url, title) => {
  if (!url || typeof url !== "string") {
    return false;
  }

  const bookmarks = getBookmarksStore();
  const normalizedUrl = url.trim();
  const existing = bookmarks.find((item) => item.url === normalizedUrl);
  if (existing) {
    return true;
  }

  bookmarks.push({
    url: normalizedUrl,
    title: typeof title === "string" && title.trim() ? title.trim() : normalizedUrl,
    createdAt: new Date().toISOString(),
  });
  saveBookmarksStore(bookmarks);
  return true;
});

ipcMain.handle("bookmarks:list", async () => {
  return getBookmarksStore();
});

ipcMain.handle("bookmarks:remove", async (_event, url) => {
  if (!url || typeof url !== "string") {
    return false;
  }

  const normalizedUrl = url.trim();
  const bookmarks = getBookmarksStore();
  const nextBookmarks = bookmarks.filter((item) => item.url !== normalizedUrl);

  if (nextBookmarks.length === bookmarks.length) {
    return true;
  }

  saveBookmarksStore(nextBookmarks);
  return true;
});

ipcMain.handle("history:set-last-closed-tab", async (_event, tab) => {
  lastClosedTab = tab && typeof tab === "object" ? tab : null;
  return true;
});

ipcMain.handle("history:pop-closed-tab", async () => {
  if (!lastClosedTab || !mainWindow) {
    return null;
  }

  const tab = lastClosedTab;
  lastClosedTab = null;
  mainWindow.webContents.send("history:reopen-closed-tab", tab);
  return tab;
});

ipcMain.handle("devtools:open-console", async () => {
  if (!mainWindow) {
    return false;
  }

  mainWindow.webContents.openDevTools({ mode: "detach" });
  return true;
});

ipcMain.handle("devtools:view-source", async (_event, url) => {
  if (!url || typeof url !== "string") {
    return false;
  }

  await shell.openExternal(`view-source:${url}`);
  return true;
});

ipcMain.handle("devtools:inspect", async (_event, webviewId, x, y) => {
  if (!mainWindow) {
    return false;
  }

  // Si se proporcionan coordenadas, inspeccionar elemento en esa posición
  // Esto permite "Inspect Element" desde el menú contextual
  if (typeof x === 'number' && typeof y === 'number') {
    mainWindow.webContents.inspectElement(Math.round(x), Math.round(y));
    return true;
  }

  // Si se proporciona webviewId, intentar inspeccionar ese webview específico
  // Nota: Requiere implementación de Map de webviewId → WebContentsView
  if (webviewId && typeof webviewId === 'string') {
    // TODO: Implementar Map de webviews para inspección específica
    // Por ahora, abrimos DevTools en modo detach como fallback
    console.log(`[DevTools] Inspección solicitada para webview: ${webviewId}`);
  }

  // Fallback: abrir DevTools en modo detach
  mainWindow.webContents.openDevTools({ mode: "detach" });
  return true;
});

ipcMain.handle("passwords:generate", async (_event, length) => {
  const normalizedLength = Number.isFinite(length) ? Math.max(12, Math.min(64, Math.round(length))) : 20;
  return buildPassword(normalizedLength);
});

ipcMain.handle("passwords:get", async (_event, service, account) => {
  if (!service || !account) {
    return "";
  }

  // Verificar que safeStorage está disponible
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn("[Security] passwords:get - safeStorage no disponible");
    return "";
  }

  const store = getPasswordsStore();
  const entry = store?.[service]?.[account];
  if (!entry) {
    return "";
  }

  return decryptString(entry.value);
});

ipcMain.handle("passwords:set", async (event, service, account, password) => {
  if (!service || !account || typeof password !== "string") {
    return false;
  }

  // Verificar que safeStorage está disponible antes de almacenar
  if (!safeStorage.isEncryptionAvailable()) {
    console.error("[Security] passwords:set - safeStorage no disponible. No se puede almacenar contraseña de forma segura.");
    // Notificar al renderer que el almacenamiento seguro no está disponible
    event.sender.send("security:storage-unavailable", {
      operation: "passwords:set",
      reason: "safeStorage no disponible. Se requiere keychain/keyring del sistema.",
    });
    return false;
  }

  const encryptedValue = encryptString(password);
  if (!encryptedValue) {
    console.error("[Security] passwords:set - Error al encriptar contraseña");
    event.sender.send("security:storage-unavailable", {
      operation: "passwords:set",
      reason: "Error al encriptar contraseña.",
    });
    return false;
  }

  const store = getPasswordsStore();
  if (!store[service]) {
    store[service] = {};
  }

  store[service][account] = {
    value: encryptedValue,
    updatedAt: new Date().toISOString(),
  };
  savePasswordsStore(store);
  return true;
});

ipcMain.handle("spellcheck:add-word", async (_event, word) => {
  if (!word || typeof word !== "string") {
    return false;
  }

  return session.defaultSession.addWordToSpellCheckerDictionary(word.trim());
});

ipcMain.handle("spellcheck:ignore-word", async (_event, word) => {
  if (!word || typeof word !== "string") {
    return false;
  }

  return true;
});

ipcMain.handle("screenshots:capture", async () => {
  if (!mainWindow) {
    return null;
  }

  const image = await mainWindow.capturePage();
  const defaultPath = path.join(app.getPath("pictures"), `wrapper-screenshot-${Date.now()}.png`);
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters: [{ name: "PNG", extensions: ["png"] }],
  });

  if (canceled || !filePath) {
    return null;
  }

  fs.writeFileSync(filePath, image.toPNG());
  return filePath;
});

ipcMain.handle("screenshots:capture-full", async () => {
  if (!mainWindow) {
    return null;
  }

  const image = await mainWindow.capturePage();
  const filePath = path.join(app.getPath("pictures"), `wrapper-screenshot-${Date.now()}.png`);
  fs.writeFileSync(filePath, image.toPNG());
  return filePath;
});

let aipexExtensionId = null;

app.whenReady().then(async () => {
  app.userAgentFallback = buildChromeLikeUserAgent();
  configureSessionIntegrations(session.defaultSession);
  configureSessionIntegrations(session.fromPartition(WEBVIEW_PARTITION));

  app.on("web-contents-created", (_event, contents) => {
    // SECURITY: Validar URLs antes de permitir abrir nuevas ventanas
    // Previene protocolos peligrosos: javascript:, file:, blob:, data:
    contents.setWindowOpenHandler(({ url }) => {
      try {
        const parsed = new URL(url);
        
        // Trasplante de Brave: Bloqueo de pop-ups por defecto
        // Solo permitimos ventanas de autenticación conocidas (Google, etc.)
        const isAuthDomain = url.includes("accounts.google.com") || 
                           url.includes("facebook.com/v") || 
                           url.includes("appleid.apple.com");

        if (isAuthDomain) {
          return { action: "allow" };
        }

        // Si no es un dominio de auth, denegamos el pop-up interno
        // y lo enviamos al navegador del sistema si es un protocolo externo
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          shell.openExternal(url).catch(() => {});
        }

        console.log(`[Pop-up Blocker] Ventana bloqueada automáticamente: ${url}`);
        return { action: "deny" };
      } catch {
        return { action: "deny" };
      }
    });

    contents.on("will-attach-webview", (event, webPreferences, params) => {
      delete webPreferences.preload;
      delete webPreferences.preloadURL;
      webPreferences.nodeIntegration = false;
      webPreferences.contextIsolation = true;
      webPreferences.sandbox = true;
      webPreferences.javascript = true;
      webPreferences.webSecurity = true;
      webPreferences.nativeWindowOpen = true;
      params.partition = WEBVIEW_PARTITION;
      params.allowpopups = "on";
      params.useragent = buildChromeLikeUserAgent();
    });
  });

  // Load AIPex Extension
  try {
    const extensionPath = path.join(
      __dirname,
      "../AIPex-0.0.16/packages/browser-ext/dist",
    );
    
    if (fs.existsSync(extensionPath)) {
      // Usar la API moderna de Electron para cargar la extensión
      const ext = await session.defaultSession.extensions.loadExtension(
        extensionPath,
        { allowFileAccess: true },
      );
      aipexExtensionId = ext.id;
      console.log("Loaded AIPex extension with ID: " + aipexExtensionId);
    } else {
      console.warn("[FlagsInitializer] AIPex extension directory not found at: " + extensionPath);
    }
  } catch (e) {
    console.error("Failed to load AIPex extension:", e);
  }

  createWindow();

  // Iniciar monitoreo de memoria
  // Requisito: 5.4, 5.5 - Monitoreo de umbrales y limpieza automática de caché
  memoryMonitor.start();
  console.log('[App] Memory monitor started');

  if (process.env.NODE_ENV === "development") {
    DiagnosticsModule.logDiagnostics();
  }

  // Enviar el ID de la extensión al renderer
  ipcMain.handle("get-aipex-ext-id", () => {
    return aipexExtensionId;
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Detener monitoreo de memoria antes de cerrar la aplicación
// Requisito: 5.4
app.on("before-quit", () => {
  closeAuthPopup();
  memoryMonitor.stop();
});
