/**
 * Sends follow-up ("secondary") reminders for any unaddressed financial reminders older than 1 day.
 *
 * This function checks for unaddressed reminders of specific types that were created 
 * more than a day ago and either haven't had a secondary reminder sent, or had one sent over a day ago.
 * For each matching reminder it creates a new secondary reminder entry and updates the original
 * reminder's lastSecondaryReminderAt field to prevent excessive follow-ups.
 */

const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { 
  createReminder
} = require("./reminderUtils");

module.exports = async function secondaryReminder(userId) {
  // reminders checked within the past day
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  // finds unaddressed reminders for all types
  const unaddressedReminders = await prisma.reminder.findMany({
    where: {
      userId,
      type: {
        in: [
          "SPENDING_OVER_BUDGET",
          "PURCHASE_REMINDER",
          "OFF_TRACK",
          "TRENDING_OFF_TRACK",
        ],
      },
      isActive: true,
      addressedAt: null, // not addressed
      createdAt: {
        lte: oneDayAgo, // created more than a day ago
      },
      OR: [
        { lastSecondaryReminderAt: null }, // secondary reminder not yet sent
        {
          lastSecondaryReminderAt: {
            lte: oneDayAgo, // Last secondary reminder was more than one day ago
          },
        },
      ],
    },
  });

  // Create secondary reminders for each unaddressed reminder
  for (const reminder of unaddressedReminders) {
    const title = "Follow-up: Action needed on your financial reminder"
    const message = `You still have an unaddressed reminder: "${reminder.title}". Consider taking action to improve your financial health.`

    await createReminder({
      userId,
      type: "SECONDARY_REMINDER",
      title,
      message,
      isActive: true,
    });

    // Update the original reminder to track when secondary reminder was sent
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { lastSecondaryReminderAt: new Date() },
    });
  }
};
