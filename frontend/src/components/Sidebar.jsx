import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { path: "/user/:id", label: "Dashboard" },
    { path: `/user/:id/transactions`, label: "Transactions" },
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
          <button
            key={path}
            onClick={() => handleNavigation(path)}
            className={cn(
              "text-left px-4 py-2 rounded hover:bg-gray-200 transition",
              location.pathname === path && "bg-gray-300 font-semibold"
            )}
          >
            {label}
          </button>;
        })}
      </div>
      <button onClick={onClose} className="mt-8 px-4 py-2 rounded">
        Close Sidebar
      </button>
    </div>
  );
};

export default Sidebar;
