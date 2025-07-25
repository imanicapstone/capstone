const { getYelpCategory } = require("./yelpCategorize");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { confidenceCalculation } = require("./confidenceScore");

/**
 * Categorizes a transaction merchant by checking if the merchant already has a saved category,
 * or otherwise fetching category data from Yelp and storing it.
 * 
 * 1. Checks for an existing merchant category record in the database.
 * 2. If found, updates the `lastUsed` timestamp and returns the saved category and confidence score.
 * 3. If not found, fetches category info from Yelp and calculates a confidence score.
 * 4. If Yelp data is missing or empty, assigns an "Uncategorized" category.
 * 5. Otherwise, assigns the first Yelp category, saves the association, and returns it.
 *
 * @async
 * @function categorizeTransaction
 * @param {string} merchantName - The name of the merchant to categorize.
 * @param {string} userId - The ID of the user for who the category is being determined or created.
 */ 
async function categorizeTransaction(merchantName, userId) {
  // check if this merchant is already categorized
  const existingMerchant = await prisma.YelpCategory.findFirst({
    where: {
      merchantName: merchantName,
    },
    include: { category: true },
  });

  if (existingMerchant) {
    // update lastUsed timestamp
    await prisma.YelpCategory.update({
      where: { id: existingMerchant.id },
      data: { lastUsed: new Date() },
    });

    return {
      category: existingMerchant.category,
      confidenceScore: existingMerchant.confidenceScore,
    };
  }

  // if no existing merchant get the category from yelp

  const yelpData = await getYelpCategory(merchantName);
  const confidence = confidenceCalculation(merchantName, yelpData);

  if (
    !yelpData ||
    !yelpData.yelp_categories ||
    yelpData.yelp_categories.length === 0
  ) {
    // uncategorized for merchants that didnt fit into either one
    const uncategorized = await getOrCreateCategory("Uncategorized", userId);
    await createYelpCategory(merchantName, uncategorized.id, confidence);
    return {
      category: uncategorized,
      confidenceScore: confidence,
    };
  }

  // uses the first Yelp category
  const primaryCategory = yelpData.yelp_categories[0];
  const category = await getOrCreateCategory(primaryCategory, userId);

  // merchant category association
  await createYelpCategory(merchantName, category.id, confidence);
  return {
    category: category,
    confidenceScore: confidence,
  };
}
// gets or creates a category that the user is able to edit
async function getOrCreateCategory(categoryName, userId) {
  const existingCategory = await prisma.PersonalCategory.findFirst({
    where: {
      name: categoryName,
      userId: userId,
    },
  });

  if (existingCategory) {
    return existingCategory;
  }

  return await prisma.PersonalCategory.create({
    data: {
      name: categoryName,
      userId: userId,
    },
  });
}
// create merchant category association, user is not able to edit yelp categories,
// as these are sitewide.

async function createYelpCategory(merchantName, categoryId, confidence) {
  return await prisma.YelpCategory.create({
    data: {
      merchantName: merchantName,
      // normalized names for name matching
      normalized: merchantName.toLowerCase().replace(/[^a-z0-9]/g, ""),
      categoryId: categoryId,
      lastUsed: new Date(),
      confidenceScore: confidence,
    },
  });
}

module.exports = {
  categorizeTransaction,
  getOrCreateCategory,
  createYelpCategory,
};
