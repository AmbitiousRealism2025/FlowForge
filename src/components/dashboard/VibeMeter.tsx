'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Activity, AlertCircle, Zap } from 'lucide-react'
import * as Select from '@radix-ui/react-select'
import { FlowState } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { useToast } from '@/hooks/useToast'
import { ChevronDown, Check } from 'lucide-react'

interface VibeMeterProps {
  flowState?: FlowState
}

const flowStateConfig = {
  [FlowState.BLOCKED]: {
    label: 'Blocked',
    emoji: '🚫',
    textColor: 'text-stuck-red',
    bgColor: 'bg-stuck-red/10',
    borderColor: 'border-stuck-red/20',
    icon: AlertCircle,
  },
  [FlowState.NEUTRAL]: {
    label: 'Neutral',
    emoji: '😐',
    textColor: 'text-caution-amber',
    bgColor: 'bg-caution-amber/10',
    borderColor: 'border-caution-amber/20',
    icon: Activity,
  },
  [FlowState.FLOWING]: {
    label: 'Flowing',
    emoji: '🟢',
    textColor: 'text-flow-green',
    bgColor: 'bg-flow-green/10',
    borderColor: 'border-flow-green/20',
    icon: Activity,
  },
  [FlowState.DEEP_FLOW]: {
    label: 'Deep Flow',
    emoji: '⚡',
    textColor: 'text-flow-green',
    bgColor: 'bg-flow-green/20',
    borderColor: 'border-flow-green/30',
    icon: Zap,
  },
}

export function VibeMeter({ flowState = FlowState.NEUTRAL }: VibeMeterProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Update flow state mutation
  const updateMutation = useMutation({
    mutationFn: async (newFlowState: FlowState) => {
      const response = await fetch('/api/user/flow-state', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowState: newFlowState }),
      })
      if (!response.ok) throw new Error('Failed to update flow state')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      toast.success('Flow state updated')
    },
    onError: () => {
      toast.error('Failed to update flow state')
    },
  })

  const config = flowStateConfig[flowState]
  const Icon = config.icon

  return (
    <Card className={`${config.bgColor} ${config.borderColor}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className={`h-5 w-5 ${config.textColor}`} />
          Vibe Meter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Flow State Display */}
        <div className="text-center py-4">
          <div className="text-5xl mb-2">{config.emoji}</div>
          <p className={`text-xl font-bold ${config.textColor}`}>
            {config.label}
          </p>
        </div>

        {/* Flow State Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Update your flow state:
          </label>
          <Select.Root
            value={flowState}
            onValueChange={(value) => updateMutation.mutate(value as FlowState)}
            disabled={updateMutation.isPending}
          >
            <Select.Trigger className="flex w-full items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <Select.Value />
              <Select.Icon>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content className="overflow-hidden rounded-lg border bg-popover shadow-lg">
                <Select.Viewport className="p-1">
                  {Object.entries(flowStateConfig).map(([key, cfg]) => (
                    <Select.Item
                      key={key}
                      value={key}
                      className="relative flex items-center gap-2 rounded-md px-8 py-2 text-sm outline-none cursor-pointer hover:bg-accent focus:bg-accent data-[state=checked]:bg-accent"
                    >
                      <Select.ItemIndicator className="absolute left-2">
                        <Check className="h-4 w-4" />
                      </Select.ItemIndicator>
                      <span className="text-lg">{cfg.emoji}</span>
                      <Select.ItemText>{cfg.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        {/* Flow State Descriptions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Deep Flow:</strong> Peak productivity, fully immersed
          </p>
          <p>
            <strong>Flowing:</strong> Making steady progress
          </p>
          <p>
            <strong>Neutral:</strong> Working but not in the zone
          </p>
          <p>
            <strong>Blocked:</strong> Stuck or interrupted
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
