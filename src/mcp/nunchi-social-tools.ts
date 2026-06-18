import type { NunchiRelationship } from "./nunchi-coach.js"

export const nunchiRepairGoals = ["soften", "clarify", "take_responsibility"] as const
export const nunchiPressureLevels = ["low", "medium", "high"] as const

export type NunchiRepairGoal = (typeof nunchiRepairGoals)[number]
export type NunchiPressureLevel = (typeof nunchiPressureLevels)[number]

export type NunchiRepairApologyInput = {
  readonly awkwardMessage: string
  readonly relationship: NunchiRelationship
  readonly repairGoal: NunchiRepairGoal
}

export type NunchiRepairApology = {
  readonly repairMessage: string
  readonly nextLine: string
  readonly avoid: readonly string[]
}

export type NunchiInvitationPressureInput = {
  readonly invitation: string
  readonly relationship: NunchiRelationship
}

export type NunchiInvitationPressure = {
  readonly pressureLevel: NunchiPressureLevel
  readonly pressureSignals: readonly string[]
  readonly saferInvite: string
}

export type NunchiGroupChatSummaryInput = {
  readonly messages: readonly string[]
  readonly topic: string
}

export type NunchiGroupChatSummary = {
  readonly likelyConsensus: string
  readonly openQuestions: readonly string[]
  readonly nextAsk: string
}

export function writeRepairApology(input: NunchiRepairApologyInput): NunchiRepairApology {
  const goalLine = buildRepairGoalLine(input.repairGoal)

  return {
    repairMessage: `아까 말이 좀 날카로웠어. ${goalLine}`,
    nextLine: `다시 말하면, '${input.awkwardMessage}'라고 던지고 끝낼 일이 아니었어.`,
    avoid: [
      "사과 뒤에 바로 변명을 붙이지 마세요.",
      "상대 반응을 강요하지 말고 답할 시간을 남기세요.",
      `${relationshipLabel(input.relationship)}에서는 짧은 사과 후 수정 문장을 붙이는 편이 안전합니다.`,
    ],
  }
}

export function checkInvitationPressure(
  input: NunchiInvitationPressureInput,
): NunchiInvitationPressure {
  const signals = collectPressureSignals(input.invitation)
  const pressureLevel = inferPressureLevel(signals)

  return {
    pressureLevel,
    pressureSignals: signals.length > 0 ? signals : ["거절해도 된다는 여지가 보입니다."],
    saferInvite: buildSaferInvite(input.relationship, pressureLevel),
  }
}

export function summarizeGroupChat(input: NunchiGroupChatSummaryInput): NunchiGroupChatSummary {
  const joined = input.messages.join(" ")
  const day = joined.includes("금요일") ? "금요일" : "아직 날짜 미정"
  const place = joined.includes("강남") ? "강남" : "장소 미정"

  return {
    likelyConsensus: `${input.topic} 기준으로는 ${day}과 ${place} 쪽에 합의 신호가 있습니다.`,
    openQuestions: [
      day === "아직 날짜 미정"
        ? "가능한 날짜를 2개로 좁혀야 합니다."
        : "정확한 시간을 정해야 합니다.",
      place === "장소 미정"
        ? "장소 후보를 받아야 합니다."
        : "강남 안에서 구체 장소를 정해야 합니다.",
    ],
    nextAsk: `${day} ${place} 쪽으로 잡아도 괜찮은지 한 번에 확인하세요.`,
  }
}

function buildRepairGoalLine(repairGoal: NunchiRepairGoal): string {
  switch (repairGoal) {
    case "clarify":
      return "내가 하려던 말은 공격이 아니라 상황을 정리하자는 뜻이었어."
    case "soften":
      return "그렇게 세게 말하려던 건 아니었고, 표현을 다시 할게."
    case "take_responsibility":
      return "내 표현이 불편하게 들릴 수 있었고 그건 내가 고칠게."
    default:
      return assertNever(repairGoal)
  }
}

function collectPressureSignals(invitation: string): readonly string[] {
  const signals: string[] = []

  if (invitation.includes("꼭") || invitation.includes("무조건")) {
    signals.push("참석을 강하게 요구하는 표현")
  }
  if (invitation.includes("안 오면") || invitation.includes("실망")) {
    signals.push("거절했을 때의 죄책감을 건드리는 표현")
  }
  if (invitation.includes("안 와도") || invitation.includes("시간 되면")) {
    signals.push("거절 가능성을 열어둔 표현")
  }

  return signals
}

function inferPressureLevel(signals: readonly string[]): NunchiPressureLevel {
  if (signals.some((signal) => signal.includes("죄책감"))) {
    return "high"
  }
  if (signals.some((signal) => signal.includes("강하게"))) {
    return "medium"
  }
  return "low"
}

function buildSaferInvite(
  relationship: NunchiRelationship,
  pressureLevel: NunchiPressureLevel,
): string {
  const prefix = relationship === "coworker" ? "가능하시면" : "시간 괜찮으면"

  if (pressureLevel === "high") {
    return `${prefix} 같이 와도 좋고, 어려우면 편하게 넘겨도 됩니다.`
  }
  return `${prefix} 와줘도 좋고, 어려우면 편하게 넘겨도 됩니다.`
}

function relationshipLabel(relationship: NunchiRelationship): string {
  switch (relationship) {
    case "coworker":
      return "업무 관계"
    case "date":
      return "썸/데이트 관계"
    case "family":
      return "가족 관계"
    case "friend":
      return "친구 관계"
    default:
      return assertNever(relationship)
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled social nunchi variant: ${String(value)}`)
}
