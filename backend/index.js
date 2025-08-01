require('dotenv').config();
const express = require("express");
const app = express();
const PORT = 3000;
const cors = require("cors");
const userRouter = require("./routes/user");
const plaidRouter = require("./routes/plaidRoutes");
const reminderRouter = require("./routes/reminderRoutes");
const chatbotRouter = require("./chatbot/chatbotRoutes");

//middleware
app.use(express.json());

// enables cors for all routes
app.use(cors());

// user routes
app.use("/user", userRouter);

//plaid routes
app.use("/plaid", plaidRouter);

//reminder routes
app.use("/reminders", reminderRouter);

//chatbot routes
app.use("/api/finance", chatbotRouter);

// main route
app.get("/", (req, res) => {
  res.send("Backend of Fina!");
});


app.listen(PORT, () => {
  console.log(`Fina is running on port ${PORT}`);
});
