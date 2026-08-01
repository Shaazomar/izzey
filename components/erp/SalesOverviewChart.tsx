'use client';

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ChartDataPoint {
  date: string;
  sales: number;
  paid: number;
}

interface SalesOverviewChartProps {
  data?: ChartDataPoint[];
}

const defaultData: ChartDataPoint[] = [
  { date: '01', sales: 200, paid: 150 },
  { date: '05', sales: 1200, paid: 800 },
  { date: '10', sales: 1500, paid: 1100 },
  { date: '15', sales: 2200, paid: 1600 },
  { date: '20', sales: 2600, paid: 2000 },
  { date: '25', sales: 3100, paid: 2400 },
  { date: '30', sales: 4300, paid: 3200 },
];

export default function SalesOverviewChart({ data }: SalesOverviewChartProps) {
  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2E4036" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2E4036" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#CC5833" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#CC5833" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} 
            dy={8}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
            tickFormatter={(val) => `€ ${val >= 1000 ? `${val / 1000}K` : val}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1A1A1A', 
              borderColor: '#2E4036/20', 
              borderRadius: '12px', 
              color: '#FFFFFF',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
              padding: '10px 14px',
              fontSize: '12px'
            }}
            formatter={(value: any, name: any) => [
              `€ ${Number(value).toLocaleString('de-DE', { minimumFractionDigits: 2 })}`,
              name === 'sales' ? 'Sales' : 'Paid'
            ]}
          />
          <Area 
            type="monotone" 
            dataKey="sales" 
            stroke="#2E4036" 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill="url(#salesGrad)" 
            name="sales"
          />
          <Area 
            type="monotone" 
            dataKey="paid" 
            stroke="#CC5833" 
            strokeWidth={2.5} 
            strokeDasharray="4 4" 
            fillOpacity={1} 
            fill="url(#paidGrad)" 
            name="paid"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
