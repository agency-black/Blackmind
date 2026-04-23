const { contextBridge, ipcRenderer } = require('electron');

// Burlar detección de Google / Webdriver
try {
  Object.defineProperty(navigator, 'webdriver', { get: () => false });
  Object.defineProperty(navigator, 'languages', { get: () => ['es-419', 'es', 'en-US', 'en'] });
} catch (e) {}

contextBridge.exposeInMainWorld('electronAPI', {
    saveState: (state) => ipcRenderer.send('save-state', state),
    onRestoreState: (callback) => {
        ipcRenderer.on('restore-state', (event, state) => callback(state));
    },
    loadLocalUrl: (relativePath) => ipcRenderer.invoke('load-local-url', relativePath),
    getAipexExtId: () => ipcRenderer.invoke('get-aipex-ext-id'),
    authPopup: {
        open: (payload) => ipcRenderer.invoke('auth-popup:open', payload),
        close: () => ipcRenderer.invoke('auth-popup:close'),
        minimize: () => ipcRenderer.invoke('auth-popup:minimize'),
        toggleMaximize: () => ipcRenderer.invoke('auth-popup:toggle-maximize'),
        onState: (callback) => {
            const listener = (_event, state) => callback(state);
            ipcRenderer.on('auth-popup:state', listener);
            return () => {
                ipcRenderer.removeListener('auth-popup:state', listener);
            };
        },
        onCompleted: (callback) => {
            const listener = (_event, payload) => callback(payload);
            ipcRenderer.on('auth-popup:completed', listener);
            return () => {
                ipcRenderer.removeListener('auth-popup:completed', listener);
            };
        }
    },
    contextMenu: {
        show: (payload) => ipcRenderer.invoke('context-menu:show', payload),
        onAction: (callback) => {
            const listener = (_event, actionData) => callback(_event, actionData);
            ipcRenderer.on('context-menu:action', listener);
            return () => {
                ipcRenderer.removeListener('context-menu:action', listener);
            };
        }
    },
    shell: {
        openExternal: (url) => ipcRenderer.invoke('shell:open-external', url)
    },
    downloads: {
        downloadFile: (url) => ipcRenderer.invoke('downloads:download-file', url),
        saveImage: (url, suggestedName) => ipcRenderer.invoke('downloads:save-image', url, suggestedName),
        saveVideo: (url) => ipcRenderer.invoke('downloads:save-video', url),
        saveAudio: (url) => ipcRenderer.invoke('downloads:save-audio', url),
        showSaveDialog: (defaultName, filters) => ipcRenderer.invoke('downloads:show-save-dialog', defaultName, filters)
    },
    clipboard: {
        writeImage: (imageUrl) => ipcRenderer.invoke('clipboard:write-image', imageUrl)
    },
    dictionary: {
        define: (text) => ipcRenderer.invoke('dictionary:define', text),
        translate: (text, targetLanguage) => ipcRenderer.invoke('dictionary:translate', text, targetLanguage)
    },
    share: {
        share: (payload) => ipcRenderer.invoke('share:share', payload)
    },
    bookmarks: {
        add: (url, title) => ipcRenderer.invoke('bookmarks:add', url, title),
        list: () => ipcRenderer.invoke('bookmarks:list'),
        remove: (url) => ipcRenderer.invoke('bookmarks:remove', url)
    },
    history: {
        setLastClosedTab: (tab) => ipcRenderer.invoke('history:set-last-closed-tab', tab),
        popClosedTab: () => ipcRenderer.invoke('history:pop-closed-tab'),
        onReopenClosedTab: (callback) => {
            const listener = (_event, tab) => callback(tab);
            ipcRenderer.on('history:reopen-closed-tab', listener);
            return () => {
                ipcRenderer.removeListener('history:reopen-closed-tab', listener);
            };
        }
    },
    devTools: {
        inspect: (webviewId, x, y) => ipcRenderer.invoke('devtools:inspect', webviewId, x, y),
        openConsole: () => ipcRenderer.invoke('devtools:open-console'),
        viewSource: (url) => ipcRenderer.invoke('devtools:view-source', url)
    },
    passwords: {
        generate: (length) => ipcRenderer.invoke('passwords:generate', length),
        get: (service, account) => ipcRenderer.invoke('passwords:get', service, account),
        set: (service, account, password) => ipcRenderer.invoke('passwords:set', service, account, password)
    },
    spellCheck: {
        addWord: (word) => ipcRenderer.invoke('spellcheck:add-word', word),
        ignoreWord: (word) => ipcRenderer.invoke('spellcheck:ignore-word', word)
    },
    screenshots: {
        capture: () => ipcRenderer.invoke('screenshots:capture'),
        captureFull: () => ipcRenderer.invoke('screenshots:capture-full')
    }
});
