import { exec } from "node:child_process"
import type { Tool } from "./tool.js"

interface ShellInput {
  command: string
}

export class ShellTool implements Tool<ShellInput> {

  name = "shell"

  description = "执行Shell命令"

  async execute(input: ShellInput): Promise<string> {

    return new Promise((resolve) => {

      exec(
        input.command,
        {
          timeout: 30_000,
          maxBuffer: 1024 * 1024
        },
        (error, stdout, stderr) => {

          if (error) {
            resolve(
              `执行失败\n${stderr || error.message}`
            )
            return
          }

          resolve(stdout)
        }
      )

    })
  }
}
