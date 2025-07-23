const plaidClient = require("../plaidClient");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { monthStart, monthEnd } = require("./monthutils");
const {
  getUserPlaidToken,
  fetchPlaidTransactions,
  calculateTotalSpent,
  findReminder,
  createReminder,
} = require("./reminderUtils");

module.exports = async function budgetReminder(userId) {
  const currentMonth = new Date();

  const budget = await prisma.budget.findFirst({
    where: {
      userId,
      monthStart: {
        equals: monthStart,
      },
    },
  });

  if (!budget) {
    return;
  }

  // Get user's Plaid access token
  const accessToken = await getUserPlaidToken(userId);
  if (!accessToken) return;

  // Get transactions from Plaid for the current week
  const transactions = await fetchPlaidTransactions(
    accessToken,
    monthStart,
    monthEnd
  );
  const totalSpent = calculateTotalSpent(transactions);

  // checks if reminder already exists
  const existing = await findReminder({
    userId,
    type: "SPENDING_OVER_BUDGET",
    monthStart,
    monthEnd,
  });

  const monthName = monthStart.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (totalSpent > budget.amount && !existing) {
    const title = "Be careful! you spent over your budget this month.";
    const message = `You spent $${totalSpent.toFixed(
      2
    )} in ${monthName}, which exceeded your budget of $${budget.amount.toFixed(
      2
    )}.`;

    await createReminder({
      userId,
      type: "SPENDING_OVER_BUDGET",
      title,
      message,
    });
  }
};
