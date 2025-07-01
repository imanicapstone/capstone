import React from "react";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";

const App = () => {
  
  return( 
  
  <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/user/:id" element={ <Dashboard />} />
      <Route path="/user" element={ <Login />} />

  </Routes>
  )
};

export default App;
