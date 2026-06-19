# Nunchi Translator MCP

PlayMCP가 호출하는 downstream MCP 서버입니다. PlayMCP 자체를 구현하는 repo가 아니라,
Kakao Cloud에 배포한 뒤 PlayMCP 개발자 콘솔에 `/mcp` endpoint로 등록하는 서버입니다.

## Tools

- `nunchi_message_decode`: 애매한 카톡 문장을 눈치 단서, 감정 온도, 답장 후보로 분석합니다.
- `nunchi_reply_draft`: 거절/사과/확인/수락 상황에 맞는 카톡 답장 초안을 만듭니다.
- `nunchi_tone_rewrite`: 딱딱하거나 위험한 문장을 관계와 목적에 맞게 부드럽게 바꿉니다.
- `nunchi_boundary_line`: 시간/돈/감정/업무 상황에서 선을 긋는 문장을 만듭니다.
- `nunchi_next_step`: 애매한 대화에서 다음 답장과 액션을 추천합니다.
- `nunchi_repair_apology`: 이미 어색하게 보낸 말을 짧은 사과와 복구 문장으로 정리합니다.
- `nunchi_invitation_pressure`: 초대 문장이 상대에게 부담스럽게 들리는지 점검하고 안전하게 바꿉니다.
- `nunchi_group_chat_summary`: 단체방 대화에서 합의 신호와 다음 질문을 정리합니다.

## Local Run

```bash
bun install
bun run verify
bun run start
```

확인:

```bash
curl -i http://localhost:3000/health
curl -i http://localhost:3000/mcp \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"local-smoke","version":"0.1.0"}}}'
```

## Kakao Cloud Git Source Build

- Git URL: `https://github.com/jclee941/nunchi-translator-mcp.git`
- Branch/ref: `master`
- Dockerfile path: `Dockerfile`
- Container port: `3000`
- Health check path: `/health`
- PlayMCP endpoint: `https://nunchi-translator.playmcp-endpoint.kakaocloud.io/mcp`

## PlayMCP Registration Flow

1. PlayMCP in KC에서 배포가 Active가 되면 발급된 Endpoint URL을 복사합니다.
2. PlayMCP 개발자 콘솔에서 새 MCP 서버로 등록합니다.
3. 먼저 임시 등록하고, 상세 미리보기에서 도구함에 추가한 뒤 PlayMCP AI 채팅으로 테스트합니다.
4. 테스트가 끝난 뒤 심사 요청합니다.
5. 승인 후 공개 상태를 전체 공개로 전환하고, 공개 MCP 상세 URL을 공모전 접수 양식에 제출합니다.

## PlayMCP Submission Fields

- 대표 이미지: `assets/playmcp-representative.png`
- MCP 이름: `nunchi-translator-mcp`
- MCP 식별자: `nunchiTranslator`
- MCP 설명: 애매한 카톡 문장의 눈치 단서와 감정 온도를 분석하고, 관계를 해치지 않는 답장 초안·톤 조정·거절/사과/확인 문장을 제안하는 MCP입니다. 상대의 속마음을 단정하지 않고 확인 질문과 선택권을 우선합니다.
- 대화 예시 1: 친구가 "오늘 좀 피곤하긴 한데 네가 원하면 갈게"라고 했어. 약속을 미루고 싶은 건지, 그냥 배려하는 건지 눈치 단서와 안전한 답장 후보를 알려줘.
- 대화 예시 2: "그건 네가 알아서 해"라고 보내려다가 너무 차갑게 들릴까 봐 걱정돼. 친구에게 덜 날카롭고 따뜻하게 보이도록 바꿔줘.
- 대화 예시 3: 단체방에서 "금요일 어때?", "강남이면 좋아", "나는 7시 가능"이라고 나왔어. 저녁 약속 기준으로 합의된 내용과 다음에 물어볼 질문을 정리해줘.
- 인증 방식: 인증 사용하지 않음
- 톡방 접근 가능 여부: 직접 접근 불가. 사용자가 직접 입력한 문장 또는 메시지 배열만 분석합니다.
- MCP Endpoint: `https://nunchi-translator.playmcp-endpoint.kakaocloud.io/mcp`
- 전송 방식: Streamable HTTP, Remote MCP, stateless 요청 처리
- 지원 MCP 버전: `2025-03-26`, `2025-06-18`, `2025-11-25` (`@modelcontextprotocol/sdk` 1.29.0)
- Tool 메타데이터: 모든 Tool에 `name`, `description`, `inputSchema`, `annotations` 포함

## PlayMCP Chat Smoke Prompts

PlayMCP AI 채팅에서 Tool call 카운트가 올라가는지 확인할 때는 아래처럼 도구 사용을 명시합니다.

```text
nunchi_message_decode 도구를 사용해서 이 카톡을 분석해줘.
message: 오늘 좀 피곤하긴 한데 네가 원하면 갈게
relationship: friend
context: 약속 시간을 정하는 중
```

```text
nunchi_tone_rewrite 도구를 사용해서 이 문장을 친구에게 보내도 덜 차갑게 바꿔줘.
text: 그건 네가 알아서 해
relationship: friend
targetTone: warmer
```

```text
nunchi_group_chat_summary 도구를 사용해서 단체방 합의와 다음 질문을 정리해줘.
topic: 저녁 약속
messages:
- 금요일 어때?
- 강남이면 좋아
- 나는 7시 가능
```

## Safety

- 상대의 속마음을 확정하지 않습니다.
- 답장은 확인 질문과 선택권을 우선합니다.
- 캡처 이미지, 전화번호, 계좌번호, 실명 등 개인정보 입력을 요구하지 않습니다.
