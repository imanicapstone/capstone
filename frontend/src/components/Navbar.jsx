import React from "react";
import { FaBars } from "react-icons/fa";
import Sidebar from "./Sidebar";
import { useEffect, useState } from "react";

const Navbar = () => {
  // usestate for sidebar will go here
  const [sideBarOpen, setSideBarOpen] = useState(false);

  const handleSidebar = () => setSideBarOpen((prev) => !prev);

  return (
    <nav className="flex items-center justify-between bg-white shadow px-4 py-3">
      <button onClick={handleSidebar}>
        <FaBars className="text-xl text-gray-700" />
      </button>

      <div className="flex flex-1">
        <Sidebar isOpen={sideBarOpen} onClose={() => setSideBarOpen(false)} />
      </div>

      <div className="flex-grow mx-4">
        <input
          type="text"
          placeholder="Search..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </nav>

    // will be checking for sidebar conditions here
  );
};

export default Navbar;
