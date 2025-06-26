const express = require("express");
const user = express.Router();
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
// create a user
user.post("/", async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        // profile data
        profile: {
          create: {
            ageRange: "",
            gender: "",
            occupation: "",
          },
        },
        sensitiveData: {
          create: {
            salary: "",
          },
        },
      },
      include: {
        profile: true,
        sensitiveData: true,
      },
    });


    res.json(newUser);
  } catch (error) {
    res.status(400).send("Failed to create user");
    throw error;
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
  const { email, password } = req.body;

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
        id,
        email,
        password,
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

user.get("/salary", async (req, res) => {
  const { id, salary } = req.body;

  try {
    const userSalary = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
    if (!user) {
      return res.status(404).json({ error: "Salary not found " });
    }
    res.json(salary);
  } catch (error) {
    res.status(404).send("ID is not valid");
  }
});

// route to create a transaction

user.post("/transaction", async (req, res) => {
  const { userId, amount, type, category, description, date } = req.body;
  if ((!userId || amount == null, !category, !type, !description || !date)) {
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

user.get("/transaction", async (req, res) => {
  const { id } = req.params;
  const { userId, amount, category, date } = req.body;

  try {
    const userTransaction = await prisma.Transaction.findUnique({
      where: { id: parseInt(id) },
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

export default user;

user.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if(!user) {
        return res.status(401).json({ error: 'Invalid email'});
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if(!validPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }
})
