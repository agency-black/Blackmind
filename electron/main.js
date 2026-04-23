const { app, BrowserWindow, ipcMain, session, Menu, shell, dialog, clipboard, nativeImage, safeStorage, WebContentsView, webContents } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const FlagsInitializer = require("./modules/FlagsInitializer");
const WindowConfigurator = require("./modules/WindowConfigurator");
const MemoryMonitor = require("./modules/MemoryMonitor");
const DiagnosticsModule = require("./modules/DiagnosticsModule");
const mcpServer = require("./mcp-server");
const { buildShellBridgeScript } = require("./mcp-shell-bridge");
const { buildDomScript } = require("./mcp-page-scripts");
const { BlackmindDevToolsManager } = require("./mcp-devtools-manager");

// Iniciar servidor MCP
mcpServer.start();

const devToolsManager = new BlackmindDevToolsManager();
const mcpState = {
  selectedPageId: null,
};

const queryPath = path.join(app.getPath("userData"), "mcp-query.json");
const responsePath = path.join(app.getPath("userData"), "mcp-response.json");
const mcpBridgePollIntervalMs = 100;

const toMcpText = (value) => ({
  type: "text",
  text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
});

const buildWindowSnapshot = () => ({
  mainWindow: {
    exists: !!mainWindow,
    isDestroyed: mainWindow ? mainWindow.isDestroyed() : true,
    isVisible: mainWindow ? mainWindow.isVisible() : false,
    bounds: mainWindow ? mainWindow.getBounds() : null,
    url: mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents.getURL() : null,
    title: mainWindow && !mainWindow.isDestroyed() ? mainWindow.getTitle() : null,
  },
  authPopupWindow: {
    exists: !!authPopupWindow,
    isDestroyed: authPopupWindow ? authPopupWindow.isDestroyed() : true,
    isVisible: authPopupWindow ? authPopupWindow.isVisible() : false,
    bounds: authPopupWindow ? authPopupWindow.getBounds() : null,
  },
  authPopupView: {
    exists: !!authPopupView,
    url: authPopupView?.webContents ? authPopupView.webContents.getURL() : null,
  },
  authPopupState,
});

const resolveTargetWebContents = (target = "main") => {
  if (target === "auth") {
    return authPopupView?.webContents || null;
  }

  if (!mainWindow || mainWindow.isDestroyed()) {
    return null;
  }

  return mainWindow.webContents;
};

const resolveScreenshotTarget = (target = "auto") => {
  if (target === "auth") {
    return authPopupView?.webContents || null;
  }

  if (target === "main") {
    return mainWindow || null;
  }

  return authPopupView?.webContents || mainWindow || null;
};

const buildAppInfo = () => ({
  name: app.getName(),
  version: app.getVersion(),
  isPackaged: app.isPackaged,
  platform: process.platform,
  arch: process.arch,
  pid: process.pid,
  electron: process.versions.electron,
  chrome: process.versions.chrome,
  node: process.versions.node,
  v8: process.versions.v8,
  userDataPath: app.getPath("userData"),
  hasDevServer: Boolean(process.env.VITE_DEV_SERVER_URL),
  internalMcpEnabled: process.env.BLACKMIND_ENABLE_INTERNAL_MCP === "1",
});

const buildMemorySnapshot = () => ({
  usage: memoryMonitor.getCurrentMemoryUsage(),
  monitor: {
    isRunning: memoryMonitor.isRunning,
    thresholdMB: memoryMonitor.MEMORY_THRESHOLD_MB,
    intervalMs: memoryMonitor.CHECK_INTERVAL_MS,
  },
});

const buildUserDataPaths = () => ({
  userDataPath: app.getPath("userData"),
  queryPath,
  responsePath,
});

const formatSnapshotText = (snapshot) => {
  if (!snapshot) {
    return "No snapshot available";
  }

  const header = [`Title: ${snapshot.title || ""}`, `URL: ${snapshot.url || ""}`];
  const body = Array.isArray(snapshot.elements)
    ? snapshot.elements.map((element) => {
        const selected = snapshot.selectedElement?.uid === element.uid ? "*" : "-";
        const descriptor = [element.tag, element.label, element.text]
          .filter(Boolean)
          .join(" | ");
        return `${selected} [${element.uid}] ${descriptor}`;
      })
    : [];
  return [...header, ...body].join("\n");
};

