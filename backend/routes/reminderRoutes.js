const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const verifyFirebaseToken = require("../middleware/auth");
const budgetReminder = require("../reminders/budgetReminder");

router.get("/:userId", verifyFirebaseToken, async (req, res) => {
  try {
    const { userId } = req.params;


    // Run budget reminder check to populate new reminders
    try {
      await budgetReminder(userId);
    } catch (budgetError) {
      console.error("Budget reminder error (non-fatal):", budgetError);
      // Don't fail the whole request if budget reminder fails
    }

    // Fetch reminders
    const reminders = await prisma.reminder.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });


    res.status(200).json({
      success: true,
      reminders,
    });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch reminders",
      details: error.message,
    });
  }
});

module.exports = router;
