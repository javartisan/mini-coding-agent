import { promises as fs } from "node:fs"
import type { Tool, ToolParameters } from "./tool.js"
import { logger } from "../utils/logger.js"

interface ReadFileInput {
  path: string
}

export class ReadFileTool implements Tool<ReadFileInput> {

  name = "read_file"

  description = "读取指定文件的完整内容。需要查看本地文件时使用。"

  parameters: ToolParameters = {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "要读取的文件路径"
      }
    },
    required: ["path"]
  }

  async execute(input: ReadFileInput): Promise<string> {
    const startedAt = logger.toolStart(this.name, input)

    try {
      const content = await fs.readFile(input.path, "utf-8")
      logger.toolOk(this.name, startedAt, content)
      return content
    } catch (error) {
      const message = `读取文件失败: ${error}`
      logger.toolFail(this.name, startedAt, message)
      return message
    }
  }
}
