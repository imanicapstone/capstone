const plaidClient = require("../plaidClient");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

/**
 * Retrieves the Plaid access token for a given user from the database.
 *
 * @async
 * @function getUserPlaidToken
 * @param {string} userId - The unique identifier of the user.
 */ 
async function getUserPlaidToken(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plaidAccessToken: true },
  });

  return user?.plaidAccessToken || null;
}

/**
 * Fetches a list of transactions from the Plaid API for a given access token and date range.
 *
 * @async
 * @function fetchPlaidTransactions
 * @param {string} accessToken - The Plaid access token for the user's account.
 * @param {Date} startDate - The start date for the transaction query.
 * @param {Date} endDate - The end date for the transaction query.
 * @param {number} [count=499] - Optional maximum number of transactions to return (default is 499).
 */ 
async function fetchPlaidTransactions(
  accessToken,
  startDate,
  endDate,
  count = 499
) {
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

module.exports = {
  getUserPlaidToken,
  fetchPlaidTransactions,
};
