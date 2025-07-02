const express = require('express');
const router = express.Router();
const verifyFirebaseToken = require('../middleware/auth');
const { createLinktoken, exchangePublicToken, getConnectionStatus } = require('../plaidControllers');

router.post('/create-link-token', verifyFirebaseToken, createLinktoken);
router.post('/exchange-public-token', verifyFirebaseToken, exchangePublicToken);
router.get('/connection-status', verifyFirebaseToken, getConnectionStatus);

module.exports = router;
