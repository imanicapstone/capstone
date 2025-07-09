import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "../constants";
import { useAuth } from "../context/AuthContext";

const GoalForm = ({ userId, onGoalCreated }) => {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    targetAmount: "",
    deadline: "",
    avoidMerchant: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = await currentUser.getIdToken();
      // creates goal first
      const goalRes = await fetch(`${API_BASE_URL}/user/goal`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          userId,
          currentAmount: 0.01, //non zero value so js does not classify as null
          deadline: form.deadline
            ? new Date(form.deadline).toISOString()
            : null,
          updatedAt: new Date().toISOString(), //makes sure updatedAt is sent into prisma
        }),
      });

      if (!goalRes.ok) {
        const goalError = await goalRes.json();
        console.error("Goal creation failed:", goalError);
        return;
      }

      const newGoal = await goalRes.json();

      // only add merchant if user specified
      if (form.avoidMerchant.trim()) {
        try {
          const merchantRes = await fetch(
            `${API_BASE_URL}/user/avoided-merchant`,
            {
              method: "POST",
              headers: {
                "Content-type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ merchantName: form.avoidMerchant.trim() }),
            }
          );

          if (!merchantRes.ok) {
            const merchantError = await merchantRes.json();
            console.warn("Merchant addition failed:", merchantError);
          }
        } catch (merchantError) {
          console.warn("Merchant API error:", merchantError);
        }
      }

      onGoalCreated(newGoal);
      setForm({
        title: "",
        description: "",
        targetAmount: "",
        deadline: "",
        avoidMerchant: "",
      });
    } catch (error) {
      console.error("Form submission error", error);
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

          <div>
            <Label htmlFor="avoidMerchant">Merchant to Avoid (Optional)</Label>
            <Input
              name="avoidMerchant"
              id="avoidMerchant"
              value={form.avoidMerchant}
              onChange={handleChange}
              placeholder="e.g. Amazon, Starbucks"
            />
          </div>

          <Button type="submit" className="w-full bg-[#ceb8db]">
            Set Goal
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GoalForm;
