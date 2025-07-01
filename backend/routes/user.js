const express = require("express");
const user = express.Router();
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const authenticate = require("../middleware/auth");
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
    const newUser = await prisma.user.create({
      data: {
        id, //firebase uid
        email,
        name: name || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
    });

    // does not return the password in the response
    return res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create user"  });


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
  if ((!userId || amount == null || !category || !type || !description || !date)) {
    return res.status(400).json({ error: "Missing required fields!" });
  }

  try {
    const newTransaction = await prisma.Transaction.create({
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
  const { id } = req.params;
  const { userId, amount, category, date } = req.body;

  try {
    const userTransaction = await prisma.Transaction.findUnique({
      where: { id },
    });
    if (!userTransaction) {
      return res.status(404).json({ error: "Transaction not found " });
    }
    res.json({amount, category, date});
  } catch (error) {
    res.status(404).send("ID is not valid");
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
    const updatedTransaction = await prisma.Transaction.update({
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

  res.status(500).json({ error: "Internal server error" });
});

// route to delete a transation

user.delete("/transaction/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTransaction = await prisma.Transaction.delete({
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

module.exports = user;
