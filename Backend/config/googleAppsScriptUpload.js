const axios = require("axios");

const uploadFileToDriveViaAppsScript = async (file) => {
  const appsScriptUrl = String(process.env.GOOGLE_APPS_SCRIPT_URL || "").trim();

  if (!appsScriptUrl) {
    throw new Error("GOOGLE_APPS_SCRIPT_URL is not configured.");
  }

  if (!file?.buffer?.length) {
    throw new Error("Attachment file is empty.");
  }

  const response = await axios.post(
    appsScriptUrl,
    {
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileBase64: file.buffer.toString("base64"),
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 30000,
    },
  );

  const data = response?.data ?? {};

  if (!data.success) {
    throw new Error(data.message || "Apps Script upload failed.");
  }

  return {
    fileId: data.fileId || "",
    fileName: data.fileName || file.originalname || "",
    fileUrl: data.fileUrl || "",
    downloadUrl: data.downloadUrl || "",
  };
};

module.exports = uploadFileToDriveViaAppsScript;
