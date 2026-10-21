// src/modules/holdings/executive-dashboard/accounts-receivable/components/ARSalesmanChart.tsx

"use client";

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { formatPeso, formatPhpShort } from '../utils';
import type { SalesmanARData } from '../types';

interface ARSalesmanChartProps {
  data: SalesmanARData[];
}

export function ARSalesmanChart({ data }: ARSalesmanChartProps) {
  return (
    <Card className="border border-border bg-card shadow-xs">
      <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-border/40">
        <div>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Top Salesmen by Exposure
          </CardTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Representatives managing the highest accounts receivable balances
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[240px] w-full">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No salesman exposure data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.15} />
                <XAxis
                  type="number"
                  tickFormatter={(val) => formatPhpShort(Number(val))}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  formatter={(val) => [formatPeso(Number(val)), 'Outstanding']}
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
