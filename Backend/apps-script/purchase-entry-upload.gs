const DRIVE_FOLDER_ID = "PASTE_DRIVE_FOLDER_ID_HERE";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const fileName = String(payload.fileName || "").trim();
    const mimeType = String(payload.mimeType || "application/octet-stream").trim();
    const fileBase64 = String(payload.fileBase64 || "").trim();

    if (!fileName || !fileBase64) {
      return jsonResponse({
        success: false,
        message: "fileName and fileBase64 are required.",
      });
    }

    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const bytes = Utilities.base64Decode(fileBase64);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);
    const file = folder.createFile(blob);

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return jsonResponse({
      success: true,
      fileId: file.getId(),
      fileName: file.getName(),
      fileUrl: file.getUrl(),
      downloadUrl: "https://drive.google.com/uc?export=download&id=" + file.getId(),
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      message: error.message || "Upload failed.",
    });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
