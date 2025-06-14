require("dotenv").config();
const express = require("express");
const Database = require("./config/database");

const testRoutes = require("./routes/testRoute");

const app = express();

const PORT = process.env.PORT || 4000;

const db = new Database(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

db.connect().catch((err) =>
  console.error("Error connecting to database:", err)
);


// ...

app.get("/server-status", (req, res) => {
  res.status(200).json({ message: "Server is up and running!" });
});

// ...
app.use(express.json()); // middleware that parse JSON strings
app.use("/test", testRoutes);


process.on("SIGINT", async () => {
  try {
    await db.disconnect();
    console.log("Disconnected from database.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

app.listen(PORT, () => console.log(`Server up and running on port ${PORT}!`));
