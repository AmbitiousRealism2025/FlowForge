'use client'

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
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { ModelPerformanceCardProps } from '@/types'
import { formatModelName } from '@/lib/advancedAnalytics'
import { formatDuration, getSessionTypeLabel, getSessionTypeIcon } from '@/lib/utils'
import { Sparkles, Award } from 'lucide-react'

export function ModelPerformanceCard({ data, isLoading }: ModelPerformanceCardProps) {
  // Sort by average score descending
  const sortedData = [...data].sort((a, b) => b.averageScore - a.averageScore)
  const bestModel = sortedData[0]

  // Format data for chart
  const chartData = sortedData.map((item) => ({
    ...item,
    displayName: formatModelName(item.modelName),
  }))

  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <CardTitle>AI Model Performance</CardTitle>
          </div>
          <CardDescription>Which models work best for you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] animate-pulse bg-muted rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse bg-muted rounded" />
            ))}
          </div>
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
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <CardTitle>AI Model Performance</CardTitle>
          </div>
          <CardDescription>Which models work best for you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex flex-col items-center justify-center text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No model data yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Use different AI models in sessions to see performance comparison
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
          <p className="font-medium">{formatModelName(data.modelName)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Avg Score: <span className="font-semibold text-foreground">{data.averageScore.toFixed(1)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Sessions: <span className="font-semibold text-foreground">{data.sessionCount}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Total Time: <span className="font-semibold text-foreground">{formatDuration(data.totalMinutes * 60)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Best for: <span className="font-semibold text-foreground">{getSessionTypeLabel(data.bestSessionType)}</span>
          </p>
        </div>
      )
    }
    return null
  }

  // Get color for bar based on score
  const getBarColor = (score: number, isBest: boolean) => {
    if (isBest) return 'hsl(var(--flow-green))'
    if (score >= 7) return 'hsl(var(--claude-purple))'
    if (score >= 4) return 'hsl(var(--caution-amber))'
    return 'hsl(var(--stuck-red))'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-claude-purple" />
          <CardTitle>AI Model Performance</CardTitle>
        </div>
        <CardDescription>Which models work best for you</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Bar chart visualization */}
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="displayName"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
              label={{ value: 'Avg Score', angle: -90, position: 'insideLeft', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="averageScore" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.averageScore, entry.modelName === bestModel?.modelName)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Detailed model cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {sortedData.map((model, index) => {
            const isBest = index === 0
            return (
              <div
                key={model.modelName}
                className={`p-4 rounded-lg border ${
                  isBest ? 'border-flow-green bg-flow-green/5' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{formatModelName(model.modelName)}</p>
                    {isBest && (
                      <div className="flex items-center gap-1 mt-1">
                        <Award className="h-3 w-3 text-flow-green" />
                        <span className="text-xs text-flow-green font-medium">Top Performer</span>
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-bold">
                    <span className={`${model.averageScore >= 7 ? 'text-flow-green' : model.averageScore >= 4 ? 'text-caution-amber' : 'text-stuck-red'}`}>
                      {model.averageScore.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>{model.sessionCount} sessions</p>
                  <p>{formatDuration(model.totalMinutes * 60)}</p>
                  <div className="flex items-center gap-1 pt-1">
                    <span>{getSessionTypeIcon(model.bestSessionType)}</span>
                    <span>Best for {getSessionTypeLabel(model.bestSessionType).toLowerCase()}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
