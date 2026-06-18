export const nunchiRelationships = ["friend", "coworker", "family", "date"] as const
export const nunchiTemperatures = ["warm", "neutral", "hesitant", "tense"] as const
export const nunchiReplyGoals = [
  "check_intent",
  "decline_softly",
  "apologize",
  "accept_lightly",
] as const
export const nunchiReplyTones = ["playful", "calm", "polite"] as const

export type NunchiRelationship = (typeof nunchiRelationships)[number]
export type NunchiTemperature = (typeof nunchiTemperatures)[number]
export type NunchiReplyGoal = (typeof nunchiReplyGoals)[number]
export type NunchiReplyTone = (typeof nunchiReplyTones)[number]

export type NunchiDecodeInput = {
  readonly message: string
  readonly relationship: NunchiRelationship
  readonly context?: string
}

export type NunchiReplyOption = {
  readonly style: "soft_check" | "light_reframe" | "clear_boundary"
  readonly text: string
  readonly risk: string
}

export type NunchiDecodeResult = {
  readonly message: string
  readonly relationship: NunchiRelationship
  readonly context: string | null
  readonly temperature: NunchiTemperature
  readonly likelyIntent: string
  readonly clues: readonly string[]
  readonly replyOptions: readonly NunchiReplyOption[]
  readonly safeguards: readonly string[]
}

export type NunchiReplyDraftInput = {
  readonly situation: string
  readonly relationship: NunchiRelationship
  readonly goal: NunchiReplyGoal
  readonly tone: NunchiReplyTone
}

export type NunchiReplyDraft = {
  readonly title: string
  readonly body: string
  readonly whyItWorks: readonly string[]
  readonly safetyTips: readonly string[]
}

const relationshipLabels: Record<NunchiRelationship, string> = {
  coworker: "동료",
  date: "썸/데이트 상대",
  family: "가족",
  friend: "친구",
}

export function decodeNunchiMessage(input: NunchiDecodeInput): NunchiDecodeResult {
  const clues = collectClues(input.message)
  const temperature = inferTemperature(input.message, clues)

  return {
    message: input.message,
    relationship: input.relationship,
    context: input.context ?? null,
    temperature,
    likelyIntent: buildLikelyIntent(temperature),
    clues,
    replyOptions: buildReplyOptions(input.relationship, temperature),
    safeguards: [
      "상대의 속마음을 단정하지 말고 확인 질문으로 마무리하세요.",
      "캡처, 연락처, 실명 같은 개인정보는 입력하지 마세요.",
      "관계가 불편해질 수 있는 상황에서는 농담보다 명확한 확인이 안전합니다.",
    ],
  }
}

export function draftNunchiReply(input: NunchiReplyDraftInput): NunchiReplyDraft {
  const label = relationshipLabels[input.relationship]
  const body = buildDraftBody(input)

  return {
    title: `${label}에게 보내는 ${replyGoalLabels[input.goal]} 답장`,
    body,
    whyItWorks: [
      "상대가 바로 대답하기 쉬운 선택지를 줍니다.",
      "내 의도를 숨기지 않으면서도 상대의 체면을 남깁니다.",
      "농담보다 확인과 선택권을 우선합니다.",
    ],
    safetyTips: [
      "농담은 한 번만 쓰고, 핵심 요청은 분명히 말하세요.",
      "상대의 감정을 추측한 문장보다 내 상황을 설명하는 문장을 쓰세요.",
    ],
  }
}

const replyGoalLabels: Record<NunchiReplyGoal, string> = {
  accept_lightly: "가볍게 수락하는",
  apologize: "사과하는",
  check_intent: "의도를 확인하는",
  decline_softly: "부드럽게 거절하는",
}

function collectClues(message: string): readonly string[] {
  const clues: string[] = []

  if (message.includes("피곤")) {
    clues.push("피곤하긴 한데")
  }
  if (message.includes("원하면") || message.includes("괜찮다면")) {
    clues.push("선택권을 상대에게 넘김")
  }
  if (message.includes("아무거나") || message.includes("상관없")) {
    clues.push("선호를 숨기거나 결정을 미룸")
  }
  if (message.includes("됐어") || message.includes("마음대로")) {
    clues.push("짧고 닫힌 표현")
  }

  return clues.length > 0 ? clues : ["명확한 감정 단서는 적고 맥락 확인이 필요합니다."]
}

function inferTemperature(message: string, clues: readonly string[]): NunchiTemperature {
  if (message.includes("됐어") || message.includes("마음대로")) {
    return "tense"
  }
  if (clues.some((clue) => clue.includes("피곤") || clue.includes("선택권"))) {
    return "hesitant"
  }
  if (message.includes("좋아") || message.includes("ㅋㅋ") || message.includes("ㅎㅎ")) {
    return "warm"
  }
  return "neutral"
}

function buildLikelyIntent(temperature: NunchiTemperature): string {
  if (temperature === "hesitant") {
    return "직접 거절하기는 부담스러워서 선택권을 넘기려는 신호일 수 있습니다."
  }
  if (temperature === "tense") {
    return "불편함이 쌓였거나 대화를 짧게 끝내고 싶은 신호일 수 있습니다."
  }
  if (temperature === "warm") {
    return "긍정적이지만 세부 조건은 한 번 더 맞추면 좋습니다."
  }
  return "의도가 뚜렷하지 않아 확인 질문으로 좁히는 편이 안전합니다."
}

function buildReplyOptions(
  relationship: NunchiRelationship,
  temperature: NunchiTemperature,
): readonly NunchiReplyOption[] {
  const label = relationshipLabels[relationship]

  return [
    {
      style: "soft_check",
      text:
        temperature === "hesitant"
          ? "무리하지 않아도 괜찮아. 오늘 쉬고 다음에 편할 때 볼까?"
          : "내가 다르게 이해했을 수도 있는데, 지금은 어떤 쪽이 더 편해?",
      risk: "가장 안전합니다. 상대에게 빠져나갈 문을 열어둡니다.",
    },
    {
      style: "light_reframe",
      text: `${label} 모드로 솔직히 말해줘도 괜찮아. 나는 맞춰볼게.`,
      risk: "친한 사이에는 부드럽지만, 거리감 있는 관계에서는 가볍게 보일 수 있습니다.",
    },
    {
      style: "clear_boundary",
      text: "나는 오늘 확정이 필요해서, 어렵다면 다음으로 넘길게.",
      risk: "명확하지만 차갑게 느껴질 수 있어 필요한 상황에서만 쓰세요.",
    },
  ]
}

function buildDraftBody(input: NunchiReplyDraftInput): string {
  if (input.goal === "decline_softly") {
    return input.tone === "playful"
      ? `나 오늘은 상태가 살짝 방전이라 ${input.situation}. 미안, 내일로 미루면 내가 더 멀쩡한 버전으로 갈게.`
      : `오늘은 ${input.situation}. 미안하지만 내일이나 다른 편한 시간으로 바꿀 수 있을까?`
  }
  if (input.goal === "apologize") {
    return `내가 ${input.situation} 부분을 가볍게 넘긴 것 같아. 미안해. 네가 불편했던 지점을 다시 듣고 맞춰볼게.`
  }
  if (input.goal === "accept_lightly") {
    return `좋아, ${input.situation} 이렇게 가보자. 혹시 바뀌는 조건 있으면 바로 말해줘.`
  }
  return `내가 정확히 이해하고 싶어서 물어봐. ${input.situation} 이 방향이 맞아, 아니면 다른 선택지가 더 편해?`
}
