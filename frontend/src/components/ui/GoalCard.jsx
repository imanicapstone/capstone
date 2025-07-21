import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GoalCard = ({ goal }) => {
  const percent = Math.min(
    Math.round((goal.currentAmount / goal.targetAmount) * 100)
  );

  return (
    <Card className="mb-4 border-2 ">
      <CardHeader>
        <CardTitle style={{ color: "#6e6295" }}>{goal.title}</CardTitle>
        {goal.description && (
          <p className="text-sm text-gray-500">{goal.description}</p>
        )}
      </CardHeader>
    </Card>
  );
};

export default GoalCard;
