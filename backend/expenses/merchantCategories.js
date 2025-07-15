const { getYelpCategory } = require("./yelpCategorize");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

async function categorizeTransaction(merchantName, userId) {
  // check if this merchant is already categorized
  const existingMerchant = await prisma.merchantCategory.findFirst({
    where: {
      merchantName: merchantName,
      userId: userId,
    },
    include: { category: true },
  });

  if (existingMerchant) {
    // update lastUsed timestamp
    await prisma.merchantCategory.update({
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
    console.log(`No Yelp categories found for ${merchantName}`);
    // uncategorized for merchants that didnt fit into either one
    const uncategorized = await getOrCreateCategory("Uncategorized", userId);
    await createMerchantCategory(merchantName, uncategorized.id, userId);
    return uncategorized;
  }

  // uses the first Yelp category
  const primaryCategory = yelpData.yelp_categories[0];
  const category = await getOrCreateCategory(primaryCategory, userId);

  // merchant category association
  await createMerchantCategory(merchantName, category.id, userId);
  return category;
}
// gets or creates a category
async function getOrCreateCategory(categoryName, userId) {
  const existingCategory = await prisma.category.findFirst({
    where: {
      name: categoryName,
      userId: userId,
    },
  });

  if (existingCategory) {
    return existingCategory;
  }

  return await prisma.category.create({
    data: {
      name: categoryName,
      userId: userId,
    },
  });
}
// create merchant category association
async function createMerchantCategory(merchantName, categoryId, userId) {
  return await prisma.merchantCategory.create({
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
