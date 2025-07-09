import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BudgetCard = ({ budget }) => {
  const weekStart = new Date(budget.weekStart).toLocaleDateString();

  return (
    <Card className="max-w-md mx-auto mb-6">
      <CardHeader>
        <CardTitle>Current Weekly Budget</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-2xl font-bold text-green-600">
            ${budget.amount.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600">Week starting: {weekStart}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetCard;
