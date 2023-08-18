
const express = require('express');

const bodyParser = require('body-parser');
const routes = require('./routes');
const cors = require("cors");
const connectDB = require('./config/db')

connectDB();
const app = express();
const port = 3000;
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());



app.use('/', routes);

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
