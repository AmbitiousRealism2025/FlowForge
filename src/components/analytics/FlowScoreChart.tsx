'use client'

import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { FlowScoreChartProps, FlowScoreTrendData } from '@/types'
import { calculateMovingAverage } from '@/lib/advancedAnalytics'
import { format, parseISO } from 'date-fns'
import { TrendingUp } from 'lucide-react'

export function FlowScoreChart({ data, isLoading, dateRange }: FlowScoreChartProps) {
  // Calculate moving average for trend line
  const processedData = data.length > 0 ? calculateMovingAverage(data, 7) : []

  // Format dates for X-axis labels
  const formattedData = processedData.map((item) => ({
    ...item,
    formattedDate: format(parseISO(item.date), 'MMM d'),
  }))

  // Determine subtitle based on date range
  const rangeLabels = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    all: 'All time',
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Flow Score Trend</CardTitle>
          </div>
          <CardDescription>{rangeLabels[dateRange]}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Flow Score Trend</CardTitle>
          </div>
          <CardDescription>{rangeLabels[dateRange]}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No productivity data yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Complete sessions with productivity scores to see trends
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload
      return (
        <div className="bg-card border rounded-lg shadow-lg p-3">
          <p className="font-medium">{format(parseISO(data.date), 'MMMM d, yyyy')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Average Score: <span className="font-semibold text-foreground">{data.averageScore.toFixed(1)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Sessions: <span className="font-semibold text-foreground">{data.sessionCount}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Total Time: <span className="font-semibold text-foreground">{data.totalMinutes}m</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-flow-green" />
          <CardTitle>Flow Score Trend</CardTitle>
        </div>
        <CardDescription>{rangeLabels[dateRange]}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--flow-green))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--flow-green))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="formattedDate"
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
              label={{ value: 'Score', angle: -90, position: 'insideLeft', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="averageScore"
              stroke="hsl(var(--flow-green))"
              fill="url(#flowGradient)"
              strokeWidth={2}
            />
            {/* Moving average trend line */}
            <Line
              type="monotone"
              dataKey="movingAverage"
              stroke="hsl(var(--claude-purple))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
