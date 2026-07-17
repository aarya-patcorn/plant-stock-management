const axios = require("axios");

const syncToGoogleSheet = async (payload) => {
  const appsScriptUrl = String(process.env.GOOGLE_APPS_SCRIPT_URL2 || "").trim();
  const apiSecret = String(process.env.APPS_SCRIPT_SECRET || "").trim();

  if (!appsScriptUrl) throw new Error("GOOGLE_APPS_SCRIPT_URL2 is not configured.");
  if (!apiSecret) throw new Error("APPS_SCRIPT_SECRET is not configured.");

  const response = await axios.post(appsScriptUrl, { apiSecret, ...payload }, {
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
  });

  if (response?.data?.success === false) {
    throw new Error(response.data.message || "Google Sheet sync failed.");
  }

  return response.data;
};

module.exports = syncToGoogleSheet;