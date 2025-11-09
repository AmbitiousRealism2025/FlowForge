/**
 * Battery Management Module (Task 30)
 *
 * Provides battery efficiency optimizations for mobile devices:
 * - Monitor battery levels and charging status
 * - Reduce background activity on low battery
 * - Measure and optimize power consumption
 * - Throttle CPU-intensive tasks
 * - Manage screen wake locks
 * - Disable/optimize animations
 */

// ============================================================================
// Types
// ============================================================================

export interface BatteryMetrics {
  level: number // 0.0 to 1.0
  charging: boolean
  chargingTime: number // seconds until full, or Infinity
  dischargingTime: number // seconds until empty, or Infinity
  timestamp: number
}

export interface SessionMetrics {
  id: string
  type: 'BUILDING' | 'EXPLORING' | 'DEBUGGING' | 'SHIPPING'
  startTime: number
  flowState: {
    state: 'BLOCKED' | 'NEUTRAL' | 'FLOWING' | 'DEEP_FLOW'
    startTime: number
    contextHealth: number
    aiModelActive: string
  }
  aiContext: {
    modelId: string
    contextTokens: number
    responseTime: number
    healthScore: number
    lastUpdate: number
  }
  memoryUsage: number
  cpuUsage: number
  batteryLevel: number
}

export type PowerMode = 'high-performance' | 'balanced' | 'power-saver' | 'ultra-saver'

// ============================================================================
// Constants
// ============================================================================

const LOW_BATTERY_THRESHOLD = 0.20 // 20%
const CRITICAL_BATTERY_THRESHOLD = 0.10 // 10%
const BATTERY_UPDATE_INTERVAL = 60000 // 60 seconds
const CPU_SAMPLE_INTERVAL = 1000 // 1 second

// ============================================================================
// Battery Status Monitoring
// ============================================================================

let batteryManager: any = null
let currentBatteryMetrics: BatteryMetrics | null = null
let batteryUpdateTimer: NodeJS.Timeout | null = null

/**
 * Initialize battery monitoring
 */
export async function initializeBatteryMonitoring(): Promise<void> {
  if (!('getBattery' in navigator)) {
    console.warn('Battery API not supported')
    return
  }

  try {
    batteryManager = await (navigator as any).getBattery()

    // Get initial battery status
    await updateBatteryMetrics()

    // Set up event listeners
    batteryManager.addEventListener('levelchange', updateBatteryMetrics)
    batteryManager.addEventListener('chargingchange', updateBatteryMetrics)

    // Periodic updates
    batteryUpdateTimer = setInterval(updateBatteryMetrics, BATTERY_UPDATE_INTERVAL)

    console.log('Battery monitoring initialized')
  } catch (error) {
    console.error('Failed to initialize battery monitoring:', error)
  }
}

/**
 * Update battery metrics
 */
async function updateBatteryMetrics(): Promise<void> {
  if (!batteryManager) return

  currentBatteryMetrics = {
    level: batteryManager.level,
    charging: batteryManager.charging,
    chargingTime: batteryManager.chargingTime,
    dischargingTime: batteryManager.dischargingTime,
    timestamp: Date.now(),
  }

  // Adjust power mode based on battery level
  optimizeForBatteryLevel(currentBatteryMetrics.level)
}

/**
 * Get current battery metrics
 */
export function getBatteryMetrics(): BatteryMetrics | null {
  return currentBatteryMetrics
}

/**
 * Cleanup battery monitoring
 */
export function cleanupBatteryMonitoring(): void {
  if (batteryUpdateTimer) {
    clearInterval(batteryUpdateTimer)
    batteryUpdateTimer = null
  }

  if (batteryManager) {
    batteryManager.removeEventListener('levelchange', updateBatteryMetrics)
    batteryManager.removeEventListener('chargingchange', updateBatteryMetrics)
  }
}

// ============================================================================
// Power Mode Management
// ============================================================================

let currentPowerMode: PowerMode = 'balanced'
let backgroundProcessesPaused: boolean = false

