const { PrismaClient } = require("../generated/prisma");
const plaidClient = require("../plaidClient");
const prisma = new PrismaClient();
const { monthStart, monthEnd } = require("../reminders/monthutils");
const {
  getUserPlaidToken,
  fetchPlaidTransactions,
} = require("./categoryUtils");

/**
 * Finds the user whose transaction history (by merchant name) is most similar to the given user
 * within the current month.
 *
 * The similarity metric is based on the number of overlapping merchants between the given user and all other users in the DB.
 * The function retrieves plaid transactions for the current month across the user DB, and compares to see who is the most similar.
 * @param {string} userId - The ID of the user for who the category is being determined or created.
 */
async function findMostSimilarUser(userId) {
  // gets the current user's information first

  const originalAccessToken = await getUserPlaidToken(userId);
  if (!originalAccessToken) return;

  const originalTransactions = await fetchPlaidTransactions(
    originalAccessToken,
    monthStart,
    monthEnd
  );
  // create set of current users merchants
  const originalMerchants = new Set(
    originalTransactions.map((transaction) =>
      transaction.merchant_name?.toLowerCase()
    )
  );

  // loops through all users
  const users = await prisma.user.findMany();

  let largestSimilarity = 0;
  let mostSimilarUser = null;

  for (const user of users) {
    // skip original user
    if (user.id === userId) continue;

    const otherAccessToken = await getUserPlaidToken(user.id);
    if (!otherAccessToken) continue;

    const otherTransactions = await fetchPlaidTransactions(
      otherAccessToken,
      monthStart,
      monthEnd
    );
    // new set of merchants per user
    const otherMerchants = new Set(
      otherTransactions.map((transaction) =>
        transaction.merchant_name?.toLowerCase()
      )
    );

    // all matching merchants
    const intersection = [...otherMerchants].filter((merchant) =>
      originalMerchants.has(merchant)
    ).length;
    // all unique merchants (considers union to maintain respect to size)
    const union = new Set([...originalMerchants, ...otherMerchants]);

    // real similarity (with respect to size)

    const similarity = union.size === 0 ? 0 : intersection.length / union.size;

    // return user with most matching merchants

    if (similarity > largestSimilarity) {
      largestSimilarity = similarity;
      mostSimilarUser = user;
    }
  }

  return { mostSimilarUser, similarity: largestSimilarity };
}

module.exports = { findMostSimilarUser };
