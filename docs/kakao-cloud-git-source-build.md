# Kakao Cloud Git Source Build

Kakao Cloud의 `Git 소스 빌드` 화면에서 다음 값을 사용합니다.

| 항목 | 값 |
| --- | --- |
| MCP 서버 이름 | `nunchi-translator` |
| 설명 | `애매한 카톡 문장을 눈치 단서로 해석하고, 안전한 답장 후보를 제안하는 PlayMCP downstream MCP 서버` |
| Git URL | `https://github.com/jclee941/nunchi-translator-mcp.git` |
| 브랜치/ref | `master` |
| Dockerfile 경로 | `Dockerfile` |
| PAT | public repo이므로 비워둠 |

환경변수:

| 이름 | 값 |
| --- | --- |
| `PORT` | `3000` |
| `MCP_SERVER_NAME` | `nunchi-translator-mcp` |
| `MCP_SERVER_VERSION` | `0.1.0` |
| `PUBLIC_BASE_URL` | `https://<Kakao-Cloud-domain>` |

배포 후 확인:

```bash
curl -i https://<Kakao-Cloud-domain>/health
```

PlayMCP 개발자 콘솔에 등록할 endpoint:

```text
https://<Kakao-Cloud-domain>/mcp
```
