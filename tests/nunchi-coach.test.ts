import { describe, expect, test } from "bun:test"

import { decodeNunchiMessage, draftNunchiReply } from "../src/mcp/nunchi-coach.js"
import {
  draftBoundaryLine,
  planNextNunchiStep,
  rewriteNunchiTone,
} from "../src/mcp/nunchi-expansion.js"
import {
  checkInvitationPressure,
  summarizeGroupChat,
  writeRepairApology,
} from "../src/mcp/nunchi-social-tools.js"

describe("nunchi coach domain", () => {
  test("decodes an ambiguous chat message into intent and reply options", () => {
    const result = decodeNunchiMessage({
      context: "친구가 약속 시간 직전에 보낸 메시지",
      message: "나 오늘 좀 피곤하긴 한데 너가 원하면 갈게",
      relationship: "friend",
    })

    expect(result.temperature).toBe("hesitant")
    expect(result.likelyIntent).toContain("거절")
    expect(result.clues).toContain("피곤하긴 한데")
    expect(result.replyOptions[0]?.style).toBe("soft_check")
    expect(result.safeguards).toContain("상대의 속마음을 단정하지 말고 확인 질문으로 마무리하세요.")
  })

  test("drafts a playful but safe KakaoTalk reply", () => {
    const draft = draftNunchiReply({
      goal: "decline_softly",
      relationship: "friend",
      situation: "오늘 약속을 내일로 미루고 싶음",
      tone: "playful",
    })

    expect(draft.body).toContain("내일")
    expect(draft.body).toContain("미안")
    expect(draft.safetyTips).toContain("농담은 한 번만 쓰고, 핵심 요청은 분명히 말하세요.")
  })

  test("rewrites a blunt message into relationship-aware tone options", () => {
    const result = rewriteNunchiTone({
      relationship: "coworker",
      targetTone: "more_polite",
      text: "그건 오늘 못 해요",
    })

    expect(result.rewrites).toHaveLength(3)
    expect(result.rewrites[0]?.text).toContain("오늘은 어렵습니다")
    expect(result.guardrails).toContain("원문에 없는 약속이나 감정 추측은 추가하지 않았습니다.")
  })

  test("drafts a boundary line with a safe follow-up", () => {
    const result = draftBoundaryLine({
      boundaryType: "time",
      firmness: "clear",
      relationship: "friend",
      situation: "오늘 밤 늦게 연락이 계속 오는 상황",
    })

    expect(result.boundaryLine).toContain("오늘은 여기까지만")
    expect(result.followUp).toContain("내일")
  })

  test("plans the next nunchi step without escalating the chat", () => {
    const result = planNextNunchiStep({
      desiredOutcome: "clarify",
      message: "아무거나 괜찮아",
      relationship: "date",
    })

    expect(result.firstReply).toContain("내가 고르면")
    expect(result.nextSteps).toContain("상대가 다시 애매하게 답하면 선택지를 2개로 줄입니다.")
    expect(result.avoid).toContain("상대의 마음을 떠보는 질문을 반복하지 마세요.")
  })

  test("writes a repair apology after an awkward message", () => {
    const result = writeRepairApology({
      awkwardMessage: "아 됐어 너 마음대로 해",
      relationship: "friend",
      repairGoal: "soften",
    })

    expect(result.repairMessage).toContain("아까 말이 좀 날카로웠어")
    expect(result.nextLine).toContain("다시 말하면")
  })

  test("checks whether an invitation sounds pressuring", () => {
    const result = checkInvitationPressure({
      invitation: "시간 되면 와. 안 와도 괜찮아",
      relationship: "coworker",
    })

    expect(result.pressureLevel).toBe("low")
    expect(result.saferInvite).toContain("어려우면 편하게 넘겨도 됩니다")
  })

  test("summarizes group chat consensus into a next ask", () => {
    const result = summarizeGroupChat({
      messages: ["민지: 금요일 좋아", "도윤: 토요일은 안 돼", "서연: 장소는 강남이면 좋겠어"],
      topic: "저녁 약속",
    })

    expect(result.likelyConsensus).toContain("금요일")
    expect(result.nextAsk).toContain("강남")
  })
})
