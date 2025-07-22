require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { logger } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const Database = require("./config/database");

const app = express();
const PORT = process.env.PORT || 4000;

const db = new Database(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Database connection
db.connect().catch((err) => console.error(`Error connecting to DB:`, err));

app.use(logger);
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Health check
app.get("/server-status", (req, res) => {
  res.status(200).json({ message: "Server is up and running!" });
});

// MET Museum endpoints
app.use("/api/met", require("./routes/metRoutes"));

// Other routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/artists", require("./routes/artistRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/artworks/:id/comments", require("./routes/commentRoutes"));
app.use("/api/artworks", require("./routes/artworkRoutes"));
app.use("/api/feed", require("./routes/feedRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/stats", require("./routes/statsRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await db.disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
