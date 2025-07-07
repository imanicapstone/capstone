import React, { useState, Effect } from 'react';
import { Routes, Route } from 'react-router-dom';
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
import { useNavigate, useLocation } from "react-router-dom";

const Reminders = () => {
    
    
    return (
        <div>
            <Navbar />

            <h2
        className="text-4xl font-semibold text-center mb-24"
        style={{ color: "#6e6295" }}
      >
        {" "}
        Reminders{" "}
      </h2>


        </div>
    )

}

export default Reminders;
