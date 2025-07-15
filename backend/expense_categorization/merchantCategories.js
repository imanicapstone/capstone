const { getYelpCategory } = require("./yelpCategorize");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

async function categorizeTransaction(merchantName, userId) {
  // check if this merchant is already categorized
  const existingMerchant = await prisma.YelpCategory.findFirst({
    where: {
      merchantName: merchantName,
      userId: userId,
    },
    include: { category: true },
  });

  if (existingMerchant) {
    // update lastUsed timestamp
    await prisma.YelpCategory.update({
      where: { id: existingMerchant.id },
      data: { lastUsed: new Date() },
    });

    return existingMerchant.category;
  }

  // if no existing merchant get the category from yelp

  const yelpData = await getYelpCategory(merchantName);

  if (
    !yelpData ||
    !yelpData.yelp_categories ||
    yelpData.yelp_categories.length === 0
  ) {
    // uncategorized for merchants that didnt fit into either one
    const uncategorized = await getOrCreateCategory("Uncategorized", userId);
    await createYelpCategory(merchantName, uncategorized.id, userId);
    return uncategorized;
  }

  // uses the first Yelp category
  const primaryCategory = yelpData.yelp_categories[0];
  const category = await getOrCreateCategory(primaryCategory, userId);

  // merchant category association
  await createYelpCategory(merchantName, category.id, userId);
  return category;
}
// gets or creates a category
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
// create merchant category association
async function createYelpCategory(merchantName, categoryId, userId) {
  return await prisma.YelpCategory.create({
    data: {
      merchantName: merchantName,
      // normalized names for name matching 
      normalized: merchantName.toLowerCase().replace(/[^a-z0-9]/g, ""),
      categoryId: categoryId,
      userId: userId,
      lastUsed: new Date(),
    },
  });
}

module.exports = { categorizeTransaction };
