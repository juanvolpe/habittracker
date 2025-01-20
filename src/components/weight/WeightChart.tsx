'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';

const Line = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Line),
  { ssr: false }
);

// Register Chart.js components
if (typeof window !== 'undefined') {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    zoomPlugin
  );
}

interface Weight {
  id: string;
  weight: number;
  date: Date;
}

interface WeightChartProps {
  weights: Weight[];
  currentWeight: number;
  weightChange: number;
}

export default function WeightChart({ weights, currentWeight, weightChange }: WeightChartProps) {
  const chartRef = useRef<any>(null);

  // Prepare chart data
  const sortedWeights = weights.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const chartData = {
    datasets: [
      {
        label: 'Weight (kg)',
        data: sortedWeights.map(w => ({
          x: new Date(w.date),
          y: w.weight
        })),
        fill: false,
        borderColor: 'rgb(59, 130, 246)',
        tension: 0,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(59, 130, 246)'
      }
    ]
  };

  // Calculate min and max weights for Y axis padding
  const weightValues = sortedWeights.map(w => w.weight);
  const minWeight = Math.min(...weightValues);
  const maxWeight = Math.max(...weightValues);
  const yMin = weightValues.length > 0 ? minWeight - 15 : 50;
  const yMax = weightValues.length > 0 ? maxWeight + 10 : 100;
  const weightRange = yMax - yMin;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750,
      easing: 'easeInOutCubic' as const
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: true
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1e3a8a',
        bodyColor: '#1e3a8a',
        borderColor: '#93c5fd',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title(context: any) {
            const date = new Date(context[0].raw.x);
            return date.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          },
          label(context: any) {
            return `Weight: ${context.raw.y.toFixed(1)} kg`;
          },
          afterLabel(context: any) {
            const weights = sortedWeights.map(w => w.weight);
            const currentIndex = context.dataIndex;
            let change = '';
            
            if (currentIndex > 0) {
              const previousWeight = weights[currentIndex - 1];
              const currentWeight = weights[currentIndex];
              const diff = currentWeight - previousWeight;
              change = `Change: ${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`;
            }
            
            return change;
          }
        }
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x' as const,
          modifierKey: 'ctrl' as const
        },
        zoom: {
          wheel: {
            enabled: true,
            modifierKey: 'ctrl' as const
          },
          pinch: {
            enabled: true
          },
          mode: 'x' as const,
          drag: {
            enabled: true,
            backgroundColor: 'rgba(147, 197, 253, 0.3)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'month' as const,
          displayFormats: {
            month: 'MMM yyyy'
          },
          tooltipFormat: 'PP'
        },
        title: {
          display: true,
          text: 'Date'
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        type: 'linear' as const,
        min: yMin,
        max: yMax,
        beginAtZero: false,
        title: {
          display: true,
          text: 'Weight (kg)'
        },
        ticks: {
          stepSize: Math.ceil(weightRange / 8),
          callback: function(value: any) {
            return value.toFixed(1) + ' kg';
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Weight Tracking</h2>
          <p className="text-sm text-gray-500">Your weight evolution over time</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{currentWeight.toFixed(1)} kg</div>
          <div className={`text-sm ${weightChange > 0 ? 'text-red-500' : weightChange < 0 ? 'text-green-500' : 'text-gray-500'}`}>
            {weightChange !== 0 ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : 'No change'} from last month
          </div>
        </div>
      </div>
      <div className="relative">
        <div className="h-64">
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        </div>
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={handleResetZoom}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
          >
            Reset Zoom
          </button>
        </div>
      </div>
    </div>
  );
} 