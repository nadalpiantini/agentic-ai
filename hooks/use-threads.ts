"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Thread {
  id: string;
  user_id: string;
  title: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

async function fetchThreads(userId: string): Promise<Thread[]> {
  const res = await fetch("/api/threads", {
    headers: { "x-user-id": userId },
  });
  if (!res.ok) throw new Error("Failed to fetch threads");
  const data = await res.json();
  return data.threads;
}

async function createThread(userId: string, title?: string): Promise<Thread> {
  const res = await fetch("/api/threads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create thread");
  const data = await res.json();
  return data.thread;
}

async function deleteThread(userId: string, threadId: string): Promise<void> {
  const res = await fetch(`/api/threads/${threadId}`, {
    method: "DELETE",
    headers: { "x-user-id": userId },
  });
  if (!res.ok) throw new Error("Failed to delete thread");
}

export function useThreads(userId: string | undefined) {
  const queryClient = useQueryClient();

  const threadsQuery = useQuery({
    queryKey: ["threads", userId],
    queryFn: () => fetchThreads(userId!),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (title?: string) => createThread(userId!, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads", userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (threadId: string) => deleteThread(userId!, threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads", userId] });
    },
  });

  return {
    threads: threadsQuery.data ?? [],
    isLoading: threadsQuery.isLoading,
    error: threadsQuery.error,
    createThread: createMutation.mutateAsync,
    deleteThread: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
