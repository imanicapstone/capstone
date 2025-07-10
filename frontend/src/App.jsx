import React from "react";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import GoalsPage from "./pages/GoalsPage.jsx";
import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";
import RecentTransactions from "./components/RecentTransactions.jsx";
import Reminders from "./pages/Reminders.jsx";
import Settings from './pages/Settings';


const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/user/:id" element={<Dashboard />} />
      <Route path="/user" element={<Login />} />
      <Route path="/user/:id/goals" element={<GoalsPage />} />
      <Route path="/user/:id/reminders" element={<Reminders />} />
      <Route path="/user/:id/transactions" element={<RecentTransactions />} />
      <Route path="/user/:id/settings" element={<Settings />} />
    </Routes>
  );
};

export default App;
