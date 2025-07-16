// calculate similarity between business name string and yelp category string

const stringSimilarity = require("string-similarity");

function calculateConfidenceScore(merchantName, yelpData) {
  if (!yelpData) return 0;
  let score = 0;

  // name similarity (0-50 points)
  const nameSimilarity = stringSimilarity.compareTwoStrings(
    merchantName.toLowerCase(),
    yelpData.name.toLowerCase()
  );
  score += nameSimilarity * 50;
  // category specificity (0-50 points)
  // (fewer categories might mean more specific categories)
  if (yelpData.yelp_categories) {
    score += Math.max(0, 50 - (yelpData.yelp_categories.length - 1) * 10);
  }

  return Math.min(100, score);
}

module.exports = { confidenceCalculation: calculateConfidenceScore };
