/**
 * Error Reporter for GRC Integra
 * 
 * This module provides a robust error reporting mechanism for the frontend.
 * It intercepts console errors and warnings, and captures unhandled exceptions.
 * It follows a singleton pattern and ensures that errors are reported only once.
 */

interface ErrorPayload {
  message: string;
  stack?: string;
  url: string;
  timestamp: string;
  level: "error" | "warning" | "info";
  category: "client" | "network" | "render" | "unknown";
  metadata?: Record<string, unknown>;
}

interface ImmediatePayload {
  message: string;
  stack?: string;
  url: string;
  timestamp: string;
  level: "error" | "warning";
  category: "unknown";
}

type ConsoleNative = (...args: unknown[]) => void;
interface WrappedConsoleFn extends ConsoleNative {
  __errorReporterWrapped?: boolean;
}

class ErrorReporter {
  private isEnabled = true;
  private queue: ErrorPayload[] = [];
  private flushInterval = 5000; // 5 seconds
  private maxQueueSize = 50;
  private timer: number | null = null;
  private reportedErrors = new Set<string>();

  constructor() {
    this.setupListeners();
    this.startFlushing();
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Reports an error. Supports both Error objects/strings and legacy payload objects.
   */
  public report(
    error: Error | string | any, 
    level: ErrorPayload["level"] = "error", 
    metadata?: Record<string, unknown>
  ): void {
    if (!this.isEnabled) return;

    let message: string;
    let stack: string | undefined;
    let finalMetadata = metadata || {};

    if (error && typeof error === "object" && !(error instanceof Error)) {
      // Handle legacy payload object
      message = error.message || "Unknown error object";
      stack = error.stack;
      finalMetadata = { ...error, ...finalMetadata };
      level = error.level || level;
    } else {
      message = typeof error === "string" ? error : error.message;
      stack = typeof error === "string" ? undefined : error.stack;
    }

    const errorKey = `${message}-${stack || ""}`;

    if (this.reportedErrors.has(errorKey)) return;
    this.reportedErrors.add(errorKey);

    const payload: ErrorPayload = {
      message,
      stack,
      url: typeof window !== "undefined" ? window.location.href : "unknown",
      timestamp: new Date().toISOString(),
      level,
      category: "client",
      metadata: finalMetadata,
    };

    this.queue.push(payload);
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  private setupListeners(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("error", (event) => {
      this.report(event.error || event.message, "error", {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.report(event.reason instanceof Error ? event.reason : String(event.reason), "error", {
        type: "unhandledrejection",
      });
    });
  }

  private startFlushing(): void {
    if (typeof window === "undefined") return;
    this.timer = window.setInterval(() => this.flush(), this.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0 || !this.isEnabled) return;

    const currentQueue = [...this.queue];
    this.queue = [];

    try {
      await fetch("/api/client-errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentQueue),
      });
    } catch (e) {
      // Restore queue in case of network failure, avoiding console.error call to prevent potential circular log loops
      this.queue = [...currentQueue, ...this.queue].slice(0, this.maxQueueSize);
    }
  }

  public dispose(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

// Global console args formatting
function formatConsoleArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (typeof arg === "string") return arg;
      if (arg instanceof Error) return arg.message;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(" ");
}

// Create singleton instance first to ensure it is initialized before any intercepted logs are handled
export const errorReporter = new ErrorReporter();

// Intercept console methods IMMEDIATELY before React can cache them
if (typeof window !== "undefined") {
  const originalWarn = console.warn;
  const originalError = console.error;

  // Create shared interceptor logic following DRY principles
  const createImmediateInterceptor = (
    original: ConsoleNative,
    prefix: string,
    defaultLevel: "warning" | "error"
  ) =>
    function (...args: unknown[]) {
      original.apply(console, args);

      try {
        const message = formatConsoleArgs(args);

        // Skip internal vite/hmr noise and error reporter internal logs to prevent loops
        if (
          message.includes("[vite]") ||
          message.includes("HMR") ||
          message.includes("[ErrorReporter]")
        ) {
          return;
        }

        const stack = new Error().stack;

        // Route directly to the batching queue
        errorReporter.report(`${prefix} ${message}`, defaultLevel, {
          stack,
          category: "client",
        });
      } catch {
        // Safe fallback
      }
    };

  console.warn = createImmediateInterceptor(
    originalWarn,
    "[WARNING]",
    "warning"
  ) as WrappedConsoleFn;
  (console.warn as WrappedConsoleFn).__errorReporterWrapped = true;
  console.error = createImmediateInterceptor(
    originalError,
    "[CONSOLE ERROR]",
    "error"
  ) as WrappedConsoleFn;
  (console.error as WrappedConsoleFn).__errorReporterWrapped = true;
}

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    errorReporter.dispose();
  });
}

