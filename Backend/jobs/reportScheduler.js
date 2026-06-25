const cron = require("node-cron");
const ManufacturingEntry = require("../model/ManufacturingEntry");
const DispatchEntry = require("../model/DispatchEntry");
const ReportLog = require("../model/ReportLog");
const { sendEmailWithAttachment } = require("../utils/resendMailer");
const {
  generateManufacturingShiftPdf,
  generateDispatchDailyPdf,
} = require("../utils/pdfGenerator");
const { buildManufacturingReportHtml } = require("../utils/buildManufacturingReportHtml")
const { buildDispatchReportHtml } = require("../utils/buildDispatchReportHtml")


const TIMEZONE = "Asia/Kolkata";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const pad = (value) => String(value).padStart(2, "0");

const getIstDateKey = (date = new Date()) => {
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  return `${istDate.getUTCFullYear()}-${pad(istDate.getUTCMonth() + 1)}-${pad(istDate.getUTCDate())}`;
};

const shiftDateKey = (dateKey, daysToAdd = 0) => {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + daysToAdd));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

const createIstDateTime = (dateKey, hours, minutes = 0, seconds = 0, milliseconds = 0) => {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds, milliseconds) - IST_OFFSET_MS);
};

const getManufacturingFirstShiftRange = () => {
  const reportDate = getIstDateKey();
  return {
    reportDate,
    shiftName: "First Shift",
    start: createIstDateTime(reportDate, 9, 0, 0, 0),
    end: createIstDateTime(reportDate, 18, 59, 59, 999)
  };
};

const getManufacturingSecondShiftRange = () => {
  const currentDate = getIstDateKey();
  const previousDate = shiftDateKey(currentDate, -1);

  return {
    reportDate: previousDate,
    shiftName: "Second Shift",
    start: createIstDateTime(previousDate, 19, 0, 0, 0),
    end: createIstDateTime(currentDate, 5, 0, 0, 0),
  };
};

const getDispatchDailyRange = () => {
  const reportDate = getIstDateKey();
  return {
    reportDate,
    shiftName: "",
    start: createIstDateTime(reportDate, 0, 0, 0, 0),
    end: createIstDateTime(reportDate, 23, 59, 59, 999),
  };
};

const wasReportAlreadySent = async ({ reportType, reportDate, shiftName = "" }) =>
  ReportLog.findOne({ reportType, reportDate, shiftName });

const markReportSent = async ({ reportType, reportDate, shiftName = "" }) => {
  await ReportLog.create({
    reportType,
    reportDate,
    shiftName,
    sentAt: new Date(),
  });
};

const sendManufacturingShiftReport = async ({ reportDate, shiftName, start, end }) => {
  console.log(`[ReportScheduler] Manufacturing ${shiftName} query range:`, {
    reportDate,
    start: start.toISOString(),
    end: end.toISOString(),
  });

  const existingLog = await wasReportAlreadySent({
    reportType: "manufacturing",
    reportDate,
    shiftName,
  });

  if (existingLog) {
    console.log(`[ReportScheduler] Manufacturing ${shiftName} already sent for ${reportDate}.`);
    return;
  }

  const entries = await ManufacturingEntry.find({
    createdAt: {
      $gte: start,
      $lt: end,
    },
  }).sort({ createdAt: 1 });

  console.log(`[ReportScheduler] Manufacturing ${shiftName} total entries found:`, entries.length);

  if (entries.length === 0) {
    console.log(`[ReportScheduler] No entries found for ${shiftName} on ${reportDate}. Skipping email.`);
    return;
  }

  const reportHtml = buildManufacturingReportHtml(
    entries,
    `Manufacturing Report - ${shiftName} - ${reportDate}`
  );

  await sendEmailWithAttachment({
    subject: `Manufacturing Report - ${shiftName} - ${reportDate}`,
    html: reportHtml,
    attachments: [],
  });

  await markReportSent({
    reportType: "manufacturing",
    reportDate,
    shiftName,
  });

  console.log(`[ReportScheduler] Manufacturing ${shiftName} email sent successfully.`);
};

const sendDispatchDailyReport = async ({ reportDate, start, end }) => {
  console.log("[ReportScheduler] Dispatch daily query range:", {
    reportDate,
    start: start.toISOString(),
    end: end.toISOString(),
  });

  const existingLog = await wasReportAlreadySent({
    reportType: "dispatch",
    reportDate,
    shiftName: "",
  });

  if (existingLog) {
    console.log(`[ReportScheduler] Dispatch daily report already sent for ${reportDate}.`);
    return;
  }

  const entries = await DispatchEntry.find({
    $or: [
      {
        createdAt: {
          $gte: start,
          $lte: end,
        },
      },
      {
        date: reportDate,
      },
    ],
  }).sort({ createdAt: 1 });

  console.log("[ReportScheduler] Dispatch daily total entries found:", entries.length);

  if (entries.length === 0) {
    return;
  }

  const reportHtml = buildDispatchReportHtml(
    entries,
    `Dispatch Daily Report - ${reportDate}`
  );

  await sendEmailWithAttachment({
    subject: `Dispatch Daily Report - ${reportDate}`,
    html: reportHtml,
    attachments: [],
  });

  await markReportSent({
    reportType: "dispatch",
    reportDate,
    shiftName: "",
  });

  console.log("[ReportScheduler] Dispatch daily email sent successfully.");
};

const runScheduledJob = async (jobName, callback) => {
  try {
    await callback();
  } catch (error) {
    console.error(`[ReportScheduler] ${jobName} failed:`, error.message);
  }
};

if (!global.__plantStockReportSchedulerStarted) {
  global.__plantStockReportSchedulerStarted = true;

  cron.schedule(
    "0 19 * * *",
    () => runScheduledJob("Manufacturing First Shift Report", async () => {
      await sendManufacturingShiftReport(getManufacturingFirstShiftRange());
    }),
    { timezone: TIMEZONE },
  );

  cron.schedule(
    "0 5 * * *",
    () => runScheduledJob("Manufacturing Second Shift Report", async () => {
      await sendManufacturingShiftReport(getManufacturingSecondShiftRange());
    }),
    { timezone: TIMEZONE },
  );

  cron.schedule(
    "0 20 * * *",
    () => runScheduledJob("Dispatch Daily Report", async () => {
      await sendDispatchDailyReport(getDispatchDailyRange());
    }),
    { timezone: TIMEZONE },
  );

  console.log("[ReportScheduler] Scheduled report jobs started.");
} else {
  console.warn("[ReportScheduler] WARNING: Scheduler already started, skipping re-registration.");
}

module.exports = {};
