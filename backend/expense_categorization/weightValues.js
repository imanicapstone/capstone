const {findSimilarUser } = require("./findSimilarUser")

// hashmap of weights 

const weights = new Map();

// original weights before normalization
const USER_WEIGHT = 0.5;
const GLOBAL_WEIGHT = 0.2;
const SIMILAR_USER_WEIGHT = 0.3;
const DECAY_FACTOR = 0.9;

/**
 * Calculates and normalizes weights based on a similarity score for a given user.
 *
 * This function:
 * - Retrieves the similarity score for the provided user ID by calling `findSimilarUser`.
 * - Adjusts the SIMILAR_USER_WEIGHT based on the similarity score.
 * - Normalizes USER_WEIGHT, GLOBAL_WEIGHT, and the adjusted SIMILAR_USER_WEIGHT so they sum to 1.
 * - Updates the weights map with the normalized values.
 *
 * @async
 * @param {string} userId - The ID of the user to calculate similarity for.
 * @returns {Map<string, number>} The updated weights Map with normalized weight values.
 */
async function calculateWeights(userId) {
  const similarUserScore = await findSimilarUser(userId);
  // update similar user weight based on the similarity score with the most similar user
  const similarUserWeight = SIMILAR_USER_WEIGHT * similarUserScore;
  // gets sum of weights to use for normalization
  const sumWeights = USER_WEIGHT + GLOBAL_WEIGHT + similarUserWeight;
  // normalize weights so they sum to 1
  weights.set('USER_WEIGHT', userWeight / sumWeights);
  weights.set('GLOBAL_WEIGHT', globalWeight / sumWeights);
  weights.set('SIMILAR_USER_WEIGHT', similarUserWeightOriginal / sumWeights);
  return weights;
}

module.exports = {
  weights,
  calculateWeights,
};
