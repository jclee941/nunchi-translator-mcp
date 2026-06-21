import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js"

const serviceName = "nunchi-translator-mcp"
const serviceDisplayName = "Nunchi Translator MCP(눈치 번역기 MCP)"

export const safeTextToolAnnotations = {
  title: "Nunchi Translator MCP Tool",
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: true,
} satisfies ToolAnnotations

export function nunchiToolAnnotations(title: string): ToolAnnotations {
  return {
    ...safeTextToolAnnotations,
    title,
  }
}

export function nunchiToolDescription(action: string): string {
  return `${serviceName} (${serviceDisplayName}) ${action}`
}

export function formatStructuredMcpText(title: string, value: unknown): string {
  if (typeof value !== "object" || value === null) {
    return title
  }

  const details = Object.entries(value)
    .slice(0, 6)
    .map(([key, item]) => `- ${key}: ${formatMcpTextValue(item)}`)

  return `${title}\n\n${details.join("\n")}`
}

function formatMcpTextValue(value: unknown): string {
  if (typeof value === "string") {
    return value.length > 120 ? `${value.slice(0, 117)}...` : value
  }

  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return String(value)
  }

  if (Array.isArray(value)) {
    return `${value.length}개 항목`
  }

  return "상세 항목"
}
