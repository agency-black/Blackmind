# Blackmind

Aplicacion Electron con renderer hibrido:

- `index.html` concentra el layout principal, tabs, webviews y coordinacion del renderer.
- `src/` monta piezas React puntuales sobre nodos del DOM ya existentes.
- `electron/` contiene proceso principal, preload y modulos nativos.

## Entradas principales

- `electron/main.js`
- `electron/preload.js`
- `index.html`
- `src/main.tsx`

## Scripts disponibles

```bash
npm run dev
npm run dev:desktop
npm run build
npm run preview
npm start
npm test
npm run test:watch
npm run test:coverage
```

## Estructura recomendada

Ver [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md).

## Documentacion relacionada

- [`../features/context-menu.md`](../features/context-menu.md)
- [`../testing/performance-testing.md`](../testing/performance-testing.md)
- [`../testing/performance-results-template.md`](../testing/performance-results-template.md)
- [`../reports/verification-report.md`](../reports/verification-report.md)
- [`../reports/final-checkpoint-report.md`](../reports/final-checkpoint-report.md)
