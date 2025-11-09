/**
 * Touch Performance Module (Task 32)
 *
 * Provides touch interaction optimizations for mobile devices:
 * - Optimize touch event handling
 * - Measure touch response time
 * - Debounce gesture recognition
 * - Optimize scroll performance
 * - Provide haptic feedback
 * - Minimize input lag
 */

// ============================================================================
// Types
// ============================================================================

export interface TouchEvent {
  id: string
  type: 'tap' | 'swipe' | 'pinch' | 'long-press'
  startTime: number
  endTime: number
  responseTime: number
  element: string
}

export type HapticIntensity = 'light' | 'medium' | 'heavy'

export interface TouchMetrics {
  averageResponseTime: number
  events: TouchEvent[]
  slowEvents: TouchEvent[]
}

// ============================================================================
// Constants
// ============================================================================

const TARGET_RESPONSE_TIME = 16 // 60fps = 16.67ms per frame
const SLOW_RESPONSE_THRESHOLD = 100 // 100ms is noticeably slow
const GESTURE_DEBOUNCE_DELAY = 150 // 150ms debounce for gestures
const MAX_TOUCH_HISTORY = 100

// ============================================================================
// Touch Event Optimization
// ============================================================================

let touchEventHistory: TouchEvent[] = []
let passiveEventsEnabled: boolean = false

/**
 * Initialize touch performance optimizations
 */
export function initializeTouchPerformance(): void {
  optimizeTouchEvents()
  console.log('Touch performance optimizations initialized')
}

/**
 * Optimize touch event handling
 */
export function optimizeTouchEvents(): void {
  // Use passive event listeners for scroll-blocking events
  const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'mousewheel']

  passiveEvents.forEach(eventType => {
    // Check if passive is supported
    let supportsPassive = false
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get: () => {
          supportsPassive = true
          return true
        },
      })
      window.addEventListener('test', null as any, opts)
      window.removeEventListener('test', null as any)
    } catch (e) {
      // Passive not supported
    }

    if (supportsPassive) {
      passiveEventsEnabled = true
    }
  })

  console.log(`Passive event listeners ${passiveEventsEnabled ? 'enabled' : 'not supported'}`)
}

/**
 * Add touch event with performance tracking
 */
export function addPerformantTouchListener(
  element: HTMLElement,
  eventType: 'touchstart' | 'touchmove' | 'touchend' | 'click',
  handler: (event: Event) => void,
  options?: AddEventListenerOptions
): void {
  const wrappedHandler = (event: Event) => {
    const startTime = performance.now()

    // Execute original handler
    handler(event)

    const endTime = performance.now()
    const responseTime = endTime - startTime

    // Track performance
    trackTouchEvent({
      id: `${eventType}-${Date.now()}`,
      type: 'tap', // Simplified for this example
      startTime,
      endTime,
      responseTime,
      element: element.id || element.className || 'unknown',
    })

    // Warn if slow
    if (responseTime > SLOW_RESPONSE_THRESHOLD) {
      console.warn(`Slow touch response (${responseTime.toFixed(2)}ms) on`, element)
    }
  }

  // Use passive listener for non-blocking events
  const eventOptions: AddEventListenerOptions = {
    ...options,
    passive: passiveEventsEnabled && (eventType === 'touchstart' || eventType === 'touchmove'),
  }

  element.addEventListener(eventType, wrappedHandler, eventOptions)
}

/**
 * Track touch event
 */
function trackTouchEvent(event: TouchEvent): void {
  touchEventHistory.push(event)

  // Keep history limited
  if (touchEventHistory.length > MAX_TOUCH_HISTORY) {
    touchEventHistory.shift()
  }
}

// ============================================================================
// Touch Response Time Measurement
// ============================================================================

/**
 * Measure touch response time
 */
export function measureTouchResponseTime(event: TouchEvent): number {
  return event.responseTime
}

/**
 * Get touch performance metrics
 */
export function getTouchMetrics(): TouchMetrics {
  const events = [...touchEventHistory]

  const totalResponseTime = events.reduce((sum, event) => sum + event.responseTime, 0)
  const averageResponseTime = events.length > 0 ? totalResponseTime / events.length : 0

  const slowEvents = events.filter(event => event.responseTime > TARGET_RESPONSE_TIME)

  return {
    averageResponseTime,
    events,
    slowEvents,
  }
}

/**
 * Reset touch metrics
 */
export function resetTouchMetrics(): void {
  touchEventHistory = []
}

// ============================================================================
// Gesture Debouncing
// ============================================================================

const gestureTimers = new Map<string, NodeJS.Timeout>()

/**
 * Debounce gesture recognition
 */
export function debounceGestureRecognition(
  gestureType: string,
  callback: () => void,
  delay: number = GESTURE_DEBOUNCE_DELAY
): void {
  // Clear existing timer
  const existingTimer = gestureTimers.get(gestureType)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  // Set new timer
  const timer = setTimeout(() => {
    callback()
    gestureTimers.delete(gestureType)
  }, delay)

  gestureTimers.set(gestureType, timer)
}

/**
 * Cancel debounced gesture
 */
export function cancelDebouncedGesture(gestureType: string): void {
  const timer = gestureTimers.get(gestureType)
  if (timer) {
    clearTimeout(timer)
    gestureTimers.delete(gestureType)
  }
}

// ============================================================================
// Scroll Performance Optimization
// ============================================================================

/**
 * Optimize scroll performance
 */
