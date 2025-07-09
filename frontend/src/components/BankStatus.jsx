import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import PlaidLink from "./PlaidLink";
import { API_BASE_URL } from "../constants";


const BankStatus = () => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    checkConnectionStatus();
  }, [currentUser]);

  const checkConnectionStatus = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(
        `${API_BASE_URL}/plaid/connection-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setConnected(data.connected);
    } catch (error) {
      console.error("Error checking status:", error);
    }
    setLoading(false);
  };

  const handleConnectionSuccess = () => {
    setConnected(true);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-2">Bank Account</h3>
      {connected ? (
        <div className="text-green-600">✓ Bank account connected</div>
      ) : (
        <div>
          <p className="text-gray-600 mb-2">
            Connect your bank account to get started
          </p>
          <PlaidLink onSuccess={handleConnectionSuccess} />
        </div>
      )}
    </div>
  );
};

export default BankStatus;
