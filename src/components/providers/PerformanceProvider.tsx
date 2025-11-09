/**
 * Performance Provider Component
 *
 * Initializes and manages all performance optimization modules
 * for mobile devices (Phase 2.3)
 */

'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useOfflineStatus, usePowerSaverMode } from '@/hooks/usePerformance'
import { WifiOff, Battery, AlertTriangle } from 'lucide-react'

interface PerformanceProviderProps {
  children: ReactNode
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  const [initialized, setInitialized] = useState(false)
  const [memoryPressure, setMemoryPressure] = useState(false)
  const isOffline = useOfflineStatus()
  const isPowerSaverMode = usePowerSaverMode()

  // Initialize performance modules
  useEffect(() => {
    const initializeModules = async () => {
      try {
        const { initializePerformanceModules } = await import('@/lib/performance')

        await initializePerformanceModules()
        setInitialized(true)

        console.log('✓ Performance modules initialized')
      } catch (error) {
        console.error('Failed to initialize performance modules:', error)
      }
    }

    initializeModules()

    // Cleanup on unmount
    return () => {
      const { cleanupPerformanceModules } = require('@/lib/performance')
      cleanupPerformanceModules()
    }
  }, [])

  // Listen for memory pressure events
  useEffect(() => {
    const handleMemoryPressure = () => {
      setMemoryPressure(true)

      // Auto-hide after 5 seconds
      setTimeout(() => setMemoryPressure(false), 5000)
    }

    window.addEventListener('memory-pressure', handleMemoryPressure)

    return () => {
      window.removeEventListener('memory-pressure', handleMemoryPressure)
    }
  }, [])

  return (
    <>
      {/* Offline Indicator */}
      {isOffline && (
        <div className="offline-indicator">
          <WifiOff className="inline-block w-4 h-4 mr-2" />
          You're offline. Some features may be limited.
        </div>
      )}

      {/* Power Saver Mode Indicator */}
      {isPowerSaverMode && (
        <div className="power-saver-indicator">
          <Battery className="inline-block w-4 h-4 mr-2" />
          Power saver mode active
        </div>
      )}

      {/* Memory Pressure Warning */}
      {memoryPressure && (
        <div className="memory-pressure-warning">
          <AlertTriangle className="inline-block w-5 h-5 mr-2" />
          <strong>Memory pressure detected.</strong> Optimizing performance...
        </div>
      )}

      {/* Main Content */}
      {children}
    </>
  )
}
