/**
 * Sends budget-related reminders to a user if they are off track or have significantly 
 * exceeded their monthly budget.
 *
 * This function analyzes a user's spending for the current month using transaction data from Plaid.
 * It determines whether the user is:
 *  - Spending at a rate that exceeds the expected pace for the month ("TRENDING_OFF_TRACK"), or
 *  - Significantly over their budget ("OFF_TRACK").
 * 
 * It creates reminders in the database, unless one already exists for the current month.
 * It dynamically adjusts to the user's spending habits, timing reminders based on how frequently the user 
 * exceeds budget.
 */ 

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
