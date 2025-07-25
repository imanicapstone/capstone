const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { categorizeTransaction } = require("./merchantCategories"); // yelp catgorization
const { categorizeBySynonym } = require("./synonymCategorization"); // synonym categorization
const {
  findMostOverwrittenCategory,
} = require("./findMostOverwrittenCategory"); // returns category most recommended

// directly retrieves yelp confidence scores
exports.getMerchantConfidence = async (req, res) => {
  const { merchantName } = req.params;
  const userId = req.user.uid;

  try {
    // get results from both categorization methods
    const yelpResult = await categorizeTransaction(merchantName, userId);
    const synonymResult = await categorizeBySynonym(merchantName, userId);

    // compare confidence scores and choose the better one
    let finalResult;
    let method;

    if (
      synonymResult &&
      synonymResult.confidenceScore > yelpResult.confidenceScore
    ) {
      finalResult = synonymResult;
      method = "synonym";
    } else {
      finalResult = yelpResult;
      method = "yelp";
    }

    return res.json({
      merchantName: finalResult.usedSynonym || merchantName,
      confidenceScore: finalResult.confidenceScore,
      category: finalResult.category.name,
      usedSynonym: finalResult.usedSynonym,
      method: method, // tells which method was used
    });
  } catch (error) {
    console.error("Error fetching merchant confidence:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch merchant confidence" });
  }
};

exports.recommendCategory = async (req, res) => {
  const userId = req.user.uid;
  const { categoryToOverwrite } = req.body;

  if (!categoryToOverwrite) {
    return res.status(400).json({ error: "Missing category to overwrite" });
  }

  try {
    const recommendedCateg = await findMostOverwrittenCategory(
      userId,
      categoryToOverwrite
    );

    if (!recommendedCateg) {
      // if no common categories are in the db, creates a fall back category
      const fallbacks = {
        "Food and Drink": "Groceries",
        Bars: "Entertainment",
        Shopping: "Personal",
        Payment: "Bills & Utilities",
        Transfer: "Financial",
      };
      const fallbackCategory =
        fallbacks[categoryToOverwrite] || "Miscellaneous";

      return res.json({
        recommendedCategory: fallbackCategory,
        confidenceScore: 0.5,
        similarityScore: 0,
        similarUser: null,
      });
    }
    return res.json(recommendedCateg);
  } catch (error) {
    console.error("Error recommending category:", error);
    return res.status(500).json({ error: "Failed to recommend category" });
  }
};
