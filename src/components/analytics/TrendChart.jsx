import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const TrendChart = ({ data }) => {
  // FIX: Theme-aware chart — read CSS variables for colors
  const getThemeColors = () => {
    const root = getComputedStyle(document.documentElement);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      accent: root.getPropertyValue('--accent').trim() || (isDark ? '#38BDF8' : '#6366F1'),
      textColor: root.getPropertyValue('--text-secondary').trim() || (isDark ? '#9CA3AF' : '#6B7280'),
      gridColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    };
  };

  const colors = getThemeColors();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: colors.accent,
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
        bodyFont: { weight: '800', size: 12 },
        titleFont: { weight: '800', size: 10 },
        callbacks: {
          label: (context) => `${context.parsed.y} km/L`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
          color: colors.textColor,
          font: { size: 9, weight: '800' }
        },
        border: { display: false },
      },
      y: { 
        display: false,
        grid: { color: colors.gridColor },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        fill: true,
        data: data.map(d => d.efficiency),
        borderColor: colors.accent,
        borderWidth: 3,
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, colors.accent + '4D'); // 30% opacity
          gradient.addColorStop(1, colors.accent + '00'); // 0% opacity
          return gradient;
        },
        tension: 0.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: colors.accent,
        pointHoverBorderWidth: 4,
      },
      // Secondary dataset: spending trend
      {
        fill: false,
        data: data.map(d => d.spend ? d.spend / 100 : 0), // Scale down for visual comparison
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.5,
        pointRadius: 0,
        yAxisID: 'y',
      },
    ],
  };

  return (
    <div className="w-full h-full">
      <Line options={options} data={chartData} />
    </div>
  );
};

export default TrendChart;
