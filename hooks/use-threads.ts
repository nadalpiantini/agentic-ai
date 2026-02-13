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

async function fetchThreads(): Promise<Thread[]> {
  const res = await fetch("/api/threads");
  if (!res.ok) throw new Error("Failed to fetch threads");
  const data = await res.json();
  return data.threads;
}

async function createThread(title?: string): Promise<Thread> {
  const res = await fetch("/api/threads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create thread");
  const data = await res.json();
  return data.thread;
}

async function deleteThread(threadId: string): Promise<void> {
  const res = await fetch(`/api/threads/${threadId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete thread");
}

export function useThreads() {
  const queryClient = useQueryClient();

  const threadsQuery = useQuery({
    queryKey: ["threads"],
    queryFn: fetchThreads,
  });

  const createMutation = useMutation({
    mutationFn: createThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
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
