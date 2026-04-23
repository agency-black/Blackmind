const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const { MCP_TOOL_DEFINITIONS } = require("./mcp-tools");

const resolveUserDataPath = () => {
  if (process.env.BLACKMIND_MCP_USER_DATA_PATH) {
    return process.env.BLACKMIND_MCP_USER_DATA_PATH;
  }

  const homeDir = os.homedir();
  const platform = process.platform;

  if (platform === "darwin") {
    return path.join(homeDir, "Library", "Application Support", "blackmind");
  }

  if (platform === "win32") {
    return path.join(
      process.env.APPDATA || path.join(homeDir, "AppData", "Roaming"),
      "blackmind",
    );
  }

  return path.join(
    process.env.XDG_CONFIG_HOME || path.join(homeDir, ".config"),
    "blackmind",
  );
};

const userDataPath = resolveUserDataPath();
const queryPath = path.join(userDataPath, 'mcp-query.json');
const responsePath = path.join(userDataPath, 'mcp-response.json');
const timeoutMs = Number(process.env.BLACKMIND_MCP_TIMEOUT_MS || 15000);

fs.mkdirSync(userDataPath, { recursive: true });

const server = new Server({
  name: "blackmind-bridge",
  version: "1.2.0",
}, {
  capabilities: { tools: {} },
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: MCP_TOOL_DEFINITIONS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const requestId = crypto.randomUUID();

  if (fs.existsSync(responsePath)) fs.unlinkSync(responsePath);

  fs.writeFileSync(queryPath, JSON.stringify({
    requestId,
    name: request.params.name,
    arguments: request.params.arguments
  }, null, 2));

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const interval = setInterval(() => {
      if (fs.existsSync(responsePath)) {
        try {
          const response = JSON.parse(fs.readFileSync(responsePath, 'utf-8'));
          if (response.requestId !== requestId) {
            return;
          }
          clearInterval(interval);
          resolve(response.payload || { content: [] });
        } catch (e) {
          clearInterval(interval);
          reject(e);
        }
      }
      if (Date.now() - startedAt > timeoutMs) {
        clearInterval(interval);
        reject(new Error(`Timeout: La app no respondió a la herramienta ${request.params.name} en ${timeoutMs}ms`));
      }
    }, 100);
  });
});

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
