import { promises as fs } from "node:fs"
import type { Tool } from "./tool.js"

interface WriteFileInput {
  path: string
  content: string
}

export class WriteFileTool implements Tool<WriteFileInput> {

  name = "write_file"

  description = "向指定文件写入内容"

  async execute(input: WriteFileInput): Promise<string> {
    try {
      await fs.writeFile(
        input.path,
        input.content,
        "utf-8"
      )

      return `文件写入成功: ${input.path}`
    } catch (error) {
      return `文件写入失败: ${error}`
    }
  }
}
