type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  meta?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
  };
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta && { meta }),
  };

  const output = formatLog(entry);

  if (level === "error" || level === "warn") {
    console.error(output);
  } else {
    console.error(output); // Use stderr to avoid interfering with MCP protocol on stdout
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, error?: Error, meta?: Record<string, unknown>) => {
    const entry: LogEntry = {
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
        },
      }),
      ...(meta && { meta }),
    };
    console.error(formatLog(entry));
  },
};
