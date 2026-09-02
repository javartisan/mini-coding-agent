import dotenv from "dotenv"
dotenv.config({ override: true })

import readline from "node:readline"

import { Agent } from "./agent/agent.js"
import { LLM } from "./llm/llm.js"

import { ToolRegistry } from "./tools/registry.js"
import { ReadFileTool } from "./tools/read-file.js"
import { WriteFileTool } from "./tools/write-file.js"
import { ShellTool } from "./tools/shell.js"
import { logger } from "./utils/logger.js"

const registry = new ToolRegistry()

registry.register(new ReadFileTool())
registry.register(new WriteFileTool())
registry.register(new ShellTool())

const llm = new LLM()

const agent = new Agent(
  llm,
  registry
)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

console.log("================================")
console.log(" Mini Coding Agent")
console.log(" 输入 exit 退出")
console.log("================================")

function prompt(): void {

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
