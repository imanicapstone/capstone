const {findSimilarUser } = require("./findSimilarUser")

// hashmap of weights 

const weights = new Map();

weights.set('USER_WEIGHT', 0.5);
weights.set('GLOBAL_WEIGHT', 0.2);
weights.set('SIMILAR_USER_WEIGHT', 0.3);
weights.set('DECAY_FACTOR', 0.9);


const userWeight = weights.get('USER_WEIGHT');
const globalWeight = weights.get('GLOBAL_WEIGHT');
const similarUserWeightOriginal = weights.get('SIMILAR_USER_WEIGHT') * similarUserScore;

// gets sum of weights to use for normalization
const sumWeights = userWeight + globalWeight + similarUserWeight;

// normalize weights to equal 1
weights.set('USER_WEIGHT', userWeight / sumWeights);
weights.set('GLOBAL_WEIGHT', globalWeight / sumWeights);
weights.set('SIMILAR_USER_WEIGHT', similarUserWeightOriginal / sumWeights);


// similar user weight that will be used 
async function calculateSimilarUserWeight(userId) {
  const similarUserScore = await findSimilarUser(userId);
  const similarUserWeight = weights.get('SIMILAR_USER_WEIGHT') * similarUserScore;
  return similarUserWeight;
}

module.exports = {
  weights,
  calculateSimilarUserWeight,
};
