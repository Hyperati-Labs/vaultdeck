type LogLevel = "debug" | "info" | "warn" | "error";

function write(level: LogLevel, message: string, meta?: unknown) {
  if (!__DEV__) {
    return;
  }
  if (meta !== undefined) {
    console[level](`[VaultDeck] ${message}`, meta);
  } else {
    console[level](`[VaultDeck] ${message}`);
  }
}

export const logger = {
  debug: (message: string, meta?: unknown) => write("debug", message, meta),
  info: (message: string, meta?: unknown) => write("info", message, meta),
  warn: (message: string, meta?: unknown) => write("warn", message, meta),
  error: (message: string, meta?: unknown) => write("error", message, meta),
};
