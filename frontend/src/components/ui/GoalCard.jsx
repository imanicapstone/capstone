import React from "react";

const GoalCard = ({ goal }) => {
  const percent = Math.min(
    Math.round((goal.currentAmount / goal.targetAmount) * 100)
  );

  return (
    <div className="goal-card">
      <h3>{goal.title}</h3>
      <p>{goal.description}</p>
      <p>Target: {goal.targetAmount}</p>
      <p>Current: ${goal.currentAmount}</p>
    </div>
  );
};

export default GoalCard;
