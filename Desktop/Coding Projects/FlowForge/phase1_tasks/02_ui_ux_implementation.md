# UI/UX Implementation Tasks (4-6)
**Interface Development & User Experience**

## Overview

The UI/UX Implementation layer creates FlowForge's distinctive "Ambient Intelligence" interface that protects flow states while providing essential productivity insights for AI-assisted developers.

**Timeline**: Month 1, Week 2-4  
**Dependencies**: Foundation Layer Tasks (1-3)  
**Design Philosophy**: Ambient Intelligence - gentle, non-intrusive, vibe-centric

---

## Task 4: Build Complete UI Component Library 🎨

### Objective
Create the comprehensive UI design system using Tailwind CSS and Radix UI primitives, implementing the "Ambient Intelligence" design philosophy with flow state colors, responsive layouts, and accessibility features.

### Design System Specifications

#### Color Palette & Design Tokens
```css
/* src/styles/design-tokens.css */
:root {
  /* Flow States */
  --flow-active: #00D9A5;    /* Productive, in-the-zone */
  --flow-warning: #FFB800;   /* Context degradation warning */
  --flow-blocked: #FF4757;   /* Stuck, need intervention */
  
  /* AI Model Colors */
  --claude-purple: #7C3AED;
  --gpt-teal: #06B6D4;
  --gemini-orange: #FF6B35;
  --local-gray: #6B7280;
  
  /* Neutral Palette */
  --bg-primary: #FAFAFA;
  --bg-secondary: #F5F5F5;
  --bg-card: #FFFFFF;
  --text-primary: #1A1A1A;
  --text-secondary: #6B7280;
  --text-muted: #9CA3AF;
  --border-light: #E5E7EB;
  
  /* Shadows & Elevation */
  --shadow-ambient: 0 1px 3px 0 rgb(0 0 0 / 0.05);
  --shadow-elevated: 0 4px 12px 0 rgb(0 0 0 / 0.08);
  --shadow-focused: 0 8px 25px 0 rgb(0 0 0 / 0.12);
}
```

#### Core UI Components

**Button Component with Flow States**
```typescript
// src/components/ui/button.tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        flow: 'bg-flow-active text-white hover:bg-emerald-600 hover:scale-105',
        warning: 'bg-flow-warning text-white hover:bg-yellow-600',
        blocked: 'bg-flow-blocked text-white hover:bg-red-600',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

**Ambient Card Component**
```typescript
// src/components/ui/ambient-card.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

interface AmbientCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean
  pulse?: boolean
  elevation?: 'low' | 'medium' | 'high'
}

const AmbientCard = React.forwardRef<HTMLDivElement, AmbientCardProps>(
  ({ className, glow = false, pulse = false, elevation = 'low', ...props }, ref) => {
    const elevationClasses = {
      low: 'shadow-ambient',
      medium: 'shadow-elevated',
      high: 'shadow-focused'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border bg-card text-card-foreground transition-all duration-300',
          elevationClasses[elevation],
          glow && 'ring-1 ring-flow-active/20',
          pulse && 'animate-pulse',
          'hover:shadow-elevated hover:translate-y-[-1px]',
          className
        )}
        {...props}
      />
    )
  }
)
AmbientCard.displayName = 'AmbientCard'

export { AmbientCard }
```

**Flow State Indicator**
```typescript
// src/components/ui/flow-indicator.tsx
import { cn } from '@/lib/utils'

interface FlowIndicatorProps {
  state: 'blocked' | 'neutral' | 'flowing' | 'deep-flow'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animate?: boolean
}

const flowStateConfig = {
  'blocked': {
    color: 'bg-flow-blocked',
    label: 'Blocked',
    pulse: 'animate-pulse'
  },
  'neutral': {
    color: 'bg-gray-400',
    label: 'Neutral',
    pulse: ''
  },
  'flowing': {
    color: 'bg-flow-active',
    label: 'Flowing',
    pulse: 'animate-pulse'
  },
  'deep-flow': {
    color: 'bg-gradient-to-r from-purple-500 to-teal-500',
    label: 'Deep Flow',
    pulse: 'animate-bounce'
  }
}

