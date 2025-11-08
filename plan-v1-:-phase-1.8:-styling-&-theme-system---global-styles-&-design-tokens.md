I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The codebase uses Next.js 14 with Tailwind CSS 3.4.1 and tailwindcss-animate plugin. The current globals.css follows shadcn/ui patterns with HSL-based CSS variables for theming. FlowForge colors are defined in tailwind.config.ts as hex values (flow-green: #00D9A5, caution-amber: #FFB800, stuck-red: #FF4757, claude-purple: #7C3AED, neutral-slate: #2F3542) but not as CSS variables. Dark mode uses class strategy. Basic animations exist (accordion, fade-in, slide-up, pulse-glow) but lack celebration-specific animations. No Radix UI component overrides exist. No responsive typography scale or comprehensive accessibility styles are defined. The styling system needs enhancement to support all components built in Phases 1.1-1.7 (dashboard, sessions, projects, notes, analytics) with consistent theming, animations, and accessibility.

### Approach

Enhance the global stylesheet with comprehensive FlowForge branding, dark mode support, celebration animations, Radix UI component overrides, responsive typography, and accessibility features. The approach extends the existing CSS variable system (already using HSL format for shadcn/ui compatibility) with FlowForge-specific colors, adds utility classes for common patterns, implements celebration animations using CSS keyframes, provides consistent Radix UI styling overrides, establishes a responsive typography scale, and ensures WCAG 2.1 AA compliance with focus indicators and reduced motion support. This is purely a styling enhancement that doesn't require new components or logic - just CSS additions to support the UI components built in previous phases.

### Reasoning

I explored the codebase and found globals.css has minimal styling (basic CSS variables, one animation), tailwind.config.ts has FlowForge colors defined as hex values and basic animations, package.json shows all Radix UI components installed (Avatar, Checkbox, Dialog, Dropdown Menu, Label, Popover, Progress, Select, Separator, Slider, Switch, Tabs, Toast, Tooltip), and the master plan specifies Phase 1.8 requirements for enhanced styling. I reviewed previous phase implementation plans to understand the established pattern and confirmed this is the final MVP foundation phase focused purely on styling enhancements.

## Proposed File Changes

### src/styles/globals.css(MODIFY)

References: 

- tailwind.config.ts
- package.json

**Enhance global stylesheet with comprehensive FlowForge styling system:**

**1. FlowForge Color Variables (add after existing CSS variables in :root, around line 27)**
- Add --flow-green: 162 100% 42% (HSL conversion of #00D9A5)
- Add --flow-green-foreground: 0 0% 100% (white text on green)
- Add --caution-amber: 43 100% 50% (HSL conversion of #FFB800)
- Add --caution-amber-foreground: 0 0% 0% (black text on amber)
- Add --stuck-red: 355 100% 64% (HSL conversion of #FF4757)
- Add --stuck-red-foreground: 0 0% 100% (white text on red)
- Add --claude-purple: 258 77% 57% (HSL conversion of #7C3AED)
- Add --claude-purple-foreground: 0 0% 100% (white text on purple)
- Add --neutral-slate: 220 20% 20% (HSL conversion of #2F3542)
- Add --neutral-slate-foreground: 0 0% 100% (white text on slate)

**2. Dark Mode FlowForge Colors (add in .dark selector, around line 49)**
- Keep same HSL values for FlowForge colors (they work in both modes)
- Adjust foreground colors if needed for better contrast in dark mode

**3. Responsive Typography Scale (add new @layer base section after line 59)**
- Define --font-size-xs: 0.75rem (12px)
- Define --font-size-sm: 0.875rem (14px)
- Define --font-size-base: 1rem (16px)
- Define --font-size-lg: 1.125rem (18px)
- Define --font-size-xl: 1.25rem (20px)
- Define --font-size-2xl: 1.5rem (24px)
- Define --font-size-3xl: 1.875rem (30px)
- Define --font-size-4xl: 2.25rem (36px)
- Define --line-height-tight: 1.25
- Define --line-height-normal: 1.5
- Define --line-height-relaxed: 1.75
- Add responsive scaling: increase base font size by 2px on screens >= 768px

**4. Accessibility Focus Styles (add new @layer base section)**
- Create .focus-visible-ring class: outline 2px solid hsl(var(--ring)), outline-offset 2px, transition outline-offset 150ms
- Apply to all interactive elements: button:focus-visible, a:focus-visible, [role="button"]:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible
- Add high contrast focus indicator for keyboard navigation: use ring color with 3:1 contrast ratio
- Add .sr-only class for screen reader only content: position absolute, width 1px, height 1px, padding 0, margin -1px, overflow hidden, clip rect(0,0,0,0), white-space nowrap, border-width 0

**5. Reduced Motion Support (add new @media section)**
- Wrap in @media (prefers-reduced-motion: reduce)
- Disable all animations: *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
- Keep essential transitions for state changes but reduce duration

**6. Celebration Animations (add new @keyframes section after pulse-glow, around line 73)**
- Add @keyframes confetti-fall: 0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
- Add @keyframes bounce-in: 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.05); } 70% { transform: scale(0.9); } 100% { transform: scale(1); opacity: 1; }
- Add @keyframes shake-celebrate: 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); }
- Add @keyframes glow-pulse: 0%, 100% { box-shadow: 0 0 5px hsl(var(--flow-green)), 0 0 10px hsl(var(--flow-green)); } 50% { box-shadow: 0 0 20px hsl(var(--flow-green)), 0 0 30px hsl(var(--flow-green)); }
- Add @keyframes slide-in-up: 0% { transform: translateY(100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; }
- Add @keyframes scale-in: 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; }

**7. Celebration Animation Classes (add new @layer utilities section)**
- .animate-confetti-fall: animation confetti-fall 3s ease-in-out forwards
- .animate-bounce-in: animation bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)
- .animate-shake-celebrate: animation shake-celebrate 0.5s ease-in-out
- .animate-glow-pulse: animation glow-pulse 2s ease-in-out infinite
- .animate-slide-in-up: animation slide-in-up 0.4s ease-out
- .animate-scale-in: animation scale-in 0.3s ease-out
- Add delay variants: .animation-delay-100 through .animation-delay-500 using animation-delay property

**8. Radix UI Component Overrides (add new section)**

**Dialog Overrides:**
- [data-radix-dialog-overlay]: background rgba(0, 0, 0, 0.5), backdrop-filter blur(4px)
- [data-radix-dialog-content]: background hsl(var(--card)), border 1px solid hsl(var(--border)), border-radius var(--radius), box-shadow 0 10px 40px rgba(0, 0, 0, 0.2)
- Add focus trap styling for dialog content

**Toast Overrides:**
- [data-radix-toast-viewport]: position fixed, bottom 0, right 0, padding 1.5rem, z-index 100, max-width 420px
- [data-radix-toast-root]: background hsl(var(--card)), border 1px solid hsl(var(--border)), border-radius var(--radius), padding 1rem, box-shadow 0 4px 12px rgba(0, 0, 0, 0.15)
- [data-state="open"]: animation slide-in-up 0.3s ease-out
- [data-state="closed"]: animation fade-out 0.2s ease-in
- Add success variant: border-left 4px solid hsl(var(--flow-green))
- Add error variant: border-left 4px solid hsl(var(--stuck-red))
- Add warning variant: border-left 4px solid hsl(var(--caution-amber))
- Add info variant: border-left 4px solid hsl(var(--claude-purple))

**Tooltip Overrides:**
- [data-radix-tooltip-content]: background hsl(var(--popover)), border 1px solid hsl(var(--border)), border-radius calc(var(--radius) - 2px), padding 0.5rem 0.75rem, font-size var(--font-size-sm), box-shadow 0 2px 8px rgba(0, 0, 0, 0.1), z-index 50
- [data-state="delayed-open"]: animation fade-in 0.15s ease-out

**Dropdown Menu Overrides:**
- [data-radix-dropdown-menu-content]: background hsl(var(--popover)), border 1px solid hsl(var(--border)), border-radius var(--radius), padding 0.25rem, box-shadow 0 4px 12px rgba(0, 0, 0, 0.1), min-width 12rem
- [data-radix-dropdown-menu-item]: padding 0.5rem 0.75rem, border-radius calc(var(--radius) - 4px), cursor pointer, transition background-color 150ms
- [data-radix-dropdown-menu-item]:hover: background hsl(var(--accent))
- [data-radix-dropdown-menu-item][data-highlighted]: background hsl(var(--accent))

**Select Overrides:**
- [data-radix-select-trigger]: background hsl(var(--background)), border 1px solid hsl(var(--input)), border-radius var(--radius), padding 0.5rem 1rem, transition border-color 150ms
- [data-radix-select-trigger]:focus: border-color hsl(var(--ring)), outline none
- [data-radix-select-content]: background hsl(var(--popover)), border 1px solid hsl(var(--border)), border-radius var(--radius), box-shadow 0 4px 12px rgba(0, 0, 0, 0.1)
- [data-radix-select-item]: padding 0.5rem 0.75rem, cursor pointer
- [data-radix-select-item][data-highlighted]: background hsl(var(--accent))

**Slider Overrides:**
- [data-radix-slider-root]: position relative, display flex, align-items center, width 100%, height 1.25rem, cursor pointer
- [data-radix-slider-track]: background hsl(var(--secondary)), position relative, flex-grow 1, border-radius 9999px, height 0.5rem
- [data-radix-slider-range]: background hsl(var(--primary)), position absolute, border-radius 9999px, height 100%
- [data-radix-slider-thumb]: display block, width 1.25rem, height 1.25rem, background hsl(var(--background)), border 2px solid hsl(var(--primary)), border-radius 9999px, box-shadow 0 2px 4px rgba(0, 0, 0, 0.1), transition box-shadow 150ms
- [data-radix-slider-thumb]:hover: box-shadow 0 0 0 4px hsl(var(--primary) / 0.1)
- [data-radix-slider-thumb]:focus: outline none, box-shadow 0 0 0 4px hsl(var(--ring) / 0.2)

**Progress Overrides:**
- [data-radix-progress-root]: background hsl(var(--secondary)), border-radius 9999px, height 0.75rem, overflow hidden
- [data-radix-progress-indicator]: background hsl(var(--primary)), height 100%, transition transform 300ms cubic-bezier(0.65, 0, 0.35, 1)

**Switch Overrides:**
- [data-radix-switch-root]: width 2.75rem, height 1.5rem, background hsl(var(--input)), border-radius 9999px, position relative, cursor pointer, transition background-color 150ms
- [data-radix-switch-root][data-state="checked"]: background hsl(var(--primary))
- [data-radix-switch-thumb]: display block, width 1.25rem, height 1.25rem, background hsl(var(--background)), border-radius 9999px, box-shadow 0 2px 4px rgba(0, 0, 0, 0.1), transition transform 150ms, transform translateX(0.125rem)
- [data-radix-switch-thumb][data-state="checked"]: transform translateX(1.375rem)

**Tabs Overrides:**
- [data-radix-tabs-list]: display flex, border-bottom 1px solid hsl(var(--border))
- [data-radix-tabs-trigger]: padding 0.75rem 1rem, border-bottom 2px solid transparent, transition all 150ms, color hsl(var(--muted-foreground))
- [data-radix-tabs-trigger]:hover: color hsl(var(--foreground))
- [data-radix-tabs-trigger][data-state="active"]: color hsl(var(--foreground)), border-bottom-color hsl(var(--primary))

**Checkbox Overrides:**
- [data-radix-checkbox-root]: width 1.25rem, height 1.25rem, border 2px solid hsl(var(--primary)), border-radius calc(var(--radius) - 4px), background hsl(var(--background)), cursor pointer, transition all 150ms
- [data-radix-checkbox-root][data-state="checked"]: background hsl(var(--primary)), border-color hsl(var(--primary))
- [data-radix-checkbox-indicator]: color hsl(var(--primary-foreground))

**Avatar Overrides:**
- [data-radix-avatar-root]: display inline-flex, align-items center, justify-content center, overflow hidden, border-radius 9999px, background hsl(var(--muted))
- [data-radix-avatar-image]: width 100%, height 100%, object-fit cover
- [data-radix-avatar-fallback]: display flex, align-items center, justify-content center, background hsl(var(--muted)), color hsl(var(--muted-foreground)), font-weight 500

**9. Utility Classes for Common Patterns (add new @layer utilities section)**
- .card-elevated: box-shadow 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
- .card-elevated-hover: transition box-shadow 150ms, hover:box-shadow 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
- .gradient-flow: background linear-gradient(135deg, hsl(var(--flow-green)) 0%, hsl(var(--claude-purple)) 100%)
- .gradient-caution: background linear-gradient(135deg, hsl(var(--caution-amber)) 0%, hsl(var(--stuck-red)) 100%)
- .text-gradient-flow: background linear-gradient(135deg, hsl(var(--flow-green)) 0%, hsl(var(--claude-purple)) 100%), -webkit-background-clip text, background-clip text, color transparent
- .glass-morphism: background rgba(255, 255, 255, 0.1), backdrop-filter blur(10px), border 1px solid rgba(255, 255, 255, 0.2)
- .scrollbar-thin: scrollbar-width thin, scrollbar-color hsl(var(--muted)) transparent
- .scrollbar-thin::-webkit-scrollbar: width 8px, height 8px
- .scrollbar-thin::-webkit-scrollbar-track: background transparent
- .scrollbar-thin::-webkit-scrollbar-thumb: background hsl(var(--muted)), border-radius 4px
- .scrollbar-thin::-webkit-scrollbar-thumb:hover: background hsl(var(--muted-foreground))

**10. Touch Target Accessibility (add new @layer utilities section)**
- .touch-target: min-width 44px, min-height 44px (WCAG 2.1 AA requirement)
- Apply to all interactive elements on mobile: @media (max-width: 768px) { button, a, [role="button"], input[type="checkbox"], input[type="radio"] { min-width: 44px; min-height: 44px; } }

**11. Print Styles (add new @media print section)**
- Hide navigation, sidebars, and non-essential UI elements
- Ensure content is readable in black and white
- Add page break controls for better printing
- Show URLs for links in printed version

**12. High Contrast Mode Support (add new @media section)**
- @media (prefers-contrast: high): Increase border widths, use solid colors instead of gradients, increase font weights for better readability

**13. Loading States (add new @layer utilities section)**
- .skeleton: background linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground) / 0.1) 50%, hsl(var(--muted)) 75%), background-size 200% 100%, animation skeleton-loading 1.5s ease-in-out infinite
- @keyframes skeleton-loading: 0% { background-position: 200% 0; } 100% { background-position: -200% 0; }
- .spinner: border 2px solid hsl(var(--muted)), border-top-color hsl(var(--primary)), border-radius 9999px, animation spin 0.6s linear infinite
- @keyframes spin: 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }

