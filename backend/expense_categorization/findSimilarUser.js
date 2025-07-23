const { PrismaClient } = require("../generated/prisma");
const plaidClient = require("../plaidClient");
const prisma = new PrismaClient();
const { monthStart, monthEnd } = require("../reminders/monthutils");
const {
  getUserPlaidToken,
  fetchPlaidTransactions,
} = require("./categoryUtils");

async function findMostSimilarUser(userId) {
  // gets the current user's information first

  const originalAccessToken = await getUserPlaidToken(userId);
  if (!originalAccessToken) return;

  const originalTransactions = await fetchPlaidTransactions(
    originalAccessToken,
    monthStart,
    monthEnd,
);
  // create set of current users merchants
  const originalMerchants = new Set(
    originalTransactions.map((transaction) =>
      transaction.merchant_name?.toLowerCase()
    )
  );

  // loops through all users
  const users = await prisma.user.findMany();

  let largestMatchCount = 0;
  let mostSimilarUser = null;

  for (const user of users) {
    // skip original user
    if (user.id === userId) continue;

    const otherAccessToken = await getUserPlaidToken(user.id);
    if (!otherAccessToken) continue;

    const otherTransactions = await fetchPlaidTransactions(
        otherAccessToken,
        monthStart,
        monthEnd,
    );
    // new set of merchants per user
    const otherMerchants = new Set(
      otherTransactions.map((transaction) =>
        transaction.merchant_name?.toLowerCase()
      )
    );

    // counts matching merchants and calculates intersection
    let matchCount = 0;
    for (const merchant of otherMerchants) {
      if (originalMerchants.has(merchant)) {
        matchCount++;
      }
    }

    // return user with most matching merchants

    if (matchCount > largestMatchCount) {
      largestMatchCount = matchCount;
      mostSimilarUser = user.id;
    }

    console.log(mostSimilarUser);

    
  }

  return { mostSimilarUser, largestMatchCount };
}

module.exports = { findMostSimilarUser }
