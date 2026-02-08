'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function LiveTrafficChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Generate initial data on client mount to avoid hydration mismatch
    const initialData = Array.from({ length: 20 }, (_, i) => ({
      time: new Date(Date.now() - (20 - i) * 5000).toLocaleTimeString(),
      packets: Math.floor(Math.random() * 2000) + 500,
      anomalies: Math.random() > 0.9 ? Math.floor(Math.random() * 50) : 0,
    }));
    setData(initialData);

    const interval = setInterval(() => {
      setData((prevData) => {
        const newDataPoint = {
          time: new Date().toLocaleTimeString(),
          packets: Math.floor(Math.random() * 2000) + 500,
          anomalies: Math.random() > 0.9 ? Math.floor(Math.random() * 50) + 5 : 0,
        };
        const updatedData = [...prevData.slice(1), newDataPoint];
        return updatedData;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPackets" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorAnomalies" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
          <XAxis
            dataKey="time"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Area
            type="monotone"
            dataKey="packets"
            stroke="hsl(var(--primary))"
            fill="url(#colorPackets)"
            fillOpacity={1}
            strokeWidth={2}
          />
           <Area
            type="monotone"
            dataKey="anomalies"
            stroke="hsl(var(--destructive))"
            fill="url(#colorAnomalies)"
            fillOpacity={1}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
