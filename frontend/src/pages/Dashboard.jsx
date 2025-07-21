import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import BankStatus from "../components/BankStatus";
import Navbar from "../components/Navbar";
import CircularLoader from "../components/CircularLoader";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../constants";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const location = useLocation();
  const userId = location.pathname.split("/")[2]; // Extract user ID from URL
  const [transactions, setTransactions] = useState([]);
  const [budget, setBudget] = useState(0);
  const [percentageSpent, setPercentageSpent] = useState(0);
  const { currentUser } = useAuth();

  const handleTransactionClick = () => {
    navigate(`/user/${userId}/transactions`);
  };

  const handleRemindersClick = () => {
    navigate(`/reminders/${userId}`);
  };

  const fetchTransactionsAndBudget = async () => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      const transactionsResponse = await fetch(
        `${API_BASE_URL}/plaid/transactions`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData);

        // total spent
        const totalSpent = transactionsData.reduce(
          (sum, transaction) =>
            sum + (transaction.amount < 0 ? -transaction.amount : 0),
          0
        );

        // fetch budget
        const budgetResponse = await fetch(
          `${API_BASE_URL}/user/budget/${currentUser.uid}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (budgetResponse.ok) {
          const budgetData = await budgetResponse.json();
          setBudget(budgetData.amount);

          // percentage spent
          const percentage = (totalSpent / budgetData.amount) * 100;
          setPercentageSpent(Math.min(percentage, 100)); // cap at 100
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchTransactionsAndBudget();
  }, [currentUser]);


  return (
    <div>
      <Navbar />
      <BankStatus />

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between", // space between cards and loader
          alignItems: "flex-start",
          width: "100%",
          padding: "40px",
          boxSizing: "border-box",
        }}
      >
        <div className="flex flex-col space-y-10 p-0 w-full max-w-[600px]">
          <Card className=" ml-0 w-[48vw] max-w-[600px] min-w-[280px] h-25 bg-[#ceb8db] cursor-pointer hover:bg-[#6f6493] transition-colors duration-300">
            <CardHeader>
              <CardTitle className="text-gray-50 text-xl font-semibold"
              onClick={handleGoalsClick}>
                Goals
              </CardTitle>
            </CardHeader>
          </Card>

          <Card
            className="w-[48vw] max-w-[600px] min-w-[280px] h-48 bg-[#ceb8db] cursor-pointer hover:bg-[#6f6493] transition-colors duration-300"
            onClick={handleTransactionClick}
          >
            <CardHeader>
              <CardTitle className="text-gray-50 text-xl font-semibold">
                Recent Transactions
              </CardTitle>
              <CardAction></CardAction>
            </CardHeader>

            <CardFooter>
              <p></p>
            </CardFooter>
          </Card>

          <Card
            className=" ml-0 w-[48vw] max-w-[600px] min-w-[280px] h-25 bg-[#ceb8db] cursor-pointer hover:bg-[#6f6493] transition-colors duration-300"
            onClick={handleRemindersClick}
          >
            <CardHeader>
              <CardTitle className="text-gray-50 text-xl font-semibold">
                Reminders
              </CardTitle>
              <CardAction></CardAction>
            </CardHeader>
          </Card>
        </div>

        <div style={{ marginLeft: "40px" }}>
          <CircularLoader size={300} percentageSpent={percentageSpent} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