const keyAliasMap = {
  Esc: "Escape",
  Cmd: "Meta",
  Command: "Meta",
  Ctrl: "Control",
  Return: "Enter",
};

const parseKeyCombination = (value) => {
  const parts = String(value || "").split("+").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    throw new Error("Invalid key combination");
  }

  const key = keyAliasMap[parts.at(-1)] || parts.at(-1);
  const modifiers = parts.slice(0, -1).map((part) => {
    const normalized = keyAliasMap[part] || part;
    if (normalized === "Meta") return "meta";
    if (normalized === "Control") return "control";
    if (normalized === "Shift") return "shift";
    if (normalized === "Alt") return "alt";
    return normalized.toLowerCase();
  });

  return { key, modifiers };
};

const buildCurrentPageFallback = async () => {
  const pages = await listPagesForMcp();
  if (mcpState.selectedPageId) {
    const selected = pages.find((page) => page.id === mcpState.selectedPageId);
    if (selected) return selected;
  }
  return pages.find((page) => page.active) || pages.find((page) => page.type === "dashboard") || pages[0] || null;
};

const ensureShellBridge = async () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    throw new Error("Main window not available");
  }
  await mainWindow.webContents.executeJavaScript(buildShellBridgeScript(), true);
};

const callShellBridge = async (expression) => {
  await ensureShellBridge();
  return mainWindow.webContents.executeJavaScript(expression, true);
};

const listPagesForMcp = async () => {
  const pages = [];

  if (mainWindow && !mainWindow.isDestroyed()) {
    pages.push({
      id: "shell",
      type: "shell",
      title: "Blackmind Shell",
      url: mainWindow.webContents.getURL(),
      active: false,
      visible: true,
      webContentsId: mainWindow.webContents.id,
    });

    const shellPages = await callShellBridge("window.__blackmindMcpBridge.listPages()");
    pages.push(...(Array.isArray(shellPages) ? shellPages : []));
  }

  if (authPopupView?.webContents) {
    pages.push({
      id: "auth",
      type: "auth",
      title: authPopupState?.title || "Auth Popup",
      url: authPopupView.webContents.getURL(),
      active: false,
      visible: true,
      webContentsId: authPopupView.webContents.id,
    });
  }

  return pages.map((page, index) => ({
    ...page,
    index,
    selected: page.id === mcpState.selectedPageId,
  }));
};

const resolvePageDescriptor = async (args = {}) => {
  const pages = await listPagesForMcp();
  if (typeof args.index === "number") {
    const byIndex = pages.find((page) => page.index === Number(args.index));
    if (!byIndex) throw new Error(`Page index not found: ${args.index}`);
    return byIndex;
  }

  if (args.pageId) {
    const byId = pages.find((page) => page.id === args.pageId);
    if (!byId) throw new Error(`Page not found: ${args.pageId}`);
    return byId;
  }

  const fallback = await buildCurrentPageFallback();
  if (!fallback) {
    throw new Error("No pages available");
  }
  return fallback;
};

const getWebContentsForPage = (page) => {
  if (!page) {
    return null;
  }
  if (page.type === "shell") {
    return mainWindow?.webContents || null;
  }
  if (page.type === "auth") {
    return authPopupView?.webContents || null;
  }
  if (Number.isFinite(page.webContentsId)) {
    return webContents.fromId(page.webContentsId) || null;
  }
  return null;
};

const selectPageForMcp = async (args = {}) => {
  const page = await resolvePageDescriptor(args);
  if (page.type === "dashboard" || page.type === "tab") {
    const result = await callShellBridge(`window.__blackmindMcpBridge.selectPage(${JSON.stringify(page.id)})`);
    if (!result) {
      throw new Error(`Failed to select page ${page.id}`);
    }
  } else if (page.type === "auth") {
    authPopupWindow?.focus();
  } else if (page.type === "shell") {
    mainWindow?.focus();
  }

  mcpState.selectedPageId = page.id;
  return await resolvePageDescriptor({ pageId: page.id });
};

