import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FlowState } from '@/types'
import { getTimeOfDay } from '@/lib/utils'

// ============================================================================
// Dashboard Store Types
// ============================================================================

interface DashboardState {
  todaysFocus: string
  quickCaptureBuffer: string
  flowState: FlowState
  lastRefresh: Date | null
  isRefreshing: boolean
}

interface DashboardActions {
  setTodaysFocus: (focus: string) => void
  updateQuickCaptureBuffer: (text: string) => void
  clearQuickCaptureBuffer: () => void
  setFlowState: (state: FlowState) => void
  refreshDashboard: () => void
  setRefreshing: (isRefreshing: boolean) => void
}

interface DashboardComputed {
  hasUnsavedCapture: () => boolean
  focusPlaceholder: () => string
}

type DashboardStore = DashboardState & DashboardActions & DashboardComputed

// ============================================================================
// Dashboard Store Implementation
// ============================================================================

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      // ========================================================================
      // State
      // ========================================================================
      todaysFocus: '',
      quickCaptureBuffer: '',
      flowState: FlowState.NEUTRAL,
      lastRefresh: null,
      isRefreshing: false,

      // ========================================================================
      // Actions
      // ========================================================================

      /**
       * Set today's focus text
       * Note: Should be debounced at component level to avoid excessive API calls
       */
      setTodaysFocus: (focus) => {
        set({ todaysFocus: focus })
      },

      /**
       * Update quick capture buffer (unsaved note text)
       */
      updateQuickCaptureBuffer: (text) => {
        set({ quickCaptureBuffer: text })
      },

      /**
       * Clear quick capture buffer after successfully creating a note
       */
      clearQuickCaptureBuffer: () => {
        set({ quickCaptureBuffer: '' })
      },

      /**
       * Manually update flow state from VibeMeter component
       */
      setFlowState: (state) => {
        set({ flowState: state })
      },

      /**
       * Refresh dashboard data (called after significant actions)
       */
      refreshDashboard: () => {
        set({ lastRefresh: new Date() })
      },

      /**
       * Update refreshing status (for loading indicators)
       */
      setRefreshing: (isRefreshing) => {
        set({ isRefreshing })
      },

      // ========================================================================
      // Computed Getters
      // ========================================================================

      /**
       * Check if there's unsaved quick capture text
       */
      hasUnsavedCapture: () => {
        const state = get()
        return state.quickCaptureBuffer.length > 0
      },

      /**
       * Get contextual placeholder text based on time of day
       */
      focusPlaceholder: () => {
        const timeOfDay = getTimeOfDay()

        switch (timeOfDay) {
          case 'morning':
            return "What's your morning focus?"
          case 'afternoon':
            return "What's your afternoon goal?"
          case 'evening':
            return "What are you working on this evening?"
          case 'night':
            return "What's your late-night mission?"
          default:
            return "What are you focusing on today?"
        }
      },
    }),
    {
      name: 'flowforge-dashboard-store',
      // Only persist long-term state, exclude temporary UI state
      partialize: (state) => ({
        todaysFocus: state.todaysFocus,
        flowState: state.flowState,
      }),
    }
  )
)
