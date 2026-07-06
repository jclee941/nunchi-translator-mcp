# 눈치 번역기 MCP (Nunchi Translator MCP)

[![Runtime: Bun 1.3.10](https://img.shields.io/badge/runtime-Bun%201.3.10-orange)](https://bun.sh)
[![MCP SDK: 1.29.0](https://img.shields.io/badge/MCP%20SDK-1.29.0-6f42c1)](https://modelcontextprotocol.io)
[![Schema: Zod 4.4.3](https://img.shields.io/badge/schema-Zod%204.4.3-3068c6)](https://zod.dev)
[![Container: Bun Alpine](https://img.shields.io/badge/container-Bun%20Alpine-0db7ed)](./Dockerfile)

한국어 사회적·문화적 맥락(눈치)을 LLM 에이전트가 더 자연스럽게 다룰 수 있도록 돕는 Model Context Protocol 서버입니다.
세 가지 도구(`nunchi_coach`, `nunchi_expansion`, `nunchi_social_tools`)를 HTTP와 stdio 두 가지 전송 방식으로 노출합니다.

## 한국어 요약

`nunchi-translator-mcp`는 한국어 사용자의 사회적 신호와 상황을 LLM이 해석·조율하도록 돕는 MCP 서버입니다.
`@modelcontextprotocol/sdk` 1.29.0 위에 Bun 런타임 + TypeScript(ESM) + Zod 스키마로 구성되며, 로컬 개발(`bun run dev`), stdio 연결(`bun run mcp:stdio`), 그리고 경량 Alpine 컨테이너(`docker build`) 세 가지 진입 경로를 제공합니다.

## 한눈 표 (Status)

| 항목 | 값 |
| --- | --- |
| 제품 | MCP 서버 (한국어 사회적 맥락 보조) |
| 런타임 | Bun 1.3.10 (Alpine) |
| 언어 / 모듈 시스템 | TypeScript / ESM (`"type": "module"`) |
| MCP SDK | `@modelcontextprotocol/sdk` 1.29.0 |
| 스키마 | Zod 4.4.3 (`src/mcp/nunchi-schemas.ts`) |
| 전송 | HTTP(Streamable) 및 stdio |
| HTTP 기본 포트 | `3000` (`PORT` 환경변수로 변경) |
| 노출 도구 | `nunchi_coach`, `nunchi_expansion`, `nunchi_social_tools` |
| 다음 명령 (개발) | `bun install --frozen-lockfile && bun run dev` |
| 다음 명령 (stdio) | `bun run mcp:stdio` |
| 다음 명령 (검증) | `bun run verify` (lint + typecheck + test) |
| 다음 명령 (컨테이너) | `docker build -t nunchi-mcp . && docker run -p 3000:3000 nunchi-mcp` |
| 배포 참고 문서 | [`docs/kakao-cloud-git-source-build.md`](./docs/kakao-cloud-git-source-build.md) |
| 라이선스 | [`LICENSE`](./LICENSE) |

## 운영자 흐름 (Compact Flow)

1. Bun 1.3.10 이상 또는 Docker가 설치된 환경을 준비합니다.
2. `bun install --frozen-lockfile`로 의존성을 잠금 기반으로 설치합니다.
3. 로컬 HTTP 개발은 `bun run dev`로, 프로덕션 HTTP는 `bun run start`로 실행합니다.
4. MCP 클라이언트와 직접 stdio 연결이 필요할 때는 `bun run mcp:stdio`를 사용합니다.
5. 변경 후 `bun run verify`로 Biome 린트와 TypeScript 타입 검사와 테스트를 한 번에 통과시킵니다.
6. 컨테이너 이미지는 `Dockerfile`(멀티 스테이지, Bun Alpine)로 빌드합니다.
7. KakaoCloud Git 소스 빌드 배포는 [전용 가이드](./docs/kakao-cloud-git-source-build.md)를 따릅니다.

## 목차 (Table of Contents)

1. [패키지 구성 (Package Contents)](#패키지-구성-package-contents)
2. [먼저 읽을 파일 (First Files to Read)](#먼저-읽을-파일-first-files-to-read)
3. [진입점과 API (Entry Points)](#진입점과-api-entry-points)
4. [빠른 시작 (Quickstart)](#빠른-시작-quickstart)
5. [설정 (Configuration)](#설정-configuration)
6. [명령어 참조 (Commands)](#명령어-참조-commands)
7. [로컬 개발 (Local Development)](#로컬-개발-local-development)
8. [테스트 (Testing)](#테스트-testing)
9. [배포 (Deployment)](#배포-deployment)
10. [기여 (Contributing)](#기여-contributing)
11. [관리자 및 문의 (Maintainers)](#관리자-및-문의-maintainers)
12. [추가 문서 (Further Documentation)](#추가-문서-further-documentation)
13. [라이선스 (License)](#라이선스-license)

## 패키지 구성 (Package Contents)

| 경로 | 역할 |
| --- | --- |
| `src/config.ts` | 환경변수·기본값 로딩의 단일 출처 |
| `src/http-server.ts` | HTTP 전송(Streamable HTTP) 부트스트랩 |
| `src/stdio-server.ts` | 표준 입출력 전송 부트스트랩 |
| `src/mcp/server.ts` | MCP 서버 등록·라우팅 코어 |
| `src/mcp/nunchi-coach.ts` | `nunchi_coach` 도구 구현 |
| `src/mcp/nunchi-expansion.ts` | `nunchi_expansion` 도구 구현 |
| `src/mcp/nunchi-social-tools.ts` | `nunchi_social_tools` 도구 묶음 |
| `src/mcp/nunchi-schemas.ts` | Zod 입력·출력 스키마 정의 |
| `src/mcp/tool-metadata.ts` | 도구 이름·설명 등 메타데이터 |
| `tests/config.test.ts` | 설정 로딩 단위 테스트 |
| `tests/http-mcp.test.ts` | HTTP 전송과 도구 호출 통합 테스트 |
| `tests/nunchi-coach.test.ts` | `nunchi_coach` 동작 테스트 |
| `assets/` | 디렉토리·스토어 제출용 시각 자산 |
| `docs/kakao-cloud-git-source-build.md` | KakaoCloud Git 소스 빌드 배포 가이드 |
| `Dockerfile` | Bun Alpine 멀티 스테이지 컨테이너 빌드 |
| `biome.json` | Biome 린트·포맷 설정 |
| `tsconfig.json` | TypeScript 컴파일러 설정 |
| `bun.lock` | Bun 잠금 파일 |

## 먼저 읽을 파일 (First Files to Read)

| 순서 | 파일 | 이유 |
| --- | --- | --- |
| 1 | [`src/config.ts`](./src/config.ts) | 환경설정 키와 기본값을 한 곳에서 확인 |
| 2 | [`src/mcp/server.ts`](./src/mcp/server.ts) | 등록되는 도구와 라우팅 구조 파악 |
| 3 | [`src/mcp/nunchi-schemas.ts`](./src/mcp/nunchi-schemas.ts) | 각 도구의 입력·출력 계약 학습 |
| 4 | [`src/http-server.ts`](./src/http-server.ts) | HTTP 진입점과 부트스트랩 절차 확인 |
| 5 | [`tests/http-mcp.test.ts`](./tests/http-mcp.test.ts) | 기대 호출 시나리오와 응답 형태 파악 |

## 진입점과 API (Entry Points)

| 구분 | 위치 | 비고 |
| --- | --- | --- |
| HTTP 진입점 | [`src/http-server.ts`](./src/http-server.ts) | 기본 포트 `3000`, `PORT` 환경변수로 변경 |
| stdio 진입점 | [`src/stdio-server.ts`](./src/stdio-server.ts) | MCP 클라이언트가 프로세스로 직접 실행 |
| MCP 코어 | [`src/mcp/server.ts`](./src/mcp/server.ts) | 도구 등록·라우팅 일원화 |
| 도구 1 | `nunchi_coach` | [`src/mcp/nunchi-coach.ts`](./src/mcp/nunchi-coach.ts) |
| 도구 2 | `nunchi_expansion` | [`src/mcp/nunchi-expansion.ts`](./src/mcp/nunchi-expansion.ts) |
| 도구 3 | `nunchi_social_tools` | [`src/mcp/nunchi-social-tools.ts`](./src/mcp/nunchi-social-tools.ts) |

각 도구의 입력·출력은 `src/mcp/nunchi-schemas.ts`의 Zod 스키마로 검증되며, 사용자용 설명은 `src/mcp/tool-metadata.ts`에서 관리합니다.

## 빠른 시작 (Quickstart)

```bash
# 1. Bun 설치 (https://bun.sh 기준)
curl -fsSL https://bun.sh/install | bash

# 2. 저장소에서 의존성 설치 (잠금 파일 기반)
bun install --frozen-lockfile

# 3. HTTP 모드 개발 실행 (핫 리로드)
bun run dev

# 4. stdio 모드 실행 (MCP 클라이언트와 직접 연결)
bun run mcp:stdio
```

HTTP 모드로 띄운 뒤 MCP 클라이언트는 환경변수 `PORT`에서 정의한 포트로 서버에 접속합니다.
stdio 모드는 별도 포트 없이 MCP 클라이언트가 자식 프로세스로 직접 실행합니다.

## 설정 (Configuration)

| 변수 | 기본값 | 출처 | 설명 |
| --- | --- | --- | --- |
| `PORT` | `3000` | `Dockerfile`의 `ENV` | HTTP 모드에서 사용할 포트 |
| `NODE_ENV` | `production` | `Dockerfile`의 `ENV` | 컨테이너에서만 명시적으로 설정 |

새로운 환경변수가 필요할 경우 `src/config.ts`를 단일 출처로 두고 거기에서 일괄 로딩·기본값을 관리해 주세요.

## 명령어 참조 (Commands)

| 명령 | 정의 (package.json) | 용도 |
| --- | --- | --- |
| `bun run dev` | `bun run --hot src/http-server.ts` | HTTP 모드 핫 리로드 개발 실행 |
| `bun run start` | `bun run src/http-server.ts` | HTTP 모드 프로덕션 실행(컨테이너 진입점) |
| `bun run mcp:stdio` | `bun run src/stdio-server.ts` | stdio 모드로 MCP 클라이언트에 연결 |
| `bun run typecheck` | `tsc --noEmit` | TypeScript 타입 검사 |
| `bun run lint` | `biome check .` | Biome 정적 분석 |
| `bun run format` | `biome check --write .` | Biome 자동 포맷 |
| `bun test` | `bun test` | Bun 테스트 러너 실행 |
| `bun run verify` | `lint && typecheck && test` | 회귀 검증 일괄 실행 |

## 로컬 개발 (Local Development)

- 런타임은 Bun 1.3.10 이상을 권장합니다(컨테이너 베이스 이미지와 일치).
- 코드 스타일은 Biome(`biome.json`)를 따르며, `bun run format`으로 자동 정리할 수 있습니다.
- 새 도구를 추가할 때는 다음 순서를 권장합니다.
  1. `src/mcp/nunchi-schemas.ts`에 Zod 입력·출력 스키마를 먼저 정의합니다.
  2. 도구 로직 파일을 `src/mcp/` 아래에 둡니다.
  3. `src/mcp/tool-metadata.ts`에 이름·설명·예시를 등록합니다.
  4. `src/mcp/server.ts`에서 도구를 서버에 등록합니다.
  5. `tests/` 아래에 동작 회귀 테스트를 추가하고 `bun run verify`로 통과를 확인합니다.

## 테스트 (Testing)

| 테스트 파일 | 대응 모듈 | 검증 범위 |
| --- | --- | --- |
| `tests/config.test.ts` | `src/config.ts` | 설정 로딩과 기본값 |
| `tests/http-mcp.test.ts` | `src/http-server.ts`, `src/mcp/server.ts` | HTTP 전송·도구 호출 흐름 |
| `tests/nunchi-coach.test.ts` | `src/mcp/nunchi-coach.ts` | `nunchi_coach` 도구 동작 |

```bash
bun test                          # 전체 실행
bun test tests/http-mcp.test.ts   # 단일 파일 실행
bun run verify                    # lint + typecheck + test 일괄 실행
```

## 배포 (Deployment)

### Docker

`Dockerfile`은 Bun 1.3.10-alpine 기반 멀티 스테이지 빌드입니다.

- 1단계(`deps`): `package.json`과 `bun.lock`만 복사해 `bun install --frozen-lockfile`로 의존성을 설치합니다.
- 2단계: 런타임 이미지에 `node_modules`와 소스를 복사하고 `CMD ["bun", "run", "start"]`로 HTTP 모드를 실행합니다.
- `PORT=3000`을 노출하며 `-p 3000:3000`으로 호스트에 매핑해 사용합니다.

```bash
docker build -t nunchi-mcp .
docker run --rm -p 3000:3000 -e PORT=3000 nunchi-mcp
```

### KakaoCloud Git 소스 빌드

KakaoCloud에서 Git 소스 빌드로 이 저장소를 컨테이너 배포하는 단계별 절차는 전용 가이드를 참고합니다.
[`docs/kakao-cloud-git-source-build.md`](./docs/kakao-cloud-git-source-build.md)

## 기여 (Contributing)

기여 절차는 [`CONTRIBUTING.md`](./CONTRIBUTING.md)를 참고해 주세요.
모든 변경은 `bun run verify`(lint + typecheck + test)를 통과해야 하며, 코드 스타일은 Biome 표준을 따릅니다.

## 관리자 및 문의 (Maintainers)

저장소 메타데이터(예: `package.json`의 `name` 필드, 커밋 기록, 이슈 트래커)를 우선 참고해 주세요.
별도 운영 조직 정보가 저장소에 명시되지 않은 경우 저장소 관리자(Maintainer)에게 이슈로 문의하는 것을 권장합니다.

## 추가 문서 (Further Documentation)

| 주제 | 위치 |
| --- | --- |
| KakaoCloud Git 소스 빌드 | [`docs/kakao-cloud-git-source-build.md`](./docs/kakao-cloud-git-source-build.md) |
| MCP 프로토콜 명세 | <https://modelcontextprotocol.io> |
| Bun 런타임 | <https://bun.sh> |
| Biome 린터 | <https://biomejs.dev> |
| TypeScript | <https://www.typescriptlang.org> |
| Zod 스키마 | <https://zod.dev> |

## 라이선스 (License)

이 저장소는 [`LICENSE`](./LICENSE) 파일에 명시된 조건을 따릅니다.
공개 배포·수정·재배포 정책은 해당 파일을 직접 확인해 주세요.