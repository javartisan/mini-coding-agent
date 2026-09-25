import { Agent } from "../src/agent/agent.js"
import type { LLM, LLMResponse } from "../src/llm/llm.js"
import { PermissionManager } from "../src/permission/permission.js"
import { ToolRegistry } from "../src/tools/registry.js"
import { ReadFileTool } from "../src/tools/read-file.js"
import { WriteFileTool } from "../src/tools/write-file.js"
import { ShellTool } from "../src/tools/shell.js"
import type { Message } from "../src/agent/types.js"
import type { Tool } from "../src/tools/tool.js"
import { promises as fs } from "node:fs"
import path from "node:path"
import os from "node:os"

class ScriptedLLM {
  private step = 0

  constructor(private responses: LLMResponse[]) {}

  async chat(_messages: Message[], _tools: Tool[] = []): Promise<LLMResponse> {
    const response = this.responses[this.step]
    this.step += 1

    if (!response) {
      return { content: "no more scripted responses" }
    }

    return response
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

async function testPermissionManager(): Promise<void> {
  const allow = new PermissionManager(async () => "y")
  const deny = new PermissionManager(async () => "n")
  const missing = new PermissionManager()

  assert(await allow.check("read") === true, "read should auto-allow")
  assert(await allow.check("write", "write_file") === true, "write y should allow")
  assert(await deny.check("shell", "shell") === false, "shell n should deny")
  assert(await missing.check("write") === false, "missing ask should deny write")

  console.log("✓ PermissionManager")
}

async function testAgentPermissionGate(): Promise<void> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "mini-agent-perm-"))
  const target = path.join(tmp, "demo.txt")

  const registry = new ToolRegistry()
  registry.register(new ReadFileTool())
  registry.register(new WriteFileTool())
  registry.register(new ShellTool())

  const answers = ["n", "y"]
  const permission = new PermissionManager(async () => answers.shift() ?? "n")

  const llm = new ScriptedLLM([
    {
      content: "",
      toolCalls: [{
        id: "call_1",
        name: "write_file",
        arguments: { path: target, content: "denied-content" }
      }]
    },
    { content: "第一次被拒绝后我停了" },
    {
      content: "",
      toolCalls: [{
        id: "call_2",
        name: "write_file",
        arguments: { path: target, content: "allowed-content" }
      }]
    },
    { content: "第二次写入成功" }
  ])

  const agent = new Agent(
    llm as unknown as LLM,
    registry,
    permission
  )

  const first = await agent.run("请写入文件（会被拒绝）")
  assert(first.includes("第一次被拒绝"), `unexpected first reply: ${first}`)

  let exists = true
  try {
    await fs.access(target)
  } catch {
    exists = false
  }
  assert(!exists, "file should not exist after deny")

  const second = await agent.run("请再次写入文件（会放行）")
  assert(second.includes("第二次写入成功"), `unexpected second reply: ${second}`)

  const content = await fs.readFile(target, "utf-8")
  assert(content === "allowed-content", `unexpected file content: ${content}`)

  console.log("✓ Agent permission gate (deny then allow)")
}

async function main(): Promise<void> {
  await testPermissionManager()
  await testAgentPermissionGate()
  console.log("\nAll permission checks passed.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
