require("dotenv").config();
const axios = require("axios");

/**
 * Fetches category information for a given business name from the Yelp Fusion API.
 *
 * Uses the Yelp API to search for a business by name and location, then extracts
 * its category titles if found. Defaults to searching in San Francisco, CA.
 *
 * @async
 * @function getYelpCategory
 * @param {string} businessName - The name of the business to search for.
 * @param {string} [location="San Francisco, CA"] - The location to search in (defaults to San Francisco).
 */
async function getYelpCategory(businessName, location = "San Francisco, CA") {
  const apiKey = process.env.YELP_API_KEY;

  const url = `https://api.yelp.com/v3/businesses/search`;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
  };

  const params = {
    term: businessName,
    location: location,
    limit: 1,
  };

  try {
    const response = await axios.get(url, { headers, params });
    const business = response.data.businesses[0];

    if (!business) {
      return null;
    }
    const categoryLabels = business.categories.map((c) => c.title);

    return {
      name: business.name,
      yelp_categories: categoryLabels,
    };
  } catch (error) {
    console.error("Yelp API error:", error.message);
    return null;
  }
}

module.exports = { getYelpCategory };
