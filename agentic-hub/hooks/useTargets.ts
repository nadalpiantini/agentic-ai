'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { IntelTarget, TargetStats, CreateTargetPayload } from '@/types/intel'

interface UseTargetsOptions {
  type?: 'domain' | 'repo' | 'api'
  activeOnly?: boolean
  pollInterval?: number
}

interface UseTargetsReturn {
  targets: IntelTarget[]
  stats: TargetStats | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  addTarget: (data: CreateTargetPayload) => Promise<void>
  toggleTarget: (id: string, active: boolean) => Promise<void>
  deleteTarget: (id: string) => Promise<void>
}

function computeStats(targets: IntelTarget[]): TargetStats {
  const total = targets.length
  const active = targets.filter((t) => t.active).length
  const byType = { domain: 0, repo: 0, api: 0 }
  let scanSum = 0

  for (const t of targets) {
    if (t.target_type in byType) {
      byType[t.target_type]++
    }
    scanSum += t.scan_count
  }

  return {
    total,
    active,
    byType,
    avgScanCount: total > 0 ? scanSum / total : 0,
  }
}

export function useTargets(options?: UseTargetsOptions): UseTargetsReturn {
  const [targets, setTargets] = useState<IntelTarget[]>([])
  const [stats, setStats] = useState<TargetStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const buildParams = useCallback(() => {
    const params = new URLSearchParams()
    if (options?.type) params.set('type', options.type)
    if (options?.activeOnly) params.set('active', 'true')
    return params.toString()
  }, [options?.type, options?.activeOnly])

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const queryString = buildParams()
      const url = `/api/intel/targets${queryString ? `?${queryString}` : ''}`

      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Failed to fetch targets: ${res.status}`)
      }

      const data: IntelTarget[] = await res.json()
      setTargets(data)
      setStats(computeStats(data))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch targets'
      setError(message)
      console.error('[useTargets]', message)
    } finally {
      setIsLoading(false)
    }
  }, [buildParams])

  useEffect(() => {
    setIsLoading(true)
    fetchData()

    const interval = options?.pollInterval ?? 60000
    intervalRef.current = setInterval(fetchData, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchData, options?.pollInterval])

  const refetch = useCallback(async () => {
    setIsLoading(true)
    await fetchData()
  }, [fetchData])

  const addTarget = useCallback(async (data: CreateTargetPayload) => {
    const res = await fetch('/api/intel/targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Failed to add target: ${res.status}`)
    }

    await refetch()
  }, [refetch])

  const toggleTarget = useCallback(async (id: string, active: boolean) => {
    const res = await fetch(`/api/intel/targets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })

    if (!res.ok) {
      throw new Error(`Failed to toggle target: ${res.status}`)
    }

    await refetch()
  }, [refetch])

  const deleteTarget = useCallback(async (id: string) => {
    const res = await fetch(`/api/intel/targets/${id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      throw new Error(`Failed to delete target: ${res.status}`)
    }

    await refetch()
  }, [refetch])

  return { targets, stats, isLoading, error, refetch, addTarget, toggleTarget, deleteTarget }
}
