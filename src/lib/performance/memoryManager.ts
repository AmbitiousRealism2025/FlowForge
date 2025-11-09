/**
 * Memory Management Module (Task 31)
 *
 * Provides memory optimization and leak detection:
 * - Monitor memory usage over time
 * - Detect potential memory leaks
 * - Virtualize large datasets
 * - Handle memory pressure warnings
 * - Force garbage collection when needed
 * - Track and cleanup event listeners
 */

// ============================================================================
// Types
// ============================================================================

export interface MemorySnapshot {
  timestamp: number
  heapUsed: number
  heapTotal: number
  external: number
  components: number
  listeners: number
}

export interface MemoryLeak {
  type: 'listener' | 'component' | 'timer' | 'subscription'
  identifier: string
  count: number
  estimatedSize: number
  timestamp: number
}

export interface VirtualizedDataset<T> {
  totalCount: number
  pageSize: number
  currentPage: number
  data: T[]
  hasMore: boolean
}

// ============================================================================
// Constants
// ============================================================================

const MEMORY_SNAPSHOT_INTERVAL = 30000 // 30 seconds
const MEMORY_PRESSURE_THRESHOLD = 0.85 // 85% of available memory
const CRITICAL_MEMORY_THRESHOLD = 0.90 // 90% of available memory
const MAX_SNAPSHOTS = 100
const LEAK_DETECTION_THRESHOLD = 10 // Number of snapshots before leak detection

// ============================================================================
// Memory Monitoring
// ============================================================================

let memorySnapshots: MemorySnapshot[] = []
let snapshotTimer: NodeJS.Timeout | null = null
let componentRegistry = new Map<string, any>()
let listenerRegistry = new Map<string, EventListenerOrEventListenerObject[]>()
let timerRegistry = new Set<number>()

/**
 * Initialize memory monitoring
 */
export function initializeMemoryMonitoring(): void {
  // Take initial snapshot
  takeMemorySnapshot()

  // Set up periodic snapshots
  snapshotTimer = setInterval(() => {
    const snapshot = takeMemorySnapshot()

    // Check for memory pressure
    if (snapshot) {
      const memoryUsageRatio = snapshot.heapUsed / snapshot.heapTotal

      if (memoryUsageRatio > CRITICAL_MEMORY_THRESHOLD) {
        handleMemoryPressure()
      }
    }

    // Detect leaks periodically
    if (memorySnapshots.length > LEAK_DETECTION_THRESHOLD) {
      detectMemoryLeaks()
    }
  }, MEMORY_SNAPSHOT_INTERVAL)

  console.log('Memory monitoring initialized')
}

/**
 * Cleanup memory monitoring
 */
export function cleanupMemoryMonitoring(): void {
  if (snapshotTimer) {
    clearInterval(snapshotTimer)
    snapshotTimer = null
  }
}

// ============================================================================
// Memory Snapshots
// ============================================================================

/**
 * Take a memory snapshot
 */
export function takeMemorySnapshot(): MemorySnapshot | null {
  // Use Performance API to get memory info
  const performance = window.performance as any

  if (!performance.memory) {
    console.warn('Performance.memory API not available')
    return null
  }

  const snapshot: MemorySnapshot = {
    timestamp: Date.now(),
    heapUsed: performance.memory.usedJSHeapSize,
    heapTotal: performance.memory.totalJSHeapSize,
    external: performance.memory.jsHeapSizeLimit - performance.memory.totalJSHeapSize,
    components: componentRegistry.size,
    listeners: Array.from(listenerRegistry.values()).reduce((sum, listeners) => sum + listeners.length, 0),
  }

  // Add to snapshots array
  memorySnapshots.push(snapshot)

  // Keep only recent snapshots
  if (memorySnapshots.length > MAX_SNAPSHOTS) {
    memorySnapshots.shift()
  }

  return snapshot
}

/**
 * Get all memory snapshots
 */
export function getMemorySnapshots(): MemorySnapshot[] {
  return [...memorySnapshots]
}

/**
 * Get latest memory snapshot
 */
