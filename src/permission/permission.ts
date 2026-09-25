export type PermissionAction =
  | "read"
  | "write"
  | "shell"

export type AskFn = (question: string) => Promise<string>

export class PermissionManager {

  constructor(private ask?: AskFn) {}

  async check(
    action: PermissionAction,
    detail?: string
  ): Promise<boolean> {

    if (action === "read") {
      return true
    }

    const hint = detail ? `\n详情: ${detail}` : ""
    const question =
      `\n⚠️ Agent 请求执行危险操作: ${action}${hint}\n是否允许？[y/N] `

    if (!this.ask) {
      console.log(question)
      console.log("未配置交互确认，已拒绝该操作。")
      return false
    }

    const answer = await this.ask(question)
    const normalized = answer.trim().toLowerCase()

    return normalized === "y" || normalized === "yes"
  }
}
