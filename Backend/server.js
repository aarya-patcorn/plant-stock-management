const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const purchaseRoutes = require("./routes/purchaseRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const manufacturingRoutes = require("./routes/manufacturingRoutes");
const dispatchRoutes = require("./routes/dispatchRoutes");
const authRoutes = require("./routes/authRoutes");
const wastageRoutes = require("./routes/wastageRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

mongoose.set("strictQuery", true);
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/manufacturing", manufacturingRoutes);
app.use("/api/dispatch", dispatchRoutes);
app.use("/api/wastage", wastageRoutes);
app.use("/api/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/plant-stock-management";

mongoose
  .connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB error:", error);
    process.exit(1);
  });