/**
 * Get current power mode
 */
export function getCurrentPowerMode(): PowerMode {
  return currentPowerMode
}

/**
 * Set power mode
 */
export function setPowerMode(mode: PowerMode): void {
  currentPowerMode = mode

  // Apply optimizations based on mode
  switch (mode) {
    case 'ultra-saver':
      pauseBackgroundProcesses()
      disableAnimations()
      throttleCPUIntensiveTasks(40) // 40% CPU limit
      break

    case 'power-saver':
      pauseBackgroundProcesses()
      optimizeAnimations(15) // Optimize for 15% battery
      throttleCPUIntensiveTasks(60) // 60% CPU limit
      break

    case 'balanced':
      resumeBackgroundProcesses()
      enableAnimations()
      throttleCPUIntensiveTasks(80) // 80% CPU limit
      break

    case 'high-performance':
      resumeBackgroundProcesses()
      enableAnimations()
      // No CPU throttling
      break
  }
}

/**
 * Optimize for current battery level
 */
export function optimizeForBatteryLevel(batteryLevel: number): void {
  const metrics = getBatteryMetrics()

  // Don't optimize if charging
  if (metrics?.charging) {
    setPowerMode('balanced')
    return
  }

  // Set power mode based on battery level
  if (batteryLevel < CRITICAL_BATTERY_THRESHOLD) {
    setPowerMode('ultra-saver')
  } else if (batteryLevel < LOW_BATTERY_THRESHOLD) {
    setPowerMode('power-saver')
  } else if (batteryLevel < 0.50) {
    setPowerMode('balanced')
  } else {
    setPowerMode('high-performance')
  }
}

// ============================================================================
// Background Process Management
// ============================================================================

/**
 * Pause background processes
 */
export function pauseBackgroundProcesses(): void {
  if (backgroundProcessesPaused) return

  backgroundProcessesPaused = true

  // Pause non-critical background tasks
  // - AI context auto-refresh
  // - Analytics tracking
  // - Background sync

  // Dispatch event for components to listen to
  window.dispatchEvent(new CustomEvent('background-processes-paused'))

  console.log('Background processes paused for battery saving')
}

/**
 * Resume background processes
 */
export function resumeBackgroundProcesses(): void {
  if (!backgroundProcessesPaused) return

  backgroundProcessesPaused = false

  // Resume background tasks
  window.dispatchEvent(new CustomEvent('background-processes-resumed'))

  console.log('Background processes resumed')
}

/**
 * Check if background processes are paused
 */
export function areBackgroundProcessesPaused(): boolean {
  return backgroundProcessesPaused
}

// ============================================================================
// Power Consumption Measurement
// ============================================================================

let powerConsumptionBaseline: number = 0
let lastBatteryLevel: number = 1.0
let lastBatteryTimestamp: number = Date.now()

/**
 * Measure power consumption
 * Returns estimated power consumption in percentage per hour
 */
export async function measurePowerConsumption(): Promise<number> {
  const metrics = getBatteryMetrics()

  if (!metrics) {
    return 0
  }

  // Skip if charging
  if (metrics.charging) {
    return 0
  }

  // Calculate battery drain rate
  const timeDelta = (metrics.timestamp - lastBatteryTimestamp) / 1000 / 3600 // hours
  const batteryDelta = lastBatteryLevel - metrics.level

  // Update baseline
  lastBatteryLevel = metrics.level
  lastBatteryTimestamp = metrics.timestamp

  if (timeDelta > 0) {
    const drainRate = (batteryDelta / timeDelta) * 100 // percentage per hour
    return Math.max(0, drainRate)
  }

  return powerConsumptionBaseline
}

// ============================================================================
// CPU Throttling
// ============================================================================

let cpuThrottlePercentage: number = 100 // 100 = no throttling

/**
 * Throttle CPU-intensive tasks
 */
