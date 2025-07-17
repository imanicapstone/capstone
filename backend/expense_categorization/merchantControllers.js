const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const {
  findHighestConfidenceSynonymCategory,
} = require("./yelpSynonymComparison");

// directly retrieves yelp confidence scores
exports.getMerchantConfidence = async (req, res) => {
  const { merchantName } = req.params;
  const userId = req.user.uid;

  try {
    const result = await findHighestConfidenceSynonymCategory(
      merchantName,
      userId
    );

    if (!result) {
      return res.status(404).json({ error: "Merchant not found" });
    }

    return res.json({
      merchantName: result.usedSynonym || merchantName,
      confidenceScore: result.confidenceScore,
      category: result.category.name,
      usedSynonym: result.usedSynonym,
    });
  } catch (error) {
    console.error("Error fetching merchant confidence:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch merchant confidence" });
  }
};
