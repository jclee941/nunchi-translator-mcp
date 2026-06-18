import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

import { loadConfig } from "./config.js"
import { createNunchiMcpServer } from "./mcp/server.js"

export async function runStdioServer(): Promise<void> {
  const server = createNunchiMcpServer(loadConfig(Bun.env))
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

if (import.meta.main) {
  await runStdioServer()
}
