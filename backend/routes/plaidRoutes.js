const firebaseAuth = require('./middleware/auth');
const express = require('express');
const plaidClient = require('./plaidClient');
const app = express();
app.use(express.json());

app.post('', async (req, res) => {
    try{
        const response = await plaidClient.linkTokenCreate({
            user: {
                client_user_id: '',
            },
            client_name: 'My App',
            products: ['auth', 'transactions'],
            country_codes: ['US'],
            language: 'en',
        });
        res.json({ link_token: response.data.link_token });
    }   catch(error) {
        console.error('Error creating link token:', error.response?.data || error);
        res.status(500).json({ error: 'Failed to create link token' });
    }
});
