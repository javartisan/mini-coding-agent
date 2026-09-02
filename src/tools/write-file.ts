import { promises as fs } from "node:fs"
import type { Tool, ToolParameters } from "./tool.js"
import { logger } from "../utils/logger.js"

interface WriteFileInput {
  path: string
  content: string
}

export class WriteFileTool implements Tool<WriteFileInput> {

  name = "write_file"

  description = "向指定文件写入内容。文件不存在时会创建。"

  parameters: ToolParameters = {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "要写入的文件路径"
      },
      content: {
        type: "string",
        description: "要写入的完整文件内容"
      }
    },
    required: ["path", "content"]
  }

  async execute(input: WriteFileInput): Promise<string> {
    const startedAt = logger.toolStart(this.name, input)

    try {
      await fs.writeFile(
        input.path,
        input.content,
        "utf-8"
      )

      const message = `文件写入成功: ${input.path}`
      logger.toolOk(this.name, startedAt, message)
      return message
    } catch (error) {
      const message = `文件写入失败: ${error}`
      logger.toolFail(this.name, startedAt, message)
      return message
    }
  }
}
