import React, { useEffect, useState } from "react";

const recentTransactions = ({ userId }) => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch(`/user/transactions/list?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => setTransactions(data));
  }, [userId]);

  return (
    <div>
      <h2> Recent Transactions</h2>
      <ul>
        {transactions.map((tx) => (
          <li key={tx.id}>
            {tx.date.slice(0, 10)} - {tx.name} - ${tx.amount.toFixed(2)} (
            {tx.category})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default recentTransactions;
