import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Pool } from "pg";
import {
  AutonomousScheduler,
  ScheduleOptions,
  ScheduleTask,
  getGlobalScheduler,
  resetGlobalScheduler,
} from "@/lib/agent/scheduler";

// Mock the Pool
vi.mock("pg", () => {
  class MockPool {
    query = vi.fn();
    end = vi.fn();
  }
  return { Pool: MockPool };
});

// Mock env to avoid validation errors
vi.mock("@/lib/utils/env", () => ({
  env: {
    DATABASE_URL: "postgresql://test",
    ANTHROPIC_API_KEY: "test-key",
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  },
}));

describe("AutonomousScheduler", () => {
  let scheduler: AutonomousScheduler;
  let mockPool: any;

  beforeEach(() => {
    // Reset the global scheduler before each test
    vi.clearAllMocks();
    mockPool = new Pool();

    // Create a new scheduler instance with mocked pool
    scheduler = new AutonomousScheduler("postgresql://test");
    (scheduler as any).pool = mockPool;
  });

  afterEach(async () => {
    await resetGlobalScheduler();
  });

  describe("initialize", () => {
    it("should create the scheduled_tasks table and indexes", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await scheduler.initialize();

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS scheduled_tasks")
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_scheduled_for")
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status")
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_thread_id")
      );
    });
  });

  describe("schedule", () => {
    it("should schedule a new task and return its ID", async () => {
      const taskId = "test-task-id";
      mockPool.query.mockResolvedValue({
        rows: [{ id: taskId }],
      });

      const options: ScheduleOptions = {
        scheduledFor: new Date("2025-02-13T10:00:00Z"),
        taskType: "check_in",
        payload: { message: "Test task" },
        maxRetries: 5,
      };

      const result = await scheduler.schedule("agent-123", "thread-456", options);

      expect(result).toBe(taskId);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO scheduled_tasks"),
        expect.arrayContaining([
          "agent-123",
          "thread-456",
          "check_in",
          expect.any(Date),
          JSON.stringify({ message: "Test task" }),
          5,
        ])
      );
    });

    it("should accept ISO string for scheduledFor", async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ id: "task-id" }],
      });

      const options: ScheduleOptions = {
        scheduledFor: "2025-02-13T10:00:00Z",
        taskType: "reminder",
      };

      await scheduler.schedule("agent-123", "thread-456", options);

      const callArgs = mockPool.query.mock.calls[0];
      expect(callArgs[1][3]).toBeInstanceOf(Date);
    });

    it("should use default maxRetries of 3 when not specified", async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ id: "task-id" }],
      });

      const options: ScheduleOptions = {
        scheduledFor: new Date(),
        taskType: "autonomous",
      };

      await scheduler.schedule("agent-123", "thread-456", options);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([expect.anything(), expect.anything(), expect.anything(), expect.anything(), expect.anything(), 3])
      );
    });
  });

  describe("getDueTasks", () => {
    it("should retrieve pending tasks that are due", async () => {
      const dueTasks: ScheduleTask[] = [
        {
          id: "task-1",
          agentId: "agent-1",
          threadId: "thread-1",
          taskType: "check_in",
          scheduledFor: new Date(),
          status: "pending",
          payload: {},
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPool.query.mockResolvedValue({
        rows: dueTasks,
      });

      const result = await scheduler.getDueTasks(10);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE status = 'pending'"),
        [10]
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("task-1");
    });

    it("should use default limit of 10 when not specified", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await scheduler.getDueTasks();

      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [10]);
    });
  });

  describe("updateStatus", () => {
    it("should update task status", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await scheduler.updateStatus("task-123", "completed");

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE scheduled_tasks"),
        ["completed", null, "task-123"]
      );
    });

    it("should update status with error message", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await scheduler.updateStatus("task-123", "failed", "Task timed out");

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE scheduled_tasks"),
        ["failed", "Task timed out", "task-123"]
      );
    });
  });

  describe("incrementRetry", () => {
    it("should increment retry count and keep status pending if under max", async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ retry_count: 1, max_retries: 3, status: "pending" }],
      });

      const canRetry = await scheduler.incrementRetry("task-123");

      expect(canRetry).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE scheduled_tasks"),
        ["task-123"]
      );
    });

    it("should mark task as failed when max retries exceeded", async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ retry_count: 3, max_retries: 3, status: "failed" }],
      });

      const canRetry = await scheduler.incrementRetry("task-123");

      expect(canRetry).toBe(false);
    });
  });

  describe("getTasksForThread", () => {
    it("should retrieve all tasks for a specific thread", async () => {
      const dbRow = {
        id: "task-1",
        agent_id: "agent-1",
        thread_id: "thread-456",
        task_type: "check_in",
        scheduled_for: new Date(),
        status: "pending",
        payload: {},
        retry_count: 0,
        max_retries: 3,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValue({ rows: [dbRow] });

      const result = await scheduler.getTasksForThread("thread-456");

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE thread_id = $1"),
        ["thread-456"]
      );
      expect(result).toHaveLength(1);
      expect(result[0].threadId).toBe("thread-456");
    });
  });

  describe("cancel", () => {
    it("should cancel a pending task", async () => {
      mockPool.query.mockResolvedValue({ rows: [{ id: "task-123" }] });

      const result = await scheduler.cancel("task-123");

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'cancelled'"),
        ["task-123"]
      );
    });

    it("should return false when task not found or not pending", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await scheduler.cancel("task-123");

      expect(result).toBe(false);
    });
  });

  describe("start and stop", () => {
    it("should start processing loop", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await scheduler.start(100);

      // Verify initialize was called
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS")
      );

      await scheduler.stop();
    });

    it("should not start if already running", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await scheduler.start(100);
      const startSpy = vi.spyOn(scheduler as any, "initialize");

      await scheduler.start(100);

      expect(startSpy).not.toHaveBeenCalled();
      await scheduler.stop();
    });

    it("should stop processing loop", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await scheduler.start(100);
      await scheduler.stop();

      // After stopping, interval should be cleared
      expect((scheduler as any).isRunning).toBe(false);
    });
  });

  describe("cleanup", () => {
    it("should delete old completed tasks", async () => {
      mockPool.query.mockResolvedValue({ rowCount: 5 });

      const result = await scheduler.cleanup(7);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM scheduled_tasks"),
        [7]
      );
      expect(result).toBe(5);
    });

    it("should use default 7 days when not specified", async () => {
      mockPool.query.mockResolvedValue({ rowCount: 0 });

      await scheduler.cleanup();

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INTERVAL '1 day' * $1"),
        [7]
      );
    });
  });

  describe("getStats", () => {
    it("should return scheduler statistics", async () => {
      const stats = {
        pending: 10,
        running: 2,
        completed: 50,
        failed: 3,
        cancelled: 5,
      };

      mockPool.query.mockResolvedValue({ rows: [stats] });

      const result = await scheduler.getStats();

      expect(result).toEqual(stats);
      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe("close", () => {
    it("should stop processing and close pool connection", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });
      mockPool.end.mockResolvedValue(undefined);

      await scheduler.start(100);
      await scheduler.close();

      expect((scheduler as any).isRunning).toBe(false);
      expect(mockPool.end).toHaveBeenCalled();
    });
  });
});

describe("Global Scheduler Singleton", () => {
  it("should return the same instance on multiple calls", async () => {
    const scheduler1 = getGlobalScheduler();
    const scheduler2 = getGlobalScheduler();

    expect(scheduler1).toBe(scheduler2);
  });

  it("should reset global scheduler", async () => {
    const scheduler1 = getGlobalScheduler();

    await resetGlobalScheduler();

    const scheduler2 = getGlobalScheduler();

    expect(scheduler1).not.toBe(scheduler2);
  });
});
