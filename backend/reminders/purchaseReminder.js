const plaidClient = require("../plaidClient");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { findReminder, createReminder } = require("./reminderUtils");

/**
 * Sends a reminder if the user made a purchase from a merchant they intended to avoid.
 *
 * This function fetches the user's recent transactions from Plaid, compares them against a list
 * of merchants the user wants to avoid, and creates a reminder if a match is found. It prevents
 * duplicate reminders by checking if one already exists for the same merchant and transaction date.
 *
 * @async
 * @param {string} userId - The unique identifier of the user.
 */
module.exports = async function purchaseReminder(userId) {
  // Get user's Plaid access token
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plaidAccessToken: true },
  });

  if (!user?.plaidAccessToken) {
    return;
  }

  let transactions = [];
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date();

    const response = await plaidClient.transactionsGet({
      access_token: user.plaidAccessToken,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      options: { count: 100 },
    });

    transactions = response.data.transactions;
  } catch (error) {
    console.error("Error fetching Plaid Transactions", error);
    return;
  }
  // get list of merchants to avoid
  const avoidedMerchants = await prisma.avoidedMerchant.findMany({
    where: { userId },
    select: { merchantName: true },
  });

  if (avoidedMerchants.length === 0) {
    return; // edge case if no merchants to avoid
  }

  const avoidedMerchantNames = avoidedMerchants.map((m) =>
    m.merchantName.toLowerCase()
  );

  // checks if there are violating transactions
  const violatingTransactions = transactions.filter((transaction) => {
    const merchantName = (
      transaction.merchant_name ||
      transaction.name ||
      ""
    ).toLowerCase();
    return avoidedMerchantNames.some(
      (avoided) =>
        merchantName.includes(avoided) || avoided.includes(merchantName)
    );
  });

  // checks for existing

  // generates reminder for user to avoid merchant
  for (const transaction of violatingTransactions) {
    const merchantName =
      transaction.merchant_name || transaction.name || "unknown merchant";

    const existingReminder = await findReminder({
      userId,
      type: "PURCHASE_REMINDER",
      message: {
        contains: merchantName,
      },
      monthStart,
      monthEnd,
    });

    if (!existingReminder) {
      const title = "Avoided Merchant Purchase Alert";
      const message = `You purchased from ${merchantName} on ${new Date(
        transaction.date
      ).toLocaleDateString()}. You said you wanted to avoid this merchant!`;

      await createReminder({
        userId,
        type: "PURCHASE_REMINDER",
        title,
        message,
        isActive: true,
      });
    }
  }
};
