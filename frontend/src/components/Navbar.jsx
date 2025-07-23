import React from "react";
import { FaBars } from "react-icons/fa";
import Sidebar from "./Sidebar";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [sideBarOpen, setSideBarOpen] = useState(false);
  const [searchBarInput, setSearchBarInput] = useState("")

  const handleSidebar = () => setSideBarOpen((prev) => !prev);

  const navigate = useNavigate();

  const { currentUser } = useAuth();
    const userId = currentUser ? currentUser.uid : "";

  
  const handleSearchNavigation = (e) => {
  if (e.key === 'Enter' && searchBarInput) {
    const links = [
      { path: `/user/${userId}`, label: "Dashboard" },
      { path: `/user/goals/${userId}`, label: "Goals" },
      { path: `/user/${userId}/reminders`, label: "Reminders" },
      { path: `/user/${userId}/transactions`, label: "Transactions" },
      { path: `/user/${userId}/settings`, label: "Settings" },
      { path: `/user/${userId}/expenses`, label: "Expenses" },

    ];
    // checks if search query matches any pages
    const matchingLink = links.find(link => 
        link.label.toLowerCase().includes(searchBarInput.toLowerCase())
      );
    // navigates if so 

      if (matchingLink) {
        navigate(matchingLink.path);
        setSearchBarInput(''); // clears search bar
      }
    }
  };


  return (
    <nav className="flex items-center justify-between bg-white shadow px-4 py-3">
      <button onClick={handleSidebar}>
        <FaBars className="text-xl text-gray-700" />
      </button>

      <div className="flex flex-1">
        <Sidebar isOpen={sideBarOpen} onClose={() => setSideBarOpen(false)}
          searchQuery={searchBarInput}
        />
      </div>

      <div className="flex-grow mx-4">
        <input
          type="text"
          placeholder="Search..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setSearchBarInput(e.target.value)}
          onKeyDown={handleSearchNavigation}
          value={searchBarInput}
        />
      </div>
    </nav>

  );
};

export default Navbar;
