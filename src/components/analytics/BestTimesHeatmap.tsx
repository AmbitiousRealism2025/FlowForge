'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { BestTimesHeatmapProps, ProductivityHeatmapData } from '@/types'
import { findBestTimeOfDay } from '@/lib/advancedAnalytics'
import { Calendar, Clock } from 'lucide-react'

export function BestTimesHeatmap({ data, isLoading }: BestTimesHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<ProductivityHeatmapData | null>(null)

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Create 7x24 grid structure
  const gridData: Map<string, ProductivityHeatmapData> = new Map()
  data.forEach((item) => {
    const key = `${item.dayOfWeek}-${item.hour}`
    gridData.set(key, item)
  })

  // Get color based on score
  const getColor = (score: number, sessionCount: number) => {
    if (sessionCount === 0 || score === 0) return 'hsl(var(--muted))'
    if (score >= 7) return 'hsl(var(--flow-green))'
    if (score >= 4) return 'hsl(var(--caution-amber))'
    return 'hsl(var(--stuck-red))'
  }

  // Get opacity based on session count
  const getOpacity = (sessionCount: number) => {
    if (sessionCount === 0) return 0.1
    if (sessionCount >= 5) return 1
    if (sessionCount >= 3) return 0.7
    if (sessionCount >= 1) return 0.4
    return 0.1
  }

  // Find best time for highlighting
  const bestTime = data.length > 0 ? findBestTimeOfDay(data) : 'Not enough data'
  const bestCell = data.length > 0 ? data.reduce((best, current) =>
    current.averageScore > best.averageScore ? current : best
  ) : null

  // Format hour for display
  const formatHour = (hour: number) => {
    if (hour === 0) return '12a'
    if (hour < 12) return `${hour}a`
    if (hour === 12) return '12p'
    return `${hour - 12}p`
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Best Times to Code</CardTitle>
          </div>
          <CardDescription>Loading productivity patterns...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] animate-pulse bg-muted rounded" />
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
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Best Times to Code</CardTitle>
          </div>
          <CardDescription>No productivity patterns yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex flex-col items-center justify-center text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No productivity patterns yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Complete more sessions to discover your best coding times
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const cellWidth = 30
  const cellHeight = 30
  const labelWidth = 40
  const labelHeight = 20

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-flow-green" />
          <CardTitle>Best Times to Code</CardTitle>
        </div>
        <CardDescription>
          You&apos;re most productive on <span className="font-semibold text-foreground">{bestTime}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${labelWidth + cellWidth * 24} ${labelHeight + cellHeight * 7}`}
            className="w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Hour labels (X-axis) */}
            {[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => (
              <text
                key={`hour-${hour}`}
                x={labelWidth + hour * cellWidth + cellWidth / 2}
                y={labelHeight - 5}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
              >
                {formatHour(hour)}
              </text>
            ))}

            {/* Day labels (Y-axis) */}
            {dayNames.map((day, dayIndex) => (
              <text
                key={`day-${dayIndex}`}
                x={labelWidth - 5}
                y={labelHeight + dayIndex * cellHeight + cellHeight / 2 + 4}
                textAnchor="end"
                className="text-xs fill-muted-foreground"
              >
                {day}
              </text>
            ))}

            {/* Heatmap cells */}
            {dayNames.map((_, dayIndex) =>
              hours.map((hour) => {
                const key = `${dayIndex}-${hour}`
                const cellData = gridData.get(key) || {
                  dayOfWeek: dayIndex,
                  hour,
                  averageScore: 0,
                  sessionCount: 0,
                }
                const isBest = bestCell &&
                  bestCell.dayOfWeek === dayIndex &&
                  bestCell.hour === hour

                return (
                  <rect
                    key={key}
                    x={labelWidth + hour * cellWidth}
                    y={labelHeight + dayIndex * cellHeight}
                    width={cellWidth - 2}
                    height={cellHeight - 2}
                    fill={getColor(cellData.averageScore, cellData.sessionCount)}
                    fillOpacity={getOpacity(cellData.sessionCount)}
                    stroke={isBest ? 'hsl(var(--flow-green))' : 'hsl(var(--border))'}
                    strokeWidth={isBest ? 2 : 1}
                    className={`cursor-pointer transition-all ${
                      isBest ? 'drop-shadow-lg animate-pulse' : ''
                    }`}
                    onMouseEnter={() => setHoveredCell(cellData)}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                )
              })
            )}
          </svg>
        </div>

        {/* Hover tooltip */}
        {hoveredCell && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium">
              {dayNames[hoveredCell.dayOfWeek]} at {formatHour(hoveredCell.hour)}
            </p>
            <p className="text-muted-foreground">
              Average Score: <span className="font-semibold text-foreground">{hoveredCell.averageScore.toFixed(1)}</span>
            </p>
            <p className="text-muted-foreground">
              Sessions: <span className="font-semibold text-foreground">{hoveredCell.sessionCount}</span>
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--stuck-red))' }} />
            <span className="text-muted-foreground">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--caution-amber))' }} />
            <span className="text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--flow-green))' }} />
            <span className="text-muted-foreground">High</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
