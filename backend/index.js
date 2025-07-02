const express = require("express");
const app = express();
const PORT = 3000;
const cors = require("cors");
const userRouter = require("./routes/user");
const plaidRouter = require("./routes/plaidRoutes");

//middleware
app.use(express.json());

// enables cors for all routes
app.use(cors());

// user routes
app.use("/user", userRouter);

//plaid routes
app.use("/plaid", plaidRouter);

// main route
app.get("/", (req, res) => {
  res.send("Backend of Fina!");
});

app.listen(PORT, () => {
  console.log(`Fina is running on port ${PORT}`);
});
