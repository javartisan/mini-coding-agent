import dotenv from "dotenv"
import path from "node:path"
import { fileURLToPath } from "node:url"
import readline from "node:readline"

import { Agent } from "./agent/agent.js"
import { LLM } from "./llm/llm.js"

import { ToolRegistry } from "./tools/registry.js"
import { ReadFileTool } from "./tools/read-file.js"
import { WriteFileTool } from "./tools/write-file.js"
import { ShellTool } from "./tools/shell.js"
import { PermissionManager } from "./permission/permission.js"
import { logger } from "./utils/logger.js"

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
)

const envPath = path.join(projectRoot, ".env")
const loaded = dotenv.config({
  path: envPath,
  override: true,
  quiet: true
})

if (loaded.error) {
  logger.warn(`未能加载 ${envPath}`, loaded.error)
}

function maskKey(key: string | undefined): string {
  if (!key) {
    return "(missing)"
  }

  return `${key.slice(0, 8)}...${key.slice(-4)}`
}

logger.info("LLM config", {
  envFile: envPath,
  cwd: process.cwd(),
  model: process.env.OPENAI_MODEL,
  baseURL: process.env.OPENAI_BASE_URL || "(openai official)",
  apiKey: maskKey(process.env.OPENAI_API_KEY)
})

const registry = new ToolRegistry()

registry.register(new ReadFileTool())
registry.register(new WriteFileTool())
registry.register(new ShellTool())

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve)
  })
}

const permission = new PermissionManager(ask)
const llm = new LLM()

const agent = new Agent(
  llm,
  registry,
  permission
)

console.log("================================")
console.log(" Mini Coding Agent")
console.log(" 输入 exit 退出")
console.log("================================")

let stopped = false

rl.on("close", () => {
  stopped = true
})

function prompt(): void {

  if (stopped) {
    return
  }

  rl.question("\nYou > ", async (input) => {

    if (input === "exit") {
      rl.close()
      return
    }

    try {

      const result =
        await agent.run(input)

      console.log("\nAgent >", result)

    } catch (error) {

      logger.error("Agent Error", error)
    }

    prompt()
  })
}

prompt()
