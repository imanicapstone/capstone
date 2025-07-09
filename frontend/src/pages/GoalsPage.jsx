import React, { useEffect, useState } from "react";
import GoalCard from "../components/ui/GoalCard";
import GoalForm from "../components/GoalForm";
import BudgetForm from "../components/BudgetForm";
import BudgetCard from "../components/BudgetCard";
import Navbar from "../components/Navbar";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../constants";

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [budget, setBudget] = useState(null);
  const { currentUser } = useAuth();

  const { id: userId } = useParams();
  const actualUserId = currentUser?.uid; // checks if user is loaded in first

  useEffect(() => {
    if (!currentUser || !actualUserId) {
      return;
    }
    const fetchGoals = async () => {
      try {
        const token = await currentUser.getIdToken();

        const res = await fetch(`${API_BASE_URL}/user/goals/${actualUserId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setGoals(Array.isArray(data) ? data : []);
        } else {
          setGoals([]);
        }
      } catch (error) {
        console.error("Error fetching goals:", error);
        setGoals([]);
      }
    };

    const fetchBudget = async () => {
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch(`${API_BASE_URL}/user/budget/${actualUserId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          setBudget(data);
        }
      } catch (error) {
        console.error("Error fetching budget:", error);
      }
    };

    fetchGoals();
    fetchBudget();
  }, [userId, actualUserId]);

  const handleNewGoal = (goal) => {
    setGoals((prev) => [goal, ...prev]);
  };

  const handleNewBudget = (newBudget) => {
    setBudget(newBudget);
  };

  return (
    <div>
      <Navbar />
      <h2
        className="text-4xl font-semibold text-center mb-24"
        style={{ color: "#6e6295" }}
      >
        My Financial Goals
      </h2>

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3
              className="text-2xl font-semibold mb-6"
              style={{ color: "#6e6295" }}
            >
              Weekly Budget
            </h3>
            {budget ? (
              <BudgetCard budget={budget} />
            ) : (
              <BudgetForm
                userId={currentUser.uid}
                onBudgetCreated={handleNewBudget}
                currentUser={currentUser}
              />
            )}
          </div>

          <GoalForm userId={currentUser.uid} onGoalCreated={handleNewGoal} />
          <div className="goals-container">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsPage;