export function throttleCPUIntensiveTasks(maxCPUPercentage: number): void {
  cpuThrottlePercentage = Math.max(0, Math.min(100, maxCPUPercentage))

  // Dispatch event for components to adjust their CPU usage
  window.dispatchEvent(new CustomEvent('cpu-throttle', {
    detail: { maxCPUPercentage: cpuThrottlePercentage }
  }))

  console.log(`CPU throttled to ${cpuThrottlePercentage}%`)
}

/**
 * Get current CPU throttle percentage
 */
export function getCPUThrottlePercentage(): number {
  return cpuThrottlePercentage
}

/**
 * Check if a task should be throttled
 */
export function shouldThrottleTask(): boolean {
  return cpuThrottlePercentage < 100
}

// ============================================================================
// Wake Lock Management
// ============================================================================

let wakeLock: any = null

/**
 * Manage screen wake lock during active sessions
 */
export async function manageScreenWakeLock(session: SessionMetrics): Promise<void> {
  if (!('wakeLock' in navigator)) {
    console.warn('Wake Lock API not supported')
    return
  }

  const metrics = getBatteryMetrics()

  // Release wake lock if battery is critically low
  if (metrics && metrics.level < CRITICAL_BATTERY_THRESHOLD && !metrics.charging) {
    await releaseWakeLock()
    return
  }

  // Request wake lock for active flow states
  if (session.flowState.state === 'FLOWING' || session.flowState.state === 'DEEP_FLOW') {
    await requestWakeLock()
  } else {
    await releaseWakeLock()
  }
}

/**
 * Request screen wake lock
 */
async function requestWakeLock(): Promise<void> {
  if (wakeLock) return // Already have wake lock

  try {
    wakeLock = await (navigator as any).wakeLock.request('screen')

    wakeLock.addEventListener('release', () => {
      console.log('Wake lock released')
    })

    console.log('Wake lock acquired')
  } catch (error) {
    console.error('Failed to acquire wake lock:', error)
  }
}

/**
 * Release screen wake lock
 */
async function releaseWakeLock(): Promise<void> {
  if (!wakeLock) return

  try {
    await wakeLock.release()
    wakeLock = null
  } catch (error) {
    console.error('Failed to release wake lock:', error)
  }
}

// ============================================================================
// Animation Optimization
// ============================================================================

let animationsDisabled: boolean = false

/**
 * Optimize animations based on battery level
 */
export function optimizeAnimations(batteryLevel: number): void {
  if (batteryLevel < LOW_BATTERY_THRESHOLD) {
    disableAnimations()
  } else {
    enableAnimations()
  }
}

/**
 * Disable animations for battery saving
 */
export function disableAnimations(): void {
  if (animationsDisabled) return

  animationsDisabled = true

  // Add CSS class to disable animations
  document.documentElement.classList.add('reduce-motion')

  // Dispatch event
  window.dispatchEvent(new CustomEvent('animations-disabled'))

  console.log('Animations disabled for battery saving')
}

/**
 * Enable animations
 */
export function enableAnimations(): void {
  if (!animationsDisabled) return

  animationsDisabled = false

  // Remove CSS class
  document.documentElement.classList.remove('reduce-motion')

  // Dispatch event
  window.dispatchEvent(new CustomEvent('animations-enabled'))

  console.log('Animations enabled')
}

/**
 * Check if animations are disabled
 */
export function areAnimationsDisabled(): boolean {
  return animationsDisabled
}

// ============================================================================
// Power-Efficient Animation Helpers
// ============================================================================

/**
 * Use CSS transforms for power-efficient animations
 * (GPU-accelerated, doesn't trigger layout recalculation)
 */
export function usePowerEfficientAnimation(element: HTMLElement, property: 'transform' | 'opacity'): void {
  // Ensure will-change is set for GPU acceleration
  element.style.willChange = property

  // Use transform or opacity (both are GPU-accelerated)
  element.style.transition = `${property} 0.3s ease-out`

  // Clean up will-change after animation
  element.addEventListener('transitionend', () => {
    element.style.willChange = 'auto'
  }, { once: true })
}
