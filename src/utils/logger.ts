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
  }
}
