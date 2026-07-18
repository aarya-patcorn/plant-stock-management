const axios = require("axios");

const syncToGoogleSheet = async (payload) => {
  const appsScriptUrl = String(process.env.GOOGLE_APPS_SCRIPT_URL2 || "").trim();
  const apiSecret = String(process.env.APPS_SCRIPT_SECRET || "").trim();

  console.log("[googleSheetSync] sending payload", {
    action: payload?.action,
    appsScriptUrl: Boolean(appsScriptUrl),
    apiSecret: Boolean(apiSecret),
    payloadKeys: Object.keys(payload || {}),
  });

  if (!appsScriptUrl) throw new Error("GOOGLE_APPS_SCRIPT_URL2 is not configured.");
  if (!apiSecret) throw new Error("APPS_SCRIPT_SECRET is not configured.");

  try {
    const response = await axios.post(appsScriptUrl, { apiSecret, ...payload }, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });

    console.log("[googleSheetSync] response status", response?.status);
    console.log("[googleSheetSync] response data", response?.data);

    if (response?.data?.success === false) {
      throw new Error(response.data.message || "Google Sheet sync failed.");
    }

    return response.data;
  } catch (error) {
    console.error("[googleSheetSync] sync failed", error.message);
    if (error.response) {
      console.error("[googleSheetSync] response status", error.response.status);
      console.error("[googleSheetSync] response data", error.response.data);
    }
    throw error;
  }
};

module.exports = syncToGoogleSheet;