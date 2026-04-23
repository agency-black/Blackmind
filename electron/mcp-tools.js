const MCP_TOOL_DEFINITIONS = [
  {
    name: "ping",
    description: "Verifica que el puente MCP y la app respondan correctamente.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "list_pages",
    description: "Obtiene la lista de páginas abiertas en Blackmind, incluyendo tabs, dashboard, shell y auth popup.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "select_page",
    description: "Selecciona una página por índice o pageId para futuras acciones MCP.",
    inputSchema: {
      type: "object",
      properties: {
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "new_page",
    description: "Abre una nueva pestaña con una URL.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        pane: { type: "string", enum: ["left", "right"] },
      },
      additionalProperties: false,
    },
  },
  {
    name: "close_page",
    description: "Cierra una página por índice o pageId. La última página no se cierra.",
    inputSchema: {
      type: "object",
      properties: {
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "navigate_page",
    description: "Navega a una URL o ejecuta back, forward o reload sobre la página seleccionada.",
    inputSchema: {
      type: "object",
      properties: {
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
        url: { type: "string" },
        action: { type: "string", enum: ["back", "forward", "reload"] },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_internal_logs",
    description: "Obtiene los logs internos recientes de Blackmind.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", minimum: 1, maximum: 500 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_window_status",
    description: "Obtiene el estado actual de ventanas, vistas y URLs cargadas.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "get_app_info",
    description: "Obtiene información de versión, plataforma y entorno de ejecución.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "get_memory_usage",
    description: "Obtiene métricas de memoria actuales y estado del monitor de memoria.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "get_diagnostics_report",
    description: "Genera un reporte de diagnóstico del sistema, GPU y flags activos.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "get_user_data_paths",
    description: "Muestra las rutas usadas por Blackmind para datos y archivos MCP.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "eval_js",
    description: "Ejecuta JavaScript en la ventana objetivo para depuración.",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", minLength: 1, description: "Código JS a ejecutar" },
        target: { type: "string", enum: ["main", "auth"], default: "main" },
      },
      required: ["code"],
      additionalProperties: false,
    },
  },
  {
    name: "evaluate_script",
    description: "Evalúa JavaScript en la página seleccionada y devuelve JSON serializable.",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", minLength: 1 },
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      required: ["code"],
      additionalProperties: false,
    },
  },
  {
    name: "take_snapshot",
    description: "Toma un snapshot textual del DOM interactivo con uids útiles para futuras acciones.",
    inputSchema: {
      type: "object",
      properties: {
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
        limit: { type: "number", minimum: 1, maximum: 500 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "point_event_select",
    description: "Selecciona un elemento por coordenadas de viewport y devuelve su contexto DOM para el modelo.",
    inputSchema: {
      type: "object",
      properties: {
        x: { type: "number" },
        y: { type: "number" },
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      required: ["x", "y"],
      additionalProperties: false,
    },
  },
  {
    name: "start_point_picker",
    description: "Activa un modo visual para seleccionar un elemento con click dentro de la página.",
    inputSchema: {
      type: "object",
      properties: {
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "stop_point_picker",
    description: "Desactiva el modo visual de selección de elementos.",
    inputSchema: {
      type: "object",
      properties: {
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_selected_element",
    description: "Devuelve el último elemento seleccionado manualmente o por point event.",
    inputSchema: {
      type: "object",
      properties: {
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "click",
    description: "Hace click sobre el elemento indicado por uid o selector.",
    inputSchema: {
      type: "object",
      properties: {
        uid: { type: "string" },
        selector: { type: "string" },
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "hover",
    description: "Hace hover sobre el elemento indicado por uid o selector.",
    inputSchema: {
      type: "object",
      properties: {
        uid: { type: "string" },
        selector: { type: "string" },
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "drag",
    description: "Arrastra un elemento hacia otro elemento.",
    inputSchema: {
      type: "object",
      properties: {
        sourceUid: { type: "string" },
        sourceSelector: { type: "string" },
        targetUid: { type: "string" },
        targetSelector: { type: "string" },
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "fill",
    description: "Escribe texto o selecciona valor en un input, textarea o select.",
    inputSchema: {
      type: "object",
      properties: {
        uid: { type: "string" },
        selector: { type: "string" },
        value: { type: "string" },
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      required: ["value"],
      additionalProperties: false,
    },
  },
  {
    name: "fill_form",
    description: "Completa múltiples campos en una sola operación.",
    inputSchema: {
      type: "object",
      properties: {
        fields: {
          type: "array",
          items: {
            type: "object",
            properties: {
              uid: { type: "string" },
              selector: { type: "string" },
              value: { type: "string" },
            },
            required: ["value"],
            additionalProperties: false,
          },
        },
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      required: ["fields"],
      additionalProperties: false,
    },
  },
  {
    name: "type_text",
    description: "Escribe texto en el input enfocado actualmente.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      required: ["text"],
      additionalProperties: false,
    },
  },
  {
    name: "press_key",
    description: "Envía una tecla o combinación como Enter, Escape o Meta+L.",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string" },
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      required: ["key"],
      additionalProperties: false,
    },
  },
  {
    name: "upload_file",
    description: "Carga archivos en un input file indicado por uid o selector.",
    inputSchema: {
      type: "object",
      properties: {
        uid: { type: "string" },
        selector: { type: "string" },
        files: {
          type: "array",
          items: { type: "string" },
        },
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      required: ["files"],
      additionalProperties: false,
    },
  },
  {
    name: "wait_for",
    description: "Espera a que aparezca un selector o texto en la página seleccionada.",
    inputSchema: {
      type: "object",
      properties: {
        selector: { type: "string" },
        text: { type: "string" },
        timeoutMs: { type: "number", minimum: 1 },
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "scrape_page",
    description: "Extrae contenido útil de la página actual: título, meta, headings, texto y enlaces.",
    inputSchema: {
      type: "object",
      properties: {
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
        maxLinks: { type: "number", minimum: 1, maximum: 200 },
        maxTextLength: { type: "number", minimum: 100, maximum: 50000 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "web_search",
    description: "Realiza una búsqueda web simple y devuelve resultados resumidos.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        maxResults: { type: "number", minimum: 1, maximum: 20 },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "take_screenshot",
    description: "Captura la ventana actual y devuelve la imagen en PNG base64.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "string", enum: ["main", "auth", "auto"], default: "auto" },
        uid: { type: "string" },
        selector: { type: "string" },
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "resize_page",
    description: "Redimensiona la ventana principal para ajustar el viewport.",
    inputSchema: {
      type: "object",
      properties: {
        width: { type: "number", minimum: 320 },
        height: { type: "number", minimum: 240 },
      },
      required: ["width", "height"],
      additionalProperties: false,
    },
  },
  {
    name: "list_console_messages",
    description: "Lista mensajes de consola de la página seleccionada desde la última navegación.",
    inputSchema: {
      type: "object",
      properties: {
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_console_message",
    description: "Obtiene un mensaje de consola por id.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "number", minimum: 1 },
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "list_network_requests",
    description: "Lista requests de red observadas en la página seleccionada.",
    inputSchema: {
      type: "object",
      properties: {
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_network_request",
    description: "Obtiene una request de red específica por reqid o la última observada.",
    inputSchema: {
      type: "object",
      properties: {
        reqid: { type: "string" },
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "handle_dialog",
    description: "Acepta o cancela un diálogo JavaScript abierto en la página.",
    inputSchema: {
      type: "object",
      properties: {
        accept: { type: "boolean" },
        promptText: { type: "string" },
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "emulate",
    description: "Emula viewport y algunos parámetros de dispositivo en la página seleccionada.",
    inputSchema: {
      type: "object",
      properties: {
        width: { type: "number", minimum: 320 },
        height: { type: "number", minimum: 240 },
        mobile: { type: "boolean" },
        deviceScaleFactor: { type: "number", minimum: 1 },
        media: { type: "string" },
        userAgent: { type: "string" },
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "performance_start_trace",
    description: "Inicia una traza de rendimiento en la página seleccionada.",
    inputSchema: {
      type: "object",
      properties: {
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "performance_stop_trace",
    description: "Detiene la traza de rendimiento activa y devuelve un resumen.",
    inputSchema: {
      type: "object",
      properties: {
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "performance_analyze_insight",
    description: "Devuelve detalles de una insight de rendimiento capturada en la última traza.",
    inputSchema: {
      type: "object",
      properties: {
        insight: { type: "string" },
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      required: ["insight"],
      additionalProperties: false,
    },
  },
  {
    name: "take_memory_snapshot",
    description: "Captura un snapshot resumido de memoria y contadores DOM.",
    inputSchema: {
      type: "object",
      properties: {
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "lighthouse_audit",
    description: "Obtiene un audit aproximado de accesibilidad, SEO y best practices basado en métricas DevTools.",
    inputSchema: {
      type: "object",
      properties: {
        index: { type: "number", minimum: 0 },
        pageId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
];

module.exports = {
  MCP_TOOL_DEFINITIONS,
};
