import type { PermissionAction } from "../permission/permission.js"

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
  /** 执行前需要校验的权限级别 */
  permission: PermissionAction

  execute(input: TInput): Promise<string>
}
