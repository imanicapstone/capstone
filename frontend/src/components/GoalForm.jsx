import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GoalForm = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    targetAmount: "",
    deadline: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/user/goal", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ ...form, userId, currentAmount: 0 }),
    });

    if (res.ok) {
      const newGoal = await res.json();
      onGoalCreated(newGoal);
      setForm({
        title: "",
        description: "",
        targetAmount: "",
        deadline: "",
      });
    } else {
      const error = await res.json();
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Set a New Goal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              name="title"
              id="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Save for a new laptop"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              name="description"
              id="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional details"
            />
          </div>

          <div>
            <Label htmlFor="targetAmount">Target Amount ($)</Label>
            <Input
              name="targetAmount"
              id="targetAmount"
              type="number"
              value={form.targetAmount}
              onChange={handleChange}
              placeholder="1000"
              required
            />
          </div>

          <div>
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              name="deadline"
              id="deadline"
              type="date"
              value={form.deadline}
              onChange={handleChange}
              required
            />
          </div>

          <Button type="submit" className="w-full bg-[#ceb8db]" >
            Set Goal
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GoalForm;