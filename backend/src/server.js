require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const { logger } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const Database = require("./config/database");

const app = express();

const cors = require("cors");

const PORT = process.env.PORT || 4000;

const db = new Database(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

db.connect().catch((err) =>
  console.error(`Error connecting to database:`, err)
);

app.get("/server-status", (req, res) => {
  res.status(200).json({ message: `Server is up and running!` });
});

app.use(logger);
app.use(cors());
app.use(cookieParser());
app.use(express.json()); // middleware that parse JSON strings

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

process.on("SIGINT", async () => {
  try {
    await db.disconnect();
    console.log(`Disconnected from database.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server up and running on port ${PORT}!`));
