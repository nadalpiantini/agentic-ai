'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { IntelEvent, IntelStats } from '@/types/intel'

interface UseIntelFeedOptions {
  status?: string
  squadron_type?: string
  min_ofs?: number
  limit?: number
  pollInterval?: number
}

interface UseIntelFeedReturn {
  events: IntelEvent[]
  stats: IntelStats | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const DEFAULT_STATS: IntelStats = {
  total: 0,
  active: 0,
  by_type: { dropalert: 0, shadowwatch: 0, assethunter: 0, nrs: 0 },
  avg_ofs: 0,
  last_scan_at: null,
}

export function useIntelFeed(options?: UseIntelFeedOptions): UseIntelFeedReturn {
  const [events, setEvents] = useState<IntelEvent[]>([])
  const [stats, setStats] = useState<IntelStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const buildParams = useCallback(() => {
    const params = new URLSearchParams()
    if (options?.status) params.set('status', options.status)
    if (options?.squadron_type) params.set('squadron_type', options.squadron_type)
    if (options?.min_ofs !== undefined) params.set('min_ofs', String(options.min_ofs))
    if (options?.limit !== undefined) params.set('limit', String(options.limit))
    return params.toString()
  }, [options?.status, options?.squadron_type, options?.min_ofs, options?.limit])

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const queryString = buildParams()
      const eventsUrl = `/api/intel${queryString ? `?${queryString}` : ''}`

      const [eventsRes, statsRes] = await Promise.all([
        fetch(eventsUrl),
        fetch('/api/intel/stats'),
      ])

      if (!eventsRes.ok) {
        throw new Error(`Failed to fetch intel events: ${eventsRes.status}`)
      }

      const eventsData = await eventsRes.json()
      setEvents(Array.isArray(eventsData) ? eventsData : eventsData.events ?? [])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData ?? DEFAULT_STATS)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch intel feed'
      setError(message)
      console.error('[useIntelFeed]', message)
    } finally {
      setIsLoading(false)
    }
  }, [buildParams])

  // Initial fetch and polling
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

  return { events, stats, isLoading, error, refetch }
}
