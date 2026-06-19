import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import type { AppConfig } from "../config.js"
import { decodeNunchiMessage, draftNunchiReply } from "./nunchi-coach.js"
import { draftBoundaryLine, planNextNunchiStep, rewriteNunchiTone } from "./nunchi-expansion.js"
import {
  nunchiBoundaryLineInputSchema,
  nunchiBoundaryLineOutputSchema,
  nunchiDecodeInputSchema,
  nunchiDecodeOutputSchema,
  nunchiGroupChatSummaryInputSchema,
  nunchiGroupChatSummaryOutputSchema,
  nunchiInvitationPressureInputSchema,
  nunchiInvitationPressureOutputSchema,
  nunchiNextStepInputSchema,
  nunchiNextStepOutputSchema,
  nunchiRepairApologyInputSchema,
  nunchiRepairApologyOutputSchema,
  nunchiReplyDraftInputSchema,
  nunchiReplyDraftOutputSchema,
  nunchiToneRewriteInputSchema,
  nunchiToneRewriteOutputSchema,
} from "./nunchi-schemas.js"
import {
  checkInvitationPressure,
  summarizeGroupChat,
  writeRepairApology,
} from "./nunchi-social-tools.js"
import {
  formatStructuredMcpText,
  nunchiToolAnnotations,
  nunchiToolDescription,
} from "./tool-metadata.js"

export function createNunchiMcpServer(config: AppConfig): McpServer {
  const server = new McpServer({
    name: config.MCP_SERVER_NAME,
    version: config.MCP_SERVER_VERSION,
  })

  server.registerTool(
    "nunchi_message_decode",
    {
      title: "Nunchi Message Decode",
      description: nunchiToolDescription(
        "decodes ambiguous Korean chat messages into non-definitive intent clues and safe reply options.",
      ),
      inputSchema: nunchiDecodeInputSchema,
      outputSchema: nunchiDecodeOutputSchema,
      annotations: nunchiToolAnnotations("Nunchi Message Decode"),
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
      description: nunchiToolDescription(
        "drafts a Korean chat reply that keeps humor, boundaries, and confirmation balanced.",
      ),
      inputSchema: nunchiReplyDraftInputSchema,
      outputSchema: nunchiReplyDraftOutputSchema,
      annotations: nunchiToolAnnotations("Nunchi Reply Draft"),
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

  server.registerTool(
    "nunchi_tone_rewrite",
    {
      title: "Nunchi Tone Rewrite",
      description: nunchiToolDescription(
        "rewrites a blunt Korean chat message into safer relationship-aware tone options.",
      ),
      inputSchema: nunchiToneRewriteInputSchema,
      outputSchema: nunchiToneRewriteOutputSchema,
      annotations: nunchiToolAnnotations("Nunchi Tone Rewrite"),
    },
    ({ relationship, targetTone, text }) => {
      const result = rewriteNunchiTone({ relationship, targetTone, text })

      return {
        content: [
          {
            type: "text",
            text: formatStructuredMcpText("눈치 톤 변환", result),
          },
        ],
        structuredContent: result,
      }
    },
  )

  server.registerTool(
    "nunchi_boundary_line",
    {
      title: "Nunchi Boundary Line",
      description: nunchiToolDescription(
        "drafts a clear but low-conflict Korean boundary message.",
      ),
      inputSchema: nunchiBoundaryLineInputSchema,
      outputSchema: nunchiBoundaryLineOutputSchema,
      annotations: nunchiToolAnnotations("Nunchi Boundary Line"),
    },
    ({ boundaryType, firmness, relationship, situation }) => {
      const result = draftBoundaryLine({ boundaryType, firmness, relationship, situation })

      return {
        content: [
          {
            type: "text",
            text: formatStructuredMcpText("눈치 선 긋기 문장", result),
          },
        ],
        structuredContent: result,
      }
    },
  )

  server.registerTool(
    "nunchi_next_step",
    {
      title: "Nunchi Next Step",
      description: nunchiToolDescription(
        "recommends the next safe reply and action steps for an ambiguous Korean chat thread.",
      ),
      inputSchema: nunchiNextStepInputSchema,
      outputSchema: nunchiNextStepOutputSchema,
      annotations: nunchiToolAnnotations("Nunchi Next Step"),
    },
    ({ desiredOutcome, message, relationship }) => {
      const result = planNextNunchiStep({ desiredOutcome, message, relationship })

      return {
        content: [
          {
            type: "text",
            text: formatStructuredMcpText("눈치 다음 액션", result),
          },
        ],
        structuredContent: result,
      }
    },
  )

  server.registerTool(
    "nunchi_repair_apology",
    {
      title: "Nunchi Repair Apology",
      description: nunchiToolDescription(
        "repairs an awkward Korean chat message with a short apology and safer next line.",
      ),
      inputSchema: nunchiRepairApologyInputSchema,
      outputSchema: nunchiRepairApologyOutputSchema,
      annotations: nunchiToolAnnotations("Nunchi Repair Apology"),
    },
    ({ awkwardMessage, relationship, repairGoal }) => {
      const result = writeRepairApology({ awkwardMessage, relationship, repairGoal })

      return {
        content: [
          {
            type: "text",
            text: formatStructuredMcpText("눈치 사과 복구", result),
          },
        ],
        structuredContent: result,
      }
    },
  )

  server.registerTool(
    "nunchi_invitation_pressure",
    {
      title: "Nunchi Invitation Pressure",
      description: nunchiToolDescription(
        "checks whether an invitation sounds pressuring and rewrites it with an easy out.",
      ),
      inputSchema: nunchiInvitationPressureInputSchema,
      outputSchema: nunchiInvitationPressureOutputSchema,
      annotations: nunchiToolAnnotations("Nunchi Invitation Pressure"),
    },
    ({ invitation, relationship }) => {
      const result = checkInvitationPressure({ invitation, relationship })

      return {
        content: [
          {
            type: "text",
            text: formatStructuredMcpText("눈치 초대 부담도", result),
          },
        ],
        structuredContent: result,
      }
    },
  )

  server.registerTool(
    "nunchi_group_chat_summary",
    {
      title: "Nunchi Group Chat Summary",
      description: nunchiToolDescription(
        "summarizes Korean group chat consensus and produces the next clean ask.",
      ),
      inputSchema: nunchiGroupChatSummaryInputSchema,
      outputSchema: nunchiGroupChatSummaryOutputSchema,
      annotations: nunchiToolAnnotations("Nunchi Group Chat Summary"),
    },
    ({ messages, topic }) => {
      const result = summarizeGroupChat({ messages, topic })

      return {
        content: [
          {
            type: "text",
            text: formatStructuredMcpText("눈치 단체방 합의 정리", result),
          },
        ],
        structuredContent: result,
      }
    },
  )

  return server
}
