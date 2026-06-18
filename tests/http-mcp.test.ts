import { describe, expect, test } from "bun:test"
import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod"

import { loadConfig } from "../src/config.js"
import { createHttpApp } from "../src/http-server.js"

const toolSchema = z
  .object({
    inputSchema: z.object({}).passthrough(),
    name: z.string(),
    outputSchema: z.object({}).passthrough().optional(),
  })
  .passthrough()

const toolsListResponseSchema = z.object({
  result: z.object({
    tools: z.array(toolSchema),
  }),
})

const nunchiDecodeResponseSchema = z.object({
  result: z.object({
    structuredContent: z.object({
      likelyIntent: z.string(),
      replyOptions: z.array(
        z.object({
          style: z.string(),
        }),
      ),
      temperature: z.literal("hesitant"),
    }),
  }),
})

describe("HTTP MCP transport", () => {
  test("lists nunchi tools through Streamable HTTP", async () => {
    const server = createHttpApp(loadConfig({ PORT: "3111" }))

    try {
      await initializeMcpSession()
      const tools = await postMcpRequest({
        id: 2,
        method: "tools/list",
        params: {},
      })
      const parsed = toolsListResponseSchema.parse(tools)

      expect(findTool(parsed.result.tools, "nunchi_message_decode")?.outputSchema).toBeDefined()
      expect(findTool(parsed.result.tools, "nunchi_reply_draft")?.outputSchema).toBeDefined()
      expect(parsed.result.tools).toHaveLength(2)
    } finally {
      server.stop(true)
    }
  })

  test("calls nunchi message decode through Streamable HTTP", async () => {
    const server = createHttpApp(loadConfig({ PORT: "3111" }))

    try {
      await initializeMcpSession()
      const result = await postMcpRequest({
        id: 3,
        method: "tools/call",
        params: {
          name: "nunchi_message_decode",
          arguments: {
            context: "친구가 약속 시간 직전에 보낸 메시지",
            message: "나 오늘 좀 피곤하긴 한데 너가 원하면 갈게",
            relationship: "friend",
          },
        },
      })
      const parsed = nunchiDecodeResponseSchema.parse(result)

      expect(parsed.result.structuredContent.likelyIntent).toContain("거절")
      expect(parsed.result.structuredContent.replyOptions[0]?.style).toBe("soft_check")
    } finally {
      server.stop(true)
    }
  })
})

function findTool(
  tools: readonly z.infer<typeof toolSchema>[],
  name: string,
): z.infer<typeof toolSchema> | undefined {
  return tools.find((tool) => tool.name === name)
}

async function initializeMcpSession(): Promise<void> {
  await postMcpRequest({
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: LATEST_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: {
        name: "nunchi-http-smoke",
        version: "0.1.0",
      },
    },
  })
  await postMcpNotification({
    method: "notifications/initialized",
  })
}

async function postMcpRequest(body: Record<string, unknown>): Promise<unknown> {
  const response = await fetch("http://localhost:3111/mcp", {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      ...body,
    }),
  })

  expect(response.status).toBe(200)
  return response.json()
}

async function postMcpNotification(body: Record<string, unknown>): Promise<void> {
  const response = await fetch("http://localhost:3111/mcp", {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      ...body,
    }),
  })

  expect(response.status).toBe(202)
}
