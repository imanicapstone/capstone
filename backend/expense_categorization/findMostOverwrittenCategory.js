const plaidClient = require("../plaidClient");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const {findMostSimilarUser } = require("./findSimilarUser")
const { weights } = require("./weightValues")
const { calculateConfidenceScore } = require("./confidenceScore")

/**
 * Finds the most overwritten category for a given user and category to overwrite
 * based on the user's own overwrites, similar user's overwrites weighted by similarity,
 * and the database-wide overwrites, then recommends the category with the highest confidence score.
 *
 * - Retrieves the most similar user to the given user.
 * - Fetches transactions where the current user has overwritten categories.
 * - Fetches all transactions where the category was overwritten by any user.
 * - Fetches transactions where the similar user overwrote the category.
 * - Aggregates counts and weights for each overwritten category from the user, similar user, and database.
 * - Calculates total weights and confidence scores for each category.
 * - Sorts categories by confidence score and returns the top recommendation.
 */


async function findMostOverwrittenCategory(userId, categoryToOverwrite) {
  // gets most similar user 
  const { mostSimilarUser, similarity } = await findMostSimilarUser(userId);
  
  if (!mostSimilarUser) {
    return null;
  }
  
  // similar user's ID
  const similarUserId = mostSimilarUser.id;
  
  // current user overwritten transactions
  const userOverWritten = await prisma.transaction.findMany({
    where: { 
      userId,
      userOverridden: true
    },
    select: { category: true,
        originalCategory: true,
     },
  });

  // all users transactions where this category was overwritten
  const dbOverWritten = await prisma.transaction.findMany({
    where: {
      originalCategory: categoryToOverwrite,
      userOverridden: true
    },
    select: { 
      category: true,
      userId: true 
    },
  });
  
 
 // similar user's transactions where this category was overwritten
  const similarOverWritten = await prisma.transaction.findMany({
    where: { 
      userId: similarUserId,
      originalCategory: categoryToOverwrite,
      userOverridden: true
    },
    select: { 
      category: true, 
      originalCategory: true
    },
  });

  // occurences of each overwritten category
  const categoryCounts = {}

  // user's own overwrites
  userOverWritten.forEach(transaction => {
    if (!categoryCounts[transaction.category]) {
      categoryCounts[transaction.category] = {
        count: 0,
        userWeight: 0,
        similarUserWeight: 0,
        dbWeight: 0,
        totalWeight: 0
      };
    }
    categoryCounts[transaction.category].count++;
    categoryCounts[transaction.category].userWeight += weights.userWeight;
  });

  // similar users overwrites (similarity score)
  similarOverWritten.forEach(transaction => {
    if (!categoryCounts[transaction.category]) {
      categoryCounts[transaction.category] = {
        count: 0,
        userWeight: 0,
        similarUserWeight: 0,
        dbWeight: 0,
        totalWeight: 0
      };
    }

    categoryCounts[transaction.category].count++;
    // weights contribution by similarity score
    categoryCounts[transaction.category].similarUserWeight += weights.similarUserWeight * similarity;
  });

    dbOverWritten.forEach(transaction => {
    if (!categoryCounts[transaction.category]) {
      categoryCounts[transaction.category] = {
        count: 0,
        userWeight: 0,
        similarUserWeight: 0,
        dbWeight: 0,
        totalWeight: 0
      };
    }
    categoryCounts[transaction.category].count++;
    categoryCounts[transaction.category].dbWeight += weights.dbWeight;
  });

    //  total weights
  Object.keys(categoryCounts).forEach(category => {
    categoryCounts[category].totalWeight = 
      categoryCounts[category].userWeight + 
      categoryCounts[category].similarUserWeight + 
      categoryCounts[category].dbWeight;
  });

  // calculates confidence scores of each category

  const categoryScores = Object.keys(categoryCounts).map(category => {
    return {
      category,
      ...categoryCounts[category],
      confidenceScore: calculateConfidenceScore(
        categoryCounts[category].totalWeight,
        similarity,
        categoryCounts[category].count
      )
    };
  });

  // sorts by confidence score
  categoryScores.sort((a, b) => b.confidenceScore - a.confidenceScore);

  // return the category with the highest score
 if (categoryScores.length > 0) {
    return {
      recommendedCategory: categoryScores[0].category,
      confidenceScore: categoryScores[0].confidenceScore,
      similarityScore: similarity,
      similarUser: mostSimilarUser
    };
  } else {
    // Return null if no categories were found
    return null;
  }

  
 
}

module.exports = { findMostOverwrittenCategory };


