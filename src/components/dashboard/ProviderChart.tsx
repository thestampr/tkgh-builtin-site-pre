"use client";

import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
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
} from 'chart.js';
import { Calendar, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Filler, CategoryScale, Legend);

export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface ProviderChartProps {
    initial: Array<{ date: string; value: number }>;
}

function group(points: Array<{ date: string; value: number }>, period: Period) {
    if (period === 'daily') return points;
    const map: Record<string, number> = {};
    for (const p of points) {
        const d = new Date(p.date + 'T00:00:00');
        let key: string;
        if (period === 'weekly') {
            const first = new Date(d.getTime());
            const day = (d.getDay() + 6) % 7; // ISO week start Monday
            first.setDate(d.getDate() - day);
            key = first.toISOString().slice(0, 10);
        } else if (period === 'monthly') {
            key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        } else { // yearly
            key = `${d.getFullYear()}`;
        }
        map[key] = (map[key] || 0) + p.value;
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
}

export const ProviderChart: React.FC<ProviderChartProps> = ({ initial }) => {
    const [period, setPeriod] = useState<Period>('daily');
    const [points, setPoints] = useState(initial);

    useEffect(() => {
        setPoints(group(initial, period));
    }, [period, initial]);

    const data = useMemo(() => {
        const labels = points.map(p => p.date);
        return {
            labels,
            datasets: [
                {
                    label: 'Views',
                    data: points.map(p => p.value),
                    borderColor: '#b18746',
                    backgroundColor: (ctx: any) => {
                        const { chart } = ctx;
                        const { ctx: c, chartArea } = chart || {};
                        if (!chartArea) return '#b18746';
                        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(193,150,84,0.4)');
                        gradient.addColorStop(1, 'rgba(193,150,84,0)');
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

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { intersect: false, mode: 'index' as const }
        },
        interaction: { intersect: false, mode: 'index' as const },
        scales: {
            x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } },
            y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true }
        }
    }), []);

    const PeriodButton = (p: Period, label: string) => (
        <button
            key={p}
            onClick={() => setPeriod(p)}
            className={clsx(
                'px-3 py-1.5 rounded-md text-xs font-medium border',
                period === p ? 'bg-secondary text-white shadow-sm' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            )}
        >{label}</button>
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-700"><TrendingUp size={16} /> <span>Views</span></div>
                <div className="flex items-center gap-2">{PeriodButton('daily', 'Daily')}{PeriodButton('weekly', 'Weekly')}{PeriodButton('monthly', 'Monthly')}{PeriodButton('yearly', 'Yearly')}</div>
            </div>
            <div className="relative w-full h-64">
                {points.length ? <Line data={data} options={options} /> : <div className="text-xs text-neutral-400 flex items-center gap-1"><Calendar size={14} /> No data</div>}
            </div>
        </div>
    );
};
