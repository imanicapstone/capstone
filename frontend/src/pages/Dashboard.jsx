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

import Navbar from "../components/Navbar";

const Dashboard = () => {
  return (
    <div> 
    <Navbar /> 
    <div className="flex flex-col items-start justify-center space-y-10 p-0 h-screen w-screen max-w-full text-[#887bb0] font-sans"> 
      <Card className=" ml-0 w-[48vw] max-w-[600px] min-w-[280px] h-25 bg-[#ceb8db] cursor-pointer hover:bg-[#6f6493] transition-colors duration-300">
        <CardHeader>
          <CardTitle className="text-gray-50 text-xl font-semibold">
            Upcoming Expenses
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="w-[48vw] max-w-[600px] min-w-[280px] h-48 bg-[#ceb8db] cursor-pointer hover:bg-[#6f6493] transition-colors duration-300">
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
    </div>
</div>
  );
};

export default Dashboard;
