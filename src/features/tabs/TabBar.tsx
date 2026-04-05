import { type MouseEvent, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
}

interface TabsUpdatedEventDetail {
  tabs?: Tab[];
  activeTabId?: string;
}

export function TabBar(): JSX.Element {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.toggle('has-tabs', tabs.length > 0);
  }, [tabs]);

  useEffect(() => {
    const handleTabUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<TabsUpdatedEventDetail>;
      setTabs(customEvent.detail.tabs || []);
      setActiveTab(customEvent.detail.activeTabId || '');
    };

    window.addEventListener('tabs-updated', handleTabUpdate);

    const requestInitialState = new CustomEvent('request-tabs-state');
    window.dispatchEvent(requestInitialState);

    return () => {
      window.removeEventListener('tabs-updated', handleTabUpdate);
    };
  }, []);


  const handleTabClick = (tabId: string) => {
    window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tabId } }));
  };

  const handleClose = (e: MouseEvent, tabId: string) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('close-tab', { detail: { tabId } }));
  };

  const handleAddTab = () => {
    window.dispatchEvent(new CustomEvent('add-tab', {
      detail: { url: 'https://www.google.com' }
    }));
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        width: '100%',
        gap: 2,
        height: '30px',
      }}
    >
      <AnimatePresence initial={false}>
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const activeIndex = tabs.findIndex(t => t.id === activeTab);
          const distance = isActive ? 0 : (activeIndex !== -1 ? Math.abs(index - activeIndex) : 1);

          // Calculate opacity based on distance:
          // Active = 1
          // Dist 1 = 0.5
          // Dist 2 = 0.4
          // Dist 3 = 0.3
          // Dist 4+ = 0.2
          const baseOpacity = isActive ? 1 : Math.max(0.2, 0.6 - (distance * 0.1));

          // Set background explicitly to black 10% for inactive tabs
          const bg = isActive
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(0, 0, 0, 0.10)';
          return (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: baseOpacity, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, width: 0 }}
              transition={{ duration: 0.12 }}
              onClick={() => handleTabClick(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 8px',
                paddingRight: 18,
                background: bg,
                color: 'white', // Text remains white, but the entire element's opacity dims it
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                position: 'relative',
                minWidth: 40,
                maxWidth: 150,
                flex: '1 1 0px',
                height: '30px',
                fontSize: 11,
                fontWeight: 400,
                userSelect: 'none',
                whiteSpace: 'nowrap',
                lineHeight: '16px',
              }}
            >
              {tab.favicon ? (
                <img
                  src={tab.favicon}
                  alt=""
                  style={{
                    width: 12,
                    height: 12,
                    flexShrink: 0,
                    borderRadius: 2,
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiPjwvY2lyY2xlPjxsaW5lIHgxPSIyIiB5MT0iMTIiIHgyPSIyMiIgeTI9IjEyIj48L2xpbmU+PHBhdGggZD0iTTEyIDJhMTUuMyAxNS4zIDAgMCAxIDQgMTAgMTUuMyAxNS4zIDAgMCAxLTQgMTAgMTUuMyAxNS4zIDAgMCAxLTQtMTAgMTUuMyAxNS4zIDAgMCAxIDQtMTB6Ij48L3BhdGg+PC9zdmc+';
                  }}
                />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              )}
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {tab.title || 'New Tab'}
              </span>
              <div
                onClick={(e) => handleClose(e, tab.id)}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}
                style={{
                  position: 'absolute',
                  right: 4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 12,
                  height: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.4,
                  transition: 'opacity 0.12s',
                }}
              >
                <svg
                  width="6"
                  height="6"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M1 1L9 9M9 1L1 9" />
                </svg>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {Boolean(activeTab) && (
        <div
          onClick={handleAddTab}
          style={{
            width: 16,
            height: '30px',
            background: 'transparent',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            marginLeft: 4,
            flexShrink: 0,
            cursor: 'pointer',
            transition: 'background 0.12s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 8,
            height: 1.5,
            background: 'rgba(255, 255, 255, 0.75)',
            borderRadius: 0.5,
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 1.5,
            height: 8,
            background: 'rgba(255, 255, 255, 0.75)',
            borderRadius: 0.5,
          }} />
        </div>
      )}
    </div>
  );
}
