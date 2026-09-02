type LogLevel = "info" | "warn" | "error" | "debug"

function timestamp(): string {
  return new Date().toISOString()
}

function write(level: LogLevel, message: string, extra?: unknown): void {
  const prefix = `[${timestamp()}] [${level.toUpperCase()}]`

  if (extra === undefined) {
    console.log(`${prefix} ${message}`)
    return
  }

  console.log(`${prefix} ${message}`, extra)
}

export function preview(value: unknown, max = 240): unknown {
  if (typeof value === "string") {
    if (value.length <= max) {
      return value
    }

    return `${value.slice(0, max)}... [${value.length} chars]`
  }

  if (Array.isArray(value)) {
    return value.map(item => preview(item, max))
  }

  if (value && typeof value === "object") {
    const copy: Record<string, unknown> = {}

    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      copy[key] = preview(item, max)
    }

    return copy
  }

  return value
}

export const logger = {
  info(message: string, extra?: unknown): void {
    write("info", message, extra)
  },

  warn(message: string, extra?: unknown): void {
    write("warn", message, extra)
  },

  error(message: string, extra?: unknown): void {
    write("error", message, extra)
  },

  debug(message: string, extra?: unknown): void {
    if (process.env.DEBUG) {
      write("debug", message, extra)
    }
  },

  toolStart(name: string, input: unknown): number {
    write("info", `[tool:${name}] start`, preview(input))
    return Date.now()
  },

  toolOk(name: string, startedAt: number, result: string): void {
    const ms = Date.now() - startedAt
    write("info", `[tool:${name}] ok ${ms}ms ${result.length} chars`, preview(result))
  },

  toolFail(name: string, startedAt: number, error: unknown): void {
    const ms = Date.now() - startedAt
    write("error", `[tool:${name}] fail ${ms}ms`, preview(String(error)))
  }
}
