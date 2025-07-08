const { startOfMonth, endOfMonth } = require('date-fns');
const getPlaidTransactions = require('../plaidControllers/getTransactions');
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

module.exports = async function budgetReminder(userId) {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0}); // sunday
    const weekEnd = endofWeek(today, { weekStartsOn: 0});

    const budget = await prisma.budget.findFirst({
        where: {
            userId,
            weekStart
        },
    });

    if (!budget) {
        console.log('No weekly budget set');
        return;
    }

    const transactions = await getPlaidTransactions(userId, weekStart, weekEnd);
    const totalSpent = transactions.reduce((sum , tx) => sum + tx.amount, 0);

    // checks if reminder already exists 
    const existing = await prisma.reminder.findFirst({
        where: {
            userId,
            type: 'SPENDING_OVER_BUDGET',
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
                type: 'SPENDING_OVER_BUDGET',
                title: 'Be careful! you spent over your weekly budget.',
                message: `You have spent $${totalSpent.toFixed(2)} this week.`,
                isActive: true,
            }
        })
    }
 
}