import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const recentTransactions = ({ userId }) => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch(`/plaid/transactions`)
      .then((res) => res.json())
      .then((data) => setTransactions(data));
  }, [userId]);

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
        <Card className=" w-[48vw] max-w-[600px] min-w-[280px] h-25 bg-[#ceb8db] cursor-pointer hover:bg-[#6f6493] transition-colors duration-300">
          <CardHeader>
            <CardTitle className="text-gray-50 text-xl font-semibold">
              <ul>
                {transactions.map((tx) => (
                  <li key={tx.id}>
                    {tx.date.slice(0, 10)} - {tx.name} - ${tx.amount.toFixed(2)}{" "}
                    - {tx.merchant}
                  </li>
                ))}
              </ul>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default recentTransactions;
