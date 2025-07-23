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

// Middleware
app.use(logger);
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Health check
app.get("/server-status", (req, res) => {
  res.status(200).json({ message: "Server is up and running!" });
});

// API Routes - Ordine importante: più specifiche prima
// Auth routes (non richiedono autenticazione)
app.use("/api/auth", require("./routes/authRoutes"));

// MET Museum endpoints
app.use("/api/met", require("./routes/metRoutes"));

// Route per i favoriti (deve essere prima di /api/users/:id)
app.use("/api/users/:id/favorites", require("./routes/favoriteRoutes"));

// Route per gli utenti
app.use("/api/users", require("./routes/userRoutes"));

// Route per commenti specifici di artwork (deve essere prima di /api/artworks)
app.use("/api/artworks/:id/comments", require("./routes/commentRoutes"));

// Route per artwork
app.use("/api/artworks", require("./routes/artworkRoutes"));

// Route per notifiche
app.use("/api/notifications", require("./routes/notificationRoutes"));

// Altre route
app.use("/api/artists", require("./routes/artistRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/feed", require("./routes/feedRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/stats", require("./routes/statsRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));

// Global error handler (deve essere l'ultimo middleware)
app.use(errorHandler);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  try {
    await db.disconnect();
    console.log("Database connection closed.");
  } catch (err) {
    console.error("Error during shutdown:", err);
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  try {
    await db.disconnect();
    console.log("Database connection closed.");
  } catch (err) {
    console.error("Error during shutdown:", err);
  }
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/server-status`);
});

module.exports = app;