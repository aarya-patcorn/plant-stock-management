const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require('path');
const purchaseRoutes = require("./routes/purchaseRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const manufacturingRoutes = require("./routes/manufacturingRoutes");
const dispatchRoutes = require("./routes/dispatchRoutes");
const authRoutes = require("./routes/authRoutes");
const wastageRoutes = require("./routes/wastageRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

mongoose.set("strictQuery", true);
dotenv.config({ path: path.resolve(__dirname, '.env') });
console.log('[server] using env file:', path.resolve(__dirname, '.env'));

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
const MONGODB_URI = process.env.MONGODB_URI;
const HOST = "0.0.0.0";

if (!MONGODB_URI) {
  console.error("MONGODB_URI is missing in environment variables.");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log("MongoDB connected");
    require("./jobs/reportScheduler");


    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
      console.log(`Access from other devices: http://192.168.29.11:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB error:", error.message);
    process.exit(1);
  });
