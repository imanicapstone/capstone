const { getYelpCategory } = require("./yelpCategorize");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { confidenceCalculation } = require("./confidenceScore");
const synonyms = require("synonyms");
const { getOrCreateCategory } = require("./merchantCategories");

async function synonymMatch(merchantName) {
  const normalized = merchantName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const words = normalized.split(" ");
  // synonyms package asks that i specify the "type" of word, so running through each possibly type
  const parts = ["n", "v", "a", "r"];
  let all = [];

  for (const word of words) {
    for (const pos of parts) {
      const syns = synonyms(word, pos);
      if (syns) {
        all = all.concat(syns);
      }
    }
  }

  return [...new Set(all)];
}

async function createYelpCategory(merchantName, categoryId, confidence) {
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

async function findHighestConfidenceCategory(merchantName, userId) {
  const merchantSynonyms = await synonymMatch(merchantName);

  let highestConfidenceSynonym = null;
  let highestConfidenceScore = 0;
  let highestConfidenceCategory = null;

  // check each synonym against the database
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

  // if high confidence synoynm has been found, it is stored
  // will still check yelp and compare the two
  const yelpData = await getYelpCategory(merchantName);
  const yelpConfidence = confidenceCalculation(merchantName, yelpData);

  if (highestConfidenceScore > yelpConfidence) {
    // uses the existing synonym category and confidence
    return {
      category: highestConfidenceCategory,
      confidenceScore: highestConfidenceScore,
      usedSynonym: highestConfidenceSynonym,
    };
  } else if (
    yelpData &&
    yelpData.yelp_categories &&
    yelpData.yelp_categories.length > 0
  ) {
    // uses the yelp category and confidence score
    const primaryCategory = yelpData.yelp_categories[0];
    const category = await getOrCreateCategory(primaryCategory, userId);

    // creates association for merchant name
    await createYelpCategory(merchantName, category.id, yelpConfidence);

    return {
      category: category,
      confidenceScore: yelpConfidence,
      usedSynonym: null, // if original merchant name was used
    };
  } else {
    // if no matches from synonyms or yelp, uncategorized
    const uncategorized = await getOrCreateCategory("Uncategorized", userId);
    await createYelpCategory(merchantName, uncategorized.id, 0);

    return {
      category: uncategorized,
      confidenceScore: 0,
      usedSynonym: null,
    };
  }
}

module.exports = {
  synonymMatch,
  findHighestConfidenceCategory,
};
