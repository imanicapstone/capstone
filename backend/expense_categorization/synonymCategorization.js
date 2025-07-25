const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { synonymMatch } = require("./merchantNameSynonymCategories");
const { getOrCreateCategory } = require("./merchantCategories");
const stringSimilarity = require("string-similarity");

/**
 * Categorizes a merchant by analyzing its synonyms and matching them against known categories.
 * 
 * 1. Attempts to find direct synonym matches in the database with associated confidence scores.
 * 2. If no direct match is found, falls back to string similarity between synonyms and the user's custom categories.
 *
 * @async
 * @function categorizeBySynonym
 * @param {string} merchantName - The name of the merchant to categorize.
 * @param {string} userId - The ID of the user whose categories are used for comparison.
 */ 
async function categorizeBySynonym(merchantName, userId) {
  const merchantSynonyms = await synonymMatch(merchantName);

  // gets all unique categories
  const allCategories = await prisma.PersonalCategory.findMany({
    where: { userId: userId },
  });

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

  // if no match found, look for similar categories
  if (!highestConfidenceCategory && allCategories.length > 0) {
    for (const synonym of merchantSynonyms) {
      // compare this synonym with all category names
      for (const category of allCategories) {
        if (category.name === "Uncategorized") continue;

        // calculate similarity between synonym and category name
        const similarity = stringSimilarity.compareTwoStrings(
          synonym.toLowerCase(),
          category.name.toLowerCase()
        );

        // converts similarity to confidence score
        const confidenceScore = Math.round(similarity * 100);

        if (similarity > 0.3 && confidenceScore > highestConfidenceScore) {
          highestConfidenceSynonym = synonym;
          highestConfidenceScore = confidenceScore;
          highestConfidenceCategory = category;
        }
      }
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
