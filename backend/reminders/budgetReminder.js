const { startOfWeek, endOfWeek } = require("date-fns");
const plaidClient = require("../plaidClient");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

module.exports = async function budgetReminder(userId) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 }); // sunday
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });

  const budget = await prisma.budget.findFirst({
    where: {
      userId,
      weekStart: {
        equals: weekStart,
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
      start_date: weekStart.toISOString().split("T")[0],
      end_date: weekEnd.toISOString().split("T")[0],
      options: { count: 100 },
    });

    transactions = response.data.transactions;
  } catch (error) {
    console.error("Error fetching Plaid transactions:", error);
    return;
  }

  const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  // checks if reminder already exists
  const existing = await prisma.reminder.findFirst({
    where: {
      userId,
      type: "SPENDING_OVER_BUDGET",
      createdAt: {
        gte: weekStart,
        lte: weekEnd,
      },
      isActive: true,
    },
  });

  if (totalSpent > budget.amount && !existing) {
    await prisma.reminder.create({
      data: {
        userId,
        type: "SPENDING_OVER_BUDGET",
        title: "Be careful! you spent over your weekly budget.",
        message: `You have spent $${totalSpent.toFixed(2)} this week.`,
        isActive: true,
      },
    });
  }
};
