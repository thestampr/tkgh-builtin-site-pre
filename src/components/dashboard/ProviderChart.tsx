"use client";

import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Filler,
  CategoryScale,
  Legend
} from "chart.js";
import { Calendar, TrendingUp } from "lucide-react";
import clsx from "clsx";

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Filler, CategoryScale, Legend);

export type Period = "daily" | "weekly" | "monthly" | "yearly";

interface RawPoint { date: string; value: number }
interface ProviderChartProps { initial: RawPoint[] }

// Helper: zero-pad
const pad = (n: number, l = 2) => String(n).padStart(l, "0");
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DOW_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function startOfWeek(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x;
}

function daysInMonth(year: number, month: number) { // month 0-based
  return new Date(year, month + 1, 0).getDate();
}

function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Build a map for quick aggregation. Accept date strings optionally with time (ISO-like)
function normalizeRaw(points: RawPoint[]): { date: Date; value: number; hour: number }[] {
  return points.map(p => {
    // Accept "YYYY-MM-DD" or full ISO with time
    const hasTime = p.date.length > 10;
    const d = hasTime ? new Date(p.date) : new Date(p.date + "T00:00:00");
    return { date: d, value: p.value, hour: d.getHours() };
  }).filter(p => !isNaN(p.date.getTime()));
}

function buildSeries(all: RawPoint[], period: Period) {
  const now = new Date();
  const normalized = normalizeRaw(all);

  switch (period) {
    case "daily": {
      // 24 hours of today
      const series: { date: string; value: number }[] = [];
      for (let h = 0; h < 24; h++) {
        const sum = normalized
          .filter(p => p.hour === h && isSameDate(p.date, now))
          .reduce((acc, cur) => acc + cur.value, 0);
        series.push({ date: `${pad(h)}:00`, value: sum });
      }
      return series;
    }

    case "weekly": {
      const start = startOfWeek(now); // Monday
      const series: { date: string; value: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        const sum = normalized
          .filter(p => isSameDate(p.date, d))
          .reduce((acc, cur) => acc + cur.value, 0);
        const dowIndex = (d.getDay() + 6) % 7; // Monday=0
        series.push({ date: DOW_SHORT[dowIndex], value: sum });
      }
      return series;
    }

    case "monthly": {
      const y = now.getFullYear();
      const m = now.getMonth();
      const dim = daysInMonth(y, m);
      const series: { date: string; value: number }[] = [];
      for (let day = 1; day <= dim; day++) {
        const d = new Date(y, m, day);
        const sum = normalized
          .filter(p => isSameDate(p.date, d))
          .reduce((acc, cur) => acc + cur.value, 0);
        series.push({ date: `${y}-${pad(m + 1)}-${pad(day)}`, value: sum });
      }
      return series;
    }

    case "yearly": {
      const y = now.getFullYear();
      const startYear = new Date(y, 0, 1);
      const endYear = new Date(y, 11, 31);
      const series: { date: string; value: number }[] = [];
      for (let d = new Date(startYear); d <= endYear; d.setDate(d.getDate() + 1)) {
        const sum = normalized
          .filter(p => isSameDate(p.date, d))
          .reduce((acc, cur) => acc + cur.value, 0);
        series.push({ date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, value: sum });
      }
      return series;
    }

    default:
      return [];
  }
}

export const ProviderChart: React.FC<ProviderChartProps> = ({ initial }) => {
  const [period, setPeriod] = useState<Period>("daily");
  const points = useMemo(() => buildSeries(initial, period), [initial, period]);

  const data = useMemo(() => {
    const labels = points.map(p => p.date);
    return {
      labels,
      datasets: [
        {
          label: "Views",
          data: points.map(p => p.value),
          borderColor: "#b18746",
          backgroundColor: (ctx: any) => {
            const { chart } = ctx;
            const { ctx: c, chartArea } = chart || {};
            if (!chartArea) return "#b18746";
            const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, "rgba(193,150,84,0.4)");
            gradient.addColorStop(1, "rgba(193,150,84,0)");
            return gradient;
          },
          fill: true,
          tension: 0.25,
          pointRadius: 2,
          pointHoverRadius: 5
        }
      ]
    };
  }, [points]);

  const options = useMemo(() => {
    const isMonthly = period === "monthly";
    const isYearly = period === "yearly";
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { intersect: false, mode: "index" as const }
      },
      interaction: { intersect: false, mode: "index" as const },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 0,
            autoSkip: !(isMonthly || isYearly),
            callback(value: any, idx: number) {
              const label = (data.labels as string[])[idx];
              if (isMonthly) {
                // show roughly every 5 days + first/last
                const day = parseInt(label.slice(-2), 10);
                if (Number.isNaN(day)) return label; // fallback
                if (day === 1 || day === 31 || day % 5 === 0) return String(day);
                return "";
              }
              if (isYearly) {
                // show month abbreviation on first day of each month
                const day = label.slice(-2);
                if (day !== "01") return "";
                const m = parseInt(label.slice(5,7), 10) - 1;
                return MONTH_SHORT[m] ?? label;
              }
              return label;
            }
          }
        },
        y: { grid: { color: "rgba(0,0,0,0.05)" }, beginAtZero: true }
      }
    };
  }, [period, data.labels]);

  const PeriodButton = (p: Period, label: string) => (
    <button
      key={p}
      onClick={() => setPeriod(p)}
      className={clsx(
        "btn btn-xs !py-1 !px-2",
        period === p ? "btn-secondary" : "btn-ghost"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-700"><TrendingUp size={16} /> <span>Views</span></div>
        <div className="flex items-center gap-2">{PeriodButton("daily", "Daily")}{PeriodButton("weekly", "Weekly")}{PeriodButton("monthly", "Monthly")}{PeriodButton("yearly", "Yearly")}</div>
      </div>
      <div className="relative w-full h-64">
        {points.length ? <Line data={data} options={options} /> : <div className="text-xs text-neutral-400 flex items-center gap-1"><Calendar size={14} /> No data</div>}
      </div>
    </div>
  );
};
