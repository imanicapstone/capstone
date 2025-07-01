const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
require('dotenv').config();

const config = new Configuration ({
    basePath: PlaidEnvironments.sandbox, // Will be changed to development or production later 
    baseOptions: {
        headers: {
        'client-id': process.env.PLAID_CLIENT_ID,
        'secret': process.env.PLAID_SECRET,

        },
    },
});

const plaidClient = new PlaidApi(config);
module.exports = plaidClient;
