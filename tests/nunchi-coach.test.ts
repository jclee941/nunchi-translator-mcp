import { describe, expect, test } from "bun:test"

import { decodeNunchiMessage, draftNunchiReply } from "../src/mcp/nunchi-coach.js"

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
})
