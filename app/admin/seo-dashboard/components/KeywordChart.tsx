'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = [
  'hsl(220, 70%, 50%)',
  'hsl(160, 60%, 45%)',
  'hsl(30, 80%, 55%)',
  'hsl(280, 60%, 55%)',
  'hsl(0, 70%, 55%)',
  'hsl(190, 70%, 45%)',
  'hsl(50, 80%, 50%)',
  'hsl(320, 60%, 50%)',
]

interface KeywordChartProps {
  chartData: Record<string, string | number | null>[]
  keywords: string[]
  loading: boolean
}

export default function KeywordChart({ chartData, keywords, loading }: KeywordChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Position Over Time (By Keyword)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No ranking data yet. Data appears after the first daily cron run.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis reversed domain={[1, 'auto']} fontSize={12} label={{ value: 'Position', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {keywords.map((kw, i) => (
                <Line
                  key={kw}
                  type="monotone"
                  dataKey={kw}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
