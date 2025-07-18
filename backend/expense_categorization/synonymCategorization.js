const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { synonymMatch } = require("./merchantNameSynonymCategories");
const { getOrCreateCategory } = require("./merchantCategories");

/**
 * finds the most appropriate category for a merchant based on synonym matching
 *
 * 1. attempts to find the highest confidence synonym from known merchant names
 * 2. if found, returns the category and confidence score associated with that synonym
 * 3. if no match is found, returns null or creates an uncategorized entry
 */
async function categorizeBySynonym(merchantName, userId) {
  const merchantSynonyms = await synonymMatch(merchantName);

  let highestConfidenceSynonym = null;
  let highestConfidenceScore = 0;
  let highestConfidenceCategory = null;

  // Check each synonym against the database
  for (const synonym of merchantSynonyms) {
    const existingSynonym = await prisma.YelpCategory.findFirst({
      where: {
        merchantName: synonym,
      },
      include: { category: true },
    });

    if (
      existingSynonym &&
      existingSynonym.confidenceScore > highestConfidenceScore
    ) {
      highestConfidenceSynonym = synonym;
      highestConfidenceScore = existingSynonym.confidenceScore;
      highestConfidenceCategory = existingSynonym.category;
    }
  }

  if (highestConfidenceCategory) {
    return {
      category: highestConfidenceCategory,
      confidenceScore: highestConfidenceScore,
      usedSynonym: highestConfidenceSynonym,
    };
  }

  // if no synonym match found, return null or create uncategorized entry
  const uncategorized = await getOrCreateCategory("Uncategorized", userId);

  return {
    category: uncategorized,
    confidenceScore: 0,
    usedSynonym: null,
  };
}

// creates a new synonym-based category association in the database

async function createSynonymCategory(
  merchantName,
  categoryId,
  confidence,
  usedSynonym = null
) {
  return await prisma.YelpCategory.create({
    data: {
      merchantName: merchantName,
      normalized: merchantName.toLowerCase().replace(/[^a-z0-9]/g, ""),
      categoryId: categoryId,
      lastUsed: new Date(),
      confidenceScore: confidence,
    },
  });
}

module.exports = {
  categorizeBySynonym,
  createSynonymCategory,
};
