const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/auth");
const {
  createLinktoken,
  exchangePublicToken,
  getConnectionStatus,
  getTransactions,
} = require("../plaidControllers");

router.post("/create-link-token", verifyFirebaseToken, createLinktoken);
router.post("/exchange-public-token", verifyFirebaseToken, exchangePublicToken);
router.get("/connection-status", verifyFirebaseToken, getConnectionStatus);

router.get("/transactions", verifyFirebaseToken, getTransactions);

module.exports = router;
