# QA Baseline Funcional (Tabs, SplitView, Búsqueda)

## Objetivo
Definir un baseline funcional reproducible para detectar regresiones en:
- Gestión de pestañas
- SplitView
- Modal de búsqueda (toolbar search)

Este documento no corrige código; solo establece criterios de aceptación y evidencia mínima obligatoria.

## Alcance
- UI shell (`index.html`)
- Integración React de tabs y buscador (`src/*`)
- Comportamiento funcional visible para usuario final

## Precondiciones
1. `npm install`
2. `npm run build`
3. `npm start`
4. Ventana abierta en tamaño desktop (no maximizada automática durante el run)
5. Limpieza previa:
   - Cerrar pestañas existentes
   - Iniciar desde Home (dashboard local)

## Entregables del baseline
1. 1 video continuo del run completo.
2. Capturas por caso de prueba.
3. Bitácora de resultados (Pass/Fail + notas).

Guardar todo en:
- `artifacts/baseline/<YYYY-MM-DD>_<platform>/video/`
- `artifacts/baseline/<YYYY-MM-DD>_<platform>/screenshots/`
- `artifacts/baseline/<YYYY-MM-DD>_<platform>/BASELINE_RUN.md`

## Convención de nombres de evidencia
- Video: `baseline-run.mp4`
- Screenshots: `TC-XX_<short-name>.png`
  - Ejemplo: `TC-05_splitview-two-tabs.png`

## Matriz de casos y criterios de aceptación

### A. Tabs

`TC-01` Abrir navegador desde Dock
- Pasos:
1. Estando en Home, click icono navegador en dock.
- Esperado:
1. Se muestra una pestaña de navegador activa.
2. Toolbar visible.
3. No aparece ventana externa.
- Evidencia: `TC-01_browser-open.png`

`TC-02` Crear pestaña desde botón `+` superior
- Pasos:
1. Con navegador activo, click `+` en barra de pestañas.
- Esperado:
1. Se crea una pestaña nueva.
2. La nueva pestaña queda activa.
3. El contenido cargado corresponde a la nueva pestaña.
- Evidencia: `TC-02_add-tab-topbar.png`

`TC-03` Cambio de pestaña
- Pasos:
1. Con 2+ pestañas abiertas, cambiar entre ellas.
- Esperado:
1. El contenido corresponde exactamente a la pestaña seleccionada.
2. No se altera otra vista/pane no seleccionada.
- Evidencia: `TC-03_switch-tab.png`

`TC-04` Cierre de pestaña activa
- Pasos:
1. Cerrar la pestaña activa desde `x`.
- Esperado:
1. Se activa una pestaña existente válida o Home si no quedan pestañas.
2. No quedan pantallas negras huérfanas.
- Evidencia: `TC-04_close-active-tab.png`

### B. SplitView

`TC-05` Activar splitview desde dock
- Pasos:
1. Con una sola vista activa, click icono splitview.
- Esperado:
1. Se divide en vista izquierda/derecha.
2. Divider visible y funcional.
3. No hay solapamientos de webviews.
- Evidencia: `TC-05_split-activate.png`

`TC-06` Split con dos pestañas de navegador
- Pasos:
1. Tener al menos 2 pestañas.
2. Activar splitview.
- Esperado:
1. Cada pane muestra una pestaña válida.
2. No se corta el render de la vista derecha.
- Evidencia: `TC-06_split-two-tabs.png`

`TC-07` Cerrar splitview desde dock
- Pasos:
1. Con split activo, click icono splitview para desactivar.
- Esperado:
1. Regresa a vista única.
2. No se cierran pestañas de forma inesperada.
3. Se mantiene contenido válido visible.
- Evidencia: `TC-07_split-close.png`

`TC-08` Home en splitview
- Pasos:
1. Con split activo, presionar Home en dock.
- Esperado:
1. La vista principal vuelve a Home completo.
2. No queda split parcial residual.
- Evidencia: `TC-08_home-from-split.png`

`TC-09` Indicador de vista activa
- Pasos:
1. Con split activo, interactuar pane izquierdo/derecho.
- Esperado:
1. El indicador aparece solo en split activo.
2. La transición del indicador es progresiva (no salto brusco).
- Evidencia: `TC-09_active-view-indicator.png`

### C. Gestor de pestañas (Overview)

`TC-10` Abrir gestor de pestañas en split
- Pasos:
1. Con split activo y 3 pestañas.
2. Abrir gestor de pestañas.
- Esperado:
1. El gestor se renderiza en el pane esperado.
2. El fondo animado se ve como fondo completo (sin márgenes internos no deseados).
- Evidencia: `TC-10_overview-open.png`

`TC-11` Miniaturas y cabecera
- Pasos:
1. Revisar tarjetas del gestor.
- Esperado:
1. Franja de favicon/título arriba.
2. Miniatura debajo de la franja (no tapada por header).
3. Tamaño consistente entre miniaturas y tarjeta de `+`.
- Evidencia: `TC-11_overview-card-layout.png`

`TC-12` Selección desde gestor
- Pasos:
1. Click en una miniatura del gestor.
- Esperado:
1. La pestaña seleccionada abre en la misma vista/pane del gestor.
2. El gestor se reemplaza por la pestaña abierta.
- Evidencia: `TC-12_overview-open-selection.png`

`TC-13` Crear pestaña desde `+` del gestor
- Pasos:
1. Click en tarjeta `+` del gestor.
- Esperado:
1. Se crea una pestaña nueva.
2. Se abre en la misma vista/pane del gestor, reemplazándolo.
- Evidencia: `TC-13_overview-add-tab.png`

### D. Modal de búsqueda (Toolbar)

`TC-14` Apertura de modal
- Pasos:
1. Click icono de búsqueda del toolbar.
- Esperado:
1. Modal visible y centrado.
2. Input enfocado automáticamente.
3. Layout consistente (sin elementos rotos/encimados).
- Evidencia: `TC-14_search-modal-open.png`

`TC-15` Cierre por ESC y backdrop
- Pasos:
1. Abrir modal.
2. Cerrar con `ESC`.
3. Reabrir y cerrar haciendo click en backdrop.
- Esperado:
1. Cierra correctamente en ambos casos.
- Evidencia: `TC-15_search-modal-close.png`

`TC-16` Buscar y abrir resultado en misma pestaña
- Pasos:
1. Buscar término en Google.
2. Click en resultado (ej. YouTube).
- Esperado:
1. Navega en la pestaña actual.
2. No abre ventana externa.
- Evidencia: `TC-16_search-result-same-tab.png`

### E. Reglas de aceptación global

`TC-17` Sin ventanas externas inesperadas
- Durante todo el run, no deben abrirse ventanas extra fuera de la shell.
- Evidencia: `TC-17_no-external-window.png`

`TC-18` Sin estado visual roto
- No deben existir zonas negras huérfanas, overlays trabados o toolbar desaparecido inesperado.
- Evidencia: `TC-18_no-broken-state.png`

## Criterio de salida del punto 1
Baseline funcional aceptado cuando:
1. Todos los casos `TC-01` a `TC-18` tienen resultado registrado.
2. Existe evidencia mínima (video + screenshots requeridos).
3. Se adjunta `BASELINE_RUN.md` con:
   - Fecha
   - Plataforma
   - Commit evaluado
   - Resultado por caso
   - Lista de defectos encontrados

## Plantilla de resultado por caso
Usar este formato dentro de `BASELINE_RUN.md`:

`TC-XX`: PASS | FAIL  
`Notas`: descripción breve  
`Evidencia`: nombre de archivo  

