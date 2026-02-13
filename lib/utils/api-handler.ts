import { NextRequest, NextResponse } from "next/server";
import { Logger, sanitizeErrorMessage } from "./logging";
import { AgentError, ModelError, ToolError, CheckpointerError } from "./errors";

interface APIHandlerOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  requireAuth?: boolean;
  requireBody?: boolean;
}

interface APIHandlerContext {
  req: NextRequest;
  requestId: string;
  userId?: string;
  startTime: number;
}

type APIHandlerFn = (
  context: APIHandlerContext
) => Promise<{ data?: unknown; statusCode?: number }>;

const ERROR_SEVERITY_MAP: Record<string, "low" | "medium" | "high" | "critical"> = {
  ValidationError: "low",
  NotFoundError: "low",
  UnauthorizedError: "medium",
  ForbiddenError: "medium",
  DatabaseError: "high",
  ServiceError: "high",
  TimeoutError: "high",
  InternalError: "critical",
};

function getErrorStatusCode(error: unknown): number {
  if (error instanceof Error) {
    if (error.message.includes("Unauthorized")) return 401;
    if (error.message.includes("Forbidden")) return 403;
    if (error.message.includes("Not found")) return 404;
    if (error.message.includes("Validation")) return 400;
    if (error.message.includes("Timeout")) return 504;
  }
  return 500;
}

function getErrorSeverity(error: unknown, statusCode: number): "low" | "medium" | "high" | "critical" {
  if (error instanceof AgentError) return "medium";
  if (error instanceof ModelError) return "high";
  if (error instanceof ToolError) return "high";
  if (error instanceof CheckpointerError) return "high";

  if (statusCode >= 500) return "critical";
  if (statusCode >= 400) return "low";
  return "medium";
}

export function createAPIHandler(
  options: APIHandlerOptions,
  handler: APIHandlerFn
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    const requestId = Logger.generateRequestId();
    const startTime = Date.now();

    try {
      // Extract user info from header
      const userIdString = req.headers.get("x-user-id");
      const userId = userIdString
        ? Buffer.from(userIdString).toString("utf-8").substring(0, 100)
        : undefined;

      // Log incoming request
      let bodyData: Record<string, unknown> | undefined;
      if (options.requireBody || req.method !== "GET") {
        try {
          const bodyText = await req.text();
          if (bodyText) {
            bodyData = JSON.parse(bodyText);
          }
        } catch (e) {
          // Body parsing failed, continue without it
        }
      }

      await Logger.logRequest(
        {
          requestId,
          method: options.method,
          path: options.path,
          userId,
          timestamp: startTime,
        },
        bodyData
      );

      // Create a new request with the body text (since we already consumed it)
      let newReq = req;
      if (bodyData) {
        newReq = new NextRequest(req, {
          body: JSON.stringify(bodyData),
        });
      }

      // Execute handler
      const result = await handler({
        req: newReq,
        requestId,
        userId,
        startTime,
      });

      const duration = Date.now() - startTime;
      const statusCode = result.statusCode || 200;

      // Log successful response
      await Logger.logRequest(
        {
          requestId,
          method: options.method,
          path: options.path,
          userId,
          statusCode,
          duration,
          timestamp: Date.now(),
        },
        result.data as Record<string, unknown> | undefined
      );

      // Log performance metric
      if (duration > 1000) {
        await Logger.logMetric(
          {
            requestId,
            method: options.method,
            path: options.path,
            userId,
            timestamp: Date.now(),
          },
          "response_time",
          duration,
          "ms"
        );
      }

      return NextResponse.json(result.data, { status: statusCode });
    } catch (error) {
      const duration = Date.now() - startTime;
      const statusCode = getErrorStatusCode(error);
      const severity = getErrorSeverity(error, statusCode);
      const userId = req.headers.get("x-user-id");

      const errorMessage = sanitizeErrorMessage(error);

      // Log error
      await Logger.logError(
        {
          requestId,
          method: options.method,
          path: options.path,
          userId: userId || undefined,
          statusCode,
          duration,
          errorCode: error instanceof Error ? error.constructor.name : undefined,
          timestamp: Date.now(),
        },
        error instanceof Error ? error : new Error(String(error)),
        severity
      );

      // Log error metric
      if (statusCode >= 500) {
        await Logger.logMetric(
          {
            requestId,
            method: options.method,
            path: options.path,
            userId: userId || undefined,
            timestamp: Date.now(),
          },
          "error_count",
          1,
          "count"
        );
      }

      return NextResponse.json(
        {
          error: errorMessage,
          requestId,
          ...(process.env.NODE_ENV === "development" && {
            details: error instanceof Error ? error.message : String(error),
          }),
        },
        { status: statusCode }
      );
    }
  };
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: { requestId: string; userId?: string; method: string; path: string }
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const severity = getErrorSeverity(error, 500);
    await Logger.logError(
      {
        requestId: context.requestId,
        method: context.method,
        path: context.path,
        userId: context.userId,
        timestamp: Date.now(),
      },
      error instanceof Error ? error : new Error(String(error)),
      severity
    );
    throw error;
  }
}