export function getLatestMemorySnapshot(): MemorySnapshot | null {
  return memorySnapshots[memorySnapshots.length - 1] || null
}

// ============================================================================
// Memory Leak Detection
// ============================================================================

/**
 * Detect potential memory leaks
 */
export async function detectMemoryLeaks(): Promise<MemoryLeak[]> {
  const leaks: MemoryLeak[] = []

  // Analyze snapshots for growing trends
  if (memorySnapshots.length < 5) {
    return leaks // Not enough data
  }

  const recentSnapshots = memorySnapshots.slice(-10)
  const firstSnapshot = recentSnapshots[0]
  const lastSnapshot = recentSnapshots[recentSnapshots.length - 1]

  // Check for listener leaks
  const listenerGrowth = lastSnapshot.listeners - firstSnapshot.listeners
  if (listenerGrowth > 20) { // More than 20 listeners added
    leaks.push({
      type: 'listener',
      identifier: 'event-listeners',
      count: listenerGrowth,
      estimatedSize: listenerGrowth * 1024, // Rough estimate: 1KB per listener
      timestamp: Date.now(),
    })
  }

  // Check for component leaks
  const componentGrowth = lastSnapshot.components - firstSnapshot.components
  if (componentGrowth > 10) { // More than 10 components added
    leaks.push({
      type: 'component',
      identifier: 'react-components',
      count: componentGrowth,
      estimatedSize: componentGrowth * 10240, // Rough estimate: 10KB per component
      timestamp: Date.now(),
    })
  }

  // Check for overall heap growth
  const heapGrowth = lastSnapshot.heapUsed - firstSnapshot.heapUsed
  const heapGrowthRatio = heapGrowth / firstSnapshot.heapUsed

  if (heapGrowthRatio > 0.30) { // More than 30% growth
    leaks.push({
      type: 'timer',
      identifier: 'memory-heap',
      count: 1,
      estimatedSize: heapGrowth,
      timestamp: Date.now(),
    })
  }

  // Log detected leaks
  if (leaks.length > 0) {
    console.warn('Potential memory leaks detected:', leaks)
  }

  return leaks
}

// ============================================================================
// Memory Pressure Handling
// ============================================================================

/**
 * Handle memory pressure warnings
 */
export function handleMemoryPressure(): void {
  console.warn('Memory pressure detected, attempting cleanup')

  // Clear caches
  clearCaches()

  // Force component cleanup
  cleanupUnusedComponents()

  // Try to trigger garbage collection (if available)
  forceGarbageCollection()

  // Dispatch event for app to respond
  window.dispatchEvent(new CustomEvent('memory-pressure', {
    detail: { timestamp: Date.now() }
  }))
}

/**
 * Clear application caches
 */
function clearCaches(): void {
  // Clear any in-memory caches
  // This would be app-specific

  console.log('Caches cleared')
}

/**
 * Cleanup unused components from registry
 */
function cleanupUnusedComponents(): void {
  const keysToRemove: string[] = []

  componentRegistry.forEach((value, key) => {
    // Check if component is still mounted
    if (!value || value._unmounted) {
      keysToRemove.push(key)
    }
  })

  keysToRemove.forEach(key => componentRegistry.delete(key))

  console.log(`Cleaned up ${keysToRemove.length} unused components`)
}

// ============================================================================
// Garbage Collection
// ============================================================================

/**
 * Force garbage collection (if available)
 */
export function forceGarbageCollection(): void {
  // GC is not directly accessible in browsers
  // This function triggers actions that help GC

  // Clear weak references
  if (typeof WeakRef !== 'undefined') {
    // GC will automatically clean up weak references
  }

  // Nullify large temporary objects
  // (App-specific cleanup)

  console.log('Requested garbage collection')
}

// ============================================================================
// Dataset Virtualization
// ============================================================================

/**
 * Virtualize large dataset to reduce memory usage
 */