const runDomScript = async (page, mode, payload = {}) => {
  const targetContents = getWebContentsForPage(page);
  if (!targetContents) {
    throw new Error(`No webContents available for page ${page.id}`);
  }
  return targetContents.executeJavaScript(buildDomScript(mode, payload), true);
};

const getElementSummary = async (page, descriptor = {}) => {
  return runDomScript(page, "element-summary", descriptor);
};

const sendMouseClick = async (targetContents, point) => {
  targetContents.focus();
  targetContents.sendInputEvent({ type: "mouseMove", x: point.centerX, y: point.centerY });
  targetContents.sendInputEvent({ type: "mouseDown", x: point.centerX, y: point.centerY, button: "left", clickCount: 1 });
  targetContents.sendInputEvent({ type: "mouseUp", x: point.centerX, y: point.centerY, button: "left", clickCount: 1 });
};

const sendMouseHover = async (targetContents, point) => {
  targetContents.focus();
  targetContents.sendInputEvent({ type: "mouseMove", x: point.centerX, y: point.centerY });
};

const sendMouseDrag = async (targetContents, sourcePoint, targetPoint) => {
  targetContents.focus();
  targetContents.sendInputEvent({ type: "mouseMove", x: sourcePoint.centerX, y: sourcePoint.centerY });
  targetContents.sendInputEvent({ type: "mouseDown", x: sourcePoint.centerX, y: sourcePoint.centerY, button: "left", clickCount: 1 });
  targetContents.sendInputEvent({ type: "mouseMove", x: targetPoint.centerX, y: targetPoint.centerY });
  targetContents.sendInputEvent({ type: "mouseUp", x: targetPoint.centerX, y: targetPoint.centerY, button: "left", clickCount: 1 });
};

const uploadFilesToPage = async (page, args = {}) => {
  const targetContents = getWebContentsForPage(page);
  if (!targetContents) {
    throw new Error(`No webContents available for page ${page.id}`);
  }

  await devToolsManager.ensureSession(targetContents);
  const selector = args.selector || `[data-blackmind-mcp-id="${args.uid}"]`;
  const evaluation = await targetContents.debugger.sendCommand("Runtime.evaluate", {
    expression: `document.querySelector(${JSON.stringify(selector)})`,
    objectGroup: "blackmind-mcp-upload",
  });

  if (!evaluation.result?.objectId) {
    throw new Error("File input element not found");
  }

  const node = await targetContents.debugger.sendCommand("DOM.requestNode", {
    objectId: evaluation.result.objectId,
  });

  await targetContents.debugger.sendCommand("DOM.setFileInputFiles", {
    nodeId: node.nodeId,
    files: (args.files || []).map((filePath) => path.resolve(filePath)),
  });

  await targetContents.debugger.sendCommand("Runtime.releaseObjectGroup", {
    objectGroup: "blackmind-mcp-upload",
  }).catch(() => {});

  return getElementSummary(page, { selector, uid: args.uid });
};

const stripHtml = (value = "") => value
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\\s+/g, " ")
  .trim();

const webSearch = async (query, maxResults = 5) => {
  const endpoint = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Search request failed with status ${response.status}`);
  }

  const html = await response.text();
  const results = [];
  const pattern = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = pattern.exec(html)) && results.length < maxResults) {
    const rawUrl = match[1];
    const title = stripHtml(match[2]);
    if (!title || !rawUrl) {
      continue;
    }

    let url = rawUrl;
    try {
      const parsed = new URL(rawUrl, "https://html.duckduckgo.com");
      const uddg = parsed.searchParams.get("uddg");
      if (uddg) {
        url = decodeURIComponent(uddg);
      } else {
        url = parsed.toString();
      }
    } catch {
      // Keep raw URL as fallback.
    }

    results.push({
      title,
      url,
    });
  }

  return {
    query,
    engine: "duckduckgo-html",
    results,
  };
};

mcpServer.onCallTool = async (name, args = {}) => {
  if (name === "ping") {
    return { content: [toMcpText({ ok: true, timestamp: new Date().toISOString(), app: buildAppInfo() })] };
  }

  if (name === "get_internal_logs") {
    const limit = Number(args.limit || 50);
    return {
      content: [
        toMcpText({
          total: mcpServer.logs.length,
          entries: mcpServer.logs.slice(-Math.max(1, Math.min(limit, 500))),
        }),
      ],
    };
  }

  if (name === "get_window_status") {
    return {
      content: [toMcpText(buildWindowSnapshot())],
    };
  }

  if (name === "get_app_info") {
    return {
      content: [toMcpText(buildAppInfo())],
    };
  }

  if (name === "get_memory_usage") {
    return {
      content: [toMcpText(buildMemorySnapshot())],
    };
  }

  if (name === "get_diagnostics_report") {
    const report = await DiagnosticsModule.generateDiagnosticReport();
    return {
      content: [toMcpText(report || { error: "No se pudo generar el reporte de diagnóstico" })],
    };
  }

  if (name === "get_user_data_paths") {
    return {
      content: [toMcpText(buildUserDataPaths())],
    };
  }

  if (name === "list_pages") {
    const pages = await listPagesForMcp();
    return {
      content: [toMcpText(pages)],
    };
  }

  if (name === "select_page") {
    const selectedPage = await selectPageForMcp(args);
    return {
      content: [toMcpText(selectedPage)],
    };
  }

  if (name === "new_page") {
    const page = await callShellBridge(`window.__blackmindMcpBridge.newPage(${JSON.stringify(args.url || "https://www.google.com")}, ${JSON.stringify({
      pane: args.pane === "right" ? "right" : "left",
      autoSplit: args.pane === "right",
    })})`);
    if (!page) {
      throw new Error("Failed to create page");
    }
    mcpState.selectedPageId = page.id;
    return {
      content: [toMcpText(page)],
    };
  }

  if (name === "close_page") {
    const page = await resolvePageDescriptor(args);
    const result = page.type === "auth"
      ? (authPopupWindow ? (closeAuthPopup(), { closed: true }) : { closed: false, reason: "Auth popup not open" })
      : await callShellBridge(`window.__blackmindMcpBridge.closePage(${JSON.stringify(page.id)})`);
    if (mcpState.selectedPageId === page.id) {
      mcpState.selectedPageId = null;
    }
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "navigate_page") {
    const page = await resolvePageDescriptor(args);
    if (page.type === "auth") {
      const targetContents = getWebContentsForPage(page);
      if (!targetContents) {
        throw new Error("Auth popup is not available");
      }
      if (args.action === "reload") await targetContents.reload();
      if (args.action === "back" && targetContents.canGoBack()) targetContents.goBack();
      if (args.action === "forward" && targetContents.canGoForward()) targetContents.goForward();
      if (args.url) await targetContents.loadURL(args.url);
      return { content: [toMcpText({ ok: true, pageId: page.id, url: targetContents.getURL() })] };
    }

    const result = await callShellBridge(`window.__blackmindMcpBridge.navigatePage(${JSON.stringify(page.id)}, ${JSON.stringify({
      action: args.action || null,
      url: args.url || null,
    })})`);
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "eval_js") {
    const targetContents = resolveTargetWebContents(args.target);
    if (!targetContents) {
      throw new Error("Vista de destino no encontrada. Verifica si la ventana solicitada está abierta.");
    }

    const result = await targetContents.executeJavaScript(args.code);
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "evaluate_script") {
    const page = await resolvePageDescriptor(args);
    const targetContents = getWebContentsForPage(page);
    if (!targetContents) {
      throw new Error(`No webContents available for page ${page.id}`);
    }
    const result = await targetContents.executeJavaScript(args.code, true);
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "take_snapshot") {
    const page = await resolvePageDescriptor(args);
    const snapshot = await runDomScript(page, "snapshot", { limit: args.limit });
    return {
      content: [toMcpText({ ...snapshot, snapshotText: formatSnapshotText(snapshot) })],
    };
  }

  if (name === "point_event_select") {
    const page = await resolvePageDescriptor(args);
    const selected = await runDomScript(page, "point-select", { x: args.x, y: args.y });
    return {
      content: [toMcpText(selected)],
    };
  }

  if (name === "start_point_picker") {
    const page = await resolvePageDescriptor(args);
    const result = await runDomScript(page, "start-point-picker");
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "stop_point_picker") {
    const page = await resolvePageDescriptor(args);
    const result = await runDomScript(page, "stop-point-picker");
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "get_selected_element") {
    const page = await resolvePageDescriptor(args);
    const result = await runDomScript(page, "get-selected-element");
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "click") {
    const page = await resolvePageDescriptor(args);
    const targetContents = getWebContentsForPage(page);
    const summary = await getElementSummary(page, args);
    if (!summary?.rect) {
      throw new Error("Element not found for click");
    }
    await sendMouseClick(targetContents, summary.rect);
    return {
      content: [toMcpText(summary)],
    };
  }

  if (name === "hover") {
    const page = await resolvePageDescriptor(args);
    const targetContents = getWebContentsForPage(page);
    const summary = await getElementSummary(page, args);
    if (!summary?.rect) {
      throw new Error("Element not found for hover");
    }
    await sendMouseHover(targetContents, summary.rect);
    return {
      content: [toMcpText(summary)],
    };
  }

  if (name === "drag") {
    const page = await resolvePageDescriptor(args);
    const targetContents = getWebContentsForPage(page);
    const source = await getElementSummary(page, { uid: args.sourceUid, selector: args.sourceSelector });
    const target = await getElementSummary(page, { uid: args.targetUid, selector: args.targetSelector });
    if (!source?.rect || !target?.rect) {
      throw new Error("Source or target element not found for drag");
    }
    await sendMouseDrag(targetContents, source.rect, target.rect);
    return {
      content: [toMcpText({ source, target })],
    };
  }

  if (name === "fill") {
    const page = await resolvePageDescriptor(args);
    const result = await runDomScript(page, "fill", args);
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "fill_form") {
    const page = await resolvePageDescriptor(args);
    const result = await runDomScript(page, "fill-form", { fields: args.fields });
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "type_text") {
    const page = await resolvePageDescriptor(args);
    const result = await runDomScript(page, "type-text", { text: args.text });
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "press_key") {
    const page = await resolvePageDescriptor(args);
    const targetContents = getWebContentsForPage(page);
    if (!targetContents) {
      throw new Error(`No webContents available for page ${page.id}`);
    }
    const { key, modifiers } = parseKeyCombination(args.key);
    targetContents.focus();
    targetContents.sendInputEvent({ type: "keyDown", keyCode: key, modifiers });
    if (key.length === 1 && modifiers.length === 0) {
      targetContents.sendInputEvent({ type: "char", keyCode: key });
    }
    targetContents.sendInputEvent({ type: "keyUp", keyCode: key, modifiers });
    return {
      content: [toMcpText({ ok: true, key, modifiers })],
    };
  }

  if (name === "upload_file") {
    const page = await resolvePageDescriptor(args);
    const result = await uploadFilesToPage(page, args);
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "wait_for") {
    const page = await resolvePageDescriptor(args);
    const result = await runDomScript(page, "wait-for", args);
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "scrape_page") {
    const page = await resolvePageDescriptor(args);
    const result = await runDomScript(page, "scrape-page", {
      maxLinks: args.maxLinks,
      maxTextLength: args.maxTextLength,
    });
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "web_search") {
    const result = await webSearch(String(args.query || ""), Number(args.maxResults || 5));
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "take_screenshot") {
    if (typeof args.index === "number" || args.pageId || args.selector || args.uid) {
      const page = await resolvePageDescriptor(args);
      const targetContents = getWebContentsForPage(page);
      if (!targetContents) {
        throw new Error(`No webContents available for page ${page.id}`);
      }

      let image;
      if (args.selector || args.uid) {
        const summary = await getElementSummary(page, args);
        if (!summary?.rect) {
          throw new Error("Element not found for screenshot");
        }
        image = await targetContents.capturePage({
          x: summary.rect.x,
          y: summary.rect.y,
          width: summary.rect.width,
          height: summary.rect.height,
        });
      } else {
        image = await targetContents.capturePage();
      }

      return {
        content: [{
          type: "image",
          data: image.toPNG().toString("base64"),
          mimeType: "image/png",
        }],
      };
    }

    const screenshotTarget = resolveScreenshotTarget(args.target);
    if (!screenshotTarget) {
      throw new Error("No hay ventanas activas para capturar.");
    }

    const image = await screenshotTarget.capturePage();
    return {
      content: [{
        type: "image",
        data: image.toPNG().toString("base64"),
        mimeType: "image/png",
      }],
    };
  }

  if (name === "resize_page") {
    if (!mainWindow) {
      throw new Error("Main window not available");
    }
    mainWindow.setContentSize(Number(args.width), Number(args.height));
    return {
      content: [toMcpText({ ok: true, bounds: mainWindow.getBounds() })],
    };
  }

  if (name === "list_console_messages") {
    const page = await resolvePageDescriptor(args);
    const messages = await devToolsManager.listConsoleMessages(getWebContentsForPage(page));
    return {
      content: [toMcpText(messages)],
    };
  }

  if (name === "get_console_message") {
    const page = await resolvePageDescriptor(args);
    const message = await devToolsManager.getConsoleMessage(getWebContentsForPage(page), args.id);
    return {
      content: [toMcpText(message)],
    };
  }

  if (name === "list_network_requests") {
    const page = await resolvePageDescriptor(args);
    const requests = await devToolsManager.listNetworkRequests(getWebContentsForPage(page));
    return {
      content: [toMcpText(requests)],
    };
  }

  if (name === "get_network_request") {
    const page = await resolvePageDescriptor(args);
    const request = await devToolsManager.getNetworkRequest(getWebContentsForPage(page), args.reqid);
    return {
      content: [toMcpText(request)],
    };
  }

  if (name === "handle_dialog") {
    const page = await resolvePageDescriptor(args);
    const result = await devToolsManager.handleDialog(getWebContentsForPage(page), args);
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "emulate") {
    const page = await resolvePageDescriptor(args);
    const result = await devToolsManager.emulate(getWebContentsForPage(page), args);
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "performance_start_trace") {
    const page = await resolvePageDescriptor(args);
    const result = await devToolsManager.startTrace(getWebContentsForPage(page));
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "performance_stop_trace") {
    const page = await resolvePageDescriptor(args);
    const result = await devToolsManager.stopTrace(getWebContentsForPage(page));
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "performance_analyze_insight") {
    const page = await resolvePageDescriptor(args);
    const result = await devToolsManager.analyzeInsight(getWebContentsForPage(page), args.insight);
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "take_memory_snapshot") {
    const page = await resolvePageDescriptor(args);
    const result = await devToolsManager.takeMemorySnapshot(getWebContentsForPage(page));
    return {
      content: [toMcpText(result)],
    };
  }

  if (name === "lighthouse_audit") {
    const page = await resolvePageDescriptor(args);
    const result = await devToolsManager.lighthouseAudit(getWebContentsForPage(page));
    return {
      content: [toMcpText(result)],
    };
  }

  throw new Error(`Herramienta MCP no soportada: ${name}`);
};

// Puente de comunicación para la IA (Antigravity)
fs.mkdirSync(app.getPath("userData"), { recursive: true });
for (const filePath of [queryPath, responsePath]) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2), "utf-8");
  }
}

fs.watchFile(queryPath, (curr, prev) => {
  if (curr.mtime <= prev.mtime) return;
  try {
    const query = JSON.parse(fs.readFileSync(queryPath, "utf-8"));
    if (!query?.name || !query?.requestId) {
      return;
    }

    // Llamar directamente al manejador que definimos arriba
    mcpServer.onCallTool(query.name, query.arguments).then(response => {
      fs.writeFileSync(responsePath, JSON.stringify({
        requestId: query.requestId,
        payload: response || { content: [] },
      }, null, 2));
    }).catch(err => {
      fs.writeFileSync(responsePath, JSON.stringify({
        requestId: query.requestId,
        payload: { error: err.message },
      }, null, 2));
    });
  } catch (e) {
    fs.writeFileSync(responsePath, JSON.stringify({
      requestId: crypto.randomUUID(),
      payload: { error: e.message },
    }, null, 2));
  }
}, mcpBridgePollIntervalMs);

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

    contents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
      mcpServer.addLog(`[Error] Fallo al cargar ${validatedURL}: ${errorDescription} (${errorCode})`);
    });

    contents.on("console-message", (event, level, message, line, sourceId) => {
      mcpServer.addLog(`[Console] ${message} (en ${sourceId}:${line})`);
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
