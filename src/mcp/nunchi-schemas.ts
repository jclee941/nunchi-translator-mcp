import { z } from "zod"

import {
  nunchiRelationships,
  nunchiReplyGoals,
  nunchiReplyTones,
  nunchiTemperatures,
} from "./nunchi-coach.js"

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
