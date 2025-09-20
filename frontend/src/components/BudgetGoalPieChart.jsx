import { useRef, useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const BudgetGoalPieChart = ({ budgetPlan }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const chartRef = useRef(null);

  const colors = [
    "#4ADE80", // Green
    "#60A5FA", // Blue
    "#A855F7", // Purple
    "#F472B6", // Pink
    "#FBBF24", // Yellow
    "#EF4444", // Red
    "#34D399", // Teal
    "#8B5CF6", // Violet
    "#EC4899", // Fuchsia
    "#F97316", // Orange
    "#E879F9", // Magenta
  ];

  useEffect(() => {
    if (!budgetPlan || !budgetPlan.costs) {
      setChartData({ labels: [], datasets: [] });
      return;
    }

    const costs = budgetPlan.costs || [];
    const totalGoal = budgetPlan.goal;
    let totalPaid = 0;
    const paidByUser = {};
    const userNamesMap = {}; // track names from cost.users

    costs.forEach((cost) => {
      totalPaid += cost.paid;
      cost.users.forEach((user) => {
        paidByUser[user.id] = (paidByUser[user.id] || 0) + cost.paid;
        userNamesMap[user.id] = user.name; // store name for later
      });
    });

    const remaining = Math.max(0, totalGoal - totalPaid);
    const userIds = Object.keys(paidByUser);

    const userNames = userIds.map((id) => userNamesMap[id] || `Unknown User`);
    const userPayments = userIds.map((id) => paidByUser[id]);

    const data = {
      labels: [...userNames, "Unpaid"],
      datasets: [
        {
          label: "Paid vs. Unpaid",
          data: [...userPayments, remaining],
          backgroundColor: [...colors.slice(0, userIds.length), "#D1D5DB"], // Grey for unpaid
          borderColor: ["#fff", "#fff"],
          borderWidth: 1,
        },
      ],
    };
    setChartData(data);
  }, [budgetPlan]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed || 0;
            return `${label}: $${value.toFixed(2)}`;
          },
        },
      },
    },
  };

  if (!budgetPlan || !budgetPlan.goal || budgetPlan.goal <= 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 p-4">
        No goal set for this budget plan.
      </div>
    );
  }

  if (
    chartData.datasets.length === 0 ||
    chartData.datasets[0].data.length === 0
  ) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 p-4">
        Loading chart data...
      </div>
    );
  }

  const dataPoints = chartData.datasets[0].data;
  const labels = chartData.labels;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Progress Overview</h2>
      <div className="relative h-64 w-full sm:h-80">
        <Pie ref={chartRef} data={chartData} options={options} />
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Legend</h3>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {labels.map((label, index) => {
            const value = dataPoints[index];
            if (value > 0) {
              return (
                <li key={index} className="flex items-center space-x-2">
                  <span
                    className="block w-4 h-4 rounded-full"
                    style={{
                      backgroundColor:
                        chartData.datasets[0].backgroundColor[index],
                    }}
                  ></span>
                  <span className="text-sm">{label}</span>
                </li>
              );
            }
            return null;
          })}
        </ul>
      </div>
    </div>
  );
};

export default BudgetGoalPieChart;