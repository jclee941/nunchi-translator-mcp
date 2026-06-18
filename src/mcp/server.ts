import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import type { AppConfig } from "../config.js"
import { decodeNunchiMessage, draftNunchiReply } from "./nunchi-coach.js"
import {
  nunchiDecodeInputSchema,
  nunchiDecodeOutputSchema,
  nunchiReplyDraftInputSchema,
  nunchiReplyDraftOutputSchema,
} from "./nunchi-schemas.js"

export function createNunchiMcpServer(config: AppConfig): McpServer {
  const server = new McpServer({
    name: config.MCP_SERVER_NAME,
    version: config.MCP_SERVER_VERSION,
  })

  server.registerTool(
    "nunchi_message_decode",
    {
      title: "Nunchi Message Decode",
      description:
        "Decode ambiguous Korean chat messages into non-definitive intent clues and safe reply options.",
      inputSchema: nunchiDecodeInputSchema,
      outputSchema: nunchiDecodeOutputSchema,
    },
    ({ context, message, relationship }) => {
      const result =
        context === undefined
          ? decodeNunchiMessage({ message, relationship })
          : decodeNunchiMessage({ context, message, relationship })

      return {
        content: [
          {
            type: "text",
            text: formatStructuredMcpText("눈치 번역 결과", result),
          },
        ],
        structuredContent: result,
      }
    },
  )

  server.registerTool(
    "nunchi_reply_draft",
    {
      title: "Nunchi Reply Draft",
      description:
        "Draft a KakaoTalk-ready Korean reply that keeps humor, boundaries, and confirmation balanced.",
      inputSchema: nunchiReplyDraftInputSchema,
      outputSchema: nunchiReplyDraftOutputSchema,
    },
    ({ goal, relationship, situation, tone }) => {
      const draft = draftNunchiReply({ goal, relationship, situation, tone })

      return {
        content: [
          {
            type: "text",
            text: formatStructuredMcpText("눈치 답장 초안", draft),
          },
        ],
        structuredContent: draft,
      }
    },
  )

  return server
}

function formatStructuredMcpText(title: string, value: unknown): string {
  return `${title}\n\n${JSON.stringify(value, null, 2)}`
}
