/**
 * Custom Error Classes for Agentic Hub
 *
 * Extends Error with additional properties for error handling
 */

export class AgentError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AgentError'
  }
}

export class ModelError extends Error {
  constructor(message: string, public model?: string) {
    super(message)
    this.name = 'ModelError'
  }
}

export class ToolError extends Error {
  constructor(message: string, public tool?: string) {
    super(message)
    this.name = 'ToolError'
  }
}

export class CheckpointerError extends Error {
  constructor(message: string, public checkpointId?: string) {
    super(message)
    this.name = 'CheckpointerError'
  }
}
