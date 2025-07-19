require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { logger } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const Database = require("./config/database");

const metClient = require("./services/metApiClient");

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
app.get("/api/search", async (req, res, next) => {
  const { q, hasImages = true } = req.query;
  if (!q || !q.trim()) return res.status(400).json({ error: "Query mancante" });

  try {
    const result = await metClient.search(q, hasImages);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get("/api/objects/:id", async (req, res, next) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id))
    return res.status(400).json({ error: "ID non valido" });

  try {
    const result = await metClient.getObjectById(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get("/api/objects", async (req, res, next) => {
  const { departmentIds } = req.query;
  if (!departmentIds)
    return res.status(400).json({ error: "DepartmentId mancante" });

  try {
    const result = await metClient.listByDepartment(departmentIds);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

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
