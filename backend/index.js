const express = require('express');
const app = express();
const cors = require('cors')

//middleware
app.use(express.json())

// enables cors for all routes
app.use(cors())
