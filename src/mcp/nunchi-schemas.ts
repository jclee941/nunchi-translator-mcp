import { z } from "zod"
import {
  nunchiRelationships,
  nunchiReplyGoals,
  nunchiReplyTones,
  nunchiTemperatures,
} from "./nunchi-coach.js"
import {
  nunchiBoundaryTypes,
  nunchiDesiredOutcomes,
  nunchiFirmnessLevels,
  nunchiRewriteTargets,
} from "./nunchi-expansion.js"
import { nunchiPressureLevels, nunchiRepairGoals } from "./nunchi-social-tools.js"

const replyOptionSchema = {
  risk: z.string(),
  style: z.enum(["soft_check", "light_reframe", "clear_boundary"]),
  text: z.string(),
}

export const nunchiDecodeInputSchema = {
  context: z.string().trim().min(1).max(200).optional(),
  message: z.string().trim().min(2).max(500),
  relationship: z.enum(nunchiRelationships),
}

export const nunchiDecodeOutputSchema = {
  clues: z.array(z.string()),
  context: z.string().nullable(),
  likelyIntent: z.string(),
  message: z.string(),
  relationship: z.enum(nunchiRelationships),
  replyOptions: z.array(z.object(replyOptionSchema)),
  safeguards: z.array(z.string()),
  temperature: z.enum(nunchiTemperatures),
}

export const nunchiReplyDraftInputSchema = {
  goal: z.enum(nunchiReplyGoals),
  relationship: z.enum(nunchiRelationships),
  situation: z.string().trim().min(2).max(300),
  tone: z.enum(nunchiReplyTones).default("calm"),
}

export const nunchiReplyDraftOutputSchema = {
  body: z.string(),
  safetyTips: z.array(z.string()),
  title: z.string(),
  whyItWorks: z.array(z.string()),
}

export const nunchiToneRewriteInputSchema = {
  relationship: z.enum(nunchiRelationships),
  targetTone: z.enum(nunchiRewriteTargets),
  text: z.string().trim().min(2).max(500),
}

export const nunchiToneRewriteOutputSchema = {
  guardrails: z.array(z.string()),
  original: z.string(),
  rewrites: z.array(
    z.object({
      label: z.enum(["safe", "friendly", "direct"]),
      text: z.string(),
      whenToUse: z.string(),
    }),
  ),
  targetTone: z.enum(nunchiRewriteTargets),
}

export const nunchiBoundaryLineInputSchema = {
  boundaryType: z.enum(nunchiBoundaryTypes),
  firmness: z.enum(nunchiFirmnessLevels),
  relationship: z.enum(nunchiRelationships),
  situation: z.string().trim().min(2).max(300),
}

export const nunchiBoundaryLineOutputSchema = {
  boundaryLine: z.string(),
  followUp: z.string(),
  opener: z.string(),
  whySafe: z.array(z.string()),
}

export const nunchiNextStepInputSchema = {
  desiredOutcome: z.enum(nunchiDesiredOutcomes),
  message: z.string().trim().min(2).max(500),
  relationship: z.enum(nunchiRelationships),
}

export const nunchiNextStepOutputSchema = {
  avoid: z.array(z.string()),
  firstReply: z.string(),
  nextSteps: z.array(z.string()),
}

export const nunchiRepairApologyInputSchema = {
  awkwardMessage: z.string().trim().min(2).max(500),
  relationship: z.enum(nunchiRelationships),
  repairGoal: z.enum(nunchiRepairGoals),
}

export const nunchiRepairApologyOutputSchema = {
  avoid: z.array(z.string()),
  nextLine: z.string(),
  repairMessage: z.string(),
}

export const nunchiInvitationPressureInputSchema = {
  invitation: z.string().trim().min(2).max(500),
  relationship: z.enum(nunchiRelationships),
}

export const nunchiInvitationPressureOutputSchema = {
  pressureLevel: z.enum(nunchiPressureLevels),
  pressureSignals: z.array(z.string()),
  saferInvite: z.string(),
}

export const nunchiGroupChatSummaryInputSchema = {
  messages: z.array(z.string().trim().min(1).max(300)).min(2).max(20),
  topic: z.string().trim().min(2).max(100),
}

export const nunchiGroupChatSummaryOutputSchema = {
  likelyConsensus: z.string(),
  nextAsk: z.string(),
  openQuestions: z.array(z.string()),
}
