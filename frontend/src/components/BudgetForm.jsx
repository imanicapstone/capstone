import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BudgetForm = ({ userId, onBudgetCreated, currentUser }) => {
  const [form, setForm] = useState({
    amount: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = await currentUser.getIdToken();

      const res = await fetch("http://localhost:3000/user/budget", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "application/json",
        },
        body: JSON.stringify({ ...form, userId }),
      });

      const newBudget = await res.json();
      onBudgetCreated(newBudget);
      setForm({ amount: "" });
    } catch (error) {
      console.error("Error creating budget", error);
    }
  };

  return (
    <Card className="max-w-md mx-auto mb-6">
      <CardHeader>
        <CardTitle>Set Weekly Budget</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Weekly Budget Amount ($)</Label>
            <Input
              name="amount"
              id="amount"
              type="number"
              value={form.amount}
              onChange={handleChange}
              placeholder="500"
              required
            />
          </div>
          <Button type="submit" className="w-full bg-[#ceb8db]">
            Set Weekly Budget
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BudgetForm;
