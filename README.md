# 눈치 번역기 MCP · Nunchi Translator MCP

`v0.1.0` · Bun · TypeScript · MCP `1.29.0`

> 한국어 카톡 메시지의 **눈치 단서**와 **감정 온도**를 분석하고,
> 관계를 해치지 않는 답장·톤 조정·경계선 문장을 제안하는 downstream MCP 서버입니다.
> PlayMCP 개발자 콘솔에 `/mcp` 엔드포인트로 등록해 사용합니다.
>
> A downstream MCP server that decodes the social cues and emotional temperature of ambiguous Korean chat messages, then drafts replies that preserve the relationship.

## 한눈에 보기

| 항목 | 값 |
| --- | --- |
| 패키지명 | `nunchi-translator-mcp` |
| 현재 버전 | `0.1.0` (초기 개발) |
| 런타임 | Bun `1.3.10-alpine` |
| 언어 | TypeScript `5.8+`, ESM |
| MCP SDK | `@modelcontextprotocol/sdk` `1.29.0` |
| 입력 검증 | Zod `4.4.3` |
| 트랜스포트 | Streamable HTTP (`/mcp`), stdio (`mcp:stdio`) |
| HTTP 포트 | `3000` (`PORT` 환경 변수) |
| 헬스 체크 | `GET /health` |
| 린트/포맷 | Biome `2.x` |
| 배포 대상 | Kakao Cloud → PlayMCP 개발자 콘솔 |
| 패키지 모드 | `private` (publish 대상 아님) |
| 라이선스 | 저장소 [`LICENSE`](./LICENSE) 참조 |

## 동작 흐름

1. PlayMCP 개발자 콘솔이 JSON-RPC 요청을 `/mcp` 엔드포인트로 전송합니다.
2. [`src/http-server.ts`](./src/http-server.ts)가 요청을 받아 MCP 핸들러로 위임합니다.
3. [`src/mcp/server.ts`](./src/mcp/server.ts)가 8개 도구 중 하나를 라우팅하고 Zod로 입력을 검증합니다.
4. 도구 모듈(`nunchi-coach`, `nunchi-social-tools`)이 한국어 응답을 구성합니다.
5. 결과는 Streamable HTTP 응답으로 PlayMCP에 반환되고, 채팅 응답에 도구 결과로 표시됩니다.

## 제공 도구

| 도구 이름 | 한 줄 설명 |
| --- | --- |
| `nunchi_message_decode` | 애매한 카톡 문장의 눈치 단서, 감정 온도, 안전한 답장 후보 분석 |
| `nunchi_reply_draft` | 거절·사과·확인·수락 상황에 맞는 답장 초안 생성 |
| `nunchi_tone_rewrite` | 딱딱하거나 위험한 문장을 관계와 목적에 맞게 부드럽게 재작성 |
| `nunchi_boundary_line` | 시간·돈·감정·업무 상황에서 선을 긋는 문장 생성 |
| `nunchi_next_step` | 애매한 대화의 다음 답장과 액션을 추천 |
| `nunchi_repair_apology` | 이미 어색하게 보낸 말을 짧은 사과와 복구 문장으로 정리 |
| `nunchi_invitation_pressure` | 초대 문장이 부담스러운지 점검하고 안전한 대안으로 변경 |
| `nunchi_group_chat_summary` | 단체방 대화의 합의 신호와 다음 질문을 정리 |

각 도구의 정확한 입력·출력 스키마는 [`src/mcp/nunchi-schemas.ts`](./src/mcp/nunchi-schemas.ts)와
[`src/mcp/tool-metadata.ts`](./src/mcp/tool-metadata.ts)에서 확인할 수 있습니다.

## 빠른 시작

```bash
bun install
bun run verify
bun run start
```

헬스 체크 및 MCP 초기화 응답 확인:

```bash
curl -i http://localhost:3000/health

curl -i http://localhost:3000/mcp \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"local-smoke","version":"0.1.0"}}}'
```

## 목차

