const express = require("express");
const user = express.Router();
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const authenticate = require("../middleware/auth");
const plaidClient = require("../plaidClient");
// for recommended categories 
const { recommendCategory } = require("../expense_categorization/merchantControllers");

// create a user
user.post("/", authenticate, async (req, res) => {
  const { id, email, name, dateOfBirth } = req.body;

  if (!id || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (req.user.uid !== id) {
    return res.status(403).json({ error: "UID mismatch" });
  }

  try {
    const newUser = await prisma.user.upsert({
      where: { id },
      update: {}, // Don't update if exists
      create: {
        id,
        email,
        name: name || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
    });

    // creation or existing user
    const isNewUser =
      newUser.createdAt.getTime() === newUser.updatedAt.getTime();
    if (!isNewUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    return res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create user" });
  }
});

// get a specific user's information
user.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found " });
    }

    res.json(currentUser);
  } catch (error) {
    res.status(404).send("ID is not valid");
  }
});

// update a user

user.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        email,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: "Failed to update user" });
  }
});

// add route to partially update user here

// add or update user salary

user.patch("/salary", async (req, res) => {
  const { id, salary } = req.body;

  try {
    const updatedSalary = await prisma.user.upsert({
      where: { id },
      update: { salary },
      create: {
        id,
        salary,
      },
    });

    res.status(200).json(updatedSalary);
  } catch (error) {
    res
      .status(400)
      .json({ error: "Failed to update salary", details: error.message });
  }
});

// route to get a user's salary

user.get("/salary", authenticate, async (req, res) => {
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: "Missing user id" });

  try {
    const userData = await prisma.user.findUnique({
      where: { id },
    });
    if (!userData || userData.salary == null) {
      return res.status(404).json({ error: "Salary not found " });
    }
    res.json({ salary: userData.salary });
  } catch (error) {
    res.status(404).send("ID is not valid");
  }
});

// route to create a transaction

user.post("/transaction", async (req, res) => {
  const { userId, amount, type, category, description, date } = req.body;
  if (
    !userId ||
    amount == null ||
    !category ||
    !type ||
    !description ||
    !date
  ) {
    return res.status(400).json({ error: "Missing required fields!" });
  }

  try {
    const newTransaction = await prisma.transaction.create({
      data: {
        userId,
        amount: parseFloat(amount),
        type,
        category,
        description,
        date: new Date(date),
      },
    });

    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

// route to get a transaction

user.get("/transaction", authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.plaidAccessToken) {
      return res.status(400).json({ error: "User or access token not found" });
    }

    // get transactions from plaid
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1); // past 30 days

    const response = await plaidClient.transactionsGet({
      access_token: user.plaidAccessToken,
      start_date: startDate.toISOString().split("T")[0],
      end_date: now.toISOString().split("T")[0],
      options: { count: 50 },
    });

    const plaidTransactions = response.data.transactions;

    // store new transactions in db
    for (const tx of plaidTransactions) {
      const exists = await prisma.transaction.findFirst({
        where: { id: tx.transaction_id },
      });

      if (!exists) {
        await prisma.transaction.create({
          data: {
            id: tx.transaction_id,
            userId: userId,
            plaidAccountId: tx.account_id,
            name: tx.name,
            amount: tx.amount,
            category: tx.category?.[0] || null,
            date: new Date(tx.date),
          },
        });
      }
    }

    res.json({
      message: "Transactions synced",
      count: plaidTransactions.length,
    });
  } catch (error) {
    console.error("Error syncing transactions:", error);
  }
});

//list multiple transactions

user.get("/transactions/list", async (req, res) => {
  const { userId } = req.query;

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 50,
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: "Could not retrieve transactions" });
  }
});

// route to update an existing transaction

user.put("/transaction/:id", async (req, res) => {
  const { id } = req.params;
  const { userId, amount, category, date } = req.body;
  if ((!userId || amount == null, !category, !type, !description || !date)) {
    return res.status(400).json({ error: "Missing required fields!" });
  }

  try {
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        userId,
        amount: parseFloat(amount),
        category,
        date: new Date(date),
      },
    });

    res.status(200).json(updatedTransaction);
  } catch (error) {
    return res.status(404).json({ error: "Transaction not found" });
  }
});