export function optimizeScrollPerformance(): void {
  // Enable CSS containment for scroll containers
  const scrollContainers = document.querySelectorAll('[data-scroll-container]')

  scrollContainers.forEach(container => {
    const element = container as HTMLElement

    // Apply CSS optimizations
    element.style.contain = 'layout style paint'
    element.style.willChange = 'scroll-position'

    // Use passive scroll listener
    if (passiveEventsEnabled) {
      element.addEventListener('scroll', () => {
        // Scroll event handler
      }, { passive: true })
    }
  })

  // Enable virtual scrolling for large lists
  enableVirtualScrolling()
}

/**
 * Enable virtual scrolling for large datasets
 */
function enableVirtualScrolling(): void {
  const virtualScrollContainers = document.querySelectorAll('[data-virtual-scroll]')

  virtualScrollContainers.forEach(container => {
    const element = container as HTMLElement

    // Apply IntersectionObserver for lazy rendering
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Load content
            const target = entry.target as HTMLElement
            target.style.visibility = 'visible'
          } else {
            // Unload content to save memory
            const target = entry.target as HTMLElement
            target.style.visibility = 'hidden'
          }
        })
      },
      {
        root: element,
        rootMargin: '100px', // Load 100px before visible
      }
    )

    // Observe all children
    Array.from(element.children).forEach(child => observer.observe(child))
  })
}

/**
 * Maintain smooth scrolling during updates
 */
export function maintainSmoothScrolling(updateCallback: () => void): void {
  // Use requestAnimationFrame to sync with browser rendering
  requestAnimationFrame(() => {
    const startTime = performance.now()

    updateCallback()

    const endTime = performance.now()
    const duration = endTime - startTime

    // Warn if update blocks frame
    if (duration > TARGET_RESPONSE_TIME) {
      console.warn(`Update blocked frame (${duration.toFixed(2)}ms), consider optimizing`)
    }
  })
}

// ============================================================================
// Haptic Feedback
// ============================================================================

/**
 * Enable haptic feedback
 */
export function enableHapticFeedback(intensity: HapticIntensity): void {
  // Check for Vibration API support
  if (!('vibrate' in navigator)) {
    return
  }

  // Vibration patterns based on intensity
  const patterns: Record<HapticIntensity, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: [30, 10, 30],
  }

  const pattern = patterns[intensity]

  try {
    navigator.vibrate(pattern)
  } catch (error) {
    console.error('Haptic feedback error:', error)
  }
}

/**
 * Provide haptic feedback for flow state changes
 */
export function hapticForFlowState(flowState: 'BLOCKED' | 'NEUTRAL' | 'FLOWING' | 'DEEP_FLOW'): void {
  const hapticMap: Record<string, HapticIntensity> = {
    'BLOCKED': 'heavy',
    'NEUTRAL': 'light',
    'FLOWING': 'medium',
    'DEEP_FLOW': 'light',
  }

  const intensity = hapticMap[flowState]
  if (intensity) {
    enableHapticFeedback(intensity)
  }
}

/**
 * Disable haptic feedback
 */
export function disableHapticFeedback(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(0)
  }
}

// ============================================================================
// Input Lag Minimization
// ============================================================================

/**
 * Minimize input lag
 */
export function minimizeInputLag(): void {
  // Use CSS for instant visual feedback
  const interactiveElements = document.querySelectorAll('button, [role="button"], a')

  interactiveElements.forEach(element => {
    const el = element as HTMLElement

    // Add active state class immediately on touchstart
    el.addEventListener(
      'touchstart',
      () => {
        el.classList.add('active-touch')
      },
      { passive: true }
    )

    el.addEventListener(
      'touchend',
      () => {
        el.classList.remove('active-touch')
      },
      { passive: true }
    )
  })

  // Use transform for animations (GPU-accelerated)
  const animatedElements = document.querySelectorAll('[data-animate-touch]')

  animatedElements.forEach(element => {
    const el = element as HTMLElement

    // Prefer transform over layout changes
    el.style.transition = 'transform 0.1s ease-out'
    el.style.willChange = 'transform'
  })
}

/**
 * Optimize button click handling
 */
export function createFastClickHandler(callback: () => void): (event: Event) => void {
  let touchStarted = false
  let touchMoved = false

  return (event: Event) => {
    if (event.type === 'touchstart') {
      touchStarted = true
      touchMoved = false
    } else if (event.type === 'touchmove') {
      touchMoved = true
    } else if (event.type === 'touchend') {
      if (touchStarted && !touchMoved) {
        event.preventDefault()
        callback()
      }
      touchStarted = false
    } else if (event.type === 'click') {
      // Fallback for desktop
      if (!touchStarted) {
        callback()
      }
    }
  }
}

// ============================================================================
// Performance Monitoring
// ============================================================================

/**
 * Monitor touch performance
 */
export function monitorTouchPerformance(): void {
  setInterval(() => {
    const metrics = getTouchMetrics()

    if (metrics.slowEvents.length > 0) {
      console.warn(
        `Touch performance: ${metrics.slowEvents.length} slow events, ` +
        `average response time: ${metrics.averageResponseTime.toFixed(2)}ms`
      )
    }
  }, 30000) // Every 30 seconds
}

/**
 * Get performance report
 */
export function getTouchPerformanceReport(): string {
  const metrics = getTouchMetrics()

  return `
Touch Performance Report:
- Total events: ${metrics.events.length}
- Average response time: ${metrics.averageResponseTime.toFixed(2)}ms
- Slow events (>${TARGET_RESPONSE_TIME}ms): ${metrics.slowEvents.length}
- Target: <${TARGET_RESPONSE_TIME}ms for 60fps
  `.trim()
}
