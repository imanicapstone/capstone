import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BudgetCard = ({ budget }) => {
  const monthStart = new Date(budget.monthStart).toLocaleDateString();

  return (
    <Card className="max-w-md mx-auto mb-6">
      <CardHeader>
        <CardTitle>Current Monthly Budget</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-2xl font-bold text-green-600">
            ${budget.amount.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600">Month starting: {monthStart}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetCard;
