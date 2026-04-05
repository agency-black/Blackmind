import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import FloatingLines from './components/backgrounds/FloatingLines'
import { MorphingSquare } from './components/loaders/MorphingSquare'
import { SearchModalApp } from './features/search/SearchModalApp'
import { TabBar } from './features/tabs/TabBar'
import { SidebarApp } from './features/sidebar/SidebarApp'

const searchRoot = document.getElementById('search-react-root');
if (searchRoot) {
    ReactDOM.createRoot(searchRoot).render(
        <React.StrictMode>
            <SearchModalApp />
        </React.StrictMode>,
    )
} else {
    console.error('[main.tsx] search-react-root element not found in DOM');
}

// Render TabBar
const tabsRoot = document.getElementById('tabs-react-root');
if (tabsRoot) {
    ReactDOM.createRoot(tabsRoot).render(
        <React.StrictMode>
            <TabBar />
        </React.StrictMode>,
    )
}

// Render Sidebar
const sidebarRoot = document.getElementById('sidebar-react-root');
if (sidebarRoot) {
    ReactDOM.createRoot(sidebarRoot).render(
        <React.StrictMode>
            <SidebarApp />
        </React.StrictMode>,
    )
}

// Render transition loader content in both panes
const mountLoader = (rootId: string) => {
    const root = document.getElementById(rootId);
    if (!root) return;
    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                <MorphingSquare message="Loading..." style={{ backgroundColor: '#ffffff' }} />
            </div>
        </React.StrictMode>,
    );
};

mountLoader('webview-loader-root-left');
mountLoader('webview-loader-root-right');

// Render floating lines background in tab overview
const overviewBackgroundRoot = document.getElementById('tab-overview-background-root');
if (overviewBackgroundRoot) {
    ReactDOM.createRoot(overviewBackgroundRoot).render(
        <React.StrictMode>
            <FloatingLines
                enabledWaves={['top', 'middle', 'bottom']}
                lineCount={5}
                lineDistance={5}
                bendRadius={5}
                bendStrength={-0.5}
                interactive={true}
                parallax={true}
            />
        </React.StrictMode>,
    )
}
