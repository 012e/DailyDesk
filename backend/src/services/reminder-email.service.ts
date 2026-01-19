import nodemailer from "nodemailer";

type ReminderType = "due_soon" | "overdue";

export type ReminderEmailPayload = {
  to: string;
  recipientName: string;
  cardName: string;
  dueAt: Date;
  reminderMinutes?: number | null;
  reminderType: ReminderType;
  timeZone?: string | null;
};

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure =
    process.env.SMTP_SECURE === "true" || (port === 465 && process.env.SMTP_SECURE !== "false");

  if (!host) {
    throw new Error("SMTP_HOST is not configured");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  return transporter;
}

function formatDueAt(dueAt: Date, timeZone?: string | null) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: timeZone || undefined,
    }).format(dueAt);
  } catch {
    return dueAt.toISOString();
  }
}

function buildSubject(payload: ReminderEmailPayload) {
  if (payload.reminderType === "overdue") {
    return `[Overdue] "${payload.cardName}" is past due`;
  }
  return `[Reminder] "${payload.cardName}" is due soon`;
}

function buildHtml(payload: ReminderEmailPayload) {
  const dueText = formatDueAt(payload.dueAt, payload.timeZone);
  const greetingName = payload.recipientName || "there";
  const reminderLine =
    payload.reminderType === "overdue"
      ? "This card is overdue."
      : `This card is due in ${payload.reminderMinutes ?? "a few"} minutes.`;

  return `
    <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">Hello ${greetingName},</h2>
      <p style="margin: 0 0 12px;">${reminderLine}</p>
      <p style="margin: 0 0 12px;"><strong>Card:</strong> ${payload.cardName}</p>
      <p style="margin: 0 0 12px;"><strong>Due:</strong> ${dueText}</p>
      <p style="margin: 0;">DailyDesk Reminder</p>
    </div>
  `;
}

export async function sendReminderEmail(payload: ReminderEmailPayload) {
  const from = process.env.FROM_EMAIL;
  if (!from) {
    throw new Error("FROM_EMAIL is not configured");
  }

  const transport = getTransporter();
  const subject = buildSubject(payload);
  const html = buildHtml(payload);

  const info = await transport.sendMail({
    from,
    to: payload.to,
    subject,
    html,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    console.log(`📧 Preview email: ${preview}`);
  }
}
