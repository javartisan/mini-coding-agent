export interface ToolParameters {
  type: "object"
  properties: Record<string, {
    type: string
    description?: string
  }>
  required?: string[]
}

export interface Tool<TInput = unknown> {
  name: string
  description: string
  parameters: ToolParameters

  execute(input: TInput): Promise<string>
}
