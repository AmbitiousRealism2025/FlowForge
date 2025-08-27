/**
 * Phase 1 UI/UX Implementation Tests (Tasks 4-6)
 * FlowForge - AI-Productivity Companion for Vibe Coders
 * 
 * Testing Strategy: TDD approach with failing tests for:
 * - Task 4: Design System & Component Library
 * - Task 5: Main Dashboard Implementation  
 * - Task 6: Session Tracking Interface
 * 
 * Focus: "Ambient Intelligence" design, flow-state protection, mobile-first responsive
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock providers and dependencies
const MockProviders = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-providers">{children}</div>
);

// =============================================================================
// TASK 4: DESIGN SYSTEM & COMPONENT LIBRARY TESTS
// =============================================================================

describe('Task 4: Design System & Component Library', () => {
  describe('FlowForge Color Palette', () => {
    it('should implement FlowForge brand colors in CSS variables', () => {
      // Test CSS custom properties are defined
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      
      expect(computedStyle.getPropertyValue('--flow-green')).toBe('#00D9A5');
      expect(computedStyle.getPropertyValue('--caution-amber')).toBe('#FFB800');
      expect(computedStyle.getPropertyValue('--stuck-red')).toBe('#FF4757');
      expect(computedStyle.getPropertyValue('--claude-purple')).toBe('#7C3AED');
      expect(computedStyle.getPropertyValue('--neutral-slate')).toBe('#2F3542');
    });

    it('should apply flow-state specific colors correctly', () => {
      const { FlowStateIndicator } = require('@/components/ui/flow-state-indicator');
      
      const { rerender } = render(<FlowStateIndicator state="FLOWING" />);
      expect(screen.getByTestId('flow-indicator')).toHaveClass('text-flow-green');
      
      rerender(<FlowStateIndicator state="BLOCKED" />);
      expect(screen.getByTestId('flow-indicator')).toHaveClass('text-stuck-red');
      
      rerender(<FlowStateIndicator state="NEUTRAL" />);
      expect(screen.getByTestId('flow-indicator')).toHaveClass('text-neutral-slate');
      
      rerender(<FlowStateIndicator state="DEEP_FLOW" />);
      expect(screen.getByTestId('flow-indicator')).toHaveClass('text-claude-purple');
    });
  });

  describe('Radix UI Component Integration', () => {
    it('should render accessible Button component with proper ARIA attributes', async () => {
      const { Button } = require('@/components/ui/button');
      
      render(
        <Button variant="primary" size="md" disabled={false}>
          Start Flow Session
        </Button>
      );
      
      const button = screen.getByRole('button', { name: /start flow session/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
      expect(button).not.toHaveAttribute('aria-disabled');
      
      // Test accessibility
      const results = await axe(button);
      expect(results).toHaveNoViolations();
    });

    it('should implement responsive Dialog component', async () => {
      const { Dialog, DialogTrigger, DialogContent } = require('@/components/ui/dialog');
      
      render(
        <Dialog>
          <DialogTrigger asChild>
            <button>Open Session Config</button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
            <div data-testid="dialog-content">Session Configuration</div>
          </DialogContent>
        </Dialog>
      );
      
      const trigger = screen.getByRole('button', { name: /open session config/i });
      await userEvent.click(trigger);
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('aria-modal', 'true');
      });
      
      // Test responsive classes
      const content = screen.getByTestId('dialog-content');
      expect(content.parentElement).toHaveClass('sm:max-w-md', 'md:max-w-lg', 'lg:max-w-xl');
    });

    it('should provide accessible Select component with keyboard navigation', async () => {
      const { Select, SelectTrigger, SelectContent, SelectItem } = require('@/components/ui/select');
      
      render(
        <Select defaultValue="BUILDING">
          <SelectTrigger>
            <span data-testid="select-value">BUILDING</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BUILDING">Building</SelectItem>
            <SelectItem value="EXPLORING">Exploring</SelectItem>
            <SelectItem value="DEBUGGING">Debugging</SelectItem>
            <SelectItem value="SHIPPING">Shipping</SelectItem>
          </SelectContent>
        </Select>
      );
      
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      
      // Test keyboard interaction
      await userEvent.keyboard('{Enter}');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      
      // Test accessibility
      const results = await axe(screen.getByRole('combobox'));
      expect(results).toHaveNoViolations();
    });
  });

  describe('Typography and Spacing System', () => {
    it('should implement consistent typography scale', () => {
      const { Typography } = require('@/components/ui/typography');
      
      render(
        <div>
          <Typography variant="h1" data-testid="h1">Main Title</Typography>
          <Typography variant="h2" data-testid="h2">Section Title</Typography>
          <Typography variant="body" data-testid="body">Body text</Typography>
          <Typography variant="caption" data-testid="caption">Caption text</Typography>
        </div>
      );
      
      expect(screen.getByTestId('h1')).toHaveClass('text-3xl', 'font-bold');
      expect(screen.getByTestId('h2')).toHaveClass('text-xl', 'font-semibold');
      expect(screen.getByTestId('body')).toHaveClass('text-base');
      expect(screen.getByTestId('caption')).toHaveClass('text-sm', 'text-neutral-slate');
    });

    it('should implement consistent spacing system', () => {
      const { Card, CardHeader, CardContent } = require('@/components/ui/card');
      
      render(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <h2>Flow Session</h2>
          </CardHeader>
          <CardContent data-testid="content">
            <p>Session content</p>
          </CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      const header = screen.getByTestId('header');
      const content = screen.getByTestId('content');
      
      expect(card).toHaveClass('p-6');
      expect(header).toHaveClass('pb-4');
      expect(content).toHaveClass('pt-0');
    });
  });

  describe('Shadcn/ui Component Library Setup', () => {
    it('should provide themeable components with CSS variables', () => {
      const { ThemeProvider } = require('@/components/providers/theme-provider');
      const { Button } = require('@/components/ui/button');
      
      render(
        <ThemeProvider theme="dark">
          <Button variant="outline" data-testid="themed-button">
            Themed Button
          </Button>
        </ThemeProvider>
      );
      
      const button = screen.getByTestId('themed-button');
      expect(button).toHaveClass('border-input', 'bg-background');
    });

    it('should support component composition patterns', () => {
      const { Card, CardHeader, CardTitle, CardContent } = require('@/components/ui/card');
      
      render(
        <Card>
          <CardHeader>
            <CardTitle>Session Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Active session content</p>
          </CardContent>
        </Card>
      );
      
      expect(screen.getByText('Session Overview')).toBeInTheDocument();
      expect(screen.getByText('Active session content')).toBeInTheDocument();
    });
  });
});

// =============================================================================
// TASK 5: MAIN DASHBOARD IMPLEMENTATION TESTS
// =============================================================================

describe('Task 5: Main Dashboard Implementation', () => {
  beforeEach(() => {
    // Mock date to ensure consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Today\'s Focus Display', () => {
    it('should display today\'s focus with ambient intelligence design', () => {
      const { TodaysFocus } = require('@/components/dashboard/todays-focus');
      
      const mockFocus = {
        project: 'FlowForge MVP',
        goal: 'Complete user authentication flow',
        priority: 'high',
        estimatedHours: 4
      };
      
      render(<TodaysFocus focus={mockFocus} />);
      
      expect(screen.getByText('FlowForge MVP')).toBeInTheDocument();
      expect(screen.getByText('Complete user authentication flow')).toBeInTheDocument();
      expect(screen.getByTestId('priority-indicator')).toHaveClass('bg-stuck-red');
      expect(screen.getByText('4h estimated')).toBeInTheDocument();
    });

    it('should handle empty focus state gracefully', () => {
      const { TodaysFocus } = require('@/components/dashboard/todays-focus');
      
      render(<TodaysFocus focus={null} />);
      
      expect(screen.getByText(/no focus set/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set focus/i })).toBeInTheDocument();
    });

    it('should update focus without disrupting flow state', async () => {
      const { TodaysFocus } = require('@/components/dashboard/todays-focus');
      const mockOnUpdate = jest.fn();
      
      const initialFocus = { project: 'Project A', goal: 'Goal A' };
      
      render(<TodaysFocus focus={initialFocus} onUpdate={mockOnUpdate} />);
      
      const editButton = screen.getByRole('button', { name: /edit focus/i });
      await userEvent.click(editButton);
      
      // Should not cause jarring UI changes
      expect(screen.getByRole('dialog')).toHaveClass('animate-in', 'fade-in-0');
    });
  });

  describe('Active AI Sessions Tracking', () => {
    it('should display active AI sessions with context health', () => {
      const { ActiveSessions } = require('@/components/dashboard/active-sessions');
      
      const mockSessions = [
        {
          id: '1',
          type: 'BUILDING',
          model: 'claude-3-sonnet',
          contextHealth: 85,
          duration: 1800000, // 30 minutes
          flowState: 'FLOWING'
        },
        {
          id: '2', 
          type: 'DEBUGGING',
          model: 'gpt-4-turbo',
          contextHealth: 60,
          duration: 900000, // 15 minutes
          flowState: 'NEUTRAL'
        }
      ];
      
      render(<ActiveSessions sessions={mockSessions} />);
      
      expect(screen.getByText('Building')).toBeInTheDocument();
      expect(screen.getByText('Debugging')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('30m')).toBeInTheDocument();
      expect(screen.getByText('15m')).toBeInTheDocument();
    });

    it('should highlight sessions with low context health', () => {
      const { ActiveSessions } = require('@/components/dashboard/active-sessions');
      
      const mockSessions = [{
        id: '1',
        type: 'BUILDING',
        contextHealth: 30,
        flowState: 'BLOCKED'
      }];
      
      render(<ActiveSessions sessions={mockSessions} />);
      
      const healthIndicator = screen.getByTestId('context-health-1');
      expect(healthIndicator).toHaveClass('text-stuck-red');
      expect(screen.getByText(/context refresh recommended/i)).toBeInTheDocument();
    });

    it('should provide non-intrusive session management', async () => {
      const { ActiveSessions } = require('@/components/dashboard/active-sessions');
      const mockOnPause = jest.fn();
      
      const mockSessions = [{
        id: '1',
        type: 'BUILDING',
        contextHealth: 85,
        flowState: 'DEEP_FLOW'
      }];
      
      render(<ActiveSessions sessions={mockSessions} onPause={mockOnPause} />);
      
      // Pause action should be subtle and not disruptive
      const pauseButton = screen.getByRole('button', { name: /pause session/i });
      expect(pauseButton).toHaveClass('opacity-70', 'hover:opacity-100');
      
      await userEvent.click(pauseButton);
      expect(mockOnPause).toHaveBeenCalledWith('1');
    });
  });

  describe('Ship Streak Visualization', () => {
    it('should display current ship streak with celebration', () => {
      const { ShipStreak } = require('@/components/dashboard/ship-streak');
      
      const mockStreak = {
        current: 7,
        best: 12,
        lastShip: new Date('2024-01-14T18:00:00Z'),
        streak: [true, true, true, true, true, true, true] // Last 7 days
      };
      
      render(<ShipStreak streak={mockStreak} />);
      
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText(/day streak/i)).toBeInTheDocument();
      expect(screen.getByText(/best: 12/i)).toBeInTheDocument();
      expect(screen.getByText(/yesterday/i)).toBeInTheDocument();
      
      // Should show celebration for active streak
      expect(screen.getByTestId('streak-indicator')).toHaveClass('text-flow-green');
    });

    it('should show streak history with visual indicators', () => {
      const { ShipStreak } = require('@/components/dashboard/ship-streak');
      
      const mockStreak = {
        current: 3,
        streak: [false, true, true, true] // Mixed streak
      };
      
      render(<ShipStreak streak={mockStreak} />);
      
      const streakDots = screen.getAllByTestId(/streak-day-/);
      expect(streakDots).toHaveLength(4);
      expect(streakDots[0]).toHaveClass('bg-neutral-slate'); // No ship
      expect(streakDots[1]).toHaveClass('bg-flow-green'); // Ship day
    });

    it('should handle broken streaks with encouragement', () => {
      const { ShipStreak } = require('@/components/dashboard/ship-streak');
      
      const mockStreak = {
        current: 0,
        best: 5,
        lastShip: new Date('2024-01-10T18:00:00Z') // 5 days ago
      };
      
      render(<ShipStreak streak={mockStreak} />);
      
      expect(screen.getByText(/ready for a fresh start/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ship something today/i })).toBeInTheDocument();
    });
  });

  describe('Vibe Meter Component', () => {
    it('should display current vibe with appropriate visualization', () => {
      const { VibeMeter } = require('@/components/dashboard/vibe-meter');
      
      const mockVibe = {
        level: 8.5,
        trend: 'improving',
        factors: ['Good AI context', 'Clear requirements', 'No blockers']
      };
      
      render(<VibeMeter vibe={mockVibe} />);
      
      expect(screen.getByText('8.5')).toBeInTheDocument();
      expect(screen.getByTestId('vibe-trend')).toHaveClass('text-flow-green');
      expect(screen.getByText('Good AI context')).toBeInTheDocument();
    });

    it('should provide contextual vibe improvement suggestions', () => {
      const { VibeMeter } = require('@/components/dashboard/vibe-meter');
      
      const mockVibe = {
        level: 3.2,
        trend: 'declining',
        factors: ['Context degraded', 'Multiple blockers']
      };
      
      render(<VibeMeter vibe={mockVibe} />);
      
      expect(screen.getByTestId('vibe-trend')).toHaveClass('text-stuck-red');
      expect(screen.getByText(/refresh ai context/i)).toBeInTheDocument();
      expect(screen.getByText(/take a break/i)).toBeInTheDocument();
    });

    it('should animate vibe changes smoothly', async () => {
      const { VibeMeter } = require('@/components/dashboard/vibe-meter');
      
      const { rerender } = render(<VibeMeter vibe={{ level: 5.0 }} />);
      
      act(() => {
        rerender(<VibeMeter vibe={{ level: 7.5 }} />);
      });
      
      const meter = screen.getByTestId('vibe-meter');
      expect(meter).toHaveClass('transition-all', 'duration-500');
    });
  });

  describe('Flow State Indicators', () => {
    it('should display current flow state with appropriate styling', () => {
      const { FlowStateDisplay } = require('@/components/dashboard/flow-state-display');
      
      render(<FlowStateDisplay state="DEEP_FLOW" duration={2400000} />); // 40 minutes
      
      expect(screen.getByText(/deep flow/i)).toBeInTheDocument();
      expect(screen.getByText('40m')).toBeInTheDocument();
      expect(screen.getByTestId('flow-state')).toHaveClass('text-claude-purple');
    });

    it('should show flow state transitions', () => {
      const { FlowStateDisplay } = require('@/components/dashboard/flow-state-display');
      
      const mockTransitions = [
        { state: 'NEUTRAL', timestamp: new Date('2024-01-15T09:00:00Z') },
        { state: 'FLOWING', timestamp: new Date('2024-01-15T09:30:00Z') },
        { state: 'DEEP_FLOW', timestamp: new Date('2024-01-15T10:00:00Z') }
      ];
      
      render(<FlowStateDisplay transitions={mockTransitions} />);
      
      expect(screen.getByText(/30m to reach flow/i)).toBeInTheDocument();
      expect(screen.getByText(/30m in deep flow/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should adapt layout for mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });
      
      const { DashboardLayout } = require('@/components/dashboard/dashboard-layout');
      
      render(<DashboardLayout />);
      
      const container = screen.getByTestId('dashboard-container');
      expect(container).toHaveClass('flex-col', 'p-4');
      
      // Grid should stack on mobile
      const grid = screen.getByTestId('dashboard-grid');
      expect(grid).toHaveClass('grid-cols-1');
    });

    it('should use desktop layout for larger screens', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });
      
      const { DashboardLayout } = require('@/components/dashboard/dashboard-layout');
      
      render(<DashboardLayout />);
      
      const grid = screen.getByTestId('dashboard-grid');
      expect(grid).toHaveClass('lg:grid-cols-3', 'xl:grid-cols-4');
    });
  });
});

// =============================================================================
// TASK 6: SESSION TRACKING INTERFACE TESTS
// =============================================================================

describe('Task 6: Session Tracking Interface', () => {
  const mockSession = {
    id: 'session-1',
    type: 'BUILDING',
    model: 'claude-3-sonnet',
    startTime: new Date('2024-01-15T10:00:00Z'),
    flowState: 'FLOWING',
    contextHealth: 85,
    interactions: 12,
    tokensUsed: 15000
  };

  describe('AI Context Health Monitoring', () => {
    it('should display context health with visual indicators', () => {
      const { ContextHealthMonitor } = require('@/components/session/context-health-monitor');
      
      render(<ContextHealthMonitor health={85} model="claude-3-sonnet" />);
      
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('claude-3-sonnet')).toBeInTheDocument();
      expect(screen.getByTestId('health-bar')).toHaveClass('bg-flow-green');
    });

    it('should warn when context health drops below threshold', () => {
      const { ContextHealthMonitor } = require('@/components/session/context-health-monitor');
      
      render(<ContextHealthMonitor health={45} model="gpt-4-turbo" />);
      
      expect(screen.getByTestId('health-bar')).toHaveClass('bg-caution-amber');
      expect(screen.getByText(/context refresh recommended/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /refresh context/i })).toBeInTheDocument();
    });

    it('should show critical context health with urgent styling', () => {
      const { ContextHealthMonitor } = require('@/components/session/context-health-monitor');
      
      render(<ContextHealthMonitor health={25} model="claude-3-sonnet" />);
      
      expect(screen.getByTestId('health-bar')).toHaveClass('bg-stuck-red');
      expect(screen.getByText(/context critically degraded/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start fresh session/i })).toBeInTheDocument();
    });

    it('should track context health over time', () => {
      const { ContextHealthMonitor } = require('@/components/session/context-health-monitor');
      
      const healthHistory = [
        { timestamp: new Date('2024-01-15T09:00:00Z'), health: 100 },
        { timestamp: new Date('2024-01-15T09:30:00Z'), health: 85 },
        { timestamp: new Date('2024-01-15T10:00:00Z'), health: 70 }
      ];
      
      render(<ContextHealthMonitor health={70} history={healthHistory} />);
      
      expect(screen.getByTestId('health-trend')).toBeInTheDocument();
      expect(screen.getByText(/declining/i)).toBeInTheDocument();
    });
  });

  describe('Session Type Selection', () => {
    it('should provide session type selection with clear descriptions', () => {
      const { SessionTypeSelector } = require('@/components/session/session-type-selector');
      const mockOnSelect = jest.fn();
      
      render(<SessionTypeSelector onSelect={mockOnSelect} />);
      
      expect(screen.getByText('Building')).toBeInTheDocument();
      expect(screen.getByText('Exploring')).toBeInTheDocument();
      expect(screen.getByText('Debugging')).toBeInTheDocument();
      expect(screen.getByText('Shipping')).toBeInTheDocument();
      
      // Each should have descriptions
      expect(screen.getByText(/creating new features/i)).toBeInTheDocument();
      expect(screen.getByText(/investigating and learning/i)).toBeInTheDocument();
      expect(screen.getByText(/fixing issues/i)).toBeInTheDocument();
      expect(screen.getByText(/deploying and releasing/i)).toBeInTheDocument();
    });

    it('should handle session type selection', async () => {
      const { SessionTypeSelector } = require('@/components/session/session-type-selector');
      const mockOnSelect = jest.fn();
      
      render(<SessionTypeSelector onSelect={mockOnSelect} />);
      
      const buildingOption = screen.getByRole('button', { name: /building/i });
      await userEvent.click(buildingOption);
      
      expect(mockOnSelect).toHaveBeenCalledWith('BUILDING');
    });

    it('should show session type specific guidance', () => {
      const { SessionTypeSelector } = require('@/components/session/session-type-selector');
      
      render(<SessionTypeSelector selectedType="DEBUGGING" />);
      
      expect(screen.getByText(/focus on problem isolation/i)).toBeInTheDocument();
      expect(screen.getByText(/gather context/i)).toBeInTheDocument();
    });
  });

  describe('Flow State Tracking', () => {
    it('should track flow state transitions accurately', async () => {
      const { FlowStateTracker } = require('@/components/session/flow-state-tracker');
      const mockOnStateChange = jest.fn();
      
      render(
        <FlowStateTracker 
          currentState="NEUTRAL" 
          onStateChange={mockOnStateChange}
        />
      );
      
      const flowingButton = screen.getByRole('button', { name: /flowing/i });
      await userEvent.click(flowingButton);
      
      expect(mockOnStateChange).toHaveBeenCalledWith('FLOWING');
    });

    it('should provide subtle flow state indicators', () => {
      const { FlowStateTracker } = require('@/components/session/flow-state-tracker');
      
      render(<FlowStateTracker currentState="DEEP_FLOW" />);
      
      const indicator = screen.getByTestId('flow-state-indicator');
      expect(indicator).toHaveClass('text-claude-purple');
      expect(screen.getByText(/deep flow/i)).toBeInTheDocument();
      
      // Should be non-intrusive
      expect(indicator).toHaveClass('opacity-80');
    });

    it('should detect flow state automatically from activity', () => {
      const { FlowStateTracker } = require('@/components/session/flow-state-tracker');
      
      const mockActivity = {
        keystrokes: 150,
        mouseClicks: 25,
        idleTime: 0,
        codeChanges: 12
      };
      
      render(<FlowStateTracker activity={mockActivity} />);
      
      // High activity should suggest flowing state
      expect(screen.getByText(/auto-detected: flowing/i)).toBeInTheDocument();
    });

    it('should protect deep flow states from interruption', () => {
      const { FlowStateTracker } = require('@/components/session/flow-state-tracker');
      
      render(<FlowStateTracker currentState="DEEP_FLOW" protectionMode={true} />);
      
      expect(screen.getByText(/flow protection active/i)).toBeInTheDocument();
      expect(screen.getByTestId('protection-shield')).toBeInTheDocument();
    });
  });

  describe('Context Health Visualizations', () => {
    it('should render context health with progressive indicators', () => {
      const { ContextHealthVisualization } = require('@/components/session/context-health-visualization');
      
      const mockMetrics = {
        tokenUsage: 15000,
        maxTokens: 200000,
        interactions: 25,
        coherenceScore: 8.5,
        contextAge: 1800000 // 30 minutes
      };
      
      render(<ContextHealthVisualization metrics={mockMetrics} />);
      
      expect(screen.getByText('25 interactions')).toBeInTheDocument();
      expect(screen.getByText('15K tokens')).toBeInTheDocument();
      expect(screen.getByText('30m old')).toBeInTheDocument();
      expect(screen.getByTestId('coherence-score')).toHaveTextContent('8.5');
    });

    it('should show context degradation patterns', () => {
      const { ContextHealthVisualization } = require('@/components/session/context-health-visualization');
      
      const mockMetrics = {
        tokenUsage: 180000,
        maxTokens: 200000,
        coherenceScore: 4.2,
        degradationFactors: ['High token usage', 'Long conversation', 'Topic drift']
      };
      
      render(<ContextHealthVisualization metrics={mockMetrics} />);
      
      expect(screen.getByText(/90% tokens used/i)).toBeInTheDocument();
      expect(screen.getByText('High token usage')).toBeInTheDocument();
      expect(screen.getByText('Topic drift')).toBeInTheDocument();
      expect(screen.getByTestId('degradation-warning')).toBeInTheDocument();
    });

    it('should provide context optimization suggestions', () => {
      const { ContextHealthVisualization } = require('@/components/session/context-health-visualization');
      
      const mockMetrics = {
        tokenUsage: 150000,
        coherenceScore: 6.5,
        suggestions: ['Summarize previous work', 'Start focused sub-session', 'Clear irrelevant context']
      };
      
      render(<ContextHealthVisualization metrics={mockMetrics} />);
      
      expect(screen.getByText('Summarize previous work')).toBeInTheDocument();
      expect(screen.getByText('Start focused sub-session')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /apply suggestions/i })).toBeInTheDocument();
    });
  });

  describe('Session Timer and Controls', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should display accurate session timer', () => {
      const { SessionTimer } = require('@/components/session/session-timer');
      
      const startTime = new Date('2024-01-15T10:00:00Z');
      jest.setSystemTime(new Date('2024-01-15T10:45:30Z'));
      
      render(<SessionTimer startTime={startTime} />);
      
      expect(screen.getByText('45:30')).toBeInTheDocument();
    });

    it('should provide session control buttons', async () => {
      const { SessionControls } = require('@/components/session/session-controls');
      const mockOnPause = jest.fn();
      const mockOnEnd = jest.fn();
      
      render(
        <SessionControls
          isActive={true}
          onPause={mockOnPause}
          onEnd={mockOnEnd}
        />
      );
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      const endButton = screen.getByRole('button', { name: /end session/i });
      
      await userEvent.click(pauseButton);
      expect(mockOnPause).toHaveBeenCalled();
      
      await userEvent.click(endButton);
      expect(mockOnEnd).toHaveBeenCalled();
    });

    it('should show session break suggestions', () => {
      const { SessionTimer } = require('@/components/session/session-timer');
      
      const startTime = new Date('2024-01-15T08:00:00Z');
      jest.setSystemTime(new Date('2024-01-15T10:00:00Z')); // 2 hours
      
      render(<SessionTimer startTime={startTime} />);
      
      expect(screen.getByText(/consider taking a break/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /take break/i })).toBeInTheDocument();
    });

    it('should handle session pause and resume', async () => {
      const { SessionControls } = require('@/components/session/session-controls');
      
      const { rerender } = render(<SessionControls isActive={true} />);
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await userEvent.click(pauseButton);
      
      rerender(<SessionControls isActive={false} />);
      
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
      expect(screen.getByText(/session paused/i)).toBeInTheDocument();
    });
  });

  describe('Mobile Session Interface', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });
    });

    it('should adapt session interface for touch', () => {
      const { MobileSessionInterface } = require('@/components/session/mobile-session-interface');
      
      render(<MobileSessionInterface session={mockSession} />);
      
      const controls = screen.getByTestId('mobile-controls');
      expect(controls).toHaveClass('touch-manipulation');
      
      // Touch targets should be adequately sized
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('min-h-[44px]');
      });
    });

    it('should provide swipe gestures for session management', () => {
      const { MobileSessionInterface } = require('@/components/session/mobile-session-interface');
      const mockOnSwipe = jest.fn();
      
      render(<MobileSessionInterface session={mockSession} onSwipe={mockOnSwipe} />);
      
      const sessionCard = screen.getByTestId('session-card');
      
      // Simulate swipe gesture
      fireEvent.touchStart(sessionCard, { touches: [{ clientX: 0, clientY: 0 }] });
      fireEvent.touchMove(sessionCard, { touches: [{ clientX: -100, clientY: 0 }] });
      fireEvent.touchEnd(sessionCard);
      
      expect(mockOnSwipe).toHaveBeenCalledWith('left');
    });
  });

  describe('Accessibility', () => {
    it('should meet WCAG accessibility standards', async () => {
      const { SessionTrackingInterface } = require('@/components/session/session-tracking-interface');
      
      const { container } = render(<SessionTrackingInterface session={mockSession} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should provide keyboard navigation for all controls', async () => {
      const { SessionControls } = require('@/components/session/session-controls');
      
      render(<SessionControls isActive={true} />);
      
      // Tab through controls
      await userEvent.tab();
      expect(screen.getByRole('button', { name: /pause/i })).toHaveFocus();
      
      await userEvent.tab();
      expect(screen.getByRole('button', { name: /end session/i })).toHaveFocus();
      
      // Space/Enter should activate buttons
      await userEvent.keyboard('{Enter}');
      // Should trigger end session confirmation
    });

    it('should announce flow state changes to screen readers', async () => {
      const { FlowStateTracker } = require('@/components/session/flow-state-tracker');
      
      render(<FlowStateTracker currentState="NEUTRAL" />);
      
      const flowingButton = screen.getByRole('button', { name: /flowing/i });
      await userEvent.click(flowingButton);
      
      expect(screen.getByLabelText(/flow state changed to flowing/i)).toBeInTheDocument();
    });
  });
});

// =============================================================================
// INTEGRATION TESTS - UI/UX COMPONENTS WORKING TOGETHER
// =============================================================================

describe('UI/UX Integration Tests', () => {
  it('should integrate dashboard and session tracking seamlessly', () => {
    const { Dashboard } = require('@/components/dashboard/dashboard');
    const { SessionProvider } = require('@/components/providers/session-provider');
    
    render(
      <SessionProvider>
        <Dashboard />
      </SessionProvider>
    );
    
    // Dashboard should show session data
    expect(screen.getByTestId('active-sessions')).toBeInTheDocument();
    expect(screen.getByTestId('flow-state-display')).toBeInTheDocument();
    
    // Starting a new session should update dashboard
    const startSessionButton = screen.getByRole('button', { name: /start new session/i });
    fireEvent.click(startSessionButton);
    
    expect(screen.getByRole('dialog', { name: /session configuration/i })).toBeInTheDocument();
  });

  it('should maintain design consistency across all components', () => {
    const { Button } = require('@/components/ui/button');
    const { Card } = require('@/components/ui/card');
    const { Badge } = require('@/components/ui/badge');
    
    render(
      <div>
        <Button variant="primary">Primary Action</Button>
        <Card className="p-4">
          <Badge variant="success">Active</Badge>
        </Card>
      </div>
    );
    
    // All components should use consistent spacing and colors
    const button = screen.getByRole('button');
    const card = screen.getByRole('article');
    const badge = screen.getByText('Active');
    
    expect(button).toHaveClass('font-medium');
    expect(card).toHaveClass('rounded-lg', 'border');
    expect(badge).toHaveClass('text-sm');
  });

  it('should handle responsive breakpoints consistently', () => {
    const { ResponsiveLayout } = require('@/components/layout/responsive-layout');
    
    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 } // Desktop
    ];
    
    viewports.forEach(viewport => {
      Object.defineProperty(window, 'innerWidth', { value: viewport.width });
      Object.defineProperty(window, 'innerHeight', { value: viewport.height });
      
      const { rerender } = render(<ResponsiveLayout />);
      
      const container = screen.getByTestId('responsive-container');
      
      if (viewport.width < 768) {
        expect(container).toHaveClass('px-4');
      } else if (viewport.width < 1024) {
        expect(container).toHaveClass('px-6');
      } else {
        expect(container).toHaveClass('px-8');
      }
      
      rerender(<ResponsiveLayout />);
    });
  });
});