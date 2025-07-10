import React, { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../constants";

const Settings = () => {
  const { currentUser } = useAuth();
  const [currentBudget, setCurrentBudget] = useState(null);
  const [newBudgetAmount, setNewBudgetAmount] = useState("");
  const [avoidedMerchants, setAvoidedMerchants] = useState([]);
  const [newMerchant, setNewMerchant] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentUser) {
      fetchCurrentBudget();
      fetchAvoidedMerchants();
    }
  }, [currentUser]);

  const fetchCurrentBudget = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(
        `${API_BASE_URL}/user/budget/${currentUser.uid}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const budget = await response.json();
        setCurrentBudget(budget);
        setNewBudgetAmount(budget.amount.toString());
      }
    } catch (error) {
      console.error("Error fetching budget:", error);
    }
  };

  const fetchAvoidedMerchants = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${API_BASE_URL}/user/avoided-merchants`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const merchants = await response.json();
        setAvoidedMerchants(merchants);
      }
    } catch (error) {
      console.error("Error fetching avoided merchants:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateBudget = async (e) => {
    e.preventDefault();
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${API_BASE_URL}/user/budget`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          amount: parseFloat(newBudgetAmount),
        }),
      });

      if (response.ok) {
        const updatedBudget = await response.json();
        setCurrentBudget(updatedBudget);
        setError("");
      }
    } catch (error) {
      setError("Failed to update budget");
      console.error("Error updating budget:", error);
    }
  };

  const addAvoidedMerchant = async (e) => {
    e.preventDefault();
    if (!newMerchant.trim()) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${API_BASE_URL}/user/avoided-merchant`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ merchantName: newMerchant.trim() }),
      });

      if (response.ok) {
        const newAvoidedMerchant = await response.json();
        setAvoidedMerchants([newAvoidedMerchant, ...avoidedMerchants]);
        setNewMerchant("");
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (error) {
      setError("Failed to add merchant");
      console.error("Error adding avoided merchant:", error);
    }
  };

  const removeAvoidedMerchant = async (merchantId) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(
        `${API_BASE_URL}/user/avoided-merchant/${merchantId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setAvoidedMerchants(
          avoidedMerchants.filter((m) => m.id !== merchantId)
        );
        setError("");
      }
    } catch (error) {
      setError("Failed to remove merchant");
      console.error("Error removing avoided merchant:", error);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Settings</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* weekly budgets */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              Weekly Budget Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentBudget && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Current Weekly Budget</p>
                <p className="text-2xl font-bold text-[#6f6493]">
                  ${currentBudget.amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  Set on{" "}
                  {new Date(currentBudget.weekStart).toLocaleDateString()}
                </p>
              </div>
            )}

            <form onSubmit={updateBudget} className="space-y-4">
              <div>
                <Label htmlFor="budgetAmount">
                  Update Weekly Budget Amount ($)
                </Label>
                <Input
                  id="budgetAmount"
                  type="number"
                  step="0.01"
                  value={newBudgetAmount}
                  onChange={(e) => setNewBudgetAmount(e.target.value)}
                  placeholder="500.00"
                  required
                />
              </div>
              <Button
                type="submit"
                className="bg-[#ceb8db] hover:bg-[#6f6493] text-white"
              >
                Update Budget
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* avoided merchants section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              Avoided Merchants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Currently Avoiding ({avoidedMerchants.length})
              </Label>
              <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-lg bg-gray-50">
                {avoidedMerchants.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No merchants being avoided
                  </p>
                ) : (
                  avoidedMerchants.map((merchant) => (
                    <Badge
                      key={merchant.id}
                      variant="secondary"
                      className="flex items-center gap-1 bg-[#ceb8db] text-gray-800 hover:bg-[#6f6493] hover:text-white"
                    >
                      {merchant.merchantName}
                      <button
                        onClick={() => removeAvoidedMerchant(merchant.id)}
                        className="ml-1 hover:text-red-600"
                        type="button"
                      ></button>
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* adds new merchant to list */}
            <form onSubmit={addAvoidedMerchant} className="space-y-4">
              <div>
                <Label htmlFor="merchantName">Add Merchant to Avoid</Label>
                <div className="flex gap-2">
                  <Input
                    id="merchantName"
                    type="text"
                    value={newMerchant}
                    onChange={(e) => setNewMerchant(e.target.value)}
                    placeholder="e.g., Starbucks, Amazon, McDonald's"
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    className="bg-[#ceb8db] hover:bg-[#6f6493] text-white"
                    disabled={!newMerchant.trim()}
                  ></Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
