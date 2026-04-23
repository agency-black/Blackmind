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
    name: "take_screenshot",
    description: "Captura la ventana actual y devuelve la imagen en PNG base64.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "string", enum: ["main", "auth", "auto"], default: "auto" },
      },
      additionalProperties: false,
    },
  },
];

module.exports = {
  MCP_TOOL_DEFINITIONS,
};
