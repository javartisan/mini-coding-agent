import OpenAI from "openai"
import type { Message, ToolCall } from "../agent/types.js"

export interface LLMResponse {
  content?: string
  toolCalls?: ToolCall[]
}

export class LLM {

  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined
    })
  }

  async chat(
    messages: Message[]
  ): Promise<LLMResponse> {

    const response =
      await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",

        messages: messages.map(message => ({
          role: message.role === "tool"
            ? "user"
            : message.role,
          content: message.content
        }))
      })

    return {
      content: response.choices[0]?.message.content ?? ""
    }
  }
}