**14. Status Indicators (add new @layer utilities section)**
- .status-dot: width 0.5rem, height 0.5rem, border-radius 9999px, display inline-block
- .status-dot-success: background hsl(var(--flow-green))
- .status-dot-warning: background hsl(var(--caution-amber))
- .status-dot-error: background hsl(var(--stuck-red))
- .status-dot-info: background hsl(var(--claude-purple))
- .status-dot-pulse: animation pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite

**15. Momentum Indicators (add new @layer utilities section)**
- .momentum-hot: color hsl(var(--stuck-red)), animation glow-pulse 2s ease-in-out infinite
- .momentum-active: color hsl(var(--caution-amber))
- .momentum-quiet: color hsl(var(--muted-foreground))

**16. Context Health Colors (add new @layer utilities section)**
- .context-health-high: color hsl(var(--flow-green))
- .context-health-medium: color hsl(var(--caution-amber))
- .context-health-low: color hsl(var(--stuck-red))
- Add corresponding background variants with opacity: .bg-context-health-high, .bg-context-health-medium, .bg-context-health-low

**17. Feels Right Score Colors (add new @layer utilities section)**
- .feels-right-1: color hsl(var(--stuck-red)) (Struggling)
- .feels-right-2: color hsl(355 70% 55%) (Uncertain)
- .feels-right-3: color hsl(var(--caution-amber)) (Okay)
- .feels-right-4: color hsl(162 80% 45%) (Good)
- .feels-right-5: color hsl(var(--flow-green)) (Nailing It)

**18. Note Category Colors (add new @layer utilities section)**
- .note-prompt-pattern: color hsl(var(--claude-purple))
- .note-golden-code: color hsl(var(--caution-amber))
- .note-debug-log: color hsl(var(--stuck-red))
- .note-model-note: color hsl(210 100% 50%) (blue)
- .note-insight: color hsl(var(--muted-foreground))
- Add corresponding background variants with opacity for badges

**19. Session Type Colors (add new @layer utilities section)**
- .session-building: color hsl(210 100% 50%) (blue)
- .session-exploring: color hsl(var(--claude-purple))
- .session-debugging: color hsl(var(--stuck-red))
- .session-shipping: color hsl(var(--flow-green))

**20. Safe Area Insets for Mobile (add new @layer utilities section)**
- .safe-area-inset-top: padding-top env(safe-area-inset-top)
- .safe-area-inset-bottom: padding-bottom env(safe-area-inset-bottom)
- .safe-area-inset-left: padding-left env(safe-area-inset-left)
- .safe-area-inset-right: padding-right env(safe-area-inset-right)
- Apply to mobile navigation and fixed elements for iOS notch support