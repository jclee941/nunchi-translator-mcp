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

  server.registerTool(
    "nunchi_tone_rewrite",
    {
      title: "Nunchi Tone Rewrite",
      description:
        "Rewrite a blunt Korean chat message into safer relationship-aware tone options.",
      inputSchema: nunchiToneRewriteInputSchema,
      outputSchema: nunchiToneRewriteOutputSchema,
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
      description: "Draft a clear but low-conflict Korean boundary message for KakaoTalk.",
      inputSchema: nunchiBoundaryLineInputSchema,
      outputSchema: nunchiBoundaryLineOutputSchema,
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
      description:
        "Recommend the next safe reply and action steps for an ambiguous KakaoTalk thread.",
      inputSchema: nunchiNextStepInputSchema,
      outputSchema: nunchiNextStepOutputSchema,
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
      description:
        "Repair an awkward Korean chat message with a short apology and safer next line.",
      inputSchema: nunchiRepairApologyInputSchema,
      outputSchema: nunchiRepairApologyOutputSchema,
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
      description: "Check whether an invitation sounds pressuring and rewrite it with an easy out.",
      inputSchema: nunchiInvitationPressureInputSchema,
      outputSchema: nunchiInvitationPressureOutputSchema,
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
      description: "Summarize group chat consensus and produce the next clean ask.",
      inputSchema: nunchiGroupChatSummaryInputSchema,
      outputSchema: nunchiGroupChatSummaryOutputSchema,
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

function formatStructuredMcpText(title: string, value: unknown): string {
  return `${title}\n\n${JSON.stringify(value, null, 2)}`
}
