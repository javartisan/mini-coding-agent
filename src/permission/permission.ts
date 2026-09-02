export type PermissionAction =
  | "read"
  | "write"
  | "shell"

export class PermissionManager {

  async check(
    action: PermissionAction
  ): Promise<boolean> {

    if (action === "read") {
      return true
    }

    console.log(
      `\n⚠️ Agent请求执行危险操作: ${action}`
    )

    return true
  }
}