// route to delete a transation

user.delete("/transaction/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTransaction = await prisma.transaction.delete({
      where: { id },
    });

    res.status(200).json({
      message: "Transaction deleted successfully",
      transaction: deletedTransaction,
    });
  } catch (error) {
    console.error("Failed to delete transaction:", error);

    res.status(500).json({ error: "Internal server error" });
  }
});

user.post("/goal", async (req, res) => {
  const {
    userId,
    title,
    description,
    targetAmount,
    currentAmount,
    deadline,
    createdAt,
    updatedAt,
  } = req.body;

  if (
    !userId ||
    title === null ||
    description === undefined ||
    !targetAmount ||
    !currentAmount ||
    !deadline
  ) {
    return res.status(400).json({ error: "Missing required fields!" });
  }

  try {
    const newGoal = await prisma.financialGoal.create({
      data: {
        userId,
        title,
        description,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount),
        deadline: new Date(deadline),
        date: new Date(deadline),
      },
    });
    res.status(200).json(newGoal);
  } catch (error) {
    return res.status(404).json({ error: "Internal Error" });
  }
});
// get multiple goals

user.get("/goals/:id", authenticate, async (req, res) => {
  const { id: userId } = req.params;

  try {
    const userGoal = await prisma.financialGoal.findMany({
      where: { userId },
    });
    if (!userGoal) {
      return res.status(404).json({ error: "Goal not found " });
    }
    res.json(userGoal);
  } catch (error) {
    res.status(404).send("ID is not valid");
  }
});

// get single goal

user.get("/goal/:id", authenticate, async (req, res) => {
  const { userId } = req.params;

  try {
    const goal = await prisma.financialGoal.findUnique({
      where: { id },
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch goal" });
  }
});

// create monthly budgets
user.post("/budget", authenticate, async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({ error: "Missing required fields!" });
  }

  try {
    // get start of current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);

    // check if budget already exists for the month
    const existingBudget = await prisma.budget.findFirst({
      where: {
        userId,
        monthStart: {
          equals: monthStart,
        },
      },
    });

    if (existingBudget) {
      const updatedBudget = await prisma.budget.update({
        where: { id: existingBudget.id },
        data: { amount: parseFloat(amount) },
      });
      return res.status(200).json(updatedBudget);
    }

    const newBudget = await prisma.budget.create({
      data: {
        userId,
        amount: parseFloat(amount),
        monthStart,
      },
    });

    res.status(201).json(newBudget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Error" });
  }
});

// get budgets
user.get("/budget/:id", authenticate, async (req, res) => {
  const { id: userId } = req.params;

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);

    const budget = await prisma.budget.findFirst({
      where: {
        userId,
        monthStart: {
          equals: monthStart,
        },
      },
    });

    if (!budget) {
      return res.status(404).json({ error: "No budget found for this month" });
    }

    res.json(budget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch budget" });
  }
});

// adds avoided merchant
user.post("/avoided-merchant", authenticate, async (req, res) => {
  const { merchantName } = req.body;
  const userId = req.user.uid;

  try {
    const avoidedMerchant = await prisma.avoidedMerchant.create({
      data: {
        userId,
        merchantName: merchantName.trim(),
      },
    });
    res.json(avoidedMerchant);
  } catch (error) {
    if (error.code === "P2002") {
      res.status(400).json({ error: "Merchant already in avoided list" });
    } else {
      res.status(500).json({ error: "Failed to add avoided merchant" });
    }
  }
});

// gets avoided merchants
user.get("/avoided-merchants", authenticate, async (req, res) => {
  const userId = req.user.uid;

  try {
    const avoidedMerchants = await prisma.avoidedMerchant.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(avoidedMerchants);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch avoided merchants" });
  }
});

// deletes avoided merchant
user.delete("/avoided-merchant/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.uid;

  try {
    await prisma.avoidedMerchant.delete({
      where: {
        id,
        userId, // user can only delete personal entries
      },
    });
    res.json({ message: "Avoided merchant removed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove avoided merchant" });
  }
});
// added for the ability to recommend categs to user 
user.post("/recommend-category", authenticate, recommendCategory);


module.exports = user;
