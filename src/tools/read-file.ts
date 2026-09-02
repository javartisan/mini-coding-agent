import { promises as fs } from "node:fs"
import type { Tool } from "./tool.js"

interface ReadFileInput {
  path: string
}

export class ReadFileTool implements Tool<ReadFileInput> {

  name = "read_file"

  description = "读取指定文件内容"

  async execute(input: ReadFileInput): Promise<string> {
    try {
      return await fs.readFile(input.path, "utf-8")
    } catch (error) {
      return `读取文件失败: ${error}`
    }
  }
}
