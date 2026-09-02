export type MessageRole =
  | "user"
  | "assistant"
  | "tool"

export interface Message {
  role: MessageRole
  content: string
}

export interface ToolCall {
  name: string
  arguments: Record<string, unknown>
}
