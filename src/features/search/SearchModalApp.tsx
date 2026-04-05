import { type FormEvent, type KeyboardEvent, useEffect, useRef } from "react"

const closeSearchModal = (): void => {
    const searchModal = document.getElementById('search-modal')
    if (searchModal) {
        searchModal.classList.remove('active')
    }
    document.body.classList.remove('search-modal-open')
}

const normalizeDirectUrl = (value: string): string | null => {
    const input = value.trim()
    if (!input || /\s/.test(input)) return null

    try {
        const parsed = new URL(input)
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.toString()
        }
        return null
    } catch {
        const looksLikeLocalhost = /^localhost(?::\d+)?(\/.*)?$/i.test(input)
        const looksLikeIpv4 = /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(\/.*)?$/.test(input)
        const looksLikeDomain = /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(\/.*)?$/i.test(input)

        if (!looksLikeLocalhost && !looksLikeIpv4 && !looksLikeDomain) {
            return null
        }

        const protocol = looksLikeLocalhost || looksLikeIpv4 ? 'http://' : 'https://'

        try {
            const parsed = new URL(`${protocol}${input}`)
            return parsed.toString()
        } catch {
            return null
        }
    }
}

export const SearchModalApp = (): JSX.Element => {
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }, [])

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        const search = formData.get('search') as string

        if (search && search.trim()) {
            const normalizedUrl = normalizeDirectUrl(search)
            window.addNewTab?.(normalizedUrl || `https://www.google.com/search?q=${encodeURIComponent(search.trim())}`)
            closeSearchModal()
            (e.target as HTMLFormElement).reset()
        }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            closeSearchModal()
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={{ 
                position: 'relative', 
                width: '100%', 
                maxWidth: '578px',
                display: 'flex',
                alignItems: 'center',
            }}>
                <div style={{ position: 'relative', width: '100%' }}>
                    <svg 
                        style={{ 
                            position: 'absolute', 
                            left: '14px', 
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#d1d1d1',
                            pointerEvents: 'none',
                            zIndex: 1
                        }} 
                        width="18" 
                        height="18" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="1.5"
                    >
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input
                        ref={inputRef}
                        name="search"
                        type="text"
                        style={{
                            width: '100%',
                            height: '48px',
                            paddingLeft: '42px',
                            paddingRight: '14px',
                            backgroundColor: 'rgba(0,0,0,0.25)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '14px',
                            color: '#d1d1d1',
                            fontSize: '15px',
                            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                            fontWeight: 400,
                            outline: 'none',
                            transition: 'all 0.2s ease',
                        }}
                        placeholder="Search or enter a URL..."
                        autoComplete="off"
                        onKeyDown={handleKeyDown}
                        onFocus={(e) => {
                            e.target.style.backgroundColor = 'rgba(0,0,0,0.35)'
                            e.target.style.borderColor = 'rgba(255,255,255,0.15)'
                            e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'
                        }}
                        onBlur={(e) => {
                            e.target.style.backgroundColor = 'rgba(0,0,0,0.25)'
                            e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                            e.target.style.boxShadow = 'none'
                        }}
                    />
                </div>
            </div>
        </form>
    )
}
