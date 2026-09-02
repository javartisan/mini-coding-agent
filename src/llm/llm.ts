import OpenAI from "openai"
import type { Message, ToolCall } from "../agent/types.js"
import type { Tool } from "../tools/tool.js"

export interface LLMResponse {
  content?: string
  toolCalls?: ToolCall[]
}

export class LLM {

  private client: OpenAI

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    const baseURL = process.env.OPENAI_BASE_URL || undefined

    if (!apiKey) {
      throw new Error("缺少 OPENAI_API_KEY，请在项目根目录 .env 中配置")
    }

    this.client = new OpenAI({
      apiKey,
      baseURL
    })
  }

  async chat(
    messages: Message[],
    tools: Tool[] = []
  ): Promise<LLMResponse> {

    const response =
      await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: this.toOpenAIMessages(messages),
        ...(tools.length > 0
          ? {
              tools: tools.map(tool => ({
                type: "function" as const,
                function: {
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.parameters as unknown as OpenAI.FunctionParameters
                }
              })),
              tool_choice: "auto" as const
            }
          : {})
      })

    const message = response.choices[0]?.message

    return {
      content: message?.content ?? "",
      toolCalls: this.parseToolCalls(message)
    }
  }

  private toOpenAIMessages(
    messages: Message[]
  ): OpenAI.Chat.ChatCompletionMessageParam[] {

    return messages.map(message => {

      if (message.role === "tool") {
        return {
          role: "tool",
          tool_call_id: message.toolCallId ?? "",
          content: message.content
        }
      }

      if (message.role === "assistant" && message.toolCalls?.length) {
        return {
          role: "assistant",
          content: message.content || null,
          tool_calls: message.toolCalls.map(call => ({
            id: call.id,
            type: "function" as const,
            function: {
              name: call.name,
              arguments: JSON.stringify(call.arguments)
            }
          }))
        }
      }

      return {
        role: message.role,
        content: message.content
      }
    })
  }

  private parseToolCalls(
    message: OpenAI.Chat.ChatCompletionMessage | undefined
  ): ToolCall[] | undefined {

    const raw = message?.tool_calls

    if (!raw?.length) {
      return undefined
    }

    return raw.flatMap((call, index) => {

      if (call.type !== "function") {
        return []
      }

      let args: Record<string, unknown> = {}

      try {
        args = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>
      } catch {
        args = {}
      }

      return [{
        id: call.id || `call_${index}`,
        name: call.function.name,
        arguments: args
      }]
    })
  }
}
