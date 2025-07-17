const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { getYelpCategory } = require("./yelpCategorize");
const { confidenceCalculation } = require("./confidenceScore");
const {
  getOrCreateCategory,
  createYelpCategory,
} = require("./merchantCategories");
const { synonymMatch } = require("./merchantNameSynonymCategories");

/**
 * finds the most appropriate category for a merchant by evaluating existing
 * synonym matches and comparing their confidence scores with yelp category data.
 *
 * 1. attempts to find the highest confidence synonym from known merchant names
 * 2. if found, compares it with yelp category data based on calculated confidence
 * 3. associates merchant with the most confident category (either from synonym or yelp)
 * 4. if no match is found, defaults to an "uncategorized" category
 */

async function findHighestConfidenceSynonymCategory(merchantName, userId) {
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
  findHighestConfidenceSynonymCategory,
};
