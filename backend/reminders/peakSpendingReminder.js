const plaidClient = require("../plaidClient");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { monthStart, monthEnd } = require("./monthutils");
const { getWeekOfMonth } = require("./monthutils");
const {
  getUserPlaidToken,
  fetchPlaidTransactions,
} = require("./reminderUtils");

/**
 * Calculates the week of the month during which the user tends to spend the most,
 * based on their transactions over the past several months.
 *
 * @async
 * @function getPeakSpendingWeek
 * @param {string} userId - The unique identifier of the user.
 */
async function getPeakSpendingWeek(userId) {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    orderBy: { monthStart: "desc" },
    take: 6, // checks past sixth months for budget reminders
  });

  const weekTotals = {};
  // loops through budgets and transactions to see when budgets were exceeded
  for (const budget of budgets) {
    const accessToken = await getUserPlaidToken(userId);
    const transactions = await fetchPlaidTransactions(
      accessToken,
      budget.monthStart,
      new Date(
        budget.monthStart.getFullYear(),
        budget.monthStart.getMonth() + 1,
        0
      )
    );

    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      const week = getWeekOfMonth(txDate);
      if (!weekTotals[week]) {
        weekTotals[week] = 0;
      }
      weekTotals[week] += tx.amount;
    }
  }
  // compares weeks to find the week where the most money was spent
  const peakSpendingWeek = Object.entries(weekTotals).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0];

  return parseInt(peakSpendingWeek);
}

/**
 * Sends a reminder to the user if the current week matches their peak spending week.
 * Does nothing if it's not the peak week or if a reminder for this month already exists.
 *
 * @async
 * @function peakWeekSpendingReminder
 * @param {string} userId - The unique identifier of the user.
 */
module.exports = async function peakWeekSpendingReminder(userId) {
  const currentDate = new Date();
  const currentWeek = getWeekOfMonth(currentDate);
  const peakWeek = await getPeakSpendingWeek(userId);
  // if not peak week, do nothing
  if (currentWeek !== peakWeek) return;

  const existingReminder = await prisma.reminder.findFirst({
    where: {
      userId,
      type: "PEAK_WEEKLY_SPENDING",
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
      isActive: true,
    },
  });

  if (!existingReminder) {
    await prisma.reminder.create({
      data: {
        userId,
        type: "PEAK_WEEKLY_SPENDING",
        title: "This is usually a high-spending week",
        message: `Based on your past activity, you tend to spend the most during this time of the month. Watch your spending this week!`,
        isActive: true,
      },
    });
  }
};
