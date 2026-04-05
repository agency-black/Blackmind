export {}

declare global {
    interface AuthPopupState {
        sourceTabId: string | null
        url: string
        title: string
        favicon: string
        host: string
    }

    interface ContextMenuPayload {
        type: 'navigation' | 'link' | 'image' | 'text' | 'input' | 'tab'
        data: any
    }

    interface SharePayload {
        title?: string
        text?: string
        url?: string
    }

    interface HistoryTab {
        url: string
        title: string
        favicon?: string
        [key: string]: any
    }

    interface BookmarkItem {
        url: string
        title: string
        createdAt?: string
    }

    interface DownloadFileFilter {
        name: string
        extensions: string[]
    }

    interface DownloadSaveReturnValue {
        canceled: boolean
        filePath?: string
    }

    interface AddNewTabOptions {
        pane?: 'left' | 'right'
        autoSplit?: boolean
        keepOverviewOpen?: boolean
        activate?: boolean
    }

    interface Window {
        addNewTab?: (url: string, options?: AddNewTabOptions) => void
        navigateMainDashboardRoute?: (url: string) => void
        electronAPI?: {
            saveState: (state: unknown) => void
            onRestoreState: (callback: (state: unknown) => void) => void
            loadLocalUrl: (relativePath: string) => Promise<string>
            getAipexExtId: () => Promise<string | null>
            
            authPopup: {
                open: (payload: { url: string; sourceTabId?: string | null; title?: string }) => Promise<boolean>
                close: () => Promise<void>
                minimize: () => Promise<void>
                toggleMaximize: () => Promise<void>
                onState: (callback: (state: AuthPopupState) => void) => () => void
                onCompleted: (callback: (payload: { sourceTabId: string | null; url: string }) => void) => () => void
            }

            contextMenu: {
                show: (payload: ContextMenuPayload) => Promise<void>
                onAction: (callback: (event: any, actionData: any) => void) => () => void
            }

            shell: {
                openExternal: (url: string) => Promise<void>
            }

            downloads: {
                downloadFile: (url: string) => Promise<string | null>
                saveImage: (url: string, suggestedName?: string) => Promise<string | null>
                saveVideo: (url: string) => Promise<string | null>
                saveAudio: (url: string) => Promise<string | null>
                showSaveDialog: (defaultName?: string, filters?: DownloadFileFilter[]) => Promise<DownloadSaveReturnValue>
            }

            clipboard: {
                writeImage: (imageUrl: string) => Promise<void>
            }

            dictionary: {
                define: (text: string) => Promise<any>
                translate: (text: string, targetLanguage: string) => Promise<any>
            }

            share: {
                share: (payload: SharePayload) => Promise<void>
            }

            bookmarks: {
                add: (url: string, title: string) => Promise<boolean>
                list: () => Promise<BookmarkItem[]>
                remove: (url: string) => Promise<boolean>
            }

            history: {
                setLastClosedTab: (tab: HistoryTab) => Promise<void>
                popClosedTab: () => Promise<HistoryTab | null>
                onReopenClosedTab: (callback: (tab: HistoryTab) => void) => () => void
            }

            devTools: {
                inspect: (webviewId: string, x: number, y: number) => Promise<void>
                openConsole: () => Promise<void>
                viewSource: (url: string) => Promise<void>
            }

            passwords: {
                generate: (length?: number) => Promise<string>
                get: (service: string, account: string) => Promise<string>
                set: (service: string, account: string, password: string) => Promise<boolean>
            }

            spellCheck: {
                addWord: (word: string) => Promise<void>
                ignoreWord: (word: string) => Promise<void>
            }

            screenshots: {
                capture: () => Promise<string | null>
                captureFull: () => Promise<string | null>
            }
        }
    }
}
