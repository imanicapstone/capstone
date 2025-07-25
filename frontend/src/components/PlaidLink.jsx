import React, { useState, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../constants";

const PlaidLink = ({ onSuccess }) => {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const createLinkToken = async () => {
    setLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${API_BASE_URL}/plaid/create-link-token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setLinkToken(data.link_token);
    } catch (error) {
      console.error("Error creating link token:", error);
    }
    setLoading(false);
  };

  const onPlaidSuccess = useCallback(
    async (public_token) => {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(
          `${API_BASE_URL}/plaid/exchange-public-token`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ public_token }),
          }
        );

        if (response.ok) {
          onSuccess && onSuccess();
        }
      } catch (error) {
        console.error("Error exchanging token:", error);
      }
    },
    [currentUser, onSuccess]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
  });

  return (
    <div>
      {!linkToken ? (
        <button
          onClick={createLinkToken}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? "Loading..." : "Connect Bank Account"}
        </button>
      ) : (
        <button
          onClick={() => open()}
          disabled={!ready}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Open Plaid Link
        </button>
      )}
    </div>
  );
};

export default PlaidLink;
