const plaidClient = require('./plaidClient');

exports.createLinktoken = async (req, res) => {
    const firebaseUid = req.user?.uid || 'fallback-id'; // firebase middleware 
    
    try {
        const response = await plaidClient.linkTokenCreate({
            user: {
                client_user_id: firebaseUid,
             },
            client_name: 'Fina',
            products: ['auth', 'transactions'],
            country_codes: ['US'],
            language: 'en',
        });

        res.json({ link_token: response.data.link_token });
    }   catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Could not create link token '});
        }
};

exports.exchangePublicToken = async (req, res) => {
    const { public_token } = req.body;
    try {
        const response = await plaidClient.itemPublicTokenExchange({ public_token });
        const access_token = response.data.access_token;
        res.json({ access_token }) // to store token
    }   catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Could not exchange token' });
    }

};   