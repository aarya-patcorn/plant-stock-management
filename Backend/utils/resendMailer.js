const { Resend } = require("resend");
require("dotenv").config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM;
const MAIL_TO = process.env.MAIL_TO;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const sendEmailWithAttachment = async ({
  subject,
  html,
  text,
  attachments = [],
  to = MAIL_TO,
  from = MAIL_FROM,
}) => {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!from) {
    throw new Error("MAIL_FROM is not configured.");
  }

  if (!to) {
    throw new Error("MAIL_TO is not configured.");
  }

  const normalizedAttachments = attachments
    .filter((attachment) => attachment && attachment.content)
    .map((attachment) => ({
      filename: attachment.filename,
      content: Buffer.isBuffer(attachment.content)
        ? attachment.content.toString("base64")
        : attachment.content,
    }));

  return resend.emails.send({
    from,
    to: Array.isArray(to) ? to : String(to).split(",").map((item) => item.trim()).filter(Boolean),
    subject,
    html,
    text,
    attachments: normalizedAttachments,
  });
};

module.exports = {
  sendEmailWithAttachment,
};