export function FlowIndicator({ 
  state, 
  size = 'md', 
  showLabel = false, 
  animate = true 
}: FlowIndicatorProps) {
  const config = flowStateConfig[state]
  
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-6 h-6'
  }

  return (
    <div className="flex items-center space-x-2">
      <div 
        className={cn(
          'rounded-full',
          config.color,
          sizeClasses[size],
          animate && config.pulse
        )}
      />
      {showLabel && (
        <span className="text-sm font-medium text-muted-foreground">
          {config.label}
        </span>
      )}
    </div>
  )
}
```

**Progress Visualization Component**
```typescript
// src/components/ui/feels-right-progress.tsx
import { Star, Smile, Meh, Frown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeelsRightProgressProps {
  value: number // 0-100
  interactive?: boolean
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
}

export function FeelsRightProgress({ 
  value, 
  interactive = false, 
  onChange,
  size = 'md' 
}: FeelsRightProgressProps) {
  const getEmoji = (percentage: number) => {
    if (percentage >= 80) return <Smile className="w-4 h-4 text-flow-active" />
    if (percentage >= 60) return <Meh className="w-4 h-4 text-flow-warning" />
    if (percentage >= 40) return <Meh className="w-4 h-4 text-gray-500" />
    return <Frown className="w-4 h-4 text-flow-blocked" />
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'from-flow-active to-emerald-400'
    if (percentage >= 50) return 'from-flow-warning to-yellow-400' 
    return 'from-flow-blocked to-red-400'
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getEmoji(value)}
          <span className="text-sm font-medium">Feels Right</span>
        </div>
        <span className="text-sm text-muted-foreground">{Math.round(value)}%</span>
      </div>
      
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={cn(
              'h-2 rounded-full transition-all duration-500 bg-gradient-to-r',
              getProgressColor(value)
            )}
            style={{ width: `${value}%` }}
          />
        </div>
        
        {/* Glow effect for high progress */}
        {value > 75 && (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-flow-active/30 to-emerald-400/30 rounded-full animate-pulse"
            style={{ width: `${value}%` }}
          />
        )}
      </div>

      {interactive && (
        <div className="flex space-x-1 pt-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => onChange?.(rating * 20)}
              className={cn(
                'p-1 rounded-lg transition-colors',
                Math.ceil(value / 20) >= rating 
                  ? 'text-flow-active' 
                  : 'text-gray-300 hover:text-gray-500'
              )}
            >
              <Star className={cn(
                'w-4 h-4',
                Math.ceil(value / 20) >= rating && 'fill-current'
              )} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

#### Responsive Layout System

**Mobile-First Grid System**
```css
/* src/styles/layout.css */
.dashboard-grid {
  display: grid;
  gap: 1.5rem;
  
  /* Mobile: Single column */
  grid-template-columns: 1fr;
  
  /* Tablet: Two columns */
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
  
  /* Desktop: Three columns with sidebar */
  @media (min-width: 1024px) {
    grid-template-columns: 2fr 1fr;
  }
}

.touch-friendly {
  min-height: 44px; /* iOS minimum touch target */
  min-width: 44px;
  touch-action: manipulation;
}
```

### Implementation Steps

1. **Set up Design Token System**
   ```bash
   # Install dependencies
   npm install class-variance-authority clsx tailwind-merge
   npm install @radix-ui/react-slot
   npm install lucide-react # For consistent icons
   ```

2. **Create Base UI Components**
   - Button with flow state variants
   - Card components with ambient styling
   - Input components with validation states
   - Loading states and skeletons
   - Modal and dialog components

3. **Implement Typography System**
   ```css
   /* src/styles/typography.css */
   .text-hero { @apply text-3xl md:text-4xl font-bold tracking-tight; }
   .text-heading { @apply text-xl md:text-2xl font-semibold; }
   .text-subheading { @apply text-lg font-medium; }
   .text-body { @apply text-base leading-relaxed; }
   .text-caption { @apply text-sm text-muted-foreground; }
   ```

4. **Create Animation Library**
   ```css
   /* Custom animations for ambient intelligence */
   @keyframes gentle-pulse {
     0%, 100% { opacity: 0.8; }
     50% { opacity: 1; }
   }
   
   @keyframes flow-glow {
     0%, 100% { box-shadow: 0 0 5px rgba(0, 217, 165, 0.3); }
     50% { box-shadow: 0 0 20px rgba(0, 217, 165, 0.6); }
   }
   
   .animate-gentle-pulse { animation: gentle-pulse 3s ease-in-out infinite; }
   .animate-flow-glow { animation: flow-glow 2s ease-in-out infinite; }
   ```

5. **Build Accessibility Foundation**
   - ARIA labels for all interactive elements
   - Keyboard navigation support
   - Screen reader compatibility
   - High contrast mode support
   - Focus management system

### Acceptance Criteria
- [ ] Complete component library with all base UI elements
- [ ] Flow state colors implemented throughout design system
- [ ] Mobile-first responsive design working on all screen sizes
- [ ] Accessibility standards met (WCAG 2.1 AA compliance)
- [ ] Design tokens consistently applied across components
- [ ] Smooth animations and micro-interactions
- [ ] Dark mode support implemented
- [ ] Touch-friendly interfaces with 44px minimum targets

### Testing Requirements
- [ ] Component library renders correctly in Storybook
- [ ] All components responsive across device sizes
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader announces all important state changes
- [ ] Color contrast ratios meet accessibility standards

---

## Task 5: Create Main Dashboard Layout 📱

### Objective
Build the central dashboard interface with responsive navigation, Today's Focus hero card, Vibe Meter, Active Session display, Ship Streak tracker, and Quick Capture functionality.

### Dashboard Architecture

#### Main Layout Structure
```typescript
// src/app/(dashboard)/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/layout/dashboard-nav'
import { MobileNav } from '@/components/layout/mobile-nav'
import { QuickCapture } from '@/components/dashboard/quick-capture'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Desktop Navigation */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:overflow-y-auto lg:bg-white lg:border-r">
        <DashboardNav />
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNav />
      </div>

      {/* Main Content Area */}
      <main className="lg:pl-64">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Capture - Always Accessible */}
          <div className="fixed bottom-4 right-4 lg:bottom-8 lg:right-8 z-40">
            <QuickCapture />
          </div>
          
          {children}
        </div>
      </main>
    </div>
  )
}
```

#### Today's Focus Hero Card
```typescript
// src/components/dashboard/todays-focus.tsx
'use client'

import { useState } from 'react'
import { AmbientCard } from '@/components/ui/ambient-card'
import { Button } from '@/components/ui/button'
import { FlowIndicator } from '@/components/ui/flow-indicator'
import { Target, Edit3, Play } from 'lucide-react'

interface TodaysFocusProps {
  currentFocus?: string
  flowState: 'blocked' | 'neutral' | 'flowing' | 'deep-flow'
  onUpdateFocus: (focus: string) => void
  onStartSession: () => void
}

export function TodaysFocus({
  currentFocus,
  flowState,
  onUpdateFocus,
  onStartSession
}: TodaysFocusProps) {
  const [isEditing, setIsEditing] = useState(!currentFocus)
  const [focusText, setFocusText] = useState(currentFocus || '')

  const handleSaveFocus = () => {
    if (focusText.trim()) {
      onUpdateFocus(focusText.trim())
      setIsEditing(false)
    }
  }

  return (
    <AmbientCard 
      className="p-6 lg:p-8"
      glow={flowState === 'flowing' || flowState === 'deep-flow'}
      elevation="medium"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Today's Focus</h2>
          </div>
          <FlowIndicator state={flowState} showLabel />
        </div>

        {/* Focus Content */}
        <div className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <textarea
                value={focusText}
                onChange={(e) => setFocusText(e.target.value)}
                placeholder="What's the main thing you want to ship today?"
                className="w-full p-4 border border-border-light rounded-lg resize-none focus:ring-2 focus:ring-flow-active focus:border-transparent"
                rows={3}
                autoFocus
              />
              <div className="flex space-x-2">
                <Button 
                  onClick={handleSaveFocus}
                  variant="flow"
                  disabled={!focusText.trim()}
                >
                  Set Focus
                </Button>
                {currentFocus && (
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setFocusText(currentFocus)
                      setIsEditing(false)
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <p className="text-lg leading-relaxed text-text-primary min-h-[3rem] p-4 bg-bg-secondary rounded-lg">
                  {currentFocus}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="absolute top-2 right-2"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex space-x-3">
                <Button 
                  onClick={onStartSession}
                  variant="flow"
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Deep Work
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AmbientCard>
  )
}
```

#### Vibe Meter Component
```typescript
// src/components/dashboard/vibe-meter.tsx
'use client'

import { AmbientCard } from '@/components/ui/ambient-card'
import { FlowIndicator } from '@/components/ui/flow-indicator'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface VibeMeterProps {
  currentState: 'blocked' | 'neutral' | 'flowing' | 'deep-flow'
  onStateChange: (state: 'blocked' | 'neutral' | 'flowing' | 'deep-flow') => void
  lastUpdated?: Date
}

const vibeOptions = [
  { state: 'blocked', label: 'Blocked', icon: TrendingDown, color: 'text-flow-blocked' },
  { state: 'neutral', label: 'Neutral', icon: Minus, color: 'text-gray-500' },
  { state: 'flowing', label: 'Flowing', icon: TrendingUp, color: 'text-flow-active' },
  { state: 'deep-flow', label: 'Deep Flow', icon: TrendingUp, color: 'text-purple-500' },
] as const

export function VibeMeter({ currentState, onStateChange, lastUpdated }: VibeMeterProps) {
  return (
    <AmbientCard className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Vibe Check</h3>
          <FlowIndicator state={currentState} animate />
        </div>

        <div className="space-y-2">
          {vibeOptions.map(({ state, label, icon: Icon, color }) => (
            <button
              key={state}
              onClick={() => onStateChange(state)}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                currentState === state
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${currentState === state ? color : 'text-gray-400'}`} />
              <span className={`font-medium ${
                currentState === state ? 'text-primary' : 'text-text-secondary'
              }`}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {lastUpdated && (
          <p className="text-xs text-muted-foreground text-center">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
    </AmbientCard>
  )
}
```

#### Ship Streak Tracker
```typescript
// src/components/dashboard/ship-streak.tsx
'use client'

import { AmbientCard } from '@/components/ui/ambient-card'
import { Button } from '@/components/ui/button'
import { Flame, Calendar, Trophy } from 'lucide-react'

interface ShipStreakProps {
  currentStreak: number
  longestStreak: number
  lastShipDate?: Date
  onRecordShip: () => void
}

export function ShipStreak({ 
  currentStreak, 
  longestStreak, 
  lastShipDate,
  onRecordShip 
}: ShipStreakProps) {
  const isToday = lastShipDate && 
    lastShipDate.toDateString() === new Date().toDateString()

  const streakEmoji = currentStreak >= 7 ? '🔥' : 
                      currentStreak >= 3 ? '⚡' : '🚀'

  return (
    <AmbientCard 
      className="p-6"
      glow={currentStreak >= 3}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Ship Streak</h3>
          <div className="text-2xl">{streakEmoji}</div>
        </div>

        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-primary">
            {currentStreak}
          </div>
          <p className="text-sm text-muted-foreground">
            {currentStreak === 0 ? 'Ready to start?' : 
             currentStreak === 1 ? 'Day shipping' : 
             'Days shipping'}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>Best streak</span>
            </div>
            <span className="font-medium">{longestStreak}</span>
          </div>

          {lastShipDate && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Last ship</span>
              </div>
              <span className="font-medium">
                {isToday ? 'Today!' : lastShipDate.toLocaleDateString()}
              </span>
            </div>
          )}

          <Button
            onClick={onRecordShip}
            variant={isToday ? "outline" : "flow"}
            className="w-full"
            disabled={isToday}
          >
            {isToday ? "Shipped today! 🎉" : "I shipped something!"}
          </Button>
        </div>
      </div>
    </AmbientCard>
  )
}
```

#### Quick Capture Component
```typescript
// src/components/dashboard/quick-capture.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AmbientCard } from '@/components/ui/ambient-card'
import { Plus, Send, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface QuickCaptureProps {
  onCapture: (content: string) => void
}

export function QuickCapture({ onCapture }: QuickCaptureProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('')

  const handleSubmit = () => {
    if (content.trim()) {
      onCapture(content.trim())
      setContent('')
      setIsOpen(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setIsOpen(false)
      setContent('')
    }
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 right-0 w-80"
          >
            <AmbientCard className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Quick Capture</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Capture an idea, insight, or todo..."
                  className="w-full p-3 border border-border-light rounded-lg resize-none focus:ring-2 focus:ring-flow-active focus:border-transparent"
                  rows={4}
                  autoFocus
                />
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    ⌘↵ to save, Esc to cancel
                  </span>
                  <Button
                    onClick={handleSubmit}
                    variant="flow"
                    size="sm"
                    disabled={!content.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </AmbientCard>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(true)}
        variant="flow"
        size="lg"
        className="rounded-full shadow-lg hover:shadow-xl"
      >
        <Plus className="w-5 h-5" />
      </Button>
    </div>
  )
}
```

### Implementation Steps

1. **Create Layout Architecture**
   - Set up dashboard layout with responsive navigation
   - Implement mobile-first responsive breakpoints
   - Add accessibility navigation landmarks

2. **Build Core Dashboard Components**
   - Today's Focus hero card with editing capability
   - Vibe Meter for flow state tracking
   - Ship Streak with gamification elements
   - Quick Capture floating action button

3. **Implement Responsive Navigation**
   - Desktop sidebar navigation
   - Mobile bottom tab navigation
   - Proper active states and indicators

4. **Add Micro-interactions**
   - Smooth transitions between states
   - Gentle hover effects
   - Loading states for async operations

5. **Mobile Optimization**
   - Touch-friendly button sizes (44px minimum)
   - Swipe gestures where appropriate
   - Proper viewport meta tags

### Acceptance Criteria
- [ ] Dashboard layout responsive across all screen sizes
- [ ] Today's Focus card allows inline editing
- [ ] Vibe Meter updates flow state smoothly
- [ ] Ship Streak tracks and celebrates achievements
- [ ] Quick Capture accessible from any dashboard page
- [ ] Navigation works seamlessly on mobile and desktop
- [ ] All interactions feel smooth and responsive
- [ ] Accessibility standards met throughout

### Testing Requirements
- [ ] Dashboard loads quickly on all device sizes
- [ ] All interactive elements work with keyboard navigation
- [ ] Touch targets meet 44px minimum on mobile
- [ ] Flow state changes animate smoothly
- [ ] Quick Capture keyboard shortcuts work

---

## Task 6: Build Real-Time Session Tracking System ⚡

### Objective
Implement comprehensive session tracking with WebSocket connections, session types (Building/Exploring/Debugging/Shipping), AI model selection, context health monitoring, and timer functionality.

### Session Architecture

#### Session Management Hook
```typescript
// src/hooks/use-session.ts
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import io, { Socket } from 'socket.io-client'

export type SessionType = 'building' | 'exploring' | 'debugging' | 'shipping'
export type AIModel = 'claude' | 'gpt' | 'gemini' | 'local'
export type SessionStatus = 'flowing' | 'stuck' | 'shipped' | 'abandoned'

interface ActiveSession {
  id: string
  type: SessionType
  aiModel: AIModel
  projectId?: string
  startedAt: Date
  duration: number // in seconds
  contextHealth: number // 0-100
  status: SessionStatus
  notes?: string
}

export function useSessionTracking() {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  // Initialize WebSocket connection
  useEffect(() => {
    if (!session?.user) return

    const socketInstance = io(process.env.NEXT_PUBLIC_SITE_URL!, {
      path: '/api/socket',
      query: { userId: session.user.id }
    })

    socketInstance.on('connect', () => {
      setIsConnected(true)
      console.log('Session tracking connected')
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
    })

    socketInstance.on('session-updated', (updatedSession: ActiveSession) => {
      setActiveSession(updatedSession)
    })

    socketInstance.on('context-health-update', ({ health }: { health: number }) => {
      setActiveSession(prev => prev ? { ...prev, contextHealth: health } : null)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [session?.user])

  // Timer for active sessions
  useEffect(() => {
    if (activeSession && activeSession.status === 'flowing') {
      timerRef.current = setInterval(() => {
        setActiveSession(prev => prev ? {
          ...prev,
          duration: prev.duration + 1
        } : null)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [activeSession?.status])

  const startSession = useCallback(async (
    type: SessionType,
    aiModel: AIModel,
    projectId?: string
  ) => {
    if (!socket || !session?.user) return

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          aiModel,
          projectId,
          userId: session.user.id
        })
      })

      if (response.ok) {
        const newSession = await response.json()
        const sessionData: ActiveSession = {
          id: newSession.id,
          type,
          aiModel,
          projectId,
          startedAt: new Date(),
          duration: 0,
          contextHealth: 100,
          status: 'flowing'
        }
        
        setActiveSession(sessionData)
        socket.emit('session:start', sessionData)
      }
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }, [socket, session?.user])

  const endSession = useCallback(async (
    status: SessionStatus = 'shipped',
    notes?: string
  ) => {
    if (!activeSession || !socket) return

    try {
      await fetch(`/api/sessions/${activeSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endedAt: new Date(),
          duration: activeSession.duration,
          status,
          notes,
          contextHealth: activeSession.contextHealth
        })
      })

      socket.emit('session:end', { 
        sessionId: activeSession.id, 
        status,
        duration: activeSession.duration 
      })
      
      setActiveSession(null)
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }, [activeSession, socket])

  const updateContextHealth = useCallback((health: number) => {
    if (!activeSession || !socket) return

    setActiveSession(prev => prev ? { ...prev, contextHealth: health } : null)
    socket.emit('context:update', { 
      sessionId: activeSession.id, 
      health 
    })
  }, [activeSession, socket])

  const addCheckpoint = useCallback(async (notes: string) => {
    if (!activeSession) return

    try {
      await fetch(`/api/sessions/${activeSession.id}/checkpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, timestamp: new Date() })
      })
    } catch (error) {
      console.error('Failed to add checkpoint:', error)
    }
  }, [activeSession])

  return {
    activeSession,
    isConnected,
    startSession,
    endSession,
    updateContextHealth,
    addCheckpoint
  }
}
```

#### Active Session Display
```typescript
// src/components/dashboard/active-session.tsx
'use client'

import { AmbientCard } from '@/components/ui/ambient-card'
import { Button } from '@/components/ui/button'
import { FlowIndicator } from '@/components/ui/flow-indicator'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Brain, 
  Zap,
  Code,
  Ship,
  Bookmark
} from 'lucide-react'
import { useSessionTracking } from '@/hooks/use-session'

const sessionTypeConfig = {
  building: { icon: Code, label: 'Building', color: 'bg-blue-500' },
  exploring: { icon: Brain, label: 'Exploring', color: 'bg-purple-500' },
  debugging: { icon: Zap, label: 'Debugging', color: 'bg-yellow-500' },
  shipping: { icon: Ship, label: 'Shipping', color: 'bg-green-500' }
}

const aiModelConfig = {
  claude: { label: 'Claude', color: 'bg-purple-600' },
  gpt: { label: 'GPT-4', color: 'bg-teal-600' },
  gemini: { label: 'Gemini', color: 'bg-orange-600' },
  local: { label: 'Local', color: 'bg-gray-600' }
}

export function ActiveSession() {
  const { activeSession, endSession, addCheckpoint } = useSessionTracking()

  if (!activeSession) {
    return (
      <AmbientCard className="p-6">
        <div className="text-center space-y-4">
          <div className="text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No active session</p>
          </div>
          <Button variant="outline">
            <Play className="w-4 h-4 mr-2" />
            Start Session
          </Button>
        </div>
      </AmbientCard>
    )
  }

  const sessionType = sessionTypeConfig[activeSession.type]
  const aiModel = aiModelConfig[activeSession.aiModel]
  const SessionIcon = sessionType.icon

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getContextHealthColor = () => {
    if (activeSession.contextHealth > 80) return 'text-flow-active'
    if (activeSession.contextHealth > 60) return 'text-flow-warning'
    return 'text-flow-blocked'
  }

  return (
    <AmbientCard 
      className="p-6"
      glow={activeSession.status === 'flowing'}
      pulse={activeSession.contextHealth < 30}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${sessionType.color} text-white`}>
              <SessionIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">{sessionType.label} Session</h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={aiModel.color}>
                  {aiModel.label}
                </Badge>
                <FlowIndicator state="flowing" size="sm" />
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-mono font-bold">
              {formatDuration(activeSession.duration)}
            </div>
            <div className="text-sm text-muted-foreground">
              Active
            </div>
          </div>
        </div>

        {/* Context Health */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">AI Context Health</span>
            <span className={`text-sm font-bold ${getContextHealthColor()}`}>
              {Math.round(activeSession.contextHealth)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                activeSession.contextHealth > 80 ? 'bg-flow-active' :
                activeSession.contextHealth > 60 ? 'bg-flow-warning' :
                'bg-flow-blocked'
              }`}
              style={{ width: `${activeSession.contextHealth}%` }}
            />
          </div>
          {activeSession.contextHealth < 50 && (
            <p className="text-xs text-flow-blocked">
              Consider refreshing your AI context for better performance
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addCheckpoint('Manual checkpoint')}
          >
            <Bookmark className="w-4 h-4 mr-2" />
            Checkpoint
          </Button>
          
          <Button
            variant="warning"
            size="sm"
            onClick={() => endSession('stuck')}
          >
            <Pause className="w-4 h-4 mr-2" />
            Stuck
          </Button>
          
          <Button
            variant="flow"
            size="sm"
            onClick={() => endSession('shipped')}
          >
            <Ship className="w-4 h-4 mr-2" />
            Shipped!
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => endSession('abandoned')}
          >
            <Square className="w-4 h-4 mr-2" />
            End
          </Button>
        </div>
      </div>
    </AmbientCard>
  )
}
```

#### Session Start Dialog
```typescript
// src/components/dashboard/session-start-dialog.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSessionTracking, SessionType, AIModel } from '@/hooks/use-session'
import { Code, Brain, Zap, Ship } from 'lucide-react'

interface SessionStartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const sessionTypes = [
  { value: 'building', label: 'Building', icon: Code, description: 'Implementation and feature development' },
  { value: 'exploring', label: 'Exploring', icon: Brain, description: 'Research and experimentation' },
  { value: 'debugging', label: 'Debugging', icon: Zap, description: 'Problem-solving and fixes' },
  { value: 'shipping', label: 'Shipping', icon: Ship, description: 'Deployment and release activities' },
] as const

const aiModels = [
  { value: 'claude', label: 'Claude 3.5 Sonnet', description: 'Best for complex reasoning and code' },
  { value: 'gpt', label: 'GPT-4', description: 'Great for general development tasks' },
  { value: 'gemini', label: 'Gemini Pro', description: 'Good for multimodal tasks' },
  { value: 'local', label: 'Local Model', description: 'Privacy-focused local processing' },
] as const

export function SessionStartDialog({ open, onOpenChange }: SessionStartDialogProps) {
  const [sessionType, setSessionType] = useState<SessionType>('building')
  const [aiModel, setAIModel] = useState<AIModel>('claude')
  const [projectId, setProjectId] = useState<string>()
  
  const { startSession } = useSessionTracking()

  const handleStart = async () => {
    await startSession(sessionType, aiModel, projectId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Session</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Session Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Session Type</label>
            <div className="grid grid-cols-2 gap-2">
              {sessionTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    onClick={() => setSessionType(type.value)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      sessionType === type.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{type.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* AI Model */}
          <div className="space-y-3">
            <label className="text-sm font-medium">AI Model</label>
            <Select value={aiModel} onValueChange={(value) => setAIModel(value as AIModel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {aiModels.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    <div>
                      <div className="font-medium">{model.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {model.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="flow" onClick={handleStart}>
              Start Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Implementation Steps

1. **Set up WebSocket Infrastructure**
   ```bash
   npm install socket.io-client
   ```

2. **Create Session API Routes**
   - POST /api/sessions (start session)
   - PATCH /api/sessions/[id] (update/end session)
   - POST /api/sessions/[id]/checkpoint (add checkpoint)

3. **Implement Real-time Connection**
   - WebSocket server for session updates
   - Context health monitoring integration
   - Connection recovery and error handling

4. **Build Session Components**
   - Session start dialog with type/model selection
   - Active session display with timer
   - Context health visualization
   - Quick action buttons

5. **Add Persistence**
   - Save sessions to database
   - Sync with AI context monitoring
   - Handle offline scenarios

### Acceptance Criteria
- [ ] Session tracking works across browser tabs/refreshes
- [ ] WebSocket connection handles disconnections gracefully
- [ ] Timer accuracy maintained during system sleep/wake
- [ ] AI context health updates in real-time
- [ ] Session data persists properly in database
- [ ] All session types and AI models supported
- [ ] Checkpoint functionality works smoothly
- [ ] Mobile interface remains responsive during sessions

### Testing Requirements
- [ ] WebSocket connection reliability tested
- [ ] Session timer accuracy verified
- [ ] Context health monitoring functional
- [ ] Database persistence working correctly
- [ ] Mobile session interface tested thoroughly

---

## UI/UX Implementation Summary

Upon completion of these 3 tasks:

✅ **Design System Ready**: Complete component library with "Ambient Intelligence" philosophy  
✅ **Dashboard Functional**: Responsive layout with all core components  
✅ **Real-time Tracking**: WebSocket-powered session management system  

**Next Phase**: [Core Features Tasks](./03_core_features.md) →

**Foundation Complete**: UI framework ready for advanced feature implementation