import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const {
    departmentsCount = 0,
    machinesCount = 0,
    failuresCount = 0,
    usersCount = 0,
    onLeaveCount = 0,
    leavesCount = 0,
    pendingLeavesCount = 0,
    currentProductionCount = 0,
    completedProductionCount = 0,
    allProductionPlansCount = 0,
    efficiencyRate = 0,
  } = (usePage().props as any);

  const stats = [
    { label: 'Wydziały', value: departmentsCount },
    { label: 'Maszyny', value: machinesCount },
    { label: 'Awarii', value: failuresCount },
    { label: 'Pracownicy', value: usersCount },
    { label: 'Na urlopie', value: onLeaveCount },
    { label: 'Urlopów', value: leavesCount },
    { label: 'Wnioski urlopowe', value: pendingLeavesCount },
    { label: 'Produkcja (obecnie)', value: currentProductionCount },
    { label: 'Wykonane rzeczy', value: completedProductionCount },
    { label: 'Procesy produkcyjne', value: allProductionPlansCount },
  ];

  const barData = {
    labels: stats.map((s) => s.label),
    datasets: [
      {
        label: 'Statystyki',
        data: stats.map((s) => s.value),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Podsumowanie statystyk' },
    },
  };

  const productionDoughnutData = {
    labels: ['W toku', 'Wykonane'],
    datasets: [
      {
        data: [currentProductionCount, completedProductionCount],
        backgroundColor: ['rgba(245, 158, 11, 0.75)', 'rgba(34, 197, 94, 0.75)'],
      },
    ],
  };

  const efficiencyData = {
    labels: ['Wydajność', 'Pozostało'],
    datasets: [
      {
        data: [efficiencyRate, Math.max(0, 100 - Number(efficiencyRate))],
        backgroundColor: ['rgba(37, 99, 235, 0.8)', 'rgba(229, 231, 235, 0.8)'],
      },
    ],
  };

  return (
    <div className="p-8">
      <Head title="Admin Dashboard" />
      <h1 className="text-3xl font-bold mb-8">Panel administratora</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-6 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded shadow p-6 flex flex-col items-center">
            <span className="text-2xl font-bold text-blue-600">{stat.value}</span>
            <span className="text-gray-700 mt-2 text-center">{stat.label}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded shadow p-6 xl:col-span-2">
          <Bar data={barData} options={barOptions} />
        </div>
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Produkcja: w toku vs wykonane</h2>
          <Doughnut data={productionDoughnutData} />
        </div>
        <div className="bg-white rounded shadow p-6 xl:col-span-3">
          <h2 className="text-lg font-semibold mb-4">Wynik wydajnosci</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="max-w-xs mx-auto">
              <Doughnut data={efficiencyData} />
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-700">{efficiencyRate}%</p>
              <p className="text-gray-600 mt-2">
                Procent zakonczonych procesow produkcyjnych wzgledem wszystkich zaplanowanych procesow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
