'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { BarChart3 } from 'lucide-react'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

import { WeeklyShipData } from '@/types'
import {
  fetchWeeklyShipData,
  formatWeeklyDataForChart,
  calculateWeeklyAverage,
} from '@/lib/analyticsService'
import { formatChartDate } from '@/lib/utils'

interface WeeklyShipChartProps {
  height?: number
}

/**
 * Custom Tooltip for the chart
 */
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as WeeklyShipData
    const shipCount = data.shipCount

    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm">{data.dayOfWeek}</p>
        <p className="text-sm text-muted-foreground">{formatChartDate(new Date(data.date))}</p>
        <p className="text-sm font-bold text-flow-green mt-1">
          {shipCount} {shipCount === 1 ? 'ship' : 'ships'}
        </p>
        {shipCount > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Great work! 🚀
          </p>
        )}
      </div>
    )
  }

  return null
}

/**
 * WeeklyShipChart - Bar chart showing ship activity over the last 7 days
 */
export function WeeklyShipChart({ height = 300 }: WeeklyShipChartProps) {
  const queryClient = useQueryClient()

  // Fetch weekly data
  const { data: weeklyData, isLoading, error } = useQuery({
    queryKey: ['analytics', 'weekly'],
    queryFn: async () => {
      const data = await fetchWeeklyShipData()
      return data
    },
    staleTime: 300000, // 5 minutes
    refetchOnMount: true,
  })

  // Process data for chart
  const chartData = weeklyData ? formatWeeklyDataForChart(weeklyData) : []
  const weeklyAverage = weeklyData ? calculateWeeklyAverage(weeklyData) : 0
  const hasShips = chartData.some((day) => day.shipCount > 0)

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Weekly Ship Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="flex items-end justify-between gap-2" style={{ height }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 rounded"
                  style={{ height: `${Math.random() * 100}%` }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <BarChart3 className="h-5 w-5" />
            Error Loading Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Failed to load weekly ship data. Please try again.
          </p>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['analytics', 'weekly'] })}
            variant="outline"
            size="sm"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!hasShips) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Weekly Ship Activity
          </CardTitle>
          <p className="text-sm text-muted-foreground">Avg: 0 ships/day</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <p className="text-lg font-semibold mb-2">No ships yet this week</p>
            <p className="text-sm text-muted-foreground">
              Start your streak today!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Weekly Ship Activity
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Avg: {weeklyAverage} ships/day
        </p>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-muted"
              opacity={0.3}
            />
            <XAxis
              dataKey="dayOfWeek"
              tick={{ fontSize: 12 }}
              className="text-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-foreground"
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="shipCount"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.shipCount > 0
                      ? 'hsl(var(--flow-green))'
                      : 'hsl(var(--muted))'
                  }
                  opacity={entry.shipCount > 0 ? 1 : 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
