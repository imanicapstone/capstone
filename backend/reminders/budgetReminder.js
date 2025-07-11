const plaidClient = require("../plaidClient");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { monthStart, monthEnd } = require('./monthutils');

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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plaidAccessToken: true },
  });

  if (!user?.plaidAccessToken) {
    return;
  }

  // Get transactions from Plaid for the current week
  let transactions = [];
  try {
    const response = await plaidClient.transactionsGet({
      access_token: user.plaidAccessToken,
      start_date: monthStart.toISOString().split("T")[0],
      end_date: monthEnd.toISOString().split("T")[0],
      options: { count: 499 },
    });

    transactions = response.data.transactions;
  } catch (error) {
    console.error("Error fetching Plaid transactions:", error);
    return;
  }

  const totalSpent = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0); // absolute value because plaid transactions are negative


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

  const monthName = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (totalSpent > budget.amount && !existing) {
    await prisma.reminder.create({
      data: {
        userId,
        type: "SPENDING_OVER_BUDGET",
        title: "Be careful! you spent over your budget this month.",
        message: `You spent $${totalSpent.toFixed(2)} in ${monthName}, which exceeded your budget of $${budget.amount.toFixed(2)}.`,
        isActive: true,
      },
    });
  }
};
