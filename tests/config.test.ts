import { describe, expect, test } from "bun:test"

import { loadConfig } from "../src/config.js"

describe("loadConfig", () => {
  test("returns defaults when optional environment values are absent", () => {
    const config = loadConfig({})

    expect(config.PORT).toBe(3000)
    expect(config.MCP_SERVER_NAME).toBe("nunchi-translator-mcp")
    expect(config.PUBLIC_BASE_URL).toBe("http://localhost:3000")
  })

  test("rejects invalid port values", () => {
    expect(() => loadConfig({ PORT: "70000" })).toThrow()
  })
})
