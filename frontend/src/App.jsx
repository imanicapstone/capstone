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
import Expenses from './pages/Expenses';
import { useAuth } from "./context/AuthContext";


const App = () => {
  const { currentUser } = useAuth();
  const userId = currentUser ? currentUser.uid : "";
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path={`/user/${userId}`} element={<Dashboard />} />
      <Route path="/user/login" element={<Login />} />
      <Route path={`/user/goals/${userId}`} element={<GoalsPage />} />
      <Route path={`/user/${userId}/reminders`} element={<Reminders />} />
      <Route path={`/user/${userId}/transactions`} element={<RecentTransactions />} />
      <Route path={`/user/${userId}/settings`} element={<Settings />} />
      <Route path={`/user/${userId}/expenses`} element={<Expenses />} />

    </Routes>
  );
};

export default App;
