const { startOfWeek, endOfWeek } = require("date-fns");
const plaidClient = require("../plaidClient");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

module.exports = async function offTrackReminder(userId) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 2); //includes sunday-tuesday only

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

  const existing = await prisma.reminder.findFirst({
    where: {
      userId,
      type: "OFF_TRACK",
      createdAt: {
        gte: weekStart,
        lte: weekEnd,
      },
      isActive: true,
    },
  });

  if (totalSpent > budget.amount / 2 && !existing) {
    await prisma.reminder.create({
      data: {
        userId,
        type: "OFF_TRACK",
        title:
          "Be careful! you've spent more than half of your weekly budget before wednesday",
        message: `You have spent $${totalSpent.toFixed(2)} since Sunday.`,
        isActive: true,
      },
    });
  }
};
