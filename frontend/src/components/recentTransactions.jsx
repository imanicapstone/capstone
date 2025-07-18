import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../constants";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const recentTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const [merchantConfidenceScores, setMerchantConfidenceScores] = useState({});
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!currentUser) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = await currentUser.getIdToken();
        const response = await fetch(`${API_BASE_URL}/plaid/transactions`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setTransactions(data);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Failed to fetch transactions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentUser]);

  useEffect(() => {
    const fetchConfidenceScores = async () => {
      if (!transactions.length || !currentUser) return;

      const token = await currentUser.getIdToken();
      const scores = {};
      const synonymInfo = {};

      // gets unique merchants
      const merchantNames = [...new Set(transactions.map((tx) => tx.merchant))];

      // gets confidence score for each merchant
      for (const merchantName of merchantNames) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/plaid/merchant-confidence/${encodeURIComponent(
              merchantName
            )}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            scores[merchantName] = data.confidenceScore;

            // add synonym data
            if (data.usedSynonym) {
              synonymInfo[merchantName] = data.usedSynonym;
            }
          }
        } catch (err) {
          console.error(`Error fetching confidence for ${merchantName}:`, err);
        }
      }

      setMerchantConfidenceScores(scores);
    };

    fetchConfidenceScores();
  }, [transactions, currentUser]);

  const handleSaveCategory = async (transactionId) => {
    if (!newCategory.trim()) {
      return; // doesnt save empty categs
    }
    // full transaction 
    const transaction = transactions.find(tx => tx.id === transactionId);

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${API_BASE_URL}/plaid/override-category`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId,
          categoryName: newCategory.trim(),
          amount: transaction.amount,
          date: transaction.date,
          description: transaction.name
        }),
      });

      if (response.ok) {
        // updates transaction in local state
        setTransactions(
          transactions.map((tx) =>
            tx.id === transactionId
              ? { ...tx, category: newCategory.trim() }
              : tx
          )
        );

        // resets editing state
        setEditingTransaction(null);
        setNewCategory("");
      }
    } catch (err) {
      console.error("Error overriding category:", err);
    }
  };

  return (
    <div>
      <Navbar />

      <h2
        className="text-4xl font-semibold text-center mb-24"
        style={{ color: "#6e6295" }}
      >
        {" "}
        Recent Transactions{" "}
      </h2>
      <div className="flex justify-center">
        <Card className=" w-[48vw] max-w-[600px] min-w-[280px] h-300 bg-[#ceb8db]">
          <CardHeader>
            <CardTitle className="text-gray-50 text-xl font-semibold">
              {loading ? (
                <p>Loading transactions...</p>
              ) : error ? (
                <p className="text-red-200">{error}</p>
              ) : transactions.length === 0 ? (
                <p>No transactions found</p>
              ) : (
                <ul>
                  {transactions.map((tx) => (
                    <li key={tx.id}>
                      {tx.date.slice(0, 10)} - {tx.name} - $
                      {tx.amount.toFixed(2)} - {tx.merchant} -{" "}
                      <span className="font-bold ml-2">
                        {tx.category || "Uncategorized"}
                      </span>
                      {merchantConfidenceScores[tx.merchant] !== undefined && (
                        <span className="text-sm ml-2">
                          (Confidence: {merchantConfidenceScores[tx.merchant]}%)
                        </span>
                      )}
                      {/* shows edit option when the confidence score is below 80 */}
                      {merchantConfidenceScores[tx.merchant] < 80 && (
                        <>
                          {editingTransaction === tx.id ? (
                            <div className="mt-2">
                              <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                className="px-2 py-1 text-black rounded mr-2"
                                placeholder="Enter new category"
                              />
                              <button
                                onClick={() => handleSaveCategory(tx.id)}
                                className="bg-green-600 text-white px-2 py-1 rounded mr-2"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingTransaction(null);
                                  setNewCategory("");
                                }}
                                className="bg-gray-600 text-white px-2 py-1 rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingTransaction(tx.id);
                                setNewCategory(tx.category || "");
                              }}
                              className="ml-2 text-white px-2 py-1 rounded text-xs"
                              style={{ backgroundColor: "#a0bd87" }}
                            >
                              Override Category
                            </button>
                          )}
                        </>
                      )}
                      <br></br> <br></br>
                    </li>
                  ))}
                </ul>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default recentTransactions;
