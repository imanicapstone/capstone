const plaidClient = require("../plaidClient");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

module.exports = async function offTrackReminder(userId) {
  const currentMonth = new Date();

  // Use simple date arithmetic like purchaseReminder
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plaidAccessToken: true },
  });

  if (!user?.plaidAccessToken) {
    return;
  }

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

  const totalSpent = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0); // absolute value for negative transaction

  const existing = await prisma.reminder.findFirst({
    where: {
      userId,
      type: "OFF_TRACK",
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
      isActive: true,
    },
  });

  if (totalSpent > budget.amount * 1.2 && !existing) {
    await prisma.reminder.create({
      data: {
        userId,
        type: "OFF_TRACK",
        title:
          "Be careful! you've gone significantly over your monthly budget!",
        message: `You have spent $${totalSpent.toFixed(2)} this month, which is significantly over your budget of $${budget.amount.toFixed(2)}.`,
        isActive: true,
      },
    });
  }
};
