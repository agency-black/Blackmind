const { MCP_TOOL_DEFINITIONS } = require("../mcp-tools");

describe("MCP tool definitions", () => {
  it("exposes the expected development tools", () => {
    const toolNames = MCP_TOOL_DEFINITIONS.map((tool) => tool.name);

    expect(toolNames).toEqual(expect.arrayContaining([
      "ping",
      "get_internal_logs",
      "get_window_status",
      "get_app_info",
      "get_memory_usage",
      "get_diagnostics_report",
      "get_user_data_paths",
      "eval_js",
      "take_screenshot",
    ]));
  });

  it("keeps tool names unique", () => {
    const toolNames = MCP_TOOL_DEFINITIONS.map((tool) => tool.name);
    expect(new Set(toolNames).size).toBe(toolNames.length);
  });

  it("requires code for eval_js", () => {
    const evalTool = MCP_TOOL_DEFINITIONS.find((tool) => tool.name === "eval_js");

    expect(evalTool).toBeDefined();
    expect(evalTool.inputSchema.required).toContain("code");
    expect(evalTool.inputSchema.properties.target.enum).toEqual(["main", "auth"]);
  });
});
