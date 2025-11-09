/**
 * Performance Optimization Modules (Phase 2.3)
 *
 * Central export for all mobile performance optimizations
 */

// Network Optimization (Task 29)
export * from './networkOptimizer'

// Battery Management (Task 30)
export * from './batteryManager'

// Memory Management (Task 31)
export * from './memoryManager'

// Touch Performance (Task 32)
export * from './touchPerformance'

/**
 * Initialize all performance modules
 */
export async function initializePerformanceModules(): Promise<void> {
  const { initializeOfflineSupport } = await import('./networkOptimizer')
  const { initializeBatteryMonitoring } = await import('./batteryManager')
  const { initializeMemoryMonitoring } = await import('./memoryManager')
  const { initializeTouchPerformance, monitorTouchPerformance } = await import('./touchPerformance')

  console.log('Initializing performance modules...')

  // Initialize modules in sequence
  await initializeOfflineSupport()
  await initializeBatteryMonitoring()
  initializeMemoryMonitoring()
  initializeTouchPerformance()
  monitorTouchPerformance()

  console.log('All performance modules initialized')
}

/**
 * Cleanup all performance modules
 */
export function cleanupPerformanceModules(): void {
  const { cleanupOfflineSupport } = require('./networkOptimizer')
  const { cleanupBatteryMonitoring } = require('./batteryManager')
  const { cleanupMemoryMonitoring } = require('./memoryManager')

  cleanupOfflineSupport()
  cleanupBatteryMonitoring()
  cleanupMemoryMonitoring()

  console.log('Performance modules cleaned up')
}
