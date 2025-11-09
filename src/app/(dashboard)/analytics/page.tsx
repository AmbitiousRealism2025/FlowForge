'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FlowScoreChart } from '@/components/analytics/FlowScoreChart'
import { ModelPerformanceCard } from '@/components/analytics/ModelPerformanceCard'
import { BestTimesHeatmap } from '@/components/analytics/BestTimesHeatmap'
import { DateRangeFilter } from '@/types'
import {
  getFlowScoreTrend,
  getModelPerformance,
  getBestTimes,
  getAnalyticsSummary,
  exportAnalyticsData,
} from '@/lib/advancedAnalytics'
import { BarChart3, Download, TrendingUp, Award, Clock } from 'lucide-react'

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d')

  // Fetch flow score trend data
  const flowScoreQuery = useQuery({
    queryKey: ['analytics', 'flow-score', dateRange],
    queryFn: async () => {
      const response = await getFlowScoreTrend(dateRange)
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch flow score data')
      }
      return response.data || []
    },
    staleTime: 300000, // 5 minutes
  })

  // Fetch model performance data
  const modelPerformanceQuery = useQuery({
    queryKey: ['analytics', 'model-performance', dateRange],
    queryFn: async () => {
      const response = await getModelPerformance(dateRange)
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch model performance data')
      }
      return response.data || []
    },
    staleTime: 300000,
  })

  // Fetch best times data
  const bestTimesQuery = useQuery({
    queryKey: ['analytics', 'best-times', dateRange],
    queryFn: async () => {
      const response = await getBestTimes(dateRange)
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch best times data')
      }
      return response.data || []
    },
    staleTime: 300000,
  })

  // Fetch summary data
  const summaryQuery = useQuery({
    queryKey: ['analytics', 'summary', dateRange],
    queryFn: async () => {
      const response = await getAnalyticsSummary(dateRange)
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch analytics summary')
      }
      return response.data
    },
    staleTime: 300000,
  })

  // Handle export
  const handleExport = () => {
    if (flowScoreQuery.data && flowScoreQuery.data.length > 0) {
      exportAnalyticsData(flowScoreQuery.data, `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`)
    }
  }

  // Check if there's any error
  const hasError =
    flowScoreQuery.isError ||
    modelPerformanceQuery.isError ||
    bestTimesQuery.isError ||
    summaryQuery.isError

  // Check if loading
  const isLoading =
    flowScoreQuery.isLoading ||
    modelPerformanceQuery.isLoading ||
    bestTimesQuery.isLoading ||
    summaryQuery.isLoading

  // Get summary data with defaults
  const summary = summaryQuery.data || {
    averageFlowScore: 0,
    mostProductiveModel: 'N/A',
    bestTimeOfDay: 'Not enough data',
    totalShipsThisMonth: 0,
    totalCodingMinutes: 0,
  }

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-flow-green'
    if (score >= 4) return 'text-caution-amber'
    return 'text-stuck-red'
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">Insights into your productivity patterns</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label htmlFor="dateRange" className="text-sm font-medium">
            Time Range:
          </label>
          <select
            id="dateRange"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRangeFilter)}
            className="px-3 py-2 border rounded-md bg-background text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        <Button
          onClick={handleExport}
          variant="outline"
          size="sm"
          disabled={!flowScoreQuery.data || flowScoreQuery.data.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Error state */}
      {hasError && (
        <Card className="mb-6 border-stuck-red">
          <CardContent className="p-6">
            <p className="text-stuck-red">Failed to load analytics data. Please try again.</p>
            <Button
              onClick={() => {
                flowScoreQuery.refetch()
                modelPerformanceQuery.refetch()
                bestTimesQuery.refetch()
                summaryQuery.refetch()
              }}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        {/* Average Flow Score */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Avg Flow Score</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {summaryQuery.isLoading ? (
              <div className="h-8 w-16 animate-pulse bg-muted rounded" />
            ) : (
              <p className={`text-3xl font-bold ${getScoreColor(summary.averageFlowScore)}`}>
                {summary.averageFlowScore.toFixed(1)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Most Productive Model */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Top Model</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {summaryQuery.isLoading ? (
              <div className="h-8 w-24 animate-pulse bg-muted rounded" />
            ) : (
              <p className="text-lg font-semibold truncate">{summary.mostProductiveModel}</p>
            )}
          </CardContent>
        </Card>

        {/* Best Time of Day */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Best Time</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {summaryQuery.isLoading ? (
              <div className="h-8 w-32 animate-pulse bg-muted rounded" />
            ) : (
              <p className="text-lg font-semibold">{summary.bestTimeOfDay}</p>
            )}
          </CardContent>
        </Card>

        {/* Total Ships This Month */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Ships This Month</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {summaryQuery.isLoading ? (
              <div className="h-8 w-12 animate-pulse bg-muted rounded" />
            ) : (
              <p className="text-3xl font-bold">{summary.totalShipsThisMonth}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main visualizations */}
      <div className="space-y-6">
        {/* Flow Score Chart */}
        <FlowScoreChart
          data={flowScoreQuery.data || []}
          isLoading={flowScoreQuery.isLoading}
          dateRange={dateRange}
        />

        {/* Model Performance */}
        <ModelPerformanceCard
          data={modelPerformanceQuery.data || []}
          isLoading={modelPerformanceQuery.isLoading}
        />

        {/* Best Times Heatmap */}
        <BestTimesHeatmap
          data={bestTimesQuery.data || []}
          isLoading={bestTimesQuery.isLoading}
        />
      </div>
    </div>
  )
}
