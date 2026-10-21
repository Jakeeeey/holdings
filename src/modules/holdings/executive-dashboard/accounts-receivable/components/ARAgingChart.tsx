// src/modules/holdings/executive-dashboard/accounts-receivable/components/ARAgingChart.tsx

"use client";

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { formatPeso, formatPhpShort } from '../utils';
import type { AgingBucket } from '../types';

interface ARAgingChartProps {
  data: AgingBucket[];
}

const BUCKET_COLORS = [
  '#10b981', // 0-30 Days: emerald (current/healthy)
  '#f59e0b', // 31-60 Days: amber
  '#f97316', // 61-90 Days: orange
  '#ef4444', // 90+ Days: red (critical)
];

export function ARAgingChart({ data }: ARAgingChartProps) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <Card className="border border-border bg-card shadow-xs">
      <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-border/40">
        <div>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Aging Analysis
          </CardTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Accounts receivable breakdown by overdue duration
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-foreground">
          {formatPeso(total)} Total
        </span>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(val) => formatPhpShort(Number(val))}
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip
                formatter={(val) => [formatPeso(Number(val)), 'Outstanding']}
                labelStyle={{ fontWeight: 'bold' }}
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={BUCKET_COLORS[index % BUCKET_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
