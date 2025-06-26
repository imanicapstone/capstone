const express = require('express');
const app = express();
const cors = require('cors')

//middleware
app.use(express.json())

// enables cors for all routes
app.use(cors())

// user routes
app.use('/user', userRouter)

// main route
app.get('/', (req, res) => {
    res.send('Backend of Fina!')
});

app.listen(PORT, () => {
  console.log(`Fina is running on port ${PORT}`);
});
