import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SessionType, SessionStatus } from '@/types'
import { formatDuration } from '@/lib/utils'

// ============================================================================
// Session Store Types
// ============================================================================

interface SessionState {
  activeSessionId: string | null
  sessionType: SessionType | null
  projectId: string | null
  aiModel: string | null
  startTime: Date | null
  isPaused: boolean
  elapsedSeconds: number
  lastSyncTime: Date | null
  contextHealth: number
}

interface SessionActions {
  startSession: (
    sessionId: string,
    sessionType: SessionType,
    projectId?: string,
    aiModel?: string
  ) => void
  pauseSession: () => void
  resumeSession: () => void
  endSession: () => void
  updateElapsed: () => void
  updateContextHealth: (health: number) => void
  syncWithServer: () => void
}

interface SessionComputed {
  isActive: () => boolean
  formattedElapsed: () => string
}

type SessionStore = SessionState & SessionActions & SessionComputed

// ============================================================================
// Session Store Implementation
// ============================================================================

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      // ========================================================================
      // State
      // ========================================================================
      activeSessionId: null,
      sessionType: null,
      projectId: null,
      aiModel: null,
      startTime: null,
      isPaused: false,
      elapsedSeconds: 0,
      lastSyncTime: null,
      contextHealth: 100,

      // ========================================================================
      // Actions
      // ========================================================================

      /**
       * Start a new coding session
       */
      startSession: (sessionId, sessionType, projectId, aiModel) => {
        set({
          activeSessionId: sessionId,
          sessionType,
          projectId: projectId || null,
          aiModel: aiModel || null,
          startTime: new Date(),
          isPaused: false,
          elapsedSeconds: 0,
          lastSyncTime: null,
          contextHealth: 100,
        })
      },

      /**
       * Pause the active session
       */
      pauseSession: () => {
        set({ isPaused: true })
      },

      /**
       * Resume a paused session
       */
      resumeSession: () => {
        const state = get()
        if (state.startTime && state.isPaused) {
          // Adjust start time to account for paused duration
          const pausedDuration = state.elapsedSeconds
          const newStartTime = new Date(Date.now() - pausedDuration * 1000)
          set({
            isPaused: false,
            startTime: newStartTime,
          })
        }
      },

      /**
       * End the active session and reset all state
       */
      endSession: () => {
        set({
          activeSessionId: null,
          sessionType: null,
          projectId: null,
          aiModel: null,
          startTime: null,
          isPaused: false,
          elapsedSeconds: 0,
          lastSyncTime: null,
          contextHealth: 100,
        })
      },

      /**
       * Increment elapsed time by 1 second (called by SessionTimer)
       */
      updateElapsed: () => {
        const state = get()
        if (!state.isPaused) {
          set({ elapsedSeconds: state.elapsedSeconds + 1 })
        }
      },

      /**
       * Update context health with time-based degradation
       * Decreases by 10 points per hour
       */
      updateContextHealth: (health) => {
        const state = get()
        const degradation = Math.floor((state.elapsedSeconds / 3600) * 10)
        const calculatedHealth = Math.max(0, Math.min(100, health - degradation))
        set({ contextHealth: calculatedHealth })
      },

      /**
       * Mark the last time session was synced with server
       */
      syncWithServer: () => {
        set({ lastSyncTime: new Date() })
      },

      // ========================================================================
      // Computed Getters
      // ========================================================================

      /**
       * Check if there's an active session
       */
      isActive: () => {
        const state = get()
        return state.activeSessionId !== null && !state.isPaused
      },

      /**
       * Get formatted elapsed time string (HH:MM:SS)
       */
      formattedElapsed: () => {
        const state = get()
        return formatDuration(state.elapsedSeconds)
      },
    }),
    {
      name: 'flowforge-session-store',
      // Only persist critical state, exclude temporary UI state
      partialize: (state) => ({
        activeSessionId: state.activeSessionId,
        sessionType: state.sessionType,
        projectId: state.projectId,
        aiModel: state.aiModel,
        startTime: state.startTime,
        elapsedSeconds: state.elapsedSeconds,
        contextHealth: state.contextHealth,
      }),
    }
  )
)
