/**
 * usePerformance Hook
 *
 * React hook for accessing performance monitoring and optimization features
 */

'use client'

import { useEffect, useState } from 'react'
import {
  getBatteryMetrics,
  getCurrentPowerMode,
  type BatteryMetrics,
  type PowerMode,
} from '@/lib/performance/batteryManager'
import {
  getLatestMemorySnapshot,
  type MemorySnapshot,
} from '@/lib/performance/memoryManager'
import {
  getTouchMetrics,
  type TouchMetrics,
} from '@/lib/performance/touchPerformance'
import {
  getNetworkState,
  isOffline,
  type NetworkState,
} from '@/lib/performance/networkOptimizer'

export interface PerformanceMetrics {
  battery: BatteryMetrics | null
  powerMode: PowerMode
  memory: MemorySnapshot | null
  touch: TouchMetrics
  network: NetworkState
  isOffline: boolean
}

/**
 * Hook to access performance metrics
 */
export function usePerformance(): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    battery: null,
    powerMode: 'balanced',
    memory: null,
    touch: {
      averageResponseTime: 0,
      events: [],
      slowEvents: [],
    },
    network: 'unknown',
    isOffline: false,
  })

  useEffect(() => {
    // Update metrics periodically
    const updateMetrics = () => {
      setMetrics({
        battery: getBatteryMetrics(),
        powerMode: getCurrentPowerMode(),
        memory: getLatestMemorySnapshot(),
        touch: getTouchMetrics(),
        network: getNetworkState(),
        isOffline: isOffline(),
      })
    }

    // Initial update
    updateMetrics()

    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000)

    return () => clearInterval(interval)
  }, [])

  return metrics
}

/**
 * Hook to track battery level changes
 */
export function useBatteryLevel(): number | null {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)

  useEffect(() => {
    const updateBatteryLevel = () => {
      const metrics = getBatteryMetrics()
      if (metrics) {
        setBatteryLevel(metrics.level)
      }
    }

    updateBatteryLevel()

    const interval = setInterval(updateBatteryLevel, 10000) // Every 10 seconds

    return () => clearInterval(interval)
  }, [])

  return batteryLevel
}

/**
 * Hook to detect power saver mode
 */
export function usePowerSaverMode(): boolean {
  const [isPowerSaverMode, setIsPowerSaverMode] = useState(false)

  useEffect(() => {
    const checkPowerMode = () => {
      const mode = getCurrentPowerMode()
      setIsPowerSaverMode(mode === 'power-saver' || mode === 'ultra-saver')
    }

    checkPowerMode()

    const interval = setInterval(checkPowerMode, 5000)

    return () => clearInterval(interval)
  }, [])

  return isPowerSaverMode
}

/**
 * Hook to detect offline status
 */
export function useOfflineStatus(): boolean {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const updateOfflineStatus = () => {
      setOffline(isOffline())
    }

    updateOfflineStatus()

    window.addEventListener('online', updateOfflineStatus)
    window.addEventListener('offline', updateOfflineStatus)

    return () => {
      window.removeEventListener('online', updateOfflineStatus)
      window.removeEventListener('offline', updateOfflineStatus)
    }
  }, [])

  return offline
}

/**
 * Hook for component cleanup tracking
 */
export function useComponentCleanup(componentId: string, cleanupCallbacks: (() => void)[] = []) {
  useEffect(() => {
    const { registerComponent, unregisterComponent } = require('@/lib/performance/memoryManager')

    // Register component
    registerComponent(componentId, {
      id: componentId,
      mountedAt: Date.now(),
    })

    // Cleanup on unmount
    return () => {
      cleanupCallbacks.forEach(callback => callback())
      unregisterComponent(componentId)
    }
  }, [componentId, cleanupCallbacks])
}

/**
 * Hook for optimized event listeners
 */
export function useOptimizedEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions
) {
  useEffect(() => {
    const { trackEventListener, untrackEventListener } = require('@/lib/performance/memoryManager')

    // Track listener
    trackEventListener(window, eventName, handler as EventListener)

    // Add listener
    window.addEventListener(eventName, handler, options)

    // Cleanup
    return () => {
      window.removeEventListener(eventName, handler, options)
      untrackEventListener(window, eventName, handler as EventListener)
    }
  }, [eventName, handler, options])
}
