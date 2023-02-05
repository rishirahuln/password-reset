require("dotenv").config();
const express = require("express");
const { db } = require("./db/connection.db");
const cookieParser = require("cookie-parser");
const cors = require("cors");

// Importing routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");

const { isAuth } = require("./middlewares/authentication");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Connecting DB
db();

app.get("/", (req, res) => {
  res.send("Welcome to Password Reset Flow");
});

app.use("/api", authRoutes);
app.use("/api", isAuth, userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`App is running on PORT ${PORT}`);
});
