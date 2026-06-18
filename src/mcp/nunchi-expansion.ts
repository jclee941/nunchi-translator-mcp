import type { NunchiRelationship } from "./nunchi-coach.js"

export const nunchiRewriteTargets = ["warmer", "clearer", "shorter", "more_polite"] as const
export const nunchiBoundaryTypes = ["time", "money", "emotional", "work"] as const
export const nunchiFirmnessLevels = ["soft", "clear", "firm"] as const
export const nunchiDesiredOutcomes = ["clarify", "postpone", "repair", "exit"] as const

export type NunchiRewriteTarget = (typeof nunchiRewriteTargets)[number]
export type NunchiBoundaryType = (typeof nunchiBoundaryTypes)[number]
export type NunchiFirmness = (typeof nunchiFirmnessLevels)[number]
export type NunchiDesiredOutcome = (typeof nunchiDesiredOutcomes)[number]

export type NunchiToneRewriteInput = {
  readonly text: string
  readonly relationship: NunchiRelationship
  readonly targetTone: NunchiRewriteTarget
}

export type NunchiToneRewrite = {
  readonly original: string
  readonly targetTone: NunchiRewriteTarget
  readonly rewrites: readonly NunchiRewriteOption[]
  readonly guardrails: readonly string[]
}

export type NunchiRewriteOption = {
  readonly label: "safe" | "friendly" | "direct"
  readonly text: string
  readonly whenToUse: string
}

export type NunchiBoundaryLineInput = {
  readonly situation: string
  readonly relationship: NunchiRelationship
  readonly boundaryType: NunchiBoundaryType
  readonly firmness: NunchiFirmness
}

export type NunchiBoundaryLine = {
  readonly opener: string
  readonly boundaryLine: string
  readonly followUp: string
  readonly whySafe: readonly string[]
}

export type NunchiNextStepInput = {
  readonly message: string
  readonly relationship: NunchiRelationship
  readonly desiredOutcome: NunchiDesiredOutcome
}

export type NunchiNextStepPlan = {
  readonly firstReply: string
  readonly nextSteps: readonly string[]
  readonly avoid: readonly string[]
}

const relationshipLabels: Record<NunchiRelationship, string> = {
  coworker: "업무 관계",
  date: "썸/데이트",
  family: "가족",
  friend: "친구",
}

export function rewriteNunchiTone(input: NunchiToneRewriteInput): NunchiToneRewrite {
  const context = relationshipLabels[input.relationship]
  const base = buildToneBase(input.targetTone)

  return {
    original: input.text,
    targetTone: input.targetTone,
    rewrites: [
      {
        label: "safe",
        text: `${base.prefix} 오늘은 어렵습니다. 가능하면 다른 시간으로 조정해도 될까요?`,
        whenToUse: `${context}에서 오해를 줄이고 싶을 때`,
      },
      {
        label: "friendly",
        text: `${base.prefix} 오늘은 조금 어렵네. 괜찮으면 내일 다시 맞춰보자.`,
        whenToUse: "친밀함을 유지하면서 거절해야 할 때",
      },
      {
        label: "direct",
        text: "오늘은 진행하기 어렵습니다. 가능한 시간을 다시 알려드릴게요.",
        whenToUse: "짧고 명확한 답이 필요할 때",
      },
    ],
    guardrails: [
      "원문에 없는 약속이나 감정 추측은 추가하지 않았습니다.",
      "상대의 의도를 단정하지 않고 내 상황 중심으로 바꿨습니다.",
    ],
  }
}

export function draftBoundaryLine(input: NunchiBoundaryLineInput): NunchiBoundaryLine {
  const boundary = buildBoundary(input.boundaryType)
  const opener = buildFirmnessOpener(input.firmness, input.relationship)

  return {
    opener,
    boundaryLine: `${opener} ${boundary.line}`,
    followUp: boundary.followUp,
    whySafe: [
      "상대 탓보다 내 기준을 먼저 말합니다.",
      "대화를 끊지 않고 다음 선택지를 남깁니다.",
      `상황: ${input.situation}`,
    ],
  }
}

