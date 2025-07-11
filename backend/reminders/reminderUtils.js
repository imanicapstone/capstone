const plaidClient = require("../plaidClient");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

// Get user's Plaid access token
async function getUserPlaidToken(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plaidAccessToken: true },
  });
  
  return user?.plaidAccessToken || null;
}

// Fetch transactions from Plaid with error handling
async function fetchPlaidTransactions(accessToken, startDate, endDate, count = 499) {
  try {
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      options: { count },
    });
    
    return response.data.transactions;
  } catch (error) {
    console.error("Error fetching Plaid transactions:", error);
    return [];
  }
}

// Calculate total spending from transactions
function calculateTotalSpent(transactions) {
  return transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
}






module.exports = {
  getUserPlaidToken,
  fetchPlaidTransactions,
  calculateTotalSpent,
};