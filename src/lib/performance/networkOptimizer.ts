/**
 * Network Optimization Module (Task 29)
 *
 * Provides network performance optimizations for mobile devices:
 * - Request batching to reduce overhead
 * - Priority-based request queuing
 * - Adaptive image loading based on network conditions
 * - Intelligent caching strategies
 * - Offline functionality with sync
 */

// ============================================================================
// Types
// ============================================================================

export interface NetworkRequest {
  id: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  priority: 'low' | 'medium' | 'high' | 'critical'
  timestamp: number
  size: number
  cached: boolean
  body?: any
  headers?: Record<string, string>
}

export interface NetworkRequestResult {
  id: string
  success: boolean
  data?: any
  error?: string
  timestamp: number
  duration: number
}

export type NetworkState = 'offline' | 'slow-2g' | '2g' | '3g' | '4g' | 'unknown'

export type CacheStrategy = 'cache-first' | 'network-first' | 'cache-only' | 'network-only' | 'stale-while-revalidate'

// ============================================================================
// Constants
// ============================================================================

const BATCH_DELAY_MS = 50 // Batch requests within 50ms
const MAX_BATCH_SIZE = 10 // Maximum requests per batch
const OFFLINE_QUEUE_KEY = 'flowforge_offline_queue'
const MAX_OFFLINE_QUEUE_SIZE = 100

// ============================================================================
// Network State Detection
// ============================================================================

/**
 * Get current network state
 */
export function getNetworkState(): NetworkState {
  if (!navigator.onLine) {
    return 'offline'
  }

  // Use Network Information API if available
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

  if (connection) {
    const effectiveType = connection.effectiveType
    if (effectiveType) {
      return effectiveType as NetworkState
    }
  }

  return 'unknown'
}

/**
 * Check if device is currently offline
 */
export function isOffline(): boolean {
  return !navigator.onLine
}

/**
 * Check if network is slow (2G or slower)
 */
export function isSlowNetwork(): boolean {
  const state = getNetworkState()
  return state === 'slow-2g' || state === '2g'
}

// ============================================================================
// Request Batching
// ============================================================================

class RequestBatcher {
  private batchQueue: NetworkRequest[] = []
  private batchTimer: NodeJS.Timeout | null = null

  /**
   * Add request to batch queue
   */
  addToBatch(request: NetworkRequest): Promise<NetworkRequestResult> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({
        ...request,
        timestamp: Date.now(),
      })

      // Store resolve/reject functions
      const requestWithCallbacks = this.batchQueue[this.batchQueue.length - 1] as any
      requestWithCallbacks._resolve = resolve
      requestWithCallbacks._reject = reject

      // Schedule batch processing
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.processBatch(), BATCH_DELAY_MS)
      }

      // Process immediately if batch is full
      if (this.batchQueue.length >= MAX_BATCH_SIZE) {
        this.processBatch()
      }
    })
  }

  /**
   * Process all queued requests in a batch
   */
  private async processBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    const requests = [...this.batchQueue]
    this.batchQueue = []

    if (requests.length === 0) {
      return
    }

    // Group requests by priority
    const criticalRequests = requests.filter(r => r.priority === 'critical')
    const highRequests = requests.filter(r => r.priority === 'high')
    const mediumRequests = requests.filter(r => r.priority === 'medium')
    const lowRequests = requests.filter(r => r.priority === 'low')

    // Process in priority order
    const orderedRequests = [
      ...criticalRequests,
      ...highRequests,
      ...mediumRequests,
      ...lowRequests,
    ]

    // Execute requests in parallel
    await Promise.allSettled(
      orderedRequests.map(async (request) => {
        const startTime = Date.now()

        try {
          const response = await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body ? JSON.stringify(request.body) : undefined,
          })

          const data = await response.json()
          const result: NetworkRequestResult = {
            id: request.id,
            success: response.ok,
            data,
            timestamp: Date.now(),
            duration: Date.now() - startTime,
          }

          ;(request as any)._resolve?.(result)
        } catch (error) {
          const result: NetworkRequestResult = {
            id: request.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
            duration: Date.now() - startTime,
          }

          ;(request as any)._reject?.(result)
        }
      })
    )
  }
}

const requestBatcher = new RequestBatcher()

/**
 * Batch multiple API requests to reduce network overhead
 */
export async function batchRequests(requests: NetworkRequest[]): Promise<NetworkRequestResult[]> {
  const results = await Promise.all(
    requests.map(request => requestBatcher.addToBatch(request))
  )

  return results
}

// ============================================================================
// Request Queuing
// ============================================================================

class RequestQueue {
  private queue: NetworkRequest[] = []
  private processing: boolean = false

