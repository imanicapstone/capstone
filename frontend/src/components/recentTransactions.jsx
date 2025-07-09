import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../constants";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const recentTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

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
        setError("Failed to fetch transactions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentUser]);

  return (
    <div>
      <Navbar />

      <h2
        className="text-4xl font-semibold text-center mb-24"
        style={{ color: "#6e6295" }}
      >
        {" "}
        Recent Transactions{" "}
      </h2>
      <div className="flex justify-center">
        <Card className=" w-[48vw] max-w-[600px] min-w-[280px] h-300 bg-[#ceb8db]">
          <CardHeader>
            <CardTitle className="text-gray-50 text-xl font-semibold">
              {loading ? (
                <p>Loading transactions...</p>
              ) : error ? (
                <p className="text-red-200">{error}</p>
              ) : transactions.length === 0 ? (
                <p>No transactions found</p>
              ) : (
                <ul>
                  {transactions.map((tx) => (
                    <li key={tx.id}>
                      {tx.date.slice(0, 10)} - {tx.name} - $
                      {tx.amount.toFixed(2)} - {tx.merchant} - <br></br>{" "}
                      <br></br>
                    </li>
                  ))}
                </ul>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default recentTransactions;
