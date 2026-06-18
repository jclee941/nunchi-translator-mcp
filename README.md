# Nunchi Translator MCP

PlayMCP가 호출하는 downstream MCP 서버입니다. PlayMCP 자체를 구현하는 repo가 아니라,
Kakao Cloud에 배포한 뒤 PlayMCP 개발자 콘솔에 `/mcp` endpoint로 등록하는 서버입니다.

## Tools

- `nunchi_message_decode`: 애매한 카톡 문장을 눈치 단서, 감정 온도, 답장 후보로 분석합니다.
- `nunchi_reply_draft`: 거절/사과/확인/수락 상황에 맞는 카톡 답장 초안을 만듭니다.

## Local Run

```bash
bun install
bun run verify
bun run start
```

확인:

```bash
curl -i http://localhost:3000/health
curl -i http://localhost:3000/mcp
```

## Kakao Cloud Git Source Build

- Git URL: `https://github.com/jclee941/nunchi-translator-mcp.git`
- Branch/ref: `master`
- Dockerfile path: `Dockerfile`
- Container port: `3000`
- Health check path: `/health`
- PlayMCP endpoint: `https://<Kakao-Cloud-domain>/mcp`

## PlayMCP Registration Flow

1. PlayMCP in KC에서 배포가 Active가 되면 발급된 Endpoint URL을 복사합니다.
2. PlayMCP 개발자 콘솔에서 새 MCP 서버로 등록합니다.
3. 먼저 임시 등록하고, 상세 미리보기에서 도구함에 추가한 뒤 PlayMCP AI 채팅으로 테스트합니다.
4. 테스트가 끝난 뒤 심사 요청합니다.
5. 승인 후 공개 상태를 전체 공개로 전환하고, 공개 MCP 상세 URL을 공모전 접수 양식에 제출합니다.

## Safety

- 상대의 속마음을 확정하지 않습니다.
- 답장은 확인 질문과 선택권을 우선합니다.
- 캡처 이미지, 전화번호, 계좌번호, 실명 등 개인정보 입력을 요구하지 않습니다.