  /**
   * Add request to queue (for low-priority requests during flow states)
   */
  async queueRequest(request: NetworkRequest): Promise<void> {
    this.queue.push(request)

    // If offline, save to persistent queue
    if (isOffline()) {
      this.saveOfflineQueue()
      return
    }

    // Start processing if not already processing
    if (!this.processing) {
      this.processQueue()
    }
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    this.processing = true

    while (this.queue.length > 0 && !isOffline()) {
      // Process one request at a time for low-priority queue
      const request = this.queue.shift()
      if (!request) break

      try {
        await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body ? JSON.stringify(request.body) : undefined,
        })
      } catch (error) {
        // Log error but continue processing
        console.warn('Failed to process queued request:', error)
      }

      // Small delay between requests to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    this.processing = false
  }

  /**
   * Save queue to local storage for offline persistence
   */
  private saveOfflineQueue(): void {
    try {
      const queueData = this.queue.slice(0, MAX_OFFLINE_QUEUE_SIZE)
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queueData))
    } catch (error) {
      console.error('Failed to save offline queue:', error)
    }
  }

  /**
   * Load queue from local storage
   */
  loadOfflineQueue(): void {
    try {
      const queueData = localStorage.getItem(OFFLINE_QUEUE_KEY)
      if (queueData) {
        this.queue = JSON.parse(queueData)
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error)
    }
  }

  /**
   * Clear offline queue
   */
  clearOfflineQueue(): void {
    this.queue = []
    localStorage.removeItem(OFFLINE_QUEUE_KEY)
  }
}

const requestQueue = new RequestQueue()

/**
 * Queue low-priority request
 */
export async function queueRequest(request: NetworkRequest): Promise<void> {
  return requestQueue.queueRequest(request)
}

/**
 * Sync queued requests when connection is restored
 */
export async function syncOfflineQueue(): Promise<void> {
  requestQueue.loadOfflineQueue()

  // Process all queued requests
  if (!isOffline()) {
    await (requestQueue as any).processQueue()
    requestQueue.clearOfflineQueue()
  }
}

// ============================================================================
// Image Optimization
// ============================================================================

/**
 * Optimize image loading based on network conditions
 */
export async function optimizeImageLoading(imageUrls: string[]): Promise<void> {
  const networkState = getNetworkState()

  // Lazy load images on slow networks
  if (isSlowNetwork()) {
    // Use Intersection Observer for lazy loading
    if ('IntersectionObserver' in window) {
      const images = document.querySelectorAll('img[data-src]')

      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            const src = img.getAttribute('data-src')

            if (src) {
              // Load compressed version on slow network
              img.src = src + '?quality=low'
              imageObserver.unobserve(img)
            }
          }
        })
      })

      images.forEach(img => imageObserver.observe(img))
    }
  }

  // Preload critical images on fast networks
  if (networkState === '4g') {
    imageUrls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url
      document.head.appendChild(link)
    })
  }
}

// ============================================================================
// Cache Strategies
// ============================================================================

/**
 * Get appropriate cache strategy for a URL
 */
export function getCacheStrategy(url: string): CacheStrategy {
  // Static model data - cache first
  if (url.includes('/api/models/') || url.includes('/api/ai-context')) {
    return 'cache-first'
  }

  // User session data - network first
  if (url.includes('/api/sessions')) {
    return 'network-first'
  }

  // Analytics - stale while revalidate
  if (url.includes('/api/analytics')) {
    return 'stale-while-revalidate'
  }

  // Default to network first
  return 'network-first'
}

// ============================================================================
// Offline Functionality
// ============================================================================

/**
 * Check if app is capable of offline functionality
 */
export function isOfflineCapable(): boolean {
  // Check for service worker support
  if (!('serviceWorker' in navigator)) {
    return false
  }

  // Check for IndexedDB support (for offline storage)
  if (!('indexedDB' in window)) {
    return false
  }

  return true
}

/**
 * Initialize offline support
 */
export async function initializeOfflineSupport(): Promise<void> {
  if (!isOfflineCapable()) {
    console.warn('Offline support not available')
    return
  }

  // Register service worker
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/service-worker.js')
      console.log('Service worker registered for offline support')
    } catch (error) {
      console.error('Service worker registration failed:', error)
    }
  }

  // Load offline queue on initialization
  requestQueue.loadOfflineQueue()

  // Set up online/offline event listeners
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
}

/**
 * Handle online event
 */
function handleOnline(): void {
  console.log('Connection restored, syncing offline queue')
  syncOfflineQueue()
}

/**
 * Handle offline event
 */
function handleOffline(): void {
  console.log('Device went offline, queuing requests')
}

/**
 * Cleanup offline support listeners
 */
export function cleanupOfflineSupport(): void {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
}
