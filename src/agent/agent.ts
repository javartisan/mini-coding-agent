import type { LLM } from "../llm/llm.js"
import type { ToolRegistry } from "../tools/registry.js"
import { logger, preview } from "../utils/logger.js"
import type { Message, ToolCall } from "./types.js"

const MAX_STEPS = 15

export class Agent {

  private messages: Message[] = [
    {
      role: "system",
      content: [
        "你是一个本地 Coding Agent。",
        "需要读文件、写文件或执行命令时，必须调用提供的工具，不要猜测文件内容。",
        "拿到工具结果后再给出最终回答。"
      ].join("")
    }
  ]

  constructor(
    private llm: LLM,
    private tools: ToolRegistry
  ) {}

  async run(userInput: string): Promise<string> {

    this.messages.push({
      role: "user",
      content: userInput
    })

    const tools = this.tools.getAll()

    for (let step = 0; step < MAX_STEPS; step++) {

      const response =
        await this.llm.chat(this.messages, tools)

      if (response.toolCalls?.length) {

        this.messages.push({
          role: "assistant",
          content: response.content ?? "",
          toolCalls: response.toolCalls
        })

        logger.info(
          `Agent step ${step + 1}: ${response.toolCalls.length} tool_call(s)`
        )

        for (const call of response.toolCalls) {
          const result = await this.executeTool(call)

          this.messages.push({
            role: "tool",
            content: result,
            toolCallId: call.id
          })
        }

        continue
      }

      const content = response.content ?? ""

      this.messages.push({
        role: "assistant",
        content
      })

      return content
    }

    return "已达到最大工具调用次数，停止执行。"
  }

  private async executeTool(call: ToolCall): Promise<string> {

    const tool = this.tools.get(call.name)

    logger.info(`Agent dispatch ${call.name}`, {
      id: call.id,
      arguments: preview(call.arguments)
    })

    if (!tool) {
      logger.warn(`未知工具: ${call.name}`, { id: call.id })
      return `未知工具: ${call.name}`
    }

    try {
      return await tool.execute(call.arguments)
    } catch (error) {
      logger.error(`工具执行异常: ${call.name}`, error)
      return `工具执行失败: ${error}`
    }
  }
}
