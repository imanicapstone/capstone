const plaidClient = require("./plaidClient");
const { PrismaClient } = require("./generated/prisma");
const prisma = new PrismaClient();
const firebase = require("./middleware/auth");
const {
  categorizeTransaction,
  getOrCreateCategory,
} = require("./expense_categorization/merchantCategories");
const {
  recommendCategory,
} = require("./expense_categorization/merchantControllers");

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

async function calculateMerchantConfidenceAndRecommendations(
  merchantNames,
  firebaseUid
) {
  // process all merchants in one batch
  const confidenceScores = {};
  const recommendedCategories = {};

  // using promise all for parallel promising
  await Promise.all(
    merchantNames.map(async (merchantName) => {
      // get confidence score
      const result = await categorizeTransaction(merchantName, firebaseUid);
      confidenceScores[merchantName] = result.confidenceScore;

      // for low confidence merchants, get recommendations
      if (result.confidenceScore < 80) {
        try {
          // direct function call instead of api request
          const directReq = {
            user: { uid: firebaseUid },
            body: {
              categoryToOverwrite: result.category.name || "Uncategorized",
            },
          };

          let recommendedCategory = null;
          const directRes = {
            json: (data) => {
              recommendedCategory = data.recommendedCategory;
            },
            status: () => ({
              json: () => {}, // mock for error handling
            }),
          };

          await recommendCategory(directReq, directRes);

          if (recommendedCategory) {
            recommendedCategories[merchantName] = recommendedCategory;
          } else {
            // applying fallbacks manually if needed
            const fallbacks = {
              "Food and Drink": "Groceries",
              Bars: "Entertainment",
              Shopping: "Personal",
              Payment: "Bills & Utilities",
              Transfer: "Financial",
            };
            recommendedCategories[merchantName] =
              fallbacks[result.category.name] || "Miscellaneous";
          }
        } catch (err) {
          console.error("Error getting recommended category:", err);
        }
      }
    })
  );
  return { confidenceScores, recommendedCategories };
}

exports.getTransactions = async (req, res) => {
  const firebaseUid = req.user.uid;
  try {
    // First check if we should use cached transactions from database
    const useCached = req.query.cached === "true";
    let transactions = [];

    if (useCached) {
      // Get transactions directly from database instead of Plaid
      transactions = await prisma.transaction.findMany({
        where: { userId: firebaseUid },
        orderBy: { date: "desc" },
        take: 50,
      });

      // Format them to match the expected structure
      transactions = transactions.map((tx) => ({
        id: tx.id,
        name: tx.description,
        amount: tx.amount,
        date: tx.date,
        merchant: tx.merchant || tx.description || "Unknown Merchant",
        category: tx.category || "Uncategorized",
      }));
    } else {
      // original Plaid fetch logic
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

      transactions = response.data.transactions.map((tx) => ({
        id: tx.transaction_id,
        name: tx.name,
        amount: tx.amount,
        date: tx.date,
        merchant: tx.merchant_name || tx.name || "Unknown Merchant", // Use merchant_name, fallback to name, then default
      }));

      // process each transaction
      for (const tx of transactions) {
        const merchantName = tx.merchant;
        const result = await categorizeTransaction(merchantName, firebaseUid);
        const category = result.category;
        const confidenceScore = result.confidenceScore;

        // transaction exists in database
        const existingTransaction = await prisma.transaction.findFirst({
          where: {
            userId: firebaseUid,
            // identify unique transactions
            amount: tx.amount,
            date: new Date(tx.date),
            description: tx.name,
          },
        });
      }
    }

    // get unique merchants
    const merchantNames = [...new Set(transactions.map((tx) => tx.merchant))];

    // Calculate confidence scores and recommendations
    const { confidenceScores, recommendedCategories } =
      await calculateMerchantConfidenceAndRecommendations(
        merchantNames,
        firebaseUid
      );

    // added confidence scores and recommendation logic
    const enhancedTransactions = transactions.map((tx) => {
      return {
        ...tx,
        confidenceScore: confidenceScores[tx.merchant] || 0,
        recommendedCategory: recommendedCategories[tx.merchant] || null,
      };
    });

    res.json(enhancedTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

exports.overrideTransactionCategory = async (req, res) => {
  const { transactionId, categoryName } = req.body;
  const userId = req.user.uid;

  try {
    // check if the category exists or create it
    const category = await getOrCreateCategory(categoryName, userId);

    // first try to find the transaction by id
    let transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: userId,
      },
    });

    // if transaction not found try to find it by other attributes
    if (
      !transaction &&
      req.body.amount &&
      req.body.date &&
      req.body.description
    ) {
      transaction = await prisma.transaction.findFirst({
        where: {
          userId: userId,
          amount: parseFloat(req.body.amount),
          date: new Date(req.body.date),
          description: req.body.description,
        },
      });
    }

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // update transaction with new category
    const updatedTransaction = await prisma.transaction.update({
      where: {
        id: transaction.id,
      },
      data: {
        // save original category if this is the first override
        originalCategory: transaction.userOverridden
          ? transaction.originalCategory
          : transaction.category,
        category: categoryName,
        userOverridden: true, // indicates override was manually set
      },
    });

    res.json({ success: true, transaction: updatedTransaction });
  } catch (error) {
    console.error("Error overriding category:", error);
    res.status(500).json({ error: "Failed to override category" });
  }
};
