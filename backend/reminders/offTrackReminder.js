const plaidClient = require("../plaidClient");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { transactionCount, budgetOverMultiplier } = require("./config");
const { monthStart, monthEnd } = require("./monthutils");
const {
  getUserPlaidToken,
  fetchPlaidTransactions,
  calculateTotalSpent,
  findReminder, 
  createReminder
} = require("./reminderUtils");

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

  // check if totalPercent is proportional to monthPercent (with a slight buffer)

  function isTrendingOffTrack({
    totalSpent,
    budget,
    numDays,
    daysInMonth,
    buffer = 0.1,
  }) {
    if (!budget || daysInMonth === 0) return false;

    const totalPercent = totalSpent / budget;
    const monthPercent = numDays / daysInMonth;

    return totalPercent > monthPercent + buffer;
  }

  const isOffTrack = isTrendingOffTrack({
    totalSpent,
    budget: budget.amount,
    numDays,
    daysInMonth,
  });


  const existing = await findReminder({
    userId,
    type: "OFF_TRACK",
    monthStart,
    monthEnd,
  });

  const trendingReminder = await findReminder({
    userId,
    type: "TRENDING_OFF_TRACK",
    monthStart,
    monthEnd,
  });

  if (totalSpent > budget.amount * budgetOverMultiplier && !existing) {
    const title = "Be careful! you've gone significantly over your monthly budget!"
    const message = `You have spent $${totalSpent.toFixed(
          2
        )} this month, which is significantly over your budget of $${budget.amount.toFixed(
          2
        )}.`
    await createReminder({
      userId,
      type: "SPENDING_OVER_BUDGET",
      title,
      message,
    });
  }

  if (isOffTrack && !trendingReminder) {
    const title = "You're trending off track with your spending"
    const message = `You've spent $${totalSpent.toFixed(
          2
        )} so far, which is ahead of pace for your monthly budget of $${budget.amount.toFixed(
          2
        )}. Consider slowing down to stay within budget.`
    await createReminder({
      userId,
      type: "TRENDING_OFF_TRACK",
      title,
      message,
    });
  }
};
