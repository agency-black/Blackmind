const buildShellBridgeScript = () => `
(() => {
  if (window.__blackmindMcpBridge) {
    return true;
  }

  const toPageDescriptor = (page) => ({
    id: page.id,
    type: page.type,
    tabId: page.tabId || null,
    pane: page.pane || null,
    title: page.title || '',
    url: page.url || '',
    active: Boolean(page.active),
    visible: page.visible !== false,
    webContentsId: Number.isFinite(page.webContentsId) ? page.webContentsId : null,
  });

  const getDashboardWebview = () => document.getElementById('wv-left');

  const getSafeWebContentsId = (wv) => {
    try {
      return typeof wv?.getWebContentsId === 'function' ? wv.getWebContentsId() : null;
    } catch {
      return null;
    }
  };

  const getActiveTabRecord = () => {
    return typeof activeTabId === 'string'
      ? tabs.find((tab) => tab.id === activeTabId) || null
      : null;
  };

  const getPages = () => {
    const pages = [];
    const dashboard = getDashboardWebview();
    pages.push(toPageDescriptor({
      id: 'dashboard',
      type: 'dashboard',
      title: 'Dashboard',
      url: typeof dashboard?.getURL === 'function' ? dashboard.getURL() : (dashboard?.src || ''),
      active: !getActiveTabRecord(),
      visible: true,
      webContentsId: getSafeWebContentsId(dashboard),
    }));

    tabs.forEach((tab) => {
      pages.push(toPageDescriptor({
        id: 'tab:' + tab.id,
        type: 'tab',
        tabId: tab.id,
        pane: typeof getTabPane === 'function' ? getTabPane(tab) : (tab.pane === 'right' ? 'right' : 'left'),
        title: tab.title || 'New Tab',
        url: tab.url || '',
        active: tab.id === activeTabId,
        visible: Boolean(tab.container?.classList.contains('active')),
        webContentsId: getSafeWebContentsId(tab.webview),
      }));
    });

    return pages;
  };

  const findTabByPageId = (pageId) => {
    if (typeof pageId !== 'string' || !pageId.startsWith('tab:')) {
      return null;
    }
    const tabId = pageId.slice(4);
    return tabs.find((tab) => tab.id === tabId) || null;
  };

  window.__blackmindMcpBridge = {
    listPages() {
      return getPages();
    },
    getPage(pageId) {
      return getPages().find((page) => page.id === pageId) || null;
    },
    getActivePage() {
      return getPages().find((page) => page.active) || getPages()[0] || null;
    },
    selectPage(pageId) {
      if (pageId === 'dashboard') {
        if (typeof switchToMainApp === 'function') {
          switchToMainApp();
        }
        return this.getPage('dashboard');
      }

      const tab = findTabByPageId(pageId);
      if (tab && typeof switchTab === 'function') {
        switchTab(tab.id, { keepOverviewOpen: false });
        return this.getPage(pageId);
      }

      return null;
    },
    newPage(url, options = {}) {
      const safeUrl = typeof normalizeNavigableUrl === 'function'
        ? (normalizeNavigableUrl(url || '') || 'https://www.google.com')
        : (url || 'https://www.google.com');
      const pane = options.pane === 'right' ? 'right' : 'left';
      const tabId = typeof addNewTab === 'function'
        ? addNewTab(safeUrl, {
            pane,
            autoSplit: options.autoSplit !== false,
            keepOverviewOpen: false,
          })
        : null;
      return tabId ? this.getPage('tab:' + tabId) : null;
    },
    closePage(pageId) {
      const tab = findTabByPageId(pageId);
      if (!tab) {
        return { closed: false, reason: 'Page not found or not closable' };
      }

      if (tabs.length <= 1) {
        return { closed: false, reason: 'The last open page cannot be closed' };
      }

      if (typeof closeTab === 'function') {
        const event = new MouseEvent('click', { bubbles: true });
        closeTab(event, tab.id);
        return { closed: true };
      }

      return { closed: false, reason: 'closeTab is not available' };
    },
    navigatePage(pageId, payload = {}) {
      const page = this.getPage(pageId);
      if (!page) {
        return { ok: false, reason: 'Page not found' };
      }

      if (pageId === 'dashboard') {
        const dashboard = getDashboardWebview();
        if (!dashboard) {
          return { ok: false, reason: 'Dashboard webview not found' };
        }

        if (payload.action === 'reload') {
          dashboard.reload();
          return { ok: true };
        }

        if (payload.action === 'back') {
          if (dashboard.canGoBack?.()) {
            dashboard.goBack();
          }
          return { ok: true };
        }

        if (payload.action === 'forward') {
          if (dashboard.canGoForward?.()) {
            dashboard.goForward();
          }
          return { ok: true };
        }

        if (payload.url) {
          dashboard.loadURL(payload.url);
          return { ok: true };
        }
      }

      const tab = findTabByPageId(pageId);
      const wv = tab?.webview;
      if (!wv) {
        return { ok: false, reason: 'Tab webview not found' };
      }

      if (payload.action === 'reload') {
        wv.reload();
        return { ok: true };
      }

      if (payload.action === 'back') {
        if (wv.canGoBack?.()) {
          wv.goBack();
        }
        return { ok: true };
      }

      if (payload.action === 'forward') {
        if (wv.canGoForward?.()) {
          wv.goForward();
        }
        return { ok: true };
      }

      if (payload.url) {
        wv.loadURL(payload.url);
        return { ok: true };
      }

      return { ok: false, reason: 'No navigation action specified' };
    },
  };

  return true;
})();
`;

module.exports = {
  buildShellBridgeScript,
};