- [프로젝트 소개](#프로젝트-소개)
- [패키지 구성](#패키지-구성)
- [상태](#상태)
- [먼저 읽을 파일](#먼저-읽을-파일)
- [API 및 진입점](#api-및-진입점)
- [구성](#구성)
- [명령어](#명령어)
- [아키텍처](#아키텍처)
- [로컬 개발](#로컬-개발)
- [테스트](#테스트)
- [Kakao Cloud 배포](#kakao-cloud-배포)
- [PlayMCP 등록](#playmcp-등록)
- [PlayMCP 제출 정보](#playmcp-제출-정보)
- [기여](#기여)
- [유지보수자](#유지보수자)
- [추가 문서](#추가-문서)
- [라이선스](#라이선스)

## 프로젝트 소개

**눈치 번역기 MCP**는 한국어 카톡·단체 채팅에서 자주 발생하는 모호한 메시지를
해석하고, 상대와의 관계를 해치지 않는 답장을 작성하도록 돕는 MCP 서버입니다.
LLM이 도구로 호출할 때 한국어 응답을 일관되게 반환하도록 설계되어
PlayMCP 채팅에서 바로 활용할 수 있습니다.

대상 사용자:

- PlayMCP 기반 한국어 AI 어시스턴트 개발자
- 카톡 메시지를 분석·재작성해야 하는 1인 개발자와 소상공인
- 모호한 한국어 메시지의 사회언어적 단서를 LLM에 안정적으로 주입하고 싶은 팀

핵심 설계 원칙:

- **상대의 속마음 단정 금지**: 확인 질문과 선택권을 우선합니다.
- **안전한 톤 우선**: 거절·사과·경계선을 부드럽게 표현하는 후보를 제시합니다.
- **스키마 기반 검증**: 모든 도구 입력은 Zod로 검증해 런타임 오류를 줄입니다.

## 패키지 구성

```text
nunchi-translator-mcp/
├─ src/
│  ├─ config.ts                 # 환경 변수, 포트, 기본 옵션
│  ├─ http-server.ts            # Streamable HTTP 진입점
│  ├─ stdio-server.ts           # stdio MCP 진입점
│  └─ mcp/
│     ├─ server.ts              # MCP 서버 핸들러 등록
│     ├─ tool-metadata.ts       # 도구 목록 및 메타데이터
│     ├─ nunchi-schemas.ts      # Zod 입력/출력 스키마
│     ├─ nunchi-coach.ts        # 메시지 디코드·답장 초안 코어 로직
│     ├─ nunchi-social-tools.ts # 톤·경계·사과·요약 도구
│     └─ nunchi-expansion.ts    # 확장 도구 모음
├─ tests/
│  ├─ config.test.ts            # 설정 모듈 단위 테스트
│  ├─ http-mcp.test.ts          # HTTP MCP 통합 테스트
│  └─ nunchi-coach.test.ts      # 코어 로직 단위 테스트
├─ docs/
│  └─ kakao-cloud-git-source-build.md # Kakao Cloud 배포 절차
├─ assets/
│  ├─ playmcp-representative.png / .svg # PlayMCP 대표 이미지
│  └─ submission-main.png / .svg        # 제출용 메인 이미지
├─ Dockerfile                   # oven/bun 멀티스테이지 빌드
├─ biome.json                   # Biome 린트/포맷 설정
├─ bun.lock                     # Bun 의존성 잠금 파일
├─ package.json                 # 패키지 정의 및 스크립트
├─ tsconfig.json                # TypeScript 컴파일러 옵션
├─ CONTRIBUTING.md              # 기여 가이드
├─ LICENSE                      # 라이선스 전문
└─ README.md                    # 본 문서
```

## 상태

- 현재 버전은 `0.1.0`이며 **초기 개발 단계**입니다.
- 공개 API(도구 이름·스키마)는 시맨틱 버전 이전 단계이므로 사전 고지 없이 변경될 수 있습니다.
- Kakao Cloud의 PlayMCP 경로에서 정상 동작을 확인했으나, 운영 환경 적용 전 자체 회귀 테스트를 권장합니다.
- 보안 진단, 부하 테스트, 다국어 확장은 아직 수행되지 않았습니다.
- 패키지는 `"private": true`로 설정되어 외부 publish를 가정하지 않습니다.

## 먼저 읽을 파일

| 순서 | 경로 | 읽는 이유 |
| --- | --- | --- |
| 1 | [`src/config.ts`](./src/config.ts) | 포트·환경 변수 등 런타임 기본값 확인 |
| 2 | [`src/http-server.ts`](./src/http-server.ts) | HTTP 진입점 구조와 라우팅 파악 |
| 3 | [`src/mcp/server.ts`](./src/mcp/server.ts) | MCP 핸들러 등록 방식과 도구 라우팅 확인 |
| 4 | [`src/mcp/nunchi-schemas.ts`](./src/mcp/nunchi-schemas.ts) | 각 도구의 입력·출력 Zod 스키마 확인 |
| 5 | [`src/mcp/tool-metadata.ts`](./src/mcp/tool-metadata.ts) | PlayMCP에 노출되는 도구 메타데이터 확인 |
| 6 | [`docs/kakao-cloud-git-source-build.md`](./docs/kakao-cloud-git-source-build.md) | Kakao Cloud 배포 절차 요약 확인 |

## API 및 진입점

### HTTP 엔드포인트

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| `GET` | `/health` | 헬스 체크 (liveness/readiness) |
| `POST` | `/mcp` | Streamable HTTP MCP 요청 수신 (JSON-RPC) |

### 진입점 스크립트

| 스크립트 | 명령어 | 용도 |
| --- | --- | --- |
| HTTP 서버 | `bun run src/http-server.ts` | PlayMCP 연동용 기본 진입점 |
| stdio 서버 | `bun run src/stdio-server.ts` | 로컬 MCP 클라이언트 디버깅용 진입점 |

### MCP 도구 호출 형식 예시

도구 호출은 MCP 표준 JSON-RPC 형식을 따릅니다. 각 도구의 정확한 입력 필드와
출력 구조는 [`src/mcp/nunchi-schemas.ts`](./src/mcp/nunchi-schemas.ts),
도구 이름과 설명은 [`src/mcp/tool-metadata.ts`](./src/mcp/tool-metadata.ts)에서
확인할 수 있습니다.

## 구성

모든 설정은 환경 변수로 주입하며 [`src/config.ts`](./src/config.ts)에서
기본값과 함께 노출됩니다.

| 환경 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `PORT` | `3000` | HTTP 서버 바인딩 포트. Dockerfile과 일치 |
| `NODE_ENV` | `production` (Dockerfile) | 런타임 모드. 개발 시 `development` 권장 |

로컬에서 포트를 변경하려면 `PORT=4000 bun run start`처럼 환경 변수로 덮어씁니다.

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `bun install` | 의존성 설치 (`bun.lock` 기준) |
| `bun run dev` | 핫 리로드 개발 서버 (`src/http-server.ts`) |
| `bun run start` | 프로덕션 HTTP 서버 |
| `bun run mcp:stdio` | stdio 모드 MCP 서버 |
| `bun run typecheck` | `tsc --noEmit` 타입 검사 |
| `bun run lint` | Biome 정적 분석 |
| `bun run format` | Biome 자동 포맷 적용 |
| `bun test` | Bun 테스트 러너 실행 |
| `bun run verify` | `lint` + `typecheck` + `test` 일괄 실행 |

## 아키텍처

### 계층 구성

| 계층 | 모듈 | 책임 |
| --- | --- | --- |
| Transport (HTTP) | `src/http-server.ts` | Bun HTTP 서버, `/health`, `/mcp` 라우팅 |
| Transport (stdio) | `src/stdio-server.ts` | 로컬 디버깅용 stdio MCP 트랜스포트 |
| MCP 코어 | `src/mcp/server.ts` | MCP 서버 핸들러 및 도구 라우팅 |
| 스키마 | `src/mcp/nunchi-schemas.ts` | Zod 입력·출력 검증 |
| 메타데이터 | `src/mcp/tool-metadata.ts` | 도구 이름·설명·카테고리 노출 |
| 코어 로직 | `src/mcp/nunchi-coach.ts` | 메시지 디코드·답장 초안 |
| 도구 모음 | `src/mcp/nunchi-social-tools.ts` | 톤·경계·사과·요약 도구 |
| 확장 | `src/mcp/nunchi-expansion.ts` | 추가 도구 등록 |
| 설정 | `src/config.ts` | 환경 변수·기본값 |

### 요청 흐름

1. 클라이언트(PlayMCP 또는 MCP Inspector)가 JSON-RPC 요청을 `POST /mcp`로 전송합니다.
2. HTTP 서버가 본문을 파싱하고 MCP 핸들러로 위임합니다.
3. MCP 서버가 도구 이름으로 매핑된 핸들러를 호출합니다.
4. 핸들러는 Zod 스키마로 입력을 검증한 뒤 한국어 응답을 구성합니다.
5. 결과는 Streamable HTTP 응답으로 직렬화되어 클라이언트에 반환됩니다.
6. 클라이언트는 도구 결과를 LLM 컨텍스트에 합쳐 최종 한국어 답장을 생성합니다.

## 로컬 개발

1. Bun `1.3.10` 이상을 설치합니다.
2. 의존성을 설치합니다.

   ```bash
   bun install
   ```

3. 린트·타입체크·테스트를 한 번에 실행해 베이스라인을 확인합니다.

   ```bash
   bun run verify
   ```

4. 핫 리로드 개발 서버를 띄웁니다.

   ```bash
   bun run dev
   ```

5. 다른 터미널에서 헬스 체크와 MCP 초기화 호출을 확인합니다.

   ```bash
   curl -i http://localhost:3000/health
   ```

6. stdio 모드는 MCP Inspector 같은 로컬 클라이언트와 함께 사용합니다.

   ```bash
   bun run mcp:stdio
   ```

코드 스타일은 Biome이 단일 출처이며, 커밋 전 `bun run format`을 권장합니다.

## 테스트

- 단위 테스트: [`tests/config.test.ts`](./tests/config.test.ts),
  [`tests/nunchi-coach.test.ts`](./tests/nunchi-coach.test.ts)
- 통합 테스트: [`tests/http-mcp.test.ts`](./tests/http-mcp.test.ts)
  (`/mcp` 엔드포인트의 초기화·도구 호출 검증)

전체 테스트 실행:

```bash
bun test
```

CI 또는 제출 전에는 `bun run verify`로 린트·타입체크·테스트를 한 번에 통과시키세요.

## Kakao Cloud 배포

자세한 절차는 [`docs/kakao-cloud-git-source-build.md`](./docs/kakao-cloud-git-source-build.md)를
참조하세요. 핵심 요약은 다음과 같습니다.

| 항목 | 값 |
| --- | --- |
| Git 소스 URL | `https://github.com/jclee941/jclee-bot` |
| 브랜치/Ref | `master` |
| Dockerfile 경로 | `Dockerfile` |
| 컨테이너 포트 | `3000` |
| 헬스 체크 경로 | `/health` |
| 베이스 이미지 | `oven/bun:1.3.10-alpine` |

`Dockerfile`은 의존성 설치 단계와 런타임 단계를 분리한 멀티스테이지 빌드이며,
`bun install --frozen-lockfile`로 재현 가능한 빌드를 보장합니다.

## PlayMCP 등록

Kakao Cloud 배포가 Active 상태가 된 뒤 다음 순서로 등록합니다.

1. Kakao Cloud에서 발급된 **Endpoint URL**을 복사합니다.
2. PlayMCP 개발자 콘솔에서 **새 MCP 서버 등록**을 선택합니다.
3. 임시 등록 후 상세 미리보기에서 도구함을 추가하고 PlayMCP AI 채팅으로 테스트합니다.
4. 테스트가 통과하면 **심사 요청**을 제출합니다.
5. 승인 후 공개 상태를 **전체 공개**로 전환하고, 공개 MCP 상세 URL을 공모전 접수 양식에 제출합니다.

운영 엔드포인트 예시: `https://nunchi-translator.playmcp-endpoint.kakaocloud.io/mcp`

## PlayMCP 제출 정보

| 항목 | 값 |
| --- | --- |
| 대표 이미지 | [`assets/playmcp-representative.png`](./assets/playmcp-representative.png) |
| 제출용 메인 이미지 | [`assets/submission-main.png`](./assets/submission-main.png) |
| MCP 이름 | `nunchi-translator-mcp` |
| MCP 식별자 | `nunchiTranslator` |
| MCP 설명 | 애매한 카톡 문장의 눈치 단서와 감정 온도를 분석하고, 관계를 해치지 않는 답장 초안·톤 조정·거절/사과/확인 문장을 제안하는 MCP입니다. 상대의 속마음을 단정하지 않고 확인 질문과 선택권을 우선합니다. |

대화 예시:

- 친구가 *"오늘 좀 피곤하긴 한데 네가 원하면 갈게"*라고 했어. 약속을 미루고 싶은 건지, 그냥 배려하는 건지 눈치 단서와 안전한 답장 후보를 알려줘.
- 상사에게 *"이번 주말에 잠깐 통화 가능할까요?"*라는 메시지를 받았어. 거절은 못 하겠고 부담도 싫은 톤으로 답장 초안을 만들어줘.
- 단체방에서 *"언제 만날지 정해볼까요?"*라는 메시지가 올라왔어. 합의 신호와 다음에 던질 안전한 질문을 정리해줘.

## 기여

기여 절차와 커밋 규칙은 [`CONTRIBUTING.md`](./CONTRIBUTING.md)를 참조하세요.
이 저장소는 단일 패키지 구조이며 외부 패키지 publish를 가정하지 않습니다
(`"private": true`).

PR 제출 전 체크리스트:

- `bun run format`으로 Biome 포맷을 적용합니다.
- `bun run verify`가 로컬에서 통과해야 합니다.
- 새로운 도구를 추가할 때 [`src/mcp/nunchi-schemas.ts`](./src/mcp/nunchi-schemas.ts)의
  Zod 스키마와 [`src/mcp/tool-metadata.ts`](./src/mcp/tool-metadata.ts)의
  메타데이터를 함께 갱신합니다.
- 도구 로직 변경 시 [`tests/`](./tests/)에 회귀 테스트를 추가합니다.

## 유지보수자

- 저장소 소유자: `@jclee941`
- 이슈 트래커: 저장소 Issues 탭
- 문의 채널: 저장소 Discussions 또는 이슈 등록

## 추가 문서

- 배포 절차: [`docs/kakao-cloud-git-source-build.md`](./docs/kakao-cloud-git-source-build.md)
- 기여 규칙: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- 라이선스 본문: [`LICENSE`](./LICENSE)

## 라이선스

본 저장소의 라이선스 조건은 [`LICENSE`](./LICENSE) 파일을 참조하세요.
서드파티 의존성(`@modelcontextprotocol/sdk`, `zod`, `@biomejs/biome` 등)은
각 패키지의 라이선스를 따릅니다.