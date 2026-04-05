# Project Structure

## Runtime

- `electron/`
  Electron main process, preload y modulos nativos.
- `src/`
  Entradas React que montan UI sobre nodos existentes en `index.html`.
- `public/`
  Activos estaticos realmente consumidos por Vite/Electron.
- `index.html`
  Shell principal, layout, estado de tabs, webviews y coordinacion del renderer.

## Frontend

- `src/features/search/SearchModalApp.tsx`
  UI React del buscador modal.
- `src/features/tabs/TabBar.tsx`
  Barra de tabs React y eventos CustomEvent.
- `src/components/loaders/MorphingSquare.tsx`
  Loader activo de transicion.
- `src/components/backgrounds/FloatingLines.tsx`
  Fondo animado usado en la vista general de tabs.
- `src/lib/utils.ts`
  Utilidades compartidas.
- `src/types/global.d.ts`
  Tipos globales del bridge y APIs expuestas en `window`.

## Documentation

- `docs/architecture/`
  Arquitectura, estructura y onboarding rapido.
- `docs/features/`
  Notas funcionales por feature.
- `docs/testing/`
  Guias y plantillas de validacion.
- `docs/reports/`
  Reportes historicos conservados como referencia.
