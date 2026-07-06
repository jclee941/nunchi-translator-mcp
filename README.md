# Nunchi Translator MCP

[![Runtime](https://img.shields.io/badge/runtime-Bun-000?logo=bun)](https://bun.sh)
[![MCP](https://img.shields.io/badge/protocol-MCP%201.29-5b6cff)](https://modelcontextprotocol.io)
[![Type](https://img.shields.io/badge/type-private%20server-blueviolet)]()
[![Deploy](https://img.shields.io/badge/deploy-Kakao%20Cloud-ffcd00?logo=kakao)](https://www.kakaocloud.com)
[![License](https://img.shields.io/badge/license-check%20LICENSE-lightgrey)](./LICENSE)

PlayMCP 개발자 콘솔에 `/mcp` 엔드포인트로 등록되는 **downstream MCP 서버**입니다. Kakao Cloud Git Source Build로 배포되며, 애매한 카카오톡 대화의 눈치 단서·감정 온도·안전한 답장 후보를 분석하는 8개의 도구를 노출합니다. 이 저장소는 PlayMCP 자체 구현체가 아니라 PlayMCP가 호출하는 백엔드 서버입니다.

## Status Snapshot

| Item | Value |
| --- | --- |
| Package name | `nunchi-translator-mcp` |
| Version | `0.1.0` |
| Runtime | Bun 1.3.10 (Alpine) |
| Protocol | Model Context Protocol SDK `1.29.0` |
| Validation | Zod `4.4.3` |
| HTTP port | `3000` |
| Health check | `GET /health` |
| MCP endpoint | `POST /mcp` |
| stdio entry | `bun run mcp:stdio` |
| Deploy target | Kakao Cloud Git Source Build |
| Public endpoint | `https://nunchi-translator.playmcp-endpoint.kakaocloud.io/mcp` |
| Visibility | Private package, public MCP service after PlayMCP approval |

## Operator Flow (TL;DR)

1. 로컬에서 `bun install && bun run verify`로 린트·타입체크·테스트를 통과시킵니다.
2. `bun run start`로 HTTP 서버를 띄우고 `curl /health`와 `curl /mcp initialize`로 smoke test 합니다.
3. GitHub `master` 브랜치를 Kakao Cloud Git Source Build에 연결해 컨테이너를 빌드/배포합니다.
4. 배포가 Active 상태가 되면 PlayMCP in KC에서 발급한 Endpoint URL을 복사합니다.
5. PlayMCP 개발자 콘솔에서 새 MCP 서버로 등록 → 도구함 추가 → PlayMCP AI 채팅으로 테스트 → 심사 요청 → 전체 공개 전환 후 공개 URL을 공모전 접수 양식에 제출합니다.

## Table of Contents

- [Purpose / Package Contents](#purpose--package-contents)
- [Status](#status)
- [First Files to Read](#first-files-to-read)
- [API or Entry Points](#api-or-entry-points)
- [Quickstart / Usage](#quickstart--usage)
- [Configuration](#configuration)
- [Commands Reference](#commands-reference)
- [Local Development](#local-development)
- [Testing](#testing)
- [Architecture](#architecture)
- [Deployment: Kakao Cloud Git Source Build](#deployment-kakao-cloud-git-source-build)
- [PlayMCP Registration Flow](#playmcp-registration-flow)
- [PlayMCP Submission Fields](#playmcp-submission-fields)
- [Maintainers / Points of Contact](#maintainers--points-of-contact)
- [Further Documentation](#further-documentation)
- [License](#license)

## Purpose / Package Contents

Nunchi Translator MCP는 한국어 카카오톡 대화에서 발생하는 모호한 신호(눈치, 감정 온도, 의중)를 분석하고, 관계를 해치지 않는 답장·톤 조정·경계 설정 문장을 제안하는 MCP 서버입니다. 상대의 속마음을 단정하지 않고 **확인 질문과 선택권**을 우선합니다.

| Path | Role |
| --- | --- |
| `src/http-server.ts` | PlayMCP 연동용 HTTP MCP 서버 진입점 (포트 3000, `/health`, `/mcp`) |
| `src/stdio-server.ts` | 로컬 MCP 클라이언트 연동용 stdio 진입점 |
| `src/config.ts` | 환경 변수 기반 서버 설정 로더 |
| `src/mcp/server.ts` | MCP 서버 등록·라우팅·세션 처리 코어 |
| `src/mcp/tool-metadata.ts` | PlayMCP 노출용 도구 메타데이터 정의 |
| `src/mcp/nunchi-schemas.ts` | 도구 입출력 Zod 스키마 |
| `src/mcp/nunchi-coach.ts` | 메인 분석·답장 후보 생성 도구 (`nunchi_message_decode`, `nunchi_reply_draft`) |
| `src/mcp/nunchi-expansion.ts` | 톤/경계/복구 확장 도구 (`nunchi_tone_rewrite`, `nunchi_boundary_line`, `nunchi_repair_apology`, `nunchi_invitation_pressure`) |
| `src/mcp/nunchi-social-tools.ts` | 사회적 맥락 도구 (`nunchi_next_step`, `nunchi_group_chat_summary`) |
| `tests/` | Bun 테스트 (`config`, `http-mcp`, `nunchi-coach`) |
| `docs/kakao-cloud-git-source-build.md` | Kakao Cloud 배포 상세 가이드 |
| `assets/playmcp-representative.{png,svg}` | PlayMCP 대표 이미지 |
| `assets/submission-main.{png,svg}` | 공모전 접수 메인 이미지 |

## Status

- **Production readiness**: 초기 버전(`0.1.0`). PlayMCP 심사 제출용으로 배포 가능한 상태이며, 기능/스키마는 운영 피드백에 따라 변경될 수 있습니다.
- **Deprecation**: 없음.
- **Lifecycle**: 사전 심사 단계. 전체 공개 전환은 PlayMCP 승인 후 완료됩니다.

## First Files to Read

1. `src/http-server.ts` — PlayMCP가 실제로 호출하는 HTTP 진입점.
2. `src/mcp/server.ts` — 등록된 도구 목록과 라우팅.
3. `src/mcp/tool-metadata.ts` — PlayMCP에 노출되는 도구 이름·설명·입출력 계약.
4. `src/mcp/nunchi-schemas.ts` — 모든 도구 입출력의 Zod 검증 정의.
5. `docs/kakao-cloud-git-source-build.md` — 배포 파라미터와 트러블슈팅.

## API or Entry Points

### HTTP 서버 (PlayMCP 연동)

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Liveness probe. `200 OK` 반환. |
| `POST` | `/mcp` | MCP JSON-RPC 엔드포인트. `Accept: application/json, text/event-stream` 필요. |

### stdio 서버 (로컬 MCP 클라이언트)

```bash
bun run mcp:stdio
```

표준 입출력으로 MCP 메시지를 주고받는 진입점입니다. Claude Desktop, MCP Inspector 등 stdio 기반 클라이언트에서 직접 연결할 때 사용합니다.

### 노출 도구 목록

| Tool | Purpose |
| --- | --- |
| `nunchi_message_decode` | 애매한 카톡 문장의 눈치 단서·감정 온도·답장 후보 분석 |
| `nunchi_reply_draft` | 거절/사과/확인/수락 상황에 맞는 답장 초안 생성 |
| `nunchi_tone_rewrite` | 딱딱하거나 위험한 문장을 관계와 목적에 맞게 부드럽게 재작성 |
| `nunchi_boundary_line` | 시간/돈/감정/업무 상황에서 선을 긋는 문장 생성 |
| `nunchi_next_step` | 애매한 대화의 다음 답장과 액션 추천 |
| `nunchi_repair_apology` | 이미 어색하게 보낸 말을 짧은 사과·복구 문장으로 정리 |
| `nunchi_invitation_pressure` | 초대 문장의 부담 정도를 점검하고 안전하게 변환 |
| `nunchi_group_chat_summary` | 단체방 대화의 합의 신호와 다음 질문 정리 |

## Quickstart / Usage

### 1. 의존성 설치 및 검증

```bash
bun install
bun run verify
```

`verify`는 Biome 린트 → TypeScript 타입체크 → Bun 테스트를 순차 실행합니다.

### 2. HTTP 서버 실행

```bash
bun run start          # 프로덕션 모드
bun run dev            # 핫 리로드 개발 모드
```

### 3. Smoke Test

```bash
curl -i http://localhost:3000/health
```

```bash
curl -i http://localhost:3000/mcp \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"local-smoke","version":"0.1.0"}}}'
```

### 4. stdio 모드로 MCP 클라이언트에 연결

```json
{
  "mcpServers": {
    "nunchi-translator": {
      "command": "bun",
      "args": ["run", "src/stdio-server.ts"]
    }
  }
}
```

## Configuration

서버 설정은 `src/config.ts`의 환경 변수 로더를 통해 주입됩니다. 컨테이너 기본값은 `Dockerfile`의 `ENV`로 제공됩니다.

| Env | Default | Required | Description |
| --- | --- | --- | --- |
| `PORT` | `3000` | No | HTTP MCP 서버가 바인딩할 포트. Kakao Cloud 컨테이너 포트와 일치해야 합니다. |
| `NODE_ENV` | `production` | No | Bun 런타임 모드. `development`로 두면 stdio 진입점에서 디버깅 로그가 활성화될 수 있습니다. |

추가 환경 변수가 필요한 경우 `src/config.ts`에 정의한 뒤 스키마와 함께 PR을 올려 주세요.

## Commands Reference

| Script | Command | Purpose |
| --- | --- | --- |
| `bun run dev` | `bun run --hot src/http-server.ts` | HTTP 서버 핫 리로드 개발 모드 |
| `bun run start` | `bun run src/http-server.ts` | HTTP 서버 프로덕션 모드 |
| `bun run mcp:stdio` | `bun run src/stdio-server.ts` | stdio MCP 서버 (로컬 클라이언트용) |
| `bun run typecheck` | `tsc --noEmit` | TypeScript 타입체크 |
| `bun run lint` | `biome check .` | Biome 정적 분석 |
| `bun run format` | `biome check --write .` | Biome 자동 포맷 |
| `bun test` | `bun test` | Bun 테스트 러너 |
| `bun run verify` | `lint && typecheck && test` | 통합 검증 (PR 전 필수) |

## Local Development

1. Bun 1.3.10 이상을 설치합니다.
2. 저장소를 클론하고 `bun install`을 실행합니다.
3. `bun run dev`로 HTTP 서버를 띄우고, 별도 터미널에서 `bun run verify`를 주기적으로 실행합니다.
4. 새로운 도구를 추가할 때는 다음 순서를 따릅니다.
   - `src/mcp/nunchi-schemas.ts`에 Zod 입출력 스키마 추가
   - 해당 도메인 파일(`nunchi-coach.ts`, `nunchi-expansion.ts`, `nunchi-social-tools.ts`)에 구현 추가
   - `src/mcp/server.ts`에 도구 등록
   - `src/mcp/tool-metadata.ts`에 PlayMCP 노출용 메타데이터 추가
   - `tests/`에 단위 테스트 추가 후 `bun test`로 확인
5. 코드 스타일은 Biome이 강제합니다. 커밋 전 `bun run format`을 실행하세요.

## Testing

| Test File | Coverage |
| --- | --- |
| `tests/config.test.ts` | 환경 변수 로더, 기본값, 누락 시 동작 |
| `tests/http-mcp.test.ts` | `/health`, `/mcp` 엔드포인트 smoke, 초기화 핸드셰이크 |
| `tests/nunchi-coach.test.ts` | 메인 분석·답장 후보 도구의 입출력 계약 |

테스트 실행:

```bash
bun test                  # 전체 실행
bun test tests/http-mcp   # 파일 필터 실행
bun run verify            # 린트 + 타입체크 + 테스트 통합 실행
```

## Architecture

### Runtime Topology

| Layer | Component | Notes |
| --- | --- | --- |
| Edge | PlayMCP public endpoint | Kakao Cloud가 발급한 L7 엔드포인트 |
| Container | Bun HTTP server (`src/http-server.ts`) | 포트 3000, `/health`, `/mcp` |
| Protocol | MCP SDK 1.29.0 (`src/mcp/server.ts`) | Streamable HTTP transport |
| Domain | Nunchi tools (`src/mcp/nunchi-*.ts`) | 8개 도구, Zod 검증 |
| Validation | Zod 4.4.3 (`src/mcp/nunchi-schemas.ts`) | 모든 입출력 계약 |

### Request Flow (HTTP / PlayMCP)

1. PlayMCP 사용자가 AI 채팅에서 도구 호출 요청을 보냅니다.
2. PlayMCP가 컨테이너 외부 엔드포인트로 JSON-RPC 메시지를 전달합니다.
3. Kakao Cloud L7이 컨테이너의 `:3000/mcp`로 라우팅합니다.
4. `src/http-server.ts`가 요청을 수신해 MCP SDK 핸들러에 위임합니다.
5. `src/mcp/server.ts`가 메서드와 파라미터를 라우팅합니다.
6. 해당 도메인 모듈(`nunchi-coach`, `nunchi-expansion`, `nunchi-social-tools`)이 Zod 스키마로 입력을 검증한 뒤 응답을 생성합니다.
7. 응답은 다시 HTTP를 통해 PlayMCP로 반환되고, AI가 후속 답변에 통합합니다.

### Module Boundaries

| Concern | Module |
| --- | --- |
| Transport (HTTP, stdio) | `src/http-server.ts`, `src/stdio-server.ts` |
| MCP 코어 | `src/mcp/server.ts` |
| 도구 메타데이터·계약 | `src/mcp/tool-metadata.ts`, `src/mcp/nunchi-schemas.ts` |
| 도메인 로직 | `src/mcp/nunchi-coach.ts`, `src/mcp/nunchi-expansion.ts`, `src/mcp/nunchi-social-tools.ts` |
| 환경 설정 | `src/config.ts` |

## Deployment: Kakao Cloud Git Source Build

| Field | Value |
| --- | --- |
| Git URL | `https://github.com/jclee941/jclee-bot` |
| Branch / ref | `master` |
| Dockerfile path | `Dockerfile` |
| Container port | `3000` |
| Health check path | `/health` |
| Public endpoint | `https://nunchi-translator.playmcp-endpoint.kakaocloud.io/mcp` |

컨테이너 이미지는 multi-stage 빌드(`oven/bun:1.3.10-alpine`)로 구성되며, 의존성은 frozen lockfile로 설치됩니다. 자세한 트러블슈팅은 `docs/kakao-cloud-git-source-build.md`를 참고하세요.

## PlayMCP Registration Flow

1. PlayMCP in KC에서 배포 상태가 **Active**가 되면, 발급된 Endpoint URL을 복사합니다.
2. PlayMCP 개발자 콘솔에서 **새 MCP 서버**로 등록합니다.
3. 먼저 **임시 등록**한 뒤, 상세 미리보기 화면에서 노출할 도구를 도구함에 추가합니다.
4. PlayMCP AI 채팅에서 실제 호출을 테스트합니다.
5. 테스트가 끝나면 **심사 요청**을 제출합니다.
6. 승인 후 **공개 상태를 전체 공개**로 전환합니다.
7. 공개 MCP 상세 URL을 공모전 접수 양식에 제출합니다.

## PlayMCP Submission Fields

| Field | Value |
| --- | --- |
| 대표 이미지 | `assets/playmcp-representative.png` |
| MCP 이름 | `nunchi-translator-mcp` |
| MCP 식별자 | `nunchiTranslator` |
| MCP 설명 | 애매한 카톡 문장의 눈치 단서와 감정 온도를 분석하고, 관계를 해치지 않는 답장 초안·톤 조정·거절/사과/확인 문장을 제안하는 MCP입니다. 상대의 속마음을 단정하지 않고 확인 질문과 선택권을 우선합니다. |
| 대화 예시 1 | 친구가 "오늘 좀 피곤하긴 한데 네가 원하면 갈게"라고 했어. 약속을 미루고 싶은 건지, 그냥 배려하는 건지 눈치 단서와 안전한 답장 후보를 알려줘. |
| 보조 이미지 | `assets/submission-main.png` |

추가 대화 예시와 사용 시나리오는 심사 요청 전에 PlayMCP 콘솔의 미리보기에서 함께 점검해 주세요.

## Maintainers / Points of Contact

| Role | Contact |
| --- | --- |
| Repository owner | `@jclee941` (GitHub) |
| Issue tracker | GitHub Issues of this repository |
| 운영 채널 | PlayMCP 개발자 콘솔 공지·심사 결과 |

버그 리포트와 개선 제안은 GitHub Issue로 등록해 주세요. 보안 관련 민감한 사안은 공개 Issue 대신 저장소 소유자에게 직접 연락하시기 바랍니다.

## Further Documentation

- [Kakao Cloud Git Source Build 가이드](./docs/kakao-cloud-git-source-build.md)
- [PlayMCP 개발자 콘솔 문서](https://playmcp.kakao.com) (외부 링크)
- [Model Context Protocol 명세](https://modelcontextprotocol.io) (외부 링크)
- [Bun 런타임 문서](https://bun.sh/docs) (외부 링크)

## License

이 저장소는 `LICENSE` 파일에 명시된 라이선스를 따릅니다. 배포·수정·재배포 전 라이선스 전문을 확인하세요.