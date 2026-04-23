class BlackmindDevToolsManager {
  constructor() {
    this.sessions = new Map();
  }

  async ensureSession(targetWebContents) {
    if (!targetWebContents) {
      throw new Error("Target webContents not found");
    }

    const key = targetWebContents.id;
    if (this.sessions.has(key)) {
      return this.sessions.get(key);
    }

    if (!targetWebContents.debugger.isAttached()) {
      targetWebContents.debugger.attach("1.3");
    }

    const session = {
      consoleMessages: [],
      networkRequests: new Map(),
      requestCounter: 0,
      consoleCounter: 0,
      pendingDialog: null,
      trace: null,
      lastTrace: null,
      lastMetrics: null,
    };

    targetWebContents.debugger.on("message", (_event, method, params) => {
      if (method === "Runtime.consoleAPICalled") {
        session.consoleCounter += 1;
        session.consoleMessages.push({
          id: session.consoleCounter,
          type: "runtime",
          level: params.type,
          text: (params.args || []).map((arg) => arg.value ?? arg.description ?? "").join(" "),
          url: params.stackTrace?.callFrames?.[0]?.url || "",
          line: params.stackTrace?.callFrames?.[0]?.lineNumber ?? null,
          timestamp: params.timestamp || Date.now(),
        });
      }

      if (method === "Log.entryAdded") {
        session.consoleCounter += 1;
        session.consoleMessages.push({
          id: session.consoleCounter,
          type: "log",
          level: params.entry?.level || "info",
          text: params.entry?.text || "",
          url: params.entry?.url || "",
          line: params.entry?.lineNumber ?? null,
          timestamp: params.entry?.timestamp || Date.now(),
        });
      }

      if (method === "Network.requestWillBeSent") {
        session.requestCounter += 1;
        session.networkRequests.set(params.requestId, {
          reqid: params.requestId,
          id: session.requestCounter,
          url: params.request?.url || "",
          method: params.request?.method || "GET",
          type: params.type || "",
          status: null,
          statusText: "",
          requestHeaders: params.request?.headers || {},
          responseHeaders: {},
          startedAt: params.timestamp || Date.now(),
        });
      }

      if (method === "Network.responseReceived") {
        const request = session.networkRequests.get(params.requestId);
        if (request) {
          request.status = params.response?.status ?? null;
          request.statusText = params.response?.statusText || "";
          request.mimeType = params.response?.mimeType || "";
          request.remoteIPAddress = params.response?.remoteIPAddress || "";
          request.responseHeaders = params.response?.headers || {};
        }
      }

      if (method === "Network.loadingFinished") {
        const request = session.networkRequests.get(params.requestId);
        if (request) {
          request.finishedAt = params.timestamp || Date.now();
          request.encodedDataLength = params.encodedDataLength ?? null;
        }
      }

      if (method === "Network.loadingFailed") {
        const request = session.networkRequests.get(params.requestId);
        if (request) {
          request.failed = true;
          request.errorText = params.errorText || "unknown";
          request.finishedAt = params.timestamp || Date.now();
        }
      }

      if (method === "Page.javascriptDialogOpening") {
        session.pendingDialog = {
          type: params.type,
          message: params.message,
          defaultPrompt: params.defaultPrompt || "",
          hasBrowserHandler: params.hasBrowserHandler ?? false,
        };
      }

      if (method === "Page.javascriptDialogClosed") {
        session.pendingDialog = null;
      }

      if (method === "Tracing.dataCollected" && session.trace) {
        session.trace.events.push(...(params.value || []));
      }
    });

    targetWebContents.once("destroyed", () => {
      this.sessions.delete(key);
    });

    await targetWebContents.debugger.sendCommand("Runtime.enable");
    await targetWebContents.debugger.sendCommand("Log.enable");
    await targetWebContents.debugger.sendCommand("Network.enable");
    await targetWebContents.debugger.sendCommand("Page.enable");
    await targetWebContents.debugger.sendCommand("Performance.enable");

    this.sessions.set(key, session);
    return session;
  }

  async listConsoleMessages(targetWebContents) {
    const session = await this.ensureSession(targetWebContents);
    return session.consoleMessages;
  }

  async getConsoleMessage(targetWebContents, id) {
    const session = await this.ensureSession(targetWebContents);
    return session.consoleMessages.find((message) => message.id === Number(id)) || null;
  }

  async listNetworkRequests(targetWebContents) {
    const session = await this.ensureSession(targetWebContents);
    return Array.from(session.networkRequests.values());
  }

  async getNetworkRequest(targetWebContents, reqid) {
    const session = await this.ensureSession(targetWebContents);
    if (reqid) {
      return session.networkRequests.get(reqid) || null;
    }
    return Array.from(session.networkRequests.values()).at(-1) || null;
  }

  async emulate(targetWebContents, payload = {}) {
    await this.ensureSession(targetWebContents);
    const width = Number(payload.width || 1280);
    const height = Number(payload.height || 800);
    const mobile = Boolean(payload.mobile);
    const deviceScaleFactor = Number(payload.deviceScaleFactor || 1);

    await targetWebContents.debugger.sendCommand("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      mobile,
      deviceScaleFactor,
    });

    if (payload.media) {
      await targetWebContents.debugger.sendCommand("Emulation.setEmulatedMedia", {
        media: String(payload.media),
      });
    }

    if (payload.userAgent) {
      await targetWebContents.debugger.sendCommand("Emulation.setUserAgentOverride", {
        userAgent: String(payload.userAgent),
      });
    }

    return { ok: true, width, height, mobile, deviceScaleFactor };
  }

  async handleDialog(targetWebContents, payload = {}) {
    const session = await this.ensureSession(targetWebContents);
    if (!session.pendingDialog) {
      return { ok: false, reason: "No pending dialog" };
    }

    await targetWebContents.debugger.sendCommand("Page.handleJavaScriptDialog", {
      accept: payload.accept !== false,
      promptText: payload.promptText || "",
    });

    return { ok: true };
  }

  async startTrace(targetWebContents) {
    const session = await this.ensureSession(targetWebContents);
    session.trace = {
      startedAt: Date.now(),
      events: [],
    };

    await targetWebContents.debugger.sendCommand("Tracing.start", {
      categories: "devtools.timeline,v8.execute,blink.user_timing,loading,disabled-by-default-v8.cpu_profiler",
      transferMode: "ReportEvents",
    });

    return { ok: true };
  }

  async stopTrace(targetWebContents) {
    const session = await this.ensureSession(targetWebContents);
    if (!session.trace) {
      return { ok: false, reason: "No active trace" };
    }

    await targetWebContents.debugger.sendCommand("Tracing.end");
    await new Promise((resolve) => setTimeout(resolve, 300));

    const metricsResponse = await targetWebContents.debugger.sendCommand("Performance.getMetrics");
    const metrics = Object.fromEntries((metricsResponse.metrics || []).map((metric) => [metric.name, metric.value]));
    session.lastMetrics = metrics;
    session.lastTrace = {
      startedAt: session.trace.startedAt,
      stoppedAt: Date.now(),
      eventCount: session.trace.events.length,
      metrics,
    };
    session.trace = null;
    return session.lastTrace;
  }

  async analyzeInsight(targetWebContents, insightName) {
    const session = await this.ensureSession(targetWebContents);
    if (!session.lastTrace) {
      return { ok: false, reason: "No completed trace available" };
    }

    const metrics = session.lastTrace.metrics || {};
    const mapping = {
      jsHeap: ["JSHeapUsedSize", "JSHeapTotalSize"],
      nodes: ["Nodes"],
      layout: ["LayoutCount", "RecalcStyleCount"],
      script: ["ScriptDuration", "TaskDuration"],
    };

    const keys = mapping[insightName] || [insightName];
    return {
      insight: insightName,
      values: Object.fromEntries(keys.map((key) => [key, metrics[key] ?? null])),
      trace: session.lastTrace,
    };
  }

  async takeMemorySnapshot(targetWebContents) {
    await this.ensureSession(targetWebContents);
    const heapUsage = await targetWebContents.debugger.sendCommand("Runtime.getHeapUsage");
    const domCounters = await targetWebContents.debugger.sendCommand("Memory.getDOMCounters").catch(() => null);
    return {
      heapUsage,
      domCounters,
      capturedAt: new Date().toISOString(),
    };
  }

  async lighthouseAudit(targetWebContents) {
    const session = await this.ensureSession(targetWebContents);
    const metricsResponse = await targetWebContents.debugger.sendCommand("Performance.getMetrics");
    const metrics = Object.fromEntries((metricsResponse.metrics || []).map((metric) => [metric.name, metric.value]));
    const score = {
      accessibility: metrics.Nodes ? Math.max(0, Math.min(1, 1 - metrics.Nodes / 5000)) : null,
      seo: metrics.Documents ? Math.max(0, Math.min(1, 1 - (metrics.Documents - 1) * 0.1)) : null,
      bestPractices: metrics.JSEventListeners ? Math.max(0, Math.min(1, 1 - metrics.JSEventListeners / 500)) : null,
    };
    session.lastMetrics = metrics;
    return {
      mode: "heuristic",
      note: "Approximate audit based on DevTools metrics. This is not a full Lighthouse run.",
      score,
      metrics,
    };
  }
}

module.exports = {
  BlackmindDevToolsManager,
};
