const plaidClient = require("./plaidClient");
const { PrismaClient } = require("./generated/prisma");
const prisma = new PrismaClient();
const firebase = require("./middleware/auth");

exports.createLinktoken = async (req, res) => {
  const firebaseUid = req.user?.uid || "fallback-id"; // firebase middleware

  try {
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: firebaseUid,
      },
      client_name: "Fina",
      products: ["auth", "transactions"],
      country_codes: ["US"],
      language: "en",
    });

    res.json({ link_token: response.data.link_token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create link token " });
  }
};

exports.exchangePublicToken = async (req, res) => {
  const { public_token } = req.body;
  const firebaseUid = req.user.uid;
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    const access_token = response.data.access_token;
    const item_id = response.data.item_id;
    // updates the prisma database
    await prisma.user.upsert({
      where: { id: firebaseUid },
      update: {
        plaidAccessToken: access_token,
        plaidItemId: item_id,
        bankConnected: true,
      },
      create: {
        id: firebaseUid,
        email: req.user.email,
        plaidAccessToken: access_token,
        plaidItemId: item_id,
        bankConnected: true,
      },
    });

    res.json({ success: true }); // to store token
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not exchange token" });
  }
};
// checks connection status

exports.getConnectionStatus = async (req, res) => {
  const firebaseUid = req.user.uid;

  try {
    const user = await prisma.user.findUnique({
      where: { id: firebaseUid },
      select: { bankConnected: true },
    });

    res.json({ connected: user?.bankConnected || false });
  } catch (err) {
    res.status(500).json({ error: "Could not check status" });
  }
};

exports.getTransactions = async (req, res) => {
  const firebaseUid = req.user.uid;

  try {
    const user = await prisma.user.findUnique({
      where: { id: firebaseUid },
    });

    if (!user?.plaidAccessToken) {
      return res.status(400).json({ error: "No Plaid access token found" });
    }

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date();

    const response = await plaidClient.transactionsGet({
      access_token: user.plaidAccessToken,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      options: { count: 50 },
    });

    const transactions = response.data.transactions.map((tx) => ({
      id: tx.transaction_id,
      name: tx.name,
      amount: tx.amount,
      date: tx.date,
      merchant: tx.merchant_name || tx.name || "Unknown Merchant", // Use merchant_name, fallback to name, then default
    }));

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};
