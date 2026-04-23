const { MCP_TOOL_DEFINITIONS } = require("../mcp-tools");

describe("MCP tool definitions", () => {
  it("exposes the expected development tools", () => {
    const toolNames = MCP_TOOL_DEFINITIONS.map((tool) => tool.name);

    expect(toolNames).toEqual(expect.arrayContaining([
      "ping",
      "list_pages",
      "select_page",
      "new_page",
      "close_page",
      "navigate_page",
      "get_internal_logs",
      "get_window_status",
      "get_app_info",
      "get_memory_usage",
      "get_diagnostics_report",
      "get_user_data_paths",
      "eval_js",
      "evaluate_script",
      "take_snapshot",
      "point_event_select",
      "click",
      "hover",
      "drag",
      "fill",
      "fill_form",
      "type_text",
      "press_key",
      "upload_file",
      "wait_for",
      "take_screenshot",
      "resize_page",
      "list_console_messages",
      "get_console_message",
      "list_network_requests",
      "get_network_request",
      "handle_dialog",
      "emulate",
      "performance_start_trace",
      "performance_stop_trace",
      "performance_analyze_insight",
      "take_memory_snapshot",
      "lighthouse_audit",
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
