import type { LLM } from "../llm/llm.js"
import type { ToolRegistry } from "../tools/registry.js"
import type { Message } from "./types.js"

export class Agent {

  private messages: Message[] = []

  constructor(
    private llm: LLM,
    private tools: ToolRegistry
  ) {}

  async run(userInput: string): Promise<string> {

    this.messages.push({
      role: "user",
      content: userInput
    })

    const response =
      await this.llm.chat(this.messages)

    const content =
      response.content ?? ""

    this.messages.push({
      role: "assistant",
      content
    })

    return content
  }
}
