const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const synonyms = require("synonyms");

/**
 * Normalizes the inputted merchant name.
 * Splits the merchant name into individual words and retrieves synonyms for each word using various parts of speech.
 *
 * @async
 * @function synonymMatch
 * @param {string} merchantName - The merchant name to be normalized and analyzed for synonyms.
 * @returns {Promise<string[]>} An array of synonyms derived from the merchant name.
 */
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

module.exports = {
  synonymMatch,
};
