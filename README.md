# nunchi-translator-mcp

![Bun](https://img.shields.io/badge/Bun-1.3.10-f9f1e1?logo=bun&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)
![MCP SDK](https://img.shields.io/badge/MCP--SDK-1.29.0-5b21b6)
![License](https://img.shields.io/badge/license-Private_0.1.0-94a3b8)
![Status](https://img.shields.io/badge/status-experimental-orange)

> 한국어 우선 README — 본문은 한국어 단락을 먼저, 영어 보조 단락을 그 다음에 배치합니다.

## 한 줄 요약

`nunchi-translator-mcp`는 **눈치**(Nunchi) 기반 코칭, 확장, 소셜 분석 도구를 노출하는 **Model Context Protocol(MCP) 서버**입니다. HTTP와 stdio 두 가지 전송 방식을 지원하며, 호스트 LLM 클라이언트에서 도구로 호출할 수 있습니다.

## One-line Summary

`nunchi-translator-mcp` is a **Model Context Protocol (MCP) server** that exposes Nunchi-based coaching, expansion, and social-analysis tools. It ships with both HTTP and stdio transports so host LLM clients can register the tools directly.

## 상태 한눈에 보기 / Status at a Glance

| 항목 / Item | 값 / Value | 비고 / Notes |
| --- | --- | --- |
| 패키지명 / Package | `nunchi-translator-mcp` | `private: true` 사내 패키지 |
| 버전 / Version | `0.1.0` | 초기 실험 버전 |
| 런타임 / Runtime | Bun `1.3.10` | `oven/bun:1.3.10-alpine` 베이스 이미지 |
| 언어 / Language | TypeScript `^5.8` | `tsconfig.json` strict 모드 가정 |
| 전송 / Transports | HTTP (`:3000`) + stdio | `mcp:stdio` 스크립트 제공 |
| MCP SDK | `@modelcontextprotocol/sdk@1.29.0` | 2025 표준 SDK |
| 스키마 / Validation | `zod@4.4.3` | `nunchi-schemas.ts` |
| 린트 / Lint | Biome `^2.0.6` | `biome check .` |
| 테스트 / Test | Bun `test` | `bun test` |
| 컨테이너 / Container | Dockerfile 제공 | 멀티 스테이지, `:3000` 노출 |
| 문서 / Docs | `docs/kakao-cloud-git-source-build.md` | Kakao Cloud 빌드 가이드 |
| 운영 준비도 / Production | 실험 단계 / experimental | 인터페이스 안정화 전 |

## 빠른 흐름 / Quick Flow

1. 호스트 LLM 클라이언트가 MCP 클라이언트를 통해 `nunchi-translator-mcp`에 연결합니다.
2. `http-server.ts`(기본) 또는 `stdio-server.ts` 중 하나가 선택되어 MCP 핸드셰이크를 처리합니다.
3. `src/mcp/server.ts`가 등록된 도구 목록(코치·확장·소셜·메타데이터)을 클라이언트에 알립니다.
4. 클라이언트가 도구를 호출하면 `nunchi-coach.ts`, `nunchi-expansion.ts`, `nunchi-social-tools.ts` 중 해당 모듈이 `zod` 스키마로 입력을 검증합니다.
5. 결과가 MCP 응답으로 직렬화되어 호스트 모델에 반환됩니다.

## 목차 / Table of Contents

- [목적과 사용처 / Purpose and Audience](#목적과-사용처--purpose-and-audience)
- [패키지 구성 / Package Contents](#패키지-구성--package-contents)
- [아키텍처 / Architecture](#아키텍처--architecture)
- [빠른 시작 / Quickstart](#빠른-시작--quickstart)
- [설정 / Configuration](#설정--configuration)
- [명령어 / Commands Reference](#명령어--commands-reference)
- [로컬 개발 / Local Development](#로컬-개발--local-development)
- [테스트 / Testing](#테스트--testing)
- [Docker 배포 / Container Build](#docker-배포--container-build)
- [API와 진입점 / API and Entry Points](#api와-진입점--api-and-entry-points)
- [유지보수와 문의 / Maintainers and Contact](#유지보수와-문의--maintainers-and-contact)
- [추가 문서 / Further Documentation](#추가-문서--further-documentation)

## 목적과 사용처 / Purpose and Audience

`nunchi-translator-mcp`는 한국어권 사용자 상호작용에서 **눈치**(상황 맥락 읽기)를 보조하는 MCP 도구를 제공합니다. LLM 에이전트가 대화·관계·상황 데이터를 해석할 때, 다음을 위한 도구 표면을 노출합니다.

- `nunchi-coach` : 한국어 대화에서 어조·맥락 코칭
- `nunchi-expansion` : 짧은 입력을 확장·정제
- `nunchi-social-tools` : 사회적 신호를 분석하는 보조 도구
- `tool-metadata` : 등록된 도구의 메타데이터 질의

주 사용자는 **MCP 호스트(예: Claude Desktop, IDE 플러그인)**를 통해 본 서버를 등록하고, 모델이 필요할 때 위 도구를 호출하도록 설정하는 개발자/운영자입니다.

This project targets **MCP host application developers and operators** who want to plug Korean-context-aware Nunchi tools into their LLM agents without re-implementing them per client.

## 패키지 구성 / Package Contents

| 경로 / Path | 역할 / Role |
| --- | --- |
| `src/http-server.ts` | HTTP 전송 MCP 서버 진입점 (기본 `start`) |
| `src/stdio-server.ts` | stdio 전송 MCP 서버 진입점 (`mcp:stdio`) |
| `src/config.ts` | 환경 변수 기반 런타임 설정 |
| `src/mcp/server.ts` | MCP 서버 부트스트랩과 도구 등록 |
| `src/mcp/nunchi-coach.ts` | 코칭 도구 구현 |
| `src/mcp/nunchi-expansion.ts` | 확장 도구 구현 |
| `src/mcp/nunchi-social-tools.ts` | 소셜 분석 도구 구현 |
| `src/mcp/nunchi-schemas.ts` | `zod` 입력 스키마 정의 |
| `src/mcp/tool-metadata.ts` | 도구 메타데이터 질의 응답 |
| `tests/` | Bun 테스트 (`config`, `http-mcp`, `nunchi-coach`) |
| `docs/kakao-cloud-git-source-build.md` | Kakao Cloud Git 소스 빌드 절차 |
| `assets/` | PlayMCP, 제출용 이미지 자산 |
| `Dockerfile` | 멀티 스테이지 Bun 이미지 빌드 |
| `biome.json` | Biome 린트·포맷 규칙 |

## 아키텍처 / Architecture

본 서버는 단일 프로세스 MCP 서버이며, 전송 계층만 HTTP 또는 stdio로 갈립니다.

| 계층 / Layer | 모듈 / Module | 책임 / Responsibility |
| --- | --- | --- |
| Transport | `http-server.ts` | `:3000` HTTP MCP 핸드셰이크 |
| Transport | `stdio-server.ts` | 표준 입출력 MCP 핸드셰이크 |
| Boot | `mcp/server.ts` | SDK 서버 인스턴스화, 도구 등록 |
| Tool | `mcp/nunchi-coach.ts` | 코칭 시나리오 처리 |
| Tool | `mcp/nunchi-expansion.ts` | 입력 확장·정제 처리 |
| Tool | `mcp/nunchi-social-tools.ts` | 사회 신호 처리 |
| Schema | `mcp/nunchi-schemas.ts` | `zod` 검증 |
| Meta | `mcp/tool-metadata.ts` | 자기 기술(self-description) |
| Config | `config.ts` | 환경 변수 파싱·기본값 |

요청 흐름:

1. 클라이언트가 HTTP 또는 stdio로 MCP 초기화 요청 전송
2. `mcp/server.ts`가 등록된 도구 목록을 `ListTools` 응답으로 반환
3. 클라이언트가 특정 도구를 호출하면 해당 도구 모듈이 `nunchi-schemas.ts`로 입력을 검증
4. 도구 본 로직이 결과를 생성하고 SDK가 JSON-RPC 응답으로 직렬화
5. 호출자는 결과를 다시 모델 컨텍스트에 주입

## 빠른 시작 / Quickstart

### 1) 의존성 설치 / Install dependencies

```bash
bun install --frozen-lockfile
```

### 2) 개발 모드 (HTTP, 핫 리로드) / Dev (HTTP, hot reload)

```bash
bun run dev
```

### 3) stdio 모드로 실행 / Run in stdio mode

```bash
bun run mcp:stdio
```

### 4) 빌드 산출물 없이 즉시 검증 / One-shot verify

```bash
bun run verify
```

## 설정 / Configuration

본 서버는 `src/config.ts`를 통해 환경 변수를 읽습니다. 자세한 변수 목록은 `src/config.ts`를 직접 확인해 주세요. 컨테이너 기본값은 `PORT=3000`, `NODE_ENV=production`입니다.

| 변수 / Variable | 기본값 / Default | 용도 / Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP MCP 수신 포트 |
| `NODE_ENV` | `production` (컨테이너) | 런타임 모드 |
| 기타 MCP 옵션 | `src/config.ts` 참조 | 도구 동작 제어 |

민감한 값(예: 외부 LLM 호출 키)은 저장소 외부에서 주입해 주세요. 본 README는 예시로 비공개 IP나 컨테이너 번호를 하드코딩하지 않습니다.

## 명령어 / Commands Reference

| 명령 / Command | 설명 / Description |
| --- | --- |
| `bun run dev` | HTTP 서버 핫 리로드 개발 모드 |
| `bun run start` | 프로덕션 HTTP 서버 |
| `bun run mcp:stdio` | stdio 전송 MCP 서버 |
| `bun run typecheck` | `tsc --noEmit` 정적 타입 검사 |
| `bun run lint` | Biome 정적 분석 |
| `bun run format` | Biome 자동 수정 |
| `bun test` | Bun 테스트 러너 |
| `bun run verify` | lint + typecheck + test 일괄 실행 |

## 로컬 개발 / Local Development

- 런타임은 Bun `1.3.10` 이상을 권장합니다. Dockerfile과 동일한 베이스를 사용하면 환경 차이를 줄일 수 있습니다.
- 린트와 포맷은 Biome가 단일 소스입니다. 커밋 전 `bun run format`을 실행해 주세요.
- 새 도구를 추가할 때는 다음 순서를 권장합니다.
  1. `src/mcp/nunchi-schemas.ts`에 `zod` 스키마 정의
  2. 해당 기능 모듈(`nunchi-coach.ts` 등)에 핸들러 구현
  3. `src/mcp/server.ts`에서 도구 등록
  4. `tests/`에 단위 테스트 추가
  5. `bun run verify`로 일괄 검증

## 테스트 / Testing

- 테스트 프레임워크: Bun 내장 `bun test`
- 테스트 위치: `tests/`
- 현재 포함된 테스트:
  - `config.test.ts` — 설정 파싱 검증
  - `http-mcp.test.ts` — HTTP 전송 MCP 동작 검증
  - `nunchi-coach.test.ts` — 코칭 도구 동작 검증

```bash
bun test
```

새 도구를 등록한 경우, `bun run verify`로 정적 분석과 테스트를 함께 실행해 회귀를 방지하세요.

## Docker 배포 / Container Build

멀티 스테이지 Dockerfile이 제공됩니다. 빌드 산출물만 담는 경량 이미지를 만듭니다.

```bash
docker build -t nunchi-translator-mcp:0.1.0 .
docker run --rm -p 3000:3000 nunchi-translator-mcp:0.1.0
```

Kakao Cloud Git 소스 빌드를 사용하는 경우 `docs/kakao-cloud-git-source-build.md`의 절차를 참고하세요.

## API와 진입점 / API and Entry Points

MCP는 JSON-RPC 기반이지만 전송에 따라 진입 형태가 달라집니다.

| 전송 / Transport | 진입점 / Entry Point | 권장 호스트 / Suggested Host |
| --- | --- | --- |
| HTTP | `http://<host>:3000/mcp` (MCP 라우팅) | Claude Desktop, IDE MCP 플러그인 |
| stdio | `bun run src/stdio-server.ts` | 로컬 MCP 클라이언트 |

각 도구의 입력·출력 스키마는 `src/mcp/nunchi-schemas.ts`와 `src/mcp/tool-metadata.ts`를 통해 자체 설명(self-describing)됩니다. 자세한 도구 시그니처는 소스 코드를 직접 확인하세요.

## 유지보수와 문의 / Maintainers and Contact

이 저장소는 사내 비공개 패키지(`private: true`)이며 외부 배포를 전제로 하지 않습니다. 운영 및 변경 요청은 저장소 소유 팀에 문의해 주세요.

- 저장소 소유 / Owner: 본 저장소를 운영하는 사내 팀
- 이슈 트래커: 저장소 내 Issues 탭 사용
- 보안 이슈: 공개 이슈 대신 사내 보안 채널 사용

## 추가 문서 / Further Documentation

- `docs/kakao-cloud-git-source-build.md` — Kakao Cloud Git 소스 빌드 절차
- `CONTRIBUTING.md` — 기여 가이드 (해당 문서 우선)
- `LICENSE` — 라이선스 전문
- MCP 프로토콜 사양: Model Context Protocol 공식 문서

## 라이선스 / License

`LICENSE` 파일을 참조하세요. 본 패키지는 `private: true`로 표시되어 있으므로 외부 재배포를 금합니다.