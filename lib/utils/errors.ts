export class AgentError extends Error {
  readonly code: string;

  constructor(message: string, code = "AGENT_ERROR") {
    super(message);
    this.name = "AgentError";
    this.code = code;
  }
}

export class ModelError extends Error {
  readonly code: string;

  constructor(message: string, code = "MODEL_ERROR") {
    super(message);
    this.name = "ModelError";
    this.code = code;
  }
}

export class ToolError extends Error {
  readonly code: string;

  constructor(message: string, code = "TOOL_ERROR") {
    super(message);
    this.name = "ToolError";
    this.code = code;
  }
}

export class CheckpointerError extends Error {
  readonly code: string;

  constructor(message: string, code = "CHECKPOINTER_ERROR") {
    super(message);
    this.name = "CheckpointerError";
    this.code = code;
  }
}

export function formatError(error: unknown): string {
  if (error instanceof AgentError) {
    return `[${error.code}] ${error.message}`;
  }

  if (error instanceof ModelError) {
    return `[${error.code}] ${error.message}`;
  }

  if (error instanceof ToolError) {
    return `[${error.code}] ${error.message}`;
  }

  if (error instanceof CheckpointerError) {
    return `[${error.code}] ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred";
}
