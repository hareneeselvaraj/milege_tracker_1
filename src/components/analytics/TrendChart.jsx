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
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#a78bfa',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
        bodyFont: { weight: '800', size: 12 },
        titleFont: { weight: '800', size: 10 }
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.2)', font: { size: 8, weight: '800' } },
      },
      y: { display: false },
    },
  };

  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        fill: true,
        data: data.map(d => d.efficiency),
        borderColor: '#a78bfa',
        borderWidth: 3,
        backgroundGradient: 'linear-gradient(to bottom, #a78bfa, transparent)',
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(167, 139, 250, 0.3)');
          gradient.addColorStop(1, 'rgba(167, 139, 250, 0)');
          return gradient;
        },
        tension: 0.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#a78bfa',
        pointHoverBorderWidth: 4,
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
