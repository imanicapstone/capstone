const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const verifyFirebaseToken = require("../middleware/auth");
const budgetReminder = require("../reminders/budgetReminder");
const purchaseReminder = require("../reminders/purchaseReminder");
const offTrackReminder = require("../reminders/offTrackReminder");
const secondaryReminder = require("../reminders/secondaryReminder");
const peakSpendingReminder = require("../reminders/peakSpendingReminder");

router.get("/:userId", verifyFirebaseToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // checks if user has reminders enabled
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { remindersEnabled: true },
    });

    // if user doesnt have reminders enabled, send empty response
    if (!user?.remindersEnabled) {
      return res.status(200).json({
        success: true,
        reminders: [],
        remindersEnabled: false,
        message: "Reminders are currently disabled",
      });
    }

    try {
      await budgetReminder(userId);
    } catch (budgetError) {
      console.error("Budget reminder error (non-fatal):", budgetError);
    }

    try {
      await purchaseReminder(userId);
    } catch (purchaseError) {
      console.error("Purchase reminder error (non-fatal)", purchaseError);
    }

    try {
      await offTrackReminder(userId);
    } catch (offTrackError) {
      console.error("Off-track reminder error (non-fatal)", offTrackError);
    }

    try {
      await secondaryReminder(userId);
    } catch (secondaryError) {
      console.error("Secondary reminder error (non-fatal):", secondaryError);
    }

    try {
      await peakSpendingReminder(userId);
    } catch (peakError) {
      console.error("Peak spending reminder error (non-fatal)", peakError);
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

// new endpoint for marking reminders as addressed
router.patch("/:reminderId/address", verifyFirebaseToken, async (req, res) => {
  const { reminderId } = req.params;

  await prisma.reminder.update({
    where: { id: reminderId },
    data: {
      addressedAt: new Date(),
      isActive: false, // deactivate when addressed
    },
  });

  res.json({ success: true });
});

module.exports = router;

router.patch("/:userId/preferences", verifyFirebaseToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { remindersEnabled } = req.body;

    await prisma.user.update({
      where: { id: userId },
      data: { remindersEnabled },
    });

    res.json({
      success: true,
      remindersEnabled,
    });
  } catch (error) {
    console.error("Error updating reminder preferences:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update reminder preferences",
      details: error.message,
    });
  }
});
