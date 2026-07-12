import "server-only";
import nodemailer from "nodemailer";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const fromEmail = process.env.SMTP_FROM_EMAIL;
  const fromName = process.env.SMTP_FROM_NAME || "TyphoidWatch Rwanda";
  if (
    !host ||
    !Number.isInteger(port) ||
    port <= 0 ||
    !user ||
    !password ||
    !fromEmail
  )
    throw new Error("SMTP configuration is incomplete.");
  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass: password },
    from: { name: fromName, address: fromEmail },
  };
}

export async function sendEmail(message: EmailMessage) {
  const config = smtpConfig();
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
    const result = await transporter.sendMail({
      from: config.from,
      ...message,
    });
    return { delivered: true, messageId: result.messageId };
  } catch (error) {
    console.error("SMTP delivery failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown SMTP failure",
    });
    return { delivered: false, messageId: null };
  }
}

export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
}) {
  return sendEmail({
    to: input.to,
    subject: "Reset your TyphoidWatch password",
    text: `Use this link to reset your password. It expires in 20 minutes: ${input.resetUrl}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px"><h2>Reset your TyphoidWatch password</h2><p>This secure link expires in 20 minutes.</p><p><a href="${input.resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this message.</p></div>`,
  });
}
