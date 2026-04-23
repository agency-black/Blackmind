const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const { MCP_TOOL_DEFINITIONS } = require("./mcp-tools");

class BlackmindMcpServer {
  constructor() {
    this.logs = [];
    this.started = false;
    this.server = new Server({
      name: "blackmind-internal",
      version: "1.2.0",
    }, {
      capabilities: {
        tools: {},
      },
    });

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: MCP_TOOL_DEFINITIONS,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      // Estas llamadas se resolverán en main.js a través del puente de eventos
      // El servidor MCP aquí actúa como un despachador
      if (this.onCallTool) {
        return await this.onCallTool(request.params.name, request.params.arguments);
      }
      
      // Fallback para logs que se guardan localmente aquí
      if (request.params.name === "get_internal_logs") {
        const limit = request.params.arguments?.limit || 50;
        return { content: [{ type: "text", text: this.logs.slice(-limit).join("\n") }] };
      }

      throw new Error("Manejador de herramientas no configurado en main.js");
    });
  }

  addLog(msg) {
    const entry = `[${new Date().toISOString()}] ${msg}`;
    this.logs.push(entry);
    if (this.logs.length > 500) this.logs.shift();
    console.log(entry);
  }

  async start() {
    if (this.started) {
      return;
    }

    if (process.env.BLACKMIND_ENABLE_INTERNAL_MCP !== "1") {
      this.addLog("Servidor MCP stdio interno deshabilitado. Usa BLACKMIND_ENABLE_INTERNAL_MCP=1 para activarlo.");
      return;
    }

    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      this.started = true;
      this.addLog("Servidor MCP de Blackmind listo.");
    } catch (error) {
      console.error(error);
    }
  }
}

const mcpServer = new BlackmindMcpServer();
module.exports = mcpServer;
