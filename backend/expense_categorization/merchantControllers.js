const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { categorizeTransaction } = require("./merchantCategories"); // yelp catgorization
const { categorizeBySynonym } = require("./synonymCategorization"); // synonym categorization
const {
  findMostOverwrittenCategory,
} = require("./findMostOverwrittenCategory"); // returns category most recommended

/**
 * Retrieves the most confident category classification for a given merchant name.
 * It compares two categorization methods (Yelp and synonym-based) and returns the result
 * with the higher confidence score.
 *
 * @async
 * @function getMerchantConfidence
 * @param {Object} req - The Express request object.
 * @param {Object} req.params - Route parameters from the request.
 * @param {string} req.params.merchantName - The merchant name to categorize.
 * @param {Object} req.user - The authenticated user object attached to the request.
 * @param {string} req.user.uid - The unique identifier of the current user.
 * @param {Object} res - The Express response object.
 */ 
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

/**
 * Recommends a more accurate category to overwrite a user's current transaction category.
 * Attempts to find a commonly overwritten category by similar users. If none is found,
 * it falls back to a predefined category based on the provided one.
 *
 * @async
 * @function recommendCategory
 * @param {Object} req - The Express request object.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.uid - The unique identifier for the authenticated user.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.categoryToOverwrite - The current category the user wants to change.
 * @param {Object} res - The Express response object.
 */

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
