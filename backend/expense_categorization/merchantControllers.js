const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
// directly retrieves yelp confidence scores
exports.getMerchantConfidence = async (req, res) => {
  const { merchantName } = req.params;

  try {
    const yelpCategory = await prisma.YelpCategory.findFirst({
      where: {
        merchantName: merchantName,
      },
    });

    if (!yelpCategory) {
      return res.status(404).json({ error: "Merchant not found" });
    }

    return res.json({
      merchantName: yelpCategory.merchantName,
      confidenceScore: yelpCategory.confidenceScore,
    });
  } catch (error) {
    console.error("Error fetching merchant confidence:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch merchant confidence" });
  }
};
