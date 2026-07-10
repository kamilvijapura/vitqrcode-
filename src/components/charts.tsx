"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

function useChartColors() {
  const [c, setC] = useState({
    brand: "#4f46e5",
    secondary: "#0ea5e9",
    accent: "#f59e0b",
    success: "#16a34a",
    warning: "#d97706",
    danger: "#dc2626",
    grid: "#e8eaf0",
    text: "#8b93a3",
  });
  useEffect(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      const v = (n: string) =>
        cs.getPropertyValue(n).trim() || undefined;
      setC((prev) => ({
        brand: v("--color-brand") || prev.brand,
        secondary: v("--color-secondary") || prev.secondary,
        accent: v("--color-accent") || prev.accent,
        success: v("--color-success") || prev.success,
        warning: v("--color-warning") || prev.warning,
        danger: v("--color-danger") || prev.danger,
        grid: v("--color-border") || prev.grid,
        text: v("--color-subtle") || prev.text,
      }));
    };
    read();
    const t = setTimeout(read, 400);
    window.addEventListener("storage", read);
    return () => {
      clearTimeout(t);
      window.removeEventListener("storage", read);
    };
  }, []);
  return c;
}

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-pop">
      {label && <p className="mb-1 text-xs font-semibold text-content">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.color || p.fill }}
          />
          <span className="text-muted">{p.name}:</span>
          <span className="font-semibold text-content">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function AreaTrend({
  data,
  keys,
  height = 260,
}: {
  data: Record<string, any>[];
  keys: { key: string; name: string; color?: string }[];
  height?: number;
}) {
  const c = useChartColors();
  const palette = [c.brand, c.secondary, c.accent];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {keys.map((k, i) => {
            const color = k.color ?? palette[i % palette.length];
            return (
              <linearGradient key={k.key} id={`g-${k.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: c.text }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: c.text }} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<Tip />} />
        {keys.map((k, i) => {
          const color = k.color ?? palette[i % palette.length];
          return (
            <Area
              key={k.key}
              type="monotone"
              dataKey={k.key}
              name={k.name}
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#g-${k.key})`}
              dot={false}
              activeDot={{ r: 4 }}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarsChart({
  data,
  dataKey = "value",
  name = "value",
  height = 260,
  horizontal = false,
  color,
}: {
  data: Record<string, any>[];
  dataKey?: string;
  name?: string;
  height?: number;
  horizontal?: boolean;
  color?: string;
}) {
  const c = useChartColors();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 8, right: 12, left: horizontal ? 8 : -18, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={!horizontal} vertical={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11, fill: c.text }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: c.text }} axisLine={false} tickLine={false} width={90} />
          </>
        ) : (
          <>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: c.text }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: c.text }} axisLine={false} tickLine={false} width={40} />
          </>
        )}
        <Tooltip content={<Tip />} cursor={{ fill: "rgba(127,127,127,0.06)" }} />
        <Bar dataKey={dataKey} name={name} radius={[6, 6, 0, 0]} fill={color ?? c.brand} maxBarSize={42} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
  height = 240,
  colors,
}: {
  data: { label: string; value: number }[];
  height?: number;
  colors?: string[];
}) {
  const c = useChartColors();
  const palette = colors ?? [c.brand, c.secondary, c.accent, c.success, c.warning, c.danger];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius="58%"
          outerRadius="88%"
          paddingAngle={3}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Pie>
        <Tooltip content={<Tip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function LineTrend({
  data,
  keys,
  height = 220,
}: {
  data: Record<string, any>[];
  keys: { key: string; name: string }[];
  height?: number;
}) {
  const c = useChartColors();
  const palette = [c.brand, c.secondary, c.accent];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: c.text }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: c.text }} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<Tip />} />
        {keys.map((k, i) => (
          <Line
            key={k.key}
            type="monotone"
            dataKey={k.key}
            name={k.name}
            stroke={palette[i % palette.length]}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
