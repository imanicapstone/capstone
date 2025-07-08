import React, { useState, useEffect } from "react";
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
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id: urlUserId } = useParams();
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        setLoading(true);

        // check if user is authenticated
        if (!currentUser) {
          throw new Error("User not authenticated");
        }

        console.log("Current user:", currentUser.uid);
        const token = await currentUser.getIdToken();
        console.log("Token obtained:", token ? "Yes" : "No");

        // use the actual Firebase user ID instead of URL param
        const response = await fetch(
          `http://localhost:3000/reminders/${currentUser.uid}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.text();
          console.log("Error response:", errorData);
          throw new Error(`Failed to fetch reminders: ${response.status}`);
        }

        const data = await response.json();
        console.log("Response data:", data);
        setReminders(data.reminders || []);
      } catch (err) {
        console.error("Error fetching reminders:", err);
        setError(err.message);
        setReminders([]);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchReminders();
    } else {
      setLoading(false);
      setError("Please log in to view reminders");
    }
  }, [currentUser]);

  // handles load state
  if (loading) {
    return (
      <div>
        <Navbar />
        <h2
          className="text-4xl font-semibold text-center mb-24"
          style={{ color: "#6e6295" }}
        >
          Reminders
        </h2>
        <p className="text-center">Loading reminders...</p>
      </div>
    );
  }
  // handle error state
  if (error) {
    return (
      <div>
        <Navbar />
        <h2
          className="text-4xl font-semibold text-center mb-24"
          style={{ color: "#6e6295" }}
        >
          Reminders
        </h2>
        <p className="text-center text-red-500">Error: {error}</p>
      </div>
    );
  }
  // handle empty state
  if (!reminders || reminders.length === 0) {
    return (
      <div>
        <Navbar />
        <h2
          className="text-4xl font-semibold text-center mb-24"
          style={{ color: "#6e6295" }}
        >
          Reminders
        </h2>
        <p>No reminders found.</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <h2
        className="text-4xl font-semibold text-center mb-24"
        style={{ color: "#6e6295" }}
      >
        Reminders
      </h2>
      <ul className="max-w-4xl mx-auto px-4">
        {reminders.map(
          (
            reminder // Fix: use 'reminder' not 'reminders'
          ) => (
            <li key={reminder.id} className="mb-4 p-4 border rounded-lg">
              <h4 className="font-semibold text-lg">{reminder.title}</h4>
              <p className="text-gray-700">{reminder.message}</p>
              <p className="text-sm text-gray-500">
                {new Date(reminder.createdAt).toLocaleDateString()} -{" "}
                {reminder.type}
              </p>
            </li>
          )
        )}
      </ul>
    </div>
  );
};

export default Reminders;
