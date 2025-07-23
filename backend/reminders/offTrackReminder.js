const plaidClient = require("../plaidClient");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { transactionCount, budgetOverMultiplier } = require("./config");
const { monthStart, monthEnd } = require("./monthutils");
const {
  getUserPlaidToken,
  fetchPlaidTransactions,
  calculateTotalSpent,
} = require("./reminderUtils");

// helper to calculate past overspending trends in the past six months

async function getAverageOverspendPercent(userId, months = 6) {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    orderBy: { monthStart: "desc" },
    take: months,
  });

  let totalOverPercent = 0;
  let count = 0;

  for (const budget of budgets) {
    const accessToken = await getUserPlaidToken(userId);
    if (!accessToken) continue;

    const endOfMonth = new Date(
      budget.monthStart.getFullYear(),
      budget.monthStart.getMonth() + 1,
      0
    );

    const transactions = await fetchPlaidTransactions(
      accessToken,
      budget.monthStart,
      endOfMonth
    );

    const spent = calculateTotalSpent(transactions);
    if (spent > budget.amount) {
      const percentOver = ((spent - budget.amount) / budget.amount) * 100;
      totalOverPercent += percentOver;
      count++;
    }
  }

  return count === 0 ? 0 : totalOverPercent / count;
}

module.exports = async function offTrackReminder(userId) {
  const currentMonth = new Date();

  // uses simple date arithmetic like purchaseReminder
  const today = new Date();
  const dayToday = today.getDate(); // returns whole number
  const dayMonthStart = monthStart.getDate(); // returns whole number (no milliseconds)

  const getDaysInMonth = (month) => {
    // month is zero-based: 0 = January, 11 = December
    return new Date(2025, month + 1, 0).getDate();
  };

  // num days since start of month
  const numDays = dayToday - dayMonthStart + 1;
  const daysInMonth = getDaysInMonth(currentMonth.getMonth());

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

  const accessToken = await getUserPlaidToken(userId);
  if (!accessToken) return;

  const transactions = await fetchPlaidTransactions(
    accessToken,
    monthStart,
    monthEnd
  );
  const totalSpent = calculateTotalSpent(transactions);

  const avgOverspend = await getAverageOverspendPercent(userId); // e.g. 12.5

  // dynamic buffer, more lenient if user usually stays on budget
  let userBuffer;
  if (avgOverspend > 20) {
    userBuffer = 0.05; // warn early
  } else if (avgOverspend > 10) {
    userBuffer = 0.08;
  } else {
    userBuffer = 0.15; // warn later
  }


  function isTrendingOffTrack({
    totalSpent,
    budget,
    numDays,
    daysInMonth,
    buffer = userBuffer,
  }) {
    if (!budget || daysInMonth === 0) return false;

    // how far we are in the month vs how much the user is expected to spend 
    const monthPercent = numDays / daysInMonth;
    const expectedSpend = budget * monthPercent;

    // how much user has gone over budget 
    const overAmount = totalSpent - expectedSpend;

    // multiplies by the dynamic buffer 

    if (overAmount > budget * buffer) {
      const percentOver = (overAmount / budget) * 100;
      return { percentOver };
    }

    return;
  }
  const isOffTrack = isTrendingOffTrack({
    totalSpent,
    budget: budget.amount,
    numDays,
    daysInMonth,
    percentOver,
  });

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

  const trendingReminder = await prisma.reminder.findFirst({
    where: {
      userId,
      type: "TRENDING_OFF_TRACK",
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
      isActive: true,
    },
  });

  if (totalSpent > budget.amount * budgetOverMultiplier && !existing) {
    await prisma.reminder.create({
      data: {
        userId,
        type: "OFF_TRACK",
        title:
          "Be careful! you've gone significantly over your monthly budget!",
        message: `You have spent $${totalSpent.toFixed(
          2
        )} this month, which is significantly over your budget of $${budget.amount.toFixed(
          2
        )}.`,
        isActive: true,
      },
    });
  }

  if (isOffTrack && !trendingReminder) {
    await prisma.reminder.create({
      data: {
        userId,
        type: "TRENDING_OFF_TRACK",
        title: "You're trending off track with your spending",
        message: `You've spent $${totalSpent.toFixed(
          2
        )} so far, which is ahead of pace for your monthly budget of $${budget.amount.toFixed(
          2
        )}. Consider slowing down to stay within budget.`,
        isActive: true,
      },
    });
  }
};
