import { NextRequest, NextResponse } from "next/server";
import { Logger } from "./logging";
import { RateLimiter } from "./rate-limiter";

interface TrackingConfig {
  enableRateLimit?: boolean;
  enableMetrics?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

const DEFAULT_CONFIG: TrackingConfig = {
  enableRateLimit: true,
  enableMetrics: true,
  rateLimit: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
};

export async function withRequestTracking(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: TrackingConfig = {}
): Promise<NextResponse> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const requestId = Logger.generateRequestId();
  const startTime = Date.now();

  try {
    // Get user ID from header
    const userIdString = req.headers.get("x-user-id");
    const userId = userIdString
      ? Buffer.from(userIdString).toString("utf-8").substring(0, 100)
      : "anonymous";

    // Rate limiting check
    if (finalConfig.enableRateLimit && userId !== "anonymous") {
      const rateLimitCheck = await RateLimiter.checkLimit(userId, finalConfig.rateLimit);

      if (!rateLimitCheck.allowed) {
        return new NextResponse(
          JSON.stringify({
            error: "Rate limit exceeded",
            retryAfter: rateLimitCheck.retryAfter,
            requestId,
          }),
          {
            status: 429,
            headers: {
              "Retry-After": String(rateLimitCheck.retryAfter),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(rateLimitCheck.resetAt),
            },
          }
        );
      }
    }

    // Execute handler
    const response = await handler(req);
    const duration = Date.now() - startTime;

    // Add request tracking headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set("X-Request-ID", requestId);
    newHeaders.set("X-Response-Time", `${duration}ms`);

    // Log request metrics
    if (finalConfig.enableMetrics) {
      const path = req.nextUrl.pathname;
      const method = req.method;

      await Logger.logRequest(
        {
          requestId,
          method,
          path,
          userId: userIdString ? userId : undefined,
          statusCode: response.status,
          duration,
          timestamp: Date.now(),
        }
      );

      // Log slow requests
      if (duration > 1000) {
        await Logger.logMetric(
          {
            requestId,
            method,
            path,
            userId: userIdString ? userId : undefined,
            timestamp: Date.now(),
          },
          "slow_request",
          duration,
          "ms"
        );
      }
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const userId = req.headers.get("x-user-id");

    // Log error
    await Logger.logError(
      {
        requestId,
        method: req.method,
        path: req.nextUrl.pathname,
        userId: userId || undefined,
        statusCode: 500,
        duration,
        timestamp: Date.now(),
      },
      error instanceof Error ? error : new Error(String(error)),
      "high"
    );

    return new NextResponse(
      JSON.stringify({
        error: "Internal server error",
        requestId,
      }),
      {
        status: 500,
        headers: {
          "X-Request-ID": requestId,
        },
      }
    );
  }
}