export function planNextNunchiStep(input: NunchiNextStepInput): NunchiNextStepPlan {
  const plan = buildOutcomePlan(input.desiredOutcome)

  return {
    firstReply: plan.firstReply,
    nextSteps: [
      plan.nextStep,
      "상대가 다시 애매하게 답하면 선택지를 2개로 줄입니다.",
      `원문 '${input.message}'의 뉘앙스를 확정하지 말고 확인으로 마무리합니다.`,
    ],
    avoid: [
      "상대의 마음을 떠보는 질문을 반복하지 마세요.",
      "읽씹 여부나 답장 속도만으로 감정을 확정하지 마세요.",
    ],
  }
}

function buildToneBase(targetTone: NunchiRewriteTarget): { readonly prefix: string } {
  switch (targetTone) {
    case "clearer":
      return { prefix: "정확히 말하면" }
    case "more_polite":
      return { prefix: "죄송하지만" }
    case "shorter":
      return { prefix: "짧게 말하면" }
    case "warmer":
      return { prefix: "말해줘서 고마워" }
    default:
      return assertNever(targetTone)
  }
}

function buildBoundary(boundaryType: NunchiBoundaryType): {
  readonly line: string
  readonly followUp: string
} {
  switch (boundaryType) {
    case "emotional":
      return {
        line: "지금은 감정이 올라와서 바로 답하기보다 조금 있다가 이야기하고 싶어.",
        followUp: "정리되면 내가 먼저 다시 말할게.",
      }
    case "money":
      return {
        line: "그 비용은 내가 편하게 감당하기 어려워서 이번에는 어렵겠어.",
        followUp: "다른 방식이면 같이 맞춰볼 수 있어.",
      }
    case "time":
      return {
        line: "오늘은 여기까지만 이야기하고 쉬려고 해.",
        followUp: "내일 괜찮은 시간에 다시 얘기하자.",
      }
    case "work":
      return {
        line: "이건 업무 시간 안에서 정리하는 게 좋겠습니다.",
        followUp: "필요한 내용은 내일 문서로 남기겠습니다.",
      }
    default:
      return assertNever(boundaryType)
  }
}

function buildFirmnessOpener(firmness: NunchiFirmness, relationship: NunchiRelationship): string {
  const label = relationshipLabels[relationship]

  switch (firmness) {
    case "clear":
      return `${label}라서 더 명확히 말할게.`
    case "firm":
      return "이 부분은 분명히 선을 지킬게."
    case "soft":
      return "조심스럽게 말하면,"
    default:
      return assertNever(firmness)
  }
}

function buildOutcomePlan(desiredOutcome: NunchiDesiredOutcome): {
  readonly firstReply: string
  readonly nextStep: string
} {
  switch (desiredOutcome) {
    case "clarify":
      return {
        firstReply: "내가 고르면 편해, 아니면 네가 피하고 싶은 선택지가 있어?",
        nextStep: "답이 오면 선호와 회피 조건을 분리해서 확인합니다.",
      }
    case "exit":
      return {
        firstReply: "오늘은 여기까지 이야기하고, 필요하면 나중에 다시 맞춰보자.",
        nextStep: "추가 설득 없이 대화를 닫습니다.",
      }
    case "postpone":
      return {
        firstReply: "지금 바로 정하기보다 내일 다시 맞춰봐도 괜찮아?",
        nextStep: "새 시간을 하나만 제안해 결정 피로를 줄입니다.",
      }
    case "repair":
      return {
        firstReply: "내가 방금 말한 방식이 불편했을 수 있겠다. 다시 말해볼게.",
        nextStep: "사과 후 변명보다 수정된 표현을 먼저 제시합니다.",
      }
    default:
      return assertNever(desiredOutcome)
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled nunchi variant: ${String(value)}`)
}
