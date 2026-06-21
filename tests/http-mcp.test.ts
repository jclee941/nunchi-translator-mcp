import { describe, expect, test } from "bun:test"
import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod"

import { loadConfig } from "../src/config.js"
import { createHttpApp } from "../src/http-server.js"

const toolSchema = z.looseObject({
  annotations: z.object({
    destructiveHint: z.boolean(),
    idempotentHint: z.boolean(),
    openWorldHint: z.boolean(),
    readOnlyHint: z.boolean(),
    title: z.string(),
  }),
  description: z.string(),
  inputSchema: z.looseObject({}),
  name: z.string(),
  outputSchema: z.looseObject({}).optional(),
})

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

const toneRewriteResponseSchema = z.object({
  result: z.object({
    structuredContent: z.object({
      guardrails: z.array(z.string()),
      rewrites: z.array(
        z.object({
          text: z.string(),
        }),
      ),
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
      expect(findTool(parsed.result.tools, "nunchi_tone_rewrite")?.outputSchema).toBeDefined()
      expect(findTool(parsed.result.tools, "nunchi_boundary_line")?.outputSchema).toBeDefined()
      expect(findTool(parsed.result.tools, "nunchi_next_step")?.outputSchema).toBeDefined()
      expect(findTool(parsed.result.tools, "nunchi_repair_apology")?.outputSchema).toBeDefined()
      expect(
        findTool(parsed.result.tools, "nunchi_invitation_pressure")?.outputSchema,
      ).toBeDefined()
      expect(findTool(parsed.result.tools, "nunchi_group_chat_summary")?.outputSchema).toBeDefined()
      for (const tool of parsed.result.tools) {
        expect(tool.description).toContain("nunchi-translator-mcp")
        expect(tool.description).toContain("Nunchi Translator MCP(눈치 번역기 MCP)")
        expect(tool.annotations).toMatchObject({
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
          readOnlyHint: true,
        })
      }
      expect(parsed.result.tools).toHaveLength(8)
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

  test("calls nunchi tone rewrite through Streamable HTTP", async () => {
    const server = createHttpApp(loadConfig({ PORT: "3111" }))

    try {
      await initializeMcpSession()
      const result = await postMcpRequest({
        id: 4,
        method: "tools/call",
        params: {
          name: "nunchi_tone_rewrite",
          arguments: {
            relationship: "coworker",
            targetTone: "more_polite",
            text: "그건 오늘 못 해요",
          },
        },
      })
      const parsed = toneRewriteResponseSchema.parse(result)

      expect(parsed.result.structuredContent.rewrites[0]?.text).toContain("오늘은 어렵습니다")
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
