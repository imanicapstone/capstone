import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../constants";

// register ChartJS components
ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

const ExpenseChart = () => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!currentUser) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = await currentUser.getIdToken();
        const response = await fetch(`${API_BASE_URL}/plaid/transactions`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setTransactions(data);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Failed to fetch transactions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentUser]);

  // makes new set from transactions with only categories
  const categories = transactions
    ? [
        ...new Set(
          transactions.map(
            (transaction) => transaction.category || "Uncategorized"
          )
        ),
      ]
    : [];

  // creates new array filtering transactions to specific categories
  // iterates through each transaction and returns single value for category
  const categoryTotals = categories.map((category) => {
    return transactions
      .filter(
        (transaction) => (transaction.category || "Uncategorized") === category
      )
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  });

  // chart data configuration
  const chartData = {
    labels: categories,
    datasets: [
      {
        label: "Total Spent",
        data: categoryTotals,
        backgroundColor: ["rgba(255, 99, 132, 0.2)"],
        borderColor: [
          "rgba(255,99,132,1)",
          "rgba(54,162,235,1)",
          "rgba(255,206,86,1)",
          "rgba(75,192,192,1)",
          "rgba(153,102,255,1)",
          "rgba(255,159,64,1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Transaction History" },
    },
  };

  if (loading) return <div>Loading transactions...</div>;
  if (error) return <div>Error: {error}</div>;

  return <Bar data={chartData} options={options} />;
};

export default ExpenseChart;
