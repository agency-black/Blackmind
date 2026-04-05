import React from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

export function SidebarApp() {
    const [favorites, setFavorites] = React.useState<BookmarkItem[]>([])

    const loadFavorites = React.useCallback(async () => {
        const items = await window.electronAPI?.bookmarks?.list?.()
        setFavorites(Array.isArray(items) ? items : [])
    }, [])

    React.useEffect(() => {
        loadFavorites()

        const handleFavoritesUpdated = () => {
            loadFavorites()
        }

        window.addEventListener('bookmarks-updated', handleFavoritesUpdated)
        return () => {
            window.removeEventListener('bookmarks-updated', handleFavoritesUpdated)
        }
    }, [loadFavorites])

    const handleOpenFavorite = React.useCallback((url: string) => {
        window.addNewTab?.(url, { pane: 'left', autoSplit: false, keepOverviewOpen: false })
    }, [])

    const handleRemoveFavorite = React.useCallback(async (url: string) => {
        await window.electronAPI?.bookmarks?.remove?.(url)
        await loadFavorites()
    }, [loadFavorites])

    return (
        <TooltipProvider delayDuration={0}>
            <SidebarProvider
                defaultOpen={true}
                className="h-full min-h-0 overflow-hidden"
                style={
                    {
                        height: '100%',
                        minHeight: 0,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    } as React.CSSProperties
                }
            >
                <AppSidebar
                    favorites={favorites}
                    onOpenFavorite={handleOpenFavorite}
                    onRemoveFavorite={handleRemoveFavorite}
                />
            </SidebarProvider>
        </TooltipProvider>
    )
}
