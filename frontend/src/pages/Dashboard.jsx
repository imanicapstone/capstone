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

const Dashboard = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const location = useLocation();
  const userId = location.pathname.split('/')[2]; // Extract user ID from URL

  const handleTransactionClick = () => {
    navigate(`/transactions/${userId}`);
  };

  const handleRemindersClick = () => {
    navigate(`/reminders/${userId}`);
  }

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
              <CardTitle className="text-gray-50 text-xl font-semibold">
                Goals
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="w-[48vw] max-w-[600px] min-w-[280px] h-48 bg-[#ceb8db] cursor-pointer hover:bg-[#6f6493] transition-colors duration-300"
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

          <Card className=" ml-0 w-[48vw] max-w-[600px] min-w-[280px] h-25 bg-[#ceb8db] cursor-pointer hover:bg-[#6f6493] transition-colors duration-300"
          onClick={handleRemindersClick}>
            <CardHeader >
              <CardTitle className="text-gray-50 text-xl font-semibold">
                Reminders
              </CardTitle>
              <CardAction></CardAction>
            </CardHeader>
          </Card>
        </div>

        <div style={{ marginLeft: "40px" }}>
          <CircularLoader size={300} percentageSpent={62} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
