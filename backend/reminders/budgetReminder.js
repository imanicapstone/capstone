const plaidClient = require("../plaidClient");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { monthStart, monthEnd } = require("./monthutils");
const {
  getUserPlaidToken,
  fetchPlaidTransactions,
  calculateTotalSpent,
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

  // Get transactions from Plaid for the current month
  const transactions = await fetchPlaidTransactions(
    accessToken,
    monthStart,
    monthEnd
  );
  const totalSpent = calculateTotalSpent(transactions);

  // checks if reminder already exists
  const existing = await prisma.reminder.findFirst({
    where: {
      userId,
      type: "SPENDING_OVER_BUDGET",
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
      isActive: true,
    },
  });

  const monthName = monthStart.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (totalSpent > budget.amount && !existing) {
    await prisma.reminder.create({
      data: {
        userId,
        type: "SPENDING_OVER_BUDGET",
        title: "Be careful! you spent over your budget this month.",
        message: `You spent $${totalSpent.toFixed(
          2
        )} in ${monthName}, which exceeded your budget of $${budget.amount.toFixed(
          2
        )}.`,
        isActive: true,
      },
    });
  }
};
