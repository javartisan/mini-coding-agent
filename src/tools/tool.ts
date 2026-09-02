export interface Tool<TInput = unknown> {
  name: string
  description: string

  execute(input: TInput): Promise<string>
}
