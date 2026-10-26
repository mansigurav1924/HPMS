import React from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Card } from './ui';

export const CHART_COLORS = ['#6366F1', '#8B5CF6', '#38BDF8', '#34D399', '#FBBF24', '#FB7185', '#94A3B8'];

export function ChartCard({ title, subtitle, children, className = '', empty }) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="font-bold text-brand-navy">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {empty ? (
        <div className="h-64 flex items-center justify-center text-sm text-gray-400">No data to chart yet.</div>
      ) : (
        <div className="h-64">{children}</div>
      )}
    </Card>
  );
}

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #E5E7EB',
  boxShadow: '0 10px 30px -8px rgba(15,21,53,.18)',
  fontSize: 12,
};

/** series: [{ key, label }]; data: [{ name, [key]: number }] */
export function SimpleBarChart({ data, series }) {
  const reduce = useReducedMotion();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF0F6" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,.06)' }} />
        {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={CHART_COLORS[i % CHART_COLORS.length]}
            radius={[8, 8, 0, 0]}
            maxBarSize={36}
            isAnimationActive={!reduce}
            animationDuration={700}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** data: [{ name, value }] */
export function DonutChart({ data }) {
  const reduce = useReducedMotion();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={58}
          outerRadius={88}
          paddingAngle={3}
          stroke="none"
          isAnimationActive={!reduce}
          animationDuration={700}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Turn a {key: count} object into chart rows. */
export const objectToRows = (obj = {}) =>
  Object.entries(obj || {})
    .map(([k, v]) => ({ name: String(k).replace(/_/g, ' '), value: Number(v) || 0 }))
    .filter((r) => r.value > 0);
