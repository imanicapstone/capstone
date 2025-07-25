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

// helper to calculate past overspending trends in the past six months


/**
 * Calculates the average percentage by which a user has overspent their budget
 * over a specified number of recent months.
 *
 * For each of the past `months` budgets, fetches the user's transactions via Plaid,
 * sums the spending, and calculates the percentage overspent if spending exceeds the budget.
 * Returns the average overspend percentage across all months where overspending occurred.
 *
 * @async
 * @function getAverageOverspendPercent
 * @param {string} userId - The unique identifier of the user.
 * @param {number} [months=6] - The number of recent months to consider for the calculation.
 */ 
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


/**
 * Sends an "off track" budget reminder if the user is spending faster than usual
 * relative to their monthly budget and past spending habits.
 *
 * Calculates how much of the month has elapsed and compares current spending to
 * the expected spending progress considering the user's historical overspending percentage.
 * Adjusts the warning threshold (buffer) dynamically based on average overspending.
 *
 * @async
 * @function offTrackReminder
 * @param {string} userId - The unique identifier of the user.
 */ 
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
