'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';

interface BarChartProps {
  data: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
}

export function RevenueExpenseChart({ data }: BarChartProps) {
  return (
    <div className="w-full h-80 font-mono text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#222222" opacity={0.1} />
          <XAxis dataKey="month" stroke="#888888" tickLine={false} />
          <YAxis stroke="#888888" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111111',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#F2F0E9',
            }}
          />
          <Legend wrapperStyle={{ paddingTop: 10 }} />
          <Bar dataKey="revenue" name="Revenue (€)" fill="#2E4036" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses (€)" fill="#CC5833" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PieChartProps {
  data: Array<{ name: string; value: number }>;
}

const COLORS = [
  '#2E4036', // Moss
  '#CC5833', // Clay
  '#CC8A33', // Mustard
  '#3373CC', // Blue
  '#9933CC', // Purple
  '#CC3366', // Crimson
  '#33CC99', // Mint
  '#7C8D84', // Sage
];

export function ExpenseCategoryChart({ data }: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center text-xs text-dark/40 font-mono">
        NO EXPENSE DATA IN THIS RANGE
      </div>
    );
  }

  return (
    <div className="w-full h-72 font-mono text-xs flex flex-col justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#111111',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#F2F0E9',
            }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{ fontSize: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface LineChartProps {
  data: Array<{ month: string; revenue: number; profit: number }>;
}

export function MarginTrendsChart({ data }: LineChartProps) {
  const processedData = data.map((item) => {
    const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
    return {
      month: item.month,
      margin: parseFloat(margin.toFixed(1)),
    };
  });

  return (
    <div className="w-full h-80 font-mono text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={processedData}
          margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#222222" opacity={0.1} />
          <XAxis dataKey="month" stroke="#888888" tickLine={false} />
          <YAxis
            stroke="#888888"
            tickLine={false}
            axisLine={false}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111111',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#F2F0E9',
            }}
          />
          <Legend wrapperStyle={{ paddingTop: 10 }} />
          <Line
            type="monotone"
            dataKey="margin"
            name="Profit Margin (%)"
            stroke="#2E4036"
            strokeWidth={3}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
