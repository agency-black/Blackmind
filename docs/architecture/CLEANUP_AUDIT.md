# Cleanup Audit

## Removed Safely

- Archivos generados: `coverage/`, `dist/`.
- Basura del sistema: `.DS_Store`.
- Cache versionada por error: `.npm_cache/`.
- Codigo React sin referencias activas:
  - `src/components/AppIntroOverlay.tsx`
  - `src/components/WebviewLoader.tsx`
  - `src/components/animations/ai-loader.tsx`
  - `src/components/effects/suggestive-search.tsx`
  - `src/components/ui/demo.tsx`
  - `src/components/ui/vapour-text-effect.tsx`
  - `src/lib/contextMenuActions.js`
- Estilos no consumidos: `src/animations.css`.

## Reorganized

- `src/App.tsx` -> `src/features/search/SearchModalApp.tsx`
- `src/components/TabBar.tsx` -> `src/features/tabs/TabBar.tsx`
- `src/components/animations/morphing-square.tsx` -> `src/components/loaders/MorphingSquare.tsx`
- `src/components/effects/floating-lines.tsx` -> `src/components/backgrounds/FloatingLines.tsx`
- Documentacion raiz movida a `docs/`.

## Preserved Intentionally

- `index.html`
  Contiene la mayor parte del runtime del renderer y no se fragmento para evitar regresiones.
- `electron/main.js`, `electron/preload.js`, `electron/modules/*.js`
  Se conservaron funcionalmente intactos por seguridad.
- `public/svg/panel_apps/iconos_app/globe_light.svg`
  Es el unico activo estatico restante referenciado directamente por `index.html`.
