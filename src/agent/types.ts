export type MessageRole =
  | "system"
  | "user"
  | "assistant"
  | "tool"

export interface Message {
  role: MessageRole
  content: string
  toolCallId?: string
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}