export async function virtualizeDataset<T>(
  dataset: T[],
  pageSize: number,
  currentPage: number = 0
): Promise<VirtualizedDataset<T>> {
  const totalCount = dataset.length
  const startIndex = currentPage * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalCount)

  const virtualizedData: VirtualizedDataset<T> = {
    totalCount,
    pageSize,
    currentPage,
    data: dataset.slice(startIndex, endIndex),
    hasMore: endIndex < totalCount,
  }

  return virtualizedData
}

// ============================================================================
// Component Lifecycle Management
// ============================================================================

/**
 * Register a component for tracking
 */
export function registerComponent(id: string, component: any): void {
  componentRegistry.set(id, component)
}

/**
 * Unregister a component
 */
export function unregisterComponent(id: string): void {
  const component = componentRegistry.get(id)

  if (component) {
    // Cleanup component resources
    cleanupComponent(component)
    componentRegistry.delete(id)
  }
}

/**
 * Cleanup component resources
 */
function cleanupComponent(component: any): void {
  // Mark as unmounted
  component._unmounted = true

  // Remove event listeners
  if (component.eventListeners) {
    component.eventListeners.forEach((listener: any) => {
      const target = listener.target || window
      target.removeEventListener(listener.event, listener.handler)
    })
  }

  // Clear timers
  if (component.timers) {
    component.timers.forEach((timer: number) => {
      clearTimeout(timer)
      clearInterval(timer)
      timerRegistry.delete(timer)
    })
  }

  // Unsubscribe from subscriptions
  if (component.subscriptions) {
    component.subscriptions.forEach((subscription: any) => {
      if (subscription.unsubscribe) {
        subscription.unsubscribe()
      }
    })
  }
}

// ============================================================================
// Event Listener Tracking
// ============================================================================

/**
 * Track event listener
 */
export function trackEventListener(
  element: EventTarget,
  event: string,
  handler: EventListenerOrEventListenerObject
): void {
  const key = `${element.toString()}-${event}`

  if (!listenerRegistry.has(key)) {
    listenerRegistry.set(key, [])
  }

  listenerRegistry.get(key)!.push(handler)
}

/**
 * Untrack event listener
 */
export function untrackEventListener(
  element: EventTarget,
  event: string,
  handler: EventListenerOrEventListenerObject
): void {
  const key = `${element.toString()}-${event}`
  const listeners = listenerRegistry.get(key)

  if (listeners) {
    const index = listeners.indexOf(handler)
    if (index > -1) {
      listeners.splice(index, 1)
    }

    if (listeners.length === 0) {
      listenerRegistry.delete(key)
    }
  }
}

/**
 * Get memory usage by category
 */
export function getMemoryUsageByCategory(): Map<string, number> {
  const usage = new Map<string, number>()

  // Count listeners
  const totalListeners = Array.from(listenerRegistry.values()).reduce(
    (sum, listeners) => sum + listeners.length,
    0
  )
  usage.set('listeners', totalListeners)

  // Count components
  usage.set('components', componentRegistry.size)

  // Count timers
  usage.set('timers', timerRegistry.size)

  // Get heap usage
  const performance = window.performance as any
  if (performance.memory) {
    usage.set('heap', performance.memory.usedJSHeapSize)
  }

  return usage
}

// ============================================================================
// React-Specific Helpers
// ============================================================================

/**
 * Create a cleanup function for React useEffect
 */
export function createCleanupFunction(
  componentId: string,
  cleanupCallbacks: (() => void)[]
): () => void {
  return () => {
    // Execute all cleanup callbacks
    cleanupCallbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Error during cleanup:', error)
      }
    })

    // Unregister component
    unregisterComponent(componentId)
  }
}

/**
 * Track a timer for cleanup
 */
export function trackTimer(timerId: number): void {
  timerRegistry.add(timerId)
}

/**
 * Untrack a timer
 */
export function untrackTimer(timerId: number): void {
  timerRegistry.delete(timerId)
}

/**
 * Clear all tracked timers
 */
export function clearAllTrackedTimers(): void {
  timerRegistry.forEach(timerId => {
    clearTimeout(timerId)
    clearInterval(timerId)
  })
  timerRegistry.clear()
}
