import { exec } from "node:child_process"
import type { Tool, ToolParameters } from "./tool.js"
import { logger } from "../utils/logger.js"

interface ShellInput {
  command: string
}

export class ShellTool implements Tool<ShellInput> {

  name = "shell"

  description = "执行一条 Shell 命令，返回 stdout 或错误信息。"

  permission = "shell" as const

  parameters: ToolParameters = {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "要执行的 shell 命令"
      }
    },
    required: ["command"]
  }

  async execute(input: ShellInput): Promise<string> {
    const startedAt = logger.toolStart(this.name, input)

    return new Promise((resolve) => {

      exec(
        input.command,
        {
          timeout: 30_000,
          maxBuffer: 1024 * 1024
        },
        (error, stdout, stderr) => {

          if (error) {
            const message = `执行失败\n${stderr || error.message}`
            logger.toolFail(this.name, startedAt, message)
            resolve(message)
            return
          }

          const output = stdout || "(无输出)"
          logger.toolOk(this.name, startedAt, output)
          resolve(output)
        }
      )

    })
  }
}
