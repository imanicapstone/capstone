require("dotenv").config();
const axios = require("axios");

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
      console.log(`No results found`);
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
