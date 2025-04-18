import React from 'react';

// Utility to format YYYY-MM-DD or ISO date strings to MM-DD-YYYY
function formatDateMMDDYYYY(dateString: string) {
  if (!dateString) return '';
  // Handles both YYYY-MM-DD and ISO strings
  const [year, month, day] = dateString.slice(0, 10).split('-');
  return `${month}-${day}-${year}`;
}

function formatDateTimeTooltip(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString();
}

import {
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  LineChart,
} from 'recharts';

// Use a color palette similar to the app's UI (adjust as needed)
const palette = {
  primary: '#6C63FF', // purple
  secondary: '#FF6584', // pink
  accent: '#43D9AD', // teal
  background: '#F7F7FB', // light gray
  yellow: '#FFD600',
  blue: '#3B82F6',
  gray: '#BDBDBD',
};

// Chart for Sleep: Bar for daily hours, line for average
export const SleepChart = ({ data, avg }: { data: Array<{ date: string; startDateTime?: string; hours?: number }>; avg?: number }) => (
  <div style={{ margin: '1em 0' }}>
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart data={data} margin={{ top: 20, right: 20, left: 50, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="startDateTime" tickFormatter={formatDateMMDDYYYY} />
        <YAxis
          label={{
            value: 'Hours',
            angle: -90,
            position: 'insideLeft',
            dx: -10,
            style: { textAnchor: 'middle', fontWeight: 600, fontSize: 15, fill: '#333' },
          }}
        />
        <Tooltip labelFormatter={formatDateTimeTooltip} />
        <Legend />
        <Bar dataKey="hours" name="Sleep Hours" fill={palette.primary} radius={[6, 6, 0, 0]} />
        {typeof avg === 'number' && (
          <Line type="monotone" dataKey={() => avg} name="Average" stroke={palette.secondary} dot={false} />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);

// Chart for Diapers: Stacked bar for wet/dirty per day
export const DiaperChart = ({ data }: { data: Array<{ date: string; startDateTime?: string; wet?: number; dirty?: number }> }) => (
  <div style={{ margin: '1em 0' }}>
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 20, right: 20, left: 50, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="startDateTime" tickFormatter={formatDateMMDDYYYY} />
        <YAxis
          label={{
            value: 'Count',
            angle: -90,
            position: 'insideLeft',
            dx: -10,
            style: { textAnchor: 'middle', fontWeight: 600, fontSize: 15, fill: '#333' },
          }}
        />
        <Tooltip labelFormatter={formatDateTimeTooltip} />
        <Legend />
        <Bar dataKey="wet" name="Wet" stackId="a" fill={palette.blue} />
        <Bar dataKey="dirty" name="Dirty" stackId="a" fill={palette.yellow} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// Chart for Nursing: Line chart for left/right duration per day
export function NursingChart({ data }: { data: Array<{ date: string; startDateTime?: string; side?: string; duration?: number }> }) {
  // Aggregate durations per day per side, and keep earliest startDateTime for each day
  const chartData: Record<string, { date: string; left: number; right: number; startDateTime: string }> = {};
  data.forEach((entry) => {
    const key = entry.date.slice(0, 10); // YYYY-MM-DD
    const entryDateTime = entry.startDateTime || entry.date;
    if (!chartData[key]) {
      chartData[key] = { date: key, left: 0, right: 0, startDateTime: entryDateTime };
    }
    if (entry.side === 'left') chartData[key].left += entry.duration || 0;
    else if (entry.side === 'right') chartData[key].right += entry.duration || 0;
    // Update to earliest startDateTime for the day
    if (entry.startDateTime && entry.startDateTime < chartData[key].startDateTime) {
      chartData[key].startDateTime = entry.startDateTime;
    }
  });
  const dataArr = Object.values(chartData).sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div style={{ margin: '1em 0' }}>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={dataArr} margin={{ top: 20, right: 30, left: 50, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="startDateTime" tickFormatter={formatDateMMDDYYYY} />
          <YAxis
            label={{
              value: 'Duration (min)',
              angle: -90,
              position: 'insideLeft',
              dx: -10,
              style: { textAnchor: 'middle', fontWeight: 600, fontSize: 15, fill: '#333' },
            }}
          />
          <Tooltip labelFormatter={formatDateTimeTooltip} />
          <Legend />
          <Line type="monotone" dataKey="left" name="Left Side" stroke={palette.primary} dot={true} />
          <Line type="monotone" dataKey="right" name="Right Side" stroke={palette.secondary} dot={true} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Chart for Bottle: Bar for total bottles per day, with average line if available
export const BottleChart = ({ data, avg }: { data: Array<{ date: string; startDateTime?: string; volume?: number }>; avg?: number }) => (
  <div style={{ margin: '1em 0' }}>
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart data={data} margin={{ top: 20, right: 20, left: 50, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="startDateTime" tickFormatter={formatDateMMDDYYYY} />
        <YAxis
          label={{
            value: 'Bottles',
            angle: -90,
            position: 'insideLeft',
            dx: -10,
            style: { textAnchor: 'middle', fontWeight: 600, fontSize: 15, fill: '#333' },
          }}
        />
        <Tooltip labelFormatter={formatDateTimeTooltip} />
        <Legend />
        <Bar dataKey="bottles" name="Bottles" fill={palette.yellow} radius={[6, 6, 0, 0]} />
        {typeof avg === 'number' && (
          <Line type="monotone" dataKey={() => avg} name="Average" stroke={palette.primary} dot={false} />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);

// Chart for Potty: Bar for pee/poop per day
export const PottyChart = ({ data }: { data: Array<{ date: string; startDateTime?: string; pee?: number; poop?: number }> }) => (
  <div style={{ margin: '1em 0' }}>
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 20, right: 20, left: 50, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="startDateTime" tickFormatter={formatDateMMDDYYYY} />
        <YAxis
          label={{
            value: 'Count',
            angle: -90,
            position: 'insideLeft',
            dx: -10,
            style: { textAnchor: 'middle', fontWeight: 600, fontSize: 15, fill: '#333' },
          }}
        />
        <Tooltip labelFormatter={formatDateTimeTooltip} />
        <Legend />
        <Bar dataKey="pee" name="Pee" fill={palette.primary} />
        <Bar dataKey="poop" name="Poop" fill={palette.secondary} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// Chart for Growth: Line chart for weight/height over time
export const GrowthChart = ({ data }: { data: Array<{ date: string; startDateTime?: string; weight?: number; height?: number }> }) => (
  <div style={{ margin: '1em 0' }}>
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 20, right: 20, left: 50, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="startDateTime" tickFormatter={formatDateMMDDYYYY} />
        <YAxis
          label={{
            value: 'Weight/Height',
            angle: -90,
            position: 'insideLeft',
            dx: -10,
            style: { textAnchor: 'middle', fontWeight: 600, fontSize: 15, fill: '#333' },
          }}
        />
        <Tooltip labelFormatter={formatDateTimeTooltip} />
        <Legend />
        <Line type="monotone" dataKey="weight" name="Weight" stroke={palette.primary} dot={true} />
        <Line type="monotone" dataKey="height" name="Height" stroke={palette.accent} dot={true} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// Chart for Temperature: Line chart for readings
export const TemperatureChart = ({ data }: { data: Array<{ date: string; startDateTime?: string; temperature?: number }> }) => (
  <div style={{ margin: '1em 0' }}>
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 20, right: 20, left: 50, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="startDateTime" tickFormatter={formatDateMMDDYYYY} />
        <YAxis
          label={{
            value: 'Temperature',
            angle: -90,
            position: 'insideLeft',
            dx: -10,
            style: { textAnchor: 'middle', fontWeight: 600, fontSize: 15, fill: '#333' },
          }}
        />
        <Tooltip labelFormatter={formatDateTimeTooltip} />
        <Legend />
        <Line type="monotone" dataKey="temperature" name="Temperature" stroke={palette.secondary} dot={true} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// Chart for Solids: Bar for amount per day
export const SolidsChart = ({ data }: { data: Array<{ date: string; startDateTime?: string; amount?: number }> }) => (
  <div style={{ margin: '1em 0' }}>
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 20, right: 20, left: 50, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="startDateTime" tickFormatter={formatDateMMDDYYYY} />
        <YAxis
          label={{
            value: 'Amount',
            angle: -90,
            position: 'insideLeft',
            dx: -10,
            style: { textAnchor: 'middle', fontWeight: 600, fontSize: 15, fill: '#333' },
          }}
        />
        <Tooltip labelFormatter={formatDateTimeTooltip} />
        <Legend />
        <Bar dataKey="amount" name="Amount" fill={palette.accent} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// Chart for Medicine: Bar for doses per day
export const MedicineChart = ({ data }: { data: Array<{ date: string; startDateTime?: string; medicineName?: string }> }) => (
  <div style={{ margin: '1em 0' }}>
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 20, right: 20, left: 50, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="startDateTime" tickFormatter={formatDateMMDDYYYY} />
        <YAxis
          label={{
            value: 'Doses',
            angle: -90,
            position: 'insideLeft',
            dx: -10,
            style: { textAnchor: 'middle', fontWeight: 600, fontSize: 15, fill: '#333' },
          }}
        />
        <Tooltip labelFormatter={formatDateTimeTooltip} />
        <Legend />
        <Bar dataKey="doses" name="Doses" fill={palette.gray} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
