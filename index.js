require("dotenv").config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const router = require("./routes/route");
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(morgan("dev"));
app.use("/", router);

app.get("/", (req, res) => {
  res.send("Hallo, Selamat datang!");
});

app.listen(port, () => {
  console.log(
    `Example app listening on port ${port}. visit http://localhost:${port}`
  );
});