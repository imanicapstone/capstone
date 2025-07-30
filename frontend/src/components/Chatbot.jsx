import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "../constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const Chatbot = () => {
  const [newUserQuery, setNewUserQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function askFinancialAssistant(question) {
    const response = await fetch(`${API_BASE_URL}/api/finance/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    });

    const data = await response.json();
    return data.answer;
  }

  const handleNewQuery = async (e) => {
    e.preventDefault();

    if (!newUserQuery.trim()) return;

    setLoading(true);
    try {
      const response = await askFinancialAssistant(newUserQuery.trim());
      setAnswer(response);
    } catch (error) {
      console.error("Failed to get answer:", error);
      setAnswer("Sorry, something went wrong. Please try again.");
    }
    setLoading(false);
    setNewUserQuery("");
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          Financial Assistant Chatbot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleNewQuery} className="space-y-4">
          <div>
            <Label className="mb-5" htmlFor="userInput">Ask me anything!</Label>
            <Input
              id="userchatinput"
              type="text"
              value={newUserQuery}
              onChange={(e) => setNewUserQuery(e.target.value)}
              placeholder="Type Here"
              required
            />
          </div>
          <Button
            type="submit"
            className="bg-[#ceb8db] hover:bg-[#6f6493] text-white"
            disabled={loading}
          >
            {loading ? "Thinking..." : "Enter"}
          </Button>
        </form>

        {answer && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
                <strong>Assistant:</strong> {answer}
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Chatbot;
