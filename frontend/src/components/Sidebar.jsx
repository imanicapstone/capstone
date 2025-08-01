import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const { logout } = useAuth();
  const [error, setError] = useState("");

  const handleSignOut = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userSignOut = await logout(auth);
      navigate("/user/login");
    } catch (error) {
      console.error(error);
      setError(error.message || "Logout Failed");
    }
  };

  const { currentUser } = useAuth();
  const userId = currentUser ? currentUser.uid : "";

  const links = [
    { path: `/user/${userId}`, label: "Dashboard" },
    { path: `/user/goals/${userId}`, label: "Goals" },
    { path: `/user/${userId}/reminders`, label: "Reminders" },
    { path: `/user/${userId}/transactions`, label: "Transactions" },
    { path: `/user/${userId}/settings`, label: "Settings" },
    { path: `/user/${userId}/expenses`, label: "Expenses" },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div
      className={`fixed top-0 left-0 h-screen w-64 bg-gray-100 border-r px-4 py-6 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <h2 className="text-2xl font-bold mb-8">Fina</h2>
      <div className="flex flex-col space-y-4">
        {links.map(({ path, label }) => {
          // if label matches secure links
          const isSecureMode = [
            "Transactions",
            "Expenses",
            "Settings",
          ].includes(label);

          return (
            <button
              key={path}
              onClick={() => handleNavigation(path)}
              className={cn(
                "text-left px-4 py-2 rounded transition",
                // if not secure link normal hover
                !isSecureMode && "hover:bg-gray-200",
                isSecureMode && "hover:cursor-lock",
                location.pathname === path && "bg-gray-300 font-semibold"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      <button onClick={onClose} className="mt-8 px-4 py-2 rounded">
        Close Sidebar
      </button>

      <button onClick={handleSignOut} className="mt-4 px-4 py-2 rounded">
        Sign Out
      </button>
    </div>
  );
};

export default Sidebar;
