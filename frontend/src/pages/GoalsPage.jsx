import React, { useEffect, useState } from "react";
import GoalCard from "../components/ui/GoalCard";
import GoalForm from "../components/GoalForm";
import Navbar from "../components/Navbar";

const GoalsPage = ({ userId }) => {
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    const fetchGoals = async () => {
      const res = await fetch(`/user/goals/${userId}`);
      const data = await res.json();
      setGoals(data);
    };
    fetchGoals();
  }, [userId]);

  const handleNewGoal = (goal) => {
    setGoals((prev) => [goal, ...prev]);
  };

  return (
    <div>
      <Navbar />
      <h2>My Financial Goals</h2>
      <GoalForm userId={userId} onGoalCreated={handleNewGoal} />
      <div className="goals-container">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
};

export default GoalsPage;
